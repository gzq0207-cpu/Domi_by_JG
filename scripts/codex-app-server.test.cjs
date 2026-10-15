const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  CodexAppServer,
  canonicalCodexRuntime,
  resolveCodexBinary
} = require("../electron/codex-app-server.cjs");
const { isSelectedCodexConnectionReady } = require("../electron/codex-protocol.cjs");

function writeFakeCodex(binaryPath, source) {
  fs.writeFileSync(binaryPath, source, { mode: 0o755 });
  fs.writeFileSync(
    path.join(path.dirname(binaryPath), "codex-code-mode-host"),
    "#!/bin/sh\nexit 0\n",
    { mode: 0o755 }
  );
}

test("dynamic library tool requests return source data and errors via the native protocol", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-dynamic-tools-"));
  const fakeCodexPath = path.join(directory, "fake-codex");
  writeFakeCodex(fakeCodexPath, `#!/usr/bin/env node
const readline = require("node:readline");
let pending;
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") process.stdout.write(JSON.stringify({ id: message.id, result: {} }) + "\\n");
  if (message.method === "invoke") {
    pending = message.id;
    process.stdout.write(JSON.stringify({ id: "tool-1", method: "item/tool/call", params: { threadId: "t", turnId: "v", callId: "c", tool: "domi_library_read", arguments: message.params } }) + "\\n");
  }
  if (message.id === "tool-1" && message.result) process.stdout.write(JSON.stringify({ id: pending, result: message.result }) + "\\n");
});
`);
  const server = new CodexAppServer({ cwd: directory, version: "test", runtimeProvider: () => ({ codexPath: fakeCodexPath }),
    onDynamicToolCall: async (params) => {
      if (params.arguments.fail) throw new Error("正文读取失败");
      return { ok: true, content: "关键原文", path: "a.md" };
    } });
  try {
    const success = await server.request("invoke", {});
    assert.equal(success.success, true);
    assert.equal(success.contentItems[0].type, "inputText");
    assert.equal(JSON.parse(success.contentItems[0].text).content, "关键原文");
    const failed = await server.request("invoke", { fail: true });
    assert.equal(failed.success, false);
    assert.match(failed.contentItems[0].text, /正文读取失败/);
  } finally { await closeServerAndRemove(server, directory); }
});

async function closeServerAndRemove(server, directory) {
  server.close();
  if (process.platform === "win32") {
    // Windows：子进程异步退出会短暂锁定以其为工作目录的临时目录。
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fs.rmSync(directory, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100
  });
}

test("Codex symlinks resolve to the real runtime directory containing the command host", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-codex-symlink-test-"));
  try {
    if (process.platform === "win32") {
      // Windows 无特权时无法创建符号链接；包管理器在 Windows 上通过
      // 目录 junction 安装运行时，realpath 解析语义与符号链接一致。
      const runtimeDirectory = path.join(root, "runtime");
      const binDirectory = path.join(runtimeDirectory, "bin");
      fs.mkdirSync(binDirectory, { recursive: true });
      writeFakeCodex(path.join(binDirectory, "codex.exe"), "@echo off\r\n");
      const shimDirectory = path.join(root, "shims");
      fs.symlinkSync(runtimeDirectory, shimDirectory, "junction");
      const shim = path.join(shimDirectory, "bin", "codex.exe");

      const canonicalBinary = fs.realpathSync.native(path.join(binDirectory, "codex.exe"));
      assert.equal(resolveCodexBinary(shim), canonicalBinary);
      assert.equal(
        canonicalCodexRuntime(shim)?.hostPath,
        path.join(path.dirname(canonicalBinary), "codex-code-mode-host")
      );
      return;
    }
    const runtimeDirectory = path.join(root, "runtime");
    const shimDirectory = path.join(root, "shims");
    fs.mkdirSync(runtimeDirectory, { recursive: true });
    fs.mkdirSync(shimDirectory, { recursive: true });
    const realBinary = path.join(runtimeDirectory, "codex");
    writeFakeCodex(realBinary, "#!/bin/sh\nexit 0\n");
    const shim = path.join(shimDirectory, "codex");
    fs.symlinkSync(realBinary, shim);

    const canonicalBinary = fs.realpathSync.native(realBinary);
    assert.equal(resolveCodexBinary(shim), canonicalBinary);
    assert.equal(
      canonicalCodexRuntime(shim)?.hostPath,
      path.join(path.dirname(canonicalBinary), "codex-code-mode-host")
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an executable without codex-code-mode-host is not a complete runtime", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-codex-incomplete-test-"));
  try {
    const binary = path.join(root, "codex");
    fs.writeFileSync(binary, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    assert.equal(canonicalCodexRuntime(binary), null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ChatGPT and Responses relay are independent connection choices", () => {
  assert.equal(isSelectedCodexConnectionReady({
    authMode: "chatgpt",
    requiresOpenaiAuth: true,
    account: { email: "user@example.com" },
    relayCredentialStored: false
  }), true);
  assert.equal(isSelectedCodexConnectionReady({
    authMode: "chatgpt",
    requiresOpenaiAuth: true,
    account: null,
    relayCredentialStored: true
  }), false);
  assert.equal(isSelectedCodexConnectionReady({
    authMode: "relay",
    requiresOpenaiAuth: true,
    account: null,
    relayCredentialStored: true
  }), true);
  assert.equal(isSelectedCodexConnectionReady({
    authMode: "relay",
    requiresOpenaiAuth: false,
    account: { email: "user@example.com" },
    relayCredentialStored: false
  }), false);
});

test("concurrent requests wait for Codex App Server initialization", async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-codex-init-test-"));
  const fakeCodexPath = path.join(temporaryDirectory, "fake-codex");
  writeFakeCodex(fakeCodexPath, `#!/usr/bin/env node
const readline = require("node:readline");
let initialized = false;
let initializeCapabilities = null;
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    initializeCapabilities = message.params.capabilities || null;
    setTimeout(() => {
      initialized = true;
      process.stdout.write(JSON.stringify({ id: message.id, result: { ok: true } }) + "\\n");
    }, 50);
    return;
  }
  if (message.method === "ping") {
    if (!initialized) {
      process.stdout.write(JSON.stringify({
        id: message.id,
        error: { code: -32002, message: "Not initialized" }
      }) + "\\n");
      return;
    }
    process.stdout.write(JSON.stringify({ id: message.id, result: { ok: true } }) + "\\n");
    return;
  }
  if (message.method === "capabilities") {
    process.stdout.write(JSON.stringify({
      id: message.id,
      result: initializeCapabilities
    }) + "\\n");
  }
});
`);

  const server = new CodexAppServer({
    cwd: temporaryDirectory,
    version: "test",
    requestTimeoutMs: 3_000,
    onLog: (text) => process.stderr.write(text),
    runtimeProvider: () => ({ codexPath: fakeCodexPath })
  });

  try {
    const results = await Promise.all([
      server.request("ping"),
      server.request("ping"),
      server.request("ping")
    ]);
    assert.deepEqual(results, [{ ok: true }, { ok: true }, { ok: true }]);
    assert.deepEqual(await server.request("capabilities"), { experimentalApi: true });
    assert.deepEqual(server.capabilities(), { experimentalApi: true });
  } finally {
    await closeServerAndRemove(server, temporaryDirectory);
  }
});

test("unsupported experimental capability falls back during initialization", async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-codex-capability-test-"));
  const fakeCodexPath = path.join(temporaryDirectory, "fake-codex");
  writeFakeCodex(fakeCodexPath, `#!/usr/bin/env node
const readline = require("node:readline");
let initializeAttempts = 0;
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    initializeAttempts += 1;
    if (message.params.capabilities?.experimentalApi === true) {
      process.stdout.write(JSON.stringify({
        id: message.id,
        error: { code: -32602, message: "unknown capability experimentalApi" }
      }) + "\\n");
      return;
    }
    process.stdout.write(JSON.stringify({ id: message.id, result: { ok: true } }) + "\\n");
    return;
  }
  if (message.method === "attempts") {
    process.stdout.write(JSON.stringify({
      id: message.id,
      result: { initializeAttempts }
    }) + "\\n");
  }
});
`);

  const logs = [];
  const server = new CodexAppServer({
    cwd: temporaryDirectory,
    version: "test",
    requestTimeoutMs: 3_000,
    onLog: (text) => logs.push(text),
    runtimeProvider: () => ({ codexPath: fakeCodexPath })
  });

  try {
    await server.start();
    assert.deepEqual(server.capabilities(), { experimentalApi: false });
    assert.deepEqual(await server.request("attempts"), { initializeAttempts: 2 });
    assert.match(logs.join(""), /稳定兼容模式/);
  } finally {
    await closeServerAndRemove(server, temporaryDirectory);
  }
});

test("Codex App Server requests time out without poisoning later requests", async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-codex-server-test-"));
  const fakeCodexPath = path.join(temporaryDirectory, "fake-codex");
  writeFakeCodex(fakeCodexPath, `#!/usr/bin/env node
const readline = require("node:readline");
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize" || message.method === "ping") {
    process.stdout.write(JSON.stringify({ id: message.id, result: { ok: true } }) + "\\n");
  }
});
`);

  const server = new CodexAppServer({
    cwd: temporaryDirectory,
    version: "test",
    requestTimeoutMs: 3_000,
    onLog: (text) => process.stderr.write(text),
    runtimeProvider: () => ({ codexPath: fakeCodexPath })
  });

  try {
    await server.start();
    await assert.rejects(
      server.request("hang", {}, { timeoutMs: 30 }),
      (error) => error?.code === "DOMI_CODEX_REQUEST_TIMEOUT"
    );
    assert.deepEqual(await server.request("ping"), { ok: true });
  } finally {
    await closeServerAndRemove(server, temporaryDirectory);
  }
});

test("stderr log callback failures never crash the app server", async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-codex-epipe-test-"));
  const fakeCodexPath = path.join(temporaryDirectory, "fake-codex");
  writeFakeCodex(fakeCodexPath, `#!/usr/bin/env node
const readline = require("node:readline");
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize" || message.method === "noisy") {
    if (message.method === "noisy") {
      process.stderr.write("codex stderr noise during run\\n");
    }
    process.stdout.write(JSON.stringify({ id: message.id, result: { ok: true } }) + "\\n");
  }
});
`);

  const server = new CodexAppServer({
    cwd: temporaryDirectory,
    version: "test",
    requestTimeoutMs: 3_000,
    // 模拟宿主（main.cjs）stderr 管道已断开：日志回调同步抛出 EPIPE。
    // 回归验证：该异常不能从 stderr data 监听器冒泡成未捕获异常。
    onLog: () => {
      const error = new Error("write EPIPE");
      error.code = "EPIPE";
      throw error;
    },
    runtimeProvider: () => ({ codexPath: fakeCodexPath })
  });

  try {
    await server.start();
    assert.deepEqual(await server.request("noisy"), { ok: true });
    assert.deepEqual(await server.request("noisy"), { ok: true });
    assert.deepEqual(await server.request("noisy"), { ok: true });
  } finally {
    await closeServerAndRemove(server, temporaryDirectory);
  }
});

test("request_user_input waits for a validated answer and duplicate submits are idempotent", async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-codex-user-input-test-"));
  const fakeCodexPath = path.join(temporaryDirectory, "fake-codex");
  writeFakeCodex(fakeCodexPath, `#!/usr/bin/env node
const readline = require("node:readline");
let beginRequestId = null;
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    process.stdout.write(JSON.stringify({ id: message.id, result: { ok: true } }) + "\\n");
    return;
  }
  if (message.method === "begin") {
    beginRequestId = message.id;
    process.stdout.write(JSON.stringify({
      id: "ask-1",
      method: "item/tool/requestUserInput",
      params: {
        threadId: "thread-1",
        item: { turnId: "turn-1" },
        itemId: "item-1",
        isBlocking: true,
        autoResolutionMs: null,
        questions: [{
          id: "project",
          header: "归档位置",
          question: "归入哪个项目？",
          isOther: false,
          isSecret: false,
          options: [
            { label: "芯星元", description: "归入已有项目" },
            { label: "暂不归档", description: "稍后处理" }
          ]
        }]
      }
    }) + "\\n");
    return;
  }
  if (message.id === "ask-1") {
    process.stdout.write(JSON.stringify({
      id: beginRequestId,
      result: { userInputResponse: message.result || null, userInputError: message.error || null }
    }) + "\\n");
  }
});
`);

  let releaseRequest;
  const requestReceived = new Promise((resolve) => { releaseRequest = resolve; });
  const closed = [];
  const server = new CodexAppServer({
    cwd: temporaryDirectory,
    version: "test",
    requestTimeoutMs: 3_000,
    runtimeProvider: () => ({ codexPath: fakeCodexPath }),
    onUserInputRequest: releaseRequest,
    onUserInputRequestClosed: (request) => closed.push(request)
  });

  try {
    const resultPromise = server.request("begin");
    const request = await requestReceived;
    assert.equal(request.id, "ask-1");
    assert.equal(request.params.turnId, "turn-1");
    assert.equal(request.params.questions[0].isSecret, false);
    assert.equal(server.pendingUserInputRequests().length, 1);

    assert.deepEqual(server.answerUserInput("ask-1", { project: ["不存在"] }), {
      ok: false,
      error: "“归档位置”包含无效选项。"
    });
    assert.equal(server.pendingUserInputRequests().length, 1);

    assert.deepEqual(server.answerUserInput("ask-1", { project: ["芯星元"] }), {
      ok: true,
      duplicate: false
    });
    assert.deepEqual(server.answerUserInput("ask-1", { project: ["芯星元"] }), {
      ok: true,
      duplicate: true
    });
    assert.deepEqual(await resultPromise, {
      userInputResponse: { answers: { project: { answers: ["芯星元"] } } },
      userInputError: null
    });
    assert.equal(server.pendingUserInputRequests().length, 0);
    assert.equal(closed.length, 1);
    assert.equal(closed[0].reason, "answered");
  } finally {
    await closeServerAndRemove(server, temporaryDirectory);
  }
});

test("approval requests remain declined and never enter the user-input queue", async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-codex-approval-test-"));
  const fakeCodexPath = path.join(temporaryDirectory, "fake-codex");
  writeFakeCodex(fakeCodexPath, `#!/usr/bin/env node
const readline = require("node:readline");
let beginRequestId = null;
const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    process.stdout.write(JSON.stringify({ id: message.id, result: { ok: true } }) + "\\n");
    return;
  }
  if (message.method === "begin") {
    beginRequestId = message.id;
    process.stdout.write(JSON.stringify({
      id: "approval-1",
      method: "item/commandExecution/requestApproval",
      params: { threadId: "thread-1", turnId: "turn-1", itemId: "item-1" }
    }) + "\\n");
    return;
  }
  if (message.id === "approval-1") {
    process.stdout.write(JSON.stringify({ id: beginRequestId, result: message.result }) + "\\n");
  }
});
`);

  let userInputCount = 0;
  const server = new CodexAppServer({
    cwd: temporaryDirectory,
    version: "test",
    requestTimeoutMs: 3_000,
    runtimeProvider: () => ({ codexPath: fakeCodexPath }),
    onUserInputRequest: () => { userInputCount += 1; }
  });
  try {
    assert.deepEqual(await server.request("begin"), { decision: "decline" });
    assert.equal(userInputCount, 0);
    assert.equal(server.pendingUserInputRequests().length, 0);
  } finally {
    await closeServerAndRemove(server, temporaryDirectory);
  }
});
