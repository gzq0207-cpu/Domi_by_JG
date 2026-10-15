const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DocumentReader } = require("../electron/document-reader.cjs");
const PDFDocument = require("pdfkit");

function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-document-reader-"));
  const rootPath = path.join(directory, "library");
  fs.mkdirSync(rootPath);
  t.after(() => fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return { directory, rootPath, reader: new DocumentReader({ rootPath, ...options }),
    write(name, content) { fs.writeFileSync(path.join(rootPath, name), content); return name; } };
}

test("short articles return full original text with title, date and line references", async (t) => {
  const context = fixture(t);
  const text = '---\ntitle: "商业化研究"\ndate: 2026-10-13\n---\n# 原文\n结论的完整论据。\n\n| 指标 | 口径 |\n| --- | --- |\n| 毛利率 | 扣除推理成本 |';
  const doc = await context.reader.read({ path: context.write("a.md", text) });
  assert.equal(doc.content, text);
  assert.equal(doc.fullDocument, true);
  assert.equal(doc.title, "商业化研究");
  assert.equal(doc.date, "2026-10-13");
  assert.equal(doc.nextCursor, null);
});

test("hits expand to the original chapter and preserve surrounding table context", async (t) => {
  const context = fixture(t);
  const section = '# 商业化\n前提：付费企业客户。\n\n| 客户 | 收入 | 单位 |\n| --- | --- | --- |\n| 企业 | 80 | 万元 |\n\n例外：免费客户另算。\n';
  context.write("long.md", `# 背景\n${"背景内容。".repeat(1600)}\n${section}# 结尾\n末尾。`);
  const doc = await context.reader.read({ path: "long.md", anchorText: "企业 | 80", maxChars: 2000 });
  assert.equal(doc.sectionTitle, "商业化");
  assert.equal(doc.content, section);
  assert.equal(doc.completeSection, true);
  assert.equal(doc.fullDocument, false);
});

test("a long single paragraph can be read to its end with lossless cursors", async (t) => {
  const context = fixture(t);
  const text = `# 原文\n${"正文😀".repeat(2200)}最后的反例与结论。`;
  context.write("long.md", text);
  let cursor;
  let restored = "";
  for (let count = 0; count < 100; count += 1) {
    const doc = await context.reader.read({ path: "long.md", mode: "document", cursor, maxChars: 511 });
    assert.ok(doc.content.length <= 511);
    assert.ok(!/[\uD800-\uDBFF]$/.test(doc.content));
    restored += doc.content;
    cursor = doc.nextCursor;
    if (!cursor) break;
  }
  assert.equal(restored, text);
});

test("large chapter windows contain the hit and explicitly disclose unread prefixes", async (t) => {
  const context = fixture(t);
  context.write("long.md", `# 原文\n${"甲".repeat(8000)}核心瓶颈${"乙".repeat(3000)}`);
  const doc = await context.reader.read({ path: "long.md", anchorText: "核心瓶颈", maxChars: 1200 });
  assert.match(doc.content, /核心瓶颈/);
  assert.equal(doc.omittedPrefix, true);
  assert.equal(doc.fullDocument, false);
  assert.ok(doc.nextCursor);
});

test("cursors fail when the source changes instead of mixing document versions", async (t) => {
  const context = fixture(t);
  context.write("long.md", "甲".repeat(9000));
  const doc = await context.reader.read({ path: "long.md", mode: "document", maxChars: 600 });
  context.write("long.md", "甲".repeat(9000) + "新版本");
  await assert.rejects(context.reader.read({ path: "long.md", cursor: doc.nextCursor }), /版本或路径已改变/);
});

test("a budget smaller than one Unicode character fails rather than returning a stuck cursor", async (t) => {
  const context = fixture(t);
  context.write("unicode.md", "😀正文");
  await assert.rejects(context.reader.read({ path: "unicode.md", maxChars: 1 }), /完整字符/);
});

test("PDF chapter reads retain actual page numbers and disclose unavailable OCR", async (t) => {
  const context = fixture(t, { extractPdf: async () => ["甲".repeat(6500), "第二页的关键结论。", "第三页。"] });
  context.write("a.pdf", "fixture");
  const doc = await context.reader.read({ path: "a.pdf", anchorText: "关键结论", maxChars: 1000 });
  assert.deepEqual(doc.pages, [2]);
  assert.match(doc.content, /第二页的关键结论/);
  const empty = new DocumentReader({ rootPath: context.rootPath, extractPdf: async () => [""] });
  await assert.rejects(empty.read({ path: "a.pdf" }), /OCR/);
});

test("the real PDF parser preserves page references and flags pages without text", async (t) => {
  const context = fixture(t);
  const pdf = new PDFDocument();
  const parts = [];
  const buffer = new Promise((resolve, reject) => { pdf.on("data", (part) => parts.push(part)); pdf.on("end", () => resolve(Buffer.concat(parts))); pdf.on("error", reject); });
  pdf.text("First page evidence.");
  pdf.addPage();
  pdf.addPage();
  pdf.text("Last page counterexample.");
  pdf.end();
  context.write("real.pdf", await buffer);
  const doc = await context.reader.read({ path: "real.pdf", mode: "document" });
  assert.match(doc.content, /Last page counterexample/);
  assert.deepEqual(doc.pages, [1, 2, 3]);
  assert.equal(doc.extractionIncomplete, true);
  assert.equal(doc.fullDocument, false);
  assert.ok(doc.warnings.some((warning) => warning.includes("第 2 页")));
});

test("reader blocks traversal and symlinks outside the selected repository", async (t) => {
  const context = fixture(t);
  fs.writeFileSync(path.join(context.directory, "outside.md"), "private");
  await assert.rejects(context.reader.read({ path: "../outside.md" }), /超出/);
  const outside = path.join(context.directory, "outside");
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "private.md"), "private");
  fs.symlinkSync(outside, path.join(context.rootPath, "link"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(context.reader.read({ path: "link/private.md" }), /之外/);
});
