const fs = require("node:fs");
const path = require("node:path");
const {
  TRANSLATION_VERSION, TRANSLATION_PREFERENCES, sha256, protectText,
  hasEnglishProse, translationSection, readTranslationSection
} = require("./chinese-translation.cjs");

const DIGEST_VERSION = 1;
const SOURCE_MARKER = /<!-- domi:digest:source (.+?) -->/;
const PARAGRAPHS = /(\r?\n[ \t]*\r?\n)/;
const CONTEXT = "AI 构建者日报全文翻译。每条推文、作者简介、视频标题、节目标题、播客摘录、博客简介、引用和提示词示例都必须用简体中文完整呈现，不摘要、不删条目。普通术语也译成中文，例如 agent=智能体、prompt=提示词、token=词元、feed=内容源、bug=缺陷。只保留人名、公司或产品正式名称、型号、账号、链接和可执行代码；书名、文章名及自然语言提示词不因首字母大写或加引号而保留英文。保留所有段落、日期、数字、账号和链接，不新增数字。";

function isSubscriptionDigest(file) {
  return /\.md$/i.test(file) && (/^AI-Builders-Digest-\d{4}-\d{2}-\d{2}\.md$/i.test(path.basename(file))
    || path.normalize(file).split(path.sep).includes("订阅日报"));
}

function digestDisplayTitle(markdown, file) {
  const heading = String(markdown || "").match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading && /[\u3400-\u9fff]/.test(heading)) return heading;
  const date = path.basename(file).match(/^AI-Builders-Digest-(\d{4}-\d{2}-\d{2})/i)?.[1];
  return date ? `AI 构建者日报 — ${date}` : path.basename(file, path.extname(file));
}

function readDigestSource(markdown, file) {
  const marker = String(markdown).match(SOURCE_MARKER);
  if (marker) {
    const reference = JSON.parse(marker[1]);
    if (!/^[a-f\d]{64}$/.test(reference.sha256) || reference.file !== `.sources/${reference.sha256}.md`) {
      throw new Error("日报原文引用无效，停止写回。");
    }
    const sourcePath = path.join(path.dirname(file), ".sources", `${reference.sha256}.md`);
    // Hidden originals must remain beside this digest, including after a move.
    if (fs.lstatSync(path.dirname(sourcePath)).isSymbolicLink() || fs.lstatSync(sourcePath).isSymbolicLink()) {
      throw new Error("日报原文目录不能使用符号链接。");
    }
    const source = fs.readFileSync(sourcePath, "utf8");
    if (sha256(source) !== reference.sha256) throw new Error("日报原文哈希不一致，停止写回。");
    return source;
  }
  const cached = readTranslationSection(markdown);
  if (cached) {
    const tail = String(markdown).slice(String(markdown).indexOf("<!-- domi:translation:end -->"));
    const original = tail.match(/\r?\n## 英文原文（保留核对）\r?\n([^]*)$/);
    if (!original) throw new Error("日报缺少可核对的原文，停止写回。");
    return original[1].trim();
  }
  return String(markdown).replace(/^---\r?\n[^]*?\r?\n---\r?\n/, "").trim();
}

function outsideProtected(text, transform) {
  const names = [];
  const input = String(text).replace(/\bfollow-builders\b|\bClaude Agent SDK\b|\bBox Agent\b|\bReplit Agent(?: \d+)?\b/g, (value) => {
    const marker = `〈日报专名_${names.length}〉`; names.push({ marker, value }); return marker;
  });
  const protectedSource = protectText(input);
  let output = transform(protectedSource.text);
  for (const { key, value } of protectedSource.values) output = output.replace(key, () => value);
  for (const { marker, value } of names) output = output.replace(marker, () => value);
  return output;
}

function separateSourceUrls(source, text) {
  // Translate prose around the exact original URLs, then keep a visible
  // boundary when Chinese punctuation or words immediately follow them.
  // Do not infer a shorter URL or accept a changed path/query. Code remains
  // byte-for-byte intact, including Unicode URLs inside executable examples.
  const urls = [...new Set(protectText(String(source)).values
    .map(({ value }) => value).filter((value) => /^https?:\/\//.test(value)))].sort((a, b) => b.length - a.length);
  if (!urls.length) return String(text);
  const patterns = urls.map((url) => new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    + "(?=[\\u3400-\\u9fff\\u3000-\\u303f\\uff00-\\uffef])", "g"));
  return String(text).split(/(```[^]*?```|~~~[^]*?~~~|`[^`\n]+`)/g).map((part, index) => index % 2
    ? part : patterns.reduce((result, pattern) => result.replace(pattern, (url) => `${url} `), part)).join("");
}

function normalizeDigestChinese(text, source = "") {
  const terms = [
    [/\bAI Builders Digest\b/g, "AI 构建者日报"],
    [/\bAI builders?\b/gi, "AI 构建者"],
    [/\bbuilders?\b/gi, "构建者"], [/\bdigests?\b/gi, "日报"],
    [/\bfeeds?\b/gi, "内容源"], [/\bagents?\b/gi, "智能体"],
    [/\bprompts?\b/gi, "提示词"], [/\btokens?\b/gi, "词元"],
    [/\bbugs?\b/gi, "缺陷"], [/\bfine[- ]tuning\b/gi, "微调"],
    [/\bDock\b/g, "程序坞"], [/\bCEO\b/g, "首席执行官"],
    [/\bCTO\b/g, "首席技术官"], [/\bPM\b/g, "产品经理"]
  ];
  return outsideProtected(separateSourceUrls(source, text), (visible) => terms.reduce((result, [pattern, chinese]) => result.replace(pattern, chinese), visible));
}

function normalizeEnglishDates(text) {
  const months = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ");
  // Convert dates before protecting numerals so month names cannot create
  // extra/misordered digits during translation. URLs and code stay verbatim.
  const codeAndLinks = /```[^]*?```|~~~[^]*?~~~|`[^`\n]+`|https?:\/\/[^\s<>"）]+/g;
  const saved = [];
  let visible = String(text).replace(codeAndLinks, (value) => {
    const marker = `〈日期保留_${saved.length}〉`; saved.push({ marker, value }); return marker;
  });
  visible = visible.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?[ \t]+(\d{1,4})(?:st|nd|rd|th)?(?:,?[ \t]+(\d{4}))?\b/gi,
    (match, month, dayOrYear, year) => {
      const number = Number(dayOrYear), m = months.indexOf(month.slice(0, 3).toLowerCase()) + 1;
      if (year && number >= 1 && number <= 31) return `${year}年${m}月${number}日`;
      if (!year && number >= 1000 && number <= 9999) return `${dayOrYear}年${m}月`;
      if (!year && number >= 1 && number <= 31) return `${m}月${number}日`;
      return match;
    });
  // A named month in an explicit temporal phrase carries a numeric month
  // even without a day/year ("logs stop in November" -> "logs stop in 11月").
  // Protect it before translation so a correct Chinese month cannot look
  // like an invented number. Lowercase modal "may" and names stay prose.
  visible = visible.replace(/\b((?:in|since|until|before|after|during|by|through|from|to|around|this|last|next|early|late|of)[ \t]+)(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi,
    (match, prefix, month, offset, input) => {
      if (!/^[A-Z]/.test(month) || /^[ \t]+[A-Z][a-z]/.test(input.slice(offset + match.length))) return match;
      return `${prefix}${months.indexOf(month.slice(0, 3).toLowerCase()) + 1}月`;
    });
  for (const { marker, value } of saved) visible = visible.replace(marker, () => value);
  return visible;
}

function protectedSignature(text) {
  return JSON.stringify(protectText(normalizeEnglishDates(text)).values.map(({ value }) => value).sort());
}

function needsDigestRepair(text) {
  if (hasEnglishProse(text) || /《[^》]*\b[A-Za-z]+(?:\s+[A-Za-z]+){2,}[^》]*》/.test(text)) return true;
  // Title Case must not exempt ordinary video or article headlines as names.
  const titles = [...String(text).matchAll(/^-\s+\*\*([^*]+)\*\*|^###\s+\[([^\]]+)\]\(|^###\s+[^\n]+ — ([^\n]+)/gm)];
  return titles.some((match) => {
    const title = match[1] || match[2] || match[3];
    return !/[\u3400-\u9fff]/.test(title) && (title.match(/\b[A-Za-z]+\b/g) || []).length >= 4;
  });
}

function verifyDigestFidelity(source, translated) {
  const paragraphs = (value) => String(value).trim().split(/\r?\n[ \t]*\r?\n/).filter((part) => part.trim()).length;
  if (paragraphs(source) !== paragraphs(translated)) throw new Error("日报译文的段落数量发生变化，不能发布。");
  if (protectedSignature(source) !== protectedSignature(translated)) throw new Error("日报译文的数字、账号、型号或链接缺失、增加或改变，不能发布。");
  if (needsDigestRepair(translated)) throw new Error("日报仍有未翻译的英文正文，不能发布。");
  const urls = (text) => (String(text).match(/https?:\/\/[^\s<>"）]+/g) || []);
  if (JSON.stringify(urls(source)) !== JSON.stringify(urls(translated))) throw new Error("日报来源链接顺序发生变化，不能发布。");
  const timestamps = (value) => (String(value).match(/\b\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?\b/g) || []);
  if (JSON.stringify(timestamps(source)) !== JSON.stringify(timestamps(translated))) throw new Error("日报时间戳顺序发生变化，不能发布。");
}

async function prepareChineseDigest({ source, cached, translator }) {
  if (cached?.verified && cached.receipt.sourceSha256 === sha256(source) && cached.receipt.digestVersion === DIGEST_VERSION && cached.title) {
    verifyDigestFidelity(source, `# ${cached.title}\n\n${cached.content}`);
    return { title: cached.title, text: cached.content, receipt: cached.receipt };
  }
  let text;
  const legacyCached = cached?.verified && cached.receipt.sourceSha256 === sha256(source) && !cached.receipt.digestVersion;
  if (legacyCached) {
    // Reuse completed translations, repairing only changed literal counts or
    // leftover prose. A positional repair is safe only with equal paragraph counts.
    const rawParts = source.split(PARAGRAPHS), translatedParts = cached.content.split(PARAGRAPHS);
    if (rawParts.length === translatedParts.length) {
      for (let i = 0; i < rawParts.length; i += 2) {
        const chinese = normalizeDigestChinese(translatedParts[i], rawParts[i]);
        translatedParts[i] = protectedSignature(rawParts[i]) !== protectedSignature(chinese) || needsDigestRepair(chinese)
          ? (await translator.translate(normalizeEnglishDates(rawParts[i]), { context: CONTEXT })).text
          : chinese;
      }
      text = translatedParts.join("");
    }
  }
  if (text === undefined) text = (await translator.translate(normalizeEnglishDates(source), { context: CONTEXT })).text;
  text = normalizeDigestChinese(text, source);
  // The generic translator permits Title Case proper names. Digest headlines
  // and extra literals need a stricter check and targeted retry before failing.
  for (let attempt = 0; attempt < 2; attempt++) {
    try { verifyDigestFidelity(source, text); break; }
    catch (error) {
      const feedback = `${CONTEXT}\n日报发布补查第 ${attempt + 1} 次：${error.message} 保持原段落结构；普通英文标题必须译为中文；不得补入额外数字、括号或账号。`;
      const rawParts = source.split(PARAGRAPHS), translatedParts = text.split(PARAGRAPHS);
      if (rawParts.length !== translatedParts.length) {
        text = normalizeDigestChinese((await translator.translate(normalizeEnglishDates(source), { context: feedback })).text, source);
      } else {
        for (let i = 0; i < rawParts.length; i += 2) {
          if (protectedSignature(rawParts[i]) !== protectedSignature(translatedParts[i]) || needsDigestRepair(translatedParts[i])) {
            translatedParts[i] = normalizeDigestChinese((await translator.translate(normalizeEnglishDates(rawParts[i]), { context: feedback })).text, rawParts[i]);
          }
        }
        text = translatedParts.join("");
      }
    }
  }
  verifyDigestFidelity(source, text);
  // The reader has one Chinese heading; raw sources are kept in a hidden sidecar.
  const aiBuilderDate = source.match(/^#\s+AI (?:Builders Digest|构建者日报)[^\n]*?(\d{4}-\d{2}-\d{2})/m)?.[1];
  const title = aiBuilderDate ? `AI 构建者日报 — ${aiBuilderDate}` : text.match(/^#\s+(.+)$/m)?.[1] || "订阅日报";
  const body = text.replace(/^#\s+[^\n]+\r?\n\s*/, "").trim();
  return { title, text: body, receipt: {
    version: TRANSLATION_VERSION, ...TRANSLATION_PREFERENCES, complete: true,
    sourceSha256: sha256(source), translationSha256: sha256(body), sourceCharacters: source.length,
    digestVersion: DIGEST_VERSION, protectedValuesVerified: true, linksVerified: true,
    englishProseChecked: true
  } };
}

function renderChineseDigest({ source, translated, prefix = "" }) {
  const sourceHash = sha256(source);
  const reference = { version: 1, file: `.sources/${sourceHash}.md`, sha256: sourceHash };
  return `${prefix}# ${translated.title}\n\n<!-- domi:digest:source ${JSON.stringify(reference)} -->\n${translationSection(translated.text, translated.receipt)}`;
}

async function writeChineseDigest({ file, source, translated, expected, beforeWrite = () => {} }) {
  const dir = path.dirname(file);
  await fs.promises.mkdir(dir, { recursive: true });
  const sourceDir = path.join(dir, ".sources");
  await fs.promises.mkdir(sourceDir, { recursive: true });
  if (fs.lstatSync(sourceDir).isSymbolicLink()) throw new Error("日报原文目录不能使用符号链接。");
  const sourceFile = path.join(sourceDir, `${sha256(source)}.md`);
  try { await fs.promises.writeFile(sourceFile, source, { encoding: "utf8", flag: "wx" }); }
  catch (error) { if (error.code !== "EEXIST") throw error; }
  if (fs.lstatSync(sourceFile).isSymbolicLink()) throw new Error("日报原文不能使用符号链接。");
  if (fs.readFileSync(sourceFile, "utf8") !== source) throw new Error("日报原文回读不一致。");
  const prefix = expected?.match(/^---\r?\n[^]*?\r?\n---\r?\n/)?.[0] || "";
  const next = renderChineseDigest({ source, translated, prefix });
  if (expected === next) return false;
  if (expected !== undefined) {
    const backupDir = path.join(sourceDir, ".backups");
    await fs.promises.mkdir(backupDir, { recursive: true });
    if (fs.lstatSync(backupDir).isSymbolicLink()) throw new Error("日报备份目录不能使用符号链接。");
    const backupPath = path.join(backupDir, `${sha256(expected)}.md`);
    try { await fs.promises.writeFile(backupPath, expected, { flag: "wx" }); }
    catch (error) { if (error.code !== "EEXIST") throw error; }
  }
  const temporary = `${file}.${process.pid}.translation.tmp`;
  try {
    await fs.promises.writeFile(temporary, next);
    for (let attempt = 0; ; attempt++) {
      beforeWrite();
      const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
      if (current !== expected) throw new Error("翻译期间源文件已变化，本轮未覆盖。");
      try { await fs.promises.rename(temporary, file); break; }
      catch (error) {
        if (attempt >= 2 || !["EPERM", "EBUSY"].includes(error.code)) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
  } finally { await fs.promises.rm(temporary, { force: true }); }
  const saved = fs.readFileSync(file, "utf8");
  if (saved !== next || !readTranslationSection(saved)?.verified || readDigestSource(saved, file) !== source) {
    throw new Error("中文日报或原文回读不一致。");
  }
  return true;
}

async function publishChineseDigest({ source, files, translator, cached, beforeWrite }) {
  const snapshots = files.map((file) => ({ file, expected: fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined }));
  cached ||= snapshots.map(({ expected }) => {
    const item = readTranslationSection(expected);
    return item ? { ...item, title: expected.match(/^#\s+(.+)$/m)?.[1] } : null;
  }).find((item) => item?.verified && item.receipt.sourceSha256 === sha256(source));
  const translated = await prepareChineseDigest({ source, cached, translator });
  for (const snapshot of snapshots) await writeChineseDigest({ ...snapshot, source, translated, beforeWrite });
  return { ok: true, files, receipt: translated.receipt };
}

async function finalizeSubscriptionDigest({ libraryRoot, day, translator, beforeWrite }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) throw new Error("订阅日报日期无效。");
  const dir = path.join(libraryRoot, "13.认知库", "订阅日报");
  const draft = path.join(dir, ".drafts", `${day}.md`);
  const target = path.join(dir, `${day}.md`);
  const relative = path.relative(fs.realpathSync(libraryRoot), fs.realpathSync(draft));
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) throw new Error("日报草稿超出资料库目录。");
  const initial = fs.readFileSync(draft, "utf8");
  const source = readDigestSource(initial, draft);
  return publishChineseDigest({ source, files: [target], translator, beforeWrite: () => {
    if (fs.readFileSync(draft, "utf8") !== initial) throw new Error("日报草稿已变化，本轮未覆盖。");
    beforeWrite?.();
  } });
}

module.exports = { isSubscriptionDigest, digestDisplayTitle, readDigestSource, normalizeDigestChinese, normalizeEnglishDates,
  protectedSignature, needsDigestRepair, verifyDigestFidelity, prepareChineseDigest, renderChineseDigest,
  writeChineseDigest, publishChineseDigest, finalizeSubscriptionDigest, DIGEST_VERSION };
