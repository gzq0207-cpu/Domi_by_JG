import test from "node:test";
import assert from "node:assert/strict";
import { filterScopeNodes, scopeDocuments, validateDocumentScope, remainingScopeDraft } from "../src/document-scope.ts";

const file = (name, folder = "行业") => ({ kind: "markdown", name, path: `/library/${folder}/${name}`, relativePath: `${folder}/${name}`, size: 123, mtimeMs: 1 });
const nodes = [{ kind: "folder", name: "行业", path: "/library/行业", relativePath: "行业", size: 0, mtimeMs: 1,
  children: [file("算力.md"), file("旅游.md")] }, file("算力.md", "访谈")];

test("scope selection expands folders into exact files and search distinguishes identical names", () => {
  assert.equal(scopeDocuments(nodes).length, 3);
  assert.equal(scopeDocuments(filterScopeNodes(nodes, "行业 算力" )).length, 1);
  assert.deepEqual(scopeDocuments(filterScopeNodes(nodes, "行业")).map((item) => item.path), ["/library/行业/算力.md", "/library/行业/旅游.md"]);
  assert.equal(scopeDocuments(filterScopeNodes(nodes, "算力")).length, 2);
  assert.deepEqual(filterScopeNodes(nodes, "不存在"), []);
});

test("selected material persists after submitting while question text and workflow are cleared", () => {
  const attachments = scopeDocuments(nodes);
  const draft = { input: "收入多少？", attachments, attachmentError: "", selectedWorkflowId: "analysis", sourceScope: "selected" };
  const next = remainingScopeDraft(draft);
  assert.equal(next.input, "");
  assert.equal(next.selectedWorkflowId, undefined);
  assert.equal(next.attachments, attachments);
  assert.equal(next.sourceScope, "selected");
  assert.equal(draft.input, "收入多少？", "the submitted snapshot is immutable");
  assert.equal(remainingScopeDraft({ ...draft, sourceScope: "research" }).attachments.length, 0);
  assert.equal(remainingScopeDraft({ ...draft, sourceScope: "library" }).attachments.length, 0);
});

test("restricted document questions reject empty scopes, unsupported formats and more than 64 files", () => {
  assert.throws(() => validateDocumentScope("selected", []), /选择文档/);
  assert.doesNotThrow(() => validateDocumentScope("library", []));
  assert.throws(() => validateDocumentScope("selected", [{ name: "附件", path: "/data.xlsx", size: 1 }]), /Markdown/);
  assert.doesNotThrow(() => validateDocumentScope("selected", [{ name:'Word',path:'/data.docx',size:1 },{path:'/legacy.doc'}]));
  assert.throws(() => validateDocumentScope("selected", Array.from({ length: 65 }, (_, i) => ({ path: `/file${i}.pdf` }))), /64/);
  assert.doesNotThrow(() => validateDocumentScope("selected", [{ path: "C:\\材料\\报告.PDF" }, { path: "/note.txt" }]));
  assert.doesNotThrow(() => validateDocumentScope("research", [{ path: "/data.docx" }]));
});
