const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  FeishuIntakePoller,
  extractFirstUrl,
  fileMessageDescriptor,
  messagePlainText,
  parseInboxQuery,
buildInboxQuestionReply,
buildInboxContinueReply,
  resolveLarkCli
} = require("../electron/intake-feishu.cjs");

test("extractFirstUrl finds links in noisy WeChat shares", () => {
  assert.equal(
    extractFirstUrl("看看这篇 https://mp.weixin.qq.com/s/abc123?x=1 很不错"),
    "https://mp.weixin.qq.com/s/abc123?x=1"
  );
  assert.equal(extractFirstUrl("没有链接的普通消息"), "");
  assert.equal(extractFirstUrl(""), "");
});

test("extractFirstUrl stops at full-width brackets (self-reply loop guard)", () => {
  // Our own confirmation replies wrap links like 《https://...》; the trailing
  // 》 must not become part of the extracted URL or the poller re-ingests it.
  assert.equal(
    extractFirstUrl("✅ 已收到，正在处理：《https://mp.weixin.qq.com/s/abc》\n任务结果稍后可在 domi 工作台查看。"),
    "https://mp.weixin.qq.com/s/abc"
  );
});

test("messagePlainText unwraps nested Feishu content JSON", () => {
  const textMessage = {
    msg_type: "text",
    body: { content: JSON.stringify({ text: "https://example.com/a 文章不错" }) }
  };
  assert.equal(messagePlainText(textMessage), "https://example.com/a 文章不错");

  const plain = { body: { content: "直接字符串" } };
  assert.equal(messagePlainText(plain), "直接字符串");
});

test("extractFirstUrl keeps b23.tv short links intact", () => {
  // B站 app shares use the b23.tv short domain; the link itself must be
  // extracted whole (the skill follows the redirect later).
  assert.equal(
    extractFirstUrl("【GPT-5 深度解读】 https://b23.tv/AbCdEfG 快来和我一起看！"),
    "https://b23.tv/AbCdEfG"
  );
});

test("parseInboxQuery recognizes search, digest and news commands", () => {
  assert.deepEqual(parseInboxQuery("查 Mistral"), { kind: "search", keyword: "Mistral" });
  assert.deepEqual(parseInboxQuery("查询 算力"), { kind: "search", keyword: "算力" });
  assert.deepEqual(parseInboxQuery("search flow matching"), { kind: "search", keyword: "flow matching" });
  assert.deepEqual(parseInboxQuery("日报"), { kind: "digest", keyword: "" });
  assert.deepEqual(parseInboxQuery("订阅日报"), { kind: "digest", keyword: "" });
  assert.deepEqual(parseInboxQuery("动态"), { kind: "news", keyword: "" });
  assert.deepEqual(parseInboxQuery("行业动态"), { kind: "news", keyword: "" });
});

test("parseInboxQuery recognizes deep questions and continue commands", () => {
  assert.deepEqual(parseInboxQuery("问 英伟达的推理成本怎么样"), { kind: "question", keyword: "英伟达的推理成本怎么样" });
  assert.deepEqual(parseInboxQuery("问：流匹配和扩散的区别"), { kind: "question", keyword: "流匹配和扩散的区别" });
  assert.deepEqual(parseInboxQuery("问问 数据中心的供电架构"), { kind: "question", keyword: "数据中心的供电架构" });
  assert.deepEqual(parseInboxQuery("英伟达 2026 年的资本开支？"), { kind: "question", keyword: "英伟达 2026 年的资本开支？" });
  assert.deepEqual(parseInboxQuery("续读 1"), { kind: "continue", keyword: "1" });
  assert.deepEqual(parseInboxQuery("继续读 12"), { kind: "continue", keyword: "12" });
  // 查询指令优先于 ？结尾判定。
  assert.deepEqual(parseInboxQuery("查 流匹配？"), { kind: "search", keyword: "流匹配？" });
});

test("parseInboxQuery keeps ordinary chatter out of deep questions", () => {
  assert.equal(parseInboxQuery("问题反馈：希望增加导出"), null);
  assert.equal(parseInboxQuery("问题怎么这么多"), null);
  assert.equal(parseInboxQuery("在吗"), null);
  assert.equal(parseInboxQuery("在吗？"), null, "短疑问不打断为深度问答");
  assert.equal(parseInboxQuery("问题"), null);
});

test("buildInboxQuestionReply presents original excerpts, coverage and links without inventing conclusions", () => {
  const sources = [
    { title: "推理成本调研", date: "2026-09-01", path: "/lib/a.md", relativePath: "a.md", content: "企业客户愿意付费，但推理成本限制了毛利。", totalChars: 500, coveredChars: 200 },
    { title: "算力芯片动态", path: "/lib/b.md", relativePath: "b.md", content: "B200 供货周期延长。", totalChars: 0 }
  ];
  const reply = buildInboxQuestionReply("推理成本", sources, ["文档索引尚不完整"], {
    mirrorLink: (filePath) => (filePath === "/lib/a.md" ? "https://tenant.example.invalid/docx/a" : "")
  });
  assert.ok(reply.includes("本地库原文检索（2 个来源"));
  assert.ok(reply.includes("【1】推理成本调研 · 2026-09-01"));
  assert.ok(reply.includes("企业客户愿意付费"));
  assert.ok(reply.includes("已读 200/500 字"));
  assert.ok(reply.includes("阅读：https://tenant.example.invalid/docx/a"));
  assert.ok(reply.includes("覆盖说明：文档索引尚不完整"));
  assert.ok(reply.includes("「续读 序号」继续读对应来源"));
  // 无命中时不宣称结论，如实说明检索边界。
  const empty = buildInboxQuestionReply("量子计算", [], []);
  assert.ok(empty.includes("没有命中原文"));
  assert.ok(empty.includes("不代表资料库一定没有相关内容"));
});

test("buildInboxContinueReply reports lines, more-to-read state and failures", () => {
  const source = { title: "推理成本调研", path: "/lib/a.md", relativePath: "a.md" };
  const document = { ok: true, content: "后续正文内容。", startLine: 8, endLine: 14, pages: [3], nextCursor: "eyJvZmZzZXQiOjEwMH0=" };
  const reply = buildInboxContinueReply(1, source, document, { mirrorLink: () => "https://tenant.example.invalid/docx/a" });
  assert.ok(reply.includes("【1】推理成本调研 续读"));
  assert.ok(reply.includes("第 8-14 行"));
  assert.ok(reply.includes("第 3 页"));
  assert.ok(reply.includes("后续正文内容。"));
  assert.ok(reply.includes("仍有未读内容"));
  const finished = buildInboxContinueReply(1, source, { ok: true, content: "结尾。", startLine: 20, endLine: 21, pages: [], nextCursor: "" });
  assert.ok(finished.includes("本轮已读完"));
  const failure = buildInboxContinueReply(1, source, { ok: false, error: "版本已改变" });
  assert.ok(failure.includes("续读失败：版本已改变"));
});

test("parseInboxQuery ignores links, forwards and ordinary chatter", () => {
  // Links stay on the forwarding path.
  assert.equal(parseInboxQuery("https://example.com/a"), null);
  assert.equal(parseInboxQuery("查查这篇 https://mp.weixin.qq.com/s/abc 好文"), null);
  // Bare 查 without a keyword, and normal chat, do not match.
  assert.equal(parseInboxQuery("查"), null);
  assert.equal(parseInboxQuery("你好"), null);
  assert.equal(parseInboxQuery(""), null);
  assert.equal(parseInboxQuery("看看这篇很有意思的文章"), null);
});

test("poller routes query commands to onQuery instead of onItem", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const received = [];
  const queries = [];
  const replies = [];
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    onItem: (item) => received.push(item),
    onQuery: (query) => queries.push(query),
    execFileImpl: fakeExec([
      {
        match: ["auth", "status"],
        stdout: JSON.stringify({ ok: true, logged_in: true })
      },
      {
        match: ["+chat-list"],
        stdout: JSON.stringify({ ok: true, data: { chats: [{ name: "domi 收件箱", chat_id: "oc_test123" }] } })
      },
      {
        match: ["+chat-messages-list"],
        stdout: JSON.stringify({
          ok: true,
          data: {
            has_more: false,
            messages: [
              {
                message_id: "om_q1",
                create_time: feishuTime(5000),
                msg_type: "text",
                body: { content: JSON.stringify({ text: "查 算力芯片" }) }
              },
              {
                message_id: "om_q2",
                create_time: feishuTime(4000),
                msg_type: "text",
                body: { content: JSON.stringify({ text: "https://example.com/normal-forward" }) }
              }
            ]
          }
        })
      },
      {
        match: ["+messages-reply", "om_q2"],
        stdout: JSON.stringify({ ok: true }),
        sideEffect: (args) => replies.push(args.join(" "))
      }
    ])
  });
  poller.loadState();
  await poller.pollOnce();

  assert.deepEqual(queries, [{ kind: "search", keyword: "算力芯片", messageId: "om_q1", createTime: feishuTime(5000), chatId: "oc_test123" }]);
  assert.equal(received.length, 1);
  assert.equal(received[0].url, "https://example.com/normal-forward");
  // The forward still gets its confirmation reply; the query does not.
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes("om_q2"));
});

function fakeExec(outputs) {
  const calls = [];
  const execFileImpl = (cli, args, options, callback) => {
    calls.push({ args, options: options || {} });
    const match = outputs.find((entry) => entry.match.every((token) => args.includes(token)));
    if (!match) {
      callback(new Error("unexpected command"), "");
      return;
    }
    if (match.sideEffect) match.sideEffect(args, options || {});
    callback(match.error || null, match.stdout || "");
  };
  execFileImpl.calls = calls;
  return execFileImpl;
}

function feishuTime(msAgo) {
  // lark-cli renders create_time as a local-time string like "2026-09-04 17:06".
  const d = new Date(Date.now() - msAgo);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

test("poller forwards new URL messages and replies confirmation", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const statePath = path.join(root, "state.json");
  const received = [];
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath,
    onItem: (item) => received.push(item),
    execFileImpl: fakeExec([
      {
        match: ["auth", "status"],
        stdout: JSON.stringify({ ok: true, logged_in: true })
      },
      {
        match: ["+chat-list"],
        stdout: JSON.stringify({ ok: true, data: { chats: [{ name: "domi 收件箱", chat_id: "oc_test123" }] } })
      },
      {
        match: ["+chat-messages-list"],
        stdout: JSON.stringify({
          ok: true,
          data: {
            has_more: false,
            messages: [
              {
                message_id: "om_1",
                create_time: feishuTime(5000),
                msg_type: "text",
                body: { content: JSON.stringify({ text: "https://substack.com/p/great 值得读《AI 的瓶颈》" }) }
              },
              {
                message_id: "om_2",
                create_time: feishuTime(4000),
                msg_type: "text",
                body: { content: JSON.stringify({ text: "纯文字，没有链接" }) }
              }
            ]
          }
        })
      },
      {
        match: ["+messages-reply", "om_1"],
        stdout: JSON.stringify({ ok: true })
      }
    ])
  });
  poller.loadState();
  await poller.pollOnce();

  assert.equal(received.length, 1);
  assert.equal(received[0].url, "https://substack.com/p/great");
  assert.equal(received[0].title, "AI 的瓶颈");
  assert.equal(received[0].source, "feishu-inbox");

  const saved = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(saved.chatId, "oc_test123");
  assert.ok(saved.processedMessageIds.includes("om_1"));
  assert.equal(saved.lastMessageTime, feishuTime(5000));

  // Second poll returns the same message: deduped, no duplicate task.
  received.length = 0;
  await poller.pollOnce();
  assert.equal(received.length, 0);
});

test("poller extracts the bracketed title from B站 app shares", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const statePath = path.join(root, "state.json");
  const received = [];
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath,
    onItem: (item) => received.push(item),
    execFileImpl: fakeExec([
      {
        match: ["auth", "status"],
        stdout: JSON.stringify({ ok: true, logged_in: true })
      },
      {
        match: ["+chat-list"],
        stdout: JSON.stringify({ ok: true, data: { chats: [{ name: "domi 收件箱", chat_id: "oc_test123" }] } })
      },
      {
        match: ["+chat-messages-list"],
        stdout: JSON.stringify({
          ok: true,
          data: {
            has_more: false,
            messages: [
              {
                message_id: "om_bili_1",
                create_time: feishuTime(5000),
                msg_type: "text",
                body: {
                  content: JSON.stringify({
                    text: "【GPT-5 深度解读】 https://b23.tv/AbCdEfG 快来和我一起看！"
                  })
                }
              }
            ]
          }
        })
      },
      {
        match: ["+messages-reply", "om_bili_1"],
        stdout: JSON.stringify({ ok: true })
      }
    ])
  });
  poller.loadState();
  await poller.pollOnce();

  // The 【】-wrapped video title is extracted instead of the whole share text
  // ("…快来和我一起看！"), so the task title and reply label stay clean.
  assert.equal(received.length, 1);
  assert.equal(received[0].url, "https://b23.tv/AbCdEfG");
  assert.equal(received[0].title, "GPT-5 深度解读");
  assert.equal(received[0].source, "feishu-inbox");
});

test("poller skips stale history on first startup", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const received = [];
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    onItem: (item) => received.push(item),
    execFileImpl: fakeExec([
      {
        match: ["auth", "status"],
        stdout: JSON.stringify({ ok: true, logged_in: true })
      },
      {
        match: ["+chat-list"],
        stdout: JSON.stringify({ ok: true, data: { chats: [{ name: "domi 收件箱", chat_id: "oc_x" }] } })
      },
      {
        match: ["+chat-messages-list"],
        stdout: JSON.stringify({
          ok: true,
          data: {
            messages: [{
              message_id: "om_old",
              create_time: feishuTime(3600_000),
              body: { content: JSON.stringify({ text: "https://example.com/old" }) }
            }]
          }
        })
      }
    ])
  });
  await poller.pollOnce();
  assert.equal(received.length, 0);
});

test("poller creates the inbox group when the chat list misses", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const execFileImpl = fakeExec([
    {
      match: ["auth", "status"],
      stdout: JSON.stringify({ ok: true, logged_in: true })
    },
    {
      match: ["+chat-list"],
      stdout: JSON.stringify({ ok: true, data: { chats: [] } })
    },
    {
      match: ["+chat-create"],
      stdout: JSON.stringify({ ok: true, data: { chat_id: "oc_new_group" } })
    },
    {
      match: ["+chat-messages-list"],
      stdout: JSON.stringify({ ok: true, data: { messages: [] } })
    }
  ]);
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    onItem: () => {},
    execFileImpl
  });
  await poller.pollOnce();
  assert.equal(poller.chatId, "oc_new_group");
});

test("poller ignores threaded replies to its own confirmations", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const received = [];
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    onItem: (item) => received.push(item),
    execFileImpl: fakeExec([
      {
        match: ["auth", "status"],
        stdout: JSON.stringify({ ok: true, logged_in: true })
      },
      {
        match: ["+chat-list"],
        stdout: JSON.stringify({ ok: true, data: { chats: [{ name: "domi 收件箱", chat_id: "oc_x" }] } })
      },
      {
        match: ["+chat-messages-list"],
        stdout: JSON.stringify({
          ok: true,
          data: {
            messages: [{
              message_id: "om_reply",
              create_time: feishuTime(5000),
              reply_to: "om_user_message",
              msg_type: "text",
              body: { content: JSON.stringify({ text: "✅ 已收到，正在处理：《https://example.com/a》" }) }
            }]
          }
        })
      }
    ])
  });
  await poller.pollOnce();
  assert.equal(received.length, 0);
});

test("fileMessageDescriptor unwraps Feishu file and image messages", () => {
  const fileMessage = {
    msg_type: "file",
    body: { content: JSON.stringify({ file_key: "file_v3_abc", file_name: "AI 报告.pdf" }) }
  };
  assert.deepEqual(fileMessageDescriptor(fileMessage), {
    fileKey: "file_v3_abc",
    fileName: "AI 报告.pdf",
    resourceType: "file"
  });
  assert.equal(fileMessageDescriptor({ msg_type: "text", body: { content: "{}" } }), null);
  assert.equal(fileMessageDescriptor({ msg_type: "file", body: { content: "not-json" } }), null);
  assert.equal(
    fileMessageDescriptor({ msg_type: "file", body: { content: JSON.stringify({ file_key: "file_v3_x" }) } }),
    null
  );
  // Native image messages: only an image_key, no file name.
  const imageMessage = {
    msg_type: "image",
    body: { content: JSON.stringify({ image_key: "img_v2_abc" }) }
  };
  assert.deepEqual(fileMessageDescriptor(imageMessage), {
    fileKey: "img_v2_abc",
    fileName: "",
    resourceType: "image"
  });
  assert.equal(
    fileMessageDescriptor({ msg_type: "image", body: { content: JSON.stringify({}) } }),
    null
  );
});

function baseOutputs(messages, extraOutputs = []) {
  return [
    {
      match: ["auth", "status"],
      stdout: JSON.stringify({ ok: true, logged_in: true })
    },
    {
      match: ["+chat-list"],
      stdout: JSON.stringify({ ok: true, data: { chats: [{ name: "domi 收件箱", chat_id: "oc_x" }] } })
    },
    {
      match: ["+chat-messages-list"],
      stdout: JSON.stringify({ ok: true, data: { has_more: false, messages } })
    },
    ...extraOutputs
  ];
}

test("poller downloads inbox PDF files and emits a file intake item", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const pdfMessage = {
    message_id: "om_file1",
    create_time: feishuTime(5000),
    msg_type: "file",
    body: { content: JSON.stringify({ file_key: "file_v3_pdf", file_name: "算力行业报告.pdf" }) }
  };
  const received = [];
  const execFileImpl = fakeExec(baseOutputs([pdfMessage], [
    {
      match: ["+messages-resources-download", "om_file1"],
      stdout: JSON.stringify({ ok: true, data: { file_path: "算力行业报告.pdf" } }),
      sideEffect: (args, options) => {
        const output = args[args.indexOf("--output") + 1];
        fs.writeFileSync(path.join(options.cwd, output), "%PDF-1.4 fake");
      }
    },
    {
      match: ["+messages-reply", "om_file1"],
      stdout: JSON.stringify({ ok: true })
    }
  ]));
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    filesDir: path.join(root, "intake-files"),
    onItem: (item) => received.push(item),
    execFileImpl
  });
  poller.loadState();
  await poller.pollOnce();

  assert.equal(received.length, 1);
  assert.equal(received[0].kind, "file");
  assert.equal(received[0].fileName, "算力行业报告.pdf");
  assert.ok(received[0].filePath.endsWith("算力行业报告.pdf"));
  assert.ok(fs.existsSync(received[0].filePath));
  assert.ok(received[0].fileSize > 0);

  // Download ran inside the per-message drop folder with a relative output.
  const downloadCall = execFileImpl.calls.find((call) => call.args.includes("+messages-resources-download"));
  assert.ok(downloadCall);
  assert.equal(path.basename(downloadCall.options.cwd), "om_file1");
  assert.equal(path.dirname(downloadCall.options.cwd), path.join(root, "intake-files"));
  assert.ok(!path.isAbsolute(downloadCall.args[downloadCall.args.indexOf("--output") + 1]));

  // Confirmation replied in-thread and the message is deduped on the next poll.
  const replyCall = execFileImpl.calls.find((call) => call.args.includes("+messages-reply"));
  assert.ok(replyCall.args.some((token) => String(token).includes("算力行业报告.pdf")));
  received.length = 0;
  await poller.pollOnce();
  assert.equal(received.length, 0);
});

test("poller rejects unsupported attachments with an explanatory reply", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const received = [];
  const execFileImpl = fakeExec(baseOutputs([{
    message_id: "om_zip",
    create_time: feishuTime(5000),
    msg_type: "file",
    body: { content: JSON.stringify({ file_key: "file_v3_zip", file_name: "资料.zip" }) }
  }], [
    {
      match: ["+messages-reply", "om_zip"],
      stdout: JSON.stringify({ ok: true })
    }
  ]));
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    filesDir: path.join(root, "intake-files"),
    onItem: (item) => received.push(item),
    execFileImpl
  });
  poller.loadState();
  await poller.pollOnce();

  assert.equal(received.length, 0);
  const downloadCall = execFileImpl.calls.find((call) => call.args.includes("+messages-resources-download"));
  assert.equal(downloadCall, undefined);
  const replyCall = execFileImpl.calls.find((call) => call.args.includes("+messages-reply"));
  assert.ok(replyCall.args.some((token) => String(token).includes("暂不支持")));
  assert.ok(replyCall.args.some((token) => String(token).includes("Excel")));
});

test("poller downloads inbox spreadsheet files and emits a file intake item", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const excelMessage = {
    message_id: "om_xlsx",
    create_time: feishuTime(5000),
    msg_type: "file",
    body: { content: JSON.stringify({ file_key: "file_v3_xlsx", file_name: "算力供给数据.xlsx" }) }
  };
  const received = [];
  const execFileImpl = fakeExec(baseOutputs([excelMessage], [
    {
      match: ["+messages-resources-download", "om_xlsx"],
      stdout: JSON.stringify({ ok: true, data: { file_path: "算力供给数据.xlsx" } }),
      sideEffect: (args, options) => {
        const output = args[args.indexOf("--output") + 1];
        fs.writeFileSync(path.join(options.cwd, output), "fake xlsx bytes");
      }
    },
    {
      match: ["+messages-reply", "om_xlsx"],
      stdout: JSON.stringify({ ok: true })
    }
  ]));
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    filesDir: path.join(root, "intake-files"),
    onItem: (item) => received.push(item),
    execFileImpl
  });
  poller.loadState();
  await poller.pollOnce();

  assert.equal(received.length, 1);
  assert.equal(received[0].kind, "file");
  assert.equal(received[0].fileName, "算力供给数据.xlsx");
  assert.ok(fs.existsSync(received[0].filePath));
});

test("poller downloads native image messages with --type image", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const imageMessage = {
    message_id: "om_img1",
    create_time: feishuTime(5000),
    msg_type: "image",
    body: { content: JSON.stringify({ image_key: "img_v2_whiteboard" }) }
  };
  const received = [];
  const execFileImpl = fakeExec(baseOutputs([imageMessage], [
    {
      match: ["+messages-resources-download", "om_img1"],
      // lark-cli resolves the real extension only at save time.
      stdout: JSON.stringify({ ok: true, data: { file_path: "收件箱图片-om_img1.jpg" } }),
      sideEffect: (args, options) => {
        fs.writeFileSync(path.join(options.cwd, "收件箱图片-om_img1.jpg"), "fake jpeg bytes");
      }
    },
    {
      match: ["+messages-reply", "om_img1"],
      stdout: JSON.stringify({ ok: true })
    }
  ]));
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    filesDir: path.join(root, "intake-files"),
    onItem: (item) => received.push(item),
    execFileImpl
  });
  poller.loadState();
  await poller.pollOnce();

  assert.equal(received.length, 1);
  assert.equal(received[0].kind, "file");
  assert.equal(received[0].fileName, "收件箱图片-om_img1.jpg");
  assert.ok(fs.existsSync(received[0].filePath));

  const downloadCall = execFileImpl.calls.find((call) => call.args.includes("+messages-resources-download"));
  assert.ok(downloadCall);
  assert.equal(downloadCall.args[downloadCall.args.indexOf("--file-key") + 1], "img_v2_whiteboard");
  assert.equal(downloadCall.args[downloadCall.args.indexOf("--type") + 1], "image");
  // The requested output name carries no extension guess of its own.
  const requestedOutput = downloadCall.args[downloadCall.args.indexOf("--output") + 1];
  assert.ok(!path.extname(requestedOutput));
});

test("poller replies failure when the inbox file download fails", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const received = [];
  const execFileImpl = fakeExec(baseOutputs([{
    message_id: "om_fail",
    create_time: feishuTime(5000),
    msg_type: "file",
    body: { content: JSON.stringify({ file_key: "file_v3_dead", file_name: "大文件.pdf" }) }
  }], [
    {
      match: ["+messages-resources-download", "om_fail"],
      error: new Error("download exploded")
    },
    {
      match: ["+messages-reply", "om_fail"],
      stdout: JSON.stringify({ ok: true })
    }
  ]));
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    filesDir: path.join(root, "intake-files"),
    onItem: (item) => received.push(item),
    execFileImpl
  });
  poller.loadState();
  await poller.pollOnce();

  assert.equal(received.length, 0);
  assert.equal(execFileImpl.calls.some((call) => call.args.includes("+messages-reply")), false);
  assert.equal(poller.processedMessageIds.has("om_fail"), false);
  await poller.pollOnce();
  assert.equal(execFileImpl.calls.filter((call) => call.args.includes("+messages-resources-download")).length, 2);
});

test("failed URL dispatch is retried without losing later messages", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const statePath = path.join(root, "state.json");
  const messages = [
    { message_id: "om_retry", create_time: feishuTime(5000), msg_type: "text", body: { content: JSON.stringify({ text: "https://example.com/retry" }) } },
    { message_id: "om_later", create_time: feishuTime(4000), msg_type: "text", body: { content: JSON.stringify({ text: "https://example.com/later" }) } }
  ];
  const received = [];
  let fail = true;
  const execFileImpl = fakeExec(baseOutputs(messages, [
    { match: ["+messages-reply"], stdout: JSON.stringify({ ok: true }) }
  ]));
  const options = {
    larkCliPath: "lark-cli", statePath, execFileImpl,
    onItem: (item) => {
      if (fail) throw new Error("temporarily unavailable");
      received.push(item.url);
    }
  };
  const poller = new FeishuIntakePoller(options);
  poller.loadState();
  await poller.pollOnce();
  assert.deepEqual(received, []);
  assert.equal(poller.retryAttempts.om_retry, 1);
  assert.equal(poller.lastMessageTime, "");
  assert.equal(execFileImpl.calls.some((call) => call.args.includes("+messages-reply")), false);
  fail = false;
  const resumed = new FeishuIntakePoller(options);
  resumed.loadState();
  await resumed.pollOnce();
  assert.deepEqual(received, ["https://example.com/retry", "https://example.com/later"]);
  assert.equal(resumed.retryAttempts.om_retry, undefined);
});

test("corrupted inbox cursor never silently resets or overwrites state", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const statePath = path.join(root, "state.json");
  fs.writeFileSync(statePath, '{"chatId":');
  const poller = new FeishuIntakePoller({ larkCliPath: "lark-cli", statePath });
  assert.throws(() => poller.loadState(), /状态读取失败/);
  assert.equal(fs.readFileSync(statePath, "utf8"), '{"chatId":');
});

test("poller stays quiet when auth is not ready", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const calls = [];
  const execFileImpl = (cli, args, options, callback) => {
    calls.push(args);
    callback(null, JSON.stringify({ ok: false, error: { type: "auth", message: "no token" } }));
  };
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    onItem: () => {},
    execFileImpl
  });
  await poller.pollOnce();
  // Only the auth status call happened; no message listing was attempted.
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes("status"));
});

test("poller pauses with one guidance log when the lark-cli user identity is missing", async () => {
  // Real-world shape (2026-10 incident): the user token expires, auth status
  // reports only the bot identity as ready. Without the identities check the
  // poller fell back to the bot identity and hammered a doomed call
  // (230002/230027) every 30 seconds for days.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const calls = [];
  const logs = [];
  const authStatus = JSON.stringify({
    appId: "cli_test",
    identities: {
      bot: { status: "ready", available: true },
      user: { status: "missing", available: false }
    },
    identity: "bot"
  });
  const execFileImpl = (cli, args, options, callback) => {
    calls.push(args);
    callback(null, authStatus);
  };
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    onItem: () => {},
    logger: (message) => logs.push(message),
    execFileImpl
  });
  poller.loadState();
  await poller.pollOnce();
  await poller.pollOnce();
  // Never left the auth check: no chat-list, no message listing.
  assert.equal(calls.length, 2);
  assert.ok(calls.every((args) => args.includes("status")));
  // The actionable guidance is logged exactly once, not once per tick.
  const guidance = logs.filter((line) => line.includes("feishu-intake paused"));
  assert.equal(guidance.length, 1);
  assert.ok(guidance[0].includes("重新完成授权"));
});

test("poller rebinds the inbox chat after a 230002 membership loss", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const statePath = path.join(root, "state.json");
  const received = [];
  const logs = [];
  const calls = [];
  const urlMessage = {
    message_id: "om_rebound",
    create_time: feishuTime(3000),
    msg_type: "text",
    body: { content: JSON.stringify({ text: "https://example.com/after-rebind" }) }
  };
  const execFileImpl = (cli, args, options, callback) => {
    calls.push(args);
    const joined = args.join(" ");
    if (joined.includes("auth status")) {
      return callback(null, JSON.stringify({ identities: { user: { status: "ready", available: true } } }));
    }
    if (joined.includes("+chat-list")) {
      return callback(null, JSON.stringify({ ok: true, data: { chats: [{ name: "domi 收件箱", chat_id: "oc_fresh" }] } }));
    }
    if (joined.includes("+chat-messages-list")) {
      if (joined.includes("oc_stale")) {
        return callback(new Error(
          'Command failed: lark-cli im +chat-messages-list --chat-id oc_stale\n' +
          '{"ok":false,"error":{"code":230002,"message":"Bot/User can NOT be out of the chat."}}'
        ), "");
      }
      return callback(null, JSON.stringify({ ok: true, data: { has_more: false, messages: [urlMessage] } }));
    }
    if (joined.includes("+messages-reply")) {
      return callback(null, JSON.stringify({ ok: true }));
    }
    callback(new Error("unexpected command"), "");
  };
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath,
    onItem: (item) => received.push(item),
    logger: (message) => logs.push(message),
    execFileImpl
  });
  poller.loadState();
  poller.chatId = "oc_stale";
  await poller.pollOnce();
  // The stale chat was dropped and re-resolved by inbox name.
  assert.equal(poller.chatId, "oc_fresh");
  assert.ok(logs.some((line) => line.includes("rebinding inbox chat")));
  const saved = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(saved.chatId, "oc_fresh");
  // The next poll runs against the fresh chat and picks up the message.
  await poller.pollOnce();
  assert.deepEqual(received.map((item) => item.url), ["https://example.com/after-rebind"]);
  const listCalls = calls.filter((args) => args.includes("+chat-messages-list"));
  assert.equal(listCalls.length, 2);
  assert.ok(listCalls[1].includes("oc_fresh"));
});

test("repeated identical poll failures are logged with throttling, not every tick", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-feishu-intake-"));
  const logs = [];
  const execFileImpl = (cli, args, options, callback) => {
    const joined = args.join(" ");
    if (joined.includes("auth status")) {
      return callback(null, JSON.stringify({ identities: { user: { status: "ready", available: true } } }));
    }
    if (joined.includes("+chat-messages-list")) {
      return callback(new Error('Command failed: lark-cli im +chat-messages-list\n{"ok":false,"error":{"code":230027,"message":"access denied"}}'), "");
    }
    callback(new Error("unexpected command"), "");
  };
  const poller = new FeishuIntakePoller({
    larkCliPath: "lark-cli",
    statePath: path.join(root, "state.json"),
    onItem: () => {},
    logger: (message) => logs.push(message),
    execFileImpl
  });
  poller.loadState();
  poller.chatId = "oc_any";
  // 25 consecutive identical failures at 30s each ≈ 12 minutes of outage.
  for (let index = 0; index < 25; index += 1) {
    await poller.pollOnce();
  }
  const failures = logs.filter((line) => line.includes("poll failed") || line.includes("poll still failing"));
  // First failure logs immediately; only the 20th repeat logs again.
  assert.equal(failures.length, 2);
  assert.ok(failures[0].includes("poll failed"));
  assert.ok(failures[1].includes("x20"));
});
