#!/usr/bin/env node
// domi 收件箱云端查询 worker（关机可查）。
//
// 部署在任意可访问 open.feishu.cn 的常驻环境（轻量 VPS / serverless 定时
// 函数 / 家里常开设备均可，零 npm 依赖，Node >= 18）。职责单一：
//
//   1. /snapshot：接收 domi 本机推送的资料库查询快照（Bearer token）
//   2. 30 秒轮询收件箱群消息（自建应用 bot 身份，tenant token 永不过期）
//   3. 命中「查 X / 日报 / 动态」查询指令 → 用快照作答回群，带镜像链接
//      与「数据截至」标签
//
// 含链接的消息（转发）一律不碰——那属于开着机的 domi。职责切分见仓库
// main.cjs 的 DOMI_QUERY_DELEGATED 开关：云端上线后本机对查询静默。
//
// 环境变量：
//   FEISHU_APP_ID      自建应用的 App ID（open.feishu.cn 创建）
//   FEISHU_APP_SECRET  自建应用的 App Secret
//   FEISHU_CHAT_ID     收件箱群 chat_id（把应用 bot 拉进群后即可轮询）
//   WORKER_TOKEN       /snapshot 上传口令（domi 侧 DOMI_QUERY_WORKER_TOKEN 同值）
//   PORT               监听端口，默认 42111
//   STATE_DIR          状态与快照目录，默认当前目录

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const API_BASE = "https://open.feishu.cn/open-apis";
const POLL_INTERVAL_MS = 30_000;
// 首次启动只处理最近 10 分钟内的消息，避免把历史积压全部补答一遍。
const FIRST_RUN_MAX_AGE_SECONDS = 600;
const MAX_PROCESSED_IDS = 500;
const MAX_SNAPSHOT_BYTES = 20 * 1024 * 1024;
const ANSWER_NEWS_LIMIT = 5;
const ANSWER_PROJECT_LIMIT = 3;
const ANSWER_PEOPLE_LIMIT = 3;

function excerpt(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const limit = Number(maxLength) || 90;
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

// 与 electron/intake-feishu.cjs 的 parseInboxQuery 保持同步；
// scripts/feishu-query-worker.test.cjs 有两份实现的契约测试。
// 云端没有本地库会话：「续读」与深度问答由桌面 domi 在线时作答，
// 云端只作说明与快照快速检索，不借快照冒充深度问答。
function parseInboxQuery(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  if (/https?:\/\/\S/i.test(trimmed)) return null;
  if (/^(?:订阅)?日报$/.test(trimmed)) return { kind: "digest", keyword: "" };
  if (/^(行业)?动态$/.test(trimmed)) return { kind: "news", keyword: "" };
  const searchMatch = trimmed.match(/^(?:查|查询|search)\s+(.{1,60})$/i);
  if (searchMatch) {
    const keyword = searchMatch[1].trim();
    if (keyword) return { kind: "search", keyword };
  }
  const continueMatch = trimmed.match(/^(?:续读|继续读)\s*([1-9]\d?)$/);
  if (continueMatch) return { kind: "continue", keyword: continueMatch[1] };
  const explicitQuestion = trimmed.match(/^(?:问问?|deep)\s*(?:[:：,，]\s*|\s+)(.{2,500})$/i);
  const questionText = explicitQuestion
    ? explicitQuestion[1].trim()
    : (trimmed.length >= 6 && trimmed.length <= 500 && /[?？]$/.test(trimmed) ? trimmed : "");
  if (questionText) return { kind: "question", keyword: questionText.slice(0, 200) };
  return null;
}

function messageText(item) {
  if (String(item?.msg_type || "").toLowerCase() !== "text") return "";
  try {
    const parsed = JSON.parse(item?.body?.content || "{}");
    return typeof parsed?.text === "string" ? parsed.text : "";
  } catch {
    return "";
  }
}

class FeishuClient {
  constructor({ appId, appSecret, fetchImpl = fetch }) {
    this.appId = String(appId || "");
    this.appSecret = String(appSecret || "");
    this.fetchImpl = fetchImpl;
    this.tokenValue = "";
    this.tokenExpireAt = 0;
  }

  async tenantToken() {
    const now = Date.now();
    if (this.tokenValue && now < this.tokenExpireAt - 60_000) return this.tokenValue;
    const response = await this.fetchImpl(`${API_BASE}/auth/v3/tenant_access_token/internal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret })
    });
    const data = await response.json().catch(() => ({}));
    if (!data?.tenant_access_token) {
      throw new Error(`获取 tenant_access_token 失败：${JSON.stringify(data).slice(0, 200)}`);
    }
    this.tokenValue = data.tenant_access_token;
    this.tokenExpireAt = now + (Number(data.expire) || 3600) * 1000;
    return this.tokenValue;
  }

  async request(method, urlPath, body) {
    const token = await this.tenantToken();
    const response = await this.fetchImpl(`${API_BASE}${urlPath}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.code !== 0) {
      throw new Error(`飞书 API ${urlPath} 失败：HTTP ${response.status} ${JSON.stringify(data).slice(0, 200)}`);
    }
    return data;
  }

  async listMessages(chatId, startTimeSec) {
    const urlPath = `/im/v1/chats/${encodeURIComponent(chatId)}/messages?page_size=20&start_time=${startTimeSec}`;
    const data = await this.request("GET", urlPath);
    return Array.isArray(data?.data?.items) ? data.data.items : [];
  }

  async reply(messageId, text) {
    return this.request("POST", `/im/v1/messages/${encodeURIComponent(messageId)}/reply`, {
      msg_type: "text",
      content: JSON.stringify({ text })
    });
  }
}

// 答案格式与 domi 主进程 answerInboxQuery 同构，额外附加数据截至标签。
function formatNewsRow(item) {
  const domains = (item.domains || []).join("／") || "未分类";
  const published = String(item.publishedAt || "").slice(0, 10);
  const lines = [
    `【${item.title}】`,
    `${domains}${published ? ` · ${published}` : ""}`,
    excerpt(item.summary, 90)
  ];
  if (item.mirrorUrl) lines.push(`阅读全文：${item.mirrorUrl}`);
  else if (item.url) lines.push(`原文：${item.url}`);
  return lines.join("\n");
}

function buildAnswer(query, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.news)) {
    return "云端资料库快照暂不可用：domi 本机尚未推送过数据。电脑下次开机后会自动同步。";
  }
  const generatedAt = String(snapshot.generatedAt || "").replace("T", " ").slice(0, 16);
  const freshness = generatedAt ? `\n\n（数据截至 ${generatedAt}，由 domi 本机推送）` : "";
  let body = "";
  if (query?.kind === "digest") {
    const latest = (snapshot.digests || [])[0];
    body = latest && latest.url
      ? `最新订阅日报：《${latest.name}》\n阅读：${latest.url}`
      : latest
        ? `最新订阅日报：《${latest.name}》（尚未镜像到飞书）`
        : "还没有生成订阅日报。";
  } else if (query?.kind === "news") {
    const rows = (snapshot.news || []).slice(0, ANSWER_NEWS_LIMIT).map(formatNewsRow);
    body = rows.length
      ? [`最近行业动态（${rows.length} 条）：`, "", ...rows].join("\n\n")
      : "资料库还没有行业动态。";
  } else if (query?.kind === "question") {
    // 云端快照只有实体/动态摘要字段，不能支撑原文问答；如实说明边界。
    const keyword = excerpt(query.keyword, 40);
    body = [
      `「${keyword}」是基于本地资料库的深度问答，需要桌面 domi 在线时检索原文并由模型作答（附来源引用）。`,
      "云端只有快速检索快照；可发「查 关键词」快速查询，或等电脑端的 domi 开机后重发问题。"
    ].join("\n");
  } else if (query?.kind === "continue") {
    body = "「续读」依赖桌面 domi 的本地资料会话（约 2 小时内有效）；电脑开机后重新发一次问题即可重建会话。";
  } else if (query?.kind === "search" && query.keyword) {
    const keyword = query.keyword.toLowerCase();
    const newsHits = (snapshot.news || []).filter((item) =>
      `${item.title}\n${item.summary}\n${item.companies}`.toLowerCase().includes(keyword)).slice(0, ANSWER_NEWS_LIMIT);
    const projectHits = (snapshot.projects || []).filter((item) =>
      `${item.name}\n${item.notes}`.toLowerCase().includes(keyword)).slice(0, ANSWER_PROJECT_LIMIT);
    const peopleHits = (snapshot.people || []).filter((item) =>
      `${item.name}\n${item.organization}`.toLowerCase().includes(keyword)).slice(0, ANSWER_PEOPLE_LIMIT);
    const sections = [];
    for (const project of projectHits) {
      sections.push([
        `【项目】${project.name}`,
        `${project.domain || "未分类"} · ${project.status || ""}${project.rating ? ` · ${project.rating}` : ""}`.trim(),
        excerpt(project.notes, 70),
        project.mirrorUrl ? `主页：${project.mirrorUrl}` : ""
      ].filter(Boolean).join("\n"));
    }
    for (const person of peopleHits) {
      sections.push([
        `【人物】${person.name}${person.organization ? `（${person.organization}）` : ""}`,
        person.status || "",
        person.mirrorUrl ? `主页：${person.mirrorUrl}` : ""
      ].filter(Boolean).join("\n"));
    }
    sections.push(...newsHits.map(formatNewsRow));
    body = sections.length
      ? [`「${query.keyword}」检索结果（${sections.length} 条）：`, "", ...sections].join("\n\n")
      : `没有找到与「${query.keyword}」相关的项目、人物或行业动态。换个关键词试试，或直接把相关内容转发进来。`;
  }
  if (!body) return "";
  return `${body}${freshness}`;
}

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function createPoller({ client, chatId, snapshotPath, statePath, now = () => Date.now() }) {
  async function pollOnce() {
    const state = loadJson(statePath, { lastTimeSec: 0, processed: [] });
    const processed = new Set(state.processed || []);
    const nowSec = Math.floor(now() / 1000);
    const startTimeSec = Number(state.lastTimeSec) > 0
      ? Number(state.lastTimeSec)
      : nowSec - FIRST_RUN_MAX_AGE_SECONDS;
    const items = await client.listMessages(chatId, startTimeSec);
    let latestSec = Number(state.lastTimeSec) || 0;
    for (const item of items) {
      const messageId = String(item?.message_id || "");
      const createTimeSec = Number(item?.create_time || 0);
      if (!messageId || !createTimeSec) continue;
      if (createTimeSec > latestSec) latestSec = createTimeSec;
      if (processed.has(messageId)) continue;
      // 跳过 bot 自己的回复与话题内回复。
      if (String(item?.sender?.sender_type || "") === "app" || item?.reply_to) {
        processed.add(messageId);
        continue;
      }
      processed.add(messageId);
      const query = parseInboxQuery(messageText(item));
      if (!query) continue; // 转发等非查询消息：留给开着机的 domi，云端不碰
      const answer = buildAnswer(query, loadJson(snapshotPath, null));
      if (answer) await client.reply(messageId, answer);
    }
    saveJson(statePath, {
      lastTimeSec: latestSec || startTimeSec,
      processed: [...processed].slice(-MAX_PROCESSED_IDS)
    });
  }
  return { pollOnce };
}

function startSnapshotServer({ port, token, snapshotPath }) {
  const server = http.createServer((request, response) => {
    const send = (statusCode, payload) => {
      const body = JSON.stringify(payload);
      response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
      response.end(body);
    };
    if (request.method === "GET" && request.url.split("?")[0] === "/health") {
      const snapshot = loadJson(snapshotPath, null);
      send(200, { ok: true, generatedAt: snapshot?.generatedAt || "" });
      return;
    }
    if (request.method === "POST" && request.url.split("?")[0] === "/snapshot") {
      const provided = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token || provided !== token) {
        send(401, { ok: false, error: "缺少或错误的上传口令。" });
        return;
      }
      const chunks = [];
      let total = 0;
      request.on("data", (chunk) => {
        total += chunk.length;
        if (total > MAX_SNAPSHOT_BYTES) {
          send(413, { ok: false, error: "快照超过 20MB 限制。" });
          request.destroy();
          return;
        }
        chunks.push(chunk);
      });
      request.on("end", () => {
        try {
          const body = Buffer.concat(chunks).toString("utf8");
          const parsed = JSON.parse(body);
          if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.news)) {
            throw new Error("快照结构不合法");
          }
          const temporary = `${snapshotPath}.tmp`;
          fs.writeFileSync(temporary, body, "utf8");
          fs.renameSync(temporary, snapshotPath);
          send(200, { ok: true, generatedAt: parsed.generatedAt || "" });
        } catch (error) {
          send(400, { ok: false, error: error instanceof Error ? error.message : String(error) });
        }
      });
      return;
    }
    send(404, { ok: false, error: "未知路径" });
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

async function main() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const chatId = process.env.FEISHU_CHAT_ID;
  const missing = ["FEISHU_APP_ID", "FEISHU_APP_SECRET", "FEISHU_CHAT_ID"]
    .filter((key) => !String(process.env[key] || "").trim());
  if (missing.length) {
    console.error(`缺少环境变量：${missing.join("、")}。参见文件头注释。`);
    process.exit(1);
  }
  const stateDir = path.resolve(process.env.STATE_DIR || ".");
  const snapshotPath = path.join(stateDir, "domi-query-snapshot.json");
  const statePath = path.join(stateDir, "poller-state.json");
  const port = Number(process.env.PORT) || 42111;
  const workerToken = String(process.env.WORKER_TOKEN || "").trim();
  const client = new FeishuClient({ appId, appSecret });
  await startSnapshotServer({ port, token: workerToken, snapshotPath });
  console.log(`snapshot endpoint: http://0.0.0.0:${port}/snapshot（口令${workerToken ? "已启用" : "未设置——务必配置 WORKER_TOKEN"}）`);
  const poller = createPoller({ client, chatId, snapshotPath, statePath });
  const tick = async () => {
    try {
      await poller.pollOnce();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] poll failed: ${error instanceof Error ? error.message : error}`);
    }
  };
  await tick();
  const timer = setInterval(tick, POLL_INTERVAL_MS);
  timer.unref?.();
  console.log(`polling chat ${chatId} every ${POLL_INTERVAL_MS / 1000}s`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("worker fatal:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  FeishuClient,
  buildAnswer,
  createPoller,
  excerpt,
  formatNewsRow,
  messageText,
  parseInboxQuery,
  startSnapshotServer
};
