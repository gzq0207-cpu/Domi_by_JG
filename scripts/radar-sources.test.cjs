const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  RadarSourceService,
  YouTubeDlp,
  normalizePublicUrl,
  parseRadarSourceBulkText,
  parsePodcastRss,
  parseXiaoyuzhouEpisode,
  parseXiaoyuzhouEpisodeLinks,
  youTubeEpisodeFromInfo,
  youTubeVideoIdFromUrl,
  parseYouTubeChannelFeed,
  youTubeFeedLinkFromChannelPage,
  youTubeChannelDescriptor,
  twitterHandleFromUrl
} = require("../electron/radar-sources.cjs");
const { DomiIntegration } = require("../electron/domi-integration.cjs");

function memoryStore() {
  const settings = new Map();
  const cache = new Map();
  const secrets = new Map();
  let tick = 1_700_000_000_000;
  const metrics = { saveAppSettingsCount: 0, saveCacheCount: 0 };
  return {
    metrics,
    loadAppSettings(key, fallback) {
      return settings.get(key) || { value: fallback, updatedAt: 0 };
    },
    saveAppSettings(key, value) {
      metrics.saveAppSettingsCount += 1;
      const stored = { value, updatedAt: tick += 1 };
      settings.set(key, stored);
      return stored;
    },
    loadCache(key) {
      return cache.get(key) || null;
    },
    saveCache(key, value) {
      metrics.saveCacheCount += 1;
      const stored = { value, updatedAt: tick += 1 };
      cache.set(key, stored);
      return stored;
    },
    loadSecret(key) {
      return secrets.get(key) || null;
    },
    saveSecret(key, value) {
      const stored = { value: String(value), updatedAt: tick += 1 };
      secrets.set(key, stored);
      return stored;
    },
    deleteSecret(key) {
      secrets.delete(key);
    }
  };
}

{
  const names = Array.from({ length: 700 }, (_value, index) => `重点公众号 ${String(index + 1).padStart(3, "0")}`);
  const startedAt = Date.now();
  const parsed = parseRadarSourceBulkText([
    ...names,
    "  重点公众号 001  ",
    "x".repeat(121),
    ""
  ].join("\n"), { kind: "wechat", fileName: "accounts.list", priority: "important" });
  assert.equal(parsed.format, "list");
  assert.equal(parsed.sources.length, 700);
  assert.equal(parsed.stats.duplicateCount, 1);
  assert.equal(parsed.stats.invalidCount, 1);
  assert.equal(parsed.stats.blankCount, 1);
  assert.equal(parsed.sources[0].priority, "important");
  assert.ok(Date.now() - startedAt < 2_000, "700-row plain-text parsing should remain interactive");
}

{
  const csv = parseRadarSourceBulkText([
    "公众号名称,关键词,链接,优先级,启用",
    '"芯片,前沿","芯片;AI",https://example.com/account,重点,是',
    "同链接别名,芯片,https://example.com/account,重点,是",
    "自动驾驶观察,智能出行,,普通,否",
    ",缺少名称,,,"
  ].join("\n"), { kind: "wechat", fileName: "accounts.csv" });
  assert.equal(csv.format, "csv");
  assert.equal(csv.sources.length, 2);
  assert.equal(csv.sources[0].name, "芯片,前沿");
  assert.deepEqual(csv.sources[0].keywords, ["芯片", "AI"]);
  assert.equal(csv.sources[0].priority, "important");
  assert.equal(csv.sources[1].enabled, false);
  assert.equal(csv.stats.duplicateCount, 1);
  assert.equal(csv.stats.invalidCount, 1);

  const tsv = parseRadarSourceBulkText(
    "名称\t关键词\t优先级\n机器人前沿\t具身智能；机器人\t重点",
    { kind: "wechat", fileName: "accounts.tsv" }
  );
  assert.equal(tsv.format, "tsv");
  assert.deepEqual(tsv.sources[0].keywords, ["具身智能", "机器人"]);
  assert.equal(tsv.sources[0].priority, "important");

  const malformed = parseRadarSourceBulkText('公众号名称,关键词\n"未闭合,芯片', {
    kind: "wechat",
    fileName: "bad.csv"
  });
  assert.equal(malformed.sources.length, 0);
  assert.equal(malformed.stats.invalidCount, 1);
}

const rss = `<?xml version="1.0"?>
<rss><channel><title>测试播客</title>
  <item>
    <title><![CDATA[芯片设计访谈 &amp; 趋势]]></title>
    <description><![CDATA[<p>围绕公司与行业展开。</p>]]></description>
    <link>https://pod.example.com/episodes/1</link>
    <pubDate>Thu, 06 Aug 2026 10:00:00 GMT</pubDate>
    <itunes:duration>01:02:03</itunes:duration>
    <enclosure url="https://cdn.example.com/audio/1.mp3" type="audio/mpeg" />
  </item>
</channel></rss>`;

const xiaoyuzhouEpisodeHtml = `<!doctype html><html><head>
<meta property="og:title" content="小宇宙公开单集" />
<meta property="og:audio" content="https://media.xyzcdn.net/example/episode.m4a" />
<script type="application/ld+json">{
  "@context":"https://schema.org",
  "@type":"PodcastEpisode",
  "name":"AI 芯片设计公司的产品路径",
  "description":"公开单集描述",
  "datePublished":"2026-08-05T08:00:00+08:00",
  "duration":"PT1H7M",
  "isAccessibleForFree":true,
  "associatedMedia":{"@type":"MediaObject","contentUrl":"https://media.xyzcdn.net/example/episode.m4a"},
  "partOfSeries":{"name":"投资人访谈"}
}</script>
<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"episode":{"payType":"FREE","isPrivateMedia":false}}}}</script>
</head></html>`;

{
  const episodes = parsePodcastRss(rss, "https://pod.example.com/feed.xml");
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].title, "芯片设计访谈 & 趋势");
  assert.equal(episodes[0].durationSec, 3723);
  assert.equal(episodes[0].mediaUrl, "https://cdn.example.com/audio/1.mp3");
  assert.equal(episodes[0].podcastTitle, "测试播客");
}

{
  const episode = parseXiaoyuzhouEpisode(
    xiaoyuzhouEpisodeHtml,
    "https://www.xiaoyuzhoufm.com/episode/6a6c2305b581962ce2be583e"
  );
  assert.equal(episode.title, "AI 芯片设计公司的产品路径");
  assert.equal(episode.durationSec, 4020);
  assert.equal(episode.podcastTitle, "投资人访谈");
  assert.equal(episode.mediaUrl, "https://media.xyzcdn.net/example/episode.m4a");

  const privateHtml = xiaoyuzhouEpisodeHtml
    .replace('"payType":"FREE"', '"payType":"PAID"')
    .replace('"isAccessibleForFree":true', '"isAccessibleForFree":false');
  assert.throws(
    () => parseXiaoyuzhouEpisode(privateHtml, "https://www.xiaoyuzhoufm.com/episode/private123"),
    /付费或私密/
  );
}

{
  const links = parseXiaoyuzhouEpisodeLinks(`
    <a href="/episode/aaa111">A</a>
    <a href="https://www.xiaoyuzhoufm.com/episode/bbb222?source=share">B</a>
    <a href="/episode/aaa111">duplicate</a>
    <a href="https://evil.example.com/episode/ccc333">bad</a>
  `, "https://www.xiaoyuzhoufm.com/podcast/abc123");
  assert.deepEqual(links, [
    "https://www.xiaoyuzhoufm.com/episode/aaa111",
    "https://www.xiaoyuzhoufm.com/episode/bbb222"
  ]);
}

assert.throws(() => normalizePublicUrl("file:///tmp/private"), /http/);
assert.throws(() => normalizePublicUrl("http://127.0.0.1:8080/feed"), /本机或内网/);
assert.throws(() => normalizePublicUrl("https://user:pass@example.com/feed"), /凭据/);

{
  const store = memoryStore();
  const service = new RadarSourceService({ stateStore: store, now: () => 1_700_000_000_100 });
  service.save({ kind: "wechat", name: "已经关注", keywords: ["存量"] });
  store.metrics.saveAppSettingsCount = 0;
  const text = [
    "已经关注",
    ...Array.from({ length: 700 }, (_value, index) => `批量公众号 ${String(index + 1).padStart(3, "0")}`),
    "批量公众号 001",
    "x".repeat(121)
  ].join("\n");

  const preview = service.bulkImport({
    kind: "wechat",
    text,
    fileName: "重点公众号.txt",
    previewOnly: true,
    priority: "important"
  });
  assert.equal(preview.ok, true);
  assert.equal(preview.previewOnly, true);
  assert.equal(preview.stats.existingCount, 1);
  assert.equal(preview.stats.importableCount, 700);
  assert.equal(preview.stats.duplicateCount, 1);
  assert.equal(preview.stats.invalidCount, 1);
  assert.equal(preview.stats.importedCount, 0);
  assert.equal(preview.items.length, 200);
  assert.equal(preview.previewTruncated, true);
  assert.equal(store.metrics.saveAppSettingsCount, 0, "preview must not persist");

  const startedAt = Date.now();
  const imported = service.bulkImport({
    kind: "wechat",
    text,
    fileName: "重点公众号.txt",
    priority: "important"
  });
  assert.equal(imported.ok, true);
  assert.equal(imported.stats.importedCount, 700);
  assert.equal(imported.sources.length, 701);
  assert.equal(store.metrics.saveAppSettingsCount, 1, "700 rows must be persisted in one settings write");
  assert.ok(Date.now() - startedAt < 2_000, "700-row bulk import should remain interactive");

  const afterUpgradeService = new RadarSourceService({ stateStore: store, now: () => 1_700_000_000_200 });
  assert.equal(afterUpgradeService.list().sources.length, 701, "saved sources must survive service/app upgrades");
  const repeated = afterUpgradeService.bulkImport({ kind: "wechat", text, fileName: "重点公众号.txt" });
  assert.equal(repeated.stats.importedCount, 0);
  assert.equal(repeated.stats.existingCount, 701);
  assert.equal(store.metrics.saveAppSettingsCount, 1, "a no-op duplicate import must not rewrite settings");
}

(async () => {
  const store = memoryStore();
  const requests = [];
  const routeFetch = async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).includes("/podcast/")) {
      return new Response('<a href="/episode/6a6c2305b581962ce2be583e">episode</a>', {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }
    if (String(url).includes("/episode/")) {
      return new Response(xiaoyuzhouEpisodeHtml, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }
    throw new Error(`unexpected URL ${url}`);
  };
  const service = new RadarSourceService({
    stateStore: store,
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "domi-radar-cache-")),
    fetchImpl: routeFetch,
    now: () => 1_700_000_000_100
  });
  const created = service.save({
    kind: "podcast",
    name: "公开小宇宙节目",
    url: "https://www.xiaoyuzhoufm.com/podcast/671b5914e98205cea744fd3c",
    priority: "important",
    keywords: ["芯片", "AI"]
  });
  assert.equal(created.source.priority, "important");
  assert.equal(created.source.keywords.length, 2);
  const synced = await service.sync({ sourceId: created.source.id });
  assert.equal(synced.ok, true);
  assert.equal(synced.jobs.length, 1);
  assert.equal(synced.jobs[0].status, "discovered");
  assert.ok(requests.every((request) => request.options.credentials === "omit"));
  assert.ok(requests.every((request) => !Object.keys(request.options.headers).some((key) => key.toLowerCase() === "cookie")));

  const edited = service.save({
    id: created.source.id,
    kind: "podcast",
    name: "公开小宇宙节目",
    url: created.source.url,
    priority: "normal"
  });
  assert.equal(edited.source.priority, "normal");

  const deleted = service.delete(created.source.id);
  assert.equal(deleted.deleted, true);
  assert.equal(deleted.jobs.length, 0);
})();

(async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "domi-radar-download-"));
  const store = memoryStore();
  let audioMode = "success";
  const service = new RadarSourceService({
    stateStore: store,
    cacheDir: tempRoot,
    fetchImpl: async (url) => {
      if (String(url).endsWith("feed.xml")) {
        return new Response(rss, { status: 200, headers: { "content-type": "application/rss+xml" } });
      }
      const body = audioMode === "success" ? Buffer.from("audio-bytes") : Buffer.alloc(2048, 1);
      return new Response(body, { status: 200, headers: { "content-type": "audio/mpeg" } });
    }
  });
  const source = service.save({ kind: "podcast", name: "RSS", url: "https://pod.example.com/feed.xml" }).source;
  const synced = await service.sync({ sourceId: source.id });
  const job = synced.jobs[0];
  const downloaded = await service.download(job.id, { maxBytes: 1024 });
  assert.equal(downloaded.ok, true);
  assert.equal(fs.readFileSync(downloaded.path, "utf8"), "audio-bytes");
  await service.removeAudio(downloaded.path);
  audioMode = "oversize";
  await assert.rejects(() => service.download(job.id, { maxBytes: 1024 }), /大小限制/);
  assert.equal(fs.readdirSync(tempRoot).filter((name) => name.includes(".part")).length, 0);
  fs.rmSync(tempRoot, { recursive: true, force: true });
})();

(async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "domi-podcast-process-"));
  const audioPath = path.join(tempRoot, "episode.m4a");
  const transcriptPath = path.join(tempRoot, "episode.md");
  fs.writeFileSync(audioPath, "audio");
  fs.writeFileSync(transcriptPath, "# transcript");
  let currentJob = {
    id: "job-1",
    sourceId: "source-1",
    title: "公开播客",
    status: "downloaded",
    localAudioPath: audioPath,
    transcriptPath: "",
    plaudFileId: "",
    error: ""
  };
  const commands = [];
  const radarSourceService = {
    getJob: () => ({ ...currentJob }),
    updateJob: (_id, patch) => {
      currentJob = { ...currentJob, ...patch };
      return { job: { ...currentJob } };
    },
    download: async () => ({ ok: true, path: audioPath }),
    removeAudio: async (target) => {
      fs.rmSync(target, { force: true });
      return true;
    },
    list: () => ({ ok: true, sources: [], jobs: [currentJob], updatedAt: 0 }),
    save: () => ({}),
    delete: () => ({}),
    sync: async () => ({})
  };
  const integration = new DomiIntegration({
    stateStore: memoryStore(),
    configProvider: () => ({ plaudConnectionMode: "enabled", plaudBrowser: "chrome" }),
    radarSourceService,
    mediaRuntime: { ffmpegPath: "", ffprobePath: "" },
    plaudBroker: { stop: async () => undefined, request: async () => ({}) },
    plaudOutputDir: tempRoot
  });
  integration.plaudPaths = () => ({ plugin: { root: tempRoot }, script: "/plugin/plaud.js" });
  integration.runJson = async (binary, args, options) => {
    commands.push({ binary, args, options });
    return { ok: true, fileId: "plaud-file-1", transcriptPath };
  };
  const result = await integration.processPodcastEpisode({ jobId: "job-1" });
  assert.equal(result.ok, true);
  assert.equal(result.transcriptPath, transcriptPath);
  assert.equal(result.plaudFileId, "plaud-file-1");
  assert.equal(result.audioRemoved, true);
  assert.equal(commands.length, 1);
  assert.equal(commands[0].args[1], "transcribe-local");
  assert.equal(commands[0].args[2], audioPath);
  assert.equal(commands[0].options.queue, "plaud");
  fs.rmSync(tempRoot, { recursive: true, force: true });
})();

{
  assert.equal(youTubeVideoIdFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youTubeVideoIdFromUrl("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youTubeVideoIdFromUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youTubeVideoIdFromUrl("https://www.youtube.com/@channel"), "");
  assert.equal(youTubeVideoIdFromUrl("https://example.com/watch?v=dQw4w9WgXcQ"), "");

  const episode = youTubeEpisodeFromInfo({
    _type: "video",
    id: "dQw4w9WgXcQ",
    webpage_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "公开测试视频",
    description: "公开视频简介",
    channel: "测试频道",
    upload_date: "20260807",
    duration: 2700,
    ext: "webm",
    availability: "public",
    age_limit: 0,
    live_status: "not_live"
  });
  assert.equal(episode.sourceFormat, "youtube");
  assert.equal(episode.episodeUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(episode.podcastTitle, "测试频道");
  assert.equal(episode.durationSec, 2700);

  assert.throws(() => youTubeEpisodeFromInfo({
    _type: "video",
    id: "dQw4w9WgXcQ",
    webpage_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: 2700,
    availability: "subscriber_only"
  }), /付费或需登录内容/);
  assert.throws(() => youTubeEpisodeFromInfo({
    _type: "video",
    id: "dQw4w9WgXcQ",
    webpage_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: 2700,
    age_limit: 18
  }), /年龄限制/);
  assert.throws(() => youTubeEpisodeFromInfo({
    _type: "video",
    id: "dQw4w9WgXcQ",
    webpage_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: 2700,
    is_live: true
  }), /直播/);
  assert.throws(() => youTubeEpisodeFromInfo({
    _type: "playlist"
  }), /不接受频道或播放列表/);
}

(async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "domi-youtube-radar-"));
  const calls = [];
  const youTubeInfo = {
    _type: "video",
    id: "dQw4w9WgXcQ",
    webpage_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "公开 YouTube 测试视频",
    description: "简介",
    channel: "测试频道",
    upload_date: "20260807",
    duration: 2700,
    ext: "m4a",
    availability: "public",
    age_limit: 0,
    live_status: "not_live"
  };
  const youTube = new YouTubeDlp({
    proxy: "http://127.0.0.1:7897",
    execImpl: async (file, args) => {
      calls.push({ file, args });
      if (args[0] === "--version") return { stdout: "2026.07.04\n", stderr: "" };
      if (args.includes("--dump-single-json")) {
        return { stdout: `${JSON.stringify(youTubeInfo)}\n`, stderr: "" };
      }
      const outputIndex = args.indexOf("--output");
      fs.writeFileSync(args[outputIndex + 1].replace(/%\(ext\)s$/, "m4a"), Buffer.from("youtube-audio"));
      return { stdout: "", stderr: "" };
    }
  });
  const service = new RadarSourceService({
    stateStore: memoryStore(),
    cacheDir: tempRoot,
    fetchImpl: async () => {
      throw new Error("YouTube 信源不应走普通 HTTP 抓取");
    },
    youTube
  });
  const source = service.save({
    kind: "podcast",
    name: "YouTube 公开视频",
    url: "https://youtu.be/dQw4w9WgXcQ"
  }).source;
  const synced = await service.sync({ sourceId: source.id });
  assert.equal(synced.ok, true);
  assert.equal(synced.jobs.length, 1);
  assert.equal(synced.jobs[0].sourceFormat, "youtube");
  assert.equal(synced.jobs[0].episodeUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(synced.jobs[0].status, "discovered");

  const job = synced.jobs[0];
  const downloaded = await service.download(job.id, { maxBytes: 1024 * 1024 });
  assert.equal(downloaded.ok, true);
  assert.equal(fs.readFileSync(downloaded.path, "utf8"), "youtube-audio");
  assert.equal(service.getJob(job.id).status, "downloaded");

  const downloadCall = calls.find((call) => call.args.includes("--output"));
  assert.ok(downloadCall, "下载必须通过 yt-dlp");
  const formatIndex = downloadCall.args.indexOf("--format");
  assert.match(downloadCall.args[formatIndex + 1], /^bestaudio/);
  const proxyIndex = downloadCall.args.indexOf("--proxy");
  assert.equal(downloadCall.args[proxyIndex + 1], "http://127.0.0.1:7897");
  assert.equal(downloadCall.args.some((arg) => /cookie/i.test(arg)), false);

  // 第二次下载复用缓存文件，不再触发新的 yt-dlp 下载调用。
  const callsBefore = calls.length;
  const cached = await service.download(job.id, { maxBytes: 1024 * 1024 });
  assert.equal(cached.cached, true);
  assert.equal(calls.length, callsBefore);

  fs.rmSync(tempRoot, { recursive: true, force: true });
})();

(async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "domi-youtube-radar-fail-"));
  const youTube = new YouTubeDlp({
    execImpl: async (file, args) => {
      if (args[0] === "--version") return { stdout: "2026.07.04\n", stderr: "" };
      if (args.includes("--dump-single-json")) {
        return {
          stdout: `${JSON.stringify({
            _type: "video",
            id: "dQw4w9WgXcQ",
            webpage_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            title: "会员视频",
            duration: 2700,
            availability: "subscriber_only"
          })}\n`,
          stderr: ""
        };
      }
      throw new Error("unexpected");
    }
  });
  const service = new RadarSourceService({
    stateStore: memoryStore(),
    cacheDir: tempRoot,
    youTube
  });
  const source = service.save({
    kind: "podcast",
    name: "YouTube 会员视频",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }).source;
  const synced = await service.sync({ sourceId: source.id });
  assert.equal(synced.ok, false);
  assert.equal(synced.jobs.length, 0);
  assert.match(synced.results[0].error, /付费或需登录内容/);

  const missingDlp = new RadarSourceService({
    stateStore: memoryStore(),
    cacheDir: tempRoot,
    youTube: new YouTubeDlp({
      execImpl: async () => {
        throw new Error("ENOENT");
      }
    })
  });
  const missingSource = missingDlp.save({
    kind: "podcast",
    name: "YouTube 缺少 yt-dlp",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }).source;
  const missingSynced = await missingDlp.sync({ sourceId: missingSource.id });
  assert.equal(missingSynced.ok, false);
  assert.match(missingSynced.results[0].error, /未找到 yt-dlp/);

  fs.rmSync(tempRoot, { recursive: true, force: true });
})();

process.on("beforeExit", () => {
  console.log("radar-sources tests passed");
});

// --- YouTube 频道信源（每日自动读取播客频道的基础） ---

{
  assert.deepEqual(
    youTubeChannelDescriptor("https://www.youtube.com/@AcquiredFM"),
    { type: "handle", value: "AcquiredFM" }
  );
  assert.deepEqual(
    youTubeChannelDescriptor("https://www.youtube.com/channel/UCU3i-tonXj9tqGJzfwcNAbA"),
    { type: "channel_id", value: "UCU3i-tonXj9tqGJzfwcNAbA" }
  );
  assert.deepEqual(
    youTubeChannelDescriptor("https://www.youtube.com/playlist?list=PLbS9bGj9ZkX0CmCp0mJ8Np2oXK7JbM5aB"),
    { type: "playlist", value: "PLbS9bGj9ZkX0CmCp0mJ8Np2oXK7JbM5aB" }
  );
  assert.equal(youTubeChannelDescriptor("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(youTubeChannelDescriptor("https://example.com/@channel"), null);

  const pageHtml = `<html><head>
    <link rel="canonical" href="https://www.youtube.com/channel/UCU3i-tonXj9tqGJzfwcNAbA">
    <link rel="alternate" type="application/rss+xml" title="RSS" href="https://www.youtube.com/feeds/videos.xml?channel_id=UCU3i-tonXj9tqGJzfwcNAbA">
  </head></html>`;
  assert.equal(
    youTubeFeedLinkFromChannelPage(pageHtml),
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCU3i-tonXj9tqGJzfwcNAbA"
  );
  assert.equal(youTubeFeedLinkFromChannelPage("<html><head></head></html>"), null);

  const feedXml = `<?xml version="1.0"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <title>Acquired</title>
  <entry>
    <yt:videoId>dQw4w9WgXcQ</yt:videoId>
    <title>Episode 100: The Whole Story</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"/>
    <published>2026-09-10T08:00:00+00:00</published>
    <updated>2026-09-10T08:00:00+00:00</updated>
    <author><name>Acquired</name></author>
    <media:description>Episode description.</media:description>
  </entry>
  <entry>
    <yt:videoId>9bZkp7q19f0</yt:videoId>
    <title>Episode 99: Prior Episode</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=9bZkp7q19f0"/>
    <published>2026-09-01T08:00:00+00:00</published>
    <updated>2026-09-01T08:00:00+00:00</updated>
    <media:description>Prior description.</media:description>
  </entry>
</feed>`;
  const parsed = parseYouTubeChannelFeed(feedXml);
  assert.equal(parsed.channelTitle, "Acquired");
  assert.equal(parsed.episodes.length, 2);
  assert.equal(parsed.episodes[0].episodeUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(parsed.episodes[0].sourceFormat, "youtube");
  assert.equal(parsed.episodes[0].durationSec, null);
  assert.equal(parsed.episodes[0].podcastTitle, "Acquired");
  assert.ok(Number.isFinite(parsed.episodes[0].publishedAt));
}

(async () => {
  const store = memoryStore();
  const fetchLog = [];
  const channelPage = `<html><head>
    <link rel="alternate" type="application/rss+xml" href="https://www.youtube.com/feeds/videos.xml?channel_id=UCU3i-tonXj9tqGJzfwcNAbA">
  </head></html>`;
  const feedXml = `<?xml version="1.0"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <title>Acquired</title>
  <entry>
    <yt:videoId>dQw4w9WgXcQ</yt:videoId>
    <title>Episode 100</title>
    <published>2026-09-10T08:00:00+00:00</published>
    <updated>2026-09-10T08:00:00+00:00</updated>
    <media:description>Episode description.</media:description>
  </entry>
</feed>`;
  const service = new RadarSourceService({
    stateStore: store,
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "domi-yt-channel-")),
    fetchImpl: async (url) => {
      fetchLog.push(String(url));
      if (String(url) === "https://www.youtube.com/@AcquiredFM") {
        return new Response(channelPage, { status: 200, headers: { "content-type": "text/html" } });
      }
      if (String(url).startsWith("https://www.youtube.com/feeds/videos.xml")) {
        return new Response(feedXml, { status: 200, headers: { "content-type": "application/rss+xml" } });
      }
      throw new Error(`unexpected URL ${url}`);
    },
    now: () => 1_700_000_000_100
  });

  // 非法链接在保存阶段被拒。
  assert.throws(
    () => service.save({ kind: "youtube_channel", name: "坏频道", url: "https://example.com/@x" }),
    /YouTube 频道链接/
  );

  const created = service.save({
    kind: "youtube_channel",
    name: "Acquired",
    url: "https://www.youtube.com/@AcquiredFM",
    autoProcess: true
  });
  assert.equal(created.source.kind, "youtube_channel");
  assert.equal(created.source.autoProcess, true);

  const synced = await service.sync({ sourceId: created.source.id });
  assert.equal(synced.ok, true);
  assert.equal(synced.jobs.length, 1);
  assert.equal(synced.jobs[0].status, "discovered");
  assert.equal(synced.jobs[0].sourceFormat, "youtube");
  assert.equal(synced.jobs[0].episodeUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(synced.results[0].discoveredCount, 1);
  assert.ok(fetchLog.includes("https://www.youtube.com/@AcquiredFM"));
  assert.ok(fetchLog.some((url) => url.startsWith("https://www.youtube.com/feeds/videos.xml?channel_id=")));

  // 第二次同步不产生重复任务。
  const syncedAgain = await service.sync({ sourceId: created.source.id });
  assert.equal(syncedAgain.jobs.length, 1);
  assert.equal(syncedAgain.results[0].discoveredCount, 0);

  const listed = service.list();
  assert.equal(listed.sources.length, 1);
  assert.deepEqual(listed.twitterItems, []);
})();

// --- X 大V信源（每日自动读取推特推送，需用户自己的 X API 凭证） ---

{
  assert.equal(twitterHandleFromUrl("https://x.com/elikiba"), "elikiba");
  assert.equal(twitterHandleFromUrl("https://twitter.com/@sama"), "sama");
  assert.equal(twitterHandleFromUrl("https://x.com/home"), null);
  assert.equal(twitterHandleFromUrl("https://x.com/i/intent/post"), null);
  assert.equal(twitterHandleFromUrl("https://example.com/sama"), null);
  assert.equal(twitterHandleFromUrl("https://x.com/this_handle_is_way_too_long"), null);
}

(async () => {
  const store = memoryStore();
  const apiCalls = [];
  const service = new RadarSourceService({
    stateStore: store,
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "domi-twitter-")),
    fetchImpl: async (url) => {
      apiCalls.push(String(url));
      return new Response(
        JSON.stringify({
          data: [
            { id: "1800000000000000001", text: "算力供需正在边际变化。", created_at: "2026-09-15T10:00:00.000Z" },
            { id: "1800000000000000002", text: "关于 CUDA 生态的思考。", created_at: "2026-09-14T10:00:00.000Z" }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    },
    now: () => 1_700_000_000_100
  });

  assert.throws(
    () => service.save({ kind: "twitter", name: "坏链接", url: "https://example.com/sama" }),
    /X 大V链接/
  );
  const source = service.save({
    kind: "twitter",
    name: "某大V",
    url: "https://x.com/kol_handle",
    keywords: ["算力"]
  }).source;
  assert.equal(source.kind, "twitter");
  assert.equal(source.autoProcess, false);

  // 未配置凭证时同步失败，并给出明确指引，不做任何网络请求。
  const noToken = await service.sync({ sourceId: source.id });
  assert.equal(noToken.ok, false);
  assert.match(noToken.results[0].error, /X API Bearer Token/);
  assert.equal(apiCalls.length, 0);

  // 令牌格式校验。
  assert.throws(() => service.saveTwitterToken("short"), /格式看起来不对/);
  const tokenSaved = service.saveTwitterToken("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  assert.deepEqual(tokenSaved, { ok: true, configured: true });

  const synced = await service.sync({ sourceId: source.id });
  assert.equal(synced.ok, true);
  assert.equal(synced.twitterItems.length, 2);
  assert.equal(synced.twitterItems[0].handle, "kol_handle");
  assert.equal(synced.twitterItems[0].url, "https://x.com/kol_handle/status/1800000000000000001");
  assert.equal(synced.twitterItems[0].authorName, "某大V");
  assert.equal(synced.twitterTokenConfigured, true);
  assert.equal(synced.results[0].discoveredCount, 2);
  assert.equal(apiCalls.length, 1);
  assert.ok(apiCalls[0].startsWith("https://api.twitter.com/2/users/by/username/kol_handle/tweets"));

  // 第二次同步不产生重复条目。
  const syncedAgain = await service.sync({ sourceId: source.id });
  assert.equal(syncedAgain.twitterItems.length, 2);
  assert.equal(syncedAgain.results[0].discoveredCount, 0);

  // 删除信源时推文一并清理。
  const deleted = service.delete(source.id);
  assert.equal(deleted.deleted, true);
  assert.equal(deleted.twitterItems.length, 0);
})();

// --- kinds 过滤：快循环只轮询播客，X 大V/YouTube 频道走每日低频同步 ---

(async () => {
  const store = memoryStore();
  const requests = [];
  const youtubeFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <title>Acquired</title>
  <entry>
    <yt:videoId>dQw4w9WgXcQ</yt:videoId>
    <title>第 100 期</title>
    <published>2026-09-10T00:00:00+00:00</published>
    <updated>2026-09-10T00:00:00+00:00</updated>
    <link rel="alternate" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"/>
    <author><name>Acquired</name></author>
  </entry>
</feed>`;
  const service = new RadarSourceService({
    stateStore: store,
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "domi-radar-kinds-")),
    fetchImpl: async (url) => {
      requests.push(String(url));
      if (String(url).startsWith("https://www.youtube.com/feeds/videos.xml")) {
        return new Response(youtubeFeed, { status: 200, headers: { "content-type": "application/rss+xml" } });
      }
      if (String(url).startsWith("https://api.twitter.com/")) {
        return new Response(
          JSON.stringify({
            data: [
              { id: "1800000000000000009", text: "新推送。", created_at: "2026-09-15T10:00:00.000Z" }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      throw new Error(`unexpected URL ${url}`);
    },
    now: () => 1_700_000_000_100
  });

  const channel = service.save({
    kind: "youtube_channel",
    name: "Acquired",
    url: "https://www.youtube.com/channel/UCU3i-tonXj9tqGJzfwcNAbA"
  }).source;
  service.saveTwitterToken("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  const kol = service.save({ kind: "twitter", name: "某大V", url: "https://x.com/kol_handle" }).source;

  // 快循环只同步播客：YouTube/X 都不应发起任何网络请求。
  const podcastOnly = await service.sync({ kinds: ["podcast"] });
  assert.equal(podcastOnly.ok, true);
  assert.equal(requests.length, 0);

  // 每日同步 YouTube 频道：只访问 YouTube 订阅源，不调用 X API。
  const youtubeOnly = await service.sync({ kinds: ["youtube_channel"] });
  assert.equal(youtubeOnly.ok, true);
  assert.equal(youtubeOnly.jobs.filter((job) => job.sourceId === channel.id).length, 1);
  assert.equal(requests.filter((url) => url.startsWith("https://api.twitter.com/")).length, 0);

  // 每日同步 X 大V：只调用 X API，不重复访问 YouTube 订阅源。
  const twitterOnly = await service.sync({ kinds: ["twitter"] });
  assert.equal(twitterOnly.ok, true);
  assert.equal(twitterOnly.twitterItems.filter((item) => item.sourceId === kol.id).length, 1);
  assert.equal(requests.filter((url) => url.startsWith("https://www.youtube.com/")).length, 1);
  assert.equal(requests.filter((url) => url.startsWith("https://api.twitter.com/")).length, 1);

  // 未知类型被忽略；kinds 为空数组时不同步任何网络源。
  const none = await service.sync({ kinds: ["not-a-kind"] });
  assert.equal(none.ok, true);
  assert.equal(requests.length, 2);
})();
