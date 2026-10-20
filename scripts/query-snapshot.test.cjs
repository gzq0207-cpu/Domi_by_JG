const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { buildQuerySnapshot, snapshotSha256 } = require("../electron/query-snapshot.cjs");

test("buildQuerySnapshot joins database rows with mirror urls and digest files", () => {
  const { DatabaseSync } = require("node:sqlite");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-query-snapshot-"));
  const dbPath = path.join(root, "repo.sqlite3");
  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      CREATE TABLE news_events (event_id TEXT, title TEXT, domains_json TEXT, published_at INTEGER,
        summary TEXT, url TEXT, companies TEXT, content_path TEXT, document_path TEXT);
      CREATE TABLE projects (name TEXT, domain TEXT, status TEXT, rating TEXT, notes TEXT, document_path TEXT);
      CREATE TABLE people (name TEXT, organization TEXT, status TEXT, rating TEXT, document_path TEXT);
    `);
    db.prepare("INSERT INTO news_events VALUES (?,?,?,?,?,?,?,?,?)").run(
      "art_1", "流匹配访谈", "[\"模型层\"]", 1789900000000,
      "【核心观点】流匹配成为主流。", "https://youtube.com/watch?v=1", "Mistral",
      "C:/资料库/07.模型层/art_1-原文.md", "C:/资料库/07.模型层/art_1.md"
    );
    db.prepare("INSERT INTO news_events VALUES (?,?,?,?,?,?,?,?,?)").run(
      "art_2", "无镜像记录", "[\"AI\"]", 1789800000000, "旧记录", "", "", "", ""
    );
    db.prepare("INSERT INTO projects VALUES (?,?,?,?,?,?)").run(
      "ExampleCorp", "Agent与平台", "已交流", "A", "做 agent 的公司，笔记" + "长".repeat(300), "C:/资料库/03/项目主页.md"
    );
    db.prepare("INSERT INTO people VALUES (?,?,?,?,?)").run(
      "张三", "ExampleCorp", "待接触", "", "C:/资料库/12.人脉/张三/人物主页.md"
    );
  } finally {
    db.close();
  }
  const digestDir = path.join(root, "13.认知库", "订阅日报");
  fs.mkdirSync(digestDir, { recursive: true });
  fs.writeFileSync(path.join(digestDir, "日报-2026-09-22.md"), "# 日报\n", "utf8");

  const fakeMirror = {
    mirroredUrlFor: (absolutePath) => {
      const normalized = String(absolutePath || "").replace(/\\/g, "/");
      if (normalized.includes("art_1")) return "https://tenant.example.invalid/docx/art1";
      if (normalized.includes("订阅日报")) return "https://tenant.example.invalid/docx/digest";
      return "";
    }
  };

  const snapshot = buildQuerySnapshot({ databasePath: dbPath, libraryRoot: root, mirror: fakeMirror });
  assert.equal(snapshot.version, 1);
  assert.ok(snapshot.generatedAt);
  assert.equal(snapshot.news.length, 2);
  // 最新记录排前，且镜像 URL 正确联接。
  assert.equal(snapshot.news[0].title, "流匹配访谈");
  assert.equal(snapshot.news[0].mirrorUrl, "https://tenant.example.invalid/docx/art1");
  assert.deepEqual(snapshot.news[0].domains, ["模型层"]);
  assert.equal(snapshot.news[1].mirrorUrl, "");
  assert.equal(snapshot.projects[0].notes.length <= 201, true);
  assert.equal(snapshot.people[0].name, "张三");
  assert.equal(snapshot.digests.length, 1);
  assert.equal(snapshot.digests[0].name, "日报-2026-09-22");
  assert.equal(snapshot.digests[0].url, "https://tenant.example.invalid/docx/digest");

  // 同一输入 → 稳定 sha（除非 generatedAt 变化；构建两次内容一致仅校验函数本身）。
  const first = snapshotSha256({ ...snapshot, generatedAt: "fixed" });
  const second = snapshotSha256({ ...snapshot, generatedAt: "fixed" });
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("buildQuerySnapshot tolerates an empty library", () => {
  const { DatabaseSync } = require("node:sqlite");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-query-snapshot-"));
  const dbPath = path.join(root, "repo.sqlite3");
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE news_events (event_id TEXT, title TEXT, domains_json TEXT, published_at INTEGER,
      summary TEXT, url TEXT, companies TEXT, content_path TEXT, document_path TEXT);
    CREATE TABLE projects (name TEXT, domain TEXT, status TEXT, rating TEXT, notes TEXT, document_path TEXT);
    CREATE TABLE people (name TEXT, organization TEXT, status TEXT, rating TEXT, document_path TEXT);
  `);
  db.close();
  const snapshot = buildQuerySnapshot({
    databasePath: dbPath,
    libraryRoot: root,
    mirror: { mirroredUrlFor: () => "" }
  });
  assert.deepEqual(snapshot.news, []);
  assert.deepEqual(snapshot.projects, []);
  assert.deepEqual(snapshot.people, []);
  assert.deepEqual(snapshot.digests, []);
});
