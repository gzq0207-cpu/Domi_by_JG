const fs = require("node:fs");
const path = require("node:path");
const { KnowledgeTranslationService } = require("../electron/knowledge-translation.cjs");
const configPath = process.env.DOMI_CONFIG_PATH;
if (!configPath) throw new Error("缺少 DOMI_CONFIG_PATH。");
const service = new KnowledgeTranslationService({
  configPath, settingsProvider: () => JSON.parse(fs.readFileSync(configPath, "utf8")),
  stateRoot: path.join(path.dirname(configPath), "chinese-translation"),
  repoScriptPath: path.resolve(__dirname, "../build/domi-plugin/scripts/domi-repo.cjs"),
  onProgress: (progress) => console.log(JSON.stringify(progress))
});
process.once("SIGINT", () => { service.close(); process.exit(130); });
process.once("SIGTERM", () => { service.close(); process.exit(143); });
// An explicit manual resume checks availability immediately. The background
// worker respects its persisted cooldown between automatic attempts.
service.runOnce({ force: true }).then((result) => {
  console.log(JSON.stringify({ phase: "finished", ...result }));
  process.exitCode = result.failed?.length ? 1 : 0;
}).catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => service.close());
