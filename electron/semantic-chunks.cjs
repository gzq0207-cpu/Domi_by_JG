// Chunk-level semantic storage and retrieval on top of the shared SQLite
// database. Embeddings are stored as float32 BLOBs — the exact format sqlite-vec
// uses — so the brute-force scan below can be swapped for a vec0 virtual table
// later without a data migration.

const crypto = require("node:crypto");

const CHUNK_TARGET_CHARS = 480;
const CHUNK_MAX_CHARS = 640;
const CHUNK_OVERLAP_CHARS = 80;
const SEMANTIC_SCAN_BATCH = 1024;
// Beyond this many chunks the brute-force scan degrades (and would want an
// ANN index); results are still returned but flagged.
const BRUTE_FORCE_CHUNK_LIMIT = 200_000;

function chunkContent(content) {
  const text = String(content || "");
  if (!text.trim()) return [];
  const chunks = [];
  const { documentHeadings, safeBoundary } = require("./document-reader.cjs");
  const boundaries = [...new Set([0, ...documentHeadings(text).map((heading) => heading.offset), text.length])];
  const lineStarts = [0];
  for (const match of text.matchAll(/\n/g)) lineStarts.push(match.index + 1);
  const lineAt = (offset) => {
    let low = 0;
    let high = lineStarts.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (lineStarts[middle] <= offset) low = middle + 1;
      else high = middle;
    }
    return Math.max(1, low);
  };
  for (let section = 0; section < boundaries.length - 1; section += 1) {
    let start = boundaries[section];
    const sectionEnd = boundaries[section + 1];
    while (start < sectionEnd) {
      let end = safeBoundary(text, Math.min(sectionEnd, start + CHUNK_TARGET_CHARS));
      if (end < sectionEnd) {
        const newline = text.lastIndexOf("\n", Math.min(end, start + CHUNK_TARGET_CHARS));
        if (newline > start + CHUNK_TARGET_CHARS / 2) end = newline + 1;
      }
      const body = text.slice(start, end);
      if (body.trim()) chunks.push({ text: body, startLine: lineAt(start), endLine: lineAt(Math.max(start, end - 1)), startOffset: start, endOffset: end });
      if (end === sectionEnd) break;
      // Character overlap handles an arbitrarily long single line without
      // dropping its tail or recycling the entire oversized line.
      start = Math.max(start + 1, safeBoundary(text, end - CHUNK_OVERLAP_CHARS));
    }
  }
  return chunks.map((chunk, index) => ({ ...chunk, chunkIndex: index }));
}

function contentHash(content) {
  return crypto.createHash("sha256").update(String(content || "")).digest("hex");
}

function createSemanticSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS semantic_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      start_line INTEGER NOT NULL,
      end_line INTEGER NOT NULL,
      start_offset INTEGER NOT NULL DEFAULT 0,
      end_offset INTEGER NOT NULL DEFAULT 0,
      text TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      embedding BLOB,
      embedded_at INTEGER,
      UNIQUE(path, chunk_index)
    );
    CREATE INDEX IF NOT EXISTS semantic_chunks_pending
      ON semantic_chunks(embedding IS NULL, id);
  `);
  const columns = new Set(database.prepare("PRAGMA table_info(semantic_chunks)").all().map((column) => column.name));
  for (const column of ["start_offset", "end_offset"]) {
    if (!columns.has(column)) database.exec(`ALTER TABLE semantic_chunks ADD COLUMN ${column} INTEGER NOT NULL DEFAULT 0`);
  }
}

// Replaces the chunks of one document. Chunks are inserted without embeddings;
// the worker's embedding pump fills them in the background.
function replaceSemanticChunks(database, { path, relativePath, content }) {
  const hash = contentHash(`chunk-v2\n${content}`);
  const existing = database.prepare(`
    SELECT content_hash FROM semantic_chunks WHERE path = ? LIMIT 1
  `).get(path);
  if (existing && existing.content_hash === hash) return false;
  const chunks = chunkContent(content);
  const ownsTransaction = !database.isTransaction;
  if (ownsTransaction) database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("DELETE FROM semantic_chunks WHERE path = ?").run(path);
    const insert = database.prepare(`
      INSERT INTO semantic_chunks(
        path, relative_path, chunk_index, start_line, end_line, start_offset, end_offset, text, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const chunk of chunks) {
      insert.run(path, relativePath, chunk.chunkIndex, chunk.startLine, chunk.endLine, chunk.startOffset, chunk.endOffset, chunk.text, hash);
    }
    if (ownsTransaction) database.exec("COMMIT");
  } catch (error) {
    if (ownsTransaction) database.exec("ROLLBACK");
    throw error;
  }
  return true;
}

function removeSemanticChunks(database, path) {
  database.prepare("DELETE FROM semantic_chunks WHERE path = ?").run(path);
}

function countPendingEmbeddings(database) {
  return Number(
    database.prepare("SELECT COUNT(*) AS total FROM semantic_chunks WHERE embedding IS NULL").get()?.total || 0
  );
}

function loadPendingChunkBatch(database, limit) {
  return database.prepare(`
    SELECT id, text FROM semantic_chunks WHERE embedding IS NULL ORDER BY id LIMIT ?
  `).all(limit);
}

function storeEmbeddings(database, items) {
  if (!items.length) return;
  database.exec("BEGIN IMMEDIATE");
  try {
    const update = database.prepare(`
      UPDATE semantic_chunks SET embedding = ?, embedded_at = ? WHERE id = ?
    `);
    const now = Date.now();
    for (const item of items) {
      update.run(Buffer.from(new Float32Array(item.embedding).buffer), now, item.id);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function cosineTopK(queryVector, candidate) {
  let dot = 0;
  const length = Math.min(queryVector.length, candidate.length);
  for (let index = 0; index < length; index += 1) {
    dot += queryVector[index] * candidate[index];
  }
  return dot;
}

// Streams all embedded chunks in batches and keeps a running top-K. Vectors
// stay out of long-term memory; each batch is released after scoring.
function semanticScan(database, queryVector, limit, onBatch = null, rootPath = '') {
  const top = [];
  const from = rootPath ? 'semantic_chunks c JOIN search_documents d ON d.path=c.path' : 'semantic_chunks c';
  const rootCondition = rootPath ? ' AND d.root_path = ?' : '';
  const rootParams = rootPath ? [rootPath] : [];
  const totalChunks = Number(
    database.prepare(`SELECT COUNT(*) AS total FROM ${from} WHERE c.embedding IS NOT NULL${rootCondition}`)
      .get(...rootParams)?.total || 0
  );
  let scanned = 0;
  let lastId = 0;
  const select = database.prepare(`
    SELECT c.id, c.path, c.relative_path, c.start_line, c.end_line, c.start_offset, c.end_offset, c.embedding
    FROM ${from}
    WHERE c.embedding IS NOT NULL AND c.id > ?${rootCondition}
    ORDER BY c.id
    LIMIT ?
  `);
  for (;;) {
    const rows = select.all(lastId, ...rootParams, SEMANTIC_SCAN_BATCH);
    if (!rows.length) break;
    for (const row of rows) {
      lastId = Math.max(lastId, Number(row.id));
      scanned += 1;
      const vector = new Float32Array(
        row.embedding.buffer,
        row.embedding.byteOffset,
        row.embedding.byteLength / 4
      );
      const score = cosineTopK(queryVector, vector);
      if (top.length < limit || score > top[top.length - 1].score) {
        top.push({
          id: Number(row.id),
          path: row.path,
          relativePath: row.relative_path,
          startLine: Number(row.start_line),
          endLine: Number(row.end_line),
          offset: Number(row.start_offset),
          endOffset: Number(row.end_offset),
          score
        });
        top.sort((left, right) => right.score - left.score);
        if (top.length > limit) top.length = limit;
      }
    }
    if (onBatch) onBatch(scanned, totalChunks);
    if (rows.length < SEMANTIC_SCAN_BATCH) break;
  }
  return {
    degraded: totalChunks > BRUTE_FORCE_CHUNK_LIMIT,
    scanned,
    totalChunks,
    results: top
  };
}

function fetchChunkTexts(database, ids) {
  if (!ids.length) return new Map();
  const placeholders = ids.map(() => "?").join(",");
  const rows = database.prepare(`
    SELECT id, text FROM semantic_chunks WHERE id IN (${placeholders})
  `).all(...ids);
  return new Map(rows.map((row) => [Number(row.id), row.text]));
}

module.exports = {
  BRUTE_FORCE_CHUNK_LIMIT,
  chunkContent,
  contentHash,
  countPendingEmbeddings,
  createSemanticSchema,
  fetchChunkTexts,
  loadPendingChunkBatch,
  removeSemanticChunks,
  replaceSemanticChunks,
  semanticScan,
  storeEmbeddings
};
