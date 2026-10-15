const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { parseExport, importExport, readExport } = require("../electron/browser-transcript.cjs");
const { verifyMedia } = require("../electron/subscription-archive.cjs");
const source = "YouTube transcript\nVideo ID: abcdefghijk\nLanguage: en\nCaptions: auto-generated\n\n" +
  Array.from({ length: 21 }, (_, n) => `[${Math.floor(n * 5 / 60)}:${String(n * 5 % 60).padStart(2, '0')}] Caption ${n}`).join("\n");
test("browser export preserves every source row without inventing cue end times", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "browser-transcript-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, "source.txt"); fs.writeFileSync(file, source);
  const result = importExport({ videoId: "abcdefghijk", duration: "1:40", title: "Title - YouTube", path: file }, root);
  assert.equal(result.validation.cueCount, 21); assert.equal(result.validation.cueEndTimesAvailable, false);
  assert.equal(result.validation.coverage, undefined); assert.equal(verifyMedia(result), source.split("\n\n")[1]);
  assert.equal(readExport("abcdefghijk", root).metadata.title, "Title");
  fs.appendFileSync(result.transcriptPath, "\nextra"); assert.throws(() => verifyMedia(result), /不可验证/);
});
test("wrong video, missing tail, reversed rows and large internal gaps fail closed", () => {
  assert.throws(() => parseExport(source, "lmnopqrstuv", 100), /不匹配/);
  assert.throws(() => parseExport(source.split("\n").slice(0, -5).join("\n"), "abcdefghijk", 100), /缺口/);
  assert.throws(() => parseExport(source.replace("[0:10]", "[0:00]"), "abcdefghijk", 100), /顺序/);
  assert.throws(() => parseExport(source.replace(/\[0:(?:25|30|35)\] Caption \d+\n/g, ""), "abcdefghijk", 100), /缺口/);
});
test("a claimed receipt cannot replace recomputation from the unchanged raw export", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "browser-transcript-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, "source.txt"); fs.writeFileSync(file, source);
  const result = importExport({ videoId: "abcdefghijk", duration: "1:40", title: "Title", path: file }, root);
  result.validation.cueCount--; assert.throws(() => verifyMedia(result), /不一致/);
});

test("intact authored tracks may start at six seconds without relaxing extent or gap checks", () => {
  const authored = "YouTube transcript\nVideo ID: abcdefghijk\nLanguage: en-US\nCaptions: authored or unspecified\n\n" +
    Array.from({ length: 248 }, (_, n) => {
      const start = 6 + n * 2;
      return `[${Math.floor(start / 60)}:${String(start % 60).padStart(2, '0')}] Caption ${n}`;
    }).join("\n");
  assert.equal(parseExport(authored, "abcdefghijk", 500).validation.firstTimestampSeconds, 6);
  assert.throws(() => parseExport(authored.replace("authored or unspecified", "auto-generated"), "abcdefghijk", 500), /缺口/);
  assert.throws(() => parseExport(authored.replace(/\[0:(?:06|08|10)\] Caption \d+\n/g, ""), "abcdefghijk", 500), /缺口/);
  assert.throws(() => parseExport(authored, "abcdefghijk", 520), /缺口/);
  assert.throws(() => parseExport(authored.replace(/\[1:(?:00|02|04|06|08|10|12|14)\] Caption \d+\n/g, ""), "abcdefghijk", 500), /缺口/);
  const shortTrack = source.replace("auto-generated", "authored or unspecified").replace(/\[0:(?:00|05)\] Caption \d+\n/g, "");
  assert.throws(() => parseExport(shortTrack, "abcdefghijk", 100), /缺口/);
});
