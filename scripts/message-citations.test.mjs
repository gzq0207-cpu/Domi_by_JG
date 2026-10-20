import assert from "node:assert/strict";
import test from "node:test";
import {
  codexFileCitationHref,
  codexFileCitationPath,
  domiEvidenceId,
  parseCodexFileCitation,
  remarkCodexFileCitations,
  splitCodexFileCitations,
  splitDomiEvidenceMarkers
} from "../src/message-citations.ts";

test("turns a local PDF citation into a short material label", () => {
  const citation = parseCodexFileCitation(
    'path="/资料库/Mist/原始材料/Ambi 管访纪要.pdf" purpose="source"'
  );
  assert.deepEqual(citation, {
    path: "/资料库/Mist/原始材料/Ambi 管访纪要.pdf",
    label: "Ambi 管访纪要.pdf",
    artifactKind: undefined,
    sheet: undefined,
    range: undefined
  });
});

test("adds workbook sheet and range without exposing the full path", () => {
  const citation = parseCodexFileCitation(
    'path="/资料库/项目跟踪.xlsx" artifact_kind="workbook" sheet="最新" range="A6:C12"'
  );
  assert.equal(citation?.label, "项目跟踪.xlsx · 最新!A6:C12");
});

test("keeps surrounding prose and supports multiple citations", () => {
  const segments = splitCodexFileCitations(
    '参考 :codex-file-citation{path="/项目/纪要.md"} 和 :codex-file-citation{path="/项目/BP.pdf"}。'
  );
  assert.deepEqual(segments.map((segment) => segment.type), [
    "text", "citation", "text", "citation", "text"
  ]);
  assert.equal(segments[1].type === "citation" && segments[1].value.label, "纪要.md");
  assert.equal(segments[3].type === "citation" && segments[3].value.label, "BP.pdf");
});

test("leaves malformed markers visible instead of inventing a target", () => {
  const source = ':codex-file-citation{purpose="source"}';
  assert.deepEqual(splitCodexFileCitations(source), [{ type: "text", value: source }]);
});

test("citation hrefs round-trip unicode paths and reject unrelated links", () => {
  const path = "/资料库/项目/原始材料/管访纪要.pdf";
  assert.equal(codexFileCitationPath(codexFileCitationHref(path)), path);
  assert.equal(codexFileCitationPath("https://example.com"), "");
  assert.equal(codexFileCitationPath("javascript:alert(1)"), "");
});

test("remark conversion does not create nested links or alter code", () => {
  const marker = ':codex-file-citation{path="/项目/纪要.md"}';
  const tree = {
    type: "root",
    children: [
      { type: "paragraph", children: [{ type: "text", value: marker }] },
      { type: "inlineCode", value: marker },
      {
        type: "link",
        url: "https://example.com",
        children: [{ type: "text", value: marker }]
      }
    ]
  };
  remarkCodexFileCitations()(tree);
  assert.equal(tree.children[0].children[0].type, "link");
  assert.equal(tree.children[1].value, marker);
  assert.equal(tree.children[2].children[0].type, "text");
});

test("domi evidence markers split around claims and reject malformed ids", () => {
  const id = "E0123456789ab";
  const segments = splitDomiEvidenceMarkers(`结论甲 :domi-cite{id="${id}"} 结论乙`);
  assert.deepEqual(segments.map((segment) => segment.type), ["text", "evidence", "text"]);
  assert.equal(segments[1].type === "evidence" && segments[1].value, id);
  const fabricated = `:domi-cite{id="X0123456789ab"}`;
  assert.deepEqual(splitDomiEvidenceMarkers(fabricated), [{ type: "text", value: fabricated }]);
  assert.deepEqual(splitDomiEvidenceMarkers(""), []);
});

test("domi evidence hrefs accept only canonical citation ids", () => {
  assert.equal(domiEvidenceId("domi-evidence:E0123456789ab"), "E0123456789ab");
  assert.equal(domiEvidenceId("domi-evidence:E0123456789ABC"), "");
  assert.equal(domiEvidenceId("domi-evidence:not-an-id"), "");
  assert.equal(domiEvidenceId("https://example.com"), "");
  assert.equal(domiEvidenceId(undefined), "");
});

test("remark conversion turns domi evidence markers into inspectable links", () => {
  const marker = ':domi-cite{id="E0123456789ab"}';
  const tree = {
    type: "root",
    children: [
      { type: "paragraph", children: [{ type: "text", value: `结论 ${marker}` }] },
      { type: "inlineCode", value: marker }
    ]
  };
  remarkCodexFileCitations()(tree);
  const paragraph = tree.children[0];
  assert.equal(paragraph.children.length, 2);
  assert.equal(paragraph.children[0].type, "text");
  assert.equal(paragraph.children[1].type, "link");
  assert.equal(paragraph.children[1].url, "domi-evidence:E0123456789ab");
  assert.equal(tree.children[1].value, marker, "code samples stay verbatim");
});
