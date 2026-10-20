const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const CLOUD_ROOT_PATTERN = /(?:^|\/)(onedrive|dropbox|nutstore|坚果云|googledrive|google drive|idrive)(?:$|\/)/i;
const DEFAULT_READ_CHARS = 8_000;
const MAX_READ_CHARS = 24_000;
const MAX_OCR_PAGES = 40;

// 可配置的 OCR 命令执行器：命令模板里用 {pdf} 与可选的 {page} 占位符，
// 例如 `python ocr.py {pdf} {page}`。执行失败或超时返回空字符串（降级，
// 不阻断读取）；识别质量不内建验证，调用方必须以警告披露 OCR 来源。
function createOcrPageExecutor(command, options = {}) {
  const template = String(command || "").trim();
  if (!template || !template.includes("{pdf}")) return null;
  const execImpl = options.execImpl || require("node:child_process").exec;
  const timeoutMs = Number(options.timeoutMs) || 60_000;
  const quote = (value) => (process.platform === "win32"
    ? `"${String(value).replace(/"/g, "")}"`
    : `'${String(value).replace(/'/g, `'\\''`)}'`);
  return async (pdfPath, pageNumber) => {
    const line = template.replace(/\{pdf\}/g, quote(pdfPath)).replace(/\{page\}/g, quote(String(pageNumber)));
    return await new Promise((resolve) => {
      execImpl(line, { timeout: timeoutMs, maxBuffer: 2 * 1024 * 1024, windowsHide: true }, (error, stdout) => {
        resolve(error ? "" : String(stdout || "").trim());
      });
    });
  };
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function safeBoundary(text, offset) {
  const at = Math.max(0, Math.min(text.length, offset));
  return at > 0 && /[\uD800-\uDBFF]/.test(text[at - 1]) && /[\uDC00-\uDFFF]/.test(text[at]) ? at - 1 : at;
}

function lineAt(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function documentHeadings(text) {
  const headings = [];
  let fence = "";
  let offset = 0;
  for (const line of text.split("\n")) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fence === fenceMatch[1][0]) fence = "";
    } else if (!fence) {
      const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (match) headings.push({ offset, level: match[1].length, title: match[2] });
    }
    offset += line.length + 1;
  }
  return headings;
}

function anchorOffset(text, request) {
  if (request.anchorText) {
    const anchor = String(request.anchorText).replace(/\r\n/g, "\n").replace(/^…|…$/g, "").trim();
    const match = text.indexOf(anchor);
    if (anchor && match >= 0) return match;
  }
  if (Number.isFinite(request.offset)) return safeBoundary(text, request.offset);
  if (Number.isFinite(request.line) && request.line > 0) {
    let offset = 0;
    for (const line of text.split("\n").slice(0, request.line - 1)) offset += line.length + 1;
    return Math.min(offset, text.length);
  }
  for (const keyword of request.keywords || []) {
    const match = text.toLocaleLowerCase("zh-CN").indexOf(String(keyword).toLocaleLowerCase("zh-CN"));
    if (match >= 0) return match;
  }
  return 0;
}

function sectionRange(text, at, headings) {
  const heading = [...headings].reverse().find((item) => item.offset <= at);
  if (heading) {
    const next = headings.find((item) => item.offset > heading.offset && item.level <= heading.level);
    return { start: heading.offset, end: next?.offset ?? text.length, title: heading.title };
  }
  // Plain text and long paragraphs still have lossless, resumable windows.
  const before = text.lastIndexOf("\n\n", at);
  const after = text.indexOf("\n\n", at);
  return { start: before < 0 ? 0 : before + 2, end: after < 0 ? text.length : after, title: "相关段落" };
}

function endWithinBudget(text, start, end, budget, anchor = start) {
  let from = start;
  // For a large chapter, center the first window near the hit rather than
  // repeatedly returning its introduction. The omitted prefix is explicit.
  if (anchor >= start + budget) {
    const near = Math.max(start, anchor - Math.floor(budget / 3));
    const paragraph = text.lastIndexOf("\n\n", anchor);
    from = paragraph >= near ? paragraph + 2 : safeBoundary(text, near);
  }
  let to = safeBoundary(text, Math.min(end, from + budget));
  if (to < end) {
    const paragraph = text.lastIndexOf("\n\n", to);
    if (paragraph > from + budget / 2) to = paragraph;
    else {
      const newline = text.lastIndexOf("\n", to);
      if (newline > from + budget / 2) to = newline;
    }
  }
  return { start: from, end: to };
}

class DocumentReader {
  constructor({ rootPath, cloudContentAllowed = false, extractPdf, ocrPage = null, maxCacheChars = 2_000_000, allowedPaths, attachmentPaths = [] }) {
    this.rootPath = path.resolve(rootPath);
    this.cloudContentAllowed = cloudContentAllowed;
    this.extractPdf = extractPdf;
    this.ocrPage = typeof ocrPage === "function" ? ocrPage : null;
    this.maxCacheChars = maxCacheChars;
    this.cache = new Map();
    // Exact-file grants, not parent-directory grants. Canonical paths are
    // pinned once and checked again on every read (including cache hits).
    this.allowedPaths = allowedPaths === undefined ? null : new Map();
    this.attachmentPaths = new Map();
    for (const file of allowedPaths || []) {
      const candidate = path.resolve(this.rootPath, String(file));
      this.allowedPaths.set(candidate, fs.realpathSync(candidate));
    }
    for (const file of attachmentPaths) {
      const candidate = path.resolve(this.rootPath, String(file));
      this.attachmentPaths.set(candidate, fs.realpathSync(candidate));
    }
  }

  async load(requestPath) {
    const candidate = path.resolve(this.rootPath, String(requestPath || ""));
    const grant = this.allowedPaths?.get(candidate) || this.attachmentPaths.get(candidate);
    if (this.allowedPaths && !this.allowedPaths.has(candidate)) throw new Error("资料不在本轮选定材料范围内。");
    if (!grant && !inside(this.rootPath, candidate)) throw new Error("资料路径超出当前资料库范围。");
    const realPath = await fs.promises.realpath(candidate);
    if (grant) {
      if (realPath !== grant) throw new Error("选定材料的链接目标已改变，请重新选择材料。");
    } else {
      const realRoot = await fs.promises.realpath(this.rootPath);
      if (!inside(realRoot, realPath)) throw new Error("资料链接指向当前资料库之外。");
    }
    if (!this.cloudContentAllowed && CLOUD_ROOT_PATTERN.test(realPath.split(path.sep).join("/"))) {
      throw new Error("云盘资料正文未获索引授权，请先在设置中开启或将文件下载到本地资料库。");
    }
    const stat = await fs.promises.stat(realPath);
    const extension = path.extname(realPath).toLowerCase();
    if (!stat.isFile() || ![".md", ".markdown", ".txt", ".pdf", ".docx", ".doc"].includes(extension)) throw new Error("仅支持读取 Markdown、文本、PDF 和 Word 资料正文。");
    const maxBytes = /\.docx?$/.test(extension) ? 64 * 1024 * 1024 : extension === ".pdf" ? 20 * 1024 * 1024 : 2 * 1024 * 1024;
    if (stat.size > maxBytes) throw new Error("资料超过单文件读取上限，请拆分材料后再读取。");
    const stamp = `${stat.size}:${stat.mtimeMs}`;
    const cached = this.cache.get(realPath);
    if (cached?.stamp === stamp) return cached;
    let text;
    let pages = [];
    const warnings = [];
    let extractionIncomplete = false;
    if (extension === ".pdf") {
      const extract = this.extractPdf || (async (file) => {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const proxy = await getDocumentProxy(new Uint8Array(await fs.promises.readFile(file)));
        try { return (await extractText(proxy, { mergePages: false })).text; }
        finally { await proxy.destroy(); }
      });
      const extracted = await extract(realPath);
      const pageTexts = (Array.isArray(extracted) ? extracted : [String(extracted || "")]).map((pageText) => String(pageText || ""));
      // 无可提取文字的页面可选 OCR：识别结果必须以警告披露，且不能据此宣称已读原文。
      const ocrApplied = [];
      const ocrFailed = [];
      if (this.ocrPage) {
        const emptyPageNumbers = pageTexts.map((pageText, index) => pageText.trim() ? null : index + 1).filter(Boolean);
        for (const pageNumber of emptyPageNumbers.slice(0, MAX_OCR_PAGES)) {
          try {
            const ocrText = String(await this.ocrPage(realPath, pageNumber) || "").trim();
            if (ocrText) { pageTexts[pageNumber - 1] = ocrText; ocrApplied.push(pageNumber); }
            else ocrFailed.push(pageNumber);
          } catch { ocrFailed.push(pageNumber); }
        }
      }
      text = "";
      for (const [index, pageText] of pageTexts.entries()) {
        const start = text.length;
        text += `## PDF 第 ${index + 1} 页\n${pageText.replace(/\u0000/g, "")}\n\n`;
        pages.push({ page: index + 1, start, end: text.length });
      }
      if (!pageTexts.some((pageText) => pageText.trim())) {
        throw new Error(this.ocrPage
          ? "PDF 无可提取文字，且 OCR 未识别出文字；请核验原始页面或调整 OCR 配置。"
          : "PDF 无可提取文字，需要读取原始页面或进行 OCR。");
      }
      const remainingEmpty = pageTexts.map((pageText, index) => pageText.trim() ? null : index + 1).filter(Boolean);
      // OCR 过的页面仍不可作为“已读原文”：识别质量未验证，全文标记保持诚实。
      extractionIncomplete = remainingEmpty.length > 0 || ocrApplied.length > 0;
      if (remainingEmpty.length) warnings.push(`PDF 第 ${remainingEmpty.join("、")} 页没有可提取文字，需要核验原始页面或 OCR。`);
      if (ocrApplied.length) warnings.push(`PDF 第 ${ocrApplied.join("、")} 页使用 OCR 提取文字，识别质量未验证，请核验原始页面。`);
      if (ocrFailed.length) warnings.push(`PDF 第 ${ocrFailed.join("、")} 页 OCR 未识别出文字。`);
      warnings.push("PDF 提供的是可提取文字，图像及复杂表格仍需核验原始页面。");
    } else if(/\.docx?$/.test(extension)) {
      const word=await require('./word-document.cjs').readWordFile(realPath,{includeHtml:false});
      text=word.text;extractionIncomplete=word.incomplete;warnings.push(...word.warnings,'Word 提供正文文字；图片、图形和复杂表格需回到原文核对。');
    } else {
      text = (await fs.promises.readFile(realPath, "utf8")).replace(/\r\n/g, "\n").replace(/\u0000/g, "");
    }
    const after = await fs.promises.stat(realPath);
    if (`${after.size}:${after.mtimeMs}` !== stamp) throw new Error("读取期间资料发生变化，请重试。");
    if (!text.trim()) throw new Error("资料正文为空，无法作为回答依据。");
    const headings = documentHeadings(text);
    const title = extension === ".pdf" ? path.basename(candidate)
      : text.match(/^title:\s*["']?([^\n"']+)/m)?.[1] || headings[0]?.title || path.basename(candidate);
    const date = text.match(/^(?:publishedAt|published_at|date|日期|发布时间):\s*["']?([^\n"']+)/m)?.[1] || "";
    const value = { path: candidate, canonicalPath: realPath, relativePath: inside(this.rootPath, candidate) ? path.relative(this.rootPath, candidate) : path.basename(candidate), text, pages, headings, title, date, stamp, warnings, extractionIncomplete,
      version: crypto.createHash("sha256").update(text).digest("hex") };
    this.cache.delete(realPath);
    while (this.cache.size && [...this.cache.values()].reduce((sum, item) => sum + item.text.length, 0) + text.length > this.maxCacheChars) {
      this.cache.delete(this.cache.keys().next().value);
    }
    if (text.length <= this.maxCacheChars) this.cache.set(realPath, value);
    return value;
  }

  async read(request = {}) {
    const doc = await this.load(request.path);
    const limit = Math.max(1, Math.min(Number(request.maxChars) || DEFAULT_READ_CHARS, MAX_READ_CHARS));
    let desired;
    let anchor = anchorOffset(doc.text, { ...request, ...(doc.pages.length ? { line: undefined, offset: undefined } : {}) });
    if (request.cursor) {
      let cursor;
      try { cursor = JSON.parse(Buffer.from(String(request.cursor), "base64url").toString("utf8")); }
      catch { throw new Error("无效的原文续读位置。"); }
      if (cursor.path !== doc.relativePath || cursor.version !== doc.version) throw new Error("资料版本或路径已改变，请重新检索后读取。");
      if (!Number.isInteger(cursor.offset) || !Number.isInteger(cursor.end) || cursor.offset < 0 || cursor.end > doc.text.length || cursor.offset >= cursor.end) throw new Error("无效的原文续读范围。");
      desired = { start: cursor.offset, end: cursor.end, title: cursor.title };
      anchor = desired.start;
    } else if (request.mode === "document" || doc.text.length <= 6_000) {
      desired = { start: 0, end: doc.text.length, title: "全文" };
      anchor = 0;
    } else {
      desired = sectionRange(doc.text, anchor, doc.headings);
    }
    const range = endWithinBudget(doc.text, desired.start, desired.end, limit, anchor);
    if (range.end <= range.start) throw new Error("读取预算不足以容纳一个完整字符，请增加本次预算或说明未读范围。");
    const content = doc.text.slice(range.start, range.end);
    const nextCursor = range.end < desired.end ? Buffer.from(JSON.stringify({
      path: doc.relativePath, version: doc.version, offset: range.end, end: desired.end, title: desired.title
    })).toString("base64url") : null;
    return {
      ok: true, path: doc.path, canonicalPath: doc.canonicalPath, relativePath: doc.relativePath, title: doc.title, date: doc.date, version: doc.version,
      sectionTitle: desired.title, content, startOffset: range.start, endOffset: range.end,
      startLine: lineAt(doc.text, range.start), endLine: lineAt(doc.text, range.end),
      pages: doc.pages.filter((page) => page.end > range.start && page.start < range.end).map((page) => page.page),
      totalChars: doc.text.length, fullDocument: range.start === 0 && range.end === doc.text.length && !doc.extractionIncomplete,
      extractionIncomplete: doc.extractionIncomplete, warnings: doc.warnings,
      completeSection: range.start === desired.start && range.end === desired.end,
      omittedPrefix: range.start > desired.start, truncated: range.start > desired.start || range.end < desired.end,
      nextCursor, headings: doc.headings.slice(0, 80).map((heading) => ({ title: heading.title.slice(0, 140), line: lineAt(doc.text, heading.offset), offset: heading.offset }))
    };
  }
}

module.exports = { DocumentReader, documentHeadings, safeBoundary, lineAt, createOcrPageExecutor };
