const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { createSemanticSchema, replaceSemanticChunks } = require("./semantic-chunks.cjs");

const SEARCHABLE_EXTENSIONS = new Set([".md", ".markdown", ".pdf", ".docx", ".doc"]);
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const MAX_MARKDOWN_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_PDF_TEXT_CHARS = 200_000;
const TRANSCRIPT_PATTERN = /(?:PLAUD\s*)?文字稿|transcript/i;
const SCHEMA_VERSION = "6";
const BM25_WEIGHTS = "0.0, 4.0, 2.0, 3.0";
// Corpus budget (in content characters) for substring scans on queries that
// cannot use the trigram FTS index. Exported so tests can tighten it.
const SEARCH_LIMITS = {
  shortQueryContentChars: 32 * 1024 * 1024
};

function pathInsideRoot(rootPath, candidatePath) {
  const root = path.resolve(rootPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function createSearchSchema(database) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS search_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS search_documents (
      path TEXT PRIMARY KEY,
      root_path TEXT NOT NULL,
      name TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('markdown', 'pdf', 'word')),
      size INTEGER NOT NULL,
      mtime_ms REAL NOT NULL,
      content TEXT NOT NULL,
      content_chars INTEGER NOT NULL DEFAULT 0,
      content_status TEXT NOT NULL DEFAULT 'complete',
      is_transcript INTEGER NOT NULL DEFAULT 0,
      scan_generation TEXT NOT NULL,
      indexed_at INTEGER NOT NULL
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS search_documents_fts USING fts5(
      path UNINDEXED,
      name,
      relative_path,
      content,
      tokenize='trigram'
    );
  `);
  createSemanticSchema(database);
}

function initializeDocumentSearchIndex(database) {
  createSearchSchema(database);
  const schemaRow = database
    .prepare("SELECT value FROM search_meta WHERE key = 'content_schema'")
    .get();
  if (schemaRow?.value === SCHEMA_VERSION) return;
  // Older caches were built with different transcript/PDF/ranking semantics;
  // they cannot be compared with the new index, so rebuild from scratch.
  database.exec(`
    DROP TABLE IF EXISTS search_documents_fts;
    DROP TABLE IF EXISTS search_documents;
    DELETE FROM semantic_chunks;
  `);
  createSearchSchema(database);
  database.prepare(`
    INSERT INTO search_meta(key, value) VALUES ('content_schema', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(SCHEMA_VERSION);
}

function openDocumentSearchIndex(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  let database;
  try {
    database = new DatabaseSync(databasePath);
    initializeDocumentSearchIndex(database);
    return database;
  } catch (error) {
    try {
      database?.close();
    } catch {
      // The cache may be too damaged to close cleanly.
    }
    for (const suffix of ["", "-wal", "-shm"]) {
      fs.rmSync(`${databasePath}${suffix}`, { force: true });
    }
    database = new DatabaseSync(databasePath);
    initializeDocumentSearchIndex(database);
    return database;
  }
}

function currentRoot(database) {
  return database.prepare("SELECT value FROM search_meta WHERE key = 'root_path'").get()?.value || "";
}

function configureRoot(database, rootPath) {
  const resolvedRoot = path.resolve(rootPath);
  if (currentRoot(database) === resolvedRoot) return resolvedRoot;
  database.exec("BEGIN IMMEDIATE");
  try {
    database.exec(
      "DELETE FROM search_documents_fts; DELETE FROM semantic_chunks; DELETE FROM search_documents;"
    );
    database.prepare(`
      INSERT INTO search_meta(key, value) VALUES ('root_path', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(resolvedRoot);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return resolvedRoot;
}

function shouldIndexFile(name) {
  return SEARCHABLE_EXTENSIONS.has(path.extname(name).toLocaleLowerCase("en-US"));
}

// Transcript detection is intentionally filename-scoped: a folder called
// "文字稿" must not turn every document inside it into a transcript.
function isTranscript(relativePath) {
  return TRANSCRIPT_PATTERN.test(path.basename(relativePath));
}

function isCloudPlaceholder(stat) {
  // Windows 的 libuv 不填充 stat.blocks（恒为 0），无法据此检测
  // 云盘占位文件；按实际文件处理。
  if (process.platform === "win32") return false;
  return stat.size > 0 && Number.isFinite(stat.blocks) && stat.blocks === 0;
}

function readMarkdownContent(filePath, stat, { skipContent = false } = {}) {
  // Cloud-guarded roots skip body reads entirely: reading a placeholder would
  // trigger an on-demand download of the whole file on Windows.
  if (skipContent) return "";
  if (stat.size > MAX_MARKDOWN_BYTES || isCloudPlaceholder(stat)) return "";
  return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").replace(/\u0000/g, "");
}

let unpdfModulePromise = null;

function loadUnpdf() {
  if (!unpdfModulePromise) {
    unpdfModulePromise = import("unpdf").catch((error) => {
      unpdfModulePromise = null;
      throw error;
    });
  }
  return unpdfModulePromise;
}

// 对无可提取文字的页面执行 OCR（有页数上限，失败降级为空）。返回更新后的
// 页文本与成功/失败页号，供调用方如实披露；不验证识别质量。
async function applyOcrToEmptyPages(pageTexts, ocrPage, filePath, maxPages = 40) {
  const pages = (Array.isArray(pageTexts) ? pageTexts : [String(pageTexts || "")]).map((pageText) => String(pageText || ""));
  const applied = [];
  const failed = [];
  if (typeof ocrPage !== "function") return { pages, applied, failed };
  const emptyPageNumbers = pages.map((pageText, index) => pageText.trim() ? null : index + 1).filter(Boolean);
  for (const pageNumber of emptyPageNumbers.slice(0, maxPages)) {
    try {
      const ocrText = String(await ocrPage(filePath, pageNumber) || "").trim();
      if (ocrText) { pages[pageNumber - 1] = ocrText; applied.push(pageNumber); }
      else failed.push(pageNumber);
    } catch { failed.push(pageNumber); }
  }
  return { pages, applied, failed };
}

async function extractPdfText(filePath, stat, { skipContent = false, ocrPage = null } = {}) {
  if (skipContent) return "";
  if (!Number.isFinite(stat.size) || stat.size === 0 || stat.size > MAX_PDF_BYTES) return "";
  if (isCloudPlaceholder(stat)) return "";
  try {
    const { extractText, getDocumentProxy } = await loadUnpdf();
    const bytes = new Uint8Array(await fs.promises.readFile(filePath));
    const proxy = await getDocumentProxy(bytes);
    const { text } = await extractText(proxy, { mergePages: true });
    const merged = String(text || "");
    // 只有常规提取为空且配置了 OCR 时才逐页重提 + OCR；其余情况保持原行为。
    if (merged.trim() || typeof ocrPage !== "function") {
      return merged.replace(/\u0000/g, "").slice(0, MAX_PDF_TEXT_CHARS);
    }
    const pageResult = await extractText(proxy, { mergePages: false });
    const { pages } = await applyOcrToEmptyPages(pageResult.text, ocrPage, filePath);
    return pages.join("\n\n").replace(/\u0000/g, "").slice(0, MAX_PDF_TEXT_CHARS);
  } catch {
    // Unreadable or encrypted PDFs stay name-only; extraction must never
    // invalidate the rest of the index.
    return "";
  }
}

async function upsertIndexedDocument(database, rootPath, filePath, stat, generation, options = {}) {
  const isCurrent = () => currentRoot(database) === path.resolve(rootPath)
    && (!options.isCurrent || options.isCurrent());
  if (!isCurrent()) return false;
  const resolvedPath = path.resolve(filePath);
  if (!pathInsideRoot(rootPath, resolvedPath)) return false;
  const relativePath = path.relative(rootPath, resolvedPath);
  const extension = path.extname(resolvedPath).toLocaleLowerCase("en-US");
  const kind = extension === ".pdf" ? "pdf" : /\.docx?$/.test(extension) ? 'word' : "markdown";
  const skipContent = options.skipContent === true;
  const existing = database.prepare(`
    SELECT size, mtime_ms FROM search_documents WHERE path = ?
  `).get(resolvedPath);
  if (existing && existing.size === stat.size && existing.mtime_ms === stat.mtimeMs) {
    database.prepare(`
      UPDATE search_documents SET scan_generation = ? WHERE path = ?
    `).run(generation, resolvedPath);
    return false;
  }
  const transcript = isTranscript(relativePath);
  let content = "",wordIncomplete=false;
  if (kind === "markdown") {
    content = readMarkdownContent(resolvedPath, stat, { skipContent });
  } else if(kind==='word') {
    if(!skipContent && stat.size<=64*1024*1024)try{const word=await require('./word-document.cjs').readWordFile(resolvedPath,{includeHtml:false});content=word.text.slice(0,MAX_PDF_TEXT_CHARS);wordIncomplete=word.incomplete;}catch{/* Filename search remains available when Word conversion is unavailable. */}
  } else {
    content = await extractPdfText(resolvedPath, stat, { skipContent, ocrPage: options.ocrPage || null });
  }
  const contentStatus = skipContent ? "blocked"
    : !content && stat.size > 0 ? "unreadable"
    : wordIncomplete || (kind === "pdf" || kind === 'word') && content.length >= MAX_PDF_TEXT_CHARS ? "truncated" : "complete";
  // PDF/Word extraction can await while the worker adopts a different root.
  // Check again at the commit boundary, including A -> B -> A switches.
  if (!isCurrent()) return false;
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("DELETE FROM search_documents_fts WHERE path = ?").run(resolvedPath);
    database.prepare(`
      INSERT INTO search_documents(
        path, root_path, name, relative_path, kind, size, mtime_ms,
        content, content_chars, content_status, is_transcript, scan_generation, indexed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        root_path = excluded.root_path,
        name = excluded.name,
        relative_path = excluded.relative_path,
        kind = excluded.kind,
        size = excluded.size,
        mtime_ms = excluded.mtime_ms,
        content = excluded.content,
        content_chars = excluded.content_chars,
        content_status = excluded.content_status,
        is_transcript = excluded.is_transcript,
        scan_generation = excluded.scan_generation,
        indexed_at = excluded.indexed_at
    `).run(
      resolvedPath,
      rootPath,
      path.basename(resolvedPath),
      relativePath,
      kind,
      stat.size,
      stat.mtimeMs,
      content,
      [...content].length,
      contentStatus,
      transcript ? 1 : 0,
      generation,
      Date.now()
    );
    database.prepare(`
      INSERT INTO search_documents_fts(path, name, relative_path, content)
      VALUES (?, ?, ?, ?)
    `).run(resolvedPath, path.basename(resolvedPath), relativePath, content);
    replaceSemanticChunks(database, { path: resolvedPath, relativePath, content });
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return true;
}

function removeIndexedDocument(database, filePath) {
  database.exec('BEGIN IMMEDIATE');
  try {
    for (const table of ['search_documents_fts', 'semantic_chunks', 'search_documents']) {
      database.prepare(`DELETE FROM ${table} WHERE path=?`).run(path.resolve(filePath));
    }
    database.exec('COMMIT');
  } catch (error) { database.exec('ROLLBACK'); throw error; }
}

function removeStaleDocuments(database, generation) {
  const stale = database.prepare(`
    SELECT path FROM search_documents WHERE scan_generation <> ?
  `).all(generation);
  if (!stale.length) return 0;
  database.exec("BEGIN IMMEDIATE");
  try {
    const deleteFts = database.prepare("DELETE FROM search_documents_fts WHERE path = ?");
    const deleteDocument = database.prepare("DELETE FROM search_documents WHERE path = ?");
    const deleteChunks = database.prepare("DELETE FROM semantic_chunks WHERE path = ?");
    for (const row of stale) {
      deleteFts.run(row.path);
      deleteDocument.run(row.path);
      deleteChunks.run(row.path);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return stale.length;
}

function compactWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function splitQueryTokens(query) {
  const seen = new Set();
  const tokens = [];
  for (const raw of String(query || "").split(/[\s,，、;；]+/)) {
    const token = raw.replace(/^["“”']+|["“”']+$/g, "").trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
  }
  return tokens;
}

function codePointLength(value) {
  return [...String(value || "")].length;
}

function ftsPhrase(token) {
  return `"${token.replace(/"/g, '""')}"`;
}

function containsAsciiLetters(value) {
  return /[a-z]/i.test(value);
}

// Short tokens (1–2 characters) cannot produce trigram tokens, so they are
// matched with substring scans. CJK substrings skip case folding entirely.
function shortTokenCondition(token, { includeContent }) {
  const columns = includeContent
    ? ["d.content", "d.name", "d.relative_path"]
    : ["d.name", "d.relative_path"];
  const fold = containsAsciiLetters(token);
  return `(${columns
    .map((column) => (fold ? `instr(lower(${column}), lower(?)) > 0` : `instr(${column}, ?) > 0`))
    .join(" OR ")})`;
}

function shortTokenParamCount(token, { includeContent }) {
  return (includeContent ? 3 : 2);
}

function resultSnippet(row, query, tokens) {
  const content = String(row.content || "");
  let lowerContent = null;
  let contentIndex = -1;
  let matched = "";
  for (const candidate of [query, ...tokens]) {
    if (!candidate) continue;
    if (containsAsciiLetters(candidate)) {
      lowerContent ??= content.toLocaleLowerCase("zh-CN");
      const index = lowerContent.indexOf(candidate.toLocaleLowerCase("zh-CN"));
      if (index >= 0) {
        contentIndex = index;
        matched = candidate;
        break;
      }
    } else {
      const index = content.indexOf(candidate);
      if (index >= 0) {
        contentIndex = index;
        matched = candidate;
        break;
      }
    }
  }
  if (contentIndex < 0) {
    return {
      snippet: row.kind === "pdf" && !content ? "PDF 文件名匹配" : compactWhitespace(row.relative_path),
      line: undefined
    };
  }
  const before = content.slice(0, contentIndex);
  const line = before.split(/\r?\n/).length;
  const start = Math.max(0, contentIndex - 240);
  const end = Math.min(content.length, contentIndex + matched.length + 600);
  return {
    snippet: `${start > 0 ? "…" : ""}${compactWhitespace(content.slice(start, end))}${end < content.length ? "…" : ""}`,
    line,
    offset: contentIndex
  };
}

function searchIndexedDocuments(database, request = {}) {
  const query = String(request.query || "").trim();
  if (!query) return { results: [], degraded: false };
  const limit = Math.max(1, Math.min(Number(request.limit) || 8, 60));
  const rootPath = request.rootPath ? path.resolve(request.rootPath) : currentRoot(database);
  // Transcripts are now indexed and returned by default (ranked below regular
  // documents). excludeTranscripts opts out; the legacy includeTranscripts
  // value is still honoured when callers explicitly passed false.
  const excludeTranscripts = request.excludeTranscripts === true
    || request.includeTranscripts === false;
  const tokens = splitQueryTokens(query);
  const longTokens = tokens.filter((token) => codePointLength(token) >= 3);
  const shortTokens = tokens.filter((token) => codePointLength(token) < 3);

  let includeContent = true;
  if (shortTokens.length) {
    const contentChars = Number(
      database
        .prepare("SELECT COALESCE(SUM(content_chars), 0) AS total FROM search_documents WHERE root_path = ?")
        .get(rootPath)?.total || 0
    );
    includeContent = contentChars <= SEARCH_LIMITS.shortQueryContentChars;
  }
  const degraded = shortTokens.length > 0 && !includeContent;
  const shortOptions = { includeContent };
  let rows;
  if (longTokens.length) {
    const conditions = ["search_documents_fts MATCH ?", 'd.root_path = ?'];
    const params = [longTokens.map(ftsPhrase).join(" AND "), rootPath];
    if (excludeTranscripts) conditions.push("d.is_transcript = 0");
    for (const token of shortTokens) {
      conditions.push(shortTokenCondition(token, shortOptions));
      for (let index = 0; index < shortTokenParamCount(token, shortOptions); index += 1) {
        params.push(token);
      }
    }
    params.push(limit);
    rows = database.prepare(`
      SELECT d.*,
        CASE WHEN d.is_transcript = 1
          THEN bm25(search_documents_fts, ${BM25_WEIGHTS}) * 0.5
          ELSE bm25(search_documents_fts, ${BM25_WEIGHTS})
        END AS rank
      FROM search_documents_fts
      JOIN search_documents d ON d.path = search_documents_fts.path
      WHERE ${conditions.join(" AND ")}
      ORDER BY rank ASC, d.mtime_ms DESC
      LIMIT ?
    `).all(...params);
  } else {
    const conditions = ['d.root_path = ?'];
    const params = [rootPath];
    if (excludeTranscripts) conditions.push("d.is_transcript = 0");
    const nameHitParts = [];
    const nameHitParams = [];
    for (const token of tokens) {
      conditions.push(shortTokenCondition(token, shortOptions));
      for (let index = 0; index < shortTokenParamCount(token, shortOptions); index += 1) {
        params.push(token);
      }
      nameHitParts.push(containsAsciiLetters(token)
        ? "instr(lower(d.name), lower(?)) > 0"
        : "instr(d.name, ?) > 0");
      nameHitParams.push(token);
    }
    params.push(...nameHitParams, limit);
    rows = database.prepare(`
      SELECT d.*, 0 AS rank
      FROM search_documents d
      WHERE ${conditions.join(" AND ")}
      ORDER BY CASE WHEN ${nameHitParts.join(" OR ")} THEN 0 ELSE 1 END, d.mtime_ms DESC
      LIMIT ?
    `).all(...params);
  }
  return {
    degraded,
    results: rows.map((row) => ({
      path: row.path,
      name: row.name,
      relativePath: row.relative_path,
      kind: row.kind,
      contentStatus: row.content_status,
      size: row.size,
      mtimeMs: row.mtime_ms,
      ...resultSnippet(row, query, tokens)
    }))
  };
}

module.exports = {
  MAX_MARKDOWN_BYTES,
  SEARCH_LIMITS,
  applyOcrToEmptyPages,
  configureRoot,
  openDocumentSearchIndex,
  pathInsideRoot,
  removeStaleDocuments,
  removeIndexedDocument,
  searchIndexedDocuments,
  shouldIndexFile,
  upsertIndexedDocument
};
