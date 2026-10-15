const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { test } = require("node:test");
const { DomiRepository } = require("../build/domi-plugin/scripts/domi-repo.cjs");

test("unified article preserves the exact source, checks its hash and replaces rather than appends an old transcript", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-original-"));
  const repository = new DomiRepository({ backend: "local", libraryDir: path.join(root, "library"), databasePath: path.join(root, "repo.db") });
  t.after(() => { repository.close(); fs.rmSync(root, { recursive: true, force: true }); });
  const source = path.join(root, "full.txt");
  const original = "# 测试原文\n\n开头。\n\n重复。重复。\n\n末尾。";
  fs.writeFileSync(source, original);
  const hash = crypto.createHash("sha256").update(original).digest("hex");
  const input = { eventId: "art_full", articleType: "article", title: "测试原文", originalContentFile: source,
    originalContentFileSha256: hash, summary: "全文重要观点" };
  assert.throws(() => repository.upsertNews({ ...input, originalContentFileSha256: "0".repeat(64) }), /SHA-256/);
  assert.equal(repository.getNews("art_full"), null);
  assert.throws(() => repository.upsertNews({ ...input, originalContent: "只复制开头。" }), /不一致/);
  const first = repository.upsertNews(input);
  assert.equal(first.storageReceipt.originalContentVerified, true);
  assert.equal(first.storageReceipt.originalContentSha256, hash);
  assert.ok(fs.readFileSync(first.event.documentPath, "utf8").trimEnd().endsWith(original));
  const updated = original.replace("末尾。", "补全后的末尾。");
  fs.writeFileSync(source, updated);
  const second = repository.upsertNews({ ...input, originalContentFileSha256: crypto.createHash("sha256").update(updated).digest("hex") });
  const saved = fs.readFileSync(second.event.documentPath, "utf8");
  assert.equal(saved.match(/## 原文存档/g).length, 1);
  assert.ok(saved.trimEnd().endsWith(updated));
});
