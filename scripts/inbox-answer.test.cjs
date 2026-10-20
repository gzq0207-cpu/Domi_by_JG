const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  InboxAnswerGenerator,
  buildAnswerPrompt,
  composeAnswerReply,
  ANSWER_MODEL
} = require("../electron/inbox-answer.cjs");

const SOURCES = [
  {
    title: "推理成本调研",
    date: "2026-09-01",
    path: "/lib/a.md",
    relativePath: "a.md",
    content: "企业客户愿意为推理付费，但推理成本限制了毛利。GPU 供给紧张推高了短期成本。",
    totalChars: 500,
    coveredChars: 200
  },
  {
    title: "算力芯片动态",
    date: "2026-10-13",
    path: "/lib/b.md",
    relativePath: "b.md",
    content: "Intel 发布 GPU D-series 推理加速器，单卡最高可配 480GB LPDDR5X。",
    totalChars: 300,
    coveredChars: 300
  }
];

test("buildAnswerPrompt numbers sources, injects rules and clips long content", () => {
  const prompt = buildAnswerPrompt("推理成本怎么看？", SOURCES);
  assert.ok(prompt.includes("问题：推理成本怎么看？"));
  assert.ok(prompt.includes("【1】推理成本调研 · 2026-09-01（来源：a.md）"));
  assert.ok(prompt.includes("【2】算力芯片动态 · 2026-10-13（来源：b.md）"));
  assert.ok(prompt.includes("已读 200/500 字"));
  assert.ok(prompt.includes("禁止使用任何资料之外的知识"));
  assert.ok(prompt.includes("【1】【3】"));
  // 空来源时明确告知模型没有命中片段。
  const empty = buildAnswerPrompt("问题", []);
  assert.ok(empty.includes("本轮检索没有命中任何原文片段"));
  // 超长来源会被裁剪并保留省略号。
  const long = buildAnswerPrompt("问题", [{ ...SOURCES[0], content: "长".repeat(10_000) }]);
  assert.ok(long.includes("…"));
  assert.ok(long.length < 12_000);
  // 未展开正文的来源不会被当成证据。
  const unexpanded = buildAnswerPrompt("问题", [{ ...SOURCES[0], content: "" }]);
  assert.ok(unexpanded.includes("命中但未展开正文"));
});

test("composeAnswerReply keeps the answer, validates markers and appends the source list", () => {
  const reply = composeAnswerReply("推理成本怎么看？",
    "推理成本仍是主要瓶颈，企业客户付费意愿存在【1】。新硬件可能缓解供给紧张【1】【2】。",
    SOURCES,
    ["文档索引尚不完整"],
    { mirrorLink: (filePath) => (filePath === "/lib/a.md" ? "https://tenant.example.invalid/docx/a" : "") });
  assert.ok(reply.includes("（基于本地资料库作答）："));
  assert.ok(reply.includes("推理成本仍是主要瓶颈"));
  assert.ok(reply.includes("【1】【2】"));
  assert.ok(reply.includes("来源（2 个，均出自本地资料库）："));
  assert.ok(reply.includes("【1】推理成本调研 · 2026-09-01"));
  assert.ok(reply.includes("已读 200/500 字"));
  assert.ok(reply.includes("阅读：https://tenant.example.invalid/docx/a"));
  assert.ok(reply.includes("覆盖说明：文档索引尚不完整"));
  assert.ok(reply.includes("发送「续读 序号」"));
});

test("composeAnswerReply strips invalid markers and discloses the removal", () => {
  const reply = composeAnswerReply("问题",
    "这句话引用了不存在的来源【9】，还有另一个【1】。",
    SOURCES);
  assert.ok(!reply.includes("【9】"));
  assert.ok(reply.includes("另一个【1】"));
  assert.ok(reply.includes("已移除 1 个指向不存在来源的引用标记"));
  // 空答案给出明确提示而不是空消息。
  const empty = composeAnswerReply("问题", "   ", SOURCES);
  assert.ok(empty.includes("模型作答为空"));
});

test("composeAnswerReply states the no-source boundary explicitly", () => {
  const reply = composeAnswerReply("问题", "资料库中没有直接证据支持该说法。", []);
  assert.ok(reply.includes("本轮没有命中可用来源"));
  assert.ok(reply.includes("资料库检索边界"));
});

// 注入伪 client：验证 thread/start 的安全参数（read-only 沙箱、断网、
// ephemeral）、turn/start 携带完整编号 prompt，以及未完成时的收尾。
test("InboxAnswerGenerator requests an ephemeral read-only offline thread", async () => {
  const calls = [];
  const threadId = "th-42";
  const client = {
    cwd: "C:/fake",
    async request(method, params) {
      calls.push({ method, params });
      if (method === "thread/start") return { thread: { id: threadId } };
      return { turn: { id: "turn-1" } };
    },
    close() {}
  };
  const generator = new InboxAnswerGenerator({ client, timeoutMs: 50 });
  assert.equal(generator.ready, true);
  const pending = generator.answer("推理成本怎么看？", SOURCES);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const threadStart = calls.find((call) => call.method === "thread/start");
  assert.equal(threadStart.params.sandbox, "read-only");
  assert.equal(threadStart.params.approvalPolicy, "never");
  assert.equal(threadStart.params.ephemeral, true);
  assert.equal(threadStart.params.model, ANSWER_MODEL);
  assert.equal(threadStart.params.config.web_search, "disabled");
  assert.equal(threadStart.params.config.features.shell_tool, false);
  assert.ok(threadStart.params.developerInstructions.includes("不联网"));
  const turnStart = calls.find((call) => call.method === "turn/start");
  assert.ok(turnStart.params.input[0].text.includes("问题：推理成本怎么看？"));
  assert.ok(turnStart.params.input[0].text.includes("【1】推理成本调研"));
  // 伪 client 永不送出答案：短超时后错误透传给调用方（主进程回退到原文摘录）。
  await assert.rejects(pending, /问答超时/);
});

test("InboxAnswerGenerator turns app-server notifications into the answer text", async () => {
  const calls = [];
  const threadId = "th-7";
  // 用最小桩替换 CodexAppServer：暴露 onNotification，模拟 app-server
  // 在 turn/start 之后送出 agentMessage 与 turn/completed。
  const serverPath = require.resolve("../electron/codex-app-server.cjs");
  const originalExports = require.cache[serverPath].exports;
  let serverInstance = null;
  require.cache[serverPath].exports = {
    ...originalExports,
    CodexAppServer: class {
      constructor({ onNotification, onExit }) {
        serverInstance = { onNotification, onExit };
        this.cwd = "C:/fake";
      }
      async request(method, params) {
        calls.push({ method, params });
        if (method === "thread/start") return { thread: { id: threadId } };
        if (method === "turn/start") {
          queueMicrotask(() => serverInstance.onNotification("item/completed", { threadId, item: { type: "agentMessage", text: "推理成本仍是主要瓶颈【1】。" } }));
          queueMicrotask(() => serverInstance.onNotification("turn/completed", { threadId, turn: { status: "completed" } }));
          return { turn: { id: "turn-1" } };
        }
        return {};
      }
      close() {}
    }
  };
  try {
    // 清掉已加载的 inbox-answer 缓存，强制用桩重建模块。
    const answerPath = require.resolve("../electron/inbox-answer.cjs");
    delete require.cache[answerPath];
    const FreshGenerator = require("../electron/inbox-answer.cjs").InboxAnswerGenerator;
    const generator = new FreshGenerator({ cwd: path.join(os.tmpdir(), "domi-inbox-answer-test"), runtimeProvider: () => {} });
    const answer = await generator.answer("推理成本怎么看？", SOURCES);
    assert.equal(answer, "推理成本仍是主要瓶颈【1】。");
    // turn 完成后线程被释放（unsubscribe），不长期占内存。
    assert.ok(calls.some((call) => call.method === "thread/unsubscribe" && call.params.threadId === threadId));
    generator.close();
  } finally {
    // 恢复真实模块缓存，避免污染其他测试。
    require.cache[serverPath].exports = originalExports;
    const answerPath = require.resolve("../electron/inbox-answer.cjs");
    delete require.cache[answerPath];
    require("../electron/inbox-answer.cjs");
  }
});
