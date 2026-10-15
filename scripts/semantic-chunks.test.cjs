const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  chunkContent,
  contentHash,
  countPendingEmbeddings,
  fetchChunkTexts,
  loadPendingChunkBatch,
  removeSemanticChunks,
  replaceSemanticChunks,
  semanticScan,
  storeEmbeddings
} = require("../electron/semantic-chunks.cjs");
const {
  configureRoot,
  openDocumentSearchIndex,
  removeStaleDocuments,
  searchIndexedDocuments,
  upsertIndexedDocument
} = require("../electron/document-search-index.cjs");

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-semantic-chunks-"));
  const rootPath = path.join(directory, "library");
  fs.mkdirSync(path.join(rootPath, "3.项目库"), { recursive: true });
  return {
    directory,
    rootPath,
    databasePath: path.join(directory, "search.sqlite3"),
    close() {
      // Windows can transiently report EBUSY right after sqlite closes
      // (AV scans / handle release races) — retry briefly before failing.
      let lastError;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          fs.rmSync(directory, { recursive: true, force: true });
          return;
        } catch (error) {
          lastError = error;
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
        }
      }
      throw lastError;
    }
  };
}

test("chunkContent splits on headings and keeps bounded chunk sizes", () => {
  const content = [
    "# 项目概览",
    "本项目关注具身智能机器人的供应链格局。",
    "核心零部件包括谐波减速器与行星滚柱丝杠。",
    "# 竞争格局",
    "国内厂商在减速器环节的国产化率持续提升。",
    "海外龙头仍占据高端市场主要份额。"
  ].join("\n");
  const chunks = chunkContent(content);
  assert.ok(chunks.length >= 2, "headings should force at least two chunks");
  assert.match(chunks[0].text, /项目概览/);
  assert.match(chunks[1].text, /竞争格局/);
  for (const chunk of chunks) {
    assert.ok(chunk.text.length <= 640, "chunks must respect the max size");
    assert.ok(chunk.startLine >= 1);
    assert.ok(chunk.endLine >= chunk.startLine);
  }
  assert.deepEqual(chunks.map((chunk) => chunk.chunkIndex), chunks.map((_, index) => index));
});

test("chunkContent returns no chunks for empty or whitespace content", () => {
  assert.deepEqual(chunkContent(""), []);
  assert.deepEqual(chunkContent("   \n  \n"), []);
});

test("every character of long lines including the final claim is indexed with valid offsets", () => {
  const content = `# 章节\n${"长段落😀".repeat(2000)}尾部关键结论\n# 另一章\n另一段论据。`;
  const chunks = chunkContent(content);
  const covered = new Uint8Array(content.length);
  for (const chunk of chunks) {
    assert.equal(chunk.text, content.slice(chunk.startOffset, chunk.endOffset));
    assert.ok(chunk.text.length <= 640);
    assert.ok(!/[\uD800-\uDBFF]$/.test(chunk.text));
    covered.fill(1, chunk.startOffset, chunk.endOffset);
  }
  assert.ok(chunks.some((chunk) => chunk.text.includes("尾部关键结论")));
  assert.ok([...covered].every(Boolean), "all original characters must be covered");
});

test("chunkContent long sections produce overlapping chunks", () => {
  const paragraph = "国内人形机器人产业链在2026年进入量产爬坡阶段，减速器、丝杠与传感器环节的产能扩张显著。".repeat(12);
  const chunks = chunkContent(paragraph);
  assert.ok(chunks.length >= 2, "long content should be split");
  for (const chunk of chunks.slice(1)) {
    const previous = chunks[chunks.indexOf(chunk) - 1];
    if (!previous) continue;
    // The overlap tail must share words with the previous chunk body.
    assert.ok(
      previous.text.slice(-60).split(/[，。、\s]/).some((word) => word && chunk.text.includes(word)),
      "consecutive chunks should overlap"
    );
  }
});

test("contentHash is stable for identical content and differs otherwise", () => {
  assert.equal(contentHash("abc"), contentHash("abc"));
  assert.notEqual(contentHash("abc"), contentHash("abd"));
});

test("replaceSemanticChunks stores chunks and skips unchanged content", () => {
  const context = fixture();
  try {
    const database = openDocumentSearchIndex(context.databasePath);
    const filePath = path.join(context.rootPath, "3.项目库", "行业笔记.md");
    fs.writeFileSync(filePath, "# 标题\n第一段内容。\n第二段内容。");
    configureRoot(database, context.rootPath);
    const inserted = replaceSemanticChunks(database, {
      path: filePath,
      relativePath: "3.项目库/行业笔记.md",
      content: "# 标题\n第一段内容。\n第二段内容。"
    });
    assert.equal(inserted, true);
    assert.equal(countPendingEmbeddings(database), 1);
    const unchanged = replaceSemanticChunks(database, {
      path: filePath,
      relativePath: "3.项目库/行业笔记.md",
      content: "# 标题\n第一段内容。\n第二段内容。"
    });
    assert.equal(unchanged, false, "identical content must not re-chunk");
    const changed = replaceSemanticChunks(database, {
      path: filePath,
      relativePath: "3.项目库/行业笔记.md",
      content: "# 新标题\n完全不同的内容。"
    });
    assert.equal(changed, true);
    removeSemanticChunks(database, filePath);
    assert.equal(countPendingEmbeddings(database), 0);
    database.close();
  } finally {
    context.close();
  }
});

test("semanticScan ranks by cosine similarity and fetches chunk texts", () => {
  const context = fixture();
  try {
    const database = openDocumentSearchIndex(context.databasePath);
    const paths = [
      { path: path.join(context.rootPath, "a.md"), relativePath: "a.md", content: "机器人供应链内容。", vector: [1, 0, 0, 0] },
      { path: path.join(context.rootPath, "b.md"), relativePath: "b.md", content: "创新药出海内容。", vector: [0, 1, 0, 0] },
      { path: path.join(context.rootPath, "c.md"), relativePath: "c.md", content: "接近查询的内容。", vector: [0.9, 0.44, 0, 0] }
    ];
    for (const item of paths) {
      replaceSemanticChunks(database, {
        path: item.path,
        relativePath: item.relativePath,
        content: item.content
      });
    }
    const batch = loadPendingChunkBatch(database, 10);
    assert.equal(batch.length, 3);
    const idByPath = new Map();
    const rows = database.prepare("SELECT id, path FROM semantic_chunks").all();
    for (const row of rows) idByPath.set(row.path, row.id);
    storeEmbeddings(database, paths.map((item) => ({
      id: idByPath.get(item.path),
      embedding: Float32Array.from(item.vector)
    })));
    assert.equal(countPendingEmbeddings(database), 0);
    const query = Float32Array.from([1, 0, 0, 0]);
    const scan = semanticScan(database, query, 2);
    assert.equal(scan.degraded, false);
    assert.equal(scan.scanned, 3);
    assert.equal(scan.results.length, 2);
    assert.equal(scan.results[0].relativePath, "a.md");
    assert.equal(scan.results[1].relativePath, "c.md");
    const texts = fetchChunkTexts(database, scan.results.map((result) => result.id));
    assert.equal(texts.get(scan.results[0].id), "机器人供应链内容。");
    database.close();
  } finally {
    context.close();
  }
});

test("semanticScan degrades gracefully with no embeddings", () => {
  const context = fixture();
  try {
    const database = openDocumentSearchIndex(context.databasePath);
    const scan = semanticScan(database, Float32Array.from([1, 0, 0, 0]), 5);
    assert.equal(scan.scanned, 0);
    assert.deepEqual(scan.results, []);
    database.close();
  } finally {
    context.close();
  }
});

test("failed semantic chunk writes roll back the document and FTS rows", async () => {
  const context = fixture();
  let database;
  try {
    database = openDocumentSearchIndex(context.databasePath);
    configureRoot(database, context.rootPath);
    const filePath = path.join(context.rootPath, "3.项目库", "研究.md");
    fs.writeFileSync(filePath, "# 标题\n语义检索测试正文。");
    database.exec("CREATE TRIGGER reject_chunk BEFORE INSERT ON semantic_chunks BEGIN SELECT RAISE(ABORT, 'chunk failed'); END");
    await assert.rejects(upsertIndexedDocument(database, context.rootPath, filePath, fs.statSync(filePath), "gen-1"), /chunk failed/);
    assert.equal(database.prepare("SELECT COUNT(*) AS n FROM search_documents").get().n, 0);
    assert.equal(database.prepare("SELECT COUNT(*) AS n FROM search_documents_fts").get().n, 0);
  } finally {
    database?.close();
    context.close();
  }
});

test("document index lifecycle maintains semantic chunks", async () => {
  const context = fixture();
  let database = null;
  try {
    database = openDocumentSearchIndex(context.databasePath);
    configureRoot(database, context.rootPath);
    const filePath = path.join(context.rootPath, "3.项目库", "研究.md");
    fs.writeFileSync(filePath, "# 标题\n语义检索测试正文。");
    const generation = "gen-1";
    await upsertIndexedDocument(database, context.rootPath, filePath, fs.statSync(filePath), generation);
    assert.equal(countPendingEmbeddings(database), 1, "upsert should create pending chunks");
    // Stale removal after a re-index without the file must clear its chunks.
    const staleGeneration = "gen-2";
    removeStaleDocuments(database, staleGeneration);
    assert.equal(countPendingEmbeddings(database), 0);
    // FTS still usable after schema v3 migration.
    const results = searchIndexedDocuments(database, { query: "语义", limit: 5 });
    assert.ok(results && Array.isArray(results.results));
  } finally {
    try {
      database?.close();
    } catch {
      // already closed
    }
    context.close();
  }
});

test("old search caches are rebuilt so unchanged source files receive repaired chunks", async () => {
  const context = fixture();
  let database;
  try {
    database = openDocumentSearchIndex(context.databasePath);
    configureRoot(database, context.rootPath);
    const filePath = path.join(context.rootPath, "long.md");
    const content = `${"旧版长段落".repeat(600)}尾部重要结论`;
    fs.writeFileSync(filePath, content);
    await upsertIndexedDocument(database, context.rootPath, filePath, fs.statSync(filePath), "old");
    database.prepare("UPDATE search_meta SET value = '3' WHERE key = 'content_schema'").run();
    database.close();
    database = openDocumentSearchIndex(context.databasePath);
    assert.equal(database.prepare("SELECT COUNT(*) AS n FROM semantic_chunks").get().n, 0);
    configureRoot(database, context.rootPath);
    await upsertIndexedDocument(database, context.rootPath, filePath, fs.statSync(filePath), "new");
    assert.ok(database.prepare("SELECT text FROM semantic_chunks").all().some((chunk) => chunk.text.includes("尾部重要结论")));
    assert.equal(fs.readFileSync(filePath, "utf8"), content);
  } finally { database?.close(); context.close(); }
});
