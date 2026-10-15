const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const { DatabaseSync } = require("node:sqlite");
const { readExport } = require("../electron/browser-transcript.cjs");
const { verifyMedia, summaryMarkdown } = require("../electron/subscription-archive.cjs");
const { sha256, readTranslationSection, needsChineseTranslation, hasEnglishProse, isPreservedCaptionName } = require("../electron/chinese-translation.cjs");

function main() {
  const userDir = process.env.FOLLOW_BUILDERS_HOME || path.join(os.homedir(), ".follow-builders");
  const manifestPath = process.argv[2]; if (!manifestPath) throw new Error("提供需要核验的视频清单 JSON 文件。");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const queue = JSON.parse(fs.readFileSync(path.join(userDir, "pending-archive.json"), "utf8"));
  const config = JSON.parse(fs.readFileSync(path.join(userDir, "config.json"), "utf8"));
  const repository = JSON.parse(fs.readFileSync(config.archive.configPath, "utf8"));
  const db = new DatabaseSync(repository.localDatabasePath, { readOnly: true });
  const rows = [], stateRoot = path.join(userDir, "archives");
  try { for (const entry of manifest) {
    const item = queue.items.find((candidate) => candidate.videoId === entry.videoId);
    const media = readExport(entry.videoId, stateRoot); if (!media) throw new Error("缺少浏览器字幕。");
    const transcript = verifyMedia(media), directory = path.join(stateRoot, entry.videoId);
    let verified = false, title = entry.title;
    if (item?.status === "done") {
      const original = fs.readFileSync(path.join(directory, "original.md"), "utf8").trim();
      const translation = fs.readFileSync(path.join(directory, "chinese.md"), "utf8").trim();
      const summary = JSON.parse(fs.readFileSync(path.join(directory, "summary.json"), "utf8"));
      const receipt = JSON.parse(fs.readFileSync(path.join(directory, "translation.json"), "utf8"));
      const handoff = JSON.parse(fs.readFileSync(path.join(directory, "handoff.json"), "utf8"));
      const document = fs.readFileSync(item.documentPath, "utf8"), section = readTranslationSection(document);
      const stamps = (value) => value.match(/^\[\d+(?::\d{2}){1,2}\]/gm) || [];
      const sourceRows = transcript.split("\n").map((line) => line.replace(/^\[\d+(?::\d{2}){1,2}\] /, ""));
      const untranslated = translation.split("\n").filter((line) => /^\[\d+(?::\d{2}){1,2}\]/.test(line))
        .map((line, index) => ({index,text:line.replace(/^\[\d+(?::\d{2}){1,2}\] /, "")})).filter(({index,text}) =>
          needsChineseTranslation(text) && !/[\u3400-\u9fff]/.test(text) && !isPreservedCaptionName(text, sourceRows[index], summary.result.companies, JSON.stringify(summary.result)));
      const stored = db.prepare("SELECT event_id, title, summary, document_path FROM news_events WHERE url=? AND article_type='article'").all(item.url);
      verified = original.includes(transcript) && document.includes(original) && section?.verified && section.content === translation
        && document.includes(summaryMarkdown(summary.result)) && summary.receipt.complete
        && summary.receipt.model === "gpt-6.1-sol" && summary.receipt.reasoningEffort === "high" && summary.receipt.serviceTier === "standard"
        && summary.receipt.originalSha256 === sha256(original) && summary.receipt.readChunks === summary.receipt.totalChunks
        && receipt.complete && receipt.model === "gpt-6-luna" && receipt.reasoningEffort === "medium" && receipt.serviceTier === "standard"
        && receipt.sourceSha256 === sha256(original) && receipt.translationSha256 === sha256(translation)
        && JSON.stringify(stamps(transcript)) === JSON.stringify(stamps(translation)) && untranslated.length === 0
        && handoff.currentStage === "complete" && stored.length === 1 && stored[0].event_id === item.eventId
        && stored[0].summary === summaryMarkdown(summary.result) && stored[0].document_path === item.documentPath && !hasEnglishProse(stored[0].title);
      if (!verified) throw new Error(`视频 ${entry.videoId} 的最终全文、译文、摘要或数据库回读未通过。`);
      title = stored[0].title;
    }
    rows.push({ videoId: entry.videoId, title, duration: entry.duration, durationSeconds: media.durationSeconds,
      cueCount: media.validation.cueCount, originalCharacters: transcript.length, timestampSpanCoverage: media.validation.timestampSpanCoverage,
      status: item?.status || "missing", verified, documentPath: item?.documentPath || null });
  } } finally { db.close(); }
  const report = { checkedAt: new Date().toISOString(), videos: rows.length, captionsComplete: rows.length,
    archivesVerified: rows.filter((row) => row.verified).length, remaining: rows.filter((row) => !row.verified).length,
    totalDurationSeconds: rows.reduce((sum, row) => sum + row.durationSeconds, 0),
    totalCaptionRows: rows.reduce((sum, row) => sum + row.cueCount, 0), totalTranscriptCharacters: rows.reduce((sum, row) => sum + row.originalCharacters, 0), rows };
  const reportDay = path.basename(manifestPath).match(/\d{4}-\d{2}-\d{2}/)?.[0]
    || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
  const reportPath = path.join(userDir, `backlog-recovery-${reportDay}.md`);
  const markdown = [`# YouTube 积压视频处理核验`, `核验时间：${report.checkedAt}。共 ${report.videos} 个视频，完整字幕 ${report.captionsComplete} 份，归档回读通过 ${report.archivesVerified} 篇，剩余 ${report.remaining} 篇。`,
    `总时长 ${(report.totalDurationSeconds / 3600).toFixed(2)} 小时，字幕 ${report.totalCaptionRows} 条，原文 ${report.totalTranscriptCharacters} 字符。`,
    `摘要：GPT-6.1 Sol／高智能／标准速度，采用全文重要观点、各论点的相应论据与论证。中文全文：GPT-6 Luna／标准智能／标准速度。`,
    `字幕来自 YouTube 正常浏览器原生导出。全量保存字幕行与原始文件，校验视频标识、首尾及中间时间戳、文件哈希、完整中文全文、摘要和数据库唯一记录。字幕导出只有开始时间；时间戳跨度并不等同于逐秒音频覆盖率。字幕识别准确性未人工校对。`,
    `| 视频 | 时长 | 字幕条数 | 状态 | 文档 |`, `| --- | --- | ---: | --- | --- |`,
    ...rows.map((row) => `| ${row.title.replace(/\|/g, "\\|")} | ${row.duration} | ${row.cueCount} | ${row.verified ? "完成，回读通过" : "已取得字幕，处理"} | ${row.documentPath ? `[打开](<${row.documentPath.replace(/\\/g, "/")}>)` : "处理中"} |`)].join("\n\n");
  fs.writeFileSync(reportPath, markdown);
  fs.writeFileSync(reportPath.replace(/\.md$/, ".json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, rows: undefined, reportPath }));
  if (process.argv.includes("--require-complete") && report.remaining) process.exitCode = 1;
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { main };
