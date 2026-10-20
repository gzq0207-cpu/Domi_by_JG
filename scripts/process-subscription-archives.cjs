const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { SubscriptionArchiveWorker } = require("../electron/subscription-archive.cjs");
const { TabbitCaptionAcquirer } = require("../electron/tabbit-captions.cjs");
const { execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

async function main() {
  const userDir = process.env.FOLLOW_BUILDERS_HOME || path.join(os.homedir(), ".follow-builders");
  const config = JSON.parse(fs.readFileSync(path.join(userDir, "config.json"), "utf8"));
  if (config.archive?.enabled === false) return { ok: true, disabled: true };
  if (config.archive?.provider && config.archive.provider !== "chatgpt") throw new Error("订阅后续处理必须使用 ChatGPT。");
  const progress = (value) => {
    const line = JSON.stringify({ time: new Date().toISOString(), ...value });
    fs.appendFileSync(path.join(userDir, "archive.log"), line + "\n"); console.log(line);
  };
  const queuePath = path.join(userDir, "pending-archive.json"), stateRoot = path.join(userDir, "archives");
  const initialItems = fs.existsSync(queuePath) ? JSON.parse(fs.readFileSync(queuePath, "utf8")).items.filter(item => item.status !== "done") : [];
  if (!initialItems.length) return { ok: true, completed: 0, failed: 0, remaining: 0 };
  const browser = config.archive?.browser?.enabled === false ? null : new TabbitCaptionAcquirer({ stateRoot,
    ...config.archive?.browser, onProgress: progress });
  const worker = new SubscriptionArchiveWorker({ queuePath,
    configPath: config.archive?.configPath,
    readingCharacters: config.archive?.readingCharacters || 120000,
    mediaEnv: { DOMI_YOUTUBE_PROXY: config.archive?.youtubeProxy || "http://127.0.0.1:7897", DOMI_YTDLP_JS_RUNTIME: `node:${process.execPath}`,
      ...(config.archive?.ytdlpPath ? { DOMI_YTDLP_PATH: config.archive.ytdlpPath } : {}) },
    ...(browser ? { acquireBrowserTranscript: item => browser.acquire(item) } : {}), onProgress: progress });
  const stop = () => worker.close();
  process.once("SIGINT", stop); process.once("SIGTERM", stop);
  const budgetIndex = process.argv.indexOf("--budget-minutes");
  const minutes = budgetIndex < 0 ? 45 : Number(process.argv[budgetIndex + 1]);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 240) throw new Error("处理时限必须为 1 至 240 分钟。");
  let result;
  try {
    result = await worker.runOnce({ force: process.argv.includes("--force"), concurrency: config.archive?.concurrency || 2, budgetMs: minutes * 60000 });
    // Include resumed caches only after the worker's lock check has succeeded.
    if (browser && !result.busy) for (const item of initialItems) browser.cached(item);
    if (browser?.entries.length) {
      result.browserManifest = browser.manifestPath;
      const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
      const allDone = browser.entries.every(entry => queue.items.find(item => item.videoId === entry.videoId)?.status === "done");
      const output = execFileSync(process.execPath, [path.join(__dirname, "verify-subscription-backlog.cjs"), browser.manifestPath,
        ...(allDone ? ["--require-complete"] : [])], { env: { ...process.env, FOLLOW_BUILDERS_HOME: userDir, ELECTRON_RUN_AS_NODE: "1" }, windowsHide: true, encoding: "utf8", timeout: 60000 });
      console.log(output.trim()); result.fullVerificationPassed = allDone;
    }
    return result;
  } finally {
    worker.close();
    try { await browser?.close(); } catch (error) { progress({ phase: "browser-cleanup-wait", error: error.message }); if (result) result.browserCleanupPending = true; }
  }
}
if (require.main === module) main().then(async (result) => {
  if (process.argv.includes("--notify")) (await import(pathToFileURL(path.join(__dirname,"follow-builders-runner.mjs")).href)).notifyArchiveResult(result);
  console.log(JSON.stringify({ phase: "finished", ...result }));
})
  .catch((error) => { console.error(error.message || String(error)); process.exitCode = 1; });
module.exports = { main };
