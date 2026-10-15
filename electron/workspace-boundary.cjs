const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function expandUserPath(value) {
  const raw = String(value || "").trim();
  if (raw === "~") return os.homedir();
  if (raw.startsWith(`~${path.sep}`)) return path.join(os.homedir(), raw.slice(2));
  return raw;
}

function existingDirectoryRealPath(value) {
  const expanded = expandUserPath(value);
  if (!expanded) return "";
  try {
    const resolved = fs.realpathSync.native(path.resolve(expanded));
    return fs.statSync(resolved).isDirectory() ? resolved : "";
  } catch {
    return "";
  }
}

function stableDescendantRealPath(rootValue, candidateValue, { allowRoot = true } = {}) {
  const expandedRoot = expandUserPath(rootValue);
  const expandedCandidate = expandUserPath(candidateValue);
  if (!expandedRoot || !expandedCandidate) return "";
  const rawRoot = path.resolve(expandedRoot);
  const rawCandidate = path.resolve(expandedCandidate);
  const root = existingDirectoryRealPath(rawRoot);
  const candidate = existingDirectoryRealPath(rawCandidate);
  if (!root || !candidate) return "";
  const rawRelative = path.relative(rawRoot, rawCandidate);
  const canonicalRelative = path.relative(root, rawCandidate);
  const relative = rawRelative === ""
    || (!rawRelative.startsWith(`..${path.sep}`) && rawRelative !== ".." && !path.isAbsolute(rawRelative))
    ? rawRelative
    : canonicalRelative;
  const rawDescendant = relative === ""
    || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
  if (!rawDescendant || (!allowRoot && relative === "")) return "";
  const withinRealRoot = candidate === root
    || candidate.startsWith(`${root}${path.sep}`);
  if (!withinRealRoot) return "";

  // The configured root itself may legitimately be reached through an alias
  // (for example /var -> /private/var or a user-selected symlink). Symlinks
  // below that root are never accepted, because they can silently redirect a
  // project workspace to another project or outside the library.
  let cursor = rawRelative === relative ? rawRoot : root;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    try {
      if (fs.lstatSync(cursor).isSymbolicLink()) return "";
    } catch {
      return "";
    }
  }
  return candidate;
}

function pathIsWithin(rootPath, candidatePath, { allowRoot = true } = {}) {
  const root = existingDirectoryRealPath(rootPath);
  const candidate = existingDirectoryRealPath(candidatePath);
  return Boolean(root && candidate)
    && ((allowRoot && candidate === root) || candidate.startsWith(`${root}${path.sep}`));
}

// Trusted entity workspace roots under the local repository. The chain layout
// spreads projects across the numbered segment directories, so every segment
// root plus the people root is trusted. The repository root itself stays
// untrusted (task workspaces must never be created at the library root).
const CHAIN_SEGMENT_DIRECTORIES = Object.freeze([
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
  "_其他行业"
]);

function entityWorkspaceRoots(settings = {}) {
  if (settings.storageBackend !== "local" || !settings.localRepositoryDir) return [];
  const repositoryRootRaw = path.resolve(expandUserPath(settings.localRepositoryDir));
  if (!existingDirectoryRealPath(repositoryRootRaw)) return [];
  return [
    // Chain layout (current).
    ...CHAIN_SEGMENT_DIRECTORIES.map((directory) => path.join(repositoryRootRaw, directory)),
    path.join(repositoryRootRaw, "12.人脉"),
    // Pre-chain layout (kept until the library migration relocates them).
    path.join(repositoryRootRaw, "3.项目库"),
    path.join(repositoryRootRaw, "4.人脉库")
  ].filter((candidate) => stableDescendantRealPath(repositoryRootRaw, candidate, { allowRoot: false }))
    .filter(Boolean);
}

function validCodexWorkspace({ candidate, demoWorkspace, projectsDir, settings }) {
  if (!candidate) return null;
  const resolved = existingDirectoryRealPath(candidate);
  if (!resolved) return null;
  const runtimeRoot = existingDirectoryRealPath(demoWorkspace);
  const projectsRoot = existingDirectoryRealPath(projectsDir);
  const managedRuntime = resolved === runtimeRoot
    || Boolean(projectsRoot && stableDescendantRealPath(projectsRoot, candidate, { allowRoot: false }));
  const managedEntity = entityWorkspaceRoots(settings)
    .some((root) => Boolean(stableDescendantRealPath(root, candidate, { allowRoot: false })));
  return managedRuntime || managedEntity ? resolved : null;
}

function isEntityWorkspace({ workspacePath, settings }) {
  return entityWorkspaceRoots(settings)
    .some((root) => Boolean(stableDescendantRealPath(root, workspacePath, { allowRoot: false })));
}

function projectResearchCacheScope({
  payload,
  workspacePath,
  settings,
  resolveEntityWorkspace
}) {
  const entityType = String(payload?.externalType || "");
  if ((entityType !== "project" && entityType !== "person") || !payload?.externalRecordId) {
    return { allowed: true, workspacePath: "" };
  }
  if (settings?.storageBackend !== "local") {
    return { allowed: true, workspacePath: "" };
  }
  try {
    const canonicalCandidate = resolveEntityWorkspace({
      entityType,
      recordId: payload.externalRecordId
    });
    // Both entity libraries (3.项目库 / 4.人脉库) are trusted roots; the
    // canonical directory must live inside one of them and the requested
    // workspace must be exactly that directory.
    const roots = entityWorkspaceRoots(settings);
    const canonical = roots
      .map((root) => stableDescendantRealPath(root, canonicalCandidate, { allowRoot: false }))
      .find(Boolean);
    const requested = roots
      .map((root) => stableDescendantRealPath(root, workspacePath, { allowRoot: false }))
      .find(Boolean);
    return {
      allowed: Boolean(canonical && requested && canonical === requested),
      workspacePath: canonical && canonical === requested ? canonical : ""
    };
  } catch {
    return { allowed: false, workspacePath: "" };
  }
}

module.exports = {
  entityWorkspaceRoots,
  existingDirectoryRealPath,
  isEntityWorkspace,
  pathIsWithin,
  projectResearchCacheScope,
  stableDescendantRealPath,
  validCodexWorkspace
};
