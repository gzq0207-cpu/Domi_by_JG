const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const PDFDocument = require("pdfkit");
const {
  SEARCH_LIMITS,
  configureRoot,
  openDocumentSearchIndex,
  removeStaleDocuments,
  searchIndexedDocuments,
  shouldIndexFile,
  upsertIndexedDocument
} = require("../electron/document-search-index.cjs");
const { DocumentSearchService } = require("../electron/document-search-service.cjs");

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-document-search-"));
  const rootPath = path.join(directory, "library");
  fs.mkdirSync(path.join(rootPath, "3.项目库", "AI", "示例项目", "纪要"), { recursive: true });
  fs.mkdirSync(path.join(rootPath, "3.项目库", "AI", "示例项目", "原始材料"), { recursive: true });
  return {
    directory,
    rootPath,
    databasePath: path.join(directory, "search.sqlite3"),
    close() {
      fs.rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
    }
  };
}

async function indexFiles(database, rootPath, files, generation) {
  configureRoot(database, rootPath);
  for (const filePath of files) {
    await upsertIndexedDocument(database, rootPath, filePath, fs.statSync(filePath), generation);
  }
  removeStaleDocuments(database, generation);
}

function makePdf(lines) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    for (const line of lines) {
      doc.text(line);
    }
    doc.end();
  });
}

test("short CJK queries match document bodies with snippets and line numbers", async () => {
  const sample = fixture();
  const notePath = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要", "行业交流.md");
  fs.writeFileSync(notePath, "# 行业交流\n\n会上提到 ExampleCo 正在探索新型模型训练方法，并讨论了融资节奏。\n");
  const database = openDocumentSearchIndex(sample.databasePath);
  try {
    await indexFiles(database, sample.rootPath, [notePath], "one");
    const loanResult = searchIndexedDocuments(database, { query: "融资", limit: 10 });
    assert.equal(loanResult.degraded, false);
    assert.equal(loanResult.results.length, 1);
    assert.equal(loanResult.results[0].path, notePath);
    assert.equal(loanResult.results[0].line, 3);
    assert.ok(loanResult.results[0].snippet.includes("融资"));
    const modelResult = searchIndexedDocuments(database, { query: "模型", limit: 10 });
    assert.equal(modelResult.results.length, 1);
    assert.ok(modelResult.results[0].snippet.includes("模型"));
  } finally {
    database.close();
    sample.close();
  }
});

test("multi-keyword queries require every token and mix FTS with substring filters", async () => {
  const sample = fixture();
  const minutesPath = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要", "融资纪要.md");
  const productPath = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要", "产品纪要.md");
  fs.writeFileSync(minutesPath, "美团完成新一轮融资，金额尚未披露。\n");
  fs.writeFileSync(productPath, "ExampleCo 发布了新产品。\n");
  const database = openDocumentSearchIndex(sample.databasePath);
  try {
    await indexFiles(database, sample.rootPath, [minutesPath, productPath], "one");
    const both = searchIndexedDocuments(database, { query: "美团 融资", limit: 10 });
    assert.equal(both.results.length, 1);
    assert.equal(both.results[0].path, minutesPath);
    // A long FTS token plus a short substring token must still require both.
    fs.writeFileSync(minutesPath, "美团和 ExampleCo 一起完成了融资。\n");
    await indexFiles(database, sample.rootPath, [minutesPath, productPath], "two");
    const mixed = searchIndexedDocuments(database, { query: "ExampleCo 融资", limit: 10 });
    assert.equal(mixed.results.length, 1);
    assert.equal(mixed.results[0].path, minutesPath);
    const missing = searchIndexedDocuments(database, { query: "ExampleCo 产品", limit: 10 });
    assert.equal(missing.results.length, 1);
    assert.equal(missing.results[0].path, productPath);
  } finally {
    database.close();
    sample.close();
  }
});

test("indexes extracted PDF text and falls back to names for broken PDFs", async () => {
  const sample = fixture();
  const materialsDir = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "原始材料");
  const pdfPath = path.join(materialsDir, "ExampleCo 产品资料.pdf");
  const brokenPath = path.join(materialsDir, "ExampleCo 损坏文件.pdf");
  fs.writeFileSync(pdfPath, await makePdf(["Quarterly metrics for ExampleCo", "Revenue grew fast."]));
  fs.writeFileSync(brokenPath, "%PDF-1.4\n");
  const database = openDocumentSearchIndex(sample.databasePath);
  try {
    await indexFiles(database, sample.rootPath, [pdfPath, brokenPath], "one");
    const bodyHit = searchIndexedDocuments(database, { query: "Quarterly", limit: 10 });
    assert.equal(bodyHit.degraded, false);
    assert.equal(bodyHit.results.length, 1);
    assert.equal(bodyHit.results[0].path, pdfPath);
    assert.equal(bodyHit.results[0].kind, "pdf");
    assert.ok(bodyHit.results[0].snippet.includes("Quarterly"));
    assert.equal(bodyHit.results[0].line, 1);
    // A long-token query matches both the extracted body and the broken file's name.
    const nameAndBody = searchIndexedDocuments(database, { query: "ExampleCo", limit: 10 });
    assert.equal(nameAndBody.results.length, 2);
    // The broken PDF keeps its name-only behaviour.
    assert.equal(searchIndexedDocuments(database, { query: "metrics", limit: 10 }).results.length, 1);
    assert.equal(searchIndexedDocuments(database, { query: "损坏", limit: 10 }).results.length, 1);
  } finally {
    database.close();
    sample.close();
  }
});

test("transcripts are returned by default, ranked below notes, and excluded on request", async () => {
  const sample = fixture();
  const minutesDir = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要");
  const materialsDir = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "原始材料");
  const notePath = path.join(minutesDir, "会议.md");
  const transcriptPath = path.join(materialsDir, "ExampleCo-PLAUD文字稿.md");
  fs.writeFileSync(notePath, "ExampleCo quarterly review notes.");
  fs.writeFileSync(transcriptPath, "ExampleCo quarterly review transcript.");
  const database = openDocumentSearchIndex(sample.databasePath);
  try {
    await indexFiles(database, sample.rootPath, [notePath, transcriptPath], "one");
    const byDefault = searchIndexedDocuments(database, { query: "ExampleCo", limit: 10 });
    assert.equal(byDefault.results.length, 2);
    assert.equal(byDefault.results[0].path, notePath, "regular notes outrank transcripts");
    assert.equal(byDefault.results[1].path, transcriptPath);
    const excluded = searchIndexedDocuments(database, { query: "ExampleCo", excludeTranscripts: true, limit: 10 });
    assert.equal(excluded.results.length, 1);
    assert.equal(excluded.results[0].path, notePath);
    const legacyFlag = searchIndexedDocuments(database, { query: "ExampleCo", includeTranscripts: false, limit: 10 });
    assert.equal(legacyFlag.results.length, 1);
    assert.equal(legacyFlag.results[0].path, notePath);
    // Transcript bodies are searchable content now.
    const bodyOnly = searchIndexedDocuments(database, { query: "transcript", limit: 10 });
    assert.equal(bodyOnly.results.length, 1);
    assert.equal(bodyOnly.results[0].path, transcriptPath);
  } finally {
    database.close();
    sample.close();
  }
});

test("a folder named 文字稿 does not turn its documents into transcripts", async () => {
  const sample = fixture();
  const insidePath = path.join(sample.rootPath, "文字稿", "普通纪要.md");
  fs.mkdirSync(path.dirname(insidePath), { recursive: true });
  fs.writeFileSync(insidePath, "FolderNote body mentions ExampleCo.");
  const database = openDocumentSearchIndex(sample.databasePath);
  try {
    await indexFiles(database, sample.rootPath, [insidePath], "one");
    const results = searchIndexedDocuments(database, { query: "FolderNote", limit: 10 });
    assert.equal(results.results.length, 1);
    assert.equal(results.results[0].path, insidePath);
    const excluded = searchIndexedDocuments(database, { query: "FolderNote", excludeTranscripts: true, limit: 10 });
    assert.equal(excluded.results.length, 1, "files inside a transcript-named folder stay regular documents");
  } finally {
    database.close();
    sample.close();
  }
});

test("degrades short-query content scans for oversized corpora and reports it", async () => {
  const sample = fixture();
  const notePath = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要", "行业交流.md");
  fs.writeFileSync(notePath, "# 行业交流\n\n会上提到 ExampleCo 正在探索新型模型训练方法，并讨论了融资节奏。\n");
  const database = openDocumentSearchIndex(sample.databasePath);
  const originalLimit = SEARCH_LIMITS.shortQueryContentChars;
  SEARCH_LIMITS.shortQueryContentChars = 5;
  try {
    await indexFiles(database, sample.rootPath, [notePath], "one");
    const shortQuery = searchIndexedDocuments(database, { query: "融资", limit: 10 });
    assert.equal(shortQuery.degraded, true, "content scans beyond the budget are skipped");
    assert.equal(shortQuery.results.length, 0, "the body mention is not scanned");
    const longQuery = searchIndexedDocuments(database, { query: "ExampleCo", limit: 10 });
    assert.equal(longQuery.degraded, false);
    assert.equal(longQuery.results.length, 1, "FTS queries are unaffected by the budget");
  } finally {
    SEARCH_LIMITS.shortQueryContentChars = originalLimit;
    database.close();
    sample.close();
  }
});

test("removes deleted files and keeps stale rows out of results after full scans", async () => {
  const sample = fixture();
  const notePath = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要", "会议.md");
  const transcriptPath = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "原始材料", "ExampleCo-PLAUD文字稿.md");
  fs.writeFileSync(notePath, "最初内容 ExampleCo");
  fs.writeFileSync(transcriptPath, "ExampleCo 逐字内容");
  const database = openDocumentSearchIndex(sample.databasePath);
  try {
    await indexFiles(database, sample.rootPath, [notePath, transcriptPath], "one");
    assert.equal(searchIndexedDocuments(database, { query: "ExampleCo" }).results.length, 2);
    fs.writeFileSync(notePath, "后来补充了 ExampleCo 的判断");
    const future = new Date(Date.now() + 2_000);
    fs.utimesSync(notePath, future, future);
    await indexFiles(database, sample.rootPath, [notePath, transcriptPath], "two");
    assert.equal(searchIndexedDocuments(database, { query: "ExampleCo" }).results.length, 2);
    fs.unlinkSync(notePath);
    await indexFiles(database, sample.rootPath, [transcriptPath], "three");
    assert.equal(searchIndexedDocuments(database, { query: "ExampleCo" }).results.length, 1);
  } finally {
    database.close();
    sample.close();
  }
});

test("ignores unsupported files and never indexes paths outside the trusted root", async () => {
  const sample = fixture();
  const outsidePath = path.join(sample.directory, "outside.md");
  fs.writeFileSync(outsidePath, "ExampleCo secret");
  const database = openDocumentSearchIndex(sample.databasePath);
  try {
    configureRoot(database, sample.rootPath);
    assert.equal(shouldIndexFile("note.md"), true);
    assert.equal(shouldIndexFile("sheet.xlsx"), false);
    assert.equal(
      await upsertIndexedDocument(database, sample.rootPath, outsidePath, fs.statSync(outsidePath), "one"),
      false
    );
    assert.equal(searchIndexedDocuments(database, { query: "ExampleCo" }).results.length, 0);
  } finally {
    database.close();
    sample.close();
  }
});

test("rebuilds a corrupt search cache without touching source documents", () => {
  const sample = fixture();
  const notePath = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要", "保留原文.md");
  fs.writeFileSync(notePath, "原始资料不会随索引缓存重建而改变");
  const original = fs.readFileSync(notePath, "utf8");
  fs.writeFileSync(sample.databasePath, "not a sqlite database");
  const database = openDocumentSearchIndex(sample.databasePath);
  try {
    configureRoot(database, sample.rootPath);
    assert.equal(fs.readFileSync(notePath, "utf8"), original);
    assert.equal(searchIndexedDocuments(database, { query: "原始资料" }).results.length, 0);
  } finally {
    database.close();
    sample.close();
  }
});

test("worker service returns immediately with partial results and finishes indexing in background", async () => {
  const sample = fixture();
  const notePath = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要", "行业交流.md");
  fs.writeFileSync(notePath, "ExampleCo 出现在一份普通纪要中。\n");
  const service = new DocumentSearchService({ databasePath: sample.databasePath });
  try {
    let result = await service.search(sample.rootPath, { query: "ExampleCo" });
    assert.equal(result.ok, true);
    assert.equal(typeof result.partial, "boolean");
    assert.equal(result.degraded, false);
    const deadline = Date.now() + 5_000;
    while (!result.results.length && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      result = await service.search(sample.rootPath, { query: "ExampleCo" });
    }
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].path, notePath);
  } finally {
    await service.close();
    sample.close();
  }
});

test("serialized worker updates are visible to the immediately following search", async () => {
  const sample = fixture();
  const minutesDir = path.join(sample.rootPath, "3.项目库", "AI", "示例项目", "纪要");
  const notePath = path.join(minutesDir, "初始纪要.md");
  fs.writeFileSync(notePath, "ExampleCo initial note.");
  const service = new DocumentSearchService({ databasePath: sample.databasePath });
  try {
    service.scheduleIndex(sample.rootPath, true);
    let settled = false;
    const deadline = Date.now() + 5_000;
    while (!settled && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const probe = await service.search(sample.rootPath, { query: "ExampleCo" });
      settled = !probe.indexing && probe.results.length === 1;
    }
    assert.equal(settled, true, "initial indexing must finish first");
    const freshPath = path.join(minutesDir, "新保存纪要.md");
    fs.writeFileSync(freshPath, "全新关键词出现在这份纪要里。\n");
    service.updateFile(sample.rootPath, freshPath);
    const immediate = await service.search(sample.rootPath, { query: "全新" });
    assert.equal(immediate.results.length, 1, "index-file must land before the next search runs");
    assert.equal(immediate.results[0].path, freshPath);
  } finally {
    await service.close();
    sample.close();
  }
});
