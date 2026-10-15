import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import {
  isLocalMarkdownResource,
  isLocalPdfResource,
  resolveLocalDocumentLink
} from "../src/document-resources.ts";

const { normalizeLocalDocumentResource } = createRequire(import.meta.url)("../electron/document-resource.cjs");
const windowsDocument = "C:\\资料库\\domi工作区\\行业认知\\2026\\报告.md";

test("Windows relative PDF links retain the source directory and one drive letter", () => {
  for (const documentPath of [windowsDocument, windowsDocument.replace(/\\/g, "/")]) {
    const resource = resolveLocalDocumentLink("原始材料/算力基石.pdf", documentPath);
    assert.equal(new URL(resource).hostname, "");
    assert.equal(decodeURIComponent(new URL(resource).pathname), "/C:/资料库/domi工作区/行业认知/2026/原始材料/算力基石.pdf");
    if (process.platform === "win32") {
      assert.equal(normalizeLocalDocumentResource(resource).path, "C:\\资料库\\domi工作区\\行业认知\\2026\\原始材料\\算力基石.pdf");
    }
  }
});

test("parent links and PDF page locations survive resolution", () => {
  const resource = resolveLocalDocumentLink("../原始材料/报告%20结果.pdf#page=2", windowsDocument);
  assert.equal(decodeURIComponent(new URL(resource).pathname), "/C:/资料库/domi工作区/行业认知/原始材料/报告 结果.pdf");
  assert.equal(new URL(resource).hash, "#page=2");
  assert.equal(isLocalPdfResource(resource), true);
  const markdown = resolveLocalDocumentLink("../纪要.md:12", windowsDocument);
  assert.equal(isLocalMarkdownResource(markdown), true);
  if (process.platform === "win32") assert.equal(normalizeLocalDocumentResource(markdown).line, 12);
});

test("document directories containing literal URL punctuation are preserved", () => {
  const resource = resolveLocalDocumentLink("原始材料/报告.pdf", "C:\\资料库\\100% # ?\\纪要.md");
  assert.equal(decodeURIComponent(new URL(resource).pathname), "/C:/资料库/100% # ?/原始材料/报告.pdf");
});

test("POSIX paths and absolute Windows paths resolve as file URLs", () => {
  const resource = resolveLocalDocumentLink("../原始材料/报告.pdf", "/Users/test/资料库/纪要/记录.md");
  assert.equal(decodeURIComponent(new URL(resource).pathname), "/Users/test/资料库/原始材料/报告.pdf");
  if (process.platform !== "win32") assert.equal(fileURLToPath(resource), "/Users/test/资料库/原始材料/报告.pdf");
  const absolute = resolveLocalDocumentLink("D:\\报告\\原文.pdf", windowsDocument);
  assert.equal(decodeURIComponent(new URL(absolute).pathname), "/D:/报告/原文.pdf");
  assert.equal(resolveLocalDocumentLink(absolute, windowsDocument), absolute);
});

test("web links, anchors, unsupported schemes and invalid bases stay unhandled", () => {
  for (const resource of ["https://example.com/report.pdf", "#section", "mailto:test@example.com", "javascript:alert(1)", ""]) {
    assert.equal(resolveLocalDocumentLink(resource, windowsDocument), "");
  }
  assert.equal(resolveLocalDocumentLink("report.pdf", "relative/notes.md"), "");
});
