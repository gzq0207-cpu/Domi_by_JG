#!/usr/bin/env node
// ============================================================================
// follow-builders 每日自动 digest（含 YouTube 频道跟踪）
// 由 Windows 计划任务每天 09:00 调用（错过会在下次登录时补跑）。
//
// 流程：
//   1. 拉取中央 feed（X 推文 / 播客 / 工程博客，GitHub raw）
//   2. 抓取订阅的 YouTube 频道 /videos 页（domi 依赖的 feeds.xml RSS 端点在本
//      网络环境下 404，但频道页可访问——解析页面内嵌的 ytInitialData JSON）
//   3. 保存待处理内容，使用 GPT-6 Luna／标准智能／标准速度完整翻译
//   4. 校验通过后发布中文日报并镜像到 Domi，再发 Windows 通知
//
// 网络策略：GitHub raw 走显式代理 → 直连 → 官方内容 API；
//           记录每次 HTTP/连接/解析错误，短暂失败重试，校验后的今日缓存兜底。
//           YouTube 用 curl 直连（TUN 模式 VPN）→ curl 代理 127.0.0.1:7897，
//           探测成功后缓存传输方式，后续请求不再重复探测。
//
// YouTube 去重：~/.follow-builders/youtube-seen.json 记录已见 videoId（60 天
// 窗口）。首次运行为"快照模式"：展示各频道最新 3 条并标记全部已见，之后每天
// 只展示真正的新视频。
// ============================================================================

import { mkdir, writeFile, readFile, rename, rm, readdir } from "node:fs/promises";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
const execFileAsync = promisify(execFile);

// -- 配置 ---------------------------------------------------------------------

const USER_DIR = join(homedir(), ".follow-builders");
const DIGEST_DIR = join(USER_DIR, "digests");
const LOG_PATH = join(USER_DIR, "runner.log");
const YT_STATE_PATH = join(USER_DIR, "youtube-seen.json");
const PROXY = "http://127.0.0.1:7897";

// domi 工作台资料库的订阅日报目录：每天把 digest 镜像一份进去，
// 这样 domi 的文档库/订阅视图能直接看到，全文检索也能搜到。
// 镜像失败只记日志，不影响主流程。
const DOMI_PROJECT_DIR = process.env.FOLLOW_BUILDERS_PROJECT_DIR || join(homedir(), "Desktop", "Domi1");
const DOMI_DIGEST_DIR = join(DOMI_PROJECT_DIR, "资料库", "domi工作区", "13.认知库", "订阅日报");
const PENDING_DIGEST_DIR = join(USER_DIR, ".pending-digests");

export async function publishDigest(markdown, dateStr, { publisher = execFileAsync, userDir = USER_DIR, projectDir = DOMI_PROJECT_DIR, digestDir = DIGEST_DIR, mirrorDir = DOMI_DIGEST_DIR } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error("日报日期无效。");
  const config = JSON.parse(await readFile(join(userDir, "config.json"), "utf8"));
  if (config.language !== "zh") throw new Error("当前日报必须使用简体中文，请检查 language 配置。");
  const translationProject = config.translation?.projectDir || projectDir;
  const runtime = join(translationProject, "node_modules", "electron", "dist", "electron.exe");
  const helper = join(translationProject, "scripts", "publish-subscription-digest.cjs");
  const pendingDir = join(userDir, ".pending-digests");
  const sourceFile = join(pendingDir, `${dateStr}.md`);
  const jobFile = join(pendingDir, `${dateStr}.json`);
  await mkdir(pendingDir, { recursive: true });
  await writeFile(sourceFile, markdown, "utf8");
  const filePath = join(digestDir, `AI-Builders-Digest-${dateStr}.md`);
  const mirrorPath = join(mirrorDir, `AI-Builders-Digest-${dateStr}.md`);
  await writeFile(jobFile, JSON.stringify({ input: sourceFile, outputs: [filePath, mirrorPath], stateRoot: join(userDir, "translation") }), "utf8");
  // English never reaches either published copy. On failure the source/job
  // stay in .pending-digests; previous Chinese editions remain available.
  const result = await publisher(runtime, [helper, jobFile], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, windowsHide: true,
    timeout: 30 * 60 * 1000, maxBuffer: 4 * 1024 * 1024, encoding: "utf8"
  });
  const completed = result.stdout.trim().split(/\r?\n/).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).find((entry) => entry?.phase === "published" && entry.ok);
  if (!completed?.receipt?.complete || completed.receipt.model !== "gpt-6-luna" || completed.receipt.reasoningEffort !== "medium") {
    throw new Error("中文日报发布结果未通过校验，待处理内容已保留。");
  }
  await rm(jobFile, { force: true });
  await rm(sourceFile, { force: true });
  return filePath;
}

// 新视频进入持久队列，由当前 ChatGPT 登录连接处理完整字幕、中文摘要和全文翻译。
// 归档回读通过才完成；无人值守任务不运行本地 ASR。
const PENDING_ARCHIVE_PATH = join(USER_DIR, "pending-archive.json");
const COMPLETED_ARCHIVE_HISTORY = 200; // 只裁剪终态历史，未处理项永不丢弃。

export async function queueForChatGPT(collected, queuePath = PENDING_ARCHIVE_PATH, logger = log) {
  const fresh = (collected?.results || [])
    .filter((r) => Array.isArray(r.videos) && !r.blocked && !r.degraded)
    .flatMap((r) => r.videos.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      url: v.url,
      publishedAgo: v.publishedAgo,
      channel: r.channel.name,
      channelHandle: r.channel.handle,
      channelTag: r.channel.tag || ""
    })));
  let state = { version: 1, items: [] };
  try {
    state = JSON.parse(await readFile(queuePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!Array.isArray(state.items)) throw new Error("invalid archive queue format");
  let added = 0;
  const known = new Set(state.items.map((i) => i.videoId));
  for (const video of fresh) {
    if (!known.has(video.videoId)) {
      state.items.push({ ...video, status: "pending", queuedAt: new Date().toISOString() });
      added++;
    }
  }
  if (!fresh.length) return;
  const pendingItems = state.items.filter((item) => item.status !== "done");
  const history = state.items.filter((item) => item.status === "done").slice(-COMPLETED_ARCHIVE_HISTORY);
  state.items = [...history, ...pendingItems];
  await mkdir(join(queuePath, ".."), { recursive: true });
  const temporaryPath = `${queuePath}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(state, null, 2), "utf8");
    await rename(temporaryPath, queuePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
  const pending = state.items.filter((i) => i.status === "pending").length;
  if (added) logger(`queued ${added} video(s) for ChatGPT (${pending} pending total)`);
}

export async function processPendingArchives({ consumer = execFileAsync, userDir = USER_DIR, projectDir = DOMI_PROJECT_DIR, logger = log, notifier = notify } = {}) {
  const config = JSON.parse(await readFile(join(userDir, "config.json"), "utf8"));
  if (config.archive?.enabled === false) return { ok: true, disabled: true };
  logger("ChatGPT archive run start");
  const runtime = join(projectDir, "node_modules", "electron", "dist", "electron.exe");
  const result = await consumer(runtime, [join(projectDir, "scripts", "process-subscription-archives.cjs")], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", FOLLOW_BUILDERS_HOME: userDir },
    windowsHide: true, timeout: 55 * 60 * 1000, maxBuffer: 8 * 1024 * 1024, encoding: "utf8"
  });
  const entries = result.stdout.trim().split(/\r?\n/).map((line) => { try { return JSON.parse(line); } catch { return null; } });
  const completed = entries.findLast((entry) => entry?.phase === "finished");
  if (!completed?.ok) throw new Error("ChatGPT 订阅处理未返回有效执行结果。");
  logger(`ChatGPT archive completed=${completed.completed || 0}, failed=${completed.failed || 0}, remaining=${completed.remaining || 0}`);
  notifyArchiveResult(completed, { notifier });
  return completed;
}

export function notifyArchiveResult(completed, { notifier = notify } = {}) {
  if (completed.remaining && (completed.completed || (completed.newFailures ?? completed.failed))) return notifier("YouTube 订阅归档待处理", `本次完成 ${completed.completed || 0} 个，仍有 ${completed.remaining} 个待处理。`
    + (completed.waitingForBrowser ? `其中 ${completed.waitingForBrowser} 个等待正规浏览器独立补取完整字幕；若原站要求登录，请在保留的 Tabbit 页面正常登录。` : "已完成段落和断点保留，后续继续处理。"));
  if (completed.completed) return notifier("YouTube 订阅已归档", `ChatGPT 已完成 ${completed.completed} 个视频的中文摘要、全文翻译与归档。`);
  return false;
}

const FEEDS = {
  x: "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json",
  podcasts: "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json",
  blogs: "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json"
};

// 跟踪的 YouTube 频道（handle 已逐一验证）。想增删频道改这里即可。
// 注：Latent Space / No Priors / Training Data / Unsupervised Learning 等 AI 播客
// 已由中央 feed 的播客板块覆盖（含转写），不在此重复跟踪。
const YOUTUBE_CHANNELS = [
  { name: "Asianometry", handle: "Asianometry", tag: "半导体/算力硬件" },
  { name: "Chips and Cheese", handle: "ChipsandCheese", tag: "芯片微架构" },
  { name: "TechTechPotato", handle: "TechTechPotato", tag: "芯片行业" },
  { name: "ServeTheHome", handle: "servethehomevideo", tag: "服务器/数据中心" },
  { name: "SemiAnalysis", handle: "semianalysis", tag: "算力研究" },
  { name: "Dwarkesh Patel", handle: "DwarkeshPatel", tag: "AI 访谈" },
  { name: "AI Explained", handle: "ai-explained", tag: "AI 进展评测" },
  { name: "Matt Berman", handle: "matthewberman", tag: "AI 应用/Agent" },
  { name: "Matt Wolfe", handle: "matt_wolfe", tag: "AI 工具" },
  { name: "MLST", handle: "MachineLearningStreetTalk", tag: "AI 研究对谈" },
  { name: "Two Minute Papers", handle: "TwoMinutePapers", tag: "论文速览" },
  { name: "Andrej Karpathy", handle: "AndrejKarpathy", tag: "AI 教育" }
];

const YT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const YT_SEEN_WINDOW_MS = 60 * 24 * 60 * 60 * 1000; // 60 天

const PWSH = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
const CATDESK = join(homedir(), ".catdesk", "bin", "catdesk.ps1");

// -- 工具 ---------------------------------------------------------------------

function log(line) {
  const stamp = new Date().toISOString();
  try {
    appendFileSync(LOG_PATH, `[${stamp}] ${line}\n`, "utf8");
  } catch {
    // 日志失败不影响主流程
  }
}

const feedHash = (text) => createHash("sha256").update(text).digest("hex");
const cstDay = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

export async function fetchJSON(url, { transport = execFileAsync, logger = log,
  cacheDir = join(USER_DIR, "feed-cache"), now = () => new Date(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), attempts = 2 } = {}) {
  const source = new URL(url), parts = source.pathname.split("/").filter(Boolean);
  const field = { "feed-x.json": "x", "feed-podcasts.json": "podcasts", "feed-blogs.json": "blogs" }[parts.at(-1)];
  if (source.hostname !== "raw.githubusercontent.com" || parts.length < 4 || !field) throw new Error("非预期的日报来源地址。");
  const apiUrl = `https://api.github.com/repos/${parts[0]}/${parts[1]}/contents/${parts.slice(3).map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(parts[2])}`;
  const routes = [
    { label: "raw-proxy", url, args: ["--proxy", PROXY] },
    { label: "raw-direct", url, args: ["--noproxy", "*"] },
    { label: "api-proxy", url: apiUrl, args: ["--proxy", PROXY, "-H", "Accept: application/vnd.github.raw+json"] },
    { label: "api-direct", url: apiUrl, args: ["--noproxy", "*", "-H", "Accept: application/vnd.github.raw+json"] }
  ];
  const cachePath = join(cacheDir, `${field}.json`);
  const parse = (text) => {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data[field])) throw new Error(`JSON内容缺少 ${field} 数组`);
    return data;
  };
  const attach = (data, metadata) => { Object.defineProperty(data, "_domiFetch", { value: metadata }); return data; };
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt) await sleep(4000);
    for (const route of routes) {
      try {
        const { stdout } = await transport("curl.exe", ["--fail", "--silent", "--show-error", "--location",
          "--connect-timeout", "6", "--max-time", "12", ...route.args, route.url],
          { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: 15000, windowsHide: true });
        const data = parse(stdout), fetchedAt = now().toISOString();
        // Cache failures must not discard successfully fetched content.
        const temporary = `${cachePath}.${process.pid}.${randomUUID()}.tmp`;
        try {
          await mkdir(cacheDir, { recursive: true });
          await writeFile(temporary, JSON.stringify({ url, fetchedAt, sha256: feedHash(stdout), text: stdout }), "utf8");
          await rename(temporary, cachePath);
        } catch (error) { logger(`feed ${field} cache write failed: ${error.message}`); }
        finally { await rm(temporary, { force: true }).catch(() => {}); }
        logger(`feed ${field} OK route=${route.label} attempt=${attempt + 1} generatedAt=${data.generatedAt || "unknown"}`);
        return attach(data, { fetchedAt, route: route.label, fromCache: false });
      } catch (error) {
        const detail = String(error.stderr || error.message || error).replace(/\s+/g, " ").slice(0, 350);
        logger(`feed ${field} FAILED route=${route.label} attempt=${attempt + 1} code=${error.code || "parse"}: ${detail}`);
      }
    }
  }
  try {
    const cached = JSON.parse(await readFile(cachePath, "utf8"));
    const date = new Date(cached.fetchedAt), age = now().getTime() - date.getTime();
    if (cached.url !== url || age < 0 || age > 6 * 60 * 60 * 1000 || cstDay(date) !== cstDay(now()) || cached.sha256 !== feedHash(cached.text)) throw new Error("缓存过期或校验失败");
    logger(`feed ${field} using verified same-day cache fetchedAt=${cached.fetchedAt}`);
    return attach(parse(cached.text), { fetchedAt: cached.fetchedAt, route: "cache", fromCache: true });
  } catch (error) { logger(`feed ${field} unavailable; cache not used: ${error.message}`); return null; }
}

function localDate() {
  return cstDay(new Date());
}

function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDateTimeCST(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || "");
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).format(d) + " (UTC+8)";
}

function clip(text, max) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

function blockquote(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

// -- 通知 ---------------------------------------------------------------------

function psEscape(value) {
  return String(value).replace(/'/g, "''");
}

function notify(title, message) {
  // 1) catdesk（CatPaw 在运行时的原生通知）
  try {
    execFileSync(PWSH, ["-NoProfile", "-File", CATDESK, "notify", "-t", title, "-m", message], {
      timeout: 20000,
      stdio: "ignore"
    });
    log("notify: catdesk ok");
    return true;
  } catch {
    // 走系统气泡
  }
  // 2) Windows 系统气泡通知（不依赖任何应用）
  try {
    const script =
      "Add-Type -AssemblyName System.Windows.Forms; " +
      "Add-Type -AssemblyName System.Drawing; " +
      "$n = New-Object System.Windows.Forms.NotifyIcon; " +
      "$n.Icon = [System.Drawing.SystemIcons]::Information; " +
      "$n.Visible = $true; " +
      `$n.ShowBalloonTip(10000, '${psEscape(title)}', '${psEscape(clip(message, 220))}', 'Info'); ` +
      "Start-Sleep -Seconds 10; $n.Dispose()";
    execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
      timeout: 40000,
      stdio: "ignore"
    });
    log("notify: balloon ok");
    return true;
  } catch (error) {
    log(`notify: all failed (${error.message})`);
    return false;
  }
}

// -- YouTube 抓取 -------------------------------------------------------------

// 传输方式缓存："direct" | "proxy" | false（不可达）
let ytTransport = null;

function curlYouTube(url, useProxy) {
  return execFileSync("curl.exe", [
    "-s", "--max-time", useProxy ? "25" : "6",
    ...(useProxy ? ["-x", PROXY] : []),
    "-A", YT_UA,
    "-H", "Accept-Language: en-US,en;q=0.9",
    url
  ], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function fetchYouTubeHtml(url) {
  if (ytTransport === false) throw new Error("YouTube unreachable (cached)");
  if (ytTransport === "direct" || ytTransport === "proxy") {
    const html = curlYouTube(url, ytTransport === "proxy");
    if (!html.includes("ytInitialData")) throw new Error("unexpected page (no ytInitialData)");
    return html;
  }
  // 首次探测：先直连（TUN 模式 VPN），失败走代理
  try {
    const html = curlYouTube(url, false);
    if (html.includes("ytInitialData")) {
      ytTransport = "direct";
      return html;
    }
  } catch {
    // 直连失败，尝试代理
  }
  try {
    const html = curlYouTube(url, true);
    if (html.includes("ytInitialData")) {
      ytTransport = "proxy";
      return html;
    }
  } catch {
    // 代理也失败
  }
  ytTransport = false;
  throw new Error("YouTube unreachable (direct and proxy both failed)");
}

// 解析 /videos 页内嵌的 ytInitialData。兼容新旧两种条目结构：
//   新（2025+）：richItemRenderer.content.lockupViewModel
//   旧：        richItemRenderer.content.videoRenderer
// 返回视频数组；返回 null 表示页面结构无法识别（如 consent 墙或 YouTube 改版）。
function parseYouTubeVideos(html) {
  const m = html.match(/var\s+ytInitialData\s*=\s*({[\s\S]*?});\s*<\/script>/);
  if (!m) return null;
  let data;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return null;
  }
  const videos = [];
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  for (const tab of tabs) {
    const grid = tab?.tabRenderer?.content?.richGridRenderer?.contents || [];
    if (!grid.length) continue;
    for (const item of grid) {
      const lv = item?.richItemRenderer?.content?.lockupViewModel;
      if (lv?.contentId && lv?.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
        const meta = lv?.metadata?.lockupMetadataViewModel;
        const parts = meta?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts || [];
        const texts = parts.map((p) => p?.text?.content).filter(Boolean);
        videos.push({
          videoId: lv.contentId,
          title: meta?.title?.content || "",
          views: texts[0] || "",
          publishedAgo: texts[1] || "",
          url: `https://www.youtube.com/watch?v=${lv.contentId}`
        });
        continue;
      }
      const vr = item?.richItemRenderer?.content?.videoRenderer;
      if (vr?.videoId) {
        videos.push({
          videoId: vr.videoId,
          title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || "",
          views: vr.viewCountText?.simpleText || "",
          publishedAgo: vr.publishedTimeText?.simpleText || "",
          url: `https://www.youtube.com/watch?v=${vr.videoId}`
        });
      }
    }
    if (videos.length) break; // 只取第一个有内容的 tab（Videos 标签）
  }
  return videos.filter((v) => v.title);
}

async function loadYouTubeState() {
  try {
    const raw = JSON.parse(await readFile(YT_STATE_PATH, "utf8"));
    const cutoff = Date.now() - YT_SEEN_WINDOW_MS;
    const videos = {};
    for (const [id, seenAt] of Object.entries(raw?.videos || {})) {
      if (Number(seenAt) >= cutoff) videos[id] = Number(seenAt);
    }
    return { videos, existed: true };
  } catch {
    return { videos: {}, existed: false };
  }
}

async function saveYouTubeState(videos) {
  await mkdir(USER_DIR, { recursive: true });
  const temporary = `${YT_STATE_PATH}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify({ videos }, null, 2), "utf8");
    await rename(temporary, YT_STATE_PATH);
  } finally { await rm(temporary, { force: true }); }
}

// 启发式判断频道网格是否被降级：条目很少 + 最新视频超过半年未更新。
// YouTube 对数据中心 IP 有时只返回残缺的旧网格（区别于频道真的停更：
// 停更频道通常仍能返回完整网格，如 ~30 条）。降级频道的新视频会被漏掉，
// 必须显式提醒。
function looksDegraded(videos) {
  if (!videos.length || videos.length > 8) return false;
  // YouTube 的相对时间有全称和缩写两种格式（如 "1 year ago" / "1y ago"），都要兼容
  const m = String(videos[0].publishedAgo || "")
    .match(/(\d+)\s+(seconds?|secs?|s|minutes?|mins?|hours?|hrs?|h|days?|d|weeks?|w|months?|mo|years?|y)\b/i);
  if (!m) return false;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("y")) return true;
  if (unit.startsWith("mo") && n >= 6) return true;
  return false;
}

async function collectYouTube() {
  const state = await loadYouTubeState();
  const snapshotMode = !state.existed;
  const results = [];
  let failures = 0;
  for (const channel of YOUTUBE_CHANNELS) {
    try {
      const html = fetchYouTubeHtml(`https://www.youtube.com/@${channel.handle}/videos`);
      const videos = parseYouTubeVideos(html);
      if (!videos) throw new Error("page structure unrecognized");
      const fresh = videos
        .filter((v) => !state.videos[v.videoId])
        .slice(0, snapshotMode ? 3 : 10);
      // 解析成功但 0 条：几乎必然是 YouTube 对数据中心出口 IP 的按频道软封锁
      const degraded = looksDegraded(videos);
      results.push({ channel, videos: fresh, blocked: videos.length === 0, degraded });
      // 降级页面返回残缺的旧网格，不得把其条目标为已处理。
      if (!degraded) {
        // 快照模式明确跳过历史；正常模式只推进实际进入待入库流程的条目。
        for (const v of snapshotMode ? videos : fresh) state.videos[v.videoId] = Date.now();
      }
      log(`youtube @${channel.handle}: ${videos.length} on page, ${fresh.length} new${videos.length === 0 ? " [SUSPECT BLOCKED]" : ""}${degraded ? " [SUSPECT DEGRADED]" : ""}`);
    } catch (error) {
      failures += 1;
      results.push({ channel, videos: null, error: clip(error.message, 120) });
      log(`youtube @${channel.handle}: FAILED ${error.message}`);
    }
  }
  return { results, snapshotMode, failures, seenVideos: state.videos };
}

// -- 排版 ---------------------------------------------------------------------

export function buildDigest(feedX, feedPodcasts, feedBlogs, dateStr, collected) {
  const builders = Array.isArray(feedX?.x) ? feedX.x : [];
  const podcasts = Array.isArray(feedPodcasts?.podcasts) ? feedPodcasts.podcasts : [];
  const blogs = Array.isArray(feedBlogs?.blogs) ? feedBlogs.blogs : [];
  const totalTweets = builders.reduce((sum, b) => sum + (Array.isArray(b?.tweets) ? b.tweets.length : 0), 0);
  const feedGeneratedAt = feedX?.generatedAt || feedPodcasts?.generatedAt || feedBlogs?.generatedAt;

  // YouTube 汇总
  const ytOk = (collected?.results || []).filter((r) => Array.isArray(r.videos));
  const ytFailed = (collected?.results || []).filter((r) => r.videos === null);
  const ytBlocked = ytOk.filter((r) => r.blocked);
  const ytDegraded = ytOk.filter((r) => r.degraded);
  const ytNewCount = ytOk.reduce((sum, r) => sum + (r.degraded ? 0 : r.videos.length), 0);
  const ytAllFailed = collected && ytOk.length === 0 && ytFailed.length > 0;

  const lines = [];
  lines.push(`# AI 构建者日报 — ${dateStr}`);
  lines.push("");
  lines.push(`> 数据源：follow-builders 中央内容源（生成于 ${fmtDateTimeCST(feedGeneratedAt)}）+ YouTube 频道直抓`);
  lines.push(`> 追踪 26 位 X 上的 AI 构建者、${YOUTUBE_CHANNELS.length} 个 YouTube 频道、6 档 AI 播客、Anthropic/Claude 工程博客。`);
  lines.push("> 新发现的 YouTube 视频会由 ChatGPT 自动读取完整字幕、生成中文摘要并归档；字幕暂不可用的条目会保留待重试。");
  lines.push("");

  // X 动态
  if (totalTweets > 0) {
    lines.push(`## 🐦 X 动态（${builders.length} 位构建者 · ${totalTweets} 条）`);
    lines.push("");
    for (const builder of builders) {
      const tweets = Array.isArray(builder.tweets) ? builder.tweets : [];
      if (!tweets.length) continue;
      lines.push(`### ${builder.name || builder.handle}（@${builder.handle}）`);
      if (builder.bio) lines.push(blockquote(builder.bio));
      lines.push("");
      for (const tweet of tweets) {
        const date = fmtDate(tweet.createdAt);
        const metrics = [
          Number(tweet.likes) > 0 ? `❤️ ${tweet.likes}` : "",
          Number(tweet.retweets) > 0 ? `🔁 ${tweet.retweets}` : ""
        ].filter(Boolean).join(" · ");
        lines.push(`**${date}**${metrics ? `（${metrics}）` : ""} [原文](${tweet.url})`);
        lines.push("");
        lines.push(blockquote(tweet.text));
        lines.push("");
      }
    }
  }

  // YouTube 新视频
  if (ytAllFailed) {
    lines.push("## 📺 YouTube 频道");
    lines.push("");
    lines.push("> ⚠️ 本次未能访问 YouTube（VPN 未开或网络异常），未抓取到更新，明天自动重试。");
    lines.push("");
  } else if (ytNewCount > 0) {
    const modeLabel = collected.snapshotMode ? " · 首次快照" : "";
    lines.push(`## 📺 YouTube 新视频（${ytNewCount} 个${modeLabel}）`);
    if (collected.snapshotMode) {
      lines.push("");
      lines.push("*首次运行：以下为各频道最新 3 条视频的快照，之后每天只列真正的新上传。*");
    }
    lines.push("");
    for (const r of ytOk) {
      if (!r.videos.length || r.degraded) continue;
      const tag = r.channel.tag ? ` — ${r.channel.tag}` : "";
      lines.push(`### ${r.channel.name}${tag}`);
      for (const v of r.videos) {
        const meta = [v.publishedAgo, v.views].filter(Boolean).join(" · ");
        lines.push(`- **${v.title}**${meta ? `（${meta}）` : ""} — [观看](${v.url})`);
      }
      lines.push("");
    }
    if (ytFailed.length || ytBlocked.length || ytDegraded.length) {
      const notes = [];
      if (ytFailed.length) notes.push(`抓取失败：${ytFailed.map((f) => f.channel.name).join("、")}`);
      if (ytBlocked.length) notes.push(`疑似被 YouTube 软封锁：${ytBlocked.map((b) => b.channel.name).join("、")}`);
      if (ytDegraded.length) notes.push(`内容降级仅返回旧视频，新视频可能被漏掉：${ytDegraded.map((d) => d.channel.name).join("、")}`);
      lines.push("> ⚠️ " + notes.join("；") + "。数据中心出口 IP 所致，换 VPN 节点后通常可自动恢复。");
      lines.push("");
    }
  } else if (ytFailed.length || ytBlocked.length || ytDegraded.length) {
    lines.push("## 📺 YouTube 频道");
    lines.push("");
    const notes = [];
    if (ytFailed.length) notes.push(`抓取失败：${ytFailed.map((f) => f.channel.name).join("、")}`);
    if (ytBlocked.length) notes.push(`疑似被 YouTube 软封锁：${ytBlocked.map((b) => b.channel.name).join("、")}`);
    if (ytDegraded.length) notes.push(`内容降级仅返回旧视频：${ytDegraded.map((d) => d.channel.name).join("、")}`);
    lines.push(`> 今日无新视频；${notes.join("；")}。`);
    lines.push("");
  }
  // ytNewCount === 0 且无失败：不生成 YouTube 板块（保持 digest 干净）

  // 播客
  if (podcasts.length > 0) {
    lines.push(`## 📻 播客（${podcasts.length} 期）`);
    lines.push("");
    for (const podcast of podcasts) {
      lines.push(`### ${podcast.name} — ${podcast.title || "未命名单集"}`);
      const meta = [];
      if (podcast.publishedAt) meta.push(`发布：${fmtDate(podcast.publishedAt)}`);
      meta.push(`[收听/观看](${podcast.url})`);
      lines.push(`- ${meta.join(" · ")}`);
      if (podcast.transcript) {
        lines.push(`- 开场摘录：${clip(podcast.transcript, 400)}`);
      }
      lines.push("");
    }
  }

  // 工程博客
  if (blogs.length > 0) {
    lines.push(`## ✍️ 工程博客（${blogs.length} 篇）`);
    lines.push("");
    for (const blog of blogs) {
      lines.push(`### [${blog.title || "未命名文章"}](${blog.url})`);
      const meta = [];
      if (blog.name) meta.push(blog.name);
      if (blog.publishedAt) meta.push(fmtDate(blog.publishedAt));
      if (blog.description) lines.push(`- ${blog.description}`);
      if (meta.length) lines.push(`- ${meta.join(" · ")}`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push(`*由 follow-builders 计划任务自动生成于 ${fmtDateTimeCST(new Date().toISOString())}*`);

  return { markdown: lines.join("\n") + "\n", totalTweets, podcasts: podcasts.length, blogs: blogs.length, youtube: ytNewCount };
}

// -- 主流程 -------------------------------------------------------------------

export async function collectDailySources({ fetchFeeds = () => Promise.all([
  fetchJSON(FEEDS.x), fetchJSON(FEEDS.podcasts), fetchJSON(FEEDS.blogs)
]), collectVideos = collectYouTube, logger = log } = {}) {
  const [feedX, feedPodcasts, feedBlogs] = await fetchFeeds();
  const centralUnavailable = !feedX && !feedPodcasts && !feedBlogs;
  if (centralUnavailable) logger("central feeds unreachable — continue independent YouTube discovery");
  let collected = null;
  try { collected = await collectVideos(); }
  catch (error) { logger(`youtube collect fatal: ${error.message}`); }
  const youtubeReadable = collected?.results?.some((entry) => Array.isArray(entry.videos) && !entry.blocked && !entry.degraded);
  if (centralUnavailable && !youtubeReadable) throw new Error("日报中央内容源与 YouTube 频道均不可达，仍将处理已有订阅队列。");
  const names = ["X动态", "播客", "工程博客"], feeds = [feedX, feedPodcasts, feedBlogs];
  return { feedX, feedPodcasts, feedBlogs, collected, centralUnavailable,
    unavailableSources: names.filter((_, i) => !feeds[i]),
    cachedSources: names.filter((_, i) => feeds[i]?._domiFetch?.fromCache) };
}

export async function resumePendingDigests({ pendingDir = PENDING_DIGEST_DIR, publisher = publishDigest, logger = log } = {}) {
  let pending = [];
  try { pending = await readdir(pendingDir); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const result = { resumedDays: [], failedDays: [] };
  for (const file of pending.filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name)).sort()) {
    const dateStr = file.slice(0, -3);
    try {
      await publisher(await readFile(join(pendingDir, file), "utf8"), dateStr);
      result.resumedDays.push(dateStr);
      logger(`resumed Chinese digest ${dateStr}`);
    } catch (error) {
      result.failedDays.push(dateStr);
      logger(`Chinese digest ${dateStr} still pending: ${String(error.message).slice(-1200)}`);
    }
  }
  return result;
}

export async function discoverDailyWork({ resumeDigests = resumePendingDigests, collectSources = collectDailySources, queueVideos = queueForChatGPT, saveSeen = saveYouTubeState } = {}) {
  // A failed older translation must never suppress today's discovery.
  const pendingDigests = await resumeDigests();
  const sources = await collectSources();
  if (sources.collected && !sources.collected.snapshotMode) await queueVideos(sources.collected);
  // Advance discovery only after the work is durable, regardless of report
  // publication. Otherwise a recovered report leaves the same videos "new".
  if (sources.collected?.seenVideos) await saveSeen(sources.collected.seenVideos);
  return { ...sources, pendingDigests };
}

async function main() {
  log("run start");
  const { feedX, feedPodcasts, feedBlogs, collected, unavailableSources, cachedSources, pendingDigests } = await discoverDailyWork();

  const dateStr = localDate();
  const digest = buildDigest(feedX, feedPodcasts, feedBlogs, dateStr, collected);
  const sourceNotes = [];
  if (unavailableSources.length) sourceNotes.push(`本次${unavailableSources.join("、")}来源访问失败，相关栏目未采集成功；日报仅展示实际取得的内容。`);
  if (cachedSources.length) sourceNotes.push(`${cachedSources.join("、")}采用六小时内取得并通过哈希校验的今日缓存，未确认有后续更新。`);
  if (sourceNotes.length) digest.markdown = digest.markdown.replace(/^(# .+)\n/, `$1\n\n> ${sourceNotes.join(" ")}\n`);

  const pendingError = () => new Error(`日报 ${pendingDigests.failedDays.join("、")} 仍待翻译发布；原文已保留，新视频发现与处理继续运行。`);
  // Preserve the original daily snapshot across retries instead of replacing
  // its newly discovered video list with an empty list from the seen state.
  if (pendingDigests.failedDays.includes(dateStr)) throw pendingError();
  if (pendingDigests.resumedDays.includes(dateStr)) {
    log(`today's Chinese digest ${dateStr} recovered; retain published snapshot`);
    if (pendingDigests.failedDays.length) throw pendingError();
    return;
  }

  if (digest.totalTweets === 0 && digest.podcasts === 0 && digest.blogs === 0 && digest.youtube === 0) {
    log("no new content — skip file, notify only");
    notify("AI 构建者日报", unavailableSources.length ? `已取得的来源没有新增；${unavailableSources.join("、")}尚未核验，未生成日报。` : "今天没有新内容，未生成文件。");
    if (pendingDigests.failedDays.length) throw pendingError();
    return;
  }

  const filePath = await publishDigest(digest.markdown, dateStr);
  log(`saved ${filePath} (x=${digest.totalTweets}, youtube=${digest.youtube}, podcasts=${digest.podcasts}, blogs=${digest.blogs})`);

  log("Chinese digest verified and mirrored into domi library");

  notify(
    unavailableSources.length ? "AI 构建者日报部分生成" : "AI 构建者日报已生成",
    `X 动态 ${digest.totalTweets} 条 · YouTube 新视频 ${digest.youtube} 个 · 播客 ${digest.podcasts} 期 · 博客 ${digest.blogs} 篇\n${filePath}`
  );
  log("run done");
  if (unavailableSources.length) throw new Error(`已发布取得的内容，但${unavailableSources.join("、")}未采集成功，等待任务自动重试。`);
  if (pendingDigests.failedDays.length) throw pendingError();
}

// Consume existing work even on a day without fresh items or with a failed feed.
// The existing Windows task owns both stages, including missed-run catch-up.
export async function runDailyWorkflow({ discover = main, consume = processPendingArchives } = {}) {
  try { return await discover(); }
  finally { await consume(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runDailyWorkflow().catch((error) => {
  log(`fatal: ${error.message}`);
  try {
    notify("AI 构建者日报出错", `脚本异常：${clip(error.message, 180)}`);
  } catch {
    // 通知失败忽略
  }
  process.exit(1);
});
