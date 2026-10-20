const fs = require("node:fs");
const path = require("node:path");
const { CodexAppServer } = require("./codex-app-server.cjs");

// 收件箱深度问答的作答器：把 LibrarySession 检索出的原文片段交给轻量模型
// （与中文翻译同一条 Codex app-server 通道，read-only 沙箱、无工具、断网），
// 生成 NotebookLM 式回答——每个事实句末标注来源编号【n】，资料不足必须明说。
// 纯函数部分（prompt 组装、回复拼装与引用标记校验）独立导出便于测试。

const ANSWER_MODEL = "gpt-6-luna";
const ANSWER_EFFORT = "medium";
const ANSWER_TIMEOUT_MS = 120_000;
const MAX_ANSWER_SOURCES = 6;
const MAX_SOURCE_CHARS = 1_600;
const MAX_TOTAL_SOURCE_CHARS = 9_000;

function clipText(value, maxLength) {
  const text = String(value || "").replace(/\r\n/g, "\n").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function sourceExcerpt(source) {
  if (!source?.content) return "（本轮命中但未展开正文，证据不完整，不要据此下结论）";
  const coverage = source.totalChars
    ? `（已读 ${source.coveredChars || source.content.length}/${source.totalChars} 字，未读部分可能改变结论）`
    : "";
  return `${clipText(source.content, MAX_SOURCE_CHARS)}${coverage}`;
}

// 组装模型输入：编号来源块 + 严格指令。只允许引用给定来源，禁止外部知识。
function buildAnswerPrompt(question, sources) {
  const blocks = [];
  let total = 0;
  for (const [index, source] of (sources || []).slice(0, MAX_ANSWER_SOURCES).entries()) {
    const body = sourceExcerpt(source);
    if (total + body.length > MAX_TOTAL_SOURCE_CHARS) {
      blocks.push(`【${index + 1}】${source.title || source.relativePath || "资料"}（正文因长度限制未提供）`);
      continue;
    }
    total += body.length;
    const header = `【${index + 1}】${source.title || source.relativePath || "资料"}${source.date ? ` · ${source.date}` : ""}（来源：${source.relativePath || "本地资料"}）`;
    blocks.push(`${header}\n${body}`);
  }
  return [
    "你是基于用户本地资料库（domi）的问答助手，工作方式类似 NotebookLM。",
    "回答规则：",
    "1. 只能使用下方资料片段中的信息作答，禁止使用任何资料之外的知识。",
    "2. 每个事实性陈述的句末必须标注来源编号，格式如【1】【2】；同一句引多个来源可并列如【1】【3】。",
    "3. 资料片段不足以回答时，明确说明缺什么证据，不要猜测或用常识补全。",
    "4. 资料之间有冲突时，分别呈现并指出冲突，不擅自裁决。",
    "5. 用简体中文，直接给答案，不超过 400 字，不重复问题本身。",
    "",
    `问题：${clipText(question, 400)}`,
    "",
    "资料片段：",
    ...(blocks.length ? blocks : ["（本轮检索没有命中任何原文片段）"]),
    "",
    "现在按规则回答。"
  ].join("\n");
}

function answerExcerpt(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

// 拼装最终回复：模型答案（校验后的引用标记）+ 来源清单（镜像链接与已读覆盖）。
// 无效标记（指向不存在的来源编号）被移除并如实披露，不允许悬空引用。
function composeAnswerReply(question, answer, sources, warnings = [], options = {}) {
  const mirrorLink = options.mirrorLink || (() => "");
  const sourceList = (sources || []).slice(0, MAX_ANSWER_SOURCES);
  const title = answerExcerpt(question, 40);
  let cleaned = String(answer || "").trim();
  const invalidMarkers = [...new Set([...cleaned.matchAll(/【(\d{1,2})】/g)].map((match) => Number(match[1])))]
    .filter((number) => number < 1 || number > sourceList.length);
  if (invalidMarkers.length) {
    for (const number of invalidMarkers) cleaned = cleaned.split(`【${number}】`).join("");
    cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  }
  if (!cleaned) {
    return `「${title}」本轮模型作答为空，请重发问题，或在电脑端打开 domi 深问。`;
  }
  const blocks = [`「${title}」（基于本地资料库作答）：`, cleaned];
  if (sourceList.length) {
    const sourceLines = sourceList.map((source, index) => {
      const coverage = source.totalChars
        ? `已读 ${source.coveredChars || source.content?.length || 0}/${source.totalChars} 字`
        : "";
      const link = mirrorLink(source.path || "");
      return [`【${index + 1}】${source.title || source.relativePath || "资料"}${source.date ? ` · ${source.date}` : ""}`,
        [coverage, link ? `阅读：${link}` : ""].filter(Boolean).join("；")]
        .filter(Boolean).join("\n");
    });
    blocks.push([`来源（${sourceLines.length} 个，均出自本地资料库）：`, ...sourceLines].join("\n"));
  } else {
    blocks.push("本轮没有命中可用来源，以上回答仅基于资料库检索边界；建议换个问法或补充材料。");
  }
  const coverageNotes = [...new Set(warnings)].slice(0, 2);
  if (coverageNotes.length) blocks.push(`覆盖说明：${coverageNotes.join(" ")}`);
  if (invalidMarkers.length) blocks.push(`已移除 ${invalidMarkers.length} 个指向不存在来源的引用标记。`);
  blocks.push("发送「续读 序号」可查看对应来源原文；「查 关键词」仍是快速检索。");
  return blocks.join("\n\n");
}

class InboxAnswerGenerator {
  constructor({ cwd, runtimeProvider, client = null, version = "1.0.0", model = ANSWER_MODEL, timeoutMs = ANSWER_TIMEOUT_MS } = {}) {
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.pending = new Map();
    this.injectedClient = client || null;
    this.client = null;
    this.closed = false;
    if (this.injectedClient) {
      this.client = this.injectedClient;
    } else {
      fs.mkdirSync(cwd, { recursive: true });
      this.client = new CodexAppServer({
        cwd, version, runtimeProvider,
        onNotification: (method, params) => {
          const pending = this.pending.get(params?.threadId);
          if (!pending) return;
          if (method === "item/completed" && params.item?.type === "agentMessage") pending.text = params.item.text;
          if (method === "turn/completed") {
            clearTimeout(pending.timer);
            this.pending.delete(params.threadId);
            if (params.turn?.status !== "completed") pending.reject(new Error(params.turn?.error?.message || "问答任务未完成。"));
            else pending.resolve(pending.text);
          }
        },
        onExit: ({ error }) => {
          for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
          this.pending.clear();
          if (!this.closed) this.client = null; // 下一个问题会重建
        }
      });
    }
  }

  get ready() {
    return Boolean(this.client) && !this.closed;
  }

  // 返回模型答案文本；失败抛错，由调用方决定回退到摘录模式。
  async answer(question, sources) {
    if (this.closed) throw new Error("问答生成器已关闭。");
    const client = this.client;
    if (!client) throw new Error("问答模型通道未就绪。");
    const thread = await client.request("thread/start", {
      model: this.model, serviceTier: null, cwd: client.cwd || "",
      approvalPolicy: "never", sandbox: "read-only", ephemeral: true,
      config: { model_reasoning_effort: ANSWER_EFFORT, web_search: "disabled", features: { shell_tool: false } },
      developerInstructions: "你只根据用户提供的资料片段回答问题，不调用工具、不执行命令、不联网、不使用资料之外的知识。每个事实句末用【n】标注来源编号。"
    });
    const threadId = thread.thread.id;
    const response = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const pending = this.pending.get(threadId);
        this.pending.delete(threadId);
        if (pending?.turnId) void client.request("turn/interrupt", { threadId, turnId: pending.turnId }).catch(() => {});
        reject(new Error("问答超时，请稍后重试。"));
      }, this.timeoutMs);
      this.pending.set(threadId, { resolve, reject, timer, text: "" });
    });
    response.catch(() => {});
    try {
      const started = await client.request("turn/start", {
        threadId, model: this.model, effort: ANSWER_EFFORT, serviceTier: null,
        input: [{ type: "text", text: buildAnswerPrompt(question, sources) }]
      });
      const pending = this.pending.get(threadId);
      if (pending) pending.turnId = started.turn?.id;
      return String(await response).trim();
    } catch (error) {
      const pending = this.pending.get(threadId);
      if (pending) { clearTimeout(pending.timer); this.pending.delete(threadId); }
      throw error;
    } finally {
      if (this.client === client && !this.closed) {
        await client.request("thread/unsubscribe", { threadId }, { timeoutMs: 5_000 }).catch(() => {});
      }
    }
  }

  close() {
    this.closed = true;
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error("问答生成器已关闭。")); }
    this.pending.clear();
    if (!this.injectedClient && this.client) {
      try { this.client.close(); } catch { /* best-effort */ }
    }
    this.client = null;
  }
}

module.exports = { InboxAnswerGenerator, buildAnswerPrompt, composeAnswerReply, ANSWER_MODEL };
