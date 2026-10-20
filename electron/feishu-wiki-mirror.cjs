const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  prepareMarkdownForFeishu,
  semanticTokens
} = require("./markdown-feishu-fidelity.cjs");
const { placeFeishuAssetAtMarker } = require("./feishu-markdown-assets.cjs");

// Feishu Wiki mirror (方案 A): the local library stays the single source of
// truth; this service mirrors a defined slice of it into a dedicated Feishu
// Wiki space so the user can read and search everything from the phone while
// the computer is off. Each document keeps a sha256 ledger entry, so an
// incremental sync skips unchanged files after a verified complete read-back.

const MIRROR_SPACE_NAME = "domi资料库镜像";
const MAX_MIRROR_FILES = 2000;
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
// 远程图片（微信 CDN 等防盗链站点）飞书导入时会整块丢弃、连 alt 文本一起
// 消失，回读保真校验必败。镜像前先下载到库内隐藏缓存目录，改写为本地路径
// 走资产上传管线，保证图片真正上传、说明文字不丢。下载失败保持远程语法。
const REMOTE_ASSET_CACHE_DIR = ".domi-mirror-assets";
const REMOTE_ASSET_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const MAX_REMOTE_ASSETS_PER_DOCUMENT = 40;
const REMOTE_ASSET_TIMEOUT_MS = 15_000;
const REMOTE_ASSET_MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_MAGIC = [
  { extension: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { extension: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { extension: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { extension: "bmp", bytes: [0x42, 0x4d] }
];

function imageExtensionFromMagic(buffer) {
  for (const candidate of IMAGE_MAGIC) {
    if (candidate.bytes.every((byte, index) => buffer[index] === byte)) return candidate.extension;
  }
  // WEBP: RIFF....WEBP
  if (buffer.length > 12 && buffer.toString("latin1", 0, 4) === "RIFF" && buffer.toString("latin1", 8, 12) === "WEBP") return "webp";
  return "";
}
const PROJECT_HOME_NAME = "项目主页.md";
const PERSON_HOME_NAME = "人物主页.md";
// Legacy ledger entries are revalidated once before incremental skipping.
const TEXT_VERIFICATION_VERSION = 2;

// Layout is allowed to change during Markdown import. Every visible source
// token (including repetitions) must still appear in its original order.
// Extra document titles are allowed; a nonempty prefix is never sufficient.
// 飞书回读会把相邻的链接/文本单元合并（中间空格丢失，如两个相邻 t.co
// 链接导出为 5kDekuLbuShttps）：允许一个回读 token 恰好等于连续多个
// 预期 token 的无分隔拼接，内容与顺序仍然强制校验。
function verifyMirrorText(prepared, fetchedMarkdown) {
  const tokens = (markdown) => semanticTokens(String(markdown || "")
    .replace(/<!--[^]*?-->/g, "")
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:\d+|x[\da-f]+);/gi, (entity) => {
      const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
      const body = entity.slice(1, -1).toLowerCase();
      if (body in named) return named[body];
      const code = body.startsWith("#x") ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    })
    .replace(/\\([\\`*_{}\[\]()#+.!>$~-])/g, "$1"));
  const expected = tokens(prepared.content);
  const actual = tokens(fetchedMarkdown);
  let matched = 0;
  for (let index = 0; index < actual.length && matched < expected.length; index += 1) {
    const token = actual[index];
    if (token === expected[matched]) {
      matched += 1;
      continue;
    }
    // 合并容差：token 必须恰好等于从 expected[matched] 起连续若干个
    // token 的拼接，且至少两个；前缀多余或中途对不上都按普通失配处理。
    let combined = expected[matched] || "";
    let end = matched;
    while (combined.length < token.length && end + 1 < expected.length) {
      end += 1;
      combined += expected[end];
    }
    if (end > matched && combined === token) {
      matched = end + 1;
    }
    // 其余情况：actual 多出的 token 被跳过（额外内容允许），matched 不动。
  }
  const ok = expected.length > 0 && matched === expected.length;
  return { ok, textCoverage: expected.length ? matched / expected.length : 0,
    verificationVersion: TEXT_VERIFICATION_VERSION,
    textSha256: crypto.createHash("sha256").update(JSON.stringify(expected)).digest("hex"),
    message: ok ? "" : `飞书正文回读未通过完整性校验（按原顺序匹配 ${matched}/${expected.length} 个文本单元），稍后重试。` };
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

async function sha256FileAsync(filePath) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function walkFiles(rootPath, predicate, collector = [], depth = 0) {
  if (depth > 12 || collector.length >= MAX_MIRROR_FILES) return collector;
  let entries;
  try {
    entries = fs.readdirSync(rootPath, { withFileTypes: true });
  } catch {
    return collector;
  }
  for (const entry of entries) {
    if (!entry.name || entry.name.startsWith(".")) continue;
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, predicate, collector, depth + 1);
      continue;
    }
    if (!entry.isFile()) continue;
    if (predicate(entryPath)) collector.push(entryPath);
    if (collector.length >= MAX_MIRROR_FILES) break;
  }
  return collector;
}

// The mirrored slice: industry cognition news (summary card + full original),
// subscription digests, and canonical entity homepages. Attachment folders
// (原始材料/研究/纪要/导出) are not matched by these rules so project
// materials stay local-only.
function isMirrorTarget(relativeSegments, fileName) {
  const parts = relativeSegments;
  const lowerName = fileName.toLowerCase();
  // 隐藏目录（如订阅日报的 .sources/.backups 内部备份）不镜像到飞书。
  if (parts.some((segment) => segment.startsWith("."))) return false;
  if (parts.includes("_行业认知") && parts.includes("动态") && lowerName.endsWith(".md")) return true;
  if (parts[0] === "13.认知库" && (parts[1] === "订阅日报" || parts[1] === "知识库日报") && lowerName.endsWith(".md")) return true;
  if (fileName === PROJECT_HOME_NAME || fileName === PERSON_HOME_NAME) return true;
  return false;
}

// Pure helper for tests: returns the relative paths to mirror under a library.
function mirrorTargetFiles(libraryRoot) {
  const root = path.resolve(libraryRoot);
  const files = walkFiles(root, (filePath) => {
    const relative = path.relative(root, filePath).split(path.sep);
    const fileName = relative.pop();
    return isMirrorTarget(relative, fileName);
  });
  return files
    .map((filePath) => ({ path: filePath, relativePath: path.relative(root, filePath).split(path.sep).join("/") }))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath, "zh-CN"));
}

// Runtime scans yield between directory reads. The synchronous helper above
// remains available for callers that explicitly need a synchronous listing.
async function mirrorTargetFilesAsync(libraryRoot) {
  const root = path.resolve(libraryRoot);
  const files = [];
  async function visit(directory, depth) {
    if (depth > 12 || files.length >= MAX_MIRROR_FILES) return;
    let entries;
    try { entries = await fs.promises.readdir(directory, { withFileTypes: true }); }
    catch { return; }
    for (const entry of entries) {
      if (files.length >= MAX_MIRROR_FILES) break;
      if (!entry.name || entry.name.startsWith(".")) continue;
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(filePath, depth + 1);
      else if (entry.isFile()) {
        const parts = path.relative(root, filePath).split(path.sep);
        const name = parts.pop();
        if (isMirrorTarget(parts, name)) files.push({ path: filePath, relativePath: parts.concat(name).join("/") });
      }
    }
  }
  await visit(root, 0);
  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath, "zh-CN"));
}

function isMirrorWatchTarget(fileName) {
  const segments = String(fileName || "").split(/[\\/]/);
  const base = segments.pop() || "";
  return isMirrorTarget(segments, base);
}

// Directory chain for a relative path, e.g. "07.模型层/_行业认知/动态/2026/09/a.md"
// → ["07.模型层", "_行业认知", "动态", "2026", "09"].
function directoryChainOf(relativePath) {
  const parts = String(relativePath || "").split("/");
  parts.pop();
  return parts.filter(Boolean);
}

class FeishuWikiMirror {
  constructor(options = {}) {
    this.statePath = String(options.statePath || "");
    this.libraryRoot = path.resolve(String(options.libraryRoot || ""));
    this.runLark = options.runLark || (() => Promise.resolve({}));
    this.logger = options.logger || (() => {});
    this.verificationAttempts = options.verificationAttempts ?? 5;
    this.verificationDelayMs = options.verificationDelayMs ?? 4000;
    this.state = { version: 1, spaceId: "", documents: {}, folders: {} };
  }

  loadState() {
    try {
      const stored = JSON.parse(fs.readFileSync(this.statePath, "utf8"));
      if (stored?.version !== 1 || !stored.documents || !stored.folders) {
        throw new Error("镜像账本格式不受支持");
      }
      if (stored?.version === 1) {
        this.state = {
          version: 1,
          spaceId: String(stored.spaceId || ""),
          documents: stored.documents && typeof stored.documents === "object" ? stored.documents : {},
          folders: stored.folders && typeof stored.folders === "object" ? stored.folders : {}
        };
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw new Error(`镜像账本读取失败，已停止同步：${error.message}`);
    }
  }

  saveState() {
    fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
    const temporaryPath = `${this.statePath}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(temporaryPath, `${JSON.stringify(this.state, null, 2)}\n`, "utf8");
      fs.renameSync(temporaryPath, this.statePath);
    } finally {
      fs.rmSync(temporaryPath, { force: true });
    }
  }

  async ensureSpace() {
    if (this.state.spaceId) return this.state.spaceId;
    const listed = await this.runLark(["wiki", "+space-list", "--format", "json"], { timeout: 60000 });
    const data = listed?.data ?? listed ?? {};
    const spaces = data?.data?.items || data?.data?.spaces || data?.items || data?.spaces || [];
    const hit = (Array.isArray(spaces) ? spaces : []).find((space) => String(space?.name || "").trim() === MIRROR_SPACE_NAME);
    if (hit?.space_id) {
      this.state.spaceId = String(hit.space_id);
      this.saveState();
      return this.state.spaceId;
    }
    const created = await this.runLark([
      "wiki", "+space-create",
      "--name", MIRROR_SPACE_NAME,
      "--description", "domi 本地资料库的只读云端镜像（行业认知动态、订阅日报、项目与人物主页）；权威数据始终在本机。",
      "--format", "json"
    ], { timeout: 60000 });
    const createdData = created?.data ?? created ?? {};
    const spaceId = String(
      createdData?.data?.space_id
      || createdData?.space_id
      || createdData?.data?.space?.space_id
      || createdData?.space?.space_id
      || ""
    );
    if (!spaceId) throw new Error("创建飞书镜像空间失败：未返回 space_id。");
    this.state.spaceId = spaceId;
    this.saveState();
    return spaceId;
  }

  async wikiChildren(spaceId, parentNodeToken = "") {
    const args = ["wiki", "+node-list", "--space-id", spaceId, "--page-all", "--format", "json"];
    if (parentNodeToken) args.push("--parent-node-token", parentNodeToken);
    const response = await this.runLark(args, { timeout: 120000 });
    const data = response?.data ?? response ?? {};
    // lark-cli 返回 { data: { nodes: [...] } }（部分版本用 items）。
    const items = data?.data?.nodes || data?.data?.items || data?.nodes || data?.items || [];
    return Array.isArray(items) ? items : [];
  }

  async createChildNode(spaceId, parentToken, title) {
    const args = [
      "wiki", "+node-create",
      "--space-id", spaceId,
      "--title", title,
      "--obj-type", "docx",
      "--format", "json"
    ];
    if (parentToken) args.push("--parent-node-token", parentToken);
    const response = await this.runLark(args, { timeout: 120000 });
    const data = response?.data ?? response ?? {};
    const node = data?.data?.node || data?.node || data?.data || data;
    const token = String(node?.node_token || node?.nodeToken || "");
    if (!token) throw new Error(`创建 Wiki 目录节点《${title}》失败：未返回 node_token。`);
    return token;
  }

  // Find-or-create the directory chain for a relative path, using the ledger
  // cache first and only listing/creating lazily.
  async ensureFolderChain(spaceId, chain) {
    let parentToken = "";
    let chainPath = "";
    for (const segment of chain) {
      chainPath = chainPath ? `${chainPath}/${segment}` : segment;
      const cached = this.state.folders[chainPath];
      if (cached?.nodeToken) {
        parentToken = cached.nodeToken;
        continue;
      }
      const children = await this.wikiChildren(spaceId, parentToken);
      const wanted = segment.trim();
      const hit = children.find((child) =>
        String(child?.title || child?.name || "").trim() === wanted
        && String(child?.obj_type || child?.objType || "docx") === "docx"
      );
      const token = hit?.node_token
        ? String(hit.node_token)
        : await this.createChildNode(spaceId, parentToken, wanted);
      this.state.folders[chainPath] = { nodeToken: token };
      this.saveState();
      parentToken = token;
    }
    return parentToken;
  }

  // 镜像宽松模式：本地相对 md 链接在飞书里是死链。改写为已镜像文档的飞书
  // URL（同批次先同步原文再同步卡片，账本里能查到）；尚未镜像则降为纯文字。
  rewriteRelativeMarkdownLinks(markdown, relativeDir) {
    return String(markdown || "").replace(
      /\[([^\]]*)\]\(([^)\s]+\.md)(?:#[^)\s]*)?\)/g,
      (full, text, target) => {
        if (/^(https?:|file:|mailto:|#|domi:)/i.test(target)) return full;
        const normalized = target.replace(/^\.[\\/]*/, "").replace(/\\/g, "/");
        const relativePath = relativeDir ? `${relativeDir}/${normalized}` : normalized;
        const mirrored = this.state.documents[relativePath]?.url;
        if (/^https?:\/\//i.test(String(mirrored || ""))) return `[${text}](${mirrored})`;
        return `${text}（见本机资料库）`;
      }
    );
  }

  // 飞书按「位置」重编号有序列表（实验验证：孤立的 "2." 回读为 "1."；
  // "1."+空行+"3." 回读为 "1."+"2."；连续且编号与位置一致时原样保留；
  // "2\." 转义后按字面文本保留、回读还原为 "2."）。因此书写编号与列表内
  // 位置序号不一致的项必须转义句点，否则回读保真校验必然失败；空行不会
  // 中断列表，非列表正文行才会。校验 token 化本来就会剔除转义反斜杠，
  // 两侧等价。
  static escapeLoneOrderedListStarts(markdown) {
    const lines = String(markdown || "").split("\n");
    let inFence = false;
    const marker = /^(\s*)((?:>\s?)*)(\d+)\.(?=\s|$)/;
    let last = null; // 最近一个列表项的 { prefix, position }
    return lines.map((line) => {
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return line; }
      if (inFence) return line;
      const match = line.match(marker);
      if (!match) {
        // 非空的非列表行中断当前列表；空行不影响（飞书视空行为列表内分隔）。
        if (line.trim()) last = null;
        return line;
      }
      const prefix = match[2];
      const written = Number(match[3]);
      const position = last && last.prefix === prefix ? last.position + 1 : 1;
      last = { prefix, position };
      if (written === position) return line;
      return line.replace(marker, `$1$2${written}\\.`);
    }).join("\n");
  }

  // 下载远程图片到库内隐藏缓存（.domi-mirror-assets，点开头目录不会被镜像
  // 扫描收录），并把图片语法改写为本地绝对路径，交给本地资产上传管线。
  // 任一环节失败都保持原远程语法，不阻塞镜像。
  async materializeRemoteImages(markdown) {
    const source = String(markdown || "");
    if (typeof fetch !== "function" || !this.libraryRoot) return source;
    const urls = [...new Set([...source.matchAll(/!\[[^\]]*\]\(\s*(https?:\/\/[^)\s'"]+)/g)].map((match) => match[1]))];
    if (!urls.length) return source;
    const cacheRoot = path.join(this.libraryRoot, REMOTE_ASSET_CACHE_DIR);
    try { fs.mkdirSync(cacheRoot, { recursive: true }); } catch { return source; }
    const downloaded = new Map();
    for (const url of urls.slice(0, MAX_REMOTE_ASSETS_PER_DOCUMENT)) {
      const key = crypto.createHash("sha1").update(url).digest("hex").slice(0, 20);
      try {
        let target = "";
        for (const extension of REMOTE_ASSET_EXTENSIONS) {
          const candidate = path.join(cacheRoot, `${key}.${extension}`);
          if (fs.existsSync(candidate)) { target = candidate; break; }
        }
        if (!target) {
          const response = await fetch(url, {
            signal: AbortSignal.timeout(REMOTE_ASSET_TIMEOUT_MS),
            headers: { "user-agent": "Mozilla/5.0 (compatible; domi-mirror/1.0)" }
          });
          if (!response?.ok) continue;
          const buffer = Buffer.from(await response.arrayBuffer());
          const extension = imageExtensionFromMagic(buffer);
          if (!extension || !buffer.length || buffer.length > REMOTE_ASSET_MAX_BYTES) continue;
          target = path.join(cacheRoot, `${key}.${extension}`);
          fs.writeFileSync(target, buffer);
        }
        downloaded.set(url, target);
      } catch {
        // 单张下载失败：保持远程语法，不阻塞整篇镜像。
      }
    }
    if (!downloaded.size) return source;
    return source.replace(
      /!\[([^\]]*)\]\(\s*(https?:\/\/[^)\s'"]+)(?:\s+["'][^"']*["'])?\s*\)/g,
      (full, alt, url) => (downloaded.has(url) ? `![${alt}](${downloaded.get(url)})` : full)
    );
  }

  async prepareDocument(filePath, relativePath) {
    const stat = await fs.promises.stat(filePath);
    if (stat.size > MAX_DOCUMENT_BYTES) {
      throw new Error(`${path.basename(filePath)} 超过 8 MB，跳过镜像。`);
    }
    const bytes = await fs.promises.readFile(filePath);
    const original = bytes.toString("utf8");
    const directory = path.dirname(String(relativePath || ""));
    const relativeDir = directory && directory !== "." ? directory.split(path.sep).join("/") : "";
    const { isSubscriptionDigest, digestDisplayTitle } = require("./subscription-digest.cjs");
    const title = isSubscriptionDigest(filePath) ? digestDisplayTitle(original, filePath) : path.basename(filePath, path.extname(filePath));
    // 宽松模式：远程图片保留原样（飞书可直接渲染大部分 https 图片），
    // 本地相对链接改写为镜像 URL；不为 100% 保真阻塞镜像。
    // Remove managed comments before preparing so the frontmatter parser can
    // recognize YAML at the start. Internal metadata is not document prose.
    const processed = this.rewriteRelativeMarkdownLinks(original.replace(/<!-- domi:managed:(?:start|end) -->\s*/g, ""), relativeDir);
    const withLocalImages = await this.materializeRemoteImages(processed);
    const prepared = prepareMarkdownForFeishu({
      markdown: FeishuWikiMirror.escapeLoneOrderedListStarts(withLocalImages),
      sourcePath: filePath,
      libraryRoot: this.libraryRoot,
      title
    });
    return {
      ...prepared,
      title: prepared.title || title,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex")
    };
  }

  // 飞书 markdown 导入是异步的：刚写入的文档立即回读会拿到空内容，
  // 需要等待后重试几次再做保真校验。
  async fetchDocumentWithRetry(documentId, attempts = this.verificationAttempts, delayMs = this.verificationDelayMs, prepared = null) {
    let lastContent = "";
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetched = await this.runLark([
        "docs", "+fetch",
        "--doc", documentId,
        "--doc-format", "markdown",
        "--format", "json"
      ], { timeout: 120000 });
      const data = fetched?.data ?? fetched ?? {};
      const document = data?.data?.document || data?.document || data?.data || {};
      lastContent = typeof document?.content === "string" ? document.content : "";
      if (prepared ? verifyMirrorText(prepared, lastContent).ok : lastContent.trim()) return lastContent;
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return lastContent;
  }

  async verifyFidelity(documentId, prepared) {
    const content = await this.fetchDocumentWithRetry(documentId, this.verificationAttempts, this.verificationDelayMs, prepared);
    if (!content.trim()) {
      return { ok: false, message: "飞书文档回读多次仍为空，可能导入仍在进行，稍后自动重试同步。" };
    }
    return verifyMirrorText(prepared, content);
  }

  async writeDocument(spaceId, parentToken, entry, filePath, relativePath) {
    const prepared = await this.prepareDocument(filePath, relativePath);
    // 宽松模式：预检 blocked（远程图片/相对链接）不再阻塞——内容完整可读，
    // 本地图片仍正常上传，只是不承诺与源文件 100% 等价。
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-wiki-mirror-"));
    let documentId = String(entry?.documentId || "");
    let nodeToken = String(entry?.nodeToken || "");
    let url = String(entry?.url || "");
    try {
      fs.writeFileSync(path.join(temporaryDirectory, "content.md"), prepared.content, "utf8");
      // 账本无记录但目标目录已存在同名文档（历史孤儿：上次同步在保真校验前
      // 中断）时，复用该文档走 update，避免重复创建。
      if (!documentId) {
        const siblings = await this.wikiChildren(spaceId, parentToken);
        const orphan = siblings.find((child) =>
          String(child?.title || "").trim() === prepared.title.trim()
          && String(child?.obj_type || child?.objType || "docx") === "docx");
        if (orphan) {
          documentId = String(orphan.obj_token || orphan.objToken || "");
          nodeToken = String(orphan.node_token || orphan.nodeToken || "");
          // 复用孤儿文档时 update 不会返回链接，用 node-get 补齐 url。
          try {
            const resolved = await this.runLark([
              "wiki", "+node-get",
              "--node-token", documentId,
              "--obj-type", "docx",
              "--space-id", spaceId,
              "--format", "json"
            ], { timeout: 60000 });
            const rdata = resolved?.data ?? resolved ?? {};
            const node = rdata?.data?.node || rdata?.node || rdata?.data || {};
            url = String(node?.url || node?.wiki_url || node?.wikiUrl || node?.node_url || node?.nodeUrl || node?.document_url || node?.documentUrl || "");
            nodeToken = String(node?.node_token || node?.nodeToken || nodeToken);
          } catch {
            // node-get 失败不阻塞：url 允许为空，后面再兜底构造。
          }
        }
      }
      if (documentId) {
        await this.runLark([
          "docs", "+update",
          "--doc", documentId,
          "--command", "overwrite",
          "--doc-format", "markdown",
          "--content", "@content.md",
          "--format", "json"
        ], { cwd: temporaryDirectory, timeout: 180000 });
      } else {
        const created = await this.runLark([
          "docs", "+create",
          "--doc-format", "markdown",
          "--title", prepared.title,
          "--content", "@content.md",
          "--parent-token", parentToken,
          "--format", "json"
        ], { cwd: temporaryDirectory, timeout: 180000 });
        const data = created?.data ?? created ?? {};
        const document = data?.data?.document || data?.document || data?.data || {};
        documentId = String(document?.document_id || document?.documentId || "");
        nodeToken = String(document?.node_token || document?.nodeToken || "");
        url = String(document?.url || document?.document_url || document?.documentUrl || "");
        if (!documentId) throw new Error(`飞书创建《${prepared.title}》后未返回文档 ID。`);
        if (!nodeToken) {
          const resolved = await this.runLark([
            "wiki", "+node-get",
            "--node-token", documentId,
            "--obj-type", "docx",
            "--space-id", spaceId,
            "--format", "json"
          ], { timeout: 60000 });
          const resolvedData = resolved?.data ?? resolved ?? {};
          const node = resolvedData?.data?.node || resolvedData?.node || resolvedData?.data || {};
          nodeToken = String(node?.node_token || node?.nodeToken || "");
          url = url || String(node?.url || "");
        }
      }
      for (const asset of prepared.assets || []) {
        await placeFeishuAssetAtMarker({
          runLark: this.runLark,
          documentId,
          asset
        });
      }
    } finally {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
    const verification = await this.verifyFidelity(documentId, prepared);
    if (!verification.ok) throw new Error(verification.message);
    if (!/^https?:\/\//i.test(url) && documentId) {
      // 兑底：从账本已有条目提取租户前缀构造 docx 直链（孤儿复用路径 update
      // 不回传 url 时 node-get 也可能缺字段）。
      const knownUrl = Object.values(this.state.documents || {})
        .find((doc) => /^https?:\/\//.test(String(doc?.url || "")))?.url;
      const tenant = String(knownUrl || "").match(/^(https?:\/\/[^/]+)/)?.[1];
      if (tenant) url = `${tenant}/docx/${documentId}`;
    }
    if (!/^https?:\/\//i.test(url)) {
      throw new Error(`《${prepared.title}》写入成功但未获得在线链接，无法在手机端打开。`);
    }
    return { sha256: prepared.sha256, documentId, nodeToken, url,
      textCoverage: verification.textCoverage, verificationVersion: verification.verificationVersion,
      textSha256: verification.textSha256 };
  }

  async sync(options = {}) {
    this.loadState();
    const startedAt = Date.now();
    if (!this.libraryRoot || !fs.existsSync(this.libraryRoot)) {
      return { ok: false, error: "本地资料库目录不可用，无法镜像。" };
    }
    const spaceId = await this.ensureSpace();
    const targets = (await mirrorTargetFilesAsync(this.libraryRoot)).filter((target) =>
      !options.relativePaths || options.relativePaths.includes(target.relativePath));
    const result = { ok: true, spaceId, total: targets.length, created: 0, updated: 0, verified: 0, skipped: 0, failed: 0, failures: [] };
    for (const target of targets) {
      const relativePath = target.relativePath;
      const entry = this.state.documents[relativePath];
      let sha;
      try {
        const stat = await fs.promises.stat(target.path);
        if (stat.size > MAX_DOCUMENT_BYTES) throw new Error("超过 8 MB，跳过镜像。");
        sha = await sha256FileAsync(target.path);
      } catch (error) {
        result.failed += 1;
        result.failures.push({ relativePath, error: error instanceof Error ? error.message : String(error) });
        continue;
      }
      if (entry?.sha256 === sha && entry?.documentId && entry?.url
          && entry.verificationVersion === TEXT_VERIFICATION_VERSION && entry.textCoverage === 1) {
        result.skipped += 1;
        continue;
      }
      try {
        if (entry?.sha256 === sha && entry?.documentId && entry?.url) {
          const verification = await this.verifyFidelity(entry.documentId, await this.prepareDocument(target.path, relativePath));
          if (verification.ok) {
            this.state.documents[relativePath] = { ...entry, textCoverage: 1,
              verificationVersion: verification.verificationVersion, textSha256: verification.textSha256,
              verifiedAt: Date.now() };
            result.verified += 1;
            this.saveState();
            continue;
          }
        }
        const stat = await fs.promises.stat(target.path);
        if (stat.size > MAX_DOCUMENT_BYTES) {
          throw new Error("超过 8 MB，跳过镜像。");
        }
        const parentToken = entry?.documentId ? "" : await this.ensureFolderChain(spaceId, directoryChainOf(relativePath));
        const written = await this.writeDocument(spaceId, parentToken, entry, target.path, relativePath);
        this.state.documents[relativePath] = {
          sha256: written.sha256,
          documentId: written.documentId,
          nodeToken: written.nodeToken,
          url: written.url,
          textCoverage: written.textCoverage,
          verificationVersion: written.verificationVersion,
          textSha256: written.textSha256,
          syncedAt: Date.now()
        };
        if (entry?.documentId) result.updated += 1;
        else result.created += 1;
        this.saveState();
      } catch (error) {
        result.failed += 1;
        result.failures.push({ relativePath, error: error instanceof Error ? error.message : String(error) });
        this.logger(`mirror failed ${relativePath}: ${error instanceof Error ? error.message : error}`);
      }
    }
    this.saveState();
    result.ok = result.failed === 0;
    this.logger(`sync done: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed in ${Math.round((Date.now() - startedAt) / 1000)}s`);
    return result;
  }

  // Ledger lookup used by the inbox query handler: absolute document path →
  // mirrored Feishu URL (so queries replied into the group can link straight
  // to the readable cloud copy). Reloads the ledger each call so answers
  // stay fresh even if the last sync ran in another process.
  mirroredUrlFor(absolutePath) {
    this.loadState();
    try {
      const relativePath = path.relative(this.libraryRoot, absolutePath).split(path.sep).join("/");
      if (relativePath.startsWith("..")) return "";
      return String(this.state.documents[relativePath]?.url || "");
    } catch {
      return "";
    }
  }

  loadLedgerOnly() {
    this.loadState();
  }
}

module.exports = {
  FeishuWikiMirror,
  MIRROR_SPACE_NAME,
  directoryChainOf,
  isMirrorTarget,
  isMirrorWatchTarget,
  mirrorTargetFiles,
  mirrorTargetFilesAsync,
  sha256File,
  sha256FileAsync,
  verifyMirrorText,
  escapeLoneOrderedListStarts: (markdown) => FeishuWikiMirror.escapeLoneOrderedListStarts(markdown)
};
