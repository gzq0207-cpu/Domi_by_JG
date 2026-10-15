const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  buildKnowledgeDailyReport,
  coverageWindow,
  formatWindow,
  localDayKey,
  shouldGenerateDailyReport
} = require("../electron/knowledge-daily-report.cjs");

function makeDatabase(rows) {
  const { DatabaseSync } = require("node:sqlite");
  const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "domi-kdr-")), "repo.sqlite3");
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE news_events (event_id TEXT, title TEXT, domains_json TEXT, published_at INTEGER,
      summary TEXT, url TEXT, companies TEXT, source TEXT, content_path TEXT, document_path TEXT, created_at INTEGER);
    CREATE TABLE projects (name TEXT, domain TEXT, status TEXT, rating TEXT, notes TEXT, document_path TEXT, created_at INTEGER);
    CREATE TABLE people (name TEXT, organization TEXT, status TEXT, rating TEXT, document_path TEXT, created_at INTEGER);
  `);
  for (const row of rows.news || []) {
    db.prepare("INSERT INTO news_events VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
      row.id, row.title, row.domains || "[]", row.publishedAt || 0,
      row.summary || "", row.url || "", row.companies || "", row.source || "", row.contentPath || "", row.documentPath || "", row.createdAt
    );
  }
  for (const row of rows.projects || []) {
    db.prepare("INSERT INTO projects VALUES (?,?,?,?,?,?,?)").run(
      row.name, row.domain || "", row.status || "", row.rating || "", row.notes || "", row.documentPath || "", row.createdAt
    );
  }
  for (const row of rows.people || []) {
    db.prepare("INSERT INTO people VALUES (?,?,?,?,?,?)").run(
      row.name, row.organization || "", row.status || "", row.rating || "", row.documentPath || "", row.createdAt
    );
  }
  db.close();
  return dbPath;
}

const HOUR = 60 * 60 * 1000;
const NOW = new Date("2026-09-23T10:00:00");

test("shouldGenerateDailyReport fires once per local day after the report hour", () => {
  const before = new Date("2026-09-23T08:59:00");
  const after = new Date("2026-09-23T09:01:00");
  assert.equal(shouldGenerateDailyReport({ lastReportDay: "", lastCoveredAt: 0 }, before), false);
  assert.equal(shouldGenerateDailyReport({ lastReportDay: "", lastCoveredAt: 0 }, after), true);
  assert.equal(shouldGenerateDailyReport({ lastReportDay: "2026-09-23", lastCoveredAt: 1 }, after), false);
  // 昨天没开机的场景：今天 09 点后开机即出报。
  assert.equal(shouldGenerateDailyReport({ lastReportDay: "2026-09-21", lastCoveredAt: 1 }, after), true);
});

test("coverageWindow bridges gaps and defaults to a 48h lookback", () => {
  const first = coverageWindow({ lastReportDay: "", lastCoveredAt: 0 }, NOW);
  assert.equal(first.until, NOW.getTime());
  assert.equal(first.until - first.since, 48 * HOUR);
  const bridged = coverageWindow({ lastReportDay: "2026-09-21", lastCoveredAt: NOW.getTime() - 72 * HOUR }, NOW);
  assert.equal(bridged.since, NOW.getTime() - 72 * HOUR);
});

test("buildKnowledgeDailyReport groups news by domain and renders two formats", () => {
  const base = NOW.getTime();
  const dbPath = makeDatabase({
    news: [
      { id: "a1", title: "流匹配访谈", domains: "[\"模型层\"]", source: "YouTube·MLST", contentPath: "C:/lib/a1-原文.md", createdAt: base - 2 * HOUR },
      { id: "a2", title: "边缘芯片竞争", domains: "[\"算力芯片\"]", source: "YouTube·TechTechPotato", contentPath: "C:/lib/a2-原文.md", createdAt: base - 3 * HOUR },
      { id: "old", title: "窗口外旧闻", domains: "[\"模型层\"]", createdAt: base - 100 * HOUR }
    ],
    projects: [
      { name: "ExampleCorp", domain: "Agent与平台", status: "已交流", rating: "A", documentPath: "C:/lib/proj.md", createdAt: base - 1 * HOUR }
    ],
    people: [
      { name: "张三", organization: "ExampleCorp", documentPath: "C:/lib/p1.md", createdAt: base - 1 * HOUR }
    ]
  });
  const libraryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "domi-kdr-lib-"));
  const digestDir = path.join(libraryRoot, "13.认知库", "订阅日报");
  fs.mkdirSync(digestDir, { recursive: true });
  const digestFile = path.join(digestDir, "AI-Builders-Digest-2026-09-22.md");
  fs.writeFileSync(digestFile, "# AI 构建者日报 — 2026-09-22", "utf8");
  const inWindow = new Date(base - 5 * HOUR);
  fs.utimesSync(digestFile, inWindow, inWindow);

  const mirror = {
    mirroredUrlFor: (absolutePath) => {
      const normalized = String(absolutePath || "").replace(/\\/g, "/");
      if (normalized.includes("a1")) return "https://my.feishu.cn/docx/a1";
      if (normalized.includes("proj")) return "https://my.feishu.cn/docx/proj";
      return "";
    }
  };

  const report = buildKnowledgeDailyReport({
    databasePath: dbPath,
    libraryRoot,
    since: base - 48 * HOUR,
    until: base,
    mirror,
    now: NOW
  });

  assert.equal(report.dayKey, "2026-09-23");
  assert.equal(report.counts.news, 2);
  assert.equal(report.counts.digests, 1);
  assert.equal(report.counts.projects, 1);
  assert.equal(report.counts.people, 1);

  // 归档版：Markdown 结构 + 链接语法 + 分域小节。
  assert.ok(report.archiveMarkdown.includes("# domi 知识库日报 — 2026-09-23"));
  assert.ok(report.archiveMarkdown.includes("### 模型层（1 条）"));
  assert.ok(report.archiveMarkdown.includes("### 算力芯片（1 条）"));
  assert.ok(report.archiveMarkdown.includes("[阅读](https://my.feishu.cn/docx/a1)"));
  assert.ok(report.archiveMarkdown.includes("《AI 构建者日报 — 2026-09-22》"));
  assert.ok(report.archiveMarkdown.includes("ExampleCorp（Agent与平台 · 已交流 · A）"));
  // 窗口外的旧条目不出现在日报里。
  assert.ok(!report.archiveMarkdown.includes("窗口外旧闻"));

  // 群消息版：纯文本 URL，不出现 Markdown 链接语法。
  assert.ok(report.messageMarkdown.includes("新增行业认知 2 条"));
  assert.ok(report.messageMarkdown.includes("https://my.feishu.cn/docx/a1"));
  assert.ok(!/\]\(https?:/.test(report.messageMarkdown));
  assert.ok(report.messageMarkdown.length <= 4000);
});

test("buildKnowledgeDailyReport renders a quiet-day message", () => {
  const base = NOW.getTime();
  const dbPath = makeDatabase({
    news: [{ id: "old", title: "旧闻", createdAt: base - 100 * HOUR }]
  });
  const libraryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "domi-kdr-lib-"));
  const report = buildKnowledgeDailyReport({
    databasePath: dbPath,
    libraryRoot,
    since: base - 24 * HOUR,
    until: base,
    mirror: { mirroredUrlFor: () => "" },
    now: NOW
  });
  assert.equal(report.empty, true);
  assert.ok(report.messageMarkdown.includes("没有新增内容"));
  assert.ok(report.archiveMarkdown.includes("没有新增内容"));
});

test("formatWindow and localDayKey produce stable labels", () => {
  assert.equal(localDayKey(new Date("2026-09-23T23:59:59")), "2026-09-23");
  assert.equal(formatWindow(new Date("2026-09-23T14:05:00").getTime()), "09-23 14:05");
});
