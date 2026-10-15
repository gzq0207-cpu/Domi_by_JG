const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { ChineseTranslator } = require("../electron/chinese-translation.cjs");
const { readDigestSource, publishChineseDigest } = require("../electron/subscription-digest.cjs");

// Used by the independent Windows runner as well as manual historical repair.
// The job specifies an input snapshot and explicit output paths; no feed fetch,
// external messaging, or local audio transcription happens here.
async function main() {
  const jobPath = process.argv[2];
  if (!jobPath) throw new Error("缺少日报发布任务文件。");
  const job = JSON.parse(fs.readFileSync(jobPath, "utf8"));
  if (!job.input || !Array.isArray(job.outputs) || !job.outputs.length || job.outputs.some((file) => !path.isAbsolute(file) || !/\.md$/i.test(file))) {
    throw new Error("日报发布任务路径无效。");
  }
  const initial = fs.readFileSync(job.input, "utf8");
  const source = readDigestSource(initial, job.input);
  const translator = new ChineseTranslator({
    cacheRoot: path.join(job.stateRoot || path.join(os.homedir(), ".follow-builders", "translation"), "blocks"),
    onProgress: (progress) => console.log(JSON.stringify({ phase: "translation", ...progress }))
  });
  process.once("SIGINT", () => { translator.close(); process.exit(130); });
  process.once("SIGTERM", () => { translator.close(); process.exit(143); });
  try {
    const result = await publishChineseDigest({ source, files: job.outputs, translator, beforeWrite: () => {
      if (fs.readFileSync(job.input, "utf8") !== initial) throw new Error("待处理日报已变化，本轮未覆盖。");
    } });
    console.log(JSON.stringify({ phase: "published", ...result }));
  } finally { translator.close(); }
}
main().catch((error) => { console.error(error.message || String(error)); process.exitCode = 1; });
