const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { SubscriptionArchiveWorker } = require("../electron/subscription-archive.cjs");

async function main() {
  const userDir = process.env.FOLLOW_BUILDERS_HOME || path.join(os.homedir(), ".follow-builders");
  const config = JSON.parse(fs.readFileSync(path.join(userDir, "config.json"), "utf8"));
  if (config.archive?.enabled === false) return { ok: true, disabled: true };
  if (config.archive?.provider && config.archive.provider !== "chatgpt") throw new Error("订阅后续处理必须使用 ChatGPT。");
  const worker = new SubscriptionArchiveWorker({ queuePath: path.join(userDir, "pending-archive.json"),
    configPath: config.archive?.configPath,
    readingCharacters: config.archive?.readingCharacters || 120000,
    mediaEnv: { DOMI_YOUTUBE_PROXY: config.archive?.youtubeProxy || "http://127.0.0.1:7897", DOMI_YTDLP_JS_RUNTIME: `node:${process.execPath}`,
      ...(config.archive?.ytdlpPath ? { DOMI_YTDLP_PATH: config.archive.ytdlpPath } : {}) },
    onProgress: (progress) => {
      const line = JSON.stringify({ time: new Date().toISOString(), ...progress });
      fs.appendFileSync(path.join(userDir, "archive.log"), line + "\n");
      console.log(line);
    } });
  const stop = () => worker.close();
  process.once("SIGINT", stop); process.once("SIGTERM", stop);
  const budgetIndex = process.argv.indexOf("--budget-minutes");
  const minutes = budgetIndex < 0 ? 45 : Number(process.argv[budgetIndex + 1]);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 240) throw new Error("处理时限必须为 1 至 240 分钟。");
  try { return await worker.runOnce({ force: process.argv.includes("--force"), concurrency: config.archive?.concurrency || 2, budgetMs: minutes * 60000 }); }
  finally { worker.close(); }
}
if (require.main === module) main().then((result) => console.log(JSON.stringify({ phase: "finished", ...result })))
  .catch((error) => { console.error(error.message || String(error)); process.exitCode = 1; });
module.exports = { main };
