const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DOMI_WORKSPACE_DIRECTORY = "domi工作区";
const LOCAL_TODO_DOCUMENT_NAME = "0.待办事项.md";
const LOCAL_TODO_DOCUMENT_CONTENT = `# 待办事项

> 本文档用于 domi 本地待办事项维护。初始化和升级不会覆盖已有内容。

## 关键节点

## 新入库约见

## 人脉跟进

## 项目跟踪

<pre lang="json" caption="domi-task-board-v1"><code>{
  "schemaVersion": 1,
  "updatedAt": "1970-01-01T00:00:00.000Z",
  "tasks": []
}</code></pre>
`;
const DOCUMENT_LIBRARY_DIRECTORIES = Object.freeze([
  "01.能源与电力",
  "02.数据中心基础设施",
  "03.算力芯片",
  "04.服务器与整机制造",
  "05.互联与网络",
  "06.云与算力服务",
  "07.模型层",
  "08.基础软件与工具链",
  "09.Agent与平台",
  "10.应用",
  "11.终端与具身",
  "_其他行业",
  "12.人脉",
  "13.认知库"
]);
// Pre-chain workspace layout. Content found under these roots is migrated
// into the chain layout on the next ensureDocumentLibraryStructure call.
const LEGACY_LIBRARY_DIRECTORIES = Object.freeze([
  "1.行业研究",
  "2.行业动态",
  "3.项目库",
  "4.人脉库"
]);
// legacy 一级领域 → 产业链链段。未列出的旧领域进入 _其他行业。
const LEGACY_DOMAIN_SEGMENTS = Object.freeze({
  "AI": "07.模型层",
  "半导体": "03.算力芯片",
  "能源": "01.能源与电力",
  "企业软件": "08.基础软件与工具链",
  "具身智能&机器人": "11.终端与具身",
  "智能出行": "11.终端与具身"
});
const FALLBACK_SEGMENT_DIRECTORY = "_其他行业";
const DOCUMENT_EXTENSIONS = new Map([
  [".md", "markdown"],
  [".markdown", "markdown"],
  [".pdf", "pdf"]
]);

function expandHomePath(value) {
  const input = String(value || "").trim();
  return input.startsWith("~/") ? path.join(os.homedir(), input.slice(2)) : input;
}

function domiWorkspaceRoot(selectedDirectory) {
  const input = String(selectedDirectory || "").trim();
  if (!input) return "";
  const normalized = path.normalize(input);
  return path.basename(normalized) === DOMI_WORKSPACE_DIRECTORY
    ? normalized
    : path.join(normalized, DOMI_WORKSPACE_DIRECTORY);
}

function documentLibraryLocation(settings = {}) {
  const repositoryRoot = expandHomePath(settings.localRepositoryDir);
  const materialsRoot = expandHomePath(settings.localLibraryDir);
  const legacyLibraryRoot = materialsRoot && path.basename(path.resolve(materialsRoot)) === "3.项目库"
    ? path.dirname(path.resolve(materialsRoot))
    : materialsRoot;
  const configuredRoot = repositoryRoot || legacyLibraryRoot;
  if (!configuredRoot || !path.isAbsolute(configuredRoot)) {
    throw new Error("尚未配置本地文档库目录，请先在“资料连接”中选择目录。");
  }
  return {
    rootPath: path.resolve(configuredRoot),
    initializeStructure: Boolean(repositoryRoot)
  };
}

function isInsideRoot(rootPath, candidatePath, allowRoot = true) {
  const relative = path.relative(rootPath, candidatePath);
  if (!relative) return allowRoot;
  return relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative);
}

function assertInsideRoot(rootPath, candidatePath, allowRoot = true) {
  const resolved = path.resolve(candidatePath);
  if (!isInsideRoot(rootPath, resolved, allowRoot)) {
    throw new Error("文档操作只能在当前本地文档库内进行。");
  }
  return resolved;
}

function ensureLocalTodoDocument(rootPath) {
  const todoDocumentPath = path.join(rootPath, LOCAL_TODO_DOCUMENT_NAME);
  try {
    fs.writeFileSync(todoDocumentPath, LOCAL_TODO_DOCUMENT_CONTENT, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const stat = fs.lstatSync(todoDocumentPath);
    if (!stat.isFile()) {
      throw new Error(`${LOCAL_TODO_DOCUMENT_NAME} 已存在，但不是普通文件。`);
    }
  }
  return todoDocumentPath;
}

// Idempotent migration from the pre-chain layout into the chain layout.
// Runs on every ensureDocumentLibraryStructure call; once a legacy root is
// empty it is removed, so subsequent runs are no-ops.
function migrateLegacyLibraryLayout(rootPath) {
const newsFrontmatterDomains = (filePath) => {
try {
const content = fs.readFileSync(filePath, "utf8");
const head = content.split("---")[1] || "";
const match = head.match(/^domains:\s*\[(.*)\]/m);
if (match) {
  return match[1].split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}
// 认知文章原文页用普通列表头（“- 行业：AI、企业软件”）而非 YAML frontmatter。
const headerMatch = content.match(/^- 行业：(.+)$/m);
if (headerMatch) {
  return headerMatch[1].split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
}
return [];
} catch {
return [];
}
};
  const segmentDirectoryForDomain = (domain) =>
    LEGACY_DOMAIN_SEGMENTS[domain] || FALLBACK_SEGMENT_DIRECTORY;
  const moveIfExists = (from, to) => {
    if (!fs.existsSync(from)) return;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    // Never overwrite: keep both by suffixing when the target already exists.
    let target = to;
    if (fs.existsSync(target)) {
      const suffix = Date.now().toString(36);
      target = to.replace(/(\.[^.]+)?$/, (ext) => `-${suffix}${ext || ""}`);
    }
    fs.renameSync(from, target);
  };

  // 2.行业动态/YYYY/MM/... → <链段>/_行业认知/动态/YYYY/MM/...
  const legacyNewsRoot = path.join(rootPath, "2.行业动态");
  if (fs.existsSync(legacyNewsRoot)) {
    for (const yearEntry of fs.readdirSync(legacyNewsRoot, { withFileTypes: true })) {
      if (!yearEntry.isDirectory()) {
        moveIfExists(path.join(legacyNewsRoot, yearEntry.name),
          path.join(rootPath, FALLBACK_SEGMENT_DIRECTORY, "_行业认知", "动态", yearEntry.name));
        continue;
      }
      const yearPath = path.join(legacyNewsRoot, yearEntry.name);
      for (const monthEntry of fs.readdirSync(yearPath, { withFileTypes: true })) {
        const monthPath = path.join(yearPath, monthEntry.name);
        if (!monthEntry.isDirectory()) {
          moveIfExists(monthPath, path.join(rootPath, FALLBACK_SEGMENT_DIRECTORY, "_行业认知", "动态", yearEntry.name, monthEntry.name));
          continue;
        }
        for (const fileEntry of fs.readdirSync(monthPath, { withFileTypes: true })) {
          const filePath = path.join(monthPath, fileEntry.name);
          const domains = fileEntry.isFile() && fileEntry.name.endsWith(".md")
            ? newsFrontmatterDomains(filePath)
            : [];
          const segment = segmentDirectoryForDomain(domains[0] || "");
          moveIfExists(filePath,
            path.join(rootPath, segment, "_行业认知", "动态", yearEntry.name, monthEntry.name, fileEntry.name));
        }
        try {
          fs.rmdirSync(monthPath);
        } catch {
          // Still has unmigrated content; leave for the next run.
        }
      }
      try {
        fs.rmdirSync(yearPath);
      } catch {
        // Still has unmigrated content; leave for the next run.
      }
    }
  }

  // 3.项目库/<旧领域>/[<子领域>/]<项目> → <链段>/[<环节>/]<项目>
  const legacyProjectsRoot = path.join(rootPath, "3.项目库");
  if (fs.existsSync(legacyProjectsRoot)) {
    for (const domainEntry of fs.readdirSync(legacyProjectsRoot, { withFileTypes: true })) {
      const domainPath = path.join(legacyProjectsRoot, domainEntry.name);
      if (!domainEntry.isDirectory()) continue;
      const segment = segmentDirectoryForDomain(domainEntry.name);
      for (const secondEntry of fs.readdirSync(domainPath, { withFileTypes: true })) {
        if (!secondEntry.isDirectory()) continue;
        const secondPath = path.join(domainPath, secondEntry.name);
        // Old layout: <领域>/<项目> when unclassified, <领域>/<子领域>/<项目> otherwise.
        const hasNestedProjects = fs.readdirSync(secondPath, { withFileTypes: true })
          .some((entry) => entry.isDirectory());
if (hasNestedProjects && secondEntry.name !== "_未分类") {
for (const projectEntry of fs.readdirSync(secondPath, { withFileTypes: true })) {
if (!projectEntry.isDirectory()) continue;
moveIfExists(path.join(secondPath, projectEntry.name),
path.join(rootPath, segment, secondEntry.name, projectEntry.name));
}
try {
fs.rmdirSync(secondPath);
} catch {
// Non-directory leftovers remain; leave for the next run.
}
} else if (secondEntry.name === "_未分类") {
// _未分类 只是占位层：内部条目直接上移到 <链段>/ 下。
for (const nestedEntry of fs.readdirSync(secondPath, { withFileTypes: true })) {
moveIfExists(path.join(secondPath, nestedEntry.name),
path.join(rootPath, segment, nestedEntry.name));
}
try {
fs.rmdirSync(secondPath);
} catch {
// Still unmigrated content; leave for the next run.
}
} else {
moveIfExists(secondPath, path.join(rootPath, segment, secondEntry.name));
}
}
// 领域目录搬空后直接删除（如 _未分类 占位层）；仍有内容则留给下一次运行。
try {
fs.rmdirSync(domainPath);
} catch {
// Domain-level content remains; leave for the next run.
}
}
}

  // 4.人脉库/<姓名> → 12.人脉/<姓名>
  const legacyPeopleRoot = path.join(rootPath, "4.人脉库");
  if (fs.existsSync(legacyPeopleRoot)) {
    for (const personEntry of fs.readdirSync(legacyPeopleRoot, { withFileTypes: true })) {
      if (!personEntry.isDirectory()) continue;
      moveIfExists(path.join(legacyPeopleRoot, personEntry.name),
        path.join(rootPath, "12.人脉", personEntry.name));
    }
  }

  // 1.行业研究/** → <链段>/_行业认知/主题研究/** （无法识别领域的归 _其他行业）
  const legacyResearchRoot = path.join(rootPath, "1.行业研究");
  if (fs.existsSync(legacyResearchRoot)) {
    const migrateResearch = (relative) => {
      const sourcePath = path.join(legacyResearchRoot, relative);
      const [firstComponent, ...rest] = relative.split(path.sep);
      const segment = segmentDirectoryForDomain(firstComponent);
      const relativeRest = rest.length ? rest.join(path.sep) : firstComponent;
      moveIfExists(sourcePath,
        path.join(rootPath, segment, "_行业认知", "主题研究", relativeRest));
    };
    const walk = (relative) => {
      for (const entry of fs.readdirSync(path.join(legacyResearchRoot, relative), { withFileTypes: true })) {
        const childRelative = relative ? path.join(relative, entry.name) : entry.name;
        if (entry.isDirectory()) walk(childRelative);
        else migrateResearch(childRelative);
      }
    };
    walk("");
  }

  // Drop the legacy roots once they are empty.
  for (const directory of LEGACY_LIBRARY_DIRECTORIES) {
    const legacyRoot = path.join(rootPath, directory);
    if (!fs.existsSync(legacyRoot)) continue;
    try {
      fs.rmdirSync(legacyRoot);
    } catch {
      // Not empty yet — the content moves above only relocate what they
      // recognise; anything left stays put and the root remains visible.
    }
  }
}

function ensureDocumentLibraryStructure(rootPath) {
  fs.mkdirSync(rootPath, { recursive: true });
  ensureLocalTodoDocument(rootPath);
  migrateLegacyLibraryLayout(rootPath);
  for (const directory of DOCUMENT_LIBRARY_DIRECTORIES) {
    fs.mkdirSync(path.join(rootPath, directory), { recursive: true });
  }
}

function documentNode(rootPath, filePath, name, stat, kind, children) {
  let displayName;
  if (kind === "markdown" && /[A-Za-z]{3}/.test(name)) {
    let descriptor;
    try {
      descriptor = fs.openSync(filePath, "r");
      const buffer = Buffer.alloc(16 * 1024);
      const count = fs.readSync(descriptor, buffer, 0, buffer.length, 0);
      const header = buffer.subarray(0, count).toString("utf8");
      const title = header.match(/^#\s+(.+)$/m)?.[1]?.trim();
      if (title && /[\u3400-\u9fff]/.test(title)
        && /<!-- domi:(?:managed|translation):start -->/.test(header)) {
        displayName = `${name.match(/^\d{8}/)?.[0] || ""}${title}${path.extname(name)}`;
      }
    } catch { /* Keep the filesystem name while a document is being saved. */ }
    finally { if (descriptor !== undefined) fs.closeSync(descriptor); }
  }
  return {
    kind,
    name,
    ...(displayName ? { displayName } : {}),
    path: filePath,
    relativePath: path.relative(rootPath, filePath),
    size: kind === "folder" ? 0 : Number(stat.size) || 0,
    mtimeMs: Number(stat.mtimeMs) || 0,
    ...(children ? { children } : {})
  };
}

function compareNodes(left, right) {
  if (left.kind === "folder" && right.kind !== "folder") return -1;
  if (right.kind === "folder" && left.kind !== "folder") return 1;
  return left.name.localeCompare(right.name, "zh-CN", {
    numeric: true,
    sensitivity: "base"
  });
}

function listDocumentLibrary(rootPath, options = {}) {
  const resolvedRoot = path.resolve(rootPath);
  const maximumDepth = Math.min(Math.max(Number(options.maximumDepth) || 24, 1), 24);
  const maximumNodes = Math.min(Math.max(Number(options.maximumNodes) || 20_000, 100), 50_000);
  let nodeCount = 0;
  let documentCount = 0;
  let folderCount = 0;
  let truncated = false;

  function scan(directoryPath, depth) {
    if (depth > maximumDepth || nodeCount >= maximumNodes) {
      truncated = true;
      return [];
    }
    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    const nodes = [];
    for (const entry of entries) {
      if (nodeCount >= maximumNodes) {
        truncated = true;
        break;
      }
      if (!entry.name || entry.name.startsWith(".")) continue;
      const entryPath = assertInsideRoot(resolvedRoot, path.join(directoryPath, entry.name), false);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        nodeCount += 1;
        folderCount += 1;
        nodes.push(documentNode(
          resolvedRoot,
          entryPath,
          entry.name,
          { size: 0, mtimeMs: 0 },
          "folder",
          scan(entryPath, depth + 1)
        ));
        continue;
      }
      if (!entry.isFile()) continue;
      const kind = DOCUMENT_EXTENSIONS.get(path.extname(entry.name).toLowerCase());
      if (!kind) continue;
      let stat;
      try {
        stat = fs.statSync(entryPath);
      } catch {
        continue;
      }
      nodeCount += 1;
      documentCount += 1;
      nodes.push(documentNode(resolvedRoot, entryPath, entry.name, stat, kind));
    }
    return nodes.sort(compareNodes);
  }

  const stat = fs.statSync(resolvedRoot);
  if (!stat.isDirectory()) {
    throw new Error("配置的本地文档库路径不是文件夹。");
  }
  const nodes = scan(resolvedRoot, 1);
  return {
    ok: true,
    rootPath: resolvedRoot,
    rootName: path.basename(resolvedRoot) || resolvedRoot,
    nodes,
    documentCount,
    folderCount,
    truncated,
    scannedAt: Date.now()
  };
}

function normalizeEntryName(value, kind) {
  let name = String(value || "").trim();
  if (!name) throw new Error(kind === "folder" ? "文件夹名称不能为空。" : "文档名称不能为空。");
  if (name === "." || name === ".." || /[\/\\:\0]/.test(name)) {
    throw new Error("名称不能包含路径分隔符、冒号或空字符。");
  }
  if (name.startsWith(".")) {
    throw new Error("名称不能以“.”开头。");
  }
  if (kind === "markdown" && !/\.(?:md|markdown)$/i.test(name)) {
    name = `${name}.md`;
  }
  if (kind === "markdown" && !/\.(?:md|markdown)$/i.test(name)) {
    throw new Error("新建文档必须使用 .md 或 .markdown 扩展名。");
  }
  return name;
}

function createDocumentLibraryEntry(rootPath, request = {}) {
  const resolvedRoot = path.resolve(rootPath);
  const kind = request.kind === "folder" ? "folder" : "markdown";
  const parentPath = assertInsideRoot(
    resolvedRoot,
    request.parentPath ? request.parentPath : resolvedRoot
  );
  const parentStat = fs.statSync(parentPath);
  if (!parentStat.isDirectory()) {
    throw new Error("请选择一个文件夹作为新内容的位置。");
  }
  const name = normalizeEntryName(request.name, kind);
  const targetPath = assertInsideRoot(resolvedRoot, path.join(parentPath, name), false);
  if (fs.existsSync(targetPath)) {
    throw new Error(`“${name}”已经存在。`);
  }
  if (kind === "folder") {
    fs.mkdirSync(targetPath);
  } else {
    const title = name.replace(/\.(?:md|markdown)$/i, "");
    fs.writeFileSync(targetPath, `# ${title}\n`, { encoding: "utf8", flag: "wx" });
  }
  return {
    ok: true,
    kind,
    path: targetPath,
    name
  };
}

module.exports = {
  DOMI_WORKSPACE_DIRECTORY,
  DOCUMENT_LIBRARY_DIRECTORIES,
  LOCAL_TODO_DOCUMENT_CONTENT,
  LOCAL_TODO_DOCUMENT_NAME,
  assertInsideRoot,
  createDocumentLibraryEntry,
  documentLibraryLocation,
  domiWorkspaceRoot,
  ensureDocumentLibraryStructure,
  ensureLocalTodoDocument,
  isInsideRoot,
  listDocumentLibrary,
  migrateLegacyLibraryLayout,
  normalizeEntryName
};
