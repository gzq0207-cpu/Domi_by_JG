const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { ChineseTranslator, protectText, restoreText, needsChineseTranslation, sha256, translationSection, readTranslationSection, hasEnglishProse, isPreservedCaptionName } = require("../electron/chinese-translation.cjs");
const { sourceBody, KnowledgeTranslationService } = require("../electron/knowledge-translation.cjs");
const { DomiRepository } = require("../build/domi-plugin/scripts/domi-repo.cjs");
const { readDigestSource } = require("../electron/subscription-digest.cjs");

async function removeCacheRoot(root) {
  const resolved = path.resolve(root);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.match(path.basename(resolved), /^domi-translation-[A-Za-z\d]+$/);
  await fs.promises.rm(resolved, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 });
}

function cache(t, cleanup = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-translation-"));
  if (cleanup) t.after(() => removeCacheRoot(root));
  return root;
}
const fakeBatch = async (blocks) => blocks.map((b) => ({ id: b.id, text: "完整中文译文：" + b.text.split(/(⟪保留[^⟫]+⟫)/).map((p) => p.startsWith("⟪保留") ? p : p.replace(/[A-Za-z][A-Za-z'-]*/g, "文字")).join("") }));

test("short video captions keep timestamps outside model output just like long transcripts",async t=>{
  const translator=new ChineseTranslator({cacheRoot:cache(t),translateBatch:async blocks=>{
    assert.ok(blocks.every(block=>!block.text.includes("[0:01]")&&!block.text.includes("[0:07]")));
    return fakeBatch(blocks);
  }});t.after(()=>translator.close());
  const result=await translator.translate("# Full transcript\n\n[0:01] The first complete sentence.\n[0:07] The last complete sentence.");
  assert.equal(result.receipt.captionRowsVerified,2);assert.equal(result.receipt.captionTimestampsManagedByProgram,true);
  assert.deepEqual(result.text.match(/^\[.*?\]/gm),["[0:01]","[0:07]"]);
});

test("timed-out translation batches shrink immediately and preserve every row and cached resume", async (t) => {
  const root = cache(t), calls = [], progress = [];
  const translator = new ChineseTranslator({ cacheRoot: root, translateBatch: async (blocks) => {
    calls.push(blocks.length);
    if (blocks.length > 2) throw new Error("单段翻译超时，已完成段落保留，可重试。");
    return fakeBatch(blocks);
  } });
  t.after(() => translator.close());
  const source = Array.from({length:37}, (_, i) => `The complete original sentence contains number ${i}.`).join("\n\n");
  const result = await translator.translate(source, {onProgress: p => progress.push(p)});
  assert.deepEqual(calls.slice(0, 4), [36, 8, 4, 2]);
  assert.equal(result.receipt.complete, true);
  assert.equal(result.text.match(/完整中文译文/g).length, 37);
  assert.deepEqual(result.text.match(/\d+/g), source.match(/\d+/g));
  assert.ok(progress.some(p => p.retryReason === "timeout" && p.retryBatchSize === 8));
  const before = calls.length;
  assert.equal((await translator.translate(source)).text, result.text);
  assert.equal(calls.length, before);
});

test("English prose and headings qualify, company names in Chinese and code do not", () => {
  for (const text of ["The service is now available.", "## Conclusion", "Full Transcript", "GPU remains useful for 3 years.", "普通词 capability 应译成中文。", "这是 public cloud。", "视频在 3d ago 发布。", "actually", ">> Mhm.", "[music]", "companies.", ">> Yep.", "Law.", "Fascinating.", "I'm"]) assert.equal(needsChineseTranslation(text), true);
  for (const text of ["OpenAI 发布 GPT-6 Sol 和 GPT-6 Luna。", "`SELECT title FROM news_events;`", "https://example.com/a-long-English-url"]) assert.equal(needsChineseTranslation(text), false);
});

test("different paragraphs use distinct numeric markers and old verified caches remain readable", async (t) => {
  const first = protectText("It costs 75."), second = protectText("We delivered 75 chips.");
  assert.notEqual(first.values[0].key, second.values[0].key);
  const root = cache(t), source = "It costs 75.";
  const old = protectText(source, undefined, false), cachedText = restoreText("费用为" + old.values[0].key + "。", old);
  const file = path.join(root, sha256(JSON.stringify({version:1,model:"gpt-6-luna",reasoningEffort:"medium",serviceTier:"standard",source})) + ".json");
  fs.writeFileSync(file, JSON.stringify({protectionVersion:3,sourceSha256:sha256(source),translationSha256:sha256(cachedText),protectedText:"费用为"+old.values[0].key+"。",text:cachedText}));
  const translator = new ChineseTranslator({cacheRoot:root,translateBatch:()=>assert.fail("校验通过的旧缓存不能重复翻译")});
  assert.equal((await translator.translate(source)).text,cachedText);
});

test("numeric values, timestamps, code, URLs and speaker labels cannot be dropped or repeated", () => {
  const source = "[00:01:12.500] SPEAKER_UNKNOWN: It costs 75, versus 99. Visit https://example.com/report and `vllm serve`.";
  const protectedSource = protectText(source);
  assert.equal(restoreText("中文：" + protectedSource.text, protectedSource), "中文：" + source);
  const key = protectedSource.values[0].key;
  assert.throws(() => restoreText("中文：" + protectedSource.text.replace(key, ""), protectedSource), /缺少/);
  assert.throws(() => restoreText("中文：" + protectedSource.text + key, protectedSource), /重复/);
  for (const label of ["Claude Opus 5.5: https://example.com/model", "## 5.1 HealthBench", "Tim Scarfe"]) {
    const protectedLabel = protectText(label);
    assert.equal(restoreText(protectedLabel.text, protectedLabel), label);
  }
  assert.throws(() => restoreText("## Conclusion", protectText("## Conclusion")), /仍是英文/);
  const contact = "联系：[contact@example.com](mailto:contact@example.com)";
  const protectedContact = protectText(contact);
  assert.equal(protectedContact.values.length, 2);
  assert.equal(restoreText(protectedContact.text, protectedContact), contact);
  assert.equal(hasEnglishProse(contact), false);
});

test("literal filenames stay intact without model calls while surrounding prose still requires translation", async (t) => {
  for (const filename of ["MXC.exe", "worker.cjs", "report.csv", "AGENTS.md", "config.yaml", "MODEL.EXE"]) {
    assert.equal(needsChineseTranslation(`> ${filename}`), false);
    const protectedSource = protectText(`> ${filename}`);
    assert.deepEqual(protectedSource.values.map(({value}) => value), [filename]);
    assert.equal(restoreText(protectedSource.text, protectedSource), `> ${filename}`);
    assert.throws(() => restoreText("> 中文", protectedSource), /缺少/);
  }
  const translator = new ChineseTranslator({cacheRoot: cache(t), translateBatch: async () => assert.fail("文件名无需付费翻译")});
  assert.equal((await translator.translate("> MXC.exe")).text, "> MXC.exe");
  translator.close();
  const source = protectText("The program MXC.exe runs on Windows.");
  assert.equal(needsChineseTranslation("The program MXC.exe runs on Windows."), true);
  assert.throws(() => restoreText(source.text, source), /仍是英文/);
  assert.equal(restoreText(`程序 ${source.values[0].key} 在 Windows 上运行。`, source), "程序 MXC.exe 在 Windows 上运行。");
});

test("lowercase architecture identifiers stay whole and valid previous numeric caches remain readable", async (t) => {
  const protectedSource = protectText("the x86?");
  assert.deepEqual(protectedSource.values.map(x => x.value), ["x86"]);
  assert.equal(restoreText("这个" + protectedSource.values[0].key + "架构？", protectedSource), "这个x86架构？");
  assert.equal(restoreText(protectedSource.values[0].key + "？", protectedSource), "x86？");
  assert.throws(() => restoreText("？", protectedSource), /缺少/);
  assert.throws(() => restoreText(protectText("the 75?").values[0].key + "？", protectText("the 75?")), /仍是英文/);
  assert.throws(() => restoreText(protectText("the x86 performance?").values[0].key + "？", protectText("the x86 performance?")), /仍是英文/);
  assert.deepEqual(protectText("x86-64, aarch64, arm64, riscv64").values.map(x => x.value), ["x86-64", "aarch64", "arm64", "riscv64"]);
  const root = cache(t), source = "We use x86.", text = "我们使用x86。";
  const old = protectText(source, /\d+/g), key = sha256(JSON.stringify({version:1,model:"gpt-6-luna",reasoningEffort:"medium",serviceTier:"standard",source}));
  fs.writeFileSync(path.join(root,key+'.json'),JSON.stringify({protectionVersion:5,sourceSha256:sha256(source),translationSha256:sha256(text),text,protectedText:"我们使用x"+old.values[0].key+"。"}));
  const translator = new ChineseTranslator({cacheRoot:root,translateBatch:()=>assert.fail("unchanged old architecture translations must be reused")});
  assert.equal((await translator.translate(source)).text,text);translator.close();
});

test("every paragraph and the end of a long transcript survive chunking and cached resume", async (t) => {
  const root = cache(t);
  let calls = 0;
  const translator = new ChineseTranslator({ cacheRoot: root, translateBatch: async (blocks) => { calls++; return fakeBatch(blocks); } });
  const source = Array.from({ length: 90 }, (_, i) => `[00:${i}:00] The original sentence is repeated for block ${i}.`).join("\n\n") + "\n\n这段中文保留。";
  const first = await translator.translate(source);
  assert.equal(first.receipt.complete, true);
  assert.equal(first.text.match(/完整中文译文/g).length, 90);
  assert.ok(first.text.includes("89."));
  assert.ok(first.text.endsWith("这段中文保留。"));
  const before = calls;
  const second = await translator.translate(source);
  assert.equal(calls, before);
  assert.equal(second.text, first.text);
  assert.equal(second.receipt.sourceSha256, sha256(source));
});

test("a definite article before an unchanged company name may disappear without losing protected model values", () => {
  const source = protectText("the DeepSeek V4.1");
  assert.equal(restoreText(source.text.replace(/^the /, ""), source), "DeepSeek V4.1");
  assert.throws(() => restoreText("DeepSeek", source), /缺少/);
  assert.throws(() => restoreText("DeepMind " + source.values[0].key, source), /仍是英文/);
  assert.throws(() => restoreText("first", protectText("the first")), /仍是英文/);
});

test("company lists retain plain brand domains and previous caches without bypassing ordinary English checks", async (t) => {
  const original = "SpaceXAI, MiniMax, Moonshot, Z.ai,";
  const protectedSource = protectText(original);
  assert.equal(protectedSource.values.some(v=>v.value==='Z.ai'),true);
  assert.equal(restoreText(protectedSource.text,protectedSource),original);
  assert.equal(isPreservedCaptionName('SpaceXAI、MiniMax、Moonshot、Z.ai。',original,'SpaceXAI；MiniMax；Moonshot；Z.ai'),true);
  assert.equal(isPreservedCaptionName('SpaceXAI、MiniMax、Logic。','SpaceXAI, MiniMax, Logic.','SpaceXAI；MiniMax；Moonshot'),false);
  const root=cache(t),source='The Z.ai models.',text='这些 Z.ai 模型。';
  const key=sha256(JSON.stringify({version:1,model:'gpt-6-luna',reasoningEffort:'medium',serviceTier:'standard',source}));
  fs.writeFileSync(path.join(root,key+'.json'),JSON.stringify({protectionVersion:4,sourceSha256:sha256(source),translationSha256:sha256(text),text,protectedText:text}));
  const translator=new ChineseTranslator({cacheRoot:root,translateBatch:()=>assert.fail('valid previous cache must be reused')});
  assert.equal((await translator.translate(source)).text,text);translator.close();
});

test("only confirmed unchanged company or product names can remain as standalone caption rows", async (t) => {
  assert.equal(isPreservedCaptionName("Wispr Flow。", "Wispr Flow.", "OpenAI、Wispr Flow、Google"), true);
  assert.equal(isPreservedCaptionName("Artificial Intelligence", "Artificial Intelligence", "Wispr Flow"), false);
  assert.equal(isPreservedCaptionName("Wispr Flow", "Google Assistant", "Wispr Flow、Google Assistant"), false);
  assert.equal(isPreservedCaptionName("Qualcomm AI 100。", "Qualcomm AI 100.", "Nvidia；Qualcomm；Meta"), true);
  assert.equal(isPreservedCaptionName("Qualcomm AI 200", "Qualcomm AI 100", "Qualcomm"), false);
  assert.equal(isPreservedCaptionName("Qualcomm AI software", "Qualcomm AI software", "Qualcomm"), false);
  assert.equal(isPreservedCaptionName('5.6 Cyber、Astra 6 Cyber，','5.6 Cyber, Astra 6 Cyber,','OpenAI','原文提及 GPT-5.6 Cyber、Astra 6 Cyber。'),true);
  assert.equal(isPreservedCaptionName('Astra 7 Cyber','Astra 6 Cyber','OpenAI','Astra 7 Cyber'),false);
  assert.equal(isPreservedCaptionName('Artificial Intelligence 6','Artificial Intelligence 6','OpenAI',''),false);
  const translator = new ChineseTranslator({cacheRoot:cache(t),translateBatch:async(blocks)=>blocks.map(b=>({id:b.id,text:b.text==='Wispr Flow.'?'Wispr Flow。':'这是完整中文。'}))});
  const source = "# 中文标题\n\n" + Array.from({length:20},(_,i)=>`[0:${String(i).padStart(2,'0')}] ${i===19?'Wispr Flow.':'This must be fully translated.'}`).join('\n');
  await assert.rejects(translator.translate(source), /未翻译.*0:19/);
  const result = await translator.translate(source,{properNames:'Wispr Flow'});
  assert.equal(result.receipt.captionRowsVerified,20); assert.ok(result.text.endsWith('[0:19] Wispr Flow。')); translator.close();
});

test("missing/reordered paragraphs fail instead of claiming a complete translation", async (t) => {
  for (const bad of [[], [{ id: "wrong", text: "一段中文" }]]) {
    const translator = new ChineseTranslator({ cacheRoot: cache(t), translateBatch: async () => bad });
    await assert.rejects(translator.translate("The full original must be preserved."), /缺少|标识/);
  }
});

test("browser caption rows retain every timestamp outside model output and reuse cached row translations", async (t) => {
  let calls = 0;
  const translator = new ChineseTranslator({ cacheRoot: cache(t), translateBatch: async (blocks) => {
    calls++; assert.ok(blocks.every((block) => !/\[\d+:/.test(block.text))); return fakeBatch(blocks);
  } });
  const source = "# 原文\n\n" + Array.from({ length: 45 }, (_, i) => `[${Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}] The device costs 75 and this is sentence ${i}.`).join("\n") + "\n\n> 原文字幕。";
  const result = await translator.translate(source);
  assert.deepEqual(result.text.match(/^\[\d+:\d{2}\]/gm), source.match(/^\[\d+:\d{2}\]/gm));
  assert.equal(result.receipt.captionRowsVerified, 45); assert.equal(result.receipt.sourceSha256, sha256(source));
  assert.equal(result.receipt.translationSha256, sha256(result.text));
  const before = calls; assert.equal((await translator.translate(source)).text, result.text); assert.equal(calls, before);
});

test("untranslated caption fragments are repaired without changing URLs, values or timestamps and reuse the repair cache", async (t) => {
  let calls = 0;
  const root = cache(t);
  const translator = new ChineseTranslator({ cacheRoot: root, translateBatch: async (blocks) => {
    calls++;
    return blocks.map((block) => {
      if (block.id.startsWith("caption_")) return { id: block.id, text: "原始转写不清：`AI/ Peepers`；资料链接：" + (block.text.match(/⟪保留[^⟫]+⟫/g) || []).join(" ") };
      if (block.text.includes("Peepers")) return { id: block.id, text: block.text };
      return { id: block.id, text: "完整中文译文。" };
    });
  } });
  const source = Array.from({ length: 20 }, (_, i) => `[0:${String(i).padStart(2, "0")}] ${i === 19 ? "lambda.ai/papers. AI/ Peepers" : "The full original sentence."}`).join("\n");
  const result = await translator.translate(source);
  assert.equal(result.receipt.captionRowsVerified, 20);
  assert.equal(result.receipt.captionRepairedRows, 1);
  assert.ok(result.text.includes("[0:19] 原始转写不清"));
  assert.equal(result.text.match(/lambda\.ai\/papers\./g).length, 1);
  assert.deepEqual(result.text.match(/^\[\d+:\d{2}\]/gm), source.match(/^\[\d+:\d{2}\]/gm));
  const before = calls;
  assert.equal((await translator.translate(source)).text, result.text);
  assert.equal(calls, before);
  translator.close();
});

test("modified cache content is rejected and translated again", async (t) => {
  const root = cache(t);
  let calls = 0;
  const translator = new ChineseTranslator({ cacheRoot: root, translateBatch: async (b) => { calls++; return fakeBatch(b); } });
  const source = "Every original sentence should be translated.";
  await translator.translate(source);
  const file = path.join(root, fs.readdirSync(root)[0]);
  const corrupt = JSON.parse(fs.readFileSync(file)); corrupt.text = "被截断。";
  fs.writeFileSync(file, JSON.stringify(corrupt));
  await translator.translate(source);
  assert.equal(calls, 2);
});

test("a failed numeric paragraph is retried alone without discarding the other valid paragraphs", async (t) => {
  const calls = [];
  const translator = new ChineseTranslator({ cacheRoot: cache(t), translateBatch: async (blocks) => {
    calls.push(blocks.map((b) => b.id));
    const result = await fakeBatch(blocks);
    if (calls.length === 1) result[0].text = result[0].text.replace(/⟪保留[^⟫]+⟫/, "");
    return result;
  } });
  const result = await translator.translate("The first price is 75.\n\nThe second price is 99.");
  assert.equal(result.receipt.complete, true);
  assert.deepEqual(calls.map((b) => b.length), [2, 1]);
  assert.ok(result.text.includes("75"));
  assert.ok(result.text.includes("99"));
});

test("repeated model omission falls back to deterministic numeric placement", async (t) => {
  const translator = new ChineseTranslator({ cacheRoot: cache(t), translateBatch: async (blocks) => {
    if (blocks[0].id.startsWith("f")) return fakeBatch(blocks);
    return (await fakeBatch(blocks)).map((r) => ({ ...r, text: r.text.replace(/⟪保留[^⟫]+⟫/, "") }));
  } });
  const result = await translator.translate("The service costs 75 dollars and then rises to 99 dollars.");
  assert.equal(result.receipt.complete, true);
  assert.deepEqual(result.text.match(/\d+/g), ["75", "99"]);
});

test("ordinary English quotations in otherwise Chinese output are repaired before completion", async (t) => {
  assert.equal(hasEnglishProse("判断并非 not so obvious，需补证据。"), true);
  assert.equal(hasEnglishProse("使用 public cloud。"), true);
  assert.equal(hasEnglishProse("来自 Chips and Cheese、Bank of America。"), false);
  assert.equal(hasEnglishProse("埃里克·冯·希佩尔（Eric von Hippel）。"), false);
  assert.equal(hasEnglishProse("来自 Claude in Chrome。Intel i 7 处理器。"), false);
  assert.equal(hasEnglishProse("采用 Gödel machines。"), true);
  let calls = 0;
  const translator = new ChineseTranslator({ cacheRoot: cache(t), translateBatch: async (blocks) => {
    calls++;
    if (calls === 1) return blocks.map((b) => ({ id: b.id, text: "这段话说：No one ever got fired for buying IBM.\n" + (b.text.match(/⟪保留[^⟫]+⟫/g) || []).join(" ") }));
    return fakeBatch(blocks);
  } });
  const result = await translator.translate("[00:01:20] No one ever got fired for buying IBM.");
  assert.equal(calls, 2);
  assert.equal(hasEnglishProse(result.text), false);
  assert.ok(result.text.includes("00:01:20"));
  assert.equal(result.receipt.englishProseChecked, true);
  assert.equal(result.receipt.timestampOrderVerified, true);
});

test("a multiline code block embedded in a Chinese transcript stays byte for byte intact", async (t) => {
  const code = '```yaml\ndomi_schema: 6\nentity_type: "news_event"\ntitle: "English title inside machine metadata"\n```';
  const source = "这里是原始资料，必须保留全部文本。\n" + code + "\n这部分介绍 public cloud，请将英文术语译为中文。";
  const translator = new ChineseTranslator({ cacheRoot: cache(t), translateBatch: fakeBatch });
  const result = await translator.translate(source);
  assert.ok(result.text.includes(code));
  assert.equal(result.receipt.complete, true);
  assert.equal(hasEnglishProse(result.text), false);
  assert.equal(result.receipt.sourceSha256, sha256(source));
});

test("CRLF correction batches only the untranslated paragraphs and keeps every timestamp in order", async (t) => {
  let calls = 0;
  const sizes = [];
  const translator = new ChineseTranslator({ cacheRoot: cache(t), translateBatch: async (blocks) => {
    calls++; sizes.push(blocks.length);
    if (calls === 1) return blocks.map((b) => ({ id: b.id, text: b.text.replace(/The original sentence is translated\./g, "这是中文，仍包含 public cloud。") }));
    return fakeBatch(blocks);
  } });
  const source = Array.from({ length: 12 }, (_, i) => `[00:00:${String(i).padStart(2, "0")}] The original sentence is translated.`).join("\r\n\r\n");
  const result = await translator.translate(source);
  assert.equal(result.receipt.complete, true);
  assert.equal(result.receipt.timestampValues, 12);
  assert.equal(hasEnglishProse(result.text), false);
  assert.ok(!result.text.includes("译文补查_"));
  assert.equal(calls, 2);
  assert.equal(sizes[1], 12);
});

test("persistent untranslated English prose cannot be marked complete", async (t) => {
  const translator = new ChineseTranslator({ cacheRoot: cache(t), translateBatch: async (blocks) => blocks.map((b) => ({ id: b.id, text: "中文说明：this ordinary quote remains untranslated." })) });
  await assert.rejects(translator.translate("This ordinary quote remains untranslated."), /未翻译的英文语句/);
});

test("usage exhaustion stops retries immediately and a resumed scan keeps the queued originals", async (t) => {
  const root = cache(t);
  let calls = 0, exhausted = true;
  const translator = new ChineseTranslator({ cacheRoot: path.join(root, ".cache"), translateBatch: async (blocks) => {
    calls++;
    if (exhausted) throw new Error("You’ve hit your usage limit.");
    return fakeBatch(blocks);
  } });
  await assert.rejects(translator.translate("The full transcript must remain available."), /usage limit/);
  assert.equal(calls, 1);
  for (let i = 0; i < 4; i++) fs.writeFileSync(path.join(root, `${i}.md`), "# Old note\n\nEvery original sentence should remain unchanged.");
  const service = new KnowledgeTranslationService({ settingsProvider: () => ({ storageBackend: "local", localRepositoryDir: root }), stateRoot: path.join(root, ".state"), translator });
  const first = await service.runOnce();
  assert.equal(first.failed.length, 2);
  assert.equal(first.pending, 2);
  assert.equal(calls, 3);
  assert.equal((await service.runOnce()).reason, "usage-limit");
  assert.equal(calls, 3);
  for (let i = 0; i < 4; i++) assert.ok(fs.readFileSync(path.join(root, `${i}.md`), "utf8").endsWith("Every original sentence should remain unchanged."));
  exhausted = false;
  const resumed = await service.runOnce({ force: true });
  assert.equal(resumed.translated, 4, JSON.stringify(resumed.failed));
  assert.deepEqual(resumed.failed, []);
  assert.equal(service.state.pause, undefined);
  service.close();
});

test("ephemeral model threads are released after both successful and failed batches", async (t) => {
  for (const fail of [false, true]) {
    const translator = new ChineseTranslator({ cacheRoot: cache(t) });
    translator.modelChecked = true;
    const released = [];
    translator.client = { close() {}, request: async (method, params) => {
      if (method === "thread/start") return { thread: { id: "ephemeral-translation" } };
      if (method === "thread/unsubscribe") { released.push(params.threadId); return { status: "unsubscribed" }; }
      if (method === "turn/start") {
        if (fail) throw new Error("Turn failed.");
        const pending = translator.pending.get(params.threadId);
        clearTimeout(pending.timer); translator.pending.delete(params.threadId);
        pending.resolve(JSON.stringify({ blocks: [{ id: "b0", text: "完整中文。" }] }));
        return { turn: { id: "turn-1" } };
      }
    } };
    if (fail) await assert.rejects(translator.requestBatch([{ id: "b0", text: "English source." }]), /Turn failed/);
    else assert.equal((await translator.requestBatch([{ id: "b0", text: "English source." }]))[0].text, "完整中文。");
    assert.deepEqual(released, ["ephemeral-translation"]);
    assert.equal(translator.pending.size, 0);
    translator.close();
  }
});

test("Chinese full text is stored before the exact original, remains idempotent, and invalidates when source changes", (t) => {
  const root = cache(t, false);
  const repository = new DomiRepository({ backend: "local", libraryDir: path.join(root, "library"), databasePath: path.join(root, "repo.db") });
  t.after(async () => { repository.close(); await removeCacheRoot(root); });
  const original = "The first and final sentences must remain unchanged.";
  const content = "第一句与最后一句必须保持原样。";
  const receipt = { complete: true, model: "gpt-6-luna", reasoningEffort: "medium", serviceTier: "standard", sourceSha256: sha256(original), translationSha256: sha256(content) };
  const payload = { eventId: "art_translation", articleType: "article", title: "An English Knowledge Article", originalContent: original, translationContent: content, translationReceipt: receipt };
  const first = repository.upsertNews(payload);
  assert.equal(first.storageReceipt.originalContentVerified, true);
  assert.equal(first.storageReceipt.translationVerified, true);
  const second = repository.upsertNews({ ...payload, title: "一篇中文知识文章" });
  assert.equal(second.event.documentPath, first.event.documentPath);
  const saved = fs.readFileSync(second.event.documentPath, "utf8");
  assert.equal(saved.match(/## 中文全文/g).length, 1);
  assert.ok(saved.indexOf("## 中文全文") < saved.indexOf("## 原文存档"));
  assert.ok(saved.trimEnd().endsWith(original));
  assert.equal(sourceBody(saved, true), original);
  assert.equal(readTranslationSection(saved).receipt.sourceSha256, sha256(original));
  const { translationContent, translationReceipt, ...withoutTranslation } = payload;
  const third = repository.upsertNews({ ...withoutTranslation, originalContent: original + " A new sentence." });
  assert.equal(third.storageReceipt.translationInvalidated, true);
  assert.equal(readTranslationSection(fs.readFileSync(third.event.documentPath, "utf8")), null);
  assert.throws(() => repository.upsertNews({ ...payload, translationReceipt: { ...receipt, sourceSha256: "wrong" } }), /哈希/);
});

test("source boundary and receipt parsing never substitute the Chinese translation for the raw source", () => {
  assert.throws(() => sourceBody("# Original\n\nNo archive metadata."), /边界/);
  const original = "This is the entire English source.";
  const section = translationSection("这是完整中文。", { complete: true, sourceSha256: sha256(original) });
  const markdown = "<!-- domi:managed:end -->\n" + section + "\n## 原文存档\n\n- 归档时间：2026-10-08\n\n---\n\n" + original;
  assert.equal(sourceBody(markdown, true), original);
});

test("background scan translates both historical articles and digests, preserves originals and is idempotent", async (t) => {
  const root = cache(t, false);
  const library = path.join(root, "library");
  const dbPath = path.join(root, "repo.db");
  const repository = new DomiRepository({ backend: "local", libraryDir: library, databasePath: dbPath });
  t.after(async () => { repository.close(); await removeCacheRoot(root); });
  const original = "Every original sentence should remain available for verification.";
  const first = repository.upsertNews({ eventId: "historical", articleType: "article", title: "Historical knowledge", originalContent: original, summary: "中文摘要。" });
  const digest = path.join(library, "13.认知库", "订阅日报", "old.md");
  fs.mkdirSync(path.dirname(digest), { recursive: true });
  const originalDigest = "# Historical digest\n\nEvery original tweet must be translated completely.";
  fs.writeFileSync(digest, originalDigest);
  let calls = 0;
  const translator = new ChineseTranslator({ cacheRoot: path.join(root, "cache"), translateBatch: async (b) => { calls++; return fakeBatch(b); } });
  const settings = { storageBackend: "local", localRepositoryDir: library, localDatabasePath: dbPath };
  const service = new KnowledgeTranslationService({ settingsProvider: () => settings, stateRoot: path.join(root, "state"), translator, writeNews: async (p) => repository.upsertNews(p) });
  const result = await service.runOnce();
  assert.equal(result.translated, 2);
  assert.deepEqual(result.failed, []);
  const saved = fs.readFileSync(first.event.documentPath, "utf8");
  assert.ok(readTranslationSection(saved).verified);
  assert.ok(saved.trimEnd().endsWith(original));
  assert.equal(readDigestSource(fs.readFileSync(digest, "utf8"), digest), originalDigest);
  assert.ok(!fs.readFileSync(digest, "utf8").includes("Every original tweet"));
  const before = calls;
  await service.runOnce();
  // A second scan reuses verified full text and field hashes.
  assert.equal(calls, before);
  assert.ok(fs.readdirSync(path.join(root, "state", "backups")).length >= 1);
  assert.ok(fs.readdirSync(path.join(path.dirname(digest), ".sources", ".backups")).length >= 1);
  service.close();
});

test("a document changed during translation is preserved without overwriting the user's edit", async (t) => {
  const root = cache(t);
  const file = path.join(root, "note.md");
  fs.writeFileSync(file, "# Full transcript\n\nThe original is written in English.");
  const translator = new ChineseTranslator({ cacheRoot: path.join(root, "cache"), translateBatch: async (b) => {
    fs.writeFileSync(file, "用户刚刚更新了正文。"); return fakeBatch(b);
  } });
  const service = new KnowledgeTranslationService({ settingsProvider: () => ({ storageBackend: "local", localRepositoryDir: root }), stateRoot: path.join(root, ".state"), translator });
  const result = await service.runOnce();
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0].error, /源文件已变化/);
  assert.equal(fs.readFileSync(file, "utf8"), "用户刚刚更新了正文。");
  service.close();
});

test("a transient Windows file lock is retried without discarding completed translation", async (t) => {
  const root = cache(t);
  let writes = 0;
  const service = new KnowledgeTranslationService({ settingsProvider: () => ({}), stateRoot: root,
    translator: { close() {} }, writeNews: async (payload) => {
      writes++;
      if (writes === 1) throw new Error("EPERM: operation not permitted, rename");
      return { event: { eventId: payload.eventId }, storageReceipt: { translationVerified: true } };
    } });
  const result = await service.archiveNews({ eventId: "windows-lock", translationContent: "已完成的中文全文。" });
  assert.equal(writes, 2);
  assert.equal(result.storageReceipt.translationVerified, true);
  service.close();
});
