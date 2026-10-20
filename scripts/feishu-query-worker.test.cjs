const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

// 契约：worker 的解析/格式化逻辑必须与 domi 本机实现保持一致。
const {
  buildAnswer,
  createPoller,
  formatNewsRow,
  parseInboxQuery: workerParseInboxQuery
} = require("../services/feishu-query-worker/index.js");
const { parseInboxQuery: desktopParseInboxQuery } = require("../electron/intake-feishu.cjs");

const FIXTURE_SNAPSHOT = {
  version: 1,
  generatedAt: "2026-09-23T06:41:45.544Z",
  news: [
    {
      title: "Why Information Has a Price in Intelligence",
      domains: ["模型层"],
      publishedAt: "2026-09-21T00:00:00.000Z",
      summary: "【核心观点】流匹配成为连续模态主流选型。",
      companies: "Mistral",
      url: "https://www.youtube.com/watch?v=1S1B4XkFCD8",
      mirrorUrl: "https://tenant.example.invalid/docx/abc"
    }
  ],
  projects: [
    { name: "ExampleCorp", domain: "Agent与平台", status: "已交流", rating: "A", notes: "做 agent 的公司", mirrorUrl: "https://tenant.example.invalid/docx/proj" }
  ],
  people: [
    { name: "张三", organization: "ExampleCorp", status: "待接触", rating: "", mirrorUrl: "https://tenant.example.invalid/docx/p1" }
  ],
  digests: [
    { name: "AI-Builders-Digest-2026-09-22", url: "https://tenant.example.invalid/docx/dig", mtimeMs: 1789900000000 }
  ]
};

test("worker query parsing stays in contract with the desktop implementation", () => {
  const cases = [
    "查 Mistral", "查询 算力", "search flow matching",
    "日报", "订阅日报", "动态", "行业动态",
    "https://example.com/a", "查查这篇 https://mp.weixin.qq.com/s/abc 好文",
    "查", "你好", "", "看看这篇很有意思的文章",
    "问 英伟达的推理成本怎么样", "问：流匹配和扩散的区别", "问问 数据中心的供电架构",
    "英伟达 2026 年的资本开支？", "在吗？", "问题反馈：希望增加导出", "问题怎么这么多",
    "续读 1", "继续读 12", "续读", "续读 0", "续读 999"
  ];
  for (const text of cases) {
    assert.deepEqual(
      workerParseInboxQuery(text),
      desktopParseInboxQuery(text),
      `两份 parseInboxQuery 对「${text}」必须返回一致结果`
    );
  }
});

test("buildAnswer covers digest, news, search and the missing-snapshot case", () => {
  const digest = buildAnswer({ kind: "digest", keyword: "" }, FIXTURE_SNAPSHOT);
  assert.ok(digest.includes("AI-Builders-Digest-2026-09-22"));
  assert.ok(digest.includes("https://tenant.example.invalid/docx/dig"));
  assert.ok(digest.includes("数据截至 2026-09-23 06:41"));

  const news = buildAnswer({ kind: "news", keyword: "" }, FIXTURE_SNAPSHOT);
  assert.ok(news.includes("最近行业动态（1 条）"));
  assert.ok(news.includes("阅读全文：https://tenant.example.invalid/docx/abc"));

  const search = buildAnswer({ kind: "search", keyword: "mistral" }, FIXTURE_SNAPSHOT);
  assert.ok(search.includes("「mistral」检索结果（1 条）"));
  assert.ok(search.includes("流匹配"));

  const combined = buildAnswer({ kind: "search", keyword: "张三" }, FIXTURE_SNAPSHOT);
  assert.ok(combined.includes("【人物】张三（ExampleCorp）"));
  assert.ok(combined.includes("https://tenant.example.invalid/docx/p1"));

  const miss = buildAnswer({ kind: "search", keyword: "不存在的关键词xyz" }, FIXTURE_SNAPSHOT);
  assert.ok(miss.includes("没有找到与「不存在的关键词xyz」相关"));

  const empty = buildAnswer({ kind: "digest", keyword: "" }, null);
  assert.ok(empty.includes("云端资料库快照暂不可用"));
});

test("buildAnswer explains deep-question and continue limits instead of faking them", () => {
  const question = buildAnswer({ kind: "question", keyword: "英伟达的推理成本怎么样" }, FIXTURE_SNAPSHOT);
  assert.ok(question.includes("需要桌面 domi 在线"));
  assert.ok(question.includes("查 关键词"));
  assert.ok(!question.includes("检索结果"), "云端不得把快照匹配冒充深度问答");

  const noSnapshot = buildAnswer({ kind: "question", keyword: "任何问题" }, null);
  assert.ok(noSnapshot.includes("云端资料库快照暂不可用"));

  const deep = buildAnswer({ kind: "continue", keyword: "2" }, FIXTURE_SNAPSHOT);
  assert.ok(deep.includes("本地资料会话"));
});

test("formatNewsRow prefers the mirror link over the source url", () => {
  const row = formatNewsRow(FIXTURE_SNAPSHOT.news[0]);
  assert.ok(row.includes("阅读全文：https://tenant.example.invalid/docx/abc"));
  assert.ok(!row.includes("youtube.com"));
});

function fakeClient(messages) {
  const replies = [];
  return {
    replies,
    async listMessages(chatId, startTimeSec) {
      return messages.filter((item) => Number(item.create_time) >= startTimeSec);
    },
    async reply(messageId, text) {
      replies.push({ messageId, text });
    }
  };
}

function textMessage(messageId, createTimeSec, text, extras = {}) {
  return {
    message_id: messageId,
    create_time: String(createTimeSec),
    msg_type: "text",
    sender: { id: "ou_user", sender_type: "user" },
    body: { content: JSON.stringify({ text }) },
    ...extras
  };
}

test("poller answers fresh queries only, skips forwards and its own replies, and dedupes", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-query-worker-"));
  const snapshotPath = path.join(root, "snapshot.json");
  const statePath = path.join(root, "state.json");
  fs.writeFileSync(snapshotPath, JSON.stringify(FIXTURE_SNAPSHOT), "utf8");

  const nowSec = Math.floor(Date.now() / 1000);
  const messages = [
    textMessage("om_old", nowSec - 3600, "查 流匹配"), // 早于首次运行窗口，不补答
    textMessage("om_forward", nowSec - 60, "【好文】 https://mp.weixin.qq.com/s/abc"), // 转发，不碰
    textMessage("om_query", nowSec - 50, "查 流匹配"),
    textMessage("om_bot_reply", nowSec - 40, "答", { sender: { id: "app", sender_type: "app" }, reply_to: "om_query" })
  ];
  const client = fakeClient(messages);
  const poller = createPoller({ client, chatId: "oc_test", snapshotPath, statePath });
  await poller.pollOnce();

  assert.equal(client.replies.length, 1);
  assert.equal(client.replies[0].messageId, "om_query");
  assert.ok(client.replies[0].text.includes("流匹配"));

  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.ok(state.processed.includes("om_query"));
  assert.ok(state.processed.includes("om_forward"));
  assert.ok(state.processed.includes("om_bot_reply"));
  assert.equal(state.lastTimeSec, nowSec - 40);

  // 第二次轮询：同一批消息全部去重，不再回复。
  const client2 = fakeClient(messages);
  const poller2 = createPoller({ client: client2, chatId: "oc_test", snapshotPath, statePath });
  await poller2.pollOnce();
  assert.equal(client2.replies.length, 0);
});

test("snapshot server enforces the bearer token and persists valid snapshots", async () => {
  const { startSnapshotServer } = require("../services/feishu-query-worker/index.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-query-worker-"));
  const snapshotPath = path.join(root, "snapshot.json");
  const server = await startSnapshotServer({ port: 0, token: "secret-token", snapshotPath });
  const port = server.address().port;
  const post = (body, headers) => new Promise((resolve) => {
    const request = http.request(
      { host: "127.0.0.1", port, method: "POST", path: "/snapshot", headers },
      (response) => {
        let data = "";
        response.on("data", (chunk) => { data += chunk; });
        response.on("end", () => resolve({ status: response.statusCode, body: data }));
      }
    );
    request.end(body);
  });

  try {
    const denied = await post(JSON.stringify(FIXTURE_SNAPSHOT), {});
    assert.equal(denied.status, 401);

    const accepted = await post(JSON.stringify(FIXTURE_SNAPSHOT), { Authorization: ("Bearer " + "secret-token") });
    assert.equal(accepted.status, 200);
    const stored = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    assert.equal(stored.news[0].title, FIXTURE_SNAPSHOT.news[0].title);

    const malformed = await post("not-json", { Authorization: ("Bearer " + "secret-token") });
    assert.equal(malformed.status, 400);
  } finally {
    server.close();
  }
});
