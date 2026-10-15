const fs = require("node:fs");
const path = require("node:path");
const { digestDisplayTitle } = require("./subscription-digest.cjs");

// 每日知识库日报：汇总「自上次日报以来」资料库的全部新增——行业认知事件
// （转发入库/雷达扫描/订阅单集都在 news_events）、订阅日报文件、新项目、
// 新人物——归档进 13.认知库/知识库日报/ 并推送到飞书收件箱群。
//
// 设计要点：
// - 覆盖窗口按「自上次日报以来」而不是自然日：整天关机时窗口自动顺延，
//   开机后的第一份日报会覆盖关机期间漏掉的全部新增。
// - 每本地日最多一份：09:00 后的第一个检查点出报（domi 15 分钟一轮）。
// - 纯 SQL + 模板渲染，零 AI 消耗。
// - 两种格式：归档用 Markdown 链接语法；群消息用纯文本 URL（飞书文本
//   消息不渲染 Markdown 链接）。

const DEFAULT_REPORT_HOUR = 9;
const FIRST_RUN_LOOKBACK_MS = 48 * 60 * 60 * 1000;
const MAX_ARCHIVE_NEWS = 60;
const MAX_MESSAGE_NEWS = 15;
const MESSAGE_MAX_CHARS = 3600;

function localDayKey(date = new Date()) {
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatWindow(timestamp) {
  const date = new Date(Number(timestamp));
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

// 当天没报过且已过出报时刻（默认 09:00 本地）就该出报。
function shouldGenerateDailyReport(state, now = new Date(), reportHour = DEFAULT_REPORT_HOUR) {
  if (String(state?.lastReportDay || "") === localDayKey(now)) return false;
  const hour = Math.max(0, Math.min(23, Number(reportHour)));
  return now.getHours() >= hour;
}

// 首次运行回看 48 小时；之后从上次报告的截止时间无缝衔接。
function coverageWindow(state, now = new Date()) {
  const until = now.getTime();
  const last = Number(state?.lastCoveredAt) || 0;
  const since = last > 0 && last < until ? last : until - FIRST_RUN_LOOKBACK_MS;
  return { since, until };
}

function queryNewContent({ databasePath, since, until }) {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const newsTotal = Number(
      db.prepare("SELECT COUNT(*) AS n FROM news_events WHERE created_at > ? AND created_at <= ?").get(since, until).n
    ) || 0;
    const news = db.prepare(
      "SELECT title, domains_json, source, url, content_path, document_path, created_at "
      + "FROM news_events WHERE created_at > ? AND created_at <= ? ORDER BY created_at DESC LIMIT ?"
    ).all(since, until, MAX_ARCHIVE_NEWS);
    const projects = db.prepare(
      "SELECT name, domain, status, rating, document_path FROM projects "
      + "WHERE created_at > ? AND created_at <= ? ORDER BY created_at DESC"
    ).all(since, until);
    const people = db.prepare(
      "SELECT name, organization, status, document_path FROM people "
      + "WHERE created_at > ? AND created_at <= ? ORDER BY created_at DESC"
    ).all(since, until);
    return { newsTotal, news, projects, people };
  } finally {
    db.close();
  }
}

function digestFiles(libraryRoot, since, until) {
  try {
    const directory = path.join(libraryRoot, "13.认知库", "订阅日报");
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory)
      .filter((name) => name.toLowerCase().endsWith(".md"))
      .map((name) => {
        const filePath = path.join(directory, name);
        const stat = fs.statSync(filePath);
        return { name: digestDisplayTitle(fs.readFileSync(filePath, "utf8"), filePath), path: filePath, mtimeMs: Number(stat.mtimeMs) || 0 };
      })
      .filter((item) => item.mtimeMs > since && item.mtimeMs <= until)
      .sort((left, right) => right.mtimeMs - left.mtimeMs);
  } catch {
    return [];
  }
}

function buildKnowledgeDailyReport({ databasePath, libraryRoot, since, until, mirror, now = new Date() }) {
  const { newsTotal, news, projects, people } = queryNewContent({ databasePath, since, until });
  const digests = digestFiles(libraryRoot, since, until);
  const counts = {
    news: newsTotal,
    digests: digests.length,
    projects: projects.length,
    people: people.length
  };
  const dayKey = localDayKey(now);
  const windowLabel = `覆盖 ${formatWindow(since)} → ${formatWindow(until)}（自上次日报以来的新增）`;

  // —— 归档版（Markdown，进 13.认知库/知识库日报/，随镜像进飞书）——
  const archiveLines = [
    `# domi 知识库日报 — ${dayKey}`,
    "",
    `> ${windowLabel}`,
    ""
  ];
  if (counts.news > 0) {
    archiveLines.push(`## 新增行业认知（${newsTotal} 条）`, "");
    const byDomain = new Map();
    for (const row of news) {
      const domain = parseJsonArray(row.domains_json)[0] || "其他行业";
      if (!byDomain.has(domain)) byDomain.set(domain, []);
      byDomain.get(domain).push(row);
    }
    for (const [domain, rows] of byDomain) {
      archiveLines.push(`### ${domain}（${rows.length} 条）`, "");
      for (const row of rows) {
        const link = mirror.mirroredUrlFor(String(row.content_path || row.document_path || ""));
        const source = String(row.source || "").trim();
        archiveLines.push(
          `- 《${row.title}》${source ? ` — ${source}` : ""}`
          + `${link ? ` · [阅读](${link})` : row.url ? ` · [原文](${row.url})` : ""}`
        );
      }
      archiveLines.push("");
    }
    if (newsTotal > news.length) {
      archiveLines.push(`> 另有 ${newsTotal - news.length} 条未展开，见资料库与飞书镜像。`, "");
    }
  }
  if (digests.length > 0) {
    archiveLines.push(`## 新增订阅日报（${digests.length} 份）`, "");
    for (const digest of digests) {
      const link = mirror.mirroredUrlFor(digest.path);
      archiveLines.push(`- 《${digest.name}》${link ? ` · [阅读](${link})` : ""}`);
    }
    archiveLines.push("");
  }
  if (projects.length > 0) {
    archiveLines.push(`## 新增项目（${projects.length}）`, "");
    for (const project of projects) {
      const link = mirror.mirroredUrlFor(String(project.document_path || ""));
      archiveLines.push(
        `- ${project.name}（${project.domain || "未分类"}${project.status ? ` · ${project.status}` : ""}${project.rating ? ` · ${project.rating}` : ""}）`
        + `${link ? ` · [主页](${link})` : ""}`
      );
    }
    archiveLines.push("");
  }
  if (people.length > 0) {
    archiveLines.push(`## 新增人物（${people.length}）`, "");
    for (const person of people) {
      const link = mirror.mirroredUrlFor(String(person.document_path || ""));
      archiveLines.push(`- ${person.name}${person.organization ? `（${person.organization}）` : ""}${link ? ` · [主页](${link})` : ""}`);
    }
    archiveLines.push("");
  }
  const empty = counts.news === 0 && counts.digests === 0 && counts.projects === 0 && counts.people === 0;
  if (empty) {
    archiveLines.push("自上次日报以来知识库没有新增内容。转发内容到收件箱，或等雷达/订阅自动入库后，会出现在下一份日报。", "");
  }
  archiveLines.push(`---`, `*由 domi 自动生成于 ${formatWindow(now.getTime())}*`);
  const archiveMarkdown = archiveLines.join("\n");

  // —— 群消息版（纯文本 URL；条数和长度封顶防刷屏）——
  const messageLines = [`📚 domi 知识库日报 — ${dayKey}`, windowLabel, ""];
  if (empty) {
    messageLines.push("自上次日报以来知识库没有新增内容。");
  } else {
    const shownNews = news.slice(0, MAX_MESSAGE_NEWS);
    if (counts.news > 0) {
      messageLines.push(`新增行业认知 ${newsTotal} 条：`);
      for (const row of shownNews) {
        const link = mirror.mirroredUrlFor(String(row.content_path || row.document_path || ""));
        const source = String(row.source || "").trim();
        messageLines.push(`- 《${row.title}》${source ? `（${source}）` : ""}`);
        if (link) messageLines.push(`  ${link}`);
      }
      if (newsTotal > shownNews.length) messageLines.push(`- 另有 ${newsTotal - shownNews.length} 条，见资料库/飞书镜像`);
      messageLines.push("");
    }
    if (digests.length > 0) {
      messageLines.push(`新增订阅日报 ${digests.length} 份：`);
      for (const digest of digests.slice(0, 5)) {
        const link = mirror.mirroredUrlFor(digest.path);
        messageLines.push(`- 《${digest.name}》`);
        if (link) messageLines.push(`  ${link}`);
      }
      messageLines.push("");
    }
    if (projects.length > 0) {
      messageLines.push(`新增项目 ${projects.length}：`);
      for (const project of projects) messageLines.push(`- ${project.name}（${project.domain || ""}${project.status ? ` · ${project.status}` : ""}）`);
      messageLines.push("");
    }
    if (people.length > 0) {
      messageLines.push(`新增人物 ${people.length}：`);
      for (const person of people) messageLines.push(`- ${person.name}${person.organization ? `（${person.organization}）` : ""}`);
      messageLines.push("");
    }
    const archiveHint = "完整日报已归档到 13.认知库/知识库日报/，并随镜像进入飞书 Wiki。";
    if (!messageLines.includes(archiveHint)) messageLines.push(archiveHint);
  }
  let messageMarkdown = messageLines.join("\n");
  if (messageMarkdown.length > MESSAGE_MAX_CHARS) {
    messageMarkdown = `${messageMarkdown.slice(0, MESSAGE_MAX_CHARS)}…\n（内容过长已截断，完整版见资料库/飞书镜像）`;
  }

  return { dayKey, windowLabel, counts, archiveMarkdown, messageMarkdown, empty };
}

module.exports = {
  DEFAULT_REPORT_HOUR,
  FIRST_RUN_LOOKBACK_MS,
  buildKnowledgeDailyReport,
  coverageWindow,
  digestFiles,
  formatWindow,
  localDayKey,
  parseJsonArray,
  shouldGenerateDailyReport
};
