const { execFile } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Feishu/Lark inbox poller for the domi intake pipeline.
//
// Phone workflow: see an article in WeChat/Substack -> share or paste the link
// into the dedicated "domi 收件箱" group chat -> this poller picks it up within
// POLL_INTERVAL_MS -> the renderer opens a task (same path as the bookmarklet)
// -> a confirmation reply appears in the chat.
//
// The poller shells out to the official `lark-cli` (user identity) instead of
// talking to Feishu APIs directly, so credentials, scopes and token refresh
// stay entirely inside lark-cli's own secure storage.

const POLL_INTERVAL_MS = 30_000;
const DEFAULT_INBOX_NAME = "domi 收件箱";
const MAX_MESSAGE_AGE_MS = 10 * 60_000;
// Full-width CJK brackets/quotes are excluded from URLs because our own
// confirmation replies wrap the link like 《https://...》; without this the
// poller would re-ingest its own replies and loop forever.
const URL_PATTERN = /https?:\/\/[^\s"'<>【】《》〈〉（）()「」『』，。；、！？]+/i;
// File messages are downloaded through lark-cli into a private folder under
// the app's userData. The accepted set mirrors the desktop composer's file
// picker (PDF/Office documents, spreadsheets, images, audio and video) so the
// Feishu inbox and the workbench composer stay in parity; anything else gets
// an explicit rejection reply instead of silence.
const INTAKE_FILE_EXTENSIONS = new Set([
  ".pdf",
  ".doc", ".docx", ".xls", ".xlsx", ".csv", ".ppt", ".pptx",
  ".md", ".txt", ".json", ".srt", ".vtt",
  ".png", ".jpg", ".jpeg", ".webp", ".heic", ".gif", ".bmp",
  ".mp3", ".m4a", ".wav", ".mp4", ".mov"
]);
// Feishu native image messages (msg_type "image") carry only an image_key;
// they are downloaded with --type image and the actual file name comes from
// what lark-cli saved on disk.
const INTAKE_IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".heic", ".gif", ".bmp"
]);
const REJECTED_TYPE_HINT = "PDF、Word/PPT/Excel、图片、音视频等常见格式";
const MAX_INTAKE_FILE_BYTES = 100 * 1024 * 1024;
const INTAKE_FILE_DOWNLOAD_TIMEOUT_MS = 120_000;

function defaultLarkCliCandidates() {
  const names = process.platform === "win32" ? ["lark-cli.exe"] : ["lark-cli"];
  const roots = [
    path.join(os.homedir(), ".local", "share", "domi", "lark-cli"),
    path.join(os.homedir(), ".local", "bin"),
    path.join(process.env.APPDATA || "", "npm")
  ];
  return roots.flatMap((root) => names.map((name) => path.join(root, name)));
}

function resolveLarkCli(extraCandidates = []) {
  for (const candidate of [...extraCandidates, ...defaultLarkCliCandidates()]) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // keep looking
    }
  }
  return null;
}

function extractFirstUrl(text) {
  const match = String(text || "").match(URL_PATTERN);
  return match ? match[0] : "";
}

// Feishu file messages: msg_type "file" with body.content JSON holding
// {file_key, file_name}. Native image messages: msg_type "image" with
// {image_key} and no file name. Returns null for anything else.
function fileMessageDescriptor(message) {
  const msgType = String(message?.msg_type || "").toLowerCase();
  if (msgType !== "file" && msgType !== "image") return null;
  const rawContent = message?.body?.content ?? message?.content ?? "";
  let parsed = {};
  if (typeof rawContent === "string") {
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return null;
    }
  } else if (rawContent && typeof rawContent === "object") {
    parsed = rawContent;
  }
  if (msgType === "image") {
    const imageKey = String(parsed?.image_key || "");
    if (!imageKey) return null;
    // The real file name/extension is only known after lark-cli saves the
    // image to disk, so start with a placeholder and resolve it later.
    return { fileKey: imageKey, fileName: "", resourceType: "image" };
  }
  const fileKey = String(parsed?.file_key || "");
  const fileName = String(parsed?.file_name || "");
  if (!fileKey || !fileName) return null;
  return { fileKey, fileName, resourceType: "file" };
}

function sanitizeFileName(name) {
  const base = String(name || "").replace(/[\\/:*?"<>|\r\n\t]+/g, "_").trim();
  return base.slice(0, 120) || "file.pdf";
}

// CatPaw intake mode marker (kept in sync with main.cjs): when present,
// forwarded items are queued for the local assistant instead of opening a
// domi workbench task, so the confirmation reply should say so.
function catpawIntakeModeEnabled() {
  try {
    return fs.existsSync(path.join(os.homedir(), ".domi", "catpaw-intake.enabled"));
  } catch {
    return false;
  }
}

function messagePlainText(message) {
  // Feishu text messages arrive as {"msg_type":"text","body":{"content":"{\"text\":\"...\"}"}}
  // where content itself is a JSON string. Rich post messages contain anchors
  // with hrefs; the plain text extraction covers both.
  try {
    const body = message?.body || message?.msg_body || {};
    const rawContent = body.content ?? message?.content ?? "";
    let content = rawContent;
    if (typeof content === "string" && content.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed.text === "string") content = parsed.text;
      } catch {
        // keep raw string (post messages etc.)
      }
    }
    if (typeof content !== "string") content = JSON.stringify(content);
    return content;
  } catch {
    return "";
  }
}

function parseFeishuTime(value) {
  // Feishu message lists return create_time like "2026-09-04 17:06" (local
  // time string). Convert to epoch ms; NaN when unparseable.
  const text = String(value || "").trim();
  if (!text) return NaN;
  if (/^\d+$/.test(text)) return Number(text) * 1000;
  const parsed = Date.parse(text.replace(" ", "T"));
  return Number.isFinite(parsed) ? parsed : NaN;
}

// 方案 B：收件箱查询指令。消息以「查/查询 + 关键词」发起资料库检索，
// 或用「日报」「动态」直接拉取最近内容。命中后不走转发链路，由 onQuery
// 回调查本地库并把摘要回复到群里（纯 SQL，零 AI 消耗）；电脑关机时消息
// 照常存在飞书，开机后轮询补答。含链接的消息不识别为指令，避免与转发冲突。
//
// 方案 C：深度问答与续读。「问 …」或以？结尾的自然语言问题触发本地库
// 原文检索（与桌面 Codex/CLI 共用同一套 LibrarySession 检索、章节展开与
// 覆盖记录）；「续读 n」在同一会话内继续读上一轮第 n 个来源。与「查 关
// 键词」的快速 SQL 检索明确区分：question 返回的是原文摘录与覆盖说明，
// 不做模型生成，不宣称结论成立。
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
  // 「问」前缀必须带分隔符（空格/冒号/逗号），避免「问题反馈…」等普通消息误触发。
  const explicitQuestion = trimmed.match(/^(?:问问?|deep)\s*(?:[:：,，]\s*|\s+)(.{2,500})$/i);
  const questionText = explicitQuestion
    ? explicitQuestion[1].trim()
    : (trimmed.length >= 6 && trimmed.length <= 500 && /[?？]$/.test(trimmed) ? trimmed : "");
  if (questionText) return { kind: "question", keyword: questionText.slice(0, 200) };
  return null;
}

function inboxExcerpt(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const limit = Number(maxLength) || 200;
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

// 深度问答回复：只呈现检索命中的原文片段、读取范围与覆盖缺口，不生成结论。
// mirrorLink 由调用方（主进程）解析本地路径到飞书镜像链接。
function buildInboxQuestionReply(question, sources, warnings = [], options = {}) {
  const mirrorLink = options.mirrorLink || (() => "");
  const title = inboxExcerpt(question, 40);
  if (!sources.length) {
    return [
      `「${title}」本地库检索没有命中原文。`,
      "这不代表资料库一定没有相关内容：索引可能未建全，或问题只匹配摘要字段。",
      "可换关键词发「查 关键词」，或在电脑端打开 domi 继续深问。"
    ].join("\n");
  }
  const blocks = [`「${title}」本地库原文检索（${sources.length} 个来源，已展开相关章节）：`];
  for (const [index, source] of sources.slice(0, 4).entries()) {
    const date = source.date ? ` · ${source.date}` : "";
    const coverage = source.totalChars
      ? `已读 ${source.coveredChars || source.content?.length || 0}/${source.totalChars} 字`
      : "";
    const link = mirrorLink(source.path || "");
    blocks.push([
      `【${index + 1}】${source.title || source.relativePath || "资料"}${date}`,
      source.content ? inboxExcerpt(source.content, 200) : "（命中但未展开正文，可续读）",
      [coverage, link ? `阅读：${link}` : ""].filter(Boolean).join("；")
    ].filter(Boolean).join("\n"));
  }
  const coverageNotes = [...new Set(warnings)].slice(0, 2);
  if (coverageNotes.length) blocks.push(`覆盖说明：${coverageNotes.join(" ")}`);
  if (sources.length > 4) blocks.push(`其余 ${sources.length - 4} 个命中来源未展示，可发送「续读 序号」逐个查看。`);
  blocks.push("发送「续读 序号」继续读对应来源；「查 关键词」仍是快速检索。");
  return blocks.join("\n\n");
}

// 续读回复：同一 LibrarySession 会话内继续读原文，版本变化会被拒绝。
function buildInboxContinueReply(index, source, document, options = {}) {
  const mirrorLink = options.mirrorLink || (() => "");
  if (!document || !document.ok) {
    return `续读失败：${document?.error || "本地资料会话已过期（约 2 小时），请重新发一次问题。"}`;
  }
  const title = source?.title || source?.relativePath || "资料";
  const link = mirrorLink(source?.path || "");
  const more = document.nextCursor ? "仍有未读内容，可再发「续读 序号」继续。" : "这份资料本轮已读完。";
  return [
    `【${index}】${title} 续读（第 ${document.startLine}-${document.endLine} 行${document.pages?.length ? `，第 ${document.pages.join("、")} 页` : ""}）：`,
    inboxExcerpt(document.content, 600),
    [link ? `阅读：${link}` : "", more].filter(Boolean).join("\n")
  ].filter(Boolean).join("\n");
}

class FeishuIntakePoller {
  constructor(options = {}) {
    const {
      larkCliPath = resolveLarkCli(options.larkCliCandidates),
      statePath = "",
      onItem = () => {},
      pollIntervalMs = POLL_INTERVAL_MS,
      inboxName = DEFAULT_INBOX_NAME,
      logger = () => {},
      execFileImpl = execFile,
      filesDir = ""
    } = options;
    this.larkCliPath = larkCliPath;
    this.statePath = statePath;
    this.onItem = onItem;
    // 方案 B：查询指令回调（可选）。返回 Promise；由 main 进程查本地库并回复群里。
    this.onQuery = options.onQuery || null;
    this.pollIntervalMs = pollIntervalMs;
    this.inboxName = inboxName;
    this.logger = logger;
    this.execFileImpl = execFileImpl;
    this.filesDir = String(filesDir || "");
    this.timer = null;
    this.stopping = false;
    this.polling = false;
    this.chatId = "";
    this.lastMessageTime = "";
    this.processedMessageIds = new Set();
    this.retryAttempts = {};
    this.authGapLogged = false;
    this.lastPollFailureSignature = null;
    this.pollFailureCount = 0;
  }

  loadState() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.statePath, "utf8"));
      this.chatId = String(raw.chatId || "");
      this.lastMessageTime = String(raw.lastMessageTime || "");
      for (const id of raw.processedMessageIds || []) this.processedMessageIds.add(String(id));
      this.retryAttempts = raw.retryAttempts && typeof raw.retryAttempts === "object" ? raw.retryAttempts : {};
      // Bound the dedupe set so a long-lived poller does not grow forever.
      if (this.processedMessageIds.size > 500) {
        this.processedMessageIds = new Set([...this.processedMessageIds].slice(-500));
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw new Error(`飞书收件箱状态读取失败：${error.message}`);
    }
  }

  saveState() {
    fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
    const temporaryPath = `${this.statePath}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(temporaryPath, `${JSON.stringify({
        chatId: this.chatId,
        lastMessageTime: this.lastMessageTime,
        processedMessageIds: [...this.processedMessageIds].slice(-500),
        retryAttempts: this.retryAttempts
      }, null, 2)}\n`, { encoding: "utf8" });
      fs.renameSync(temporaryPath, this.statePath);
    } finally {
      fs.rmSync(temporaryPath, { force: true });
    }
  }

  async run(command, args, execOptions = {}) {
    return new Promise((resolve) => {
      this.execFileImpl(this.larkCliPath, [command, ...args], {
        encoding: "utf8",
        timeout: 30_000,
        windowsHide: true,
        ...execOptions
      }, (error, stdout) => resolve({ ok: !error, stdout: String(stdout || ""), error }));
    });
  }

  async downloadFileMessage(messageId, descriptor) {
    if (!this.filesDir) {
      return { ok: false, error: "domi 尚未配置文件收件目录，请改为在对话里直接发送文件。" };
    }
    const dir = path.join(this.filesDir, String(messageId || "unknown"));
    fs.mkdirSync(dir, { recursive: true });
    const resourceType = descriptor.resourceType === "image" ? "image" : "file";
    // Native image messages have no file name: the extension is only known
    // after the download, so request a placeholder and resolve the real
    // name from what lark-cli produced on disk.
    const fileName = sanitizeFileName(
      descriptor.fileName || `收件箱图片-${String(messageId || "image").slice(-8)}`
    );
    const result = await this.run("im", [
      "+messages-resources-download",
      "--message-id", String(messageId),
      "--file-key", descriptor.fileKey,
      "--type", resourceType,
      "--output", resourceType === "image" ? path.basename(fileName, path.extname(fileName)) : fileName
    ], { cwd: dir, timeout: INTAKE_FILE_DOWNLOAD_TIMEOUT_MS });
    if (!result.ok) {
      this.logger(`feishu-intake file download failed: ${result.error?.message || "unknown"}`);
      return { ok: false, error: "文件下载失败，请稍后重发，或改为在 domi 对话里直接发送。" };
    }
    // The CLI reports the saved path in its JSON output; fall back to the
    // requested name, then to the only file in the message directory.
    let downloadedPath = "";
    try {
      const parsed = JSON.parse(result.stdout);
      const reported = parsed?.data?.file_path || parsed?.data?.path || parsed?.data?.local_path || parsed?.data?.saved_path;
      if (reported) downloadedPath = path.resolve(dir, String(reported));
    } catch {
      // fall back below
    }
    if (!downloadedPath || !fs.existsSync(downloadedPath)) {
      downloadedPath = path.join(dir, fileName);
    }
    if (!fs.existsSync(downloadedPath)) {
      const produced = fs.readdirSync(dir).map((name) => path.join(dir, name));
      if (produced.length === 1) downloadedPath = produced[0];
    }
    if (!fs.existsSync(downloadedPath)) {
      return { ok: false, error: "文件下载失败，请稍后重发，或改为在 domi 对话里直接发送。" };
    }
    const stat = fs.statSync(downloadedPath);
    if (stat.size <= 0) {
      return { ok: false, error: "收到的文件是空的，请检查后重发。" };
    }
    if (stat.size > MAX_INTAKE_FILE_BYTES) {
      fs.rmSync(downloadedPath, { force: true });
      return { ok: false, error: `文件超过 ${Math.round(MAX_INTAKE_FILE_BYTES / (1024 * 1024))} MB 限制，请压缩后再发。` };
    }
    return {
      ok: true,
      filePath: downloadedPath,
      // For native image messages the on-disk name (with its real extension)
      // is authoritative; the placeholder requested from the CLI has none.
      fileName: resourceType === "image"
        ? path.basename(downloadedPath) || fileName
        : descriptor.fileName,
      bytes: stat.size
    };
  }

  async authReady() {
    const result = await this.run("auth", ["status", "--json"]);
    if (!result.ok) return false;
    try {
      const status = JSON.parse(result.stdout);
      // The inbox poller runs entirely on the user identity: chat-list,
      // chat-messages-list and messages-reply are user APIs. When the user
      // token is missing, lark-cli silently falls back to the bot identity,
      // which cannot read group history (230027) and may not even be a chat
      // member (230002). Detect the gap here and stay dormant — matching the
      // "auth check only until the user connects lark-cli" design — instead
      // of hammering a call that can never succeed.
      const userIdentity = status?.identities?.user;
      if (userIdentity && typeof userIdentity === "object") {
        const userReady = userIdentity.status === "ready" || userIdentity.available === true;
        if (!userReady) {
          this.noteAuthGap();
          return false;
        }
        this.authGapLogged = false;
        return true;
      }
      return Boolean(status.ok !== false && (status.logged_in ?? status.loggedIn ?? true));
    } catch {
      return false;
    }
  }

  noteAuthGap() {
    // Log once per auth gap, not once per 30s tick: the 2026-10 incident
    // flooded the runtime log with 1,600+ identical failures over 8 days
    // while the real cause (expired user token) stayed invisible in the noise.
    if (this.authGapLogged) return;
    this.authGapLogged = true;
    this.logger(
      "feishu-intake paused: 飞书用户身份未授权（令牌缺失或已过期），收件箱轮询暂停。" +
      "请在 domi 设置的飞书连接中重新完成授权；授权恢复后会自动补处理收件箱里的未读消息。"
    );
  }

  reportPollFailure(errorText) {
    const signature = String(errorText || "unknown").slice(0, 200);
    if (signature !== this.lastPollFailureSignature) {
      this.lastPollFailureSignature = signature;
      this.pollFailureCount = 1;
      this.logger(`feishu-intake poll failed: ${signature}`);
      return;
    }
    this.pollFailureCount += 1;
    // The same failure repeats every poll interval; resurface it only every
    // 20th occurrence (~10 minutes at the default 30s interval).
    if (this.pollFailureCount % 20 === 0) {
      this.logger(`feishu-intake poll still failing (x${this.pollFailureCount}): ${signature}`);
    }
  }

  async ensureInboxChat() {
    // Private chats are not indexed by chat-search, so enumerate the user's own
    // chats and match by exact name. Reuse an existing inbox so the user can
    // re-create the group on a new machine without code changes.
    const search = await this.run("im", ["+chat-list", "--json"]);
    if (search.ok) {
      try {
        const parsed = JSON.parse(search.stdout);
        const items = parsed?.data?.chats || parsed?.items || parsed?.chats || [];
        const hit = items.find((item) => item?.name === this.inboxName);
        if (hit?.chat_id) {
          this.chatId = hit.chat_id;
          this.saveState();
          return true;
        }
      } catch {
        // fall through to create
      }
    }
    const create = await this.run("im", [
      "+chat-create", "--name", this.inboxName,
      "--description", "domi 一键转发收件箱：把文章链接或 PDF/图片/Excel 等文件发到这里，domi 会自动整理",
      "--json"
    ]);
    if (!create.ok) {
      this.logger(`feishu-intake inbox create failed: ${create.error?.message || create.stdout}`);
      return false;
    }
    let chatId = "";
    try {
      const created = JSON.parse(create.stdout);
      chatId = String(created?.data?.chat_id || created?.chat_id || "");
    } catch {
      chatId = String(create.stdout).trim().replace(/^["']|["']$/g, "");
    }
    if (!chatId) return false;
    this.chatId = chatId;
    // Persist the binding right away: the 230002 self-heal path clears the
    // stored chatId before re-resolving, and a crash between resolution and
    // the first processed message would otherwise repeat the lookup (or
    // create a duplicate inbox) on every restart.
    this.saveState();
    return true;
  }

  markForRetry(messageId, error) {
    const attempts = (Number(this.retryAttempts[messageId]) || 0) + 1;
    this.retryAttempts[messageId] = attempts;
    this.processedMessageIds.delete(messageId);
    this.saveState();
    if (attempts === 1 || attempts % 5 === 0) {
      this.logger(`feishu-intake retry ${messageId} (attempt ${attempts}): ${error}`);
    }
    return true;
  }

  async pollOnce() {
    if (!await this.authReady()) return;
    if (!this.chatId && !await this.ensureInboxChat()) return;
    const args = [
      "+chat-messages-list",
      "--chat-id", this.chatId,
      "--order", "asc",
      "--page-size", "20",
      "--json",
      "--no-reactions"
    ];
    if (this.lastMessageTime) {
      args.push("--start", this.lastMessageTime);
    }
    const result = await this.run("im", args);
    if (!result.ok) {
      const errorText = String(result.error?.message || result.stdout || "unknown");
      this.reportPollFailure(errorText);
      // Self-heal: 230002 "Bot/User can NOT be out of the chat" means the
      // stored chatId no longer accepts us — the inbox group was disbanded,
      // recreated, or membership was lost. Drop the binding and re-resolve
      // the inbox by name so the next poll targets the fresh chat instead of
      // failing with the same stale id forever.
      if (/230002|can NOT be out of the chat/i.test(errorText)) {
        this.logger("feishu-intake rebinding inbox chat after membership loss");
        this.chatId = "";
        this.saveState();
        await this.ensureInboxChat();
      }
      return;
    }
    this.lastPollFailureSignature = null;
    this.pollFailureCount = 0;
    let messages = [];
    try {
      const parsed = JSON.parse(result.stdout);
      messages = parsed?.data?.messages || parsed?.items || parsed?.messages || [];
    } catch {
      return;
    }
    for (const message of messages) {
      const messageId = String(message?.message_id || "");
      const createTime = String(message?.create_time || "");
      // Our own confirmation replies carry reply_to pointing at the user's
      // message; skip anything threaded so the poller never re-ingests its
      // own output even if a URL leaks into a reply.
      if (!messageId || message?.reply_to || this.processedMessageIds.has(messageId)) continue;
      this.processedMessageIds.add(messageId);
      if (!this.lastMessageTime && !this.retryAttempts[messageId]) {
        // Previously failed messages must remain eligible even after restart.
        const ageMs = createTime ? Date.now() - parseFeishuTime(createTime) : 0;
        if (ageMs > MAX_MESSAGE_AGE_MS) continue;
      }
      const descriptor = fileMessageDescriptor(message);
      if (descriptor) {
        if (!await this.handleFileMessage(messageId, createTime, descriptor)) {
          this.markForRetry(messageId, "file download or dispatch failed");
          break;
        }
        continue;
      }
      const text = messagePlainText(message);
      // 方案 B：查询指令优先于转发（消息不带链接时才识别），命中后交给
      // onQuery 处理并继续，不占用转发链路，也不回“已收到”。
      const inboxQuery = parseInboxQuery(text);
      if (inboxQuery && typeof this.onQuery === "function") {
        try {
          await this.onQuery({ ...inboxQuery, messageId, createTime, chatId: this.chatId });
        } catch (error) {
          this.logger(`feishu-intake query failed: ${error?.message || error}`);
        }
        if (createTime && createTime > this.lastMessageTime) this.lastMessageTime = createTime;
        this.saveState();
        continue;
      }
      const url = extractFirstUrl(text);
      if (!url) continue;
      let title = "";
      const titleMatch = text.match(/《([^《》]{1,100})》/);
      // B站 app shares wrap the video title in 【】: "【标题】 https://b23.tv/xxx
      // 快来和我一起看！" — extract the bracketed title instead of the whole
      // share text with boilerplate.
      const cjkBracketTitleMatch = titleMatch ? null : text.match(/【([^【】]{1,100})】/);
      if (titleMatch) {
        title = titleMatch[1];
      } else if (cjkBracketTitleMatch) {
        title = cjkBracketTitleMatch[1];
      } else if (text !== url) {
        title = text.replace(url, "").replace(/[\s\n]+/g, " ").trim().slice(0, 80);
      }
      this.logger(`feishu-intake received: ${url}`);
      let accepted = true;
      try {
        const outcome = this.onItem({
          url,
          title,
          text: "",
          source: "feishu-inbox",
          receivedAt: new Date().toISOString()
        });
        if (outcome && typeof outcome.then === "function") await outcome;
      } catch (error) {
        accepted = false;
        this.logger(`feishu-intake dispatch failed: ${error?.message || error}`);
      }
      if (!accepted) {
        this.markForRetry(messageId, "dispatch failed");
        break;
      }
      delete this.retryAttempts[messageId];
      if (createTime && createTime > this.lastMessageTime) this.lastMessageTime = createTime;
      this.saveState();
      await this.replyToMessage(messageId, true, title || url);
    }
  }

  async handleFileMessage(messageId, createTime, descriptor) {
    const extension = path.extname(descriptor.fileName).toLowerCase();
    // Native image messages bypass the name-based whitelist: the extension is
    // resolved from the downloaded file itself, and anything lark-cli saved
    // for an image message is by definition an image resource.
    const isNativeImage = descriptor.resourceType === "image";
    if (!isNativeImage && !INTAKE_FILE_EXTENSIONS.has(extension)) {
      this.logger(`feishu-intake rejected unsupported file: ${descriptor.fileName}`);
      await this.replyToMessage(messageId, false, descriptor.fileName,
        `domi 收件箱目前只支持${REJECTED_TYPE_HINT}，暂不支持《${descriptor.fileName}》这类附件；请在 domi 对话里直接发送。`);
      if (createTime && createTime > this.lastMessageTime) this.lastMessageTime = createTime;
      delete this.retryAttempts[messageId];
      this.saveState();
      return true;
    }
    const download = await this.downloadFileMessage(messageId, descriptor);
    if (!download.ok) {
      this.logger(`feishu-intake file pending retry: ${download.error}`);
      return false;
    }
    if (isNativeImage) {
      const downloadedExtension = path.extname(download.fileName).toLowerCase();
      if (downloadedExtension && !INTAKE_IMAGE_EXTENSIONS.has(downloadedExtension)) {
        this.logger(`feishu-intake rejected unexpected image resource: ${download.fileName}`);
        await this.replyToMessage(messageId, false, download.fileName,
          `domi 收件箱目前只支持${REJECTED_TYPE_HINT}，暂不支持《${download.fileName}》这类附件；请在 domi 对话里直接发送。`);
        fs.rmSync(download.filePath, { force: true });
        if (createTime && createTime > this.lastMessageTime) this.lastMessageTime = createTime;
        delete this.retryAttempts[messageId];
        this.saveState();
        return true;
      }
    }
    this.logger(`feishu-intake received file: ${download.fileName}`);
    let accepted = true;
    try {
      const outcome = this.onItem({
        kind: "file",
        url: "",
        title: download.fileName,
        text: "",
        source: "feishu-inbox",
        filePath: download.filePath,
        fileName: download.fileName,
        fileSize: download.bytes,
        receivedAt: new Date().toISOString()
      });
      if (outcome && typeof outcome.then === "function") await outcome;
    } catch (error) {
      accepted = false;
      this.logger(`feishu-intake file dispatch failed: ${error?.message || error}`);
    }
    if (!accepted) return false;
    if (createTime && createTime > this.lastMessageTime) this.lastMessageTime = createTime;
    delete this.retryAttempts[messageId];
    this.saveState();
    await this.replyToMessage(messageId, true, download.fileName);
    return true;
  }

  async replyToMessage(messageId, accepted, label, failureText) {
    // Never echo the raw URL back: any link in the reply would be re-extracted
    // on the next poll. Show only the article title or a shortened label.
    const safeLabel = String(label || "").includes("http")
      ? String(label).replace(/^https?:\/\/([^/]+).*/, "$1 链接")
      : String(label || "文章");
    const text = accepted
      ? (catpawIntakeModeEnabled()
        ? `✅ 已收到，已加入本地处理队列：《${safeLabel}》\n整理完成后归档进行业认知库，对 CatPaw 说“处理转发”即可查看进度。`
        : `✅ 已收到，正在处理：《${safeLabel}》\n任务结果稍后可在 domi 工作台查看。`)
      : (failureText || `⚠️ 收到了链接但 domi 未能开始处理，请确认 domi 正在运行后重发。`);
    const reply = await this.run("im", ["+messages-reply", "--message-id", messageId, "--text", text]);
    if (!reply.ok) this.logger(`feishu-intake confirmation failed: ${reply.error?.message || reply.stdout}`);
  }

  start() {
    if (this.timer || this.stopping) return false;
    if (!this.larkCliPath) {
      this.logger("feishu-intake disabled: lark-cli not found");
      return false;
    }
    this.loadState();
    const tick = async () => {
      if (this.stopping || this.polling) return;
      this.polling = true;
      try {
        if (await this.authReady()) {
          await this.pollOnce();
        }
      } catch (error) {
        this.logger(`feishu-intake error: ${error?.message || error}`);
      } finally {
        this.polling = false;
      }
    };
    void tick();
    this.timer = setInterval(tick, this.pollIntervalMs);
    return true;
  }

  stop() {
    this.stopping = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

module.exports = { FeishuIntakePoller, extractFirstUrl, fileMessageDescriptor, messagePlainText, parseInboxQuery, buildInboxQuestionReply, buildInboxContinueReply, resolveLarkCli };
