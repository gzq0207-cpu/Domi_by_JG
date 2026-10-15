const fs = require("node:fs");
const path = require("node:path");
const { sha256 } = require("./chinese-translation.cjs");

function seconds(value) {
  if (!/^\d+:\d{2}(?::\d{2})?$/.test(String(value))) throw new Error("浏览器视频时长格式无效。");
  const parts = String(value).split(":").map(Number);
  if (parts.slice(1).some((part) => part >= 60)) throw new Error("字幕时间戳无效。");
  return parts.reduce((sum, part) => sum * 60 + part, 0);
}

function parseExport(text, videoId, durationSeconds) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId) || !Number.isFinite(durationSeconds) || durationSeconds <= 0)
    throw new Error("浏览器字幕视频标识或时长无效。");
  const lines = String(text).replace(/\r\n/g, "\n").trim().split("\n");
  if (lines[0] !== "YouTube transcript" || lines[1] !== `Video ID: ${videoId}`
      || !/^Language: \S+/.test(lines[2]) || !/^Captions: .+/.test(lines[3])) throw new Error("浏览器导出文件与视频不匹配。");
  const rows = lines.slice(4).filter((line) => line.trim());
  const cues = rows.map((line) => {
    const match = line.match(/^\[(\d+:\d{2}(?::\d{2})?)\] (.+)$/);
    if (!match) throw new Error("字幕存在无法解析的行，不能省略归档。");
    return { start: seconds(match[1]), timestamp: match[1], text: match[2] };
  });
  if (!cues.length) throw new Error("浏览器字幕为空。");
  let maxStartGapSeconds = 0;
  for (let i = 1; i < cues.length; i++) {
    const gap = cues[i].start - cues[i - 1].start;
    if (gap < 0) throw new Error("字幕时间戳顺序无效。");
    maxStartGapSeconds = Math.max(maxStartGapSeconds, gap);
  }
  const firstTimestampSeconds = cues[0].start, lastTimestampSeconds = cues.at(-1).start;
  const timestampSpanCoverage = (lastTimestampSeconds - firstTimestampSeconds) / durationSeconds;
  // Authored tracks can begin after a short uncaptained opening. The native
  // InferenceX transcript starts at 0:06; requiring every track to start by
  // 0:05 rejects that intact export. Keep the 98% extent and all other gap
  // checks, and retain the stricter start bound for auto-generated tracks.
  const maxFirstTimestampSeconds = lines[3] === "Captions: authored or unspecified" ? 10 : 5;
  // Browser export contains cue starts, not cue ends. This is an extent and
  // omission check, never a claim that synthetic intervals cover the audio.
  const complete = firstTimestampSeconds <= maxFirstTimestampSeconds && lastTimestampSeconds <= durationSeconds + 1
    && timestampSpanCoverage >= 0.98 && durationSeconds - lastTimestampSeconds <= 20 && maxStartGapSeconds <= 15;
  if (!complete) throw new Error("浏览器字幕首尾或中间时间戳存在缺口，需要重新取得完整字幕。");
  return { text: rows.join("\n"), cues, validation: { version: 1, status: "browser-export-verified", cueCount: cues.length,
    firstTimestampSeconds, lastTimestampSeconds, timestampSpanCoverage, maxStartGapSeconds,
    cueEndTimesAvailable: false, acquisition: "browser.content.exportYouTubeTranscript", accuracy: "platform-captions-not-manually-verified" } };
}

function importExport(entry, stateRoot) {
  const durationSeconds = seconds(entry.duration), source = fs.readFileSync(entry.path);
  const parsed = parseExport(source.toString("utf8"), entry.videoId, durationSeconds);
  const directory = path.join(stateRoot, entry.videoId, "browser-captions"); fs.mkdirSync(directory, { recursive: true });
  const sourcePath = path.join(directory, "platform-export.txt"), transcriptPath = path.join(directory, "transcript.txt"), jsonPath = path.join(directory, "cues.json");
  fs.writeFileSync(sourcePath, source); fs.writeFileSync(transcriptPath, parsed.text + "\n");
  const metadata = { title: entry.title.replace(/ - YouTube$/, ""), canonicalUrl: `https://www.youtube.com/watch?v=${entry.videoId}`, durationSeconds };
  fs.writeFileSync(jsonPath, JSON.stringify({ metadata, cues: parsed.cues, validation: parsed.validation }, null, 2));
  const result = { ok: true, complete: true, contentKind: "browser-transcript", videoId: entry.videoId, metadata, durationSeconds,
    sourcePath, sourceSha256: sha256(source), transcriptPath, transcriptSha256: sha256(fs.readFileSync(transcriptPath)),
    jsonPath, jsonSha256: sha256(fs.readFileSync(jsonPath)), validation: parsed.validation, acquiredAt: new Date().toISOString() };
  fs.writeFileSync(path.join(directory, "result.json"), JSON.stringify(result, null, 2));
  return result;
}

function verifyExport(result) {
  if (!result.sourcePath || !result.sourceSha256 || sha256(fs.readFileSync(result.sourcePath)) !== result.sourceSha256)
    throw new Error("浏览器字幕源文件校验失败。");
  const parsed = parseExport(fs.readFileSync(result.sourcePath, "utf8"), result.videoId, result.durationSeconds);
  if (JSON.stringify(parsed.validation) !== JSON.stringify(result.validation)
      || parsed.text !== fs.readFileSync(result.transcriptPath, "utf8").trim()) throw new Error("浏览器字幕记录或正文与原始导出不一致。");
  const saved = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
  if (JSON.stringify(saved.cues) !== JSON.stringify(parsed.cues) || JSON.stringify(saved.validation) !== JSON.stringify(parsed.validation))
    throw new Error("浏览器字幕结构化数据不一致。");
  return parsed.text;
}

function readExport(videoId, stateRoot) {
  const file = path.join(stateRoot, videoId, "browser-captions", "result.json");
  if (!fs.existsSync(file)) return null;
  const result = JSON.parse(fs.readFileSync(file, "utf8"));
  if (result.videoId !== videoId) throw new Error("浏览器字幕缓存的视频标识不匹配。");
  verifyExport(result);
  return result;
}

module.exports = { seconds, parseExport, importExport, verifyExport, readExport };
