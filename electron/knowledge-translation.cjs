const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const execFileAsync = promisify(execFile);
const { ChineseTranslator, needsChineseTranslation, isTranslationQuotaError, sha256, translationSection, readTranslationSection, removeTranslationSection } = require("./chinese-translation.cjs");
const { isSubscriptionDigest, readDigestSource, prepareChineseDigest, writeChineseDigest, DIGEST_VERSION, verifyDigestFidelity } = require("./subscription-digest.cjs");

function sourceBody(markdown, unified = false) {
  let text = removeTranslationSection(String(markdown || ""));
  if (unified) {
    const index = text.indexOf("\n## 原文存档", text.indexOf("<!-- domi:managed:end -->"));
    if (index < 0) return "";
    text = text.slice(index);
  }
  const delimiter = text.indexOf("\n---\n", text.indexOf("- 归档时间："));
  if (delimiter < 0) throw new Error("原文存档边界不明确，停止自动翻译以保护原文。");
  return text.slice(delimiter + "\n---\n".length).trim();
}

function readNewsRecords(databasePath) {
  if (!databasePath || !fs.existsSync(databasePath)) return [];
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    return db.prepare("SELECT * FROM news_events ORDER BY length(title) DESC").all().map((r) => ({
      eventId: r.event_id, title: r.title, summary: r.summary, investmentMeaning: r.investment_meaning,
      action: r.action, source: r.source, url: r.url, publishedAt: r.published_at,
      domains: JSON.parse(r.domains_json || "[]"), subdomains: JSON.parse(r.subdomains_json || "[]"), types: JSON.parse(r.types_json || "[]"),
      companies: r.companies, institutions: r.institutions, importance: r.importance, confidence: r.confidence,
      evidenceStatus: r.evidence_status, worthFollowing: !!r.worth_following, articleType: r.article_type,
      documentPath: r.document_path, contentPath: r.content_path
    }));
  } finally { db.close(); }
}

function markdownFiles(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isSymbolicLink() || entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) files.push(...markdownFiles(file));
    else if (/\.md$/i.test(entry.name) && entry.name !== "0.待办事项.md") files.push(file);
  }
  return files;
}

function insideRoot(root, file) {
  const relative = path.relative(fs.realpathSync(root), fs.realpathSync(file));
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

class KnowledgeTranslationService {
  constructor({ settingsProvider, configPath, repoScriptPath, stateRoot = path.join(os.homedir(), ".local", "share", "domi", "chinese-translation"), runtimeProvider, translator, writeNews, onProgress = () => {} }) {
    this.settingsProvider = settingsProvider;
    this.configPath = configPath;
    this.repoScriptPath = repoScriptPath;
    this.stateRoot = stateRoot;
    fs.mkdirSync(stateRoot, { recursive: true });
    this.translator = translator || new ChineseTranslator({ cacheRoot: path.join(stateRoot, "blocks"), runtimeProvider,
      onProgress: (progress) => this.onProgress({ phase: "blocks", ...progress }) });
    this.writeNews = writeNews;
    this.onProgress = onProgress;
    this.running = false;
    this.stopped = false;
    this.statePath = path.join(stateRoot, "status.json");
    try { this.state = JSON.parse(fs.readFileSync(this.statePath, "utf8")); } catch { this.state = { files: {} }; }
    this.state.files ||= {};
  }

  saveState() {
    fs.writeFileSync(`${this.statePath}.tmp`, JSON.stringify(this.state, null, 2));
    fs.renameSync(`${this.statePath}.tmp`, this.statePath);
  }

  async archiveNews(payload) {
    for (let attempt = 0; ; attempt++) {
      try { return await this.archiveNewsOnce(payload); }
      catch (error) {
        if (attempt >= 2 || !/EPERM|EBUSY|SQLITE_BUSY|database is locked/i.test(String(error.message || error))) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
  }

  async archiveNewsOnce(payload) {
    if (this.writeNews) return this.writeNews(payload);
    const payloadPath = path.join(this.stateRoot, `${payload.eventId}.payload.json`);
    fs.writeFileSync(payloadPath, JSON.stringify(payload));
    try {
      const result = await execFileAsync(process.execPath, [this.repoScriptPath, "news", "upsert", "--json-file", payloadPath], {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", DOMI_CONFIG_PATH: this.configPath }, windowsHide: true, maxBuffer: 2 * 1024 * 1024
      });
      const receipt = JSON.parse(result.stdout.trim());
      if (!receipt.ok || !receipt.storageReceipt?.recordVerified || !receipt.storageReceipt?.documentVerified) throw new Error(receipt.error || "翻译写入未通过回读验证。");
      if (payload.translationContent && !receipt.storageReceipt?.translationVerified) throw new Error("中文全文写入未通过回读验证。");
      return receipt;
    } catch (error) {
      // The repository CLI reports failures as JSON on stdout. Keep its
      // concrete explanation rather than only the child-process command.
      let reported;
      try { reported = JSON.parse(String(error.stdout || "").trim()); } catch {}
      if (reported?.error) throw new Error(`${reported.code || "翻译写入失败"}：${reported.error}`);
      throw error;
    } finally { fs.rmSync(payloadPath, { force: true }); }
  }

  async translateNews(event, root) {
    if (!event.documentPath || !fs.existsSync(event.documentPath) || !insideRoot(root, event.documentPath)) return false;
    const initial = fs.readFileSync(event.documentPath, "utf8");
    const original = event.articleType === "article"
      ? sourceBody(event.contentPath && fs.existsSync(event.contentPath) ? fs.readFileSync(event.contentPath, "utf8") : initial, !event.contentPath)
      : "";
    const cached = readTranslationSection(initial);
    const translateOriginal = original && needsChineseTranslation(original)
      && !(cached?.verified && cached.receipt.sourceSha256 === sha256(original));
    const fields = ["title", "summary", "investmentMeaning", "action"];
    const toTranslate = fields.filter((key) => {
      const text = String(event[key] || "");
      if (!needsChineseTranslation(text)) return false;
      if (this.state.files[event.eventId]?.fields?.[key] === sha256(text)) return false;
      // Chinese cards containing only capitalized company/product names do
      // not need rewriting. Translate actual English sentences or headings.
      return !/[\u3400-\u9fff]/.test(text)
        || /\b(?:the|a|an|of|to|and|is|are|in|for|can|how|why|with|we|you|it|this|that)\b/i.test(text);
    });
    if (!translateOriginal && !toTranslate.length) return false;
    this.onProgress({ phase: "file", title: event.title, eventId: event.eventId });
    const payload = { ...event };
    for (const key of toTranslate) payload[key] = (await this.translator.translate(String(event[key]).trim(), { context: event.summary || event.title })).text;
    if (translateOriginal) {
      const translated = await this.translator.translate(original);
      payload.translationContent = translated.text;
      payload.translationReceipt = translated.receipt;
      payload.originalContent = original;
    }
    const fieldHashes = Object.fromEntries(fields.map((key) => [key, sha256(String(payload[key] || ""))]));
    if (!translateOriginal && fields.every((key) => payload[key] === event[key])) {
      this.state.files[event.eventId] = { ...this.state.files[event.eventId], status: "complete", fields: fieldHashes };
      this.saveState();
      return false;
    }
    // A user edit or another intake run during cloud translation takes
    // precedence. Cached blocks remain available for the next scan.
    if (this.stopped || fs.readFileSync(event.documentPath, "utf8") !== initial) throw new Error("翻译期间源文件已变化，本轮未覆盖；下次重新检查。");
    const currentSettings = this.settingsProvider();
    if (currentSettings.localRepositoryDir !== root || currentSettings.localDatabasePath !== this.scanDatabasePath) throw new Error("翻译期间资料库配置已变化，本轮未覆盖。");
    const current = readNewsRecords(currentSettings.localDatabasePath).find((r) => r.eventId === event.eventId);
    if (!current || JSON.stringify(current) !== JSON.stringify(event)) throw new Error("翻译期间记录已变化，本轮未覆盖。");
    if (event.contentPath && sourceBody(fs.readFileSync(event.contentPath, "utf8")) !== original) throw new Error("翻译期间原文已变化，本轮未覆盖。");
    const backup = path.join(this.stateRoot, "backups", `${event.eventId}-${sha256(initial)}.md`);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, initial);
    const result = await this.archiveNews(payload);
    this.state.files[event.eventId] = { status: "complete", title: payload.title, documentPath: result.event?.documentPath || event.documentPath, translatedAt: new Date().toISOString(), receipt: payload.translationReceipt || null, fields: fieldHashes };
    this.saveState();
    this.onProgress({ phase: "complete", title: payload.title, eventId: event.eventId });
    return true;
  }

  async translateDocument(file, root) {
    if (!insideRoot(root, file)) return false;
    const initial = fs.readFileSync(file, "utf8");
    const cached = readTranslationSection(initial);
    if (isSubscriptionDigest(file)) {
      const source = readDigestSource(initial, file);
      const title = initial.match(/^#\s+(.+)$/m)?.[1];
      if (cached?.verified && cached.receipt.digestVersion === DIGEST_VERSION && cached.receipt.sourceSha256 === sha256(source)) {
        verifyDigestFidelity(source, `# ${title}\n\n${cached.content}`);
        return false;
      }
      this.onProgress({ phase: "file", title: path.basename(file) });
      const translated = await prepareChineseDigest({ source, cached, translator: this.translator });
      const written = await writeChineseDigest({ file, source, translated, expected: initial, beforeWrite: () => {
        if (this.stopped) throw new Error("翻译已停止。");
        if (this.settingsProvider().localRepositoryDir !== root) throw new Error("翻译期间资料库配置已变化，本轮未覆盖。");
      } });
      this.state.files[file] = { status: "complete", translatedAt: new Date().toISOString(), receipt: translated.receipt };
      this.saveState();
      this.onProgress({ phase: "complete", title: path.basename(file) });
      return written;
    }
    // Generic notes/digests retain their original as a separate final section.
    let source = initial;
    if (cached) {
      const index = initial.indexOf("\n## 英文原文（保留核对）\n", initial.indexOf("<!-- domi:translation:end -->"));
      if (index < 0) return false;
      source = initial.slice(index + "\n## 英文原文（保留核对）\n".length).trim();
      if (cached.verified && cached.receipt.sourceSha256 === sha256(source)) return false;
    }
    source = source.replace(/^---\r?\n[^]*?\r?\n---\r?\n/, "").trim();
    if (!needsChineseTranslation(source)) return false;
    this.onProgress({ phase: "file", title: path.basename(file) });
    const translated = await this.translator.translate(source);
    if (this.stopped || fs.readFileSync(file, "utf8") !== initial) throw new Error("翻译期间源文件已变化，本轮未覆盖。");
    if (this.settingsProvider().localRepositoryDir !== root) throw new Error("翻译期间资料库配置已变化，本轮未覆盖。");
    const prefix = initial.match(/^---\r?\n[^]*?\r?\n---\r?\n/)?.[0] || "";
    const title = translated.text.match(/^#\s+(.+)$/m)?.[1] || "知识存档";
    const next = `${prefix}\n# ${title}\n\n${translationSection(translated.text, translated.receipt)}\n## 英文原文（保留核对）\n\n${source}\n`;
    const backup = path.join(this.stateRoot, "backups", `${sha256(file)}-${sha256(initial)}.md`);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, initial);
    fs.writeFileSync(`${file}.translation.tmp`, next);
    for (let attempt = 0; ; attempt++) {
      if (fs.readFileSync(file, "utf8") !== initial || this.settingsProvider().localRepositoryDir !== root) throw new Error("写回重试期间源文件或资料库配置已变化，本轮未覆盖。");
      try { fs.renameSync(`${file}.translation.tmp`, file); break; }
      catch (error) {
        if (attempt >= 2 || !["EPERM", "EBUSY"].includes(error.code)) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
    if (fs.readFileSync(file, "utf8") !== next) throw new Error("知识文档译文回读不一致。");
    this.state.files[file] = { status: "complete", translatedAt: new Date().toISOString(), receipt: translated.receipt };
    this.saveState();
    this.onProgress({ phase: "complete", title: path.basename(file) });
    return true;
  }

  async runOnce({ force = false } = {}) {
    if (this.running || this.stopped) return { skipped: true };
    if (!force && this.state.pause?.nextAttemptAt > Date.now()) return { skipped: true, reason: this.state.pause.reason, retryAfter: new Date(this.state.pause.nextAttemptAt).toISOString() };
    const settings = this.settingsProvider();
    const root = settings.localRepositoryDir;
    if (settings.storageBackend !== "local" || !root || !fs.existsSync(root)) return { skipped: true };
    this.running = true;
    this.scanDatabasePath = settings.localDatabasePath;
    const result = { translated: 0, unchanged: 0, failed: [] };
    let paused = false;
    try {
      await this.translator.checkModel?.();
      delete this.state.pause;
      const events = readNewsRecords(settings.localDatabasePath);
      const owned = new Set(events.flatMap((r) => [r.documentPath, r.contentPath]).filter(Boolean).map((f) => path.resolve(f)));
      const work = [...events.map((event) => ({ key: event.eventId, run: () => this.translateNews(event, root) })),
        ...markdownFiles(root).filter((f) => !owned.has(path.resolve(f))).map((file) => ({ key: file, run: () => this.translateDocument(file, root) }))];
      // At most two remote requests; no local inference or audio processing.
      const worker = async () => {
        while (work.length && !this.stopped && !paused) {
          const job = work.shift();
          try { if (await job.run()) result.translated++; else result.unchanged++; }
          catch (error) {
            const message = error.message || String(error);
            result.failed.push({ key: job.key, error: message });
            this.state.files[job.key] = { status: "failed", error: message };
            if (isTranslationQuotaError(error)) {
              paused = true;
              this.state.pause = { reason: "usage-limit", nextAttemptAt: Date.now() + 30 * 60_000, error: message };
              this.onProgress({ phase: "paused", reason: "usage-limit", message: "翻译额度暂不可用，已保存断点；下次复用完成段落继续。" });
            }
            this.saveState(); this.onProgress({ phase: "failed", key: job.key, error: message });
          }
        }
      };
      await Promise.all([worker(), worker()]);
      if (paused || this.stopped) result.pending = work.length;
      this.state.lastResult = result;
      this.saveState();
      return result;
    } finally { this.running = false; }
  }

  close() { this.stopped = true; this.translator.close(); }
}

module.exports = { KnowledgeTranslationService, sourceBody, readNewsRecords, markdownFiles, insideRoot };
