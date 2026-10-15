const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  agentCliLoginStatus,
  buildAgentCliArgs,
  discoverAgentCli,
  normalizeCliUsage,
  parseAgentStreamLine,
  spawnAgentRun
} = require("../electron/agent-adapter.cjs");

test("claude stream-json lines normalize into domi run events", () => {
  const init = parseAgentStreamLine(JSON.stringify({
    type: "system",
    subtype: "init",
    session_id: "sess-abc",
    model: "claude-sonnet-4-5"
  }));
  assert.deepEqual(init, { type: "session", sessionId: "sess-abc", model: "claude-sonnet-4-5" });

  const assistant = parseAgentStreamLine(JSON.stringify({
    type: "assistant",
    message: {
      content: [
        { type: "text", text: "第一段" },
        { type: "tool_use", id: "t1" },
        { type: "text", text: "第二段" }
      ],
      usage: { input_tokens: 8, output_tokens: 4, cache_read_input_tokens: 6 }
    }
  }));
  assert.equal(assistant.type, "assistant");
  assert.equal(assistant.text, "第一段第二段");
  assert.deepEqual(assistant.usage, {
    input_tokens: 8,
    cached_input_tokens: 6,
    cache_write_input_tokens: 0,
    output_tokens: 4,
    reasoning_output_tokens: 0
  });

  const result = parseAgentStreamLine(JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    result: "完成",
    session_id: "sess-abc",
    usage: { input_tokens: 20, output_tokens: 9 }
  }));
  assert.equal(result.type, "result");
  assert.equal(result.subtype, "success");
  assert.equal(result.text, "完成");

  assert.equal(parseAgentStreamLine(""), null);
  assert.deepEqual(parseAgentStreamLine("普通纯文本行"), { type: "raw", text: "普通纯文本行" });
  assert.deepEqual(parseAgentStreamLine("{\"foo\": 1}"), { type: "raw", text: "{\"foo\": 1}" });
  assert.deepEqual(parseAgentStreamLine(JSON.stringify({ type: "user", message: {} })), { type: "ignored", rawType: "user" });
});

test("claude usage mapping covers cache fields and skips empty usage", () => {
  assert.equal(normalizeCliUsage(null), null);
  assert.equal(normalizeCliUsage({}), null);
  assert.deepEqual(
    normalizeCliUsage({ input_tokens: 7, output_tokens: 3, cache_creation_input_tokens: 2 }),
    {
      input_tokens: 7,
      cached_input_tokens: 0,
      cache_write_input_tokens: 2,
      output_tokens: 3,
      reasoning_output_tokens: 0
    }
  );
});

test("buildAgentCliArgs assembles model, resume and workbuddy templates", () => {
  assert.deepEqual(
    buildAgentCliArgs("claude", { claudeModel: "claude-sonnet-4-5" }, {}),
    [
      "-p", "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions",
      "--model", "claude-sonnet-4-5"
    ]
  );
  assert.deepEqual(
    buildAgentCliArgs("claude", {}, { threadId: "sess-9", ephemeral: false }),
    [
      "-p", "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions",
      "--resume", "sess-9"
    ]
  );
  assert.equal(
    buildAgentCliArgs("claude", {}, { threadId: "sess-9", ephemeral: true })
      .includes("--resume"),
    false
  );
  assert.deepEqual(
    buildAgentCliArgs("workbuddy", { workbuddyArgs: "run --model {model} --session {sessionId}", claudeModel: "m1" }, { threadId: "s2" }),
    ["run", "--model", "m1", "--session", "s2"]
  );
});

test("discoverAgentCli honours custom paths and reports missing binaries", () => {
  const missing = discoverAgentCli("claude", "");
  assert.equal(typeof missing.ok, "boolean");
  const bogus = discoverAgentCli("claude", "Z:/definitely/not/here.exe");
  assert.equal(bogus.ok, false);
  assert.match(bogus.error, /不存在/);
  assert.equal(discoverAgentCli("unknown-engine", "").ok, false);
});

test("agentCliLoginStatus describes claude credentials without leaking secrets", () => {
  const status = agentCliLoginStatus("claude");
  assert.equal(typeof status.loggedIn, "boolean");
  const workbuddy = agentCliLoginStatus("workbuddy");
  assert.equal(workbuddy.loggedIn, null);
});

test("spawnAgentRun pipes the prompt via stdin and maps a successful stream", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-agent-adapter-"));
  try {
    const fakeCli = path.join(root, "fake-claude.js");
    fs.writeFileSync(fakeCli, [
      "const chunks = [];"
      , "process.stdin.on(\"data\", (c) => chunks.push(c));"
      , "process.stdin.on(\"end\", () => {"
      , "  const prompt = Buffer.concat(chunks).toString(\"utf8\");"
      , "  const reply = { received: prompt };"
      , "  process.stdout.write(JSON.stringify({ type: \"system\", subtype: \"init\", session_id: \"sess-1\", model: \"claude-sonnet-4-5\" }) + \"\\n\");"
      , "  process.stdout.write(JSON.stringify({ type: \"assistant\", message: { content: [{ type: \"text\", text: \"回声：\" + reply.received }] } }) + \"\\n\");"
      , "  process.stdout.write(JSON.stringify({ type: \"result\", subtype: \"success\", is_error: false, result: \"完成\", session_id: \"sess-1\", usage: { input_tokens: 5, output_tokens: 2 } }) + \"\\n\");"
      , "});"
    ].join("\n"), "utf8");

    const events = [];
    const outcome = await new Promise((resolve, reject) => {
      const handle = spawnAgentRun({
        engineId: "claude",
        cliPath: fakeCli,
        args: buildAgentCliArgs("claude", {}, {}),
        workspacePath: root,
        prompt: "你好 domi",
        onEvent: (event) => events.push(event),
        onExit: resolve
      });
      handle.process.on("error", reject);
      setTimeout(() => reject(new Error("fake cli timed out")), 20000).unref?.();
    });

    assert.equal(outcome.type, "completed");
    const session = events.find((event) => event.type === "session");
    assert.equal(session.sessionId, "sess-1");
    const assistant = events.find((event) => event.type === "assistant");
    assert.equal(assistant.text, "回声：你好 domi");
    const result = events.find((event) => event.type === "result");
    assert.equal(result.subtype, "success");
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
  }
});

