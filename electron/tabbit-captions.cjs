const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { importExport, readExport } = require("./browser-transcript.cjs");
const { ACQUISITION, clock, platformCaptionExport } = require("./platform-captions.cjs");
const { buildCaptionProgram } = require("./tabbit-caption-program.cjs");

class BrowserTranscriptError extends Error {
  constructor(code, message) {
    super(message); this.code = code; this.requiresBrowserTranscript = true;
    this.needsUserAction = ["AUTH_REQUIRED", "CAPTCHA_REQUIRED", "CONTENT_RESTRICTED"].includes(code);
    this.retryAfterMs = this.needsUserAction ? 60 * 60 * 1000 : 15 * 60 * 1000;
  }
}

function execute(executable, args, { input, env = process.env, timeoutMs = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { env, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", ended = false;
    const timer = setTimeout(() => { child.kill(); reject(new BrowserTranscriptError("BROWSER_CLI_TIMEOUT", "浏览器 CLI 响应超时，保留原请求回执等待恢复。")); }, timeoutMs);
    child.stdout.on("data", chunk => { stdout += chunk; if (Buffer.byteLength(stdout) > 8 * 1024 * 1024) child.kill(); });
    child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-4000); });
    child.on("error", error => { if (!ended) { ended = true; clearTimeout(timer); reject(new BrowserTranscriptError("BROWSER_CLI_UNAVAILABLE", `独立浏览器 CLI 不可用（${error.code || "启动失败"}）。`)); } });
    child.on("close", code => { if (!ended) { ended = true; clearTimeout(timer); resolve({ code, stdout, stderr }); } });
    child.stdin.on("error", () => {}); child.stdin.end(input || "");
  });
}

function parseReply(result) {
  const values = result.stdout.trim().split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const value = values.at(-1);
  if (!value) throw new BrowserTranscriptError("BROWSER_CLI_INVALID_REPLY", "独立浏览器 CLI 未返回有效回执。");
  return value;
}

function captionReplyValue(reply, value) {
  if (value?.ok !== false || value.code !== "CAPTIONS_PENDING") return value;
  const issues = [...(reply.result?.issuesDelta || []), ...(reply.outcome?.issuesDelta || []), ...(reply.issuesDelta || [])];
  const failure = issues.find(issue => issue.code === "REQUEST_HTTP_ERROR"
    && issue.origin === "https://www.youtube.com" && issue.details?.path === "/youtubei/v1/get_transcript"
    && Number.isInteger(issue.details.status) && issue.details.status >= 400 && issue.details.status <= 599);
  if (!failure) return value;
  return { ...value, code: "TRANSCRIPT_HTTP_ERROR", httpStatus: failure.details.status,
    message: `YouTube 官方文字稿接口返回 HTTP ${failure.details.status}，尚未取得完整字幕，保留后续重试。` };
}

class TabbitCaptionAcquirer {
  constructor({ stateRoot, launcher = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Tabbit", "LocalAgent", "bin", "tabbit-cli.exe"),
    browserExecutable = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Tabbit", "Application", "Tabbit Browser.exe"),
    instanceId, taskName = "Domi 字幕维护", run = execute, onProgress = () => {} } = {}) {
    Object.assign(this, { stateRoot, launcher, browserExecutable, taskName, run, onProgress });
    if (instanceId && !/^[A-F0-9]{16}$/.test(instanceId)) throw new Error("浏览器实例标识无效。");
    this.env = { ...process.env, ...(instanceId ? { TABBIT_PLAYWRIGHT_INSTANCE: instanceId } : {}) };
    this.serial = Promise.resolve(); this.entries = []; this.started = false; this.relaunched = false;
    this.activeRequestPath = path.join(stateRoot, "browser-active-request.json");
    this.manifestPath = path.join(path.dirname(stateRoot), `browser-transcripts-${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" })}-${crypto.randomUUID()}.json`);
  }

  async cli(args, input) { return parseReply(await this.run(this.launcher, args, { input, env: this.env, timeoutMs: 60000 })); }

  async ready() {
    if (this.started) return;
    let reply = await this.cli(["create", "--task", this.taskName]);
    if (reply.error?.code === "CLI_REGISTRATION_UNAVAILABLE" && !this.relaunched) {
      this.relaunched = true;
      this.onProgress({ phase: "browser-startup-recovery" });
      const helper = path.resolve(__dirname, "../scripts/start-subscription-browser.ps1");
      const result = await this.run("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", helper, "-BrowserExecutable", this.browserExecutable], { env: this.env, timeoutMs: 15000 });
      if (result.code !== 0) throw new BrowserTranscriptError("BROWSER_STARTUP_FAILED", "独立浏览器正常启动失败，未更改注册信息或系统权限。");
      const deadline = Date.now() + 35000;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        reply = await this.cli(["create", "--task", this.taskName]);
        if (!reply.error) break;
      } while (reply.error?.code === "CLI_REGISTRATION_UNAVAILABLE" && Date.now() < deadline);
    }
    if (reply.error) throw new BrowserTranscriptError(reply.error.code || "BROWSER_UNAVAILABLE", "独立浏览器连接未就绪，保留字幕补取断点。");
    // finish retains a login page as an unowned group. Reacquire that group's
    // observed ID on the next run, rather than opening another login tab daily.
    const retained = (reply.groups || []).filter(group => {
      const tabs = (reply.tabs || []).filter(tab => tab.group?.groupId === group.groupId);
      return group.title === this.taskName && tabs.length > 0 && !reply.truncated && tabs.every(tab => tab.state === "available");
    });
    if (retained.length === 1 && !reply.task?.reused) this.resumeGroup = retained[0].groupId;
    this.started = true;
  }

  async program(code, requestId, resume = false) {
    let reply = resume ? await this.cli(["receipt", "--task", this.taskName, "--request-id", requestId])
      : await this.cli(["nodejs", "--task", this.taskName, ...(this.resumeGroup ? ["--group",this.resumeGroup] : []), "--request-id", requestId, "--timeout-ms", "160000"], code);
    if (!resume && reply.status) this.resumeGroup = null;
    const deadline = Date.now() + 175000;
    while (["queued", "running"].includes(reply.status) && Date.now() < deadline) {
      reply = await this.cli(["receipt", "--task", this.taskName, "--request-id", requestId, "--wait-ms", "45000"]);
    }
    if (["queued", "running"].includes(reply.status)) {
      this.unsettled = true;
      throw new BrowserTranscriptError("BROWSER_REQUEST_PENDING", "字幕获取请求仍未结束，保留回执，暂不重复执行。");
    }
    if (reply.status !== "succeeded") {
      const code = reply.error?.code || reply.result?.error?.code || "BROWSER_EXPORT_FAILED";
      const error = new BrowserTranscriptError(code, "浏览器字幕导出未完成，已保留原任务回执。");
      error.requestSettled = ["failed", "interrupted"].includes(reply.status); throw error;
    }
    if (reply.result?.type === "resource" || reply.result?.resourceId) {
      let offset = 0, text = "", eof = false;
      while (!eof) {
        const part = await this.cli(["resource", "--task", this.taskName, "--resource", reply.result.resourceId,
          "--offset", String(offset), "--max-bytes", "65536"]);
        if (typeof part.data !== "string" || (!part.eof && !(part.nextOffset > offset)))
          throw new BrowserTranscriptError("BROWSER_RESULT_INVALID", "浏览器回执资源分页无效，保留恢复信息。");
        text += part.data; offset = part.nextOffset; eof = part.eof;
        if (Buffer.byteLength(text) > 8 * 1024 * 1024) throw new BrowserTranscriptError("BROWSER_RESULT_TOO_LARGE", "浏览器回执超过安全读取上限。");
      }
      this.unsettled = false; return captionReplyValue(reply, JSON.parse(text));
    }
    this.unsettled = false;
    return captionReplyValue(reply, reply.result?.value);
  }

  remember(entry) {
    if (!this.entries.some(previous => previous.videoId === entry.videoId)) this.entries.push(entry);
    fs.mkdirSync(path.dirname(this.manifestPath), { recursive: true });
    const temporary = this.manifestPath + ".tmp";
    fs.writeFileSync(temporary, JSON.stringify(this.entries, null, 2)); fs.renameSync(temporary, this.manifestPath);
  }

  cached(item) {
    const result = readExport(item.videoId, this.stateRoot);
    if (result) this.remember({ videoId: item.videoId, path: result.sourcePath, title: result.metadata.title,
      duration: clock(result.durationSeconds), acquisition: result.validation.acquisition,
      ...(result.platformResponsePath ? { platformResponsePath: result.platformResponsePath } : {}) });
    return result;
  }

  acquire(item) {
    const job = this.serial.then(async () => {
      const cached = this.cached(item); if (cached) return cached;
      if (this.sharedBlock) throw this.sharedBlock;
      await this.ready();
      // A previous process may have stopped while the browser program was
      // still running. Resume that exact receipt before dispatching new work.
      if (fs.existsSync(this.activeRequestPath)) {
        const pending = JSON.parse(fs.readFileSync(this.activeRequestPath, "utf8"));
        if (pending.taskName !== this.taskName || !/^[A-Za-z0-9_-]{11}$/.test(pending.videoId || "") || typeof pending.requestId !== "string")
          throw new BrowserTranscriptError("BROWSER_RECOVERY_REQUIRED", "浏览器断点与当前任务不一致，需要检查原任务。");
        await this.request({videoId:pending.videoId}, pending.requestId, true);
        const recovered = this.cached(item); if (recovered) return recovered;
      }
      this.onProgress({ videoId: item.videoId, phase: "browser-subtitle" });
      const requestId = `captions-${item.videoId}-${crypto.randomUUID()}`;
      fs.mkdirSync(this.stateRoot, {recursive:true});
      const pending = this.activeRequestPath + ".tmp";
      fs.writeFileSync(pending, JSON.stringify({videoId:item.videoId,taskName:this.taskName,requestId,startedAt:new Date().toISOString()}));
      fs.renameSync(pending,this.activeRequestPath);
      return this.request(item, requestId, false);
    });
    this.serial = job.catch(() => {}); return job;
  }

  async request(item, requestId, resume) {
    let value;
    try { value = await this.program(resume ? "" : buildCaptionProgram(item), requestId, resume); }
    catch (error) {
      if (error.requestSettled) fs.rmSync(this.activeRequestPath,{force:true});
      else this.unsettled = true;
      throw error;
    }
    fs.rmSync(this.activeRequestPath,{force:true});
      if (!value?.ok) {
        const error = new BrowserTranscriptError(value?.code || "BROWSER_EXPORT_FAILED", value?.message || "浏览器尚未取得完整字幕。");
        if (error.needsUserAction) { this.sharedBlock = error; this.retainPage = true; }
        throw error;
      }
      if (value.videoId !== item.videoId || !path.isAbsolute(value.platformResponsePath || ""))
        throw new BrowserTranscriptError("BROWSER_EXPORT_INVALID", "浏览器字幕与队列视频不匹配。");
      try {
      const raw = JSON.parse(fs.readFileSync(value.platformResponsePath, "utf8"));
      if (raw.videoId !== item.videoId || raw.title !== value.title || raw.durationSeconds !== value.durationSeconds)
        throw new BrowserTranscriptError("BROWSER_EXPORT_INVALID", "浏览器字幕响应与播放器元数据不一致。");
      const text = platformCaptionExport(raw), exportDir = path.join(this.stateRoot, "browser-imports");
      fs.mkdirSync(exportDir, { recursive: true });
      const textPath = path.join(exportDir, `${item.videoId}-${crypto.randomUUID()}.txt`); fs.writeFileSync(textPath, text, { flag: "wx" });
      const entry = { videoId: item.videoId, path: textPath, title: value.title, duration: clock(value.durationSeconds),
        acquisition: raw.acquisition, platformResponsePath: value.platformResponsePath };
      const result = importExport(entry, this.stateRoot);
      this.remember({ ...entry, path: result.sourcePath, platformResponsePath: result.platformResponsePath });
      const statusFile = path.join(this.stateRoot, "browser-status.json"), statusTemp = statusFile + ".tmp";
      fs.writeFileSync(statusTemp, JSON.stringify({status:"captions-ready",errorCode:null,checkedAt:new Date().toISOString(),waitingVideoIds:[]}));
      fs.renameSync(statusTemp,statusFile);
      this.onProgress({ videoId: item.videoId, phase: "browser-captions-verified", cueCount: result.validation.cueCount });
      return result;
      } catch (error) {
        if (error.requiresBrowserTranscript) throw error;
        throw new BrowserTranscriptError("CAPTION_INCOMPLETE", `平台字幕完整性校验未通过：${error.message}`);
      }
  }

  async close() {
    await this.serial;
    if (!this.started || this.unsettled) return;
    if (!this.retainPage) await this.program("for (const p of pages()) await p.close(); return {closed:true};", `cleanup-${crypto.randomUUID()}`);
    const result = await this.cli(["finish", "--task", this.taskName]);
    if (result.forcedCleanup || result.finished === false) throw new BrowserTranscriptError("BROWSER_CLEANUP_PENDING", "浏览器任务清理尚未确认，保留恢复信息。");
  }
}

module.exports = { BrowserTranscriptError, TabbitCaptionAcquirer, execute, parseReply };
