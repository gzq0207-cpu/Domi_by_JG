// Agent CLI 执行器适配层：把 Claude Code / WorkBuddy 的本地客户端接入 domi
// 的任务运行时（事件流、用量、停止、会话续接），使用它们的订阅登录额度。
// domi 的 codex 事件协议保持不变，renderer 无需感知引擎差异。

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");

const ENGINE_PRESETS = Object.freeze({
  claude: Object.freeze({
    label: "Claude",
    binaryNames: Object.freeze(["claude", "claude.exe", "claude.cmd"]),
    homeCandidates: Object.freeze([
      path.join(".local", "bin", "claude.exe"),
      path.join(".local", "bin", "claude"),
      path.join(".claude", "local", "claude.exe"),
      path.join(".claude", "local", "claude.cmd")
    ]),
    headlessArgs: Object.freeze([
      "-p",
      "--output-format", "stream-json",
      "--verbose",
      "--dangerously-skip-permissions"
    ]),
    versionArgs: Object.freeze(["--version"])
  }),
  workbuddy: Object.freeze({
    label: "WorkBuddy",
    binaryNames: Object.freeze(["workbuddy", "workbuddy.exe", "workbuddy.cmd", "WorkBuddy.exe"]),
    homeCandidates: Object.freeze([
      path.join(".workbuddy", "bin", "workbuddy.exe"),
      path.join(".local", "bin", "workbuddy.exe")
    ]),
    headlessArgs: Object.freeze([
      "-p",
      "--output-format", "stream-json",
      "--verbose"
    ]),
    versionArgs: Object.freeze(["--version"])
  })
});

function enginePreset(engineId) {
  return ENGINE_PRESETS[String(engineId || "").trim()] || null;
}

function isFile(target) {
  try {
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
}

// 同步扫描 PATH：Windows 下按 PATHEXT 逐个拼接，避免依赖外部 where/which。
function findOnPath(binaryName) {
  const directories = String(process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? String(process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)
    : [""];
  for (const directory of directories) {
    if (path.extname(binaryName)) {
      const direct = path.join(directory, binaryName);
      if (isFile(direct)) return direct;
      continue;
    }
    for (const extension of extensions) {
      const candidate = path.join(directory, binaryName + extension);
      if (isFile(candidate)) return candidate;
    }
  }
  return "";
}

// 发现引擎可执行文件：自定义路径 → PATH → 用户主目录常见安装位。
function discoverAgentCli(engineId, customPath = "") {
  const preset = enginePreset(engineId);
  if (!preset) {
    return { ok: false, path: "", via: "", error: "未知执行器，只支持 claude 与 workbuddy。" };
  }
  const trimmedCustom = String(customPath || "").trim();
  if (trimmedCustom) {
    const resolved = path.resolve(trimmedCustom);
    if (isFile(resolved)) {
      return { ok: true, path: resolved, via: "custom" };
    }
    return {
      ok: false,
      path: resolved,
      via: "custom",
      error: `${preset.label} 可执行文件不存在：${resolved}`
    };
  }
  for (const binaryName of preset.binaryNames) {
    const hit = findOnPath(binaryName);
    if (hit) return { ok: true, path: hit, via: "path" };
  }
  const home = os.homedir();
  for (const relative of preset.homeCandidates) {
    const candidate = path.join(home, relative);
    if (isFile(candidate)) {
      return { ok: true, path: candidate, via: "home" };
    }
  }
  return {
    ok: false,
    path: "",
    via: "",
    error: `未找到 ${preset.label} 可执行文件。请先安装并登录其本地客户端，或在设置中填写可执行文件的完整路径。`
  };
}

// 登录态检测：Claude Code 的 OAuth 凭证固定在 ~/.claude/.credentials.json；
// ~/.claude.json 的 oauthAccount 提供账号元信息（只在本机状态卡展示）。
function agentCliLoginStatus(engineId) {
  const preset = enginePreset(engineId);
  if (!preset) return { loggedIn: null, detail: "" };
  if (engineId === "claude") {
    const home = os.homedir();
    const credentialFile = path.join(home, ".claude", ".credentials.json");
    if (isFile(credentialFile)) {
      let accountHint = "";
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(home, ".claude.json"), "utf8"));
        const email = String(meta?.oauthAccount?.emailAddress || "").trim();
        if (email) {
          const [name, domain] = email.split("@");
          accountHint = domain ? `（${name.slice(0, 2)}***@${domain}）` : `（${email.slice(0, 4)}***）`;
        }
      } catch {
        // 状态展示失败不影响登录判定。
      }
      return { loggedIn: true, detail: `已检测到本机 Claude Code 登录凭证${accountHint}` };
    }
    return {
      loggedIn: false,
      detail: "未检测到 Claude Code 登录凭证；请先在终端运行 claude 并完成一次登录。"
    };
  }
  if (engineId === "workbuddy") {
    return {
      loggedIn: null,
      detail: "WorkBuddy 的登录状态以其本地客户端为准；domi 直接复用其凭证运行。"
    };
  }
  return { loggedIn: null, detail: "" };
}

// 组装无头运行参数：提示词走 stdin（避开 Windows 参数长度限制）。
// payload.model 是 codex 的模型 ID，对 CLI 引擎不适用；claude 用设置中的
// claudeModel，留空则使用账号默认模型。workbuddy 支持自定义参数模板。
function buildAgentCliArgs(engineId, settings = {}, payload = {}) {
  const preset = enginePreset(engineId);
  if (!preset) return [];
  if (engineId === "workbuddy") {
    const template = String(settings.workbuddyArgs || "").trim();
    if (template) {
      return template.split(/\s+/).filter(Boolean).map((token) => {
        if (token === "{model}") return String(settings.claudeModel || "").trim();
        if (token === "{sessionId}") return String(payload.threadId || "").trim();
        return token;
      }).filter((token) => token && token !== "{}");
    }
  }
  const args = [...preset.headlessArgs];
  const model = String(settings.claudeModel || "").trim();
  if (model) args.push("--model", model);
  const resumeSessionId = String(payload.threadId || "").trim();
  if (resumeSessionId && payload.ephemeral !== true) {
    args.push("--resume", resumeSessionId);
  }
  return args;
}

// Claude / Claude 兼容流（每行一个 JSON）归一化为 domi 运行事件。
// 未知行保持原样透传，WorkBuddy 等非流式 CLI 退化为纯文本输出。
function parseAgentStreamLine(line) {
  const text = String(line || "").trim();
  if (!text) return null;
  if (!text.startsWith("{")) {
    return { type: "raw", text };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { type: "raw", text };
  }
  if (!parsed || typeof parsed.type !== "string") {
    return { type: "raw", text };
  }
  if (parsed.type === "system" && parsed.subtype === "init") {
    return {
      type: "session",
      sessionId: String(parsed.session_id || ""),
      model: String(parsed.model || "")
    };
  }
  if (parsed.type === "assistant" && parsed.message && typeof parsed.message === "object") {
    const content = Array.isArray(parsed.message.content) ? parsed.message.content : [];
    const textBlocks = content
      .filter((block) => block && block.type === "text" && typeof block.text === "string")
      .map((block) => block.text);
    return {
      type: "assistant",
      text: textBlocks.join(""),
      usage: normalizeCliUsage(parsed.message.usage)
    };
  }
  if (parsed.type === "result") {
    return {
      type: "result",
      subtype: String(parsed.subtype || ""),
      isError: parsed.is_error === true,
      text: typeof parsed.result === "string" ? parsed.result : "",
      sessionId: String(parsed.session_id || ""),
      usage: normalizeCliUsage(parsed.usage)
    };
  }
  return { type: "ignored", rawType: parsed.type };
}

// Claude usage → domi/Codex usage 字段。
function normalizeCliUsage(usage) {
  if (!usage || typeof usage !== "object") return null;
  const input = Number(usage.input_tokens) || 0;
  const output = Number(usage.output_tokens) || 0;
  if (!input && !output) return null;
  return {
    input_tokens: input,
    cached_input_tokens: Number(usage.cache_read_input_tokens) || 0,
    cache_write_input_tokens: Number(usage.cache_creation_input_tokens) || 0,
    output_tokens: output,
    reasoning_output_tokens: 0
  };
}

function spawnTargetFor(cliPath) {
  const extension = path.extname(cliPath).toLocaleLowerCase("en-US");
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
    return { command: process.execPath, prefixArgs: [cliPath] };
  }
  if (extension === ".cmd" || extension === ".bat") {
    return { command: "cmd.exe", prefixArgs: ["/d", "/s", "/c", cliPath] };
  }
  return { command: cliPath, prefixArgs: [] };
}

// 启动一次无头运行：提示词写 stdin，stdout 按行解析并回调 onEvent；
// 进程退出时回调 onExit({type: completed|stopped|failed, error})。
// 返回句柄的 kill() 供主进程停止任务。
function spawnAgentRun({
  engineId,
  cliPath,
  args,
  workspacePath,
  prompt,
  env = {},
  onEvent,
  onExit
}) {
  const preset = enginePreset(engineId);
  if (!preset) {
    throw new Error("未知执行器，只支持 claude 与 workbuddy。");
  }
  const target = spawnTargetFor(cliPath);
  const child = spawn(target.command, [...target.prefixArgs, ...args], {
    cwd: workspacePath || undefined,
    env: { ...process.env, NO_COLOR: "1", ...env },
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"]
  });

  let finished = false;
  let resultOutcome = null;
  let killedByHost = false;
  let stderrTail = "";

  const settle = (outcome) => {
    if (finished) return;
    finished = true;
    onExit?.(outcome);
  };

  child.on("error", (error) => {
    settle({
      type: "failed",
      error: `${preset.label} 启动失败：${error instanceof Error ? error.message : String(error)}`
    });
  });

  const stdout = readline.createInterface({ input: child.stdout });
  stdout.on("line", (line) => {
    if (finished) return;
    const event = parseAgentStreamLine(line);
    if (!event) return;
    if (event.type === "raw") {
      onEvent?.({ type: "raw", text: event.text + "\n" });
      return;
    }
    if (event.type === "ignored") {
      onEvent?.({ type: "ignored" });
      return;
    }
    if (event.type === "result") {
      resultOutcome = event;
    }
    onEvent?.(event);
  });

  child.stderr.on("data", (chunk) => {
    stderrTail = (stderrTail + String(chunk)).slice(-4000);
  });

  child.on("close", (code) => {
    if (resultOutcome) {
      if (resultOutcome.subtype === "success" && !resultOutcome.isError) {
        settle({ type: "completed" });
        return;
      }
      settle({
        type: "failed",
        error: resultOutcome.subtype === "error_max_turns"
          ? `${preset.label} 达到单次任务的轮次上限，请缩小任务范围后重试。`
          : resultOutcome.text || `${preset.label} 执行失败。`
      });
      return;
    }
    if (killedByHost) {
      settle({ type: "stopped" });
      return;
    }
    if (code === 0) {
      settle({ type: "completed" });
      return;
    }
    settle({
      type: "failed",
      error: stderrTail.trim()
        || `${preset.label} 进程退出（代码 ${code}），没有返回结果。`
    });
  });

  try {
    child.stdin.write(String(prompt || ""));
    child.stdin.end();
  } catch {
    // stdin 写入失败由进程退出路径兜底。
  }

  return {
    kill() {
      killedByHost = true;
      try {
        child.kill();
      } catch {
        // 进程可能已退出。
      }
    },
    process: child
  };
}

// result 事件在流内即终态：由 spawn 内部记录并在 close 时统一结算，
// 这里导出解析与发现能力供主进程和测试直接使用。
// 读取 CLI 版本（状态卡展示用；失败返回空串，不阻塞）。
function runAgentCliVersion(engineId, cliPath, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const preset = enginePreset(engineId);
    if (!preset) {
      resolve("");
      return;
    }
    const target = spawnTargetFor(cliPath);
    let output = "";
    let settled = false;
    let child;
    try {
      child = spawn(target.command, [...target.prefixArgs, ...preset.versionArgs], {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch {
      resolve("");
      return;
    }
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
    }, Math.max(1000, Number(timeoutMs) || 8000));
    if (typeof timer.unref === "function") timer.unref();
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    child.stdout.on("data", (chunk) => { output += String(chunk); });
    child.on("error", () => finish(""));
    child.on("close", () => {
      finish(output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] || "");
    });
  });
}

module.exports = {
  ENGINE_PRESETS,
  agentCliLoginStatus,
  buildAgentCliArgs,
  discoverAgentCli,
  enginePreset,
  normalizeCliUsage,
  runAgentCliVersion,
  parseAgentStreamLine,
  spawnAgentRun
};

