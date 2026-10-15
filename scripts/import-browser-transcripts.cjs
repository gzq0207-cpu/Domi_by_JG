const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { importExport } = require("../electron/browser-transcript.cjs");
function main() {
  const manifest = process.argv[2]; if (!manifest) throw new Error("提供浏览器字幕清单 JSON 文件。");
  const userDir = process.env.FOLLOW_BUILDERS_HOME || path.join(os.homedir(), ".follow-builders");
  const entries = JSON.parse(fs.readFileSync(manifest, "utf8"));
  const queue = JSON.parse(fs.readFileSync(path.join(userDir, "pending-archive.json"), "utf8"));
  for (const entry of entries) {
    if (!queue.items.some((item) => item.videoId === entry.videoId && item.url === `https://www.youtube.com/watch?v=${entry.videoId}`))
      throw new Error("字幕文件的视频不在订阅队列中。");
    const media = importExport(entry, path.join(userDir, "archives"));
    console.log(JSON.stringify({ videoId: entry.videoId, cueCount: media.validation.cueCount, extent: media.validation.timestampSpanCoverage, sourcePath: media.sourcePath }));
  }
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { main };
