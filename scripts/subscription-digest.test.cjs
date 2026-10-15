const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { pathToFileURL } = require("node:url");
const { sha256, translationSection, readTranslationSection, TRANSLATION_VERSION } = require("../electron/chinese-translation.cjs");
const { readDigestSource, digestDisplayTitle, normalizeDigestChinese, normalizeEnglishDates, protectedSignature,
  needsDigestRepair, prepareChineseDigest, publishChineseDigest, finalizeSubscriptionDigest } = require("../electron/subscription-digest.cjs");
const { markdownFiles } = require("../electron/knowledge-translation.cjs");
const { mirrorTargetFiles } = require("../electron/feishu-wiki-mirror.cjs");

function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-digest-"));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.match(path.basename(root), /^domi-digest-[A-Za-z\d]+$/);
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 });
  });
  return root;
}

const SOURCE = "# AI Builders Digest — 2026-10-09\n\n> The agent costs 75% less. https://example.com/source\n\n> The final tweet stays present. @builder";
const CHINESE = "# AI 构建者日报 — 2026-10-09\n\n> 智能体成本降低 75%。https://example.com/source\n\n> 最后一条推文完整保留。@builder";
function cached(source = SOURCE, text = CHINESE) {
  return readTranslationSection(translationSection(text, { version: TRANSLATION_VERSION, complete: true,
    sourceSha256: sha256(source), translationSha256: sha256(text) }));
}

test("ordinary English terms become Chinese while URLs, accounts, code and official names stay intact", () => {
  const text = "follow-builders 中央 feed；agent prompt token bug Dock；Claude Agent SDK；Box Agent；Replit Agent 4；`token agent`；https://example.com/agent；@builder";
  assert.equal(normalizeDigestChinese(text), "follow-builders 中央 内容源；智能体 提示词 词元 缺陷 程序坞；Claude Agent SDK；Box Agent；Replit Agent 4；`token agent`；https://example.com/agent；@builder");
  assert.equal(needsDigestRepair("- **Why Speech Recognition Was Solved Before Conversation**（1天前）"), true);
  assert.equal(needsDigestRepair("### Chips and Cheese — 芯片微架构"), false);
});

test("digest display titles use Chinese for local reports and mirrors without changing filenames", (t) => {
  const root = temporary(t), file = path.join(root, "13.认知库", "订阅日报", "AI-Builders-Digest-2026-10-09.md");
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, CHINESE);
  assert.equal(digestDisplayTitle(CHINESE, file), "AI 构建者日报 — 2026-10-09");
  assert.equal(digestDisplayTitle("# AI Builders Digest — 2026-10-09", file), "AI 构建者日报 — 2026-10-09");
  const { FeishuWikiMirror } = require("../electron/feishu-wiki-mirror.cjs");
  const mirror = new FeishuWikiMirror({ libraryRoot: root });
  assert.equal(mirror.prepareDocument(file, "13.认知库/订阅日报/AI-Builders-Digest-2026-10-09.md").title, "AI 构建者日报 — 2026-10-09");
});

test("English calendar dates convert deterministically without changing dates inside URLs or executable code", () => {
  assert.equal(normalizeEnglishDates("October 15th, 2025; Oct 2026; April 17, 1906; `Oct 2026` https://example.com/Oct-2026"),
    "2025年10月15日; 2026年10月; 1906年4月17日; `Oct 2026` https://example.com/Oct-2026");
  assert.equal(protectedSignature("October 15th, 2025"), protectedSignature("2025年10月15日"));
});

test("named months in temporal phrases match numeric Chinese months without changing modal verbs or names", async () => {
  assert.equal(normalizeEnglishDates("The log stops in November."), "The log stops in 11月.");
  assert.equal(normalizeEnglishDates("We can march in March."), "We can march in 3月.");
  assert.equal(normalizeEnglishDates("This may improve. A paper by May Chen. An august event."), "This may improve. A paper by May Chen. An august event.");
  const source = "# AI Builders Digest — 2026-10-15\n\n> The log stops in November. The other value remains 14.";
  const chinese = "# AI 构建者日报 — 2026-10-15\n\n> 日志在 11 月停止。另一个值仍然是 14。";
  const result = await prepareChineseDigest({source,translator:{translate:async(input)=>{
    assert.ok(input.includes("in 11月"));return {text:chinese};
  }}});
  assert.ok(result.receipt.protectedValuesVerified);
  await assert.rejects(prepareChineseDigest({source,translator:{translate:async()=>({text:chinese.replace("11 月","12 月")})}}), /不能发布/);
});

test("verified historical translations are reused and English originals move to hidden sidecars in both copies", async (t) => {
  const root = temporary(t);
  const dir = path.join(root, "13.认知库", "订阅日报");
  const file = path.join(dir, "AI-Builders-Digest-2026-10-09.md");
  const second = path.join(root, "runner", "AI-Builders-Digest-2026-10-09.md");
  fs.mkdirSync(dir, { recursive: true });
  const old = "# 旧阅读版\n\n" + cached().section + "\n\n## 英文原文（保留核对）\n\n" + SOURCE;
  fs.writeFileSync(file, old);
  const translator = { translate: async () => { throw new Error("不应重复请求模型"); } };
  await publishChineseDigest({ source: SOURCE, files: [file, second], translator });
  for (const target of [file, second]) {
    const saved = fs.readFileSync(target, "utf8");
    assert.ok(!saved.includes("The final tweet"));
    assert.ok(!saved.includes("## 英文原文"));
    assert.equal((saved.match(/^# /gm) || []).length, 1);
    assert.ok(saved.includes("最后一条推文完整保留"));
    assert.ok(readTranslationSection(saved).verified);
    assert.equal(readDigestSource(saved, target), SOURCE);
  }
  assert.equal(fs.readFileSync(file, "utf8"), fs.readFileSync(second, "utf8"));
  assert.deepEqual(markdownFiles(dir), [file]);
  assert.deepEqual(mirrorTargetFiles(root).map((item) => item.relativePath), ["13.认知库/订阅日报/AI-Builders-Digest-2026-10-09.md"]);
  const before = fs.statSync(file).mtimeMs;
  await publishChineseDigest({ source: SOURCE, files: [file, second], translator });
  assert.equal(fs.statSync(file).mtimeMs, before);
});

test("a damaged historical paragraph is retranslated without resending all other paragraphs", async () => {
  const calls = [];
  const result = await prepareChineseDigest({ source: SOURCE, cached: cached(SOURCE, CHINESE.replace("75%", "75% 75%")),
    translator: { translate: async (source) => { calls.push(source); return { text: "> 智能体成本降低 75%。https://example.com/source" }; } } });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes("75%"));
  assert.ok(!calls[0].includes("final tweet"));
  assert.ok(result.text.includes("最后一条推文完整保留"));
});

test("a fresh Title Case headline is repaired in isolation before publication", async () => {
  const source = SOURCE + "\n\n- **Upcoming Product Release And Pricing** — https://example.com/video";
  const first = CHINESE + "\n\n- **Upcoming Product Release And Pricing** — https://example.com/video";
  const calls = [];
  const result = await prepareChineseDigest({ source, translator: { translate: async (input) => {
    calls.push(input);
    return { text: calls.length === 1 ? first : "- **即将发布的产品与定价** — https://example.com/video" };
  } } });
  assert.equal(calls.length, 2);
  assert.ok(!calls[1].includes("final tweet"));
  assert.ok(result.text.includes("即将发布的产品与定价"));
});

test("Chinese prose next to an exact source URL gets a boundary without retranslation", async () => {
  const source = "# AI Builders Digest — 2026-10-12\n\n> That's my repo https://t.co/2rdleyR8Rl which has 40+ categories.";
  const translated = "# AI 构建者日报 — 2026-10-12\n\n> 这是我的代码库 https://t.co/2rdleyR8Rl，其中有 40+ 个类别。";
  let calls = 0;
  const result = await prepareChineseDigest({ source, translator: { translate: async () => { calls++; return { text: translated }; } } });
  assert.equal(calls, 1);
  assert.ok(result.text.includes("https://t.co/2rdleyR8Rl ，其中有 40+"));
  assert.ok(result.receipt.linksVerified);
  assert.equal(protectedSignature(source), protectedSignature(`# ${result.title}\n\n${result.text}`));
});

test("source URL boundary repair preserves code and still rejects changed URLs and numeric claims", async () => {
  const source = SOURCE + "\n\n> My repository https://example.com/source has 40+ categories.";
  const chinese = CHINESE + "\n\n> 我的代码库 https://example.com/source，其中有 40+ 个类别。";
  const code = "`https://example.com/source，原样代码`";
  assert.equal(normalizeDigestChinese(code, source), code);
  for (const changed of [chinese.replace("https://example.com/source，其中", "https://example.com/source?changed=1，其中"), chinese.replace("40+", "41+")]) {
    await assert.rejects(prepareChineseDigest({ source, translator: { translate: async () => ({ text: changed }) } }), /不能发布/);
  }
});

test("missing final items, altered numbers and unconverted headlines prevent publication", async (t) => {
  const root = temporary(t);
  const file = path.join(root, "daily.md");
  fs.writeFileSync(file, "原有中文日报。");
  for (const text of [CHINESE.replace("@builder", ""), CHINESE.replace(/\n\n> 最后一条[^]*$/, ""), CHINESE.replace("75%", "70%"), CHINESE + "\n- **Upcoming Product Release And Pricing**"]) {
    await assert.rejects(publishChineseDigest({ source: SOURCE, files: [file], translator: { translate: async () => ({ text }) } }), /不能发布/);
    assert.equal(fs.readFileSync(file, "utf8"), "原有中文日报。");
  }
});

test("concurrent document edits are preserved even after translation finishes", async (t) => {
  const root = temporary(t), file = path.join(root, "daily.md");
  fs.writeFileSync(file, "原有日报。");
  await assert.rejects(publishChineseDigest({ source: SOURCE, files: [file], translator: { translate: async () => {
    fs.writeFileSync(file, "用户刚修改了日报。"); return { text: CHINESE };
  } } }), /源文件已变化/);
  assert.equal(fs.readFileSync(file, "utf8"), "用户刚修改了日报。");
});

test("source tampering and path traversal cannot be silently accepted", async (t) => {
  const root = temporary(t), file = path.join(root, "daily.md");
  await publishChineseDigest({ source: SOURCE, files: [file], translator: { translate: async () => ({ text: CHINESE }) } });
  const saved = fs.readFileSync(file, "utf8");
  fs.writeFileSync(path.join(root, ".sources", `${sha256(SOURCE)}.md`), "截断了的原文");
  assert.throws(() => readDigestSource(saved, file), /哈希不一致/);
  assert.throws(() => readDigestSource(`<!-- domi:digest:source ${JSON.stringify({ file: "../../outside.md", sha256: sha256(SOURCE) })} -->`, file), /引用无效/);
});

test("Domi draft is published only after successful translation; failure retains the draft and old edition", async (t) => {
  const root = temporary(t), dir = path.join(root, "13.认知库", "订阅日报");
  const draft = path.join(dir, ".drafts", "2026-10-09.md"), target = path.join(dir, "2026-10-09.md");
  fs.mkdirSync(path.dirname(draft), { recursive: true }); fs.writeFileSync(draft, SOURCE); fs.writeFileSync(target, "原有中文日报。");
  await assert.rejects(finalizeSubscriptionDigest({ libraryRoot: root, day: "2026-10-09", translator: { translate: async () => { throw new Error("usage limit"); } } }), /usage limit/);
  assert.equal(fs.readFileSync(draft, "utf8"), SOURCE);
  assert.equal(fs.readFileSync(target, "utf8"), "原有中文日报。");
  const result = await finalizeSubscriptionDigest({ libraryRoot: root, day: "2026-10-09", translator: { translate: async () => ({ text: CHINESE }) } });
  assert.ok(result.ok);
  assert.equal(readDigestSource(fs.readFileSync(target, "utf8"), target), SOURCE);
  await assert.rejects(finalizeSubscriptionDigest({ libraryRoot: root, day: "../outside", translator: {} }), /日期无效/);
});

test("Windows runner preserves failed pending jobs and uses the standard Luna publisher before copying any English", async (t) => {
  const { publishDigest } = await import(pathToFileURL(path.resolve(__dirname, "follow-builders-runner.mjs")).href);
  const root = temporary(t), outputs = [path.join(root, "digests"), path.join(root, "library")];
  fs.writeFileSync(path.join(root, "config.json"), JSON.stringify({ language: "zh" }));
  const options = { userDir: root, projectDir: path.resolve(__dirname, ".."), digestDir: outputs[0], mirrorDir: outputs[1] };
  await assert.rejects(publishDigest(SOURCE, "2026-10-09", { ...options, publisher: async () => { throw new Error("额度不可用"); } }), /额度不可用/);
  assert.ok(fs.existsSync(path.join(root, ".pending-digests", "2026-10-09.md")));
  assert.ok(!fs.existsSync(outputs[0])); assert.ok(!fs.existsSync(outputs[1]));
  await publishDigest(SOURCE, "2026-10-09", { ...options, publisher: async (runtime, args, settings) => {
    assert.ok(runtime.endsWith("electron.exe")); assert.equal(settings.windowsHide, true);
    const job = JSON.parse(fs.readFileSync(args[1], "utf8"));
    const result = await publishChineseDigest({ source: fs.readFileSync(job.input, "utf8").trim(), files: job.outputs,
      translator: { translate: async () => ({ text: CHINESE }) } });
    assert.equal(result.receipt.model, "gpt-6-luna"); assert.equal(result.receipt.reasoningEffort, "medium"); assert.equal(result.receipt.serviceTier, "standard");
    return { stdout: JSON.stringify({ phase: "published", ...result }) };
  } });
  assert.ok(!fs.existsSync(path.join(root, ".pending-digests", "2026-10-09.md")));
  for (const dir of outputs) assert.ok(!fs.readFileSync(path.join(dir, "AI-Builders-Digest-2026-10-09.md"), "utf8").includes("The agent"));
});

test("an older broken digest cannot suppress another pending day or new video discovery", async (t) => {
  const { resumePendingDigests, discoverDailyWork } = await import(pathToFileURL(path.resolve(__dirname, "follow-builders-runner.mjs")).href);
  const root = temporary(t), calls = [], queued = [];
  fs.writeFileSync(path.join(root, "2026-10-11.md"), "未完成的旧日报。");
  fs.writeFileSync(path.join(root, "2026-10-12.md"), "今天的完整原文。");
  const collected = { snapshotMode: false, results: [{ videos: [{ videoId: "abcdefghijk" }] }] };
  const result = await discoverDailyWork({
    resumeDigests: () => resumePendingDigests({ pendingDir: root, logger: () => {}, publisher: async (_, day) => {
      calls.push(day); if (day === "2026-10-11") throw new Error("旧日报译文未通过校验");
    } }),
    collectSources: async () => ({ collected }), queueVideos: async (value) => queued.push(value)
  });
  assert.deepEqual(calls, ["2026-10-11", "2026-10-12"]);
  assert.deepEqual(result.pendingDigests, { failedDays: ["2026-10-11"], resumedDays: ["2026-10-12"] });
  assert.deepEqual(queued, [collected]);
  assert.equal(fs.readFileSync(path.join(root, "2026-10-11.md"), "utf8"), "未完成的旧日报。");
});

test("Windows raw digest keeps every biography and blog description before translating", async () => {
  const { buildDigest } = await import(pathToFileURL(path.resolve(__dirname, "follow-builders-runner.mjs")).href);
  const biography = "Role and company. ".repeat(30) + "Final biography detail.";
  const description = "Full blog description. ".repeat(30) + "Final blog detail.";
  const digest = buildDigest({ x: [{ name: "Builder", handle: "builder", bio: biography, tweets: [{ text: "Final tweet.", url: "https://example.com/tweet" }] }] },
    { podcasts: [{ name: "Show", title: "Episode", url: "https://example.com/podcast", transcript: "Transcript excerpt." }] },
    { blogs: [{ title: "Blog title", url: "https://example.com/blog", description }] }, "2026-10-09", { results: [] });
  assert.ok(digest.markdown.includes(biography)); assert.ok(digest.markdown.includes(description));
  assert.ok(digest.markdown.startsWith("# AI 构建者日报"));
});

test("seen video state advances only after durable queuing even if the report is pending", async () => {
  const { discoverDailyWork } = await import(pathToFileURL(path.resolve(__dirname, "follow-builders-runner.mjs")).href);
  const collected = { snapshotMode: false, seenVideos: { abcdefghijk: 1 }, results: [] }, calls = [];
  const options = { resumeDigests: async () => ({ resumedDays: [], failedDays: ["2026-10-12"] }),
    collectSources: async () => ({ collected }), saveSeen: async (seen) => { calls.push("seen"); assert.deepEqual(seen, collected.seenVideos); } };
  await discoverDailyWork({ ...options, queueVideos: async () => { calls.push("queue"); } });
  assert.deepEqual(calls, ["queue", "seen"]);
  calls.length = 0;
  await assert.rejects(discoverDailyWork({ ...options, queueVideos: async () => { throw new Error("队列写入失败"); } }), /队列写入失败/);
  assert.deepEqual(calls, []);
});
