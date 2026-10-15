const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test } = require("node:test");
const { SubscriptionArchiveWorker, transcriptChunks, SUMMARY_PREFERENCES, verifyMedia } = require("../electron/subscription-archive.cjs");
const { sha256, translationSection, TRANSLATION_VERSION, TRANSLATION_PREFERENCES } = require("../electron/chinese-translation.cjs");
const { subtitleResult } = require("../build/domi-plugin/skills/intake-archive/scripts/media-intake.cjs");

const summary = () => ({ title: "完整视频的中文标题", overview: "全文讨论需求变化及其成立条件。",
  investmentMeaning: "暂无特殊信号", domains: ["算力芯片"], subdomains: ["CPU与通用处理器"], companies: "",
  arguments: [{ claim: "处理器需求取决于工作负载", evidence: "00:00:05 原文给出工具调度的例子。", reasoning: "工具调度增加处理器需求，原文未给出具体增速。" }] });

function fixture(t, text = "完整文字稿的第一句和最后一句。") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-subscription-test-"));
  t.after(async () => {
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.match(path.basename(resolved), /^domi-subscription-test-[A-Za-z\d]+$/);
    await fs.promises.rm(resolved, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 });
  });
  const queuePath = path.join(root, "pending-archive.json"), stateRoot = path.join(root, "archives");
  const item = { videoId: "abcdefghijk", url: "https://www.youtube.com/watch?v=abcdefghijk", channel: "测试频道",
    title: "测试视频", status: "pending", queuedAt: "2026-10-10T01:00:00.000Z" };
  fs.writeFileSync(queuePath, JSON.stringify({ version: 1, items: [item] }));
  const subtitleFile = path.join(root, "source.srt"), transcriptPath = path.join(root, "transcript.txt"), jsonPath = path.join(root, "transcript.json");
  const raw = `1\n00:00:00,000 --> 00:00:10,000\n${text}\n`, parsed = subtitleResult(raw, 10);
  fs.writeFileSync(subtitleFile, raw); fs.writeFileSync(transcriptPath, parsed.text + "\n");
  fs.writeFileSync(jsonPath, JSON.stringify({ cues: parsed.cues, validation: parsed.validation }));
  const media = { ok: true, complete: true, contentKind: "subtitle", durationSeconds: 10, validation: parsed.validation,
    metadata: { title: "测试视频", description: "完整简介", publishedAt: "2026-10-09T00:00:00Z" },
    transcriptPath, transcriptSha256: sha256(fs.readFileSync(transcriptPath)), jsonPath, jsonSha256: sha256(fs.readFileSync(jsonPath)),
    subtitleFile, subtitleSha256: sha256(fs.readFileSync(subtitleFile)) };
  const translate = async (source) => ({ text: source, receipt: { version: TRANSLATION_VERSION, ...TRANSLATION_PREFERENCES,
    complete: true, sourceSha256: sha256(source), translationSha256: sha256(source) } });
  const archive = async (payload) => {
    const original = fs.readFileSync(payload.originalContentFile, "utf8").trim(), translated = fs.readFileSync(payload.translationContentFile, "utf8");
    const documentPath = path.join(root, "saved.md");
    fs.writeFileSync(documentPath, `# ${payload.title}\n${payload.summary}\n${translationSection(translated, payload.translationReceipt)}\n## 原文存档\n${original}`);
    return { ok: true, event: { eventId: "art_test", documentPath }, storageReceipt: { recordVerified: true, documentVerified: true,
      originalContentVerified: true, originalContentSha256: sha256(original), translationVerified: true } };
  };
  const options = { queuePath, stateRoot, getMedia: async () => media, summarize: async () => summary(), translate, archive };
  return { root, queuePath, stateRoot, item, media, translate, archive, options, queue: () => JSON.parse(fs.readFileSync(queuePath, "utf8")) };
}

test("complete source, standard models, structured summary and verified document are required before done", async (t) => {
  const f = fixture(t), worker = new SubscriptionArchiveWorker(f.options);
  const result = await worker.runOnce(); worker.close();
  assert.deepEqual({ completed: result.completed, failed: result.failed, remaining: result.remaining }, { completed: 1, failed: 0, remaining: 0 });
  assert.equal(f.queue().items[0].processor, "chatgpt"); assert.equal(f.queue().items[0].status, "done");
  const document = fs.readFileSync(f.queue().items[0].documentPath, "utf8");
  for (const label of ["全文重要观点", "论点1", "相应论据", "相应论证", "最后一句"]) assert.ok(document.includes(label));
  const handoff = JSON.parse(fs.readFileSync(path.join(f.stateRoot, f.item.videoId, "handoff.json"), "utf8"));
  assert.deepEqual(handoff.receipts.summary.model, "gpt-6.1-sol");
  assert.deepEqual(SUMMARY_PREFERENCES, { model: "gpt-6.1-sol", reasoningEffort: "high", serviceTier: "standard" });
  assert.equal(handoff.receipts.translation.model, "gpt-6-luna"); assert.equal(handoff.currentStage, "complete");
  assert.equal((await worker.runOnce()).completed, 0);
});

test("missing or incomplete captions cannot call a model or create an archive", async (t) => {
  const f = fixture(t), worker = new SubscriptionArchiveWorker({ ...f.options,
    getMedia: async () => ({ ...f.media, complete: false, error: { message: "字幕缺少后半段" } }),
    summarize: async () => assert.fail("不完整字幕不得总结"), archive: async () => assert.fail("不得保存完成记录") });
  const result = await worker.runOnce(); worker.close();
  assert.equal(result.failed, 1); assert.equal(f.queue().items[0].status, "blocked");
  assert.match(f.queue().items[0].error, /后半段/); assert.ok(f.queue().items[0].lastAttemptAt);
  assert.equal((await worker.runOnce()).failed, 0, "冷却期间不反复处理");
});

test("YouTube access verification records the browser stage and avoids repeated command-line failures", async (t) => {
  const f = fixture(t); let mediaCalls = 0;
  const first = new SubscriptionArchiveWorker({ ...f.options, getMedia: async () => {
    mediaCalls++; return { ok: false, error: { message: "YouTube 要求登录／访问验证，未取得公开字幕" } };
  } });
  const result = await first.runOnce();
  assert.equal(result.waitingForBrowser, 1);
  assert.equal(f.queue().items[0].blockedStage, "browser-transcript");
  assert.equal(f.queue().items[0].requiresBrowserTranscript, true);
  const queue = f.queue(); queue.items[0].nextRetryAt = "2020-01-01T00:00:00Z";
  fs.writeFileSync(f.options.queuePath, JSON.stringify(queue));
  assert.equal((await first.runOnce()).failed, 0);
  assert.equal(mediaCalls, 1);
  first.close();
  const jobDir = path.join(f.stateRoot, f.item.videoId);
  fs.writeFileSync(path.join(jobDir, "browser-access.json"), JSON.stringify({ status: "blocked", error: "访问验证" }));
  const recovered = new SubscriptionArchiveWorker(f.options);
  assert.equal((await recovered.runOnce({ force: true })).completed, 1); recovered.close();
  assert.equal(f.queue().items[0].requiresBrowserTranscript, false);
  assert.equal(f.queue().items[0].blockedStage, null);
  assert.equal(fs.existsSync(path.join(jobDir, "failure.json")), false);
  const browserAccess = JSON.parse(fs.readFileSync(path.join(jobDir, "browser-access.json"), "utf8"));
  assert.equal(browserAccess.status, "resolved");
  assert.equal(browserAccess.error, "访问验证");
  assert.ok(browserAccess.resolvedAt);
});

test("tampered transcripts and subtitle sources are rejected even with complete=true", (t) => {
  const f = fixture(t); fs.appendFileSync(f.media.transcriptPath, "修改");
  assert.throws(() => verifyMedia(f.media), /不可验证/);
  f.media.transcriptSha256 = sha256(fs.readFileSync(f.media.transcriptPath));
  fs.appendFileSync(f.media.subtitleFile, "修改"); assert.throws(() => verifyMedia(f.media), /时间轴/);
});

test("translation interruption resumes cached full summary and does not mark failed work done", async (t) => {
  const f = fixture(t); let calls = 0;
  const options = { ...f.options, summarize: async () => { calls++; return summary(); } };
  const first = new SubscriptionArchiveWorker({ ...options, translate: async () => { throw new Error("翻译网络中断"); } });
  assert.equal((await first.runOnce()).failed, 1); first.close();
  assert.equal(f.queue().items[0].status, "blocked");
  const second = new SubscriptionArchiveWorker(options);
  assert.equal((await second.runOnce({ force: true })).completed, 1); second.close();
  assert.equal(calls, 1); assert.equal(f.queue().items[0].attempts, 2);
});

test("ordinary English in an otherwise Chinese archive title is translated before storage", async (t) => {
  const f = fixture(t), title = "Agentic AI为何重新拉动CPU需求"; let saved;
  const worker = new SubscriptionArchiveWorker({ ...f.options,
    summarize: async () => ({ ...summary(), title }),
    translate: async (source) => source === title ? { text: "智能体AI为何重新拉动CPU需求", receipt: {} } : f.translate(source),
    archive: async (payload) => { saved = payload; return f.archive(payload); } });
  assert.equal((await worker.runOnce()).completed, 1); worker.close();
  assert.equal(saved.title, "智能体AI为何重新拉动CPU需求");
  const checkpoint = JSON.parse(fs.readFileSync(path.join(f.stateRoot, f.item.videoId, "summary.json"), "utf8"));
  assert.equal(checkpoint.result.title, saved.title);
});

test("long source includes the final segment in both analysis and synthesis without trimming", async (t) => {
  const text = "全文前半段。".repeat(12000) + "\n后半段独有的重要结论", f = fixture(t, text), prompts = [];
  const worker = new SubscriptionArchiveWorker({ ...f.options, summarize: async (prompt) => {
    prompts.push(prompt); return { ...summary(), overview: prompt.includes("后半段独有") ? "后半段独有的重要结论" : "前半段观点" };
  } });
  assert.equal((await worker.runOnce()).completed, 1); worker.close();
  assert.ok(prompts.length >= 3); assert.ok(prompts.some((prompt) => prompt.includes("后半段独有的重要结论")));
  assert.ok(prompts.at(-1).includes("后半段独有的重要结论"));
  assert.equal(transcriptChunks(text).join("\n\n").replace(/\s/g, ""), text.replace(/\s/g, ""));
});

test("long caption documents keep subtitle rows and metadata in complete lossless reading chunks", () => {
  const source = "# 原始标题\n\n" + Array.from({length:60},(_,i)=>`[0:${String(i).padStart(2,'0')}] ${'正文字幕'.repeat(8)}\n`).join('') + "\n> 字幕来源和校验说明。";
  const chunks = transcriptChunks(source, 500);
  assert.equal(chunks.join(''), source); assert.ok(chunks.every((chunk)=>chunk.length<=500));
  assert.ok(chunks[0].includes('[0:00]')); assert.ok(chunks.at(-1).includes('[0:59]'));
  assert.ok(chunks.slice(0,-1).every((chunk)=>chunk.endsWith('\n')));
});

test("a larger reading window sends the complete source once and reuses an interrupted older plan", async (t) => {
  const text = "全文前半段。".repeat(12000) + "\n后半段独有的重要结论", first = fixture(t, text);
  const prompts = [];
  const worker = new SubscriptionArchiveWorker({ ...first.options, readingCharacters: 120000, summarize: async (prompt) => {
    prompts.push(prompt); return summary();
  } });
  assert.equal((await worker.runOnce()).completed, 1); worker.close();
  assert.equal(prompts.length, 1); assert.ok(prompts[0].includes(text));
  const resumed = fixture(t, text); let calls = 0;
  const older = new SubscriptionArchiveWorker({ ...resumed.options, summarize: async () => {
    if (++calls === 2) throw new Error("模拟第二段中断"); return summary();
  } });
  assert.equal((await older.runOnce()).failed, 1); older.close();
  const remaining = [];
  const newer = new SubscriptionArchiveWorker({ ...resumed.options, readingCharacters: 120000, summarize: async (prompt) => {
    remaining.push(prompt); return summary();
  } });
  assert.equal((await newer.runOnce({force:true})).completed, 1); newer.close();
  assert.equal(remaining.length, 2); assert.ok(remaining[0].includes("第 2/2 段"));
});

test("false storage receipts and truncated documents remain blocked", async (t) => {
  const f = fixture(t), worker = new SubscriptionArchiveWorker({ ...f.options, archive: async (payload) => {
    const receipt = await f.archive(payload); fs.writeFileSync(receipt.event.documentPath, "只有标题"); return receipt;
  } });
  assert.equal((await worker.runOnce()).failed, 1); worker.close();
  assert.equal(f.queue().items[0].status, "blocked"); assert.match(f.queue().items[0].error, /不一致/);
});

test("queue updates preserve newly discovered items and recover interrupted processing", async (t) => {
  const f = fixture(t); const queue = f.queue(); queue.items[0].status = "processing"; fs.writeFileSync(f.queuePath, JSON.stringify(queue));
  const worker = new SubscriptionArchiveWorker({ ...f.options, archive: async (payload) => {
    const latest = f.queue(); latest.items.push({ ...f.item, videoId: "lmnopqrstuv", url: "https://www.youtube.com/watch?v=lmnopqrstuv" });
    fs.writeFileSync(f.queuePath, JSON.stringify(latest)); return f.archive(payload);
  } });
  const result = await worker.runOnce(); worker.close();
  assert.equal(result.completed, 1); assert.equal(result.remaining, 1); assert.equal(f.queue().items[1].status, "pending");
});

test("quota exhaustion records a resumable failure and stops before consuming every remaining item", async (t) => {
  const f = fixture(t), queue = f.queue(); queue.items.push({ ...f.item, videoId: "lmnopqrstuv", url: "https://www.youtube.com/watch?v=lmnopqrstuv" });
  fs.writeFileSync(f.queuePath, JSON.stringify(queue));
  const worker = new SubscriptionArchiveWorker({ ...f.options, summarize: async () => { throw new Error("usage limit reached"); } });
  const result = await worker.runOnce(); worker.close();
  assert.equal(result.paused, "chatgpt-quota"); assert.equal(f.queue().items[1].lastAttemptAt, undefined);
});

test("a live consumer lock prevents duplicate processing", async (t) => {
  const f = fixture(t); fs.writeFileSync(path.join(f.root, ".archive.lock"), String(process.pid));
  const worker = new SubscriptionArchiveWorker({ ...f.options, getMedia: async () => assert.fail("不能启动第二个消费者") });
  assert.equal((await worker.runOnce()).busy, true); worker.close();
});

test("bounded parallel processing completes every item once and preserves queue writes", async (t) => {
  const f = fixture(t), queue = f.queue();
  queue.items.push({ ...f.item, videoId: "lmnopqrstuv", url: "https://www.youtube.com/watch?v=lmnopqrstuv" });
  queue.items.push({ ...f.item, videoId: "12345678901", url: "https://www.youtube.com/watch?v=12345678901" });
  fs.writeFileSync(f.queuePath, JSON.stringify(queue));
  let active = 0, maximum = 0, calls = 0;
  const worker = new SubscriptionArchiveWorker({ ...f.options, summarize: async () => {
    active++; maximum = Math.max(maximum, active); calls++;
    await new Promise((resolve) => setTimeout(resolve, 20)); active--; return summary();
  } });
  const result = await worker.runOnce({ concurrency: 2 }); worker.close();
  assert.equal(maximum, 2); assert.equal(calls, 3); assert.equal(result.completed, 3);
  assert.ok(f.queue().items.every((item) => item.status === "done" && item.attempts === 1));
});

test("real local repository CLI verifies complete original and Chinese translation together", async (t) => {
  const f = fixture(t), configPath = path.join(f.root, "config.json");
  fs.writeFileSync(configPath, JSON.stringify({ storageBackend: "local", localRepositoryDir: path.join(f.root, "library"), localDatabasePath: path.join(f.root, "library.sqlite3") }));
  const options = { ...f.options, configPath }; delete options.archive;
  const worker = new SubscriptionArchiveWorker(options);
  assert.equal((await worker.runOnce()).completed, 1); worker.close();
  const item = f.queue().items[0]; assert.equal(item.storageReceipt.originalContentVerified, true); assert.equal(item.storageReceipt.translationVerified, true);
});

test("daily discovery failure or an empty feed still calls the ChatGPT consumer", async () => {
  const runner = await import(pathToFileURL(path.resolve(__dirname, "follow-builders-runner.mjs")).href);
  let calls = 0;
  await runner.runDailyWorkflow({ discover: async () => {}, consume: async () => { calls++; } });
  await assert.rejects(runner.runDailyWorkflow({ discover: async () => { throw new Error("日报内容源不可达"); }, consume: async () => { calls++; } }), /不可达/);
  assert.equal(calls, 2);
});

test("unreachable central feeds do not suppress independent YouTube discovery", async () => {
  const runner = await import(pathToFileURL(path.resolve(__dirname, "follow-builders-runner.mjs")).href);
  let calls = 0;
  const collected = { results: [{ videos: [{videoId: "abcdefghijk"}], blocked: false, degraded: false }] };
  const result = await runner.collectDailySources({ fetchFeeds: async () => [null, null, null],
    collectVideos: async () => { calls++; return collected; }, logger: () => {} });
  assert.equal(calls, 1); assert.equal(result.collected, collected); assert.equal(result.centralUnavailable, true);
  await assert.rejects(runner.collectDailySources({ fetchFeeds: async () => [null, null, null],
    collectVideos: async () => ({ results: [{ videos: [], blocked: true }] }), logger: () => {} }), /均不可达/);
});

test("queue producer keeps unprocessed history and the standard consumer launches independently", async (t) => {
  const f = fixture(t), runner = await import(pathToFileURL(path.resolve(__dirname, "follow-builders-runner.mjs")).href);
  await runner.queueForChatGPT({ results: [{ channel: { name: "测试频道", handle: "test" }, videos: [{ videoId: "lmnopqrstuv", title: "新视频", url: "https://www.youtube.com/watch?v=lmnopqrstuv" }] }] }, f.queuePath, () => {});
  assert.equal(f.queue().items.length, 2); assert.equal(f.queue().items[0].status, "pending");
  fs.writeFileSync(path.join(f.root, "config.json"), JSON.stringify({ archive: { provider: "chatgpt" } }));
  const result = await runner.processPendingArchives({ userDir: f.root, projectDir: path.resolve(__dirname, ".."), logger: () => {}, notifier: () => {}, consumer: async (runtime, args, settings) => {
    assert.ok(runtime.endsWith("electron.exe")); assert.ok(args[0].endsWith("process-subscription-archives.cjs"));
    assert.equal(settings.windowsHide, true); assert.equal(settings.env.FOLLOW_BUILDERS_HOME, f.root);
    return { stdout: JSON.stringify({ phase: "finished", ok: true, completed: 1, failed: 0, remaining: 1 }) };
  } });
  assert.equal(result.completed, 1);
});

test("an unchanged browser wait produces no repeated failure notification", async (t) => {
  const f = fixture(t), runner = await import(pathToFileURL(path.resolve(__dirname, "follow-builders-runner.mjs")).href);
  fs.writeFileSync(path.join(f.root, "config.json"), JSON.stringify({ archive: { provider: "chatgpt" } }));
  const notifications = [];
  const run = (finished) => runner.processPendingArchives({ userDir: f.root, projectDir: path.resolve(__dirname, ".."),
    logger: () => {}, notifier: (...message) => notifications.push(message),
    consumer: async () => ({ stdout: JSON.stringify({ phase: "finished", ok: true, remaining: 1, waitingForBrowser: 1, ...finished }) }) });
  await run({ completed: 0, failed: 0 });
  assert.equal(notifications.length, 0);
  await run({ completed: 0, failed: 1 });
  assert.equal(notifications.length, 1);
  assert.match(notifications[0][1], /等待正规浏览器/);
});
