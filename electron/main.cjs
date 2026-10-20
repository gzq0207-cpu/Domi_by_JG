const { app, autoUpdater: nativeAutoUpdater, BrowserWindow, clipboard, dialog, ipcMain, nativeImage, net, Notification, protocol, safeStorage, session, shell } = require("electron");
const { execFile } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { fileURLToPath, pathToFileURL } = require("node:url");
const { promisify } = require("node:util");
const {
  CodexAppServer,
  codexEnvironment,
  resolveCodexBinary
} = require("./codex-app-server.cjs");
const {
  CodexBootstrapService,
  createElectronNetFetcher,
  fetchOfficialInstaller
} = require("./codex-bootstrap.cjs");
const {
  CodexConnectionTestController,
  normalizeConnectionTestRequestId
} = require("./codex-connection-test.cjs");
const { CodexRuntimeManager } = require("./codex-runtime.cjs");
const { WorkbenchStateStore } = require("./state-store.cjs");
const { DomiIntegration } = require("./domi-integration.cjs");
const { resolveLarkCliForChild } = require("./lark-runtime.cjs");
const { resolveEntityWorkspaceWithRecovery } = require("./entity-workspace-recovery.cjs");
const {
  classifyFeishuDocumentIntentFromRun,
  classifyFeishuWriteIntentFromRun,
  feishuMarkdownSourceCandidates,
  safeFeishuExportContext
} = require("./feishu-document-intent.cjs");
const { DomiPluginManager } = require("./domi-plugin-manager.cjs");
const {
  AppSettingsService,
  parseCalendarRecipients,
  normalizeAgentProvider
} = require("./app-settings.cjs");
const { UpdateService } = require("./update-service.cjs");
const {
  agentCliLoginStatus,
  buildAgentCliArgs,
  discoverAgentCli,
  runAgentCliVersion,
  spawnAgentRun
} = require("./agent-adapter.cjs");
const { ServiceCoordinator } = require("./service-coordinator.cjs");
const {
  classifyCodexTurnStatus,
  codexReconnectNotice
} = require("./codex-turn-status.cjs");
const { isSelectedCodexConnectionReady } = require("./codex-protocol.cjs");
const { startIntakeServer, DEFAULT_PORT: INTAKE_DEFAULT_PORT } = require("./intake-server.cjs");
const { FeishuIntakePoller, buildInboxQuestionReply, buildInboxContinueReply } = require("./intake-feishu.cjs");
const { InboxAnswerGenerator, composeAnswerReply } = require("./inbox-answer.cjs");
const { FeishuWikiMirror } = require("./feishu-wiki-mirror.cjs");
const { KnowledgeTranslationService } = require("./knowledge-translation.cjs");
const { ChineseTranslator } = require("./chinese-translation.cjs");
const { finalizeSubscriptionDigest, digestDisplayTitle } = require("./subscription-digest.cjs");
const { buildQuerySnapshot, snapshotSha256 } = require("./query-snapshot.cjs");
const {
  buildKnowledgeDailyReport,
  coverageWindow,
  shouldGenerateDailyReport
} = require("./knowledge-daily-report.cjs");
const {
  createRunUsageTracker,
  observeRawResponseUsage,
  observeThreadTokenUsage,
  runUsageSnapshot
} = require("./codex-token-usage.cjs");
const {
  codexRunExecutionMode,
  normalizeCodexRoutingParams,
  partitionCodexRuns,
  requestCodexTurn,
  resolveCodexActiveRun,
  threadPersistenceOptions,
  sourceScopedThreadKey,
  sourceScopeAllowsResume
} = require("./codex-run-context.cjs");
const {
  buildMarkdownClipboardPayload,
  detectImageMime,
  resolveMarkdownImagePath,
  savePastedMarkdownImage
} = require("./markdown-assets.cjs");
const {
  createDocumentLibraryEntry,
  documentLibraryLocation,
  ensureDocumentLibraryStructure,
  listDocumentLibrary
} = require("./document-library.cjs");
const { DocumentSearchService } = require("./document-search-service.cjs");
const { ResearchStore } = require("./research-store.cjs");
const {createDocumentAnnotationService}=require('./document-annotations.cjs');
const { createPdfPreviewRegistry } = require('./pdf-preview.cjs');
const pdfPreviewRegistry = createPdfPreviewRegistry({ net });
const researchAllowedPaths = new Set();
let researchStore = null;
function getResearchStore() {
  const location = currentDocumentLibraryLocation();
  const rootPath = fs.realpathSync(location.rootPath);
  if (researchStore?.root !== rootPath) {
    researchStore?.close();
    researchStore = new ResearchStore({ rootPath, allowedPaths: researchAllowedPaths,
      onFileChanged: (file) => { invalidateDocumentLibraryCache(); getDocumentSearchService().updateFile(rootPath, file); }
    });
  }
  return researchStore;
}
const documentAnnotations=createDocumentAnnotationService({getStore:getResearchStore,allowedPaths:researchAllowedPaths,cacheDir:()=>path.join(app.getPath('userData'),'word-preview'),chooseSave:(options,owner)=>dialog.showSaveDialog(owner,options)});
const { normalizeWebResource } = require("./resource-target.cjs");
const { normalizeLocalDocumentResource } = require("./document-resource.cjs");
const { prepareApplicationBrandPaths } = require("./brand-migration.cjs");
const { withMediaRuntimeEnvironment } = require("./media-runtime.cjs");
const {
  preparedProjectResearchCacheContext,
  prepareProjectResearchCache,
  updateProjectResearchCache
} = require("./research-cache.cjs");
const { buildDocumentContext } = require("./document-context.cjs");
const { LibrarySession, libraryToolSpecs, libraryInstructions, startLibraryThread,
  normalizeSourceScope, isRestrictedSourceScope, restrictedLibraryConfig, verifyCitationOriginal } = require("./library-tools.cjs");
const { usesSelectedDocuments, questionNeedsLibrary, normalizeQuestionPayload, questionPrompt } = require('./question-modes.cjs');
const { DocumentReader, createOcrPageExecutor } = require("./document-reader.cjs");
const { LibraryToolGateway } = require("./library-tool-gateway.cjs");
const libraryToolGateway = new LibraryToolGateway();
const libraryToolThreads = new Set();
const completedLibraryUsage = new Map();
const {
  isEntityWorkspace: workspaceIsEntity,
  pathIsWithin,
  projectResearchCacheScope: resolveProjectResearchCacheScope,
  stableDescendantRealPath,
  validCodexWorkspace: validateCodexWorkspace
} = require("./workspace-boundary.cjs");

const brandPaths = prepareApplicationBrandPaths(app);
const hasSingleInstanceLock = app.requestSingleInstanceLock();
const execFileAsync = promisify(execFile);
const pdfProtocol = "domi-pdf";
const markdownAssetProtocol = "domi-asset";

// 打包环境下主进程的 stdout/stderr 可能连接到已退出的终端（管道断开），
// 写入会抛 EPIPE 并以未捕获异常的形式杀死主进程。同步写入用
// safeStderrWrite 防护，异步错误通过 error 监听忽略 EPIPE。
function safeStderrWrite(text) {
  const stream = process.stderr;
  if (!stream || stream.destroyed || typeof stream.write !== "function") return;
  try {
    stream.write(text);
  } catch {
    // stderr 已断开时丢弃日志即可，不影响主进程。
  }
}

for (const stream of [process.stdout, process.stderr]) {
  if (!stream || typeof stream.on !== "function") continue;
  stream.on("error", (error) => {
    if (error && error.code === "EPIPE") return;
    throw error;
  });
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: pdfProtocol,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true
    }
  },
  {
    scheme: markdownAssetProtocol,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true
    }
  }
]);
const activeRuns = new Map();
const liveCodexThreads = new Map();
const resolvedCodexUserInputs = new Map();
const pendingRunPostProcessing = new Set();
let researchCacheWriteQueue = Promise.resolve();
const NON_ARCHIVED_WORKFLOWS = new Set([
  "deal-negotiation",
  "desk-research",
  "domi-router",
  "ic-memo",
  "investment-analysis",
  "investment-mgmt",
  "investment-radar",
  "investment-review",
  "meeting-prep",
  "meeting-note",
  "people-intake",
  "project-intake",
  "project-research",
  "schedule",
  "sourcing",
  "task"
]);
const allowedMarkdownAssetPaths = new Set();
const CODEX_RUN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const CODEX_CHECK_CACHE_TTL_MS = 60 * 1000;
const CODEX_VERSION_CHECK_TIMEOUT_MS = 10_000;
const CODEX_HEALTH_REQUEST_TIMEOUT_MS = 20_000;
const codexConnectionTests = new CodexConnectionTestController();
const LARK_STATUS_CACHE_TTL_MS = 5 * 60 * 1000;
const DOCUMENT_LIBRARY_CACHE_TTL_MS = 60 * 1000;
let documentLibraryCache = {
  key: "",
  expiresAt: 0,
  snapshot: null
};
let documentSearchService = null;
const externalDomiWorkflows = new Map([
  ["domi-analyst", "使用 domi-AI分析师，并可能读取当前 domi 资料库"],
  ["domi-router", "访问 PLAUD、domi 恢复队列和当前资料库，并可能按工作流更新记录"],
  ["plaud-connection-assist", "检查 domi 内置音频运行时和 PLAUD 专用浏览器 Profile，并协助完成用户自己的 PLAUD 登录"],
  ["meeting-prep", "读取当前项目、人脉、文档和材料及公开信息，生成只读会前简报"],
  ["people-intake", "使用 domi 人物研究入库工作流检索公开信息、查重并更新当前人脉库"],
  ["project-research", "使用 domi Router 读取内部项目材料、当前文档库与公开信息源，完成项目只读研究"],
  ["project-intake", "使用 domi Router 完成项目研究、投资快评，并更新当前项目库"],
  ["investment-radar", "联网检索和核验最新行业新闻，并更新当前行业事件库"],
  ["task", "读取项目、人脉、行业动态和 1.待办事项文档，并更新待办事项与状态"],
  ["schedule", "整理主题、时间和地点，并向用户指定的一个或多个参会人发送 Outlook 日程邀请"],
  ["desk-research", "访问当前项目库、文档、材料和联网数据源，并可能按要求回填研究成果"],
  ["sourcing", "访问当前人脉库和公开信息源，并可能按要求更新人脉记录"],
  ["investment-mgmt", "访问并可能更新当前项目库、文档与本地材料"]
]);
const legacyFeishuPrimaryWriteWorkflows = new Set([
  "domi-router",
  "people-intake",
  "project-intake",
  "investment-radar",
  "investment-mgmt",
  "sourcing",
  "task"
]);
const larkRequestPattern = /(?:飞书|lark|wiki|watching\s*list|项目库|人脉库|people|onedrive|项目文档|交流文档|线上文档|1\.\s*待办事项|1\.\s*task|待办事项|任务建议)/i;
const feishuReferenceRequestPattern = /(?:飞书|lark|wiki|watching\s*list|线上文档)/i;

const appName = brandPaths.appName;
const rootDir = path.resolve(__dirname, "..");
const runtimeLogPath = path.join(brandPaths.userDataPath, "logs", "runtime.jsonl");
const runtimeLogArchivePath = `${runtimeLogPath}.1`;
const RUNTIME_LOG_MAX_BYTES = 2 * 1024 * 1024;
const legacyDevelopmentWorkspace = path.join(rootDir, "demo-workspace");
const demoWorkspace = brandPaths.workspacePath;
const outputDir = path.join(demoWorkspace, "outputs");
const projectsDir = path.join(demoWorkspace, "projects");
const appIconPath = path.join(rootDir, "public", "domi-dock-icon.png");

let codexClient = null;
let codexRuntimeReadinessPromise = null;
let stateStore = null;
let domiIntegration = null;
let domiPluginManager = null;
let appSettings = null;
let codexBootstrap = null;
let codexRuntimeManager = null;
let updateService = null;
const serviceCoordinator = new ServiceCoordinator();

if (!hasSingleInstanceLock) {
  app.quit();
}

function boundedRuntimeText(value, limit = 8_000) {
  if (value === undefined || value === null) return "";
  return String(value).slice(0, limit);
}

function appendRuntimeLog(event, details = {}) {
  try {
    fs.mkdirSync(path.dirname(runtimeLogPath), { recursive: true });
    if (fs.existsSync(runtimeLogPath) && fs.statSync(runtimeLogPath).size >= RUNTIME_LOG_MAX_BYTES) {
      fs.rmSync(runtimeLogArchivePath, { force: true });
      fs.renameSync(runtimeLogPath, runtimeLogArchivePath);
    }
    fs.appendFileSync(runtimeLogPath, `${JSON.stringify({
      timestamp: new Date().toISOString(),
      event: boundedRuntimeText(event, 120),
      ...details
    })}\n`, "utf8");
  } catch (error) {
    console.error("[runtime-log] 无法写入诊断日志", error);
  }
}

function migrateLegacyDevelopmentWorkspace() {
  if (app.isPackaged || !fs.existsSync(legacyDevelopmentWorkspace)) return;
  const markerDir = path.join(app.getPath("userData"), "migrations");
  const markerPath = path.join(markerDir, "development-workspace-v1.json");
  if (fs.existsSync(markerPath)) return;

  fs.mkdirSync(path.dirname(demoWorkspace), { recursive: true });
  fs.cpSync(legacyDevelopmentWorkspace, demoWorkspace, {
    recursive: true,
    force: false,
    errorOnExist: false
  });
  fs.mkdirSync(markerDir, { recursive: true });
  fs.writeFileSync(markerPath, JSON.stringify({
    migratedAt: new Date().toISOString(),
    source: legacyDevelopmentWorkspace,
    destination: demoWorkspace
  }, null, 2));
}

function ensureDemoWorkspace() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(projectsDir, { recursive: true });
}

function getStateStore() {
  if (!stateStore) {
    stateStore = new WorkbenchStateStore({
      databasePath: path.join(app.getPath("userData"), "domi.sqlite3"),
      projectsDir
    });
  }
  return stateStore;
}

function getDomiIntegration() {
  if (!domiIntegration) {
    domiIntegration = new DomiIntegration({
      stateStore: getStateStore(),
      configProvider: () => getAppSettings().load().settings,
      domiConfigPath: path.join(app.getPath("userData"), "domi-plugin-config.json"),
      plaudOutputDir: path.join(demoWorkspace, "work", "domi", "plaud"),
      podcastCacheDir: path.join(app.getPath("userData"), "Cache", "podcasts")
    });
  }
  return domiIntegration;
}

function getDomiPluginManager() {
  if (!domiPluginManager) {
    const bundledRoot = app.isPackaged
      ? path.join(process.resourcesPath, "domi-plugin")
      : path.join(rootDir, "build", "domi-plugin");
    const bundledLockPath = app.isPackaged
      ? path.join(process.resourcesPath, "domi-plugin-lock.json")
      : path.join(rootDir, "build", "domi-plugin-lock.json");
    domiPluginManager = new DomiPluginManager({
      userDataPath: brandPaths.pluginRuntimePath,
      bundledPluginRoot: bundledRoot,
      bundledLockPath,
      clientVersion: app.getVersion(),
      remoteUpdateEnabled: process.env.DOMI_PLUGIN_AUTO_UPDATE !== "0"
    });
  }
  return domiPluginManager;
}

function getCodexRuntime() {
  const runtime = withMediaRuntimeEnvironment(getAppSettings().runtime());
  const larkCliPath = resolveLarkCliForChild({
    appRoot: rootDir,
    resourcesPath: process.resourcesPath,
    targetArch: process.arch,
    fallbackPath: getDomiIntegration().larkCli
  });
  return {
    ...runtime,
    env: {
      ...(runtime.env || {}),
      ...(larkCliPath ? { LARK_CLI_PATH: larkCliPath } : {})
    }
  };
}

function getAppSettings() {
  if (!appSettings) {
    appSettings = new AppSettingsService({
      stateStore: getStateStore(),
      safeStorage,
      domiConfigPath: path.join(app.getPath("userData"), "domi-plugin-config.json"),
      developmentFallbackConfigPath: brandPaths.development
        && process.env.DOMI_DEV_ISOLATED !== "1"
        ? path.join(brandPaths.productionUserDataPath, "domi-plugin-config.json")
        : ""
    });
    const inherited = appSettings.bootstrapDevelopmentLocalRepository();
    if (inherited.applied) {
      appendRuntimeLog("development-local-repository-reused", {
        productionConfigurationCopied: false,
        sharedDatabase: false
      });
    }
  }
  return appSettings;
}

function getCodexBootstrap() {
  if (!codexBootstrap) {
    const electronFetcher = createElectronNetFetcher(net);
    codexBootstrap = new CodexBootstrapService({
      fetchInstaller: () => fetchOfficialInstaller(electronFetcher),
      installBundled: () => getCodexRuntimeManager().installBundled(),
      runtimeManager: getCodexRuntimeManager(),
      installerEnvironment: resolveCodexInstallerProxyEnvironment
    });
  }
  return codexBootstrap;
}

function getCodexRuntimeManager() {
  if (!codexRuntimeManager) {
    const runtimeRoot = app.isPackaged
      ? path.join(process.resourcesPath, "codex-runtime")
      : path.join(rootDir, "build", `codex-runtime-${process.arch}`);
    codexRuntimeManager = new CodexRuntimeManager({
      archivePath: path.join(runtimeRoot, "codex-package.tar.gz"),
      manifestPath: path.join(runtimeRoot, "manifest.json")
    });
  }
  return codexRuntimeManager;
}

function ensureCodexRuntimeReady() {
  if (codexRuntimeReadinessPromise) return codexRuntimeReadinessPromise;
  codexRuntimeReadinessPromise = (async () => {
    const configuredPath = getAppSettings().load().settings.codexPath;
    let result;
    if (app.isPackaged) {
      result = await getCodexBootstrap().install();
      if (!result.ok) {
        throw new Error(result.error || "无法修复 Codex Runtime。");
      }
    } else {
      result = {
        ok: true,
        path: resolveCodexBinary(configuredPath),
        source: "development"
      };
    }
    const canonicalPath = resolveCodexBinary(result.path || configuredPath);
    if (canonicalPath !== configuredPath) {
      getAppSettings().save({ codexPath: canonicalPath });
      if (codexClient) resetCodexClient();
    }
    appendRuntimeLog("codex-runtime-ready", {
      source: String(result.source || (result.managed ? "managed" : "external")),
      repaired: result.installedNow === true
    });
    return { ...result, path: canonicalPath };
  })().catch((error) => {
    codexRuntimeReadinessPromise = null;
    throw error;
  });
  return codexRuntimeReadinessPromise;
}

async function resolveCodexInstallerProxyEnvironment() {
  try {
    const rules = await session.defaultSession.resolveProxy(
      "https://github.com/openai/codex/releases/latest"
    );
    const rule = String(rules || "")
      .split(";")
      .map((value) => value.trim())
      .find((value) => value && value.toUpperCase() !== "DIRECT");
    if (!rule) return {};
    const match = rule.match(/^(PROXY|HTTPS?|SOCKS5?)\s+(.+)$/i);
    if (!match || !/^[A-Za-z0-9_.:[\]-]+$/.test(match[2])) return {};
    if (/^SOCKS/i.test(match[1])) {
      return {
        ALL_PROXY: `socks5h://${match[2]}`,
        all_proxy: `socks5h://${match[2]}`
      };
    }
    return {
      HTTPS_PROXY: `http://${match[2]}`,
      HTTP_PROXY: `http://${match[2]}`,
      https_proxy: `http://${match[2]}`,
      http_proxy: `http://${match[2]}`
    };
  } catch {
    return {};
  }
}

function getUpdateService() {
  if (!updateService) {
    updateService = new UpdateService({
      app,
      channelProvider: () => getAppSettings().load().settings.updateChannel
    });
  }
  return updateService;
}

function validCodexWorkspace(candidate) {
  return validateCodexWorkspace({
    candidate,
    demoWorkspace,
    projectsDir,
    settings: getAppSettings().load().settings
  });
}

async function resolveCanonicalEntityWorkspace(request, { repairMissing = false } = {}) {
  const entityRequest = {
    entityType: ["project", "person"].includes(request?.entityType)
      ? request.entityType
      : "",
    recordId: String(request?.recordId || "").trim()
  };
  const mayRepair = repairMissing
    && getAppSettings().load().settings.storageBackend === "local"
    && entityRequest.entityType
    && entityRequest.recordId;
  const result = await resolveEntityWorkspaceWithRecovery({
    request: entityRequest,
    resolveWorkspace: (candidate) => getDomiIntegration().entityWorkspace(candidate),
    validateWorkspace: (candidate) => validCodexWorkspace(candidate),
    reindex: mayRepair
      ? async () => {
          const synced = await serviceCoordinator.run(
            "domi:sync",
            () => getDomiIntegration().sync(),
            {
              force: true,
              allowStale: false,
              retries: 0,
              isSuccess: (value) => value?.ok !== false && value?.stale !== true
            }
          );
          serviceCoordinator.invalidate("domi:status");
          serviceCoordinator.invalidate("domi:entity-materials:");
          return synced;
        }
      : undefined
  });
  return {
    ok: result.ok,
    workspacePath: result.workspacePath,
    recovered: Boolean(result.recovered),
    snapshot: result.reindexResult?.snapshot,
    error: result.error
  };
}

function isEntityWorkspace(workspacePath) {
  return workspaceIsEntity({
    workspacePath,
    settings: getAppSettings().load().settings
  });
}

function projectResearchCacheScope(payload, workspacePath) {
  return resolveProjectResearchCacheScope({
    payload,
    workspacePath,
    settings: getAppSettings().load().settings,
    resolveEntityWorkspace: (request) => getDomiIntegration().entityWorkspace(request)
  });
}

function directoryIdentity(directoryPath) {
  try {
    const canonicalPath = fs.realpathSync.native(directoryPath);
    const stat = fs.statSync(canonicalPath);
    if (!stat.isDirectory()) return null;
    return {
      canonicalPath,
      device: String(stat.dev),
      inode: String(stat.ino)
    };
  } catch {
    return null;
  }
}

function sameDirectoryIdentity(left, right) {
  return Boolean(left && right)
    && left.canonicalPath === right.canonicalPath
    && left.device === right.device
    && left.inode === right.inode;
}

function researchCacheWorkspaceIsCurrent(run) {
  const scope = projectResearchCacheScope({
    externalType: run.externalType,
    externalRecordId: run.externalRecordId
  }, run.workspacePath);
  return Boolean(scope.allowed && scope.workspacePath)
    && sameDirectoryIdentity(run.workspaceIdentity, directoryIdentity(scope.workspacePath));
}

function enqueueResearchCacheWrite(operation) {
  const queued = researchCacheWriteQueue
    .catch(() => undefined)
    .then(operation);
  researchCacheWriteQueue = queued.then(() => undefined, () => undefined);
  return queued;
}

function researchCacheNamespace() {
  const settings = getAppSettings().load().settings;
  const backend = settings.storageBackend === "feishu" ? "feishu" : "local";
  const identity = backend === "feishu"
    ? [settings.projectBaseToken, settings.projectTableId, settings.wikiSpaceId]
    : [settings.localRepositoryDir, settings.localDatabasePath];
  const digest = crypto
    .createHash("sha256")
    .update(identity.map((value) => String(value || "")).join("\0"))
    .digest("hex")
    .slice(0, 16);
  return `${backend}-${digest}`;
}

function secureWorkspaceSubdirectory(workspacePath, directoryName) {
  const requested = path.join(workspacePath, directoryName);
  fs.mkdirSync(requested, { recursive: true });
  const verified = stableDescendantRealPath(workspacePath, requested, { allowRoot: false });
  if (!verified) {
    throw new Error(`${directoryName} 目录不是当前工作区内的安全目录。`);
  }
  return verified;
}

function attachmentDirectory(workspacePath) {
  return secureWorkspaceSubdirectory(
    workspacePath,
    isEntityWorkspace(workspacePath) ? "原始材料" : "attachments"
  );
}

function validAttachmentWorkspace(requestedWorkspacePath, entityRequest) {
  const entityType = ["project", "person"].includes(entityRequest?.entityType)
    ? entityRequest.entityType
    : "";
  const recordId = String(entityRequest?.recordId || "").trim();
  if (entityType && recordId) {
    if (getAppSettings().load().settings.storageBackend !== "local") return "";
    return validCodexWorkspace(getDomiIntegration().entityWorkspace({ entityType, recordId })) || "";
  }
  const candidate = validCodexWorkspace(requestedWorkspacePath);
  return candidate && !isEntityWorkspace(candidate) ? candidate : demoWorkspace;
}

function logicalStagingAttachmentName(filePath) {
  const name = path.basename(filePath);
  if (!managedStagingAttachment(filePath)) return name;
  return name.replace(/^\d+-\d+-(?=.+)/, "");
}

function managedStagingAttachment(filePath) {
  const parent = path.dirname(path.resolve(String(filePath || "")));
  if (path.basename(parent) !== "attachments") return false;
  return pathIsWithin(demoWorkspace, parent)
    || pathIsWithin(projectsDir, parent);
}

async function discardManagedStagingAttachment(filePath) {
  const resolved = path.resolve(String(filePath || ""));
  if (!managedStagingAttachment(resolved)) {
    return { ok: false, removed: false, error: "该文件不是 domi 本轮管理的暂存附件。" };
  }
  try {
    await fs.promises.unlink(resolved);
    return { ok: true, removed: true };
  } catch (error) {
    if (error?.code === "ENOENT") return { ok: true, removed: false };
    return {
      ok: false,
      removed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function cleanupImportedStagingSources(sourcePaths) {
  let failureCount = 0;
  await Promise.all(sourcePaths.map(async (sourcePath) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await fs.promises.unlink(sourcePath);
        return;
      } catch (error) {
        if (error?.code === "ENOENT") return;
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 25));
          continue;
        }
        failureCount += 1;
      }
    }
  }));
  if (failureCount > 0) {
    // Do not log private file names or paths. The source remains in the
    // application-managed staging area if both bounded cleanup attempts fail.
    appendRuntimeLog("attachment-staging-source-cleanup-failed", { failureCount });
  }
}

async function importLocalFiles(requestedWorkspacePath, requestedPaths, entityRequest) {
  ensureDemoWorkspace();
  const workspacePath = validAttachmentWorkspace(requestedWorkspacePath, entityRequest);
  if (!workspacePath) {
    return { ok: false, canceled: false, files: [], error: "没有找到该项目或人物的固定资料目录。" };
  }
  let attachmentsDir;
  try {
    attachmentsDir = attachmentDirectory(workspacePath);
  } catch (error) {
    return { ok: false, canceled: false, files: [], error: error instanceof Error ? error.message : String(error) };
  }

  const sourcePaths = Array.isArray(requestedPaths)
    ? [...new Set(requestedPaths.filter((value) => typeof value === "string" && value.trim()))]
    : [];
  if (sourcePaths.length === 0) {
    return { ok: false, canceled: false, files: [], error: "没有读取到可导入的本地文件。" };
  }

  const createdTargets = [];
  try {
    const stamp = Date.now();
    const files = [];
    const managedStagingSources = [];
    for (const [index, sourcePath] of sourcePaths.entries()) {
      const resolvedSourcePath = path.resolve(sourcePath);
      const sourceStat = await fs.promises.stat(resolvedSourcePath);
      if (!sourceStat.isFile()) {
        throw new Error(`${path.basename(resolvedSourcePath)} 不是可导入的文件。`);
      }
      attachmentsDir = attachmentDirectory(workspacePath);
      const name = logicalStagingAttachmentName(resolvedSourcePath);
      const targetPath = path.join(attachmentsDir, `${stamp}-${index}-${name}`);
      await fs.promises.copyFile(resolvedSourcePath, targetPath, fs.constants.COPYFILE_EXCL);
      createdTargets.push(targetPath);
      const stat = await fs.promises.stat(targetPath);
      files.push({ name, path: targetPath, size: stat.size });
      if (isEntityWorkspace(workspacePath) && managedStagingAttachment(resolvedSourcePath)) {
        managedStagingSources.push(resolvedSourcePath);
      }
    }
    await cleanupImportedStagingSources(managedStagingSources);
    return { ok: true, canceled: false, files };
  } catch (error) {
    await Promise.allSettled(createdTargets.map((targetPath) => fs.promises.unlink(targetPath)));
    return {
      ok: false,
      canceled: false,
      files: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function sanitizedAttachmentName(candidate, index) {
  const fallback = `clipboard-file-${index + 1}`;
  const baseName = path.basename(typeof candidate === "string" ? candidate.trim() : "") || fallback;
  const sanitized = baseName
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 180);
  return sanitized || fallback;
}

async function importLocalFileData(requestedWorkspacePath, requestedFiles, entityRequest) {
  ensureDemoWorkspace();
  const workspacePath = validAttachmentWorkspace(requestedWorkspacePath, entityRequest);
  if (!workspacePath) {
    return { ok: false, canceled: false, files: [], error: "没有找到该项目或人物的固定资料目录。" };
  }
  let attachmentsDir;
  try {
    attachmentsDir = attachmentDirectory(workspacePath);
  } catch (error) {
    return { ok: false, canceled: false, files: [], error: error instanceof Error ? error.message : String(error) };
  }

  const sourceFiles = Array.isArray(requestedFiles) ? requestedFiles : [];
  if (sourceFiles.length === 0) {
    return { ok: false, canceled: false, files: [], error: "剪贴板中没有可导入的文件。" };
  }

  const createdTargets = [];
  try {
    const stamp = Date.now();
    const files = [];
    for (const [index, sourceFile] of sourceFiles.entries()) {
      const data = sourceFile?.data;
      const bytes = data instanceof ArrayBuffer
        ? Buffer.from(data)
        : ArrayBuffer.isView(data)
          ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
          : null;
      if (!bytes || bytes.length === 0) {
        throw new Error(`${sanitizedAttachmentName(sourceFile?.name, index)} 没有可读取的文件内容。`);
      }
      attachmentsDir = attachmentDirectory(workspacePath);
      const name = sanitizedAttachmentName(sourceFile?.name, index);
      const targetPath = path.join(attachmentsDir, `${stamp}-${index}-${name}`);
      await fs.promises.writeFile(targetPath, bytes, { flag: "wx" });
      createdTargets.push(targetPath);
      const stat = await fs.promises.stat(targetPath);
      files.push({ name, path: targetPath, size: stat.size });
    }
    return { ok: true, canceled: false, files };
  } catch (error) {
    await Promise.allSettled(createdTargets.map((targetPath) => fs.promises.unlink(targetPath)));
    return {
      ok: false,
      canceled: false,
      files: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function selectLocalFiles(sender, requestedWorkspacePath, entityRequest) {
  const owner = BrowserWindow.fromWebContents(sender);
  const result = await dialog.showOpenDialog(owner, {
    title: "选择投资材料",
    buttonLabel: "添加材料",
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "常用材料",
        extensions: [
          "pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx",
          "md", "txt", "json", "srt", "vtt", "png", "jpg", "jpeg", "webp", "heic",
          "mp3", "m4a", "wav", "mp4", "mov"
        ]
      },
      { name: "所有文件", extensions: ["*"] }
    ]
  });

  if (result.canceled) {
    return { ok: true, canceled: true, files: [] };
  }
  return importLocalFiles(requestedWorkspacePath, result.filePaths, entityRequest);
}

function expandHomeDirectory(input) {
  const candidate = String(input || "").trim();
  return candidate.startsWith("~/")
    ? path.join(os.homedir(), candidate.slice(2))
    : candidate;
}

async function selectLocalDirectory(sender, requestedPath) {
  const owner = BrowserWindow.fromWebContents(sender);
  const expandedPath = expandHomeDirectory(requestedPath);
  const defaultPath = expandedPath && fs.existsSync(expandedPath)
    ? expandedPath
    : app.getPath("documents");
  const result = await dialog.showOpenDialog(owner, {
    title: "选择本地资料库目录",
    buttonLabel: "选择目录",
    defaultPath,
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled || !result.filePaths[0]) {
    return { ok: true, canceled: true, path: "" };
  }
  return { ok: true, canceled: false, path: result.filePaths[0] };
}

function currentDocumentLibraryLocation() {
  const settings = getAppSettings().load().settings;
  const location = documentLibraryLocation(settings);
  if (location.initializeStructure) {
    ensureDocumentLibraryStructure(location.rootPath);
  } else if (!fs.existsSync(location.rootPath)) {
    fs.mkdirSync(location.rootPath, { recursive: true });
  }
  return location;
}

function getDocumentSearchService() {
  if (!documentSearchService) {
    documentSearchService = new DocumentSearchService({
      databasePath: path.join(app.getPath("cache"), "domi", "document-search.sqlite3"),
      cloudContentAllowed: () => getAppSettings().load().settings.documentSearchCloudContent === true,
      semanticEnabled: () => getAppSettings().load().settings.semanticSearchEnabled !== false,
      ocrCommand: () => String(getAppSettings().load().settings.documentOcrCommand || "").trim(),
      semanticCacheDir: path.join(app.getPath("cache"), "domi", "semantic-models")
    });
  }
  return documentSearchService;
}

// OCR 为可选能力：未配置命令时保持原行为；识别结果必须带质量未验证披露。
function documentOcrPageFromSettings() {
  const command = String(getAppSettings().load().settings.documentOcrCommand || "").trim();
  if (!command) return null;
  try { return createOcrPageExecutor(command); } catch { return null; }
}

function semanticSearchDocumentLibrary(request = {}) {
  try {
    const location = currentDocumentLibraryLocation();
    return getDocumentSearchService().semanticSearch(location.rootPath, {
      query: String(request?.query || ""),
      limit: request?.limit
    });
  } catch {
    return { ok: true, available: false, results: [], degraded: false };
  }
}

function searchDocumentLibrary(request = {}) {
  try {
    const location = currentDocumentLibraryLocation();
    return getDocumentSearchService().search(location.rootPath, {
      query: String(request?.query || ""),
      limit: request?.limit,
      includeTranscripts: request?.includeTranscripts === true,
      excludeTranscripts: request?.excludeTranscripts === true
    });
  } catch (error) {
    return {
      ok: false,
      results: [],
      indexing: false,
      indexedCount: 0,
      lastIndexedAt: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function prepareLibraryAccess(settings, sender, runId, payload = {}) {
  if (!questionNeedsLibrary(payload)) return null;
  const restricted = isRestrictedSourceScope(payload);
  if (!usesSelectedDocuments(payload.sourceScope) && (settings.storageBackend !== "local" || !settings.localRepositoryDir)) {
    if (restricted) throw new Error("全库资料模式需要已连接的本地资料库，本轮未改用飞书或联网。");
    return null;
  }
  const attachmentPaths = Array.isArray(payload.attachmentPaths) ? payload.attachmentPaths : [];
  if (usesSelectedDocuments(payload.sourceScope) && !attachmentPaths.length) throw new Error("请先添加选定材料；本轮不会自动检索全库。");
  if (attachmentPaths.length > 64) throw new Error("本轮材料超过 64 份，请缩小来源范围后重试。");
  const supportedPaths = [];
  for (const filePath of attachmentPaths) {
    if (typeof filePath !== "string" || !path.isAbsolute(filePath)) throw new Error("所选材料缺少有效的绝对路径，请重新添加。");
    const canonical = fs.realpathSync(filePath);
    const supported = [".md", ".markdown", ".txt", ".pdf", ".docx", ".doc"].includes(path.extname(canonical).toLowerCase());
    if (!supported && restricted) throw new Error(`受限来源暂不支持 ${path.basename(filePath)}，请转换为 Markdown、文本、PDF 或 Word；不会扩大来源范围。`);
    if (supported) supportedPaths.push(filePath);
  }
  const { rootPath } = documentLibraryLocation(settings);
  const session = new LibrarySession({
    rootPath, settings,
    sourceScope: normalizeSourceScope(payload.sourceScope, payload.webSearch),
    selectedPaths: usesSelectedDocuments(payload.sourceScope) ? supportedPaths : [],
    attachmentPaths: supportedPaths,
    ocrPage: documentOcrPageFromSettings(),
    search: (query, options) => searchDocumentLibrary({ query, ...options }),
    semanticSearch: (query, options) => semanticSearchDocumentLibrary({ query, ...options }),
    isCurrent: () => {
      const current = getAppSettings().load().settings;
      return current.storageBackend === "local" && documentLibraryLocation(current).rootPath === rootPath;
    },
    onUpdate: (libraryUsage) => {
      const run = activeRuns.get(runId);
      if (run && !run.finished && payload.privateOutput !== true) {
        armRunIdleTimeout(run);
        publishCodexEvent(sender, runId, { type: "library-usage", threadId: run.threadId, libraryUsage });
      }
    }
  });
  let access;
  try {
    access = await libraryToolGateway.add(session);
    // Materialize this small public helper outside app.asar so packaged
    // Electron can also execute it in Node mode. It contains no user data.
    const cliPath = path.join(app.getPath("cache"), "domi", "library-tool-cli.cjs");
    fs.mkdirSync(path.dirname(cliPath), { recursive: true });
    const cli = fs.readFileSync(path.join(__dirname, "library-tool-cli.cjs"), "utf8");
    if (!fs.existsSync(cliPath) || fs.readFileSync(cliPath, "utf8") !== cli) fs.writeFileSync(cliPath, cli, { mode: 0o600 });
    const quote = (value) => `'${String(value).replace(/'/g, process.platform === "win32" ? "''" : "'\\''")}'`;
    const command = process.platform === "win32"
      ? `$env:ELECTRON_RUN_AS_NODE='1'; & ${quote(process.execPath)} ${quote(cliPath)} --endpoint ${quote(access.endpoint)}`
      : `ELECTRON_RUN_AS_NODE=1 ${quote(process.execPath)} ${quote(cliPath)} --endpoint ${quote(access.endpoint)}`;
    return { ...access, session, command, rootPath };
  } catch (error) { if (access) access.revoke(); else session.close(); throw error; }
}

async function handleLibraryToolCall(params) {
  const route = resolveCodexActiveRun(activeRuns.values(), params);
  const run = route.run;
  if (!run || run.finished || run.finishing || run.stopRequested || !run.libraryAccess
    || run.threadId !== params.threadId || (run.turnId && run.turnId !== params.turnId)
    || !libraryToolSpecs.some((tool) => tool.name === params.tool) || params.namespace) {
    return { ok: false, error: "本轮未授权该资料工具或对话路由不匹配。" };
  }
  return run.libraryAccess.session.call(params.tool, params.arguments);
}

function invalidateDocumentLibraryCache() {
  documentLibraryCache = {
    key: "",
    expiresAt: 0,
    snapshot: null
  };
}

function readDocumentLibrary(request = {}) {
  try {
    const location = currentDocumentLibraryLocation();
    const cacheKey = `${path.resolve(location.rootPath)}\0${location.initializeStructure ? "1" : "0"}`;
    if (
      request?.force !== true
      && documentLibraryCache.key === cacheKey
      && documentLibraryCache.expiresAt > Date.now()
      && documentLibraryCache.snapshot
    ) {
      return documentLibraryCache.snapshot;
    }
    const snapshot = {
      ...listDocumentLibrary(location.rootPath),
      structured: location.initializeStructure
    };
    getDocumentSearchService().scheduleIndex(location.rootPath, request?.force === true);
    documentLibraryCache = {
      key: cacheKey,
      expiresAt: Date.now() + DOCUMENT_LIBRARY_CACHE_TTL_MS,
      snapshot
    };
    return snapshot;
  } catch (error) {
    return {
      ok: false,
      rootPath: "",
      rootName: "本地文档库",
      nodes: [],
      documentCount: 0,
      folderCount: 0,
      truncated: false,
      scannedAt: Date.now(),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function createDocumentLibraryItem(request) {
  try {
    const location = currentDocumentLibraryLocation();
    const created = createDocumentLibraryEntry(location.rootPath, request);
    invalidateDocumentLibraryCache();
    return {
      ...created,
      snapshot: readDocumentLibrary({ force: true })
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function openResource(resource) {
  const webResource = normalizeWebResource(resource);
  if (webResource) {
    await shell.openExternal(webResource);
    return { ok: true, target: webResource };
  }

  if (typeof resource !== "string" || !resource.trim()) {
    return { ok: false, error: "资源地址为空。" };
  }

  const target = resource.trim();
  const documentResource = normalizeLocalDocumentResource(target);
  let localPath = documentResource?.path || target;
  if (!documentResource && /^file:\/\//i.test(target)) {
    try {
      localPath = fileURLToPath(target);
    } catch {
      return { ok: false, error: "本地文件地址无效。" };
    }
  }

  try {
    localPath = decodeURIComponent(localPath);
  } catch {
    // Keep the original path when it contains a literal percent sign.
  }

  if (!path.isAbsolute(localPath)) {
    return { ok: false, error: "仅支持网页链接或绝对本地路径。" };
  }

  const resolved = path.normalize(localPath);
  if (!fs.existsSync(resolved)) {
    return { ok: false, error: "本地文件不存在。", target: resolved };
  }

  const error = await shell.openPath(resolved);
  return { ok: !error, error: error || undefined, target: resolved };
}

async function openMarkdownExternally(resource) {
  try {
    const resolved = resolveMarkdownPath(resource);
    const stat = await fs.promises.stat(resolved);
    if (!stat.isFile()) {
      return { ok: false, error: "所选路径不是文件。", target: resolved };
    }

    if (process.platform === "darwin") {
      // Do not use the user's default Markdown association here. Some Markdown
      // applications keep their own file watcher and can crash when the file was
      // just atomically saved by domi. TextEdit is a stable, system-provided
      // external editor and does not share domi's editor or save lifecycle.
      await execFileAsync("/usr/bin/open", ["-a", "TextEdit", resolved], {
        timeout: 8_000,
        windowsHide: true
      });
      return { ok: true, target: resolved, application: "TextEdit" };
    }

    const error = await shell.openPath(resolved);
    return {
      ok: !error,
      error: error || undefined,
      target: resolved,
      application: "default"
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function resolveMarkdownPath(resource, basePath) {
  if (typeof resource !== "string" || !resource.trim()) {
    throw new Error("Markdown 文件地址为空。");
  }

  const documentResource = normalizeLocalDocumentResource(resource);
  if (!documentResource || ![".md", ".markdown"].includes(documentResource.extension)) {
    throw new Error("右侧文档面板仅支持 Markdown 文件。");
  }
  let localPath = documentResource.path;

  if (!path.isAbsolute(localPath)) {
    if (typeof basePath !== "string" || !path.isAbsolute(basePath)) {
      throw new Error("Markdown 文件必须使用绝对路径。");
    }
    localPath = path.resolve(path.dirname(basePath), localPath);
  }

  const resolved = path.normalize(localPath);
  if (!/\.(?:md|markdown)$/i.test(resolved)) {
    throw new Error("右侧文档面板仅支持 Markdown 文件。");
  }
  return resolved;
}

function resolvePdfPath(resource, basePath) {
  if (typeof resource !== "string" || !resource.trim()) {
    throw new Error("PDF 文件地址为空。");
  }

  const documentResource = normalizeLocalDocumentResource(resource);
  if (!documentResource || documentResource.extension !== ".pdf") {
    throw new Error("右侧 PDF 面板仅支持 PDF 文件。");
  }
  let localPath = documentResource.path;

  if (!path.isAbsolute(localPath)) {
    if (typeof basePath !== "string" || !path.isAbsolute(basePath)) {
      throw new Error("PDF 文件必须使用绝对路径。");
    }
    localPath = path.resolve(path.dirname(basePath), localPath);
  }

  const resolved = path.normalize(localPath);
  if (!/\.pdf$/i.test(resolved)) {
    throw new Error("右侧 PDF 面板仅支持 PDF 文件。");
  }
  return resolved;
}

function pdfPreviewUrl(filePath,version) {
  return pdfPreviewRegistry.url(filePath,version);
}

function markdownAssetPreviewUrl(filePath) {
  const token = Buffer.from(filePath, "utf8").toString("base64url");
  return `${markdownAssetProtocol}://local/${token}`;
}

async function readPdfDocument(request) {
  try {
    const resolved = resolvePdfPath(request?.resource, request?.basePath);
    const stat = await fs.promises.stat(resolved);
    if (!stat.isFile()) {
      return { ok: false, error: "所选路径不是文件。" };
    }

    const file = await fs.promises.open(resolved, "r");
    const signature = Buffer.alloc(5);
    try {
      await file.read(signature, 0, signature.length, 0);
    } finally {
      await file.close();
    }
    if (signature.toString("ascii") !== "%PDF-") {
      return { ok: false, error: "文件扩展名为 PDF，但内容不是有效的 PDF 文件。" };
    }
    const version=crypto.createHash('sha256').update(await fs.promises.readFile(resolved)).digest('hex');
    const after=await fs.promises.stat(resolved);if(after.size!==stat.size||after.mtimeMs!==stat.mtimeMs)return {ok:false,error:'读取期间 PDF 已变化，请重试。'};

    researchAllowedPaths.add(fs.realpathSync(resolved));
    return {
      ok: true,
      document: {
        path: resolved,
        name: path.basename(resolved),
        previewUrl: pdfPreviewUrl(resolved,version),
        version,
        size: stat.size,
        mtimeMs: stat.mtimeMs
      }
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function installPdfProtocol() {
  protocol.handle(pdfProtocol, request => pdfPreviewRegistry.handle(request));
}

function installMarkdownAssetProtocol() {
  protocol.handle(markdownAssetProtocol, async (request) => {
    try {
      const requestUrl = new URL(request.url);
      if (requestUrl.hostname !== "local") {
        return new Response("Not found", { status: 404 });
      }
      const token = requestUrl.pathname.replace(/^\//, "");
      const resolved = fs.realpathSync(Buffer.from(token, "base64url").toString("utf8"));
      if (!allowedMarkdownAssetPaths.has(resolved)) {
        return new Response("Not allowed", { status: 403 });
      }
      const file = await fs.promises.open(resolved, "r");
      const signature = Buffer.alloc(16);
      let bytesRead = 0;
      try {
        ({ bytesRead } = await file.read(signature, 0, signature.length, 0));
      } finally {
        await file.close();
      }
      if (!detectImageMime(signature.subarray(0, bytesRead))) {
        return new Response("Unsupported image", { status: 415 });
      }
      return net.fetch(pathToFileURL(resolved).href);
    } catch {
      return new Response("Invalid image resource", { status: 400 });
    }
  });
}

async function readMarkdownDocument(request) {
  try {
    const resolved = resolveMarkdownPath(request?.resource, request?.basePath);
    const stat = await fs.promises.stat(resolved);
    if (!stat.isFile()) {
      return { ok: false, error: "所选路径不是文件。" };
    }
    if (stat.size > 8 * 1024 * 1024) {
      return { ok: false, error: "Markdown 文件超过 8 MB，暂不在 domi 中打开。" };
    }
    const content = await fs.promises.readFile(resolved, "utf8");
    researchAllowedPaths.add(fs.realpathSync(resolved));
    return {
      ok: true,
      document: {
        path: resolved,
        name: path.basename(resolved),
        content,
        size: stat.size,
        mtimeMs: stat.mtimeMs
      }
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function saveMarkdownDocument(request) {
  try {
    const resolved = resolveMarkdownPath(request?.path);
    if (typeof request?.content !== "string") {
      return { ok: false, error: "Markdown 内容无效。" };
    }
    if (Buffer.byteLength(request.content, "utf8") > 8 * 1024 * 1024) {
      return { ok: false, error: "Markdown 内容超过 8 MB，无法保存。" };
    }

    const currentStat = await fs.promises.stat(resolved);
    const expectedMtimeMs = Number(request.expectedMtimeMs || 0);
    if (expectedMtimeMs && Math.abs(currentStat.mtimeMs - expectedMtimeMs) > 1) {
      return {
        ok: false,
        conflict: true,
        error: "文件已被 OneDrive 或其他应用修改，请重新载入后再编辑。"
      };
    }

    const temporaryPath = path.join(
      path.dirname(resolved),
      `.${path.basename(resolved)}.domi-${process.pid}-${Date.now()}.tmp`
    );
    try {
      await fs.promises.writeFile(temporaryPath, request.content, {
        encoding: "utf8",
        mode: currentStat.mode
      });
      const latestStat = await fs.promises.stat(resolved);
      if (Math.abs(latestStat.mtimeMs - currentStat.mtimeMs) > 1) {
        return {
          ok: false,
          conflict: true,
          error: "文件在保存期间被 OneDrive 或其他应用修改，请重新载入后再编辑。"
        };
      }
      await fs.promises.rename(temporaryPath, resolved);
    } finally {
      await fs.promises.rm(temporaryPath, { force: true }).catch(() => undefined);
    }
    const nextStat = await fs.promises.stat(resolved);
    const location = currentDocumentLibraryLocation();
    getDocumentSearchService().updateFile(location.rootPath, resolved);
    return {
      ok: true,
      document: {
        path: resolved,
        name: path.basename(resolved),
        content: request.content,
        size: nextStat.size,
        mtimeMs: nextStat.mtimeMs
      }
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function resolveMarkdownImagePreview(request) {
  try {
    const rootPath = currentDocumentLibraryLocation().rootPath;
    const resolved = resolveMarkdownImagePath(request?.documentPath, request?.source, { rootPath });
    if (allowedMarkdownAssetPaths.size >= 2_000) allowedMarkdownAssetPaths.clear();
    allowedMarkdownAssetPaths.add(resolved);
    return {
      ok: true,
      previewUrl: markdownAssetPreviewUrl(resolved)
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function saveMarkdownImage(request) {
  try {
    const rootPath = currentDocumentLibraryLocation().rootPath;
    const asset = await savePastedMarkdownImage({ ...request, rootPath });
    const resolved = fs.realpathSync(asset.path);
    if (allowedMarkdownAssetPaths.size >= 2_000) allowedMarkdownAssetPaths.clear();
    allowedMarkdownAssetPaths.add(resolved);
    return {
      ok: true,
      asset: {
        ...asset,
        previewUrl: markdownAssetPreviewUrl(resolved)
      }
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function copyMarkdownDocument(request) {
  try {
    const rootPath = currentDocumentLibraryLocation().rootPath;
    const payload = buildMarkdownClipboardPayload({
      documentPath: request?.documentPath,
      markdown: request?.markdown,
      rootPath
    });
    clipboard.write({
      text: payload.text,
      html: payload.html
    });
    return {
      ok: true,
      imageCount: payload.imageCount,
      missingImageCount: payload.missingImageCount
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function normalizeMarkdownFileName(value, currentPath) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("文件名不能为空。");
  }

  let fileName = value.trim();
  if (fileName === "." || fileName === ".." || /[\/\\\0]/.test(fileName)) {
    throw new Error("文件名不能包含路径或非法字符。");
  }
  if (Buffer.byteLength(fileName, "utf8") > 240) {
    throw new Error("文件名过长，请缩短后再试。");
  }

  let extension = path.extname(fileName);
  if (!extension) {
    extension = path.extname(currentPath) || ".md";
    fileName += extension;
  }
  if (!/^\.(?:md|markdown)$/i.test(extension)) {
    throw new Error("文件名必须以 .md 或 .markdown 结尾。");
  }
  if (!fileName.slice(0, -extension.length).trim()) {
    throw new Error("文件名不能只包含扩展名。");
  }
  return fileName;
}

async function renameMarkdownDocument(request) {
  try {
    const sourcePath = resolveMarkdownPath(request?.path);
    const sourceStat = await fs.promises.stat(sourcePath);
    if (!sourceStat.isFile()) {
      return { ok: false, error: "所选路径不是文件。" };
    }

    const expectedMtimeMs = Number(request?.expectedMtimeMs || 0);
    if (expectedMtimeMs && Math.abs(sourceStat.mtimeMs - expectedMtimeMs) > 1) {
      return {
        ok: false,
        conflict: true,
        error: "文件已被 OneDrive 或其他应用修改，请重新打开后再重命名。"
      };
    }

    const fileName = normalizeMarkdownFileName(request?.name, sourcePath);
    const targetPath = path.join(path.dirname(sourcePath), fileName);
    if (targetPath === sourcePath) {
      return readMarkdownDocument({ resource: sourcePath });
    }

    const caseOnlyRename = sourcePath.toLocaleLowerCase() === targetPath.toLocaleLowerCase();
    if (!caseOnlyRename && fs.existsSync(targetPath)) {
      return { ok: false, error: "当前文件夹中已存在同名文件。" };
    }

    if (caseOnlyRename) {
      const temporaryPath = path.join(
        path.dirname(sourcePath),
        `.${path.basename(sourcePath)}.domi-rename-${process.pid}-${Date.now().toString(36)}`
      );
      await fs.promises.rename(sourcePath, temporaryPath);
      try {
        await fs.promises.rename(temporaryPath, targetPath);
      } catch (error) {
        await fs.promises.rename(temporaryPath, sourcePath).catch(() => undefined);
        throw error;
      }
    } else {
      await fs.promises.rename(sourcePath, targetPath);
    }

    invalidateDocumentLibraryCache();
    return readMarkdownDocument({ resource: targetPath });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

let rendererFlushSequence = 0;
const pendingRendererFlushes = new Map();

function requestRendererFlush(win, reason, timeoutMs = 12_000) {
  if (!win || win.isDestroyed() || win.webContents.isDestroyed()) {
    return Promise.resolve({ ok: true });
  }
  const requestId = `renderer-flush-${process.pid}-${Date.now()}-${++rendererFlushSequence}`;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingRendererFlushes.delete(requestId);
      resolve({ ok: false, error: "保存等待超时。窗口仍保持打开，数据没有被强制丢弃。" });
    }, timeoutMs);
    timer.unref();
    pendingRendererFlushes.set(requestId, {
      senderId: win.webContents.id,
      resolve: (result) => {
        clearTimeout(timer);
        resolve(result);
      }
    });
    win.webContents.send("app:prepare-close", {
      requestId,
      reason,
      runningTaskCount: activeRuns.size
    });
  });
}

ipcMain.on("app:prepare-close-result", (event, result = {}) => {
  const requestId = String(result.requestId || "");
  const pending = pendingRendererFlushes.get(requestId);
  if (!pending || pending.senderId !== event.sender.id) return;
  pendingRendererFlushes.delete(requestId);
  pending.resolve({
    ok: result.ok === true,
    error: boundedRuntimeText(result.error, 1_000)
  });
});

let applicationQuitFlushComplete = false;
let applicationQuitFlushStarted = false;
let updateInstallRequested = false;
let updateInstallAttempt = null;
let updateInstallTimer = null;
let updateRestartPreparing = false;
let updateNativeQuitAccepted = false;
let updateInstallFailureHandler = null;
const UPDATE_INSTALL_IDLE_POLL_MS = 1_000;
const UPDATE_INSTALL_START_TIMEOUT_MS = 3 * 60 * 1_000;

nativeAutoUpdater.on("before-quit-for-update", () => {
  // Squirrel has accepted the verified package and is about to replace the
  // application. Keep the normal quit/renderer recovery handlers out of this
  // dedicated update exit path even if staging took longer than expected.
  updateNativeQuitAccepted = true;
  updateInstallFailureHandler = null;
  updateRestartPreparing = true;
  applicationQuitFlushStarted = true;
  applicationQuitFlushComplete = true;
  appendRuntimeLog("update-native-quit-accepted", {
    version: getUpdateService().snapshot().availableVersion || ""
  });
});

nativeAutoUpdater.on("error", (error) => {
  appendRuntimeLog("update-native-error", {
    message: boundedRuntimeText(error?.message || error, 2_000)
  });
  updateInstallFailureHandler?.(error);
});

function criticalUpdateActivity() {
  const domiOperations = domiIntegration?.criticalOperationSnapshot?.() || { total: 0 };
  const coordinatedOperations = serviceCoordinator.snapshot()
    .filter((entry) => entry.inFlight).length;
  const counts = {
    codex: activeRuns.size,
    postProcessing: pendingRunPostProcessing.size,
    coordinated: coordinatedOperations,
    domi: Number(domiOperations.total || 0)
  };
  return {
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0)
  };
}

function clearUpdateInstallTimer() {
  if (updateInstallTimer !== null) clearTimeout(updateInstallTimer);
  updateInstallTimer = null;
}

function scheduleUpdateInstallAttempt(delayMs = 0) {
  if (!updateInstallRequested || updateInstallTimer !== null || updateInstallAttempt) return;
  updateInstallTimer = setTimeout(() => {
    updateInstallTimer = null;
    void attemptSafeUpdateInstall();
  }, Math.max(0, delayMs));
  updateInstallTimer.unref?.();
}

function deferUpdateInstall(service, activity) {
  appendRuntimeLog("update-install-deferred", { counts: activity.counts, total: activity.total });
  service.markRestartWaiting(activity.total);
  scheduleUpdateInstallAttempt(UPDATE_INSTALL_IDLE_POLL_MS);
}

async function attemptSafeUpdateInstall() {
  if (!updateInstallRequested || updateInstallAttempt || updateRestartPreparing) return;
  const service = getUpdateService();
  if (service.snapshot().state !== "downloaded") {
    updateInstallRequested = false;
    return;
  }

  updateInstallAttempt = (async () => {
    const beforeFlush = criticalUpdateActivity();
    if (beforeFlush.total > 0) {
      deferUpdateInstall(service, beforeFlush);
      return;
    }

    service.markRestartWaiting(0);
    const windows = BrowserWindow.getAllWindows().filter((candidate) => !candidate.isDestroyed());
    const flushResults = await Promise.all(
      windows.map((win) => requestRendererFlush(win, "update-install"))
    );
    const failed = flushResults.find((result) => !result.ok);
    if (failed) {
      appendRuntimeLog("update-renderer-flush-failed", {
        message: boundedRuntimeText(failed.error, 2_000)
      });
      updateInstallRequested = false;
      service.markInstallFailure(
        failed.error || "更新前未能安全保存当前内容，请点击重试。"
      );
      return;
    }

    const afterFlush = criticalUpdateActivity();
    if (afterFlush.total > 0) {
      deferUpdateInstall(service, afterFlush);
      return;
    }

    updateRestartPreparing = true;
    try {
      // Seal the task-start gate for one event-loop turn, then check once more
      // so an IPC request that arrived alongside the update click can finish
      // registering before we commit to a restart.
      await new Promise((resolve) => setImmediate(resolve));
      const sealedActivity = criticalUpdateActivity();
      if (sealedActivity.total > 0) {
        updateRestartPreparing = false;
        deferUpdateInstall(service, sealedActivity);
        return;
      }

      // No operation is cancelled here: reaching this point means every queue
      // is already idle. Stop only the idle PLAUD broker, not the integration
      // itself, so a failed installer can recover without relaunching domi.
      try {
        await domiIntegration?.stopPlaudBackgroundSession("update-install");
      } catch (error) {
        appendRuntimeLog("update-plaud-shutdown-failed", {
          message: boundedRuntimeText(error?.message || error, 2_000)
        });
      }

      // stopPlaudBackgroundSession is asynchronous. Check the queues once more
      // after it resolves, then arm and commit without another event-loop yield.
      const finalActivity = criticalUpdateActivity();
      if (finalActivity.total > 0) {
        updateRestartPreparing = false;
        deferUpdateInstall(service, finalActivity);
        return;
      }

      const prepared = service.armInstall();
      if (!prepared.ok) {
        appendRuntimeLog("update-install-arm-failed", {
          message: boundedRuntimeText(prepared.error, 2_000)
        });
        updateRestartPreparing = false;
        updateInstallRequested = false;
        service.markInstallFailure(prepared.error || "更新尚未准备完成。");
        return;
      }

      let installQuitWatchdog = null;
      const closeUpdateResources = () => {
        updateInstallFailureHandler = null;
        if (installQuitWatchdog !== null) clearTimeout(installQuitWatchdog);
        installQuitWatchdog = null;
        updateService?.stop();
        try {
          codexClient?.close();
        } catch (error) {
          appendRuntimeLog("update-codex-close-failed", {
            message: boundedRuntimeText(error?.message || error, 2_000)
          });
        }
        try {
          stateStore?.close();
        } catch (error) {
          appendRuntimeLog("update-state-close-failed", {
            message: boundedRuntimeText(error?.message || error, 2_000)
          });
        }
      };
      const restoreAfterInstallFailure = (error) => {
        // A late watchdog must never undo the update-specific quit gate after
        // Squirrel has accepted the package. Doing so lets render-process-gone
        // recovery race the updater and reopen the old application.
        if (updateNativeQuitAccepted) return;
        if (updateInstallFailureHandler === restoreAfterInstallFailure) {
          updateInstallFailureHandler = null;
        }
        if (installQuitWatchdog !== null) clearTimeout(installQuitWatchdog);
        installQuitWatchdog = null;
        app.removeListener("will-quit", closeUpdateResources);
        updateRestartPreparing = false;
        updateInstallRequested = false;
        applicationQuitFlushStarted = false;
        applicationQuitFlushComplete = false;
        appendRuntimeLog("update-install-launch-failed", {
          message: boundedRuntimeText(error?.message || error, 2_000)
        });
        service.markInstallFailure(error || "无法启动更新安装器。");
      };

      // The renderer is flushed and every critical queue is idle. Mark this as
      // a dedicated update quit before the installer runs so before-quit never
      // opens the ordinary task-interruption confirmation. Resource shutdown is
      // delayed until Electron actually emits will-quit; a launcher failure
      // therefore leaves the current app fully operational and retryable.
      applicationQuitFlushStarted = true;
      applicationQuitFlushComplete = true;
      updateNativeQuitAccepted = false;
      updateInstallFailureHandler = restoreAfterInstallFailure;
      app.once("will-quit", closeUpdateResources);
      const committed = service.commitInstall(prepared.candidate, {
        onFailure: restoreAfterInstallFailure
      });
      if (!committed.ok) {
        restoreAfterInstallFailure(committed.error || "无法启动更新安装器。");
        return;
      }

      // commitInstall schedules quitAndInstall on setImmediate. Keep services
      // alive until will-quit proves that Electron accepted the restart.
      updateInstallRequested = false;
      clearUpdateInstallTimer();
      appendRuntimeLog("update-install-committed", {
        version: prepared.candidate.version || "",
        timeoutMs: UPDATE_INSTALL_START_TIMEOUT_MS
      });
      installQuitWatchdog = setTimeout(() => {
        if (updateNativeQuitAccepted) return;
        restoreAfterInstallFailure(
          "更新安装器在 3 分钟内未确认启动。已保留已下载更新和全部本地数据；请确认 domi 位于“应用程序”文件夹后点击重试。"
        );
      }, UPDATE_INSTALL_START_TIMEOUT_MS);
      installQuitWatchdog.unref?.();
    } catch (error) {
      updateInstallFailureHandler = null;
      updateRestartPreparing = false;
      updateInstallRequested = false;
      applicationQuitFlushStarted = false;
      applicationQuitFlushComplete = false;
      service.markInstallFailure(error);
    }
  })().finally(() => {
    updateInstallAttempt = null;
    if (updateInstallRequested && !updateRestartPreparing) {
      scheduleUpdateInstallAttempt(UPDATE_INSTALL_IDLE_POLL_MS);
    }
  });
  return updateInstallAttempt;
}

function requestSafeUpdateInstall() {
  const service = getUpdateService();
  const status = service.snapshot();
  if (status.state !== "downloaded") {
    return { ok: false, status, error: "更新尚未下载完成。" };
  }
  updateNativeQuitAccepted = false;
  updateInstallRequested = true;
  const activity = criticalUpdateActivity();
  appendRuntimeLog("update-install-requested", {
    version: status.availableVersion || "",
    counts: activity.counts,
    total: activity.total
  });
  service.markRestartWaiting(activity.total);
  scheduleUpdateInstallAttempt(activity.total > 0 ? UPDATE_INSTALL_IDLE_POLL_MS : 0);
  return { ok: true, deferred: activity.total > 0, status: service.snapshot() };
}

function createWindow() {
  const appIcon = nativeImage.createFromPath(appIconPath);
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 760,
    title: appName,
    icon: appIcon,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#f6f3ee",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    const allowed = app.isPackaged
      ? url.startsWith("file:")
      : url.startsWith("http://127.0.0.1:5173");
    if (!allowed) event.preventDefault();
  });

  let rendererRecoveryAttempts = 0;
  let rendererStableTimer = null;
  let rendererUpdateRecoveryTimer = null;
  let rendererCloseReady = false;
  let rendererClosePending = false;
  let backgroundCloseConfirmed = false;
  const scheduleRendererRecovery = (trigger, baseDelayMs) => {
    if (updateRestartPreparing || applicationQuitFlushComplete) {
      appendRuntimeLog("renderer-reload-suppressed", {
        trigger,
        reason: "update-restart"
      });
      if (rendererUpdateRecoveryTimer === null) {
        const waitForUpdateRestart = () => {
          rendererUpdateRecoveryTimer = null;
          if (win.isDestroyed()) return;
          if (updateRestartPreparing || applicationQuitFlushComplete) {
            rendererUpdateRecoveryTimer = setTimeout(waitForUpdateRestart, 1_000);
            rendererUpdateRecoveryTimer.unref?.();
            return;
          }
          scheduleRendererRecovery(trigger, baseDelayMs);
        };
        rendererUpdateRecoveryTimer = setTimeout(waitForUpdateRestart, 1_000);
        rendererUpdateRecoveryTimer.unref?.();
      }
      return;
    }
    rendererRecoveryAttempts += 1;
    const attempt = rendererRecoveryAttempts;
    if (attempt > 2) {
      appendRuntimeLog("renderer-reload-suppressed", { trigger, attempt });
      return;
    }
    const delayMs = baseDelayMs * attempt;
    appendRuntimeLog("renderer-reload-scheduled", { trigger, attempt, delayMs });
    setTimeout(() => {
      if (win.isDestroyed() || updateRestartPreparing || applicationQuitFlushComplete) return;
      appendRuntimeLog("renderer-reload-started", { trigger, attempt });
      win.webContents.reload();
    }, delayMs).unref();
  };

  win.webContents.on("did-finish-load", () => {
    if (rendererStableTimer) clearTimeout(rendererStableTimer);
    appendRuntimeLog("renderer-loaded", { recoveryAttempts: rendererRecoveryAttempts });
    rendererStableTimer = setTimeout(() => {
      rendererRecoveryAttempts = 0;
      rendererStableTimer = null;
      appendRuntimeLog("renderer-stable");
    }, 60_000);
    rendererStableTimer.unref();
  });
  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, _url, isMainFrame) => {
    if (!isMainFrame || errorCode === -3 || win.isDestroyed()) return;
    console.error(`[renderer] 页面加载失败：${errorCode} ${errorDescription}`);
    appendRuntimeLog("renderer-load-failed", {
      errorCode,
      errorDescription: boundedRuntimeText(errorDescription, 1_000),
      url: boundedRuntimeText(_url, 1_000)
    });
    scheduleRendererRecovery("did-fail-load", 800);
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error(`[renderer] 渲染进程退出：${details.reason} (${details.exitCode})`);
    appendRuntimeLog("renderer-process-gone", {
      reason: boundedRuntimeText(details.reason, 120),
      exitCode: Number(details.exitCode || 0)
    });
    if (win.isDestroyed() || details.reason === "clean-exit") return;
    scheduleRendererRecovery("render-process-gone", 1_000);
  });
  win.webContents.on("preload-error", (_event, preloadPath, error) => {
    appendRuntimeLog("renderer-preload-error", {
      preloadPath: boundedRuntimeText(preloadPath, 1_000),
      message: boundedRuntimeText(error?.message || error, 4_000),
      stack: boundedRuntimeText(error?.stack, 8_000)
    });
  });
  win.on("unresponsive", () => {
    if (win.isDestroyed()) return;
    appendRuntimeLog("renderer-unresponsive");
    void dialog.showMessageBox(win, {
      type: "warning",
      title: "domi 暂时无响应",
      message: "界面暂时无响应，后台任务仍会继续运行。",
      detail: "可以等待界面恢复，或重新载入界面并自动恢复正在执行的 Codex 对话。",
      buttons: ["继续等待", "重新载入界面"],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    }).then((result) => {
      if (result.response === 1 && !win.isDestroyed()) {
        appendRuntimeLog("renderer-manual-reload", { trigger: "unresponsive-dialog" });
        win.webContents.reload();
      }
    });
  });
  win.on("responsive", () => appendRuntimeLog("renderer-responsive"));
  win.on("focus", () => {
    void getUpdateService().checkIfStale().catch((error) => {
      appendRuntimeLog("update-focus-check-failed", {
        message: boundedRuntimeText(error?.message || error, 1_000)
      });
    });
  });
  win.on("close", (event) => {
    if (rendererCloseReady || applicationQuitFlushComplete) return;
    event.preventDefault();
    if (rendererClosePending) return;
    rendererClosePending = true;
    void (async () => {
      if (activeRuns.size > 0 && !backgroundCloseConfirmed) {
        const choice = await dialog.showMessageBox(win, {
          type: "question",
          title: "任务仍在运行",
          message: `还有 ${activeRuns.size} 个任务正在运行。`,
          detail: "关闭窗口后任务会继续在后台运行；再次打开 domi 可查看进度和结果。",
          buttons: ["保持窗口打开", "关闭窗口并在后台继续"],
          defaultId: 1,
          cancelId: 0,
          noLink: true
        });
        if (choice.response !== 1 || win.isDestroyed()) {
          rendererClosePending = false;
          return;
        }
        backgroundCloseConfirmed = true;
      }
      const result = await requestRendererFlush(win, "window-close");
      rendererClosePending = false;
      if (win.isDestroyed()) return;
      if (!result.ok) {
        await dialog.showMessageBox(win, {
          type: "warning",
          title: "尚未安全保存",
          message: "domi 已阻止关闭窗口。",
          detail: result.error || "请处理页面中的保存错误后再试。",
          buttons: ["返回继续处理"],
          noLink: true
        });
        return;
      }
      rendererCloseReady = true;
      win.close();
    })();
  });
  win.on("closed", () => {
    if (rendererStableTimer) clearTimeout(rendererStableTimer);
    if (rendererUpdateRecoveryTimer) clearTimeout(rendererUpdateRecoveryTimer);
  });

  if (app.isPackaged || process.env.NODE_ENV === "production") {
    win.loadFile(path.join(rootDir, "dist", "index.html"));
  } else {
    win.loadURL("http://127.0.0.1:5173");
  }
}

function publishCodexEvent(sender, runId, payload) {
  if (sender && !sender.isDestroyed()) {
    sender.send("codex:event", { runId, ...payload });
  }
}

function codexUserInputRequestKey(id) {
  return `${typeof id}:${String(id)}`;
}

function rememberResolvedCodexUserInput(id, runId) {
  const key = codexUserInputRequestKey(id);
  resolvedCodexUserInputs.set(key, runId);
  if (resolvedCodexUserInputs.size <= 250) return;
  const oldest = resolvedCodexUserInputs.keys().next().value;
  if (oldest !== undefined) resolvedCodexUserInputs.delete(oldest);
}

function publicCodexUserInputRequest(id, params) {
  return {
    requestId: id,
    threadId: params.threadId,
    turnId: params.turnId,
    itemId: params.itemId,
    questions: params.questions.map((question) => ({
      id: question.id,
      header: question.header,
      question: question.question,
      isOther: question.isOther,
      isSecret: question.isSecret,
      options: question.options
        ? question.options.map((option) => ({ ...option }))
        : null
    })),
    isBlocking: params.isBlocking,
    autoResolutionMs: params.autoResolutionMs
  };
}

function publishCodexUserInputRequest(run, request) {
  publishCodexEvent(run.sender, run.runId, {
    type: "user-input-request",
    threadId: request.threadId,
    turnId: request.turnId,
    request
  });
}

function handleCodexUserInputRequest({ id, params }) {
  params = normalizeCodexRoutingParams(params);
  const run = findActiveRun(params);
  if (!run || run.finished) {
    codexClient?.cancelUserInput(id, "对应的 domi 任务已经结束。");
    return;
  }
  if (run.allowUserInput === false) {
    const answers = Object.fromEntries(params.questions.map((question) => [
      question.id,
      [question.options?.[0]?.label
        || "请按当前证据做安全、可逆的最佳判断；无法判断时跳过写入并标记待审核。"]
    ]));
    const answered = codexClient?.answerUserInput(id, answers);
    if (!answered?.ok) {
      codexClient?.cancelUserInput(id, answered?.error || "后台任务不能等待交互选择。");
    }
    return;
  }
  const request = publicCodexUserInputRequest(id, params);
  run.pendingUserInputs.set(codexUserInputRequestKey(id), request);
  clearTimeout(run.idleTimer);
  run.idleTimer = null;
  publishCodexUserInputRequest(run, request);
}

function handleCodexUserInputRequestClosed({ id, params, reason }) {
  params = normalizeCodexRoutingParams(params);
  const key = codexUserInputRequestKey(id);
  const run = findActiveRun(params);
  if (!run) return;
  run.pendingUserInputs.delete(key);
  rememberResolvedCodexUserInput(id, run.runId);
  if (reason === "answered") {
    publishCodexEvent(run.sender, run.runId, {
      type: "user-input-resolved",
      threadId: params.threadId,
      turnId: params.turnId,
      requestId: id
    });
  }
  if (!run.finished && run.pendingUserInputs.size === 0) {
    armRunIdleTimeout(run);
  }
}

function findActiveRun(params = {}) {
  params = normalizeCodexRoutingParams(params);
  const resolution = resolveCodexActiveRun(activeRuns.values(), params);
  if (resolution.ambiguousCandidates.length > 0) {
    appendRuntimeLog("codex-active-run-routing-ambiguous", {
      threadId: boundedRuntimeText(params.threadId, 240),
      turnId: boundedRuntimeText(params.turnId, 240),
      candidateCount: resolution.ambiguousCandidates.length,
      candidateRunIds: resolution.ambiguousCandidates
        .slice(0, 20)
        .map((run) => boundedRuntimeText(run.runId, 240)),
      candidateTurnIds: resolution.ambiguousCandidates
        .slice(0, 20)
        .map((run) => boundedRuntimeText(run.turnId, 240))
    });
  }
  if (resolution.conflictingCandidates.length > 0) {
    appendRuntimeLog("codex-active-run-routing-conflict", {
      reason: boundedRuntimeText(resolution.rejectionReason, 120),
      threadId: boundedRuntimeText(params.threadId, 240),
      turnId: boundedRuntimeText(params.turnId, 240),
      candidateRunIds: resolution.conflictingCandidates
        .slice(0, 20)
        .map((run) => boundedRuntimeText(run.runId, 240)),
      candidateTurnIds: resolution.conflictingCandidates
        .slice(0, 20)
        .map((run) => boundedRuntimeText(run.turnId, 240))
    });
  }
  return resolution.run;
}

function textFromReasoning(item) {
  const parts = [...(item.summary || []), ...(item.content || [])];
  return parts
    .map((part) => (typeof part === "string" ? part : part?.text || ""))
    .filter(Boolean)
    .join("\n");
}

function describeItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  switch (item.type) {
    case "agentMessage":
      return { kind: "assistant", text: item.text || "" };
    case "reasoning":
      return { kind: "reasoning", text: textFromReasoning(item) || "已完成推理" };
    case "plan":
      return { kind: "todo", text: item.text || "已更新执行计划" };
    case "commandExecution":
      return {
        kind: "command",
        text: item.command || "command",
        detail: item.aggregatedOutput || "",
        status: item.status,
        exitCode: item.exitCode
      };
    case "fileChange":
      return {
        kind: "file",
        text: (item.changes || [])
          .map((change) => `${typeof change.kind === "string" ? change.kind : "更新"} ${change.path}`)
          .join("\n"),
        status: item.status
      };
    case "mcpToolCall":
      return {
        kind: "tool",
        text: `${item.server || "mcp"}:${item.tool || "tool"}`,
        detail: item.error?.message || "",
        status: item.status
      };
    case "dynamicToolCall":
      return {
        kind: "tool",
        text: [item.namespace, item.tool].filter(Boolean).join(":") || "tool",
        status: item.status
      };
    case "collabAgentToolCall":
      return {
        kind: "tool",
        text: `子任务：${item.tool || "agent"}`,
        detail: item.prompt || "",
        status: item.status
      };
    case "webSearch":
      return { kind: "search", text: item.query || "网页搜索" };
    case "imageView":
      return { kind: "file", text: `查看图片 ${item.path || ""}`.trim() };
    case "imageGeneration":
      return { kind: "file", text: item.savedPath || "已生成图片", status: item.status };
    default:
      return null;
  }
}

function publishRunUsage(run, complete = false) {
  const usage = runUsageSnapshot(run.tokenUsageTracker, complete);
  if (usage.usage_samples === 0) return null;
  publishCodexEvent(run.sender, run.runId, {
    type: "usage",
    threadId: run.threadId,
    turnId: run.turnId,
    usage
  });
  return usage;
}

function armRunIdleTimeout(run) {
  clearTimeout(run.idleTimer);
  if (run.pendingUserInputs?.size > 0) {
    run.idleTimer = null;
    return;
  }
  run.idleTimer = setTimeout(() => {
    if (run.cliProcess) {
      try {
        run.cliProcess.kill();
      } catch {}
      finishRun(run, "failed", { error: "本地客户端任务长时间没有返回事件，已停止等待。可以在当前对话中继续执行。" });
      return;
    }
    if (run.finished || activeRuns.get(run.runId) !== run) return;
    const error = "Codex 任务长时间没有返回事件，已停止等待。可以在当前对话中继续执行。";
    const interrupt = run.turnId
      ? getCodexClient().request("turn/interrupt", {
          threadId: run.threadId,
          turnId: run.turnId
        }).catch(() => null)
      : Promise.resolve();
    void interrupt.finally(() => finishRun(run, "failed", { error }));
  }, CODEX_RUN_IDLE_TIMEOUT_MS);
  run.idleTimer.unref();
}

function queueRunPostProcessing(run, type, completedAt) {
  if (type !== "completed" || !run.output.trim()) return;
  const archiveGenericOutput = !run.privateOutput
    && !run.externalType
    && !NON_ARCHIVED_WORKFLOWS.has(run.workflowId)
    && !isEntityWorkspace(run.workspacePath || demoWorkspace);
  const updateResearchCache = !run.privateOutput && Boolean(run.researchCache?.identity);
  if (!archiveGenericOutput && !updateResearchCache) return;

  const task = new Promise((resolve) => setImmediate(resolve)).then(async () => {
    const archiveTask = archiveGenericOutput
      ? (async () => {
          const archiveDir = secureWorkspaceSubdirectory(
            run.workspacePath || demoWorkspace,
            "outputs"
          );
          const stamp = new Date(completedAt).toISOString().replace(/[:.]/g, "-");
          await fs.promises.writeFile(
            path.join(archiveDir, `${stamp}-${run.runId}.md`),
            run.output,
            "utf8"
          );
          return true;
        })()
      : Promise.resolve(false);
    const cacheWorkspaceValid = updateResearchCache && researchCacheWorkspaceIsCurrent(run);
    const cacheTask = cacheWorkspaceValid
      ? enqueueResearchCacheWrite(() => updateProjectResearchCache({
            stateStore: getStateStore(),
            preparation: run.researchCache,
            output: run.output,
            appVersion: app.getVersion(),
            completedAt,
            workspacePath: run.researchCache.workspacePath || "",
            sourceThreadId: run.threadId,
            validateWorkspace: () => researchCacheWorkspaceIsCurrent(run)
          }))
      : Promise.resolve({ updated: false });
    const [archiveResult, cacheResult] = await Promise.allSettled([archiveTask, cacheTask]);
    if (archiveResult.status === "rejected") {
        appendRuntimeLog("codex-run-postprocess-failed", {
          stage: "archive",
          message: boundedRuntimeText(archiveResult.reason?.message || archiveResult.reason, 2_000)
        });
    }
    if (cacheResult.status === "rejected") {
      appendRuntimeLog("codex-run-postprocess-failed", {
        stage: "research-cache",
        message: boundedRuntimeText(cacheResult.reason?.message || cacheResult.reason, 2_000)
      });
    }
    const cacheValue = cacheResult.status === "fulfilled" ? cacheResult.value : {};
      appendRuntimeLog("codex-run-postprocess", {
        archived: archiveResult.status === "fulfilled" && archiveResult.value === true,
        cacheUpdated: Boolean(cacheValue.updated),
        cacheFileCount: Number(cacheValue.fileCount || 0),
        cacheSourceCount: Number(cacheValue.sourceCount || 0)
      });
  });
  pendingRunPostProcessing.add(task);
  void task.then(
    () => pendingRunPostProcessing.delete(task),
    () => pendingRunPostProcessing.delete(task)
  );
  return task;
}

async function finishRun(run, type, details = {}) {
  if (run.finished || run.finishing) {
    return;
  }
  run.finishing = true;
  clearTimeout(run.idleTimer);
  if (run.libraryAccess) {
    // Seal writes to the read/citation ledger before the final audit. Keep the
    // run registered until the checked result is delivered so queue replay
    // cannot start another turn during validation.
    run.libraryAccess.session.closed = true;
    try { await run.libraryAccess.session.checkCitations(run.output, { complete: type === "completed" }); }
    catch (error) {
      run.libraryAccess.session.citationCheck = { checked: false, referencedCount: 0, verifiedCount: 0, invalidCount: 0,
        missing: true, issues: [`引用校验未完成：${error.message}`] };
      run.libraryAccess.session.warnings.add(`引用校验未完成：${error.message}`);
    }
  }
  run.finished = true;
  for (const request of run.pendingUserInputs.values()) {
    codexClient?.cancelUserInput(request.requestId, "对应的 domi 任务已经结束。");
  }
  run.pendingUserInputs.clear();
  activeRuns.delete(run.runId);

  const stopped = type === "stopped";
  const ok = type === "completed" || stopped;
  const usage = run.tokenUsageTracker?.samples > 0
    ? runUsageSnapshot(run.tokenUsageTracker, type === "completed")
    : null;
  const result = {
    ok,
    stopped,
    runId: run.runId,
    threadId: run.threadId,
    turnId: run.turnId,
    output: run.output,
    error: ok ? "" : details.error || "Codex 执行失败。",
    workspacePath: run.workspacePath || demoWorkspace,
    outputPath: "",
    eventCount: run.eventCount,
    usage,
    sourceScope: run.sourceScope,
    sourceScopeIsolated: run.sourceScopeIsolated === true,
    libraryUsage: run.libraryAccess?.session.snapshot()
  };
  if (result.libraryUsage && !run.privateOutput) {
    completedLibraryUsage.set(run.runId, { usage: result.libraryUsage, rootPath: run.libraryAccess.rootPath });
    while (completedLibraryUsage.size > 100) completedLibraryUsage.delete(completedLibraryUsage.keys().next().value);
    // Host-owned cache survives renderer/app restart; the renderer only sends
    // run/citation IDs when reopening evidence, never arbitrary file paths.
    try { getStateStore().saveCache(`library-usage-v2:${run.runId}`, { usage: result.libraryUsage, rootPath: run.libraryAccess.rootPath });
      getStateStore().pruneCache("library-usage-v2:", { maxEntries: 500 }); }
    catch (error) { appendRuntimeLog("library-usage-cache-failed", { error: boundedRuntimeText(error.message, 500) }); }
  }
  const finishedAt = Date.now();
  appendRuntimeLog("codex-run-performance", {
    runId: run.runId,
    executionMode: run.executionMode,
    outcome: type,
    preflightMs: Math.max(0, (run.threadReadyAt || finishedAt) - run.acceptedAt),
    turnStartMs: run.turnAcceptedAt
      ? Math.max(0, run.turnAcceptedAt - (run.threadReadyAt || run.acceptedAt))
      : undefined,
    totalMs: Math.max(0, finishedAt - run.acceptedAt),
    eventCount: run.eventCount,
    researchCacheHit: Boolean(run.researchCache?.cacheHit),
    usageScope: usage?.usage_scope || "run_observed",
    usageComplete: usage?.usage_complete === true,
    usageSamples: usage?.usage_samples || 0,
    inputTokens: usage?.input_tokens || 0,
    cachedInputTokens: usage?.cached_input_tokens || 0,
    cacheWriteInputTokens: usage?.cache_write_input_tokens || 0,
    outputTokens: usage?.output_tokens || 0,
    reasoningOutputTokens: usage?.reasoning_output_tokens || 0
  });

  publishCodexEvent(run.sender, run.runId, {
    type,
    threadId: run.threadId,
    turnId: run.turnId,
    output: run.privateOutput ? "" : run.output,
    error: result.error,
    outputPath: "",
    eventCount: run.eventCount,
    usage,
    sourceScope: run.sourceScope,
    sourceScopeIsolated: run.sourceScopeIsolated === true,
    libraryUsage: run.privateOutput ? undefined : result.libraryUsage
  });
  run.libraryAccess?.revoke();
  run.resolve(result);
  if (!run.sourceScopeIsolated) queueRunPostProcessing(run, type, finishedAt);
}

function prepareCodexConnectionMaintenance(blockedError) {
  const { background, foreground } = partitionCodexRuns(activeRuns.values());
  if (foreground.length > 0) {
    return {
      ok: false,
      error: blockedError
    };
  }
  for (const run of background) {
    finishRun(run, "stopped");
  }
  return {
    ok: true,
    pausedBackgroundRuns: background.length
  };
}

function handleCodexNotification(method, params) {
  params = normalizeCodexRoutingParams(params);
  const run = findActiveRun(params);
  if (!run) {
    return;
  }

  run.eventCount += 1;
  armRunIdleTimeout(run);

  const markConnectionRecovered = () => {
    if (!run.connectionRecoveryActive) return;
    run.connectionRecoveryActive = false;
    publishCodexEvent(run.sender, run.runId, {
      type: "reconnected",
      threadId: run.threadId,
      turnId: run.turnId,
      summary: "连接已恢复，任务继续执行"
    });
  };

  if (method === "turn/started") {
    markConnectionRecovered();
    run.turnId = params.turnId || run.turnId;
    publishCodexEvent(run.sender, run.runId, {
      type: "started",
      threadId: run.threadId,
      turnId: run.turnId,
      summary: "Codex 已开始执行"
    });
    return;
  }

  if (method === "item/agentMessage/delta") {
    markConnectionRecovered();
    run.output += params.delta || "";
    publishCodexEvent(run.sender, run.runId, {
      type: "assistant-delta",
      threadId: run.threadId,
      turnId: run.turnId,
      text: params.delta || ""
    });
    return;
  }

  if (method === "thread/tokenUsage/updated") {
    markConnectionRecovered();
    const observed = observeThreadTokenUsage(run.tokenUsageTracker, params.tokenUsage);
    if (observed) publishRunUsage(run, false);
    return;
  }

  if (method === "rawResponse/completed") {
    markConnectionRecovered();
    const observed = observeRawResponseUsage(run.tokenUsageTracker, params.usage);
    if (observed) publishRunUsage(run, false);
    return;
  }

  if (method === "item/started" || method === "item/completed") {
    markConnectionRecovered();
    const item = describeItem(params.item);
    if (method === "item/completed" && params.item?.type === "agentMessage") {
      run.output = params.item.text || run.output;
    }
    if (item) {
      publishCodexEvent(run.sender, run.runId, {
        type: "json",
        threadId: run.threadId,
        turnId: run.turnId,
        event: {
          type: method,
          item: params.item
        },
        item
      });
    }
    return;
  }

  if (method === "error") {
    const reconnect = codexReconnectNotice(params);
    if (reconnect) {
      run.connectionRecoveryActive = true;
      publishCodexEvent(run.sender, run.runId, {
        type: "reconnecting",
        threadId: run.threadId,
        turnId: run.turnId,
        summary: reconnect.summary,
        attempt: reconnect.attempt,
        total: reconnect.total
      });
      return;
    }
    const message = params.error?.message || params.message || "Codex 执行出错。";
    publishCodexEvent(run.sender, run.runId, {
      type: "json",
      threadId: run.threadId,
      turnId: run.turnId,
      event: {
        type: "turn.failed",
        error: { message }
      }
    });
    return;
  }

  if (method === "turn/completed") {
    run.turnId = params.turnId || run.turnId;
    const status = classifyCodexTurnStatus(params.turn?.status);
    if (run.stopRequested) {
      finishRun(run, "stopped");
    } else if (status === "completed") {
      markConnectionRecovered();
      finishRun(run, "completed");
    } else if (status === "stopped") {
      markConnectionRecovered();
      finishRun(run, "stopped");
    } else {
      finishRun(run, "failed", {
        error: params.turn?.error?.message || "Codex turn 执行失败。"
      });
    }
  }
}

function failAllRuns(error) {
  for (const run of [...activeRuns.values()]) {
    finishRun(run, "failed", { error: error.message });
  }
}

function getCodexClient() {
  if (!codexClient) {
    codexClient = new CodexAppServer({
      cwd: demoWorkspace,
      version: app.getVersion(),
      runtimeProvider: getCodexRuntime,
      onNotification: handleCodexNotification,
      onUserInputRequest: handleCodexUserInputRequest,
      onUserInputRequestClosed: handleCodexUserInputRequestClosed,
      onDynamicToolCall: handleLibraryToolCall,
      onLog: (text) => {
        if (process.env.NODE_ENV !== "production") {
          safeStderrWrite(`[codex app-server] ${text}`);
        }
      },
      onExit: ({ error, intentional }) => {
        liveCodexThreads.clear();
        libraryToolThreads.clear();
        if (!intentional) {
          failAllRuns(error);
        }
      }
    });
  }
  return codexClient;
}

function resetCodexClient() {
  codexClient?.close();
  codexClient = null;
  liveCodexThreads.clear();
  libraryToolThreads.clear();
  resolvedCodexUserInputs.clear();
  serviceCoordinator.invalidate("codex:check");
}

function throwIfCodexCheckAborted(signal) {
  if (!signal?.aborted) return;
  if (signal.reason instanceof Error) throw signal.reason;
  const error = new Error("Codex 连接测试已取消。");
  error.code = "DOMI_CODEX_CONNECTION_TEST_CANCELLED";
  throw error;
}

function codexCheckTimeout(deadlineAt, maximumMs) {
  if (!Number.isFinite(deadlineAt)) return maximumMs;
  return Math.max(1, Math.min(maximumMs, deadlineAt - Date.now()));
}

async function listAvailableCodexModels(client, { signal, deadlineAt }) {
  const models = [];
  const visitedCursors = new Set();
  const modelDeadlineAt = Math.min(deadlineAt, Date.now() + CODEX_HEALTH_REQUEST_TIMEOUT_MS);
  let cursor = null;
  do {
    throwIfCodexCheckAborted(signal);
    if (Date.now() >= modelDeadlineAt) throw new Error("Codex 模型列表查询超时。");
    const page = await client.request("model/list", {
      cursor,
      limit: 50,
      includeHidden: false
    }, { timeoutMs: codexCheckTimeout(modelDeadlineAt, CODEX_HEALTH_REQUEST_TIMEOUT_MS) });
    models.push(...(page?.data || []));
    cursor = page?.nextCursor || null;
    if (cursor && visitedCursors.has(cursor)) {
      throw new Error("Codex model/list 返回了重复的分页游标。");
    }
    if (cursor) visitedCursors.add(cursor);
  } while (cursor);
  return models;
}

async function runCodexCheck({ signal, deadlineAt = Number.POSITIVE_INFINITY } = {}) {
  const startedAt = Date.now();
  throwIfCodexCheckAborted(signal);
  ensureDemoWorkspace();
  await ensureCodexRuntimeReady();
  throwIfCodexCheckAborted(signal);
  const runtimeReadyAt = Date.now();
  const loaded = getAppSettings().load();
  let detectedPath = "";
  let detectedVersion = "";
  let runtime = {
    authMode: "chatgpt",
    providerLabel: "个人 ChatGPT",
    apiBaseUrl: "",
    apiWireApi: "",
    hasApiKey: false,
    codexPath: loaded.settings.codexPath,
    env: {}
  };
  try {
    runtime = getCodexRuntime();
    const binary = resolveCodexBinary(runtime.codexPath);
    detectedPath = binary;
    const environment = codexEnvironment(runtime.env);
    const pluginSetupPromise = getDomiPluginManager().ensure({
        binary,
        env: environment,
        enabled: app.isPackaged || process.env.DOMI_INSTALL_BUNDLED_PLUGIN === "1"
      }).catch((error) => ({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    const [versionSettlement, pluginSettlement] = await Promise.allSettled([
      execFileAsync(binary, ["--version"], {
        env: environment,
        timeout: codexCheckTimeout(deadlineAt, CODEX_VERSION_CHECK_TIMEOUT_MS),
        signal
      }),
      pluginSetupPromise
    ]);
    // Promise.allSettled is intentional: after cancellation we keep the
    // connection-test single-flight slot until every already-started check has
    // drained, so no detached plugin operation can race the next attempt.
    throwIfCodexCheckAborted(signal);
    if (versionSettlement.status === "rejected") throw versionSettlement.reason;
    if (pluginSettlement.status === "rejected") throw pluginSettlement.reason;
    const versionResult = versionSettlement.value;
    const pluginSetup = pluginSettlement.value;
    detectedVersion = String(versionResult.stdout || "").trim();
    if (pluginSetup.updated) resetCodexClient();
    const pluginReadyAt = Date.now();
    throwIfCodexCheckAborted(signal);
    const client = getCodexClient();
    const healthTimeoutMs = codexCheckTimeout(deadlineAt, CODEX_HEALTH_REQUEST_TIMEOUT_MS);
    const healthSettlements = await Promise.allSettled([
      runtime.authMode === "chatgpt"
        ? client.request("account/read", { refreshToken: false }, {
            timeoutMs: healthTimeoutMs
          })
        : Promise.resolve({ account: null, requiresOpenaiAuth: false }),
      listAvailableCodexModels(client, { signal, deadlineAt }),
      client.request("config/read", { includeLayers: false }, {
        timeoutMs: healthTimeoutMs
      })
    ]);
    throwIfCodexCheckAborted(signal);
    const rejectedHealthCheck = healthSettlements.find((result) => result.status === "rejected");
    if (rejectedHealthCheck) throw rejectedHealthCheck.reason;
    const [accountResult, modelResult, configResult] = healthSettlements.map((result) => result.value);
    const account = accountResult?.account || null;
    const config = configResult?.config || {};
    const requiresOpenaiAuth = runtime.authMode === "chatgpt"
      && Boolean(accountResult?.requiresOpenaiAuth);
    const authenticated = isSelectedCodexConnectionReady({
      authMode: runtime.authMode,
      requiresOpenaiAuth,
      account,
      relayCredentialStored: runtime.hasApiKey
    });

    const result = {
      ok: authenticated,
      path: binary,
      version: detectedVersion,
      transport: "app-server",
      workspacePath: demoWorkspace,
      account,
      authMode: runtime.authMode,
      providerLabel: runtime.providerLabel,
      apiBaseUrl: runtime.apiBaseUrl,
      apiWireApi: runtime.apiWireApi,
      credentialStored: Boolean(account || runtime.hasApiKey),
      requiresOpenaiAuth,
      configuredModel: config.model || "",
      configuredReasoningEffort: config.model_reasoning_effort || "medium",
      configuredServiceTier: config.service_tier || "standard",
      pluginSetup,
      models: modelResult.map((item) => ({
        id: item.id || item.model,
        name: item.displayName || item.model || item.id,
        description: item.description || "",
        isDefault: Boolean(item.isDefault),
        defaultReasoningEffort: item.defaultReasoningEffort || "medium",
        supportedReasoningEfforts: (item.supportedReasoningEfforts || []).map((option) => ({
          id: option.reasoningEffort,
          description: option.description || ""
        })),
        serviceTiers: (item.serviceTiers || []).map((tier) => ({
          id: tier.id,
          name: tier.name,
          description: tier.description || ""
        }))
      })),
      error: authenticated
        ? ""
        : runtime.authMode === "relay"
          ? "中转站凭据未就绪，请重新保存配置并测试；无需登录 ChatGPT。"
          : "请先登录 ChatGPT Codex。"
    };
    appendRuntimeLog("codex-check-performance", {
      outcome: result.ok ? "ready" : "not-ready",
      runtimeMs: runtimeReadyAt - startedAt,
      pluginMs: pluginReadyAt - runtimeReadyAt,
      appServerMs: Date.now() - pluginReadyAt,
      totalMs: Date.now() - startedAt
    });
    return result;
  } catch (error) {
    throwIfCodexCheckAborted(signal);
    appendRuntimeLog("codex-check-performance", {
      outcome: "failed",
      runtimeMs: runtimeReadyAt - startedAt,
      totalMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      ok: false,
      path: detectedPath,
      version: detectedVersion,
      transport: "app-server",
      workspacePath: demoWorkspace,
      account: null,
      authMode: runtime.authMode,
      providerLabel: runtime.providerLabel,
      apiBaseUrl: runtime.apiBaseUrl,
      credentialStored: false,
      requiresOpenaiAuth: true,
      configuredModel: "",
      configuredReasoningEffort: "medium",
      configuredServiceTier: "standard",
      pluginSetup: null,
      models: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function runCodexCheckCached(_event, request = {}) {
  return serviceCoordinator.run(
    "codex:check",
    runCodexCheck,
    {
      force: request?.refreshModels === true,
      ttlMs: CODEX_CHECK_CACHE_TTL_MS,
      ttlForValue: (value) => value?.ok ? CODEX_CHECK_CACHE_TTL_MS : 5_000,
      retries: 0,
      allowStale: true
    }
  );
}

function codexThreadRuntimeKey(workspacePath, sandbox, payload = {}) {
  return sourceScopedThreadKey(path.resolve(workspacePath), sandbox, payload);
}

async function resolveThread(client, payload, workspacePath, sandbox) {
  const model = payload.model && payload.model !== "default" ? payload.model : undefined;
  const effort = payload.reasoningEffort && payload.reasoningEffort !== "default"
    ? payload.reasoningEffort
    : undefined;
  const serviceTier = payload.serviceTier === "standard"
    ? null
    : payload.serviceTier && payload.serviceTier !== "default"
      ? payload.serviceTier
      : undefined;
  const restricted = isRestrictedSourceScope(payload);
  const threadConfig = {
    web_search: payload.webSearch === false ? "disabled" : "live",
    ...(restricted ? restrictedLibraryConfig(payload.effectiveCodexConfig || {}) : {}),
    ...(effort ? { model_reasoning_effort: effort } : {})
  };
  if (restricted && !client.capabilities().experimentalApi) throw new Error("当前 Codex 连接不支持受限资料工具，请更新 Codex 后重试；不会放宽来源权限。");
  if (payload.threadId && sourceScopeAllowsResume(payload)) {
    const runtimeKey = codexThreadRuntimeKey(workspacePath, sandbox, payload);
    if (liveCodexThreads.get(payload.threadId) === runtimeKey) {
      return payload.threadId;
    }
    try {
      const resumed = await client.request("thread/resume", {
        threadId: payload.threadId,
        model,
        serviceTier,
        config: threadConfig,
        cwd: workspacePath,
        approvalPolicy: "never",
        sandbox
      });
      liveCodexThreads.set(resumed.thread.id, runtimeKey);
      return resumed.thread.id;
    } catch {
      // Switching identity/provider can make an old Codex thread unavailable.
    }
  }

  const { response: started, toolsRegistered } = await startLibraryThread(client, {
    model,
    serviceTier,
    cwd: workspacePath,
    approvalPolicy: "never",
    sandbox,
    serviceName: "domi",
    ...(payload.libraryTools && questionNeedsLibrary(payload) && client.capabilities().experimentalApi ? { dynamicTools: libraryToolSpecs } : {}),
    ...threadPersistenceOptions(payload),
    config: threadConfig
  }, { requireDynamicTools: restricted && questionNeedsLibrary(payload) });
  if (restricted && ((questionNeedsLibrary(payload) && !toolsRegistered) || started.instructionSources?.length)) throw new Error("受限来源隔离未能生效：存在未授权的工作区指令或缺少资料工具，本轮未运行。");
  if (toolsRegistered) libraryToolThreads.add(started.thread.id);
  if (sourceScopeAllowsResume(payload)) {
    liveCodexThreads.set(
      started.thread.id,
      codexThreadRuntimeKey(workspacePath, sandbox, payload)
    );
  }
  return started.thread.id;
}

async function saveRuntimeSettings(request) {
  if (updateRestartPreparing) {
    return {
      ok: false,
      error: "domi 正在安全重启以完成更新，暂不修改运行设置。"
    };
  }
  const current = getAppSettings().load().settings;
  const {
    storageMigration = "none",
    ...settingsRequest
  } = request || {};
  // Local SQLite + Markdown is the only backend available to new users. Keep
  // an existing Feishu-primary installation in its original mode until its
  // records have been explicitly imported; never make them appear missing by
  // silently switching that user to an empty local database.
  settingsRequest.storageBackend = current.storageBackend === "feishu"
    ? "feishu"
    : "local";
  const codexConnectionChanged = [
    "codexPath",
    "authMode",
    "apiBaseUrl",
    "apiModel",
    "apiWireApi",
    "agentProvider",
    "relayCredentialConfigured"
  ].some((key) => Object.prototype.hasOwnProperty.call(settingsRequest, key)
    && settingsRequest[key] !== current[key]);
  const codexPathChanged = Object.prototype.hasOwnProperty.call(settingsRequest, "codexPath")
    && settingsRequest.codexPath !== current.codexPath;
  const dataConnectionChanged = [
    "storageBackend",
    "projectBaseToken",
    "projectTableId",
    "peopleBaseToken",
    "peopleTableId",
    "radarBaseToken",
    "radarTableId",
    "wikiSpaceId",
    "taskDocumentUrl",
    "localLibraryDir",
    "localRepositoryDir"
  ].some((key) => Object.prototype.hasOwnProperty.call(settingsRequest, key)
    && settingsRequest[key] !== current[key]);
  const connectionChanged = codexConnectionChanged || dataConnectionChanged;
  if (connectionChanged) {
    const maintenance = prepareCodexConnectionMaintenance(
      "请先停止正在执行的用户任务，再修改 Codex 或资料库连接。"
    );
    if (!maintenance.ok) return maintenance;
  }
  try {
    if (settingsRequest.authMode === "chatgpt" && current.authMode === "relay") {
      const restored = getCodexBootstrap().restoreChatGPTConfig();
      if (!restored.ok) {
        return { ok: false, error: restored.error || "无法恢复 ChatGPT Codex 配置。" };
      }
    }
    const result = getAppSettings().save(settingsRequest);
    if (dataConnectionChanged) {
      serviceCoordinator.invalidate("domi:lark-status");
    }
    if (["storageBackend", "localLibraryDir", "localRepositoryDir"].some(
      (key) => Object.prototype.hasOwnProperty.call(settingsRequest, key)
        && settingsRequest[key] !== current[key]
    )) {
      allowedMarkdownAssetPaths.clear();
      pdfPreviewRegistry.clear();
      // 资料库根目录变化时重建自动镜像监听；镜像账本在下次同步时重新对账。
      startLibraryMirrorWatcher();
    }
    getUpdateService().configureChannel(result.settings.updateChannel);
    const warning = current.storageBackend === "feishu"
      ? "旧版飞书主库仍按原模式运行；在安全导入本地完成前不会静默切换，现有读写和文档连接都会保留。"
      : storageMigration === "local-to-feishu"
        ? "已保留飞书连接；domi 不再迁移或切换主资料库，本地 SQLite + Markdown 继续作为唯一数据源。"
        : "";
    if (!codexConnectionChanged) return { ok: true, ...result, warning };
    if (codexPathChanged) {
      // The readiness promise is intentionally cached during normal startup,
      // but a user-selected runtime path is a new input and must be resolved
      // again before the connection result can be trusted.
      codexRuntimeReadinessPromise = null;
    }
    resetCodexClient();
    const codex = await runCodexCheck();
    if (codex.path) {
      const appliedSettings = getAppSettings().load().settings;
      if (appliedSettings.codexPath !== codex.path) {
        // resolveCodexBinary returns a realpath. Persist the exact executable
        // that was checked so a package-manager symlink cannot leave setup in
        // a permanent draft-path/runtime-path mismatch.
        getAppSettings().save({ codexPath: codex.path });
      }
    }
    // Runtime preparation canonicalizes symlinked/package-manager Codex paths.
    // Return the post-check settings rather than the pre-check save snapshot so
    // onboarding can immediately test the exact binary it just applied.
    return { ok: true, ...getAppSettings().load(), codex, warning };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function installCodexCli() {
  const maintenance = prepareCodexConnectionMaintenance(
    "请先停止正在执行的用户任务，再安装 Codex CLI。"
  );
  if (!maintenance.ok) return maintenance;
  const result = await getCodexBootstrap().install();
  if (!result.ok) return result;
  getAppSettings().save({ codexPath: result.path });
  resetCodexClient();
  return { ...result, pausedBackgroundRuns: maintenance.pausedBackgroundRuns };
}

async function codexRuntimeStatus() {
  return getCodexBootstrap().runtimeStatus();
}

async function updateCodexRuntime() {
  const maintenance = prepareCodexConnectionMaintenance(
    "请先停止正在执行的用户任务，再更新 Codex Runtime。"
  );
  if (!maintenance.ok) return maintenance;
  const result = await getCodexBootstrap().updateRuntime();
  if (!result.ok) return result;
  getAppSettings().save({ codexPath: result.path });
  resetCodexClient();
  return { ...result, pausedBackgroundRuns: maintenance.pausedBackgroundRuns };
}

async function rollbackCodexRuntime() {
  const maintenance = prepareCodexConnectionMaintenance(
    "请先停止正在执行的用户任务，再恢复 Codex Runtime。"
  );
  if (!maintenance.ok) return maintenance;
  const result = await getCodexBootstrap().rollbackRuntime();
  if (!result.ok) return result;
  getAppSettings().save({ codexPath: result.path });
  resetCodexClient();
  return { ...result, pausedBackgroundRuns: maintenance.pausedBackgroundRuns };
}

async function configureCodexRelay(request = {}) {
  return codexConnectionTests.run(request, async ({ signal, deadlineAt, remainingMs, setStage }) => {
    throwIfCodexCheckAborted(signal);
    const maintenance = prepareCodexConnectionMaintenance(
      "请先停止正在执行的用户任务，再修改 Codex 中转站。"
    );
    if (!maintenance.ok) return maintenance;

    setStage("relay-config");
    const result = await getCodexBootstrap().configureRelay(request, {
      signal,
      timeoutMs: remainingMs()
    });
    if (!result.ok) return result;

    // Keep app settings and the already-written Codex provider configuration
    // consistent even if cancellation lands immediately after the atomic file
    // write. Validation below is still abortable and does not mark it verified.
    getAppSettings().save({
      authMode: "relay",
      agentProvider: normalizeAgentProvider(request.agentProvider),
      apiBaseUrl: result.baseUrl,
      apiModel: result.model,
      apiWireApi: result.wireApi,
      relayCredentialConfigured: true,
      codexPath: result.codexPath
    });
    throwIfCodexCheckAborted(signal);

    setStage("relay-runtime-auth");
    resetCodexClient();
    const codex = await runCodexCheck({ signal, deadlineAt });
    throwIfCodexCheckAborted(signal);
    if (!codex.ok) {
      return {
        ok: false,
        configured: true,
        codex,
        error: codex.error || "中转站已配置，但 Codex App Server 尚未就绪。"
      };
    }

    setStage("relay-model-tool");
    const verification = await getCodexBootstrap().testConnection(result.codexPath, {
      signal,
      timeoutMs: remainingMs()
    });
    throwIfCodexCheckAborted(signal);
    return {
      ok: verification.ok,
      configured: true,
      codex,
      verification,
      pausedBackgroundRuns: maintenance.pausedBackgroundRuns,
      error: verification.ok ? "" : verification.error || "中转站测试失败。"
    };
  });
}

async function testCodexConnection(request = {}) {
  return codexConnectionTests.run(request, async ({ signal, deadlineAt, remainingMs, setStage }) => {
    throwIfCodexCheckAborted(signal);
    const maintenance = prepareCodexConnectionMaintenance(
      "请先停止正在执行的用户任务，再运行 Codex 连接测试。"
    );
    if (!maintenance.ok) return maintenance;

    setStage("runtime-auth");
    throwIfCodexCheckAborted(signal);
    resetCodexClient();
    const codex = await runCodexCheck({ signal, deadlineAt });
    throwIfCodexCheckAborted(signal);
    if (!codex.ok) {
      return { ok: false, codex, error: codex.error || "Codex App Server 不可用。" };
    }

    setStage("model-tool");
    const verification = await getCodexBootstrap().testConnection(codex.path, {
      signal,
      timeoutMs: remainingMs()
    });
    throwIfCodexCheckAborted(signal);
    return {
      ok: verification.ok,
      codex,
      verification,
      pausedBackgroundRuns: maintenance.pausedBackgroundRuns,
      error: verification.ok ? "" : verification.error || "Codex 连接测试失败。"
    };
  });
}

function cancelCodexConnectionTest(request = {}) {
  return codexConnectionTests.cancel(request?.requestId);
}

async function startChatGptLogin() {
  try {
    await ensureCodexRuntimeReady();
    const restored = getCodexBootstrap().restoreChatGPTConfig();
    if (!restored.ok) {
      return { ok: false, error: restored.error || "无法恢复 ChatGPT Codex 配置。" };
    }
    getAppSettings().save({
      authMode: "chatgpt",
      apiBaseUrl: "",
      apiModel: "",
        relayCredentialConfigured: false,
        agentProvider: "codex"
    });
    if (restored.changed) resetCodexClient();
    const response = await getCodexClient().request("account/login/start", {
      type: "chatgpt",
      appBrand: "codex",
      codexStreamlinedLogin: true,
      useHostedLoginSuccessPage: true
    });
    if (!response?.authUrl) {
      return { ok: false, error: "Codex 没有返回登录地址。" };
    }
    await shell.openExternal(response.authUrl);
    return { ok: true, loginId: response.loginId, authUrlOpened: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function runSystemDiagnostics() {
  const checks = [];
  const startedAt = Date.now();
  const push = (id, label, ok, detail) => checks.push({ id, label, ok, detail });

  const settings = getAppSettings().load();
  push(
    "secure-storage",
    process.platform === "darwin" ? "macOS Keychain" : "系统加密存储",
    settings.secureStorageAvailable,
    settings.secureStorageAvailable ? "加密存储可用" : "系统加密存储不可用"
  );

  try {
    ensureDemoWorkspace();
    await fs.promises.access(demoWorkspace, fs.constants.R_OK | fs.constants.W_OK);
    push("workspace", "本地工作区", true, demoWorkspace);
  } catch (error) {
    push("workspace", "本地工作区", false, error instanceof Error ? error.message : String(error));
  }

  try {
    getStateStore().loadAppSettings("runtime", {});
    push("database", "本地数据库", true, "SQLite 读写层正常");
  } catch (error) {
    push("database", "本地数据库", false, error instanceof Error ? error.message : String(error));
  }

  const codex = await runCodexCheck();
  push(
    "codex",
    "Codex App Server",
    codex.ok,
    codex.ok
      ? `${codex.version} · ${codex.providerLabel}`
      : codex.error || "Codex 不可用"
  );
  push(
    "domi-plugin-package",
    "内置 domi 插件",
    Boolean(codex.pluginSetup?.ok),
    codex.pluginSetup?.skipped && codex.pluginSetup.ok
      ? "开发模式未启用内置插件安装（已跳过）"
      : codex.pluginSetup?.ok
        ? `v${codex.pluginSetup.version || codex.pluginSetup.bundledVersion || "未知"}${codex.pluginSetup.gitCommit ? ` · ${codex.pluginSetup.gitCommit.slice(0, 8)}` : ""}`
        : codex.pluginSetup?.error || "Codex 检查未完成，无法确认内置插件状态"
  );

  try {
    const health = await getDomiIntegration().status();
    const pluginOk = Boolean(health.plugin?.ok);
    push(
      "domi",
      "domi 插件",
      pluginOk,
      pluginOk ? `v${health.plugin.version}` : health.plugin?.error || "未检测到插件"
    );
    push(
      "plaud",
      "PLAUD 录音转写",
      Boolean(health.plaud?.ok || health.plaud?.disabled),
      health.plaud?.disabled
        ? "未启用（已跳过连接检测）"
        : health.plaud?.ok
          ? `已连接 · ${health.plaud.queueCount || 0} 条本机队列记录`
          : health.plaud?.error || "未检测到 domi 专用浏览器中的 PLAUD 登录"
    );
  } catch (error) {
    push("domi", "domi 插件", false, error instanceof Error ? error.message : String(error));
    push("plaud", "PLAUD 录音转写", false, "domi 插件未就绪，暂时无法检测 PLAUD");
  }

  return {
    ok: checks.every((check) => check.ok),
    generatedAt: Date.now(),
    durationMs: Date.now() - startedAt,
    app: { name: appName, version: app.getVersion(), packaged: app.isPackaged },
    system: { platform: process.platform, arch: process.arch, release: os.release() },
    connection: {
      authMode: settings.settings.authMode,
      providerLabel: codex.providerLabel,
      apiBaseUrl: codex.apiBaseUrl || "",
      apiWireApi: codex.apiWireApi || "",
      credentialStored: codex.credentialStored
    },
    checks
  };
}

async function exportSystemDiagnostics(sender, report) {
  try {
    const owner = BrowserWindow.fromWebContents(sender);
    const result = await dialog.showSaveDialog(owner, {
      title: "导出 domi 诊断报告",
      defaultPath: `domi-诊断-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) return { ok: true, canceled: true };
    const safeReport = report?.checks ? report : await runSystemDiagnostics();
    await fs.promises.writeFile(result.filePath, JSON.stringify(safeReport, null, 2), "utf8");
    return { ok: true, canceled: false, path: result.filePath };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function explicitFeishuWriteIntent(payload) {
  return classifyFeishuWriteIntentFromRun(payload);
}

function needsLarkAccess(payload) {
  if (isRestrictedSourceScope(payload)) return false;
  const requestText = String(payload?.requestText || "");
  const backend = getAppSettings().load().settings.storageBackend;
  // Read/reference access and write authorization are separate. A generated
  // workflow may request a read-only Feishu lookup, but only original user
  // text can authorize a remote write.
  if (feishuReferenceRequestPattern.test(requestText)) return true;
  if (backend === "local") return false;
  if (payload?.workflowId === "schedule") return larkRequestPattern.test(requestText);
  if (payload?.workflowId === "domi-analyst") {
    return larkRequestPattern.test(requestText);
  }
  return externalDomiWorkflows.has(payload?.workflowId)
    || larkRequestPattern.test(requestText);
}

function repositoryRuntimeContext(payload) {
  if (isRestrictedSourceScope(payload)) return "";
  if (!externalDomiWorkflows.has(payload?.workflowId)
    && !larkRequestPattern.test(String(payload?.requestText || ""))) {
    return "";
  }
  const settings = getAppSettings().load().settings;
  const feishuWriteIntent = explicitFeishuWriteIntent(payload);
  if (payload?.workflowId === "schedule") {
    return [
      "domi 本轮日历配置事实：",
      `- 默认解释时区：${settings.outlookCalendarTimezone || "Asia/Shanghai"}。`,
      "- 实际发送账号必须通过 Outlook Calendar get_profile 实时取得；本机记录只用于设置界面展示，不能切换或替代连接器身份。",
      `- 本机保存了 ${parseCalendarRecipients(settings.outlookCalendarRecipients).length} 个常用参会人候选；只有客户端已加入本轮输入的邮箱才算选中。`,
      "- 一个或多个参会人邮箱必须来自本轮用户输入；未提供时主动询问，不得自动群发常用参会人列表。",
      "- 不得把私人邮箱写入产物或日志。"
    ].join("\n");
  }
  if (settings.storageBackend === "local") {
    return [
      "domi 本轮资料库事实：",
      "- 后端：local。",
      `- SQLite：${settings.localDatabasePath}`,
      `- Markdown 与资料目录：${settings.localRepositoryDir}。`,
      "- 使用 domi:investment-mgmt 本地后端；不得把权威资料库静默切换到飞书。",
      "- 已连接的飞书 Wiki、云文档、Base 和云盘只可按任务需要做只读检索与引用；只读失败不得阻塞本地交付，也不得据此改变本地主库。",
      feishuWriteIntent
        ? "- 用户本轮原始消息明确要求飞书写入；只对该消息唯一指定的动作和目标执行，不扩大范围，也不改变本地后端。"
        : "- 本轮没有用户原始飞书写入指令：禁止创建、编辑、更新、覆盖、上传或发布任何飞书文档、Wiki 节点、Base 记录或消息。"
    ].join("\n");
  }
  const legacyManagementWrite = legacyFeishuPrimaryWriteWorkflows.has(
    String(payload?.workflowId || "")
  );
  return [
    "domi 本轮资料库事实：",
    "- 后端：legacy_feishu_primary；仅在完成安全本地导入前兼容既有主库。",
    "- 使用本机已经固定映射的既有 Base、唯一 Wiki 项目文档与本地材料目录；错误时不要静默切换后端，也不得创建第二套管理库。",
    legacyManagementWrite
      ? "- 当前工作流可严格按对应 domi Skill 完成既有 Base／唯一 Wiki 主文档的管理闭环；权限只覆盖本机既有固定目标、必要字段和写后回读。"
      : "- 当前工作流没有旧主库管理写入权限；既有 Base／Wiki 只读。",
    "- 普通飞书云文档、任意 Wiki 节点、外部发布副本和消息不属于旧主库管理闭环。",
    feishuWriteIntent
      ? "- 用户本轮原始消息明确要求额外的飞书外部写入；只对该消息唯一指定的动作和目标执行。"
      : "- 本轮没有用户原始飞书外部写入指令：除上述既有主库管理闭环外，不得创建、编辑、更新、覆盖或发布任何飞书外部内容。"
  ].join("\n");
}

async function larkRuntimeContext(required) {
  if (!required) return "";
  const status = await serviceCoordinator.run(
    "domi:lark-status",
    () => getDomiIntegration().larkStatus(),
    {
      ttlMs: LARK_STATUS_CACHE_TTL_MS,
      retries: 0,
      allowStale: true
    }
  );
  const identity = status.userName ? `，当前用户：${status.userName}` : "";
  if (status.ok) {
    return [
      "domi 本轮飞书连接事实：",
      `- lark-cli 已验证可用${identity}；路径：${status.cliPath}。`,
      "- 飞书任务应实际调用 lark-cli；失败时报告真实错误，不推测授权状态。"
    ].join("\n");
  }
  return [
    "domi 本轮飞书连接事实：",
    `- lark-cli 预检失败；路径：${status.cliPath}。`,
    `- 实际错误：${status.error || "未返回错误详情"}。`,
    "- 请基于该错误处理，不推测其他授权原因。",
    "- 不要要求用户填写 Base Token、Table ID、Wiki Space ID，也不要要求用户把本地资料库切换成飞书。",
    "- 如果本轮只是创建飞书文档或发送飞书消息，请引导用户前往“设置 → 资料连接 → 连接飞书”；连接完成后继续原请求。"
  ].join("\n");
}

async function feishuDocumentWriteContext(payload) {
  if (isRestrictedSourceScope(payload)) return "";
  const intent = classifyFeishuDocumentIntentFromRun(payload);
  if (!intent) return "";
  const candidates = feishuMarkdownSourceCandidates(payload);
  if (intent.action !== "publish-copy" || candidates.length !== 1) {
    return safeFeishuExportContext({ intent, candidates });
  }
  let result;
  try {
    result = await getDomiIntegration().publishLocalMarkdownToFeishu({
      sourcePath: candidates[0],
      title: path.basename(candidates[0], path.extname(candidates[0]))
    });
  } catch (error) {
    result = {
      ok: false,
      remoteWrite: false,
      stage: "host",
      error: error instanceof Error ? error.message : String(error)
    };
  }
  return safeFeishuExportContext({ intent, candidates, result });
}

async function confirmExternalDomiRun(sender, payload) {
  if (isRestrictedSourceScope(payload)) return { allowed: true, sandbox: "read-only" };
  // The setup guidance assistant receives only a fixed phase and a locally
  // classified error. Keep it read-only and offline even when the user has
  // globally enabled external access; it must never inspect credentials or
  // perform login, authorization, administrator or resource-write actions.
  if (payload?.workflowId === "connection-guidance") {
    return { allowed: true, sandbox: "read-only" };
  }
  const accessMode = getAppSettings().load().settings.externalAccessMode;
  if (accessMode === "always") {
    return { allowed: true, sandbox: "danger-full-access" };
  }
  const workflowDetail = externalDomiWorkflows.get(payload?.workflowId);
  const larkLookup = larkRequestPattern.test(String(payload?.requestText || ""));
  const detail = workflowDetail || (larkLookup
    ? "读取飞书 Wiki、Watching List、People 人脉库或本地资料库材料"
    : "");
  if (!detail) return { allowed: true, sandbox: "workspace-write" };
  const owner = BrowserWindow.fromWebContents(sender);
  const options = {
    type: "warning",
    title: "允许 domi 本次访问外部数据？",
    message: "本次任务需要临时扩展 Codex 权限",
    detail: `${detail}。\n\n权限只应用于本次任务；其他普通对话仍在项目工作区沙箱中运行。`,
    buttons: ["取消", "允许本次运行"],
    defaultId: 1,
    cancelId: 0,
    noLink: true
  };
  const result = owner
    ? await dialog.showMessageBox(owner, options)
    : await dialog.showMessageBox(options);
  return {
    allowed: result.response === 1,
    sandbox: result.response === 1 ? "danger-full-access" : "workspace-write"
  };
}

async function runCodex(sender, payload) {
  if (updateRestartPreparing) {
    return {
      ok: false,
      runId: payload?.runId || "",
      error: "domi 正在安全重启以完成更新，重启后会恢复当前对话。"
    };
  }
  ensureDemoWorkspace();
  const settings = getAppSettings().load().settings;
  try { payload = normalizeQuestionPayload(payload); }
  catch (error) { return { ok: false, runId: payload?.runId || "", output: "", error: error.message }; }
  const restricted = isRestrictedSourceScope(payload);
  if (restricted && settings.authMode === "agent-cli") return { ok: false, runId: payload?.runId || "", output: "", error: "当前 CLI 执行器无法证明受限来源权限，请选择 Codex 后重试；本轮未放宽来源范围。" };
  const localEntityRequest = !restricted && settings.storageBackend === "local"
    && ["project", "person"].includes(payload?.externalType)
    && String(payload?.externalRecordId || "").trim()
    ? {
        entityType: payload.externalType,
        recordId: String(payload.externalRecordId).trim()
      }
    : null;
  const entityWorkspaceResolution = localEntityRequest
    ? await resolveCanonicalEntityWorkspace(localEntityRequest, { repairMissing: true })
    : null;
  const canonicalEntityWorkspace = entityWorkspaceResolution?.ok
    ? entityWorkspaceResolution.workspacePath
    : null;
  const requestedWorkspace = validCodexWorkspace(payload?.workspacePath);
  const genericWorkspace = requestedWorkspace && !isEntityWorkspace(requestedWorkspace)
    ? requestedWorkspace
    : null;
  const workspacePath = localEntityRequest
    ? canonicalEntityWorkspace
    : genericWorkspace || demoWorkspace;

  const runId = payload?.runId || `run-${Date.now()}`;
  const acceptedAt = Date.now();
  const prompt = restricted
    ? questionPrompt(payload)
    : String(payload?.prompt || "").trim();
  let libraryAccess = null;
  if (localEntityRequest && !canonicalEntityWorkspace) {
    return {
      ok: false,
      runId,
      output: "",
      error: entityWorkspaceResolution?.error
        || "当前项目或人物记录没有唯一且可访问的本地目录，请先处理目录冲突后重试。"
    };
  }
  if (!prompt) {
    return {
      ok: false,
      runId,
      output: "",
      error: "任务内容不能为空。",
      workspacePath
    };
  }

  if (activeRuns.has(runId)) {
    return {
      ok: false,
      runId,
      output: "",
      error: "该任务已经在执行。",
      workspacePath
    };
  }

  try {
    await ensureCodexRuntimeReady();
    const larkRequired = needsLarkAccess(payload);
    const execution = await confirmExternalDomiRun(sender, payload);
    if (!execution.allowed) {
      return {
        ok: false,
        runId,
        output: "",
        error: "已取消 domi 外部数据访问，本次工作流未运行。",
        workspacePath
      };
    }
    if (!restricted && (
      ["domi-router", "plaud-connection-assist"].includes(String(payload?.workflowId || ""))
      || /\bPLAUD\b/i.test(prompt)
    )) {
      // Codex PLAUD skills own the same private Profile. Release the renderer's
      // hidden read session first so the task never sees a false profile lock.
      await getDomiIntegration().stopPlaudBackgroundSession("codex-plaud-workflow");
    }
    const client = getCodexClient();
    libraryAccess = !restricted && (payload?.workflowId === "connection-guidance" || payload?.privateOutput === true)
      ? null : await prepareLibraryAccess(settings, sender, runId, payload);
    if (restricted && questionNeedsLibrary(payload) && !libraryAccess) throw new Error("未能建立本轮受限资料会话，本轮未运行。");
    const researchCacheScope = restricted ? { allowed: false, workspacePath: "" } : projectResearchCacheScope(payload, workspacePath);
    const researchCachePromise = restricted ? Promise.resolve({ context: "", cacheHit: false, identity: null, inventory: null, previous: null }) : prepareProjectResearchCache({
      stateStore: getStateStore(),
      payload: {
        ...payload,
        ...(researchCacheScope.allowed ? {} : { externalType: undefined }),
        cacheNamespace: researchCacheNamespace()
      },
      workspacePath: researchCacheScope.workspacePath
    }).catch(() => ({
      context: "",
      cacheHit: false,
      identity: null,
      inventory: null,
      previous: null
    }));
    const repositoryContextPromise = Promise.resolve(repositoryRuntimeContext(payload));
    const larkContextPromise = larkRuntimeContext(larkRequired);
    const feishuWriteContextPromise = feishuDocumentWriteContext(payload);
    // Retrieval bridge: retrieve local-library leads from the request text
    // itself. Failures degrade to an empty context — they must never block
    // the run from starting.
    const documentContextPromise = libraryAccess
      ? libraryAccess.session.initialContext(payload?.requestText).catch(() => ({ context: "本轮自动资料读取失败，请使用资料工具重新检索并核验正文。", keywords: [] }))
      : Promise.resolve({ context: "", keywords: [] });
    const threadPromise = client.start().then(async () => {
      let effectiveCodexConfig;
      if (restricted) {
        const effective = await client.request("config/read", { includeLayers: false, cwd: workspacePath });
        if (!effective?.config) throw new Error("无法核实 Codex 外部工具配置，受限来源模式已安全停止。");
        effectiveCodexConfig = effective.config;
      }
      return resolveThread(client, { ...payload, effectiveCodexConfig, libraryTools: Boolean(libraryAccess) }, workspacePath, execution.sandbox);
    });
    const [
      threadId,
      repositoryContext,
      larkContext,
      feishuWriteContext,
      preparedResearchCache,
      documentContext
    ] = await Promise.all([
      threadPromise,
      repositoryContextPromise,
      larkContextPromise,
      feishuWriteContextPromise,
      researchCachePromise,
      documentContextPromise
    ]);
    const actualCacheContext = preparedProjectResearchCacheContext(
      preparedResearchCache,
      threadId
    );
    const researchCache = { ...preparedResearchCache, ...actualCacheContext };
    const runtimeContext = [
      repositoryContext,
      larkContext,
      feishuWriteContext,
      researchCache.context,
      documentContext?.context,
      libraryAccess ? libraryInstructions({ fallbackCommand: restricted ? "" : libraryAccess.command,
        dynamicTools: libraryToolThreads.has(threadId), sourceScope: libraryAccess.session.sourceScope,
        selectedPaths: libraryAccess.session.selectedPaths }) : ""
    ]
      .filter(Boolean)
      .join("\n\n");
    if (documentContext?.context) {
      appendRuntimeLog("document-context-injected", {
        keywords: documentContext.keywords || [],
        contextChars: documentContext.context.length
      });
    }
    const threadReadyAt = Date.now();

    const completion = new Promise((resolve) => {
      const run = {
        runId,
        sender,
        threadId,
        turnId: null,
        executionMode: codexRunExecutionMode(payload),
        output: "",
        eventCount: 0,
        tokenUsageTracker: createRunUsageTracker(),
        workspacePath,
        privateOutput: payload?.privateOutput === true,
        externalType: payload?.externalType || "",
        externalRecordId: payload?.externalRecordId || "",
        workflowId: payload?.workflowId || "",
        allowUserInput: payload?.allowUserInput !== false,
        workspaceIdentity: directoryIdentity(workspacePath),
        finished: false,
        acceptedAt,
        threadReadyAt,
        turnAcceptedAt: null,
        researchCache,
        libraryAccess,
        sourceScope: payload.sourceScope,
        sourceScopeIsolated: restricted,
        pendingUserInputs: new Map(),
        stopRequested: false,
        resolve
      };
      activeRuns.set(runId, run);
      armRunIdleTimeout(run);
    });

    publishCodexEvent(sender, runId, {
      type: "thread",
      threadId,
      sourceScope: payload.sourceScope,
      sourceScopeIsolated: restricted,
      summary: restricted ? "已建立本轮来源隔离对话（不复用旧资料）" : payload.threadId ? "已恢复 Codex 对话" : "已创建 Codex 对话"
    });
    if (libraryAccess && !payload?.privateOutput) publishCodexEvent(sender, runId, { type: "library-usage", threadId, libraryUsage: libraryAccess.session.snapshot() });

    const model = payload.model && payload.model !== "default" ? payload.model : undefined;
    const effort = payload.reasoningEffort && payload.reasoningEffort !== "default"
      ? payload.reasoningEffort
      : undefined;
    const serviceTier = payload.serviceTier === "standard"
      ? null
      : payload.serviceTier && payload.serviceTier !== "default"
        ? payload.serviceTier
        : undefined;
    try {
      const response = await requestCodexTurn(client, {
        threadId,
        model,
        effort,
        serviceTier,
        cwd: workspacePath,
        approvalPolicy: "never",
        ...(restricted ? { sandboxPolicy: { type: "readOnly", access: { type: "restricted", includePlatformDefaults: true, readableRoots: [] } } } : {})
      }, prompt, runtimeContext, {
        onCompatibility: ({ message, error }) => {
          if (process.env.NODE_ENV !== "production" && error) {
            safeStderrWrite(
              `[codex compatibility] ${error instanceof Error ? error.message : String(error)}\n`
            );
          }
          publishCodexEvent(sender, runId, {
            type: "compatibility",
            threadId,
            summary: message
          });
        }
      });
      const run = activeRuns.get(runId);
      if (run) {
        run.turnId = response.turn.id;
        run.turnAcceptedAt = Date.now();
      }
    } catch (error) {
      const run = activeRuns.get(runId);
      if (run) {
        finishRun(run, "failed", {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return completion;
  } catch (error) {
    libraryAccess?.revoke();
    return {
      ok: false,
      runId,
      output: "",
      error: error instanceof Error ? error.message : String(error),
      workspacePath
    };
  }
}

// 把 Claude / WorkBuddy 本地客户端的一次无头运行接入 domi 任务协议：
// 复用 codex 的 run 生命周期（activeRuns、事件发布、空闲超时、停止、
// 后处理），renderer 不感知引擎差异。
async function runAgentCli(sender, payload, {
  engine, settings, runId, prompt, workspacePath, acceptedAt }) {
  if (isRestrictedSourceScope(payload)) return { ok: false, runId, output: "", error: "当前 CLI 执行器无法证明受限来源权限，请使用 Codex；本轮未扩大范围。" };
  const customPath = engine === "claude" ? settings.claudeCliPath : settings.workbuddyCliPath;
  const discovery = discoverAgentCli(engine, customPath);
  if (!discovery.ok) {
    return {
      ok: false,
      runId,
      output: "",
      error: discovery.error,
      workspacePath
    };
  }
  const login = agentCliLoginStatus(engine);
  if (login.loggedIn === false) {
    return {
      ok: false,
      runId,
      output: "",
      error: login.detail,
      workspacePath
    };
  }
  const args = buildAgentCliArgs(engine, settings, payload);
  const researchCacheScope = projectResearchCacheScope(payload, workspacePath);
  const researchCachePromise = prepareProjectResearchCache({
    stateStore: getStateStore(),
    payload: {
      ...payload,
      ...(researchCacheScope.allowed ? {} : { externalType: undefined }),
      cacheNamespace: researchCacheNamespace()
    },
    workspacePath: researchCacheScope.workspacePath
  }).catch(() => ({
    context: "",
    cacheHit: false,
    identity: null,
    inventory: null,
    previous: null
  }));
  const repositoryContextPromise = Promise.resolve(repositoryRuntimeContext(payload));
  const documentContextPromise = buildDocumentContext({
    search: (query, options) => searchDocumentLibrary({ query, ...options }),
    semanticSearch: (query, options) => semanticSearchDocumentLibrary({ query, ...options }),
    requestText: payload?.requestText,
    settings
  }).catch(() => ({ context: "", keywords: [] }));
  const [
    repositoryContext,
    preparedResearchCache,
    documentContext
  ] = await Promise.all([
    repositoryContextPromise,
    researchCachePromise,
    documentContextPromise
  ]);
  const actualCacheContext = preparedProjectResearchCacheContext(
    preparedResearchCache,
    payload.threadId
  );
  const researchCache = { ...preparedResearchCache, ...actualCacheContext };
  const runtimeContext = [
    repositoryContext,
    researchCache.context,
    documentContext?.context
  ]
    .filter(Boolean)
    .join("\n\n");
  const engineLabel = engine === "claude" ? "Claude" : "WorkBuddy";
  const fullPrompt = runtimeContext
    ? `${prompt}\n\n${runtimeContext}`
    : prompt;

  const completion = new Promise((resolve) => {
    const run = {
      runId,
      sender,
      threadId: String(payload.threadId || ""),
      turnId: "",
      executionMode: codexRunExecutionMode(payload),
      output: "",
      eventCount: 0,
      tokenUsageTracker: createRunUsageTracker(),
      workspacePath,
      privateOutput: payload?.privateOutput === true,
      externalType: payload?.externalType || "",
      externalRecordId: payload?.externalRecordId || "",
      workflowId: payload?.workflowId || "",
      allowUserInput: payload?.allowUserInput !== false,
      workspaceIdentity: directoryIdentity(workspacePath),
      finished: false,
      acceptedAt,
      threadReadyAt: Date.now(),
      turnAcceptedAt: Date.now(),
      researchCache,
      pendingUserInputs: new Map(),
      stopRequested: false,
      resolve,
      agentEngine: engine,
      cliProcess: null
    };
    activeRuns.set(runId, run);
    armRunIdleTimeout(run);
    publishCodexEvent(sender, runId, {
      type: "started",
      threadId: run.threadId,
      summary: `${engineLabel} 已开始执行`
    });
    const handle = spawnAgentRun({
      engineId: engine,
      cliPath: discovery.path,
      args,
      workspacePath,
      prompt: fullPrompt,
      onEvent: (event) => handleAgentCliEvent(run, event),
      onExit: (outcome) => {
        if (run.finished) return;
        if (outcome.type === "completed") {
          finishRun(run, "completed");
        } else if (outcome.type === "stopped") {
          finishRun(run, "stopped");
        } else {
          finishRun(run, "failed", { error: outcome.error || `${engineLabel} 执行失败。` });
        }
      }
    });
    run.cliProcess = handle;
  });
  return completion;
}

function handleAgentCliEvent(run, event) {
  if (run.finished || !event) return;
  run.eventCount += 1;
  armRunIdleTimeout(run);
  if (event.type === "session") {
    if (event.sessionId) {
      run.threadId = event.sessionId;
      run.turnId = event.sessionId;
    }
    publishCodexEvent(run.sender, run.runId, {
      type: "thread",
      threadId: run.threadId,
      summary: "已连接本地客户端会话"
    });
    return;
  }
  if (event.type === "assistant") {
    if (event.text) {
      run.output += event.text;
      publishCodexEvent(run.sender, run.runId, {
        type: "assistant-delta",
        threadId: run.threadId,
        turnId: run.turnId,
        text: event.text
      });
    }
    if (event.usage) {
      const observed = observeRawResponseUsage(run.tokenUsageTracker, event.usage);
      if (observed) publishRunUsage(run, false);
    }
    return;
  }
  if (event.type === "result") {
    if (event.sessionId) {
      run.threadId = event.sessionId;
      run.turnId = event.sessionId;
    }
    if (event.usage) {
      const observed = observeRawResponseUsage(run.tokenUsageTracker, event.usage);
      if (observed) publishRunUsage(run, true);
    }
    if (event.text && !run.output.trim()) {
      run.output = event.text;
    }
    return;
  }
  if (event.type === "raw" && event.text) {
    run.output += event.text;
    publishCodexEvent(run.sender, run.runId, {
      type: "assistant-delta",
      threadId: run.threadId,
      turnId: run.turnId,
      text: event.text
    });
  }
}

// 状态卡：检测本地客户端路径、版本与登录态。
async function agentCliStatus(engineId) {
  const settings = getAppSettings().load().settings;
  const engine = ["claude", "workbuddy"].includes(engineId)
    ? engineId
    : settings.agentProvider;
  if (!["claude", "workbuddy"].includes(engine)) {
    return {
      ok: false,
      engine: "codex",
      error: "只有 Claude 和 WorkBuddy 引擎使用本地客户端。"
    };
  }
  const customPath = engine === "claude" ? settings.claudeCliPath : settings.workbuddyCliPath;
  const discovery = discoverAgentCli(engine, customPath);
  const login = agentCliLoginStatus(engine);
  const version = discovery.ok ? await runAgentCliVersion(engine, discovery.path) : "";
  return {
    ok: true,
    engine,
    detected: discovery.ok,
    path: discovery.ok ? discovery.path : "",
    via: discovery.via || "",
    version,
    login,
    error: discovery.ok ? "" : discovery.error
  };
}


async function stopCodex(runId) {
  let run = activeRuns.get(runId);
  if (!run) {
    return { ok: false, error: "没有找到正在执行的任务。" };
  }

  // CLI 引擎：直接终止子进程，由退出回调结算 stopped。
  if (run.cliProcess) {
    run.stopRequested = true;
    try {
      run.cliProcess.kill();
    } catch {}
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (!activeRuns.has(runId)) return { ok: true };
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const unfinished = activeRuns.get(runId);
    if (unfinished) finishRun(unfinished, "stopped");
    return { ok: true };
  }
  for (let attempt = 0; attempt < 25 && !run.turnId; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    run = activeRuns.get(runId);
    if (!run) return { ok: true };
  }
  if (!run.turnId) {
    return { ok: false, error: "Codex 启动超时，尚未取得可停止的运行标识。" };
  }

  run.stopRequested = true;
  for (const request of [...run.pendingUserInputs.values()]) {
    getCodexClient().cancelUserInput(request.requestId, "用户已停止当前任务。");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (!activeRuns.has(runId)) return { ok: true };
    try {
      await getCodexClient().request("turn/interrupt", {
        threadId: run.threadId,
        turnId: run.turnId
      });
      for (let waitAttempt = 0; waitAttempt < 30; waitAttempt += 1) {
        if (!activeRuns.has(runId)) return { ok: true };
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const unfinished = activeRuns.get(runId);
      if (unfinished) finishRun(unfinished, "stopped");
      return { ok: true };
    } catch (error) {
      if (!activeRuns.has(runId)) return { ok: true };
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("no active turn") || attempt === 4) {
        return { ok: false, error: message };
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return { ok: false, error: "无法停止当前任务。" };
}

async function recoverCodexThread(threadId) {
  const normalizedThreadId = String(threadId || "").trim();
  if (!normalizedThreadId) {
    return { ok: false, threadId: "", status: "unknown", error: "Codex 对话 ID 不能为空。" };
  }

  {
    const cliSettings = getAppSettings().load().settings;
    if (["claude", "workbuddy"].includes(cliSettings.agentProvider)
      && cliSettings.authMode === "agent-cli") {
      // CLI 引擎的会话由其客户端在磁盘上持久化；重启后经 --resume 续接。
      return { ok: true, threadId: normalizedThreadId, status: "unknown" };
    }
  }
  const activeResolution = resolveCodexActiveRun(activeRuns.values(), {
    threadId: normalizedThreadId
  });
  if (activeResolution.ambiguousCandidates.length > 0) {
    appendRuntimeLog("codex-thread-recovery-ambiguous", {
      threadId: boundedRuntimeText(normalizedThreadId, 240),
      candidateCount: activeResolution.ambiguousCandidates.length,
      candidateRunIds: activeResolution.ambiguousCandidates
        .slice(0, 20)
        .map((run) => boundedRuntimeText(run.runId, 240)),
      candidateTurnIds: activeResolution.ambiguousCandidates
        .slice(0, 20)
        .map((run) => boundedRuntimeText(run.turnId, 240))
    });
    return {
      ok: false,
      threadId: normalizedThreadId,
      status: "unknown",
      error: "检测到多个任务共用同一个 Codex 对话，已停止自动恢复以避免把消息绑定到错误任务。"
    };
  }
  const activeRun = activeResolution.run;
  try {
    const response = await getCodexClient().request("thread/read", {
      threadId: normalizedThreadId,
      includeTurns: true
    });
    const turns = Array.isArray(response?.thread?.turns) ? response.thread.turns : [];
    const lastTurn = turns.at(-1);
    const items = Array.isArray(lastTurn?.items) ? lastTurn.items : [];
    const finalMessage = [...items]
      .reverse()
      .find((item) => item?.type === "agentMessage" && item?.phase === "final_answer");
    const latestMessage = finalMessage || [...items]
      .reverse()
      .find((item) => item?.type === "agentMessage");
    const turnStatus = String(lastTurn?.status || "");
    const status = classifyCodexTurnStatus(turnStatus, Boolean(activeRun));

    return {
      ok: true,
      runId: activeRun?.runId || "",
      threadId: normalizedThreadId,
      turnId: lastTurn?.id || activeRun?.turnId || "",
      status,
      output: latestMessage?.text || activeRun?.output || "",
      error: status === "failed"
        ? lastTurn?.error?.message || `Codex turn 状态：${turnStatus || "unknown"}`
        : "",
      sourceScope: activeRun?.sourceScope,
      sourceScopeIsolated: activeRun?.sourceScopeIsolated === true,
      libraryUsage: activeRun?.libraryAccess?.session.snapshot(),
      pendingUserInputRequests: activeRun
        ? [...activeRun.pendingUserInputs.values()]
        : []
    };
  } catch (error) {
    // A reopened renderer can safely rebind a run still owned by this main
    // process even when the diagnostic thread/read request is temporarily
    // unavailable. Returning unknown here would let the persistent queue start
    // a second turn for the same thread.
    if (activeRun) {
      return {
        ok: true,
        runId: activeRun.runId,
        threadId: normalizedThreadId,
        turnId: activeRun.turnId || "",
        status: "running",
        output: activeRun.output || "",
        error: "",
        sourceScope: activeRun.sourceScope,
        sourceScopeIsolated: activeRun.sourceScopeIsolated === true,
        libraryUsage: activeRun.libraryAccess?.session.snapshot(),
        pendingUserInputRequests: [...activeRun.pendingUserInputs.values()]
      };
    }
    return {
      ok: false,
      threadId: normalizedThreadId,
      status: "unknown",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function bindCodexRun(runId, sender) {
  const normalizedRunId = String(runId || "").trim();
  const run = activeRuns.get(normalizedRunId);
  if (!run) return { ok: false, error: "该任务已经结束，请重新读取最终状态。" };
  if (!sender || sender.isDestroyed()) return { ok: false, error: "当前窗口已经关闭。" };
  // The renderer installs its run context before invoking this handshake. From this point
  // onward no live delta can be delivered to a window that has not registered the run yet.
  run.sender = sender;
  if (run.libraryAccess && !run.privateOutput) publishCodexEvent(sender, run.runId, { type: "library-usage", threadId: run.threadId, libraryUsage: run.libraryAccess.session.snapshot() });
  for (const request of run.pendingUserInputs.values()) {
    publishCodexUserInputRequest(run, request);
  }
  return { ok: true };
}

function answerCodexUserInput(sender, request = {}) {
  const runId = String(request.runId || "").trim();
  const requestId = request.requestId;
  if (!runId || !["string", "number"].includes(typeof requestId)) {
    return { ok: false, error: "用户选择请求缺少有效标识。" };
  }
  const key = codexUserInputRequestKey(requestId);
  const run = activeRuns.get(runId);
  if (!run) {
    return resolvedCodexUserInputs.get(key) === runId
      ? { ok: true, duplicate: true }
      : { ok: false, error: "该任务已经结束。" };
  }
  if (!sender || sender.isDestroyed() || run.sender?.id !== sender.id) {
    return { ok: false, error: "当前窗口不能回答该任务的选择请求。" };
  }
  const pending = run.pendingUserInputs.get(key);
  if (!pending) {
    return resolvedCodexUserInputs.get(key) === runId
      ? { ok: true, duplicate: true }
      : { ok: false, error: "该选择请求已结束或不存在。" };
  }
  const result = getCodexClient().answerUserInput(requestId, request.answers);
  return result.ok
    ? result
    : { ok: false, error: result.error || "无法提交当前选择。" };
}

if (hasSingleInstanceLock) app.whenReady().then(async () => {
  appendRuntimeLog("app-ready", {
    version: app.getVersion(),
    packaged: app.isPackaged,
    platform: process.platform,
    arch: process.arch,
    brandUserDataMigrated: brandPaths.userDataMigration.migrated,
    brandWorkspaceMigrated: brandPaths.workspaceMigration.migrated
  });
  migrateLegacyDevelopmentWorkspace();
  ensureDemoWorkspace();
  installPdfProtocol();
  installMarkdownAssetProtocol();
  if (process.platform === "darwin") {
    app.dock.setIcon(nativeImage.createFromPath(appIconPath));
  }
  createWindow();
  void startDomiIntakeServer();
  getUpdateService().start();
  void ensureCodexRuntimeReady().catch((error) => {
    appendRuntimeLog("codex-runtime-repair-failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("second-instance", () => {
  const win = BrowserWindow.getAllWindows().find((candidate) => !candidate.isDestroyed());
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
});

async function drainRunPostProcessing(timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (pendingRunPostProcessing.size > 0 && Date.now() < deadline) {
    const remaining = Math.max(1, deadline - Date.now());
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, remaining);
      void Promise.allSettled([...pendingRunPostProcessing]).then(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
  return pendingRunPostProcessing.size;
}

let intakeServerHandle = null;
let intakeFeishuPoller = null;

// Feishu Wiki mirror (方案 A): local library stays authoritative; a sha256
// ledger mirrors the cognition news, subscription digests and entity
// homepages into the "domi资料库镜像" wiki space so they remain readable and
// searchable from the phone even while this computer is off.
let feishuWikiMirror = null;
let knowledgeTranslationService = null;
let knowledgeTranslationTimer = null;

function translateKnowledgeInBackground() {
  if (!knowledgeTranslationService) {
    knowledgeTranslationService = new KnowledgeTranslationService({
      settingsProvider: () => getAppSettings().load().settings,
      configPath: path.join(app.getPath("userData"), "domi-plugin-config.json"),
      repoScriptPath: path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, "..", "build"), "domi-plugin", "scripts", "domi-repo.cjs"),
      stateRoot: path.join(app.getPath("userData"), "chinese-translation"),
      runtimeProvider: getCodexRuntime,
      onProgress: (progress) => {
        if (progress.phase !== "blocks") appendRuntimeLog("knowledge-translation", progress);
      }
    });
  }
  void knowledgeTranslationService.runOnce().then((result) => {
    if (!result.skipped) appendRuntimeLog("knowledge-translation-scan", result);
  }).catch((error) => appendRuntimeLog("knowledge-translation-failed", { error: error.message || String(error) }));
}
let feishuWikiMirrorSyncing = false;
// 云端查询 worker 的快照推送状态（关机可查）：只记内存 + 落盘 sha，
// 未配置 DOMI_QUERY_WORKER_URL 时全部无行为。
const querySnapshotLastShaRef = { current: "" };

// 本地更新 → 飞书自动同步：递归监听资料库目录，.md 变更防抖 5 秒后触发
// 一次增量镜像（sha256 账本保证未变文件零 API 调用；与 30 分钟兜底互补）。
// 递归监听仅 Windows/macOS 支持，失败时记日志并依赖周期兜底。
let libraryMirrorWatcher = null;
let libraryMirrorWatcherRoot = "";
let libraryMirrorDebounceTimer = null;
const LIBRARY_MIRROR_DEBOUNCE_MS = 5_000;

function stopLibraryMirrorWatcher() {
  if (libraryMirrorDebounceTimer) { clearTimeout(libraryMirrorDebounceTimer); libraryMirrorDebounceTimer = null; }
  if (libraryMirrorWatcher) {
    try { libraryMirrorWatcher.close(); } catch { /* best-effort */ }
    libraryMirrorWatcher = null;
  }
  libraryMirrorWatcherRoot = "";
}

function scheduleMirrorFileSync(trigger) {
  if (libraryMirrorDebounceTimer) return;
  libraryMirrorDebounceTimer = setTimeout(() => {
    libraryMirrorDebounceTimer = null;
    void syncFeishuWikiMirror(trigger);
  }, LIBRARY_MIRROR_DEBOUNCE_MS);
  libraryMirrorDebounceTimer.unref?.();
}

function startLibraryMirrorWatcher() {
  const root = getAppSettings().load().settings.localRepositoryDir || "";
  if (!root || libraryMirrorWatcherRoot === root) return;
  if (!fs.existsSync(root)) return;
  stopLibraryMirrorWatcher();
  try {
    libraryMirrorWatcher = fs.watch(root, { recursive: true }, (_event, fileName) => {
      const segments = String(fileName || "").split(/[\\/]/);
      const base = segments[segments.length - 1] || "";
      if (!/\.(md|markdown)$/i.test(base)) return;
      scheduleMirrorFileSync("file-change");
    });
    libraryMirrorWatcherRoot = root;
    libraryMirrorWatcher.on("error", () => {
      appendRuntimeLog("feishu-wiki-mirror-watcher-error", { root });
      stopLibraryMirrorWatcher();
    });
    appendRuntimeLog("feishu-wiki-mirror-watcher-started", { root });
  } catch (error) {
    libraryMirrorWatcher = null;
    libraryMirrorWatcherRoot = "";
    appendRuntimeLog("feishu-wiki-mirror-watcher-failed", {
      root,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function getFeishuWikiMirror() {
  if (!feishuWikiMirror) {
    feishuWikiMirror = new FeishuWikiMirror({
      statePath: path.join(app.getPath("userData"), "feishu-wiki-mirror.json"),
      libraryRoot: getAppSettings().load().settings.localRepositoryDir || "",
      runLark: (args, options) => getDomiIntegration().lark(args, options),
      logger: (message, details = {}) => appendRuntimeLog("feishu-wiki-mirror", { message, ...details })
    });
  }
  return feishuWikiMirror;
}

async function syncFeishuWikiMirror(trigger = "manual") {
  if (feishuWikiMirrorSyncing) {
    return { ok: true, skipped: true, reason: "already-running" };
  }
  feishuWikiMirrorSyncing = true;
  try {
    const result = await getFeishuWikiMirror().sync();
    appendRuntimeLog("feishu-wiki-mirror-synced", {
      trigger,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
      total: result.total,
      spaceId: result.spaceId || "",
      error: result.error || ""
    });
    // 镜像同步成功后顺手把查询快照推给云端 worker（配置了才生效；
    // sha 未变时零流量）。
    if (result.ok !== false) pushQuerySnapshot(trigger);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendRuntimeLog("feishu-wiki-mirror-failed", { trigger, error: message });
    return { ok: false, error: message };
  } finally {
    feishuWikiMirrorSyncing = false;
  }
}

function querySnapshotLastShaPath() {
  return path.join(app.getPath("userData"), "query-snapshot-last-push.json");
}

function loadQuerySnapshotLastSha() {
  try {
    return String(JSON.parse(fs.readFileSync(querySnapshotLastShaPath(), "utf8")).sha || "");
  } catch {
    return "";
  }
}

function saveQuerySnapshotLastSha(sha) {
  try {
    fs.writeFileSync(
      querySnapshotLastShaPath(),
      `${JSON.stringify({ sha, pushedAt: new Date().toISOString() }, null, 2)}\n`,
      "utf8"
    );
  } catch {
    // 持久化失败只影响下次启动多推一次，无副作用。
  }
}

// 把资料库查询快照（行业动态卡片/项目/人脉/订阅日报 + 镜像链接）推给云端
// worker；worker 用它应答群内查询，PC 关机后依然可查。仅当配置了
// DOMI_QUERY_WORKER_URL 才生效；sha 未变时跳过，无额外流量。
function pushQuerySnapshot(trigger) {
  const workerUrl = String(process.env.DOMI_QUERY_WORKER_URL || "").trim();
  const workerToken = String(process.env.DOMI_QUERY_WORKER_TOKEN || "").trim();
  if (!/^https?:\/\//i.test(workerUrl)) return;
  (async () => {
    const settings = getAppSettings().load().settings;
    const libraryRoot = String(settings.localRepositoryDir || "");
    if (!libraryRoot) return;
    let databasePath = "";
    try {
      const configPath = path.join(app.getPath("userData"), "domi-plugin-config.json");
      databasePath = String(JSON.parse(fs.readFileSync(configPath, "utf8")).localDatabasePath || "");
    } catch {
      return;
    }
    if (!databasePath || !fs.existsSync(databasePath)) return;
    if (!querySnapshotLastShaRef.current) querySnapshotLastShaRef.current = loadQuerySnapshotLastSha();
    const snapshot = buildQuerySnapshot({ databasePath, libraryRoot, mirror: getFeishuWikiMirror() });
    const sha = snapshotSha256(snapshot);
    if (sha === querySnapshotLastShaRef.current) return;
    const response = await fetch(`${workerUrl.replace(/\/$/, "")}/snapshot`, {
      method: "POST",
      headers: { Authorization: `Bearer ${workerToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
      signal: AbortSignal.timeout(30_000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    querySnapshotLastShaRef.current = sha;
    saveQuerySnapshotLastSha(sha);
    appendRuntimeLog("query-snapshot-pushed", { trigger, sha: sha.slice(0, 12) });
  })().catch((error) => {
    appendRuntimeLog("query-snapshot-push-failed", {
      trigger,
      error: error instanceof Error ? error.message : String(error)
    });
  });
}

// 每日知识库日报：汇总自上次日报以来资料库的全部新增（行业认知/订阅日报/项目/人物），
// 先增量镜像（保证新条目带上飞书链接），归档进 13.认知库/知识库日报/，推送
// 到收件箱群。每本地日最多一份，09:00 后的第一个检查点出报；整天关机时窗口
// 自动顺延，开机后的第一份日报覆盖关机期间漏掉的全部新增。纯 SQL，零 AI 消耗。
function knowledgeReportStatePath() {
  return path.join(app.getPath("userData"), "knowledge-daily-report.json");
}

function loadKnowledgeReportState() {
  try {
    const stored = JSON.parse(fs.readFileSync(knowledgeReportStatePath(), "utf8"));
    return {
      lastReportDay: String(stored?.lastReportDay || ""),
      lastCoveredAt: Number(stored?.lastCoveredAt) || 0,
      lastReportAt: Number(stored?.lastReportAt) || 0
    };
  } catch {
    return { lastReportDay: "", lastCoveredAt: 0, lastReportAt: 0 };
  }
}

function saveKnowledgeReportState(state) {
  try {
    fs.writeFileSync(
      knowledgeReportStatePath(),
      `${JSON.stringify(state, null, 2)}\n`,
      "utf8"
    );
  } catch {
    // 状态丢失只影响下次多出一份日报，无副作用。
  }
}

function readInboxChatId() {
  try {
    return String(JSON.parse(
      fs.readFileSync(path.join(app.getPath("userData"), "intake-feishu.json"), "utf8")
    ).chatId || "");
  } catch {
    return "";
  }
}

async function generateKnowledgeDailyReport() {
  const state = loadKnowledgeReportState();
  const now = new Date();
  const reportHour = Number(process.env.DOMI_KNOWLEDGE_REPORT_HOUR) || 9;
  if (!shouldGenerateDailyReport(state, now, reportHour)) return;
  const settings = getAppSettings().load().settings;
  const libraryRoot = String(settings.localRepositoryDir || "");
  let databasePath = "";
  try {
    const configPath = path.join(app.getPath("userData"), "domi-plugin-config.json");
    databasePath = String(JSON.parse(fs.readFileSync(configPath, "utf8")).localDatabasePath || "");
  } catch {
    // 库配置缺失时本 tick 放弃，下一轮重试。
  }
  if (!libraryRoot || !databasePath || !fs.existsSync(databasePath)) return;
  const { since, until } = coverageWindow(state, now);
  // 先增量镜像：新条目拿到飞书链接后日报里才能直接点开阅读。
  try {
    await syncFeishuWikiMirror("knowledge-report");
  } catch {
    // 镜像失败不阻塞出报，条目退化为不带链接。
  }
  const report = buildKnowledgeDailyReport({
    databasePath,
    libraryRoot,
    since,
    until,
    mirror: getFeishuWikiMirror(),
    now
  });
  const reportDirectory = path.join(libraryRoot, "13.认知库", "知识库日报");
  fs.mkdirSync(reportDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(reportDirectory, `${report.dayKey}.md`),
    report.archiveMarkdown,
    "utf8"
  );
  const chatId = readInboxChatId();
  if (chatId) {
    try {
      await getDomiIntegration().lark(
        ["im", "+messages-send", "--chat-id", chatId, "--text", report.messageMarkdown],
        { label: "知识库日报" }
      );
    } catch (error) {
      appendRuntimeLog("knowledge-report-send-failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  appendRuntimeLog("knowledge-report-generated", {
    day: report.dayKey,
    news: report.counts.news,
    digests: report.counts.digests,
    projects: report.counts.projects,
    people: report.counts.people
  });
  saveKnowledgeReportState({
    lastReportDay: report.dayKey,
    lastCoveredAt: until,
    lastReportAt: Date.now()
  });
}

// 方案 B：收件箱查询指令应答。只读打开本地资料库 SQLite，检索项目／人脉／
// 行业事件，把带镜像链接的摘要回复到群里；纯 SQL，不消耗任何 AI 额度。
function inboxQueryDatabase() {
  try {
    const configPath = path.join(app.getPath("userData"), "domi-plugin-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const databasePath = String(config?.localDatabasePath || "");
    if (!databasePath || !fs.existsSync(databasePath)) return null;
    const { DatabaseSync } = require("node:sqlite");
    return new DatabaseSync(databasePath, { readOnly: true });
  } catch {
    return null;
  }
}

function inboxQueryDateString(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return "";
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function inboxQueryExcerpt(value, maxLength = 90) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function inboxQueryMirrorLink(absolutePath) {
  try {
    return getFeishuWikiMirror().mirroredUrlFor(absolutePath) || "";
  } catch {
    return "";
  }
}

function formatInboxQueryNewsRow(row) {
  const domains = (() => {
    try {
      return (JSON.parse(row.domains_json || "[]") || []).join("／") || "未分类";
    } catch {
      return "未分类";
    }
  })();
  const published = inboxQueryDateString(row.published_at);
  const link = inboxQueryMirrorLink(row.content_path || row.document_path || "");
  const lines = [
    `【${row.title}】`,
    `${domains}${published ? ` · ${published}` : ""}`,
    inboxQueryExcerpt(row.summary)
  ];
  if (link) lines.push(`阅读全文：${link}`);
  else if (row.url) lines.push(`原文：${row.url}`);
  return lines.join("\n");
}

// 方案 C：收件箱深度问答的本地资料会话。与桌面 Codex/CLI 共用同一套
// LibrarySession 混合检索、章节展开与覆盖 ledger；会话按群缓存供「续读」
// 使用，约 2 小时后过期，避免陈旧版本被当作当前原文。
const inboxQuestionSessions = new Map();
const INBOX_QUESTION_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const INBOX_QUESTION_SESSION_MAX = 8;

function closeInboxQuestionSession(entry) {
  try { entry?.session?.close(); } catch { /* best-effort cleanup */ }
}

function evictInboxQuestionSessions() {
  const now = Date.now();
  for (const [chatId, entry] of inboxQuestionSessions) {
    if (now - entry.createdAt <= INBOX_QUESTION_SESSION_TTL_MS) continue;
    inboxQuestionSessions.delete(chatId);
    closeInboxQuestionSession(entry);
  }
  while (inboxQuestionSessions.size > INBOX_QUESTION_SESSION_MAX) {
    const oldest = [...inboxQuestionSessions.entries()].sort((left, right) => left[1].createdAt - right[1].createdAt)[0];
    if (!oldest) break;
    inboxQuestionSessions.delete(oldest[0]);
    closeInboxQuestionSession(oldest[1]);
  }
}

function answerInboxQuestionSessionSettings() {
  const settings = getAppSettings().load().settings;
  if (settings.storageBackend !== "local" || !settings.localRepositoryDir) return null;
  const { rootPath } = documentLibraryLocation(settings);
  return { settings, rootPath };
}

// NotebookLM 式作答器：与中文翻译共用 Codex app-server 通道（read-only、无工具、
// 断网）。app-server 退出时置空，下一个问题自动重建。
let inboxAnswerGenerator = null;
function getInboxAnswerGenerator() {
  if (!inboxAnswerGenerator?.ready) {
    inboxAnswerGenerator?.close?.();
    inboxAnswerGenerator = new InboxAnswerGenerator({
      cwd: path.join(app.getPath("userData"), "inbox-answer"),
      runtimeProvider: getCodexRuntime
    });
  }
  return inboxAnswerGenerator;
}

async function answerInboxQuestion(query) {
  const chatId = String(query?.chatId || "");
  const library = answerInboxQuestionSessionSettings();
  if (!library) {
    return "深度问答需要已连接的本地资料库；当前不是本地存储模式，请在 domi 设置中确认后再试。";
  }
  const session = new LibrarySession({
    rootPath: library.rootPath, settings: library.settings, sourceScope: "library",
    ocrPage: documentOcrPageFromSettings(),
    search: (question, options) => searchDocumentLibrary({ query: question, ...options }),
    semanticSearch: (question, options) => semanticSearchDocumentLibrary({ query: question, ...options }),
    isCurrent: () => {
      const current = answerInboxQuestionSessionSettings();
      return Boolean(current && current.rootPath === library.rootPath);
    }
  });
  let contextResult;
  try {
    contextResult = await session.initialContext(String(query?.keyword || ""));
  } catch (error) {
    closeInboxQuestionSession({ session });
    return `深度问答检索失败：${error instanceof Error ? error.message : String(error)}。可发「查 关键词」快速检索。`;
  }
  const previous = chatId ? inboxQuestionSessions.get(chatId) : null;
  if (previous) closeInboxQuestionSession(previous);
  if (chatId) {
    inboxQuestionSessions.set(chatId, { session, sources: contextResult.sources, createdAt: Date.now() });
    evictInboxQuestionSessions();
  } else {
    closeInboxQuestionSession({ session });
  }
  // NotebookLM 式作答：模型基于检索到的原文作答并标注【n】来源；模型通道
  // 失败时回退到原文摘录模式并如实说明，不断对话。
  try {
    const answer = await getInboxAnswerGenerator().answer(String(query?.keyword || ""), contextResult.sources);
    if (answer) {
      return composeAnswerReply(String(query?.keyword || ""), answer, contextResult.sources, contextResult.warnings,
        { mirrorLink: inboxQueryMirrorLink });
    }
  } catch (error) {
    appendRuntimeLog("inbox-answer-failed", {
      question: String(query?.keyword || "").slice(0, 80),
      error: error instanceof Error ? error.message : String(error)
    });
  }
  const fallback = buildInboxQuestionReply(String(query?.keyword || ""), contextResult.sources, contextResult.warnings,
    { mirrorLink: inboxQueryMirrorLink });
  return `（模型作答暂不可用，以下为原文摘录）\n\n${fallback}`;
}

async function answerInboxContinue(query) {
  const chatId = String(query?.chatId || "");
  const entry = chatId ? inboxQuestionSessions.get(chatId) : null;
  if (!entry) {
    return "没有可续读的本地资料会话（会话约 2 小时后过期）。请重新发送一次问题，再发「续读 序号」。";
  }
  const index = Number(query?.keyword);
  const source = entry.sources[index - 1];
  if (!source) {
    return `上一轮答案只有 ${entry.sources.length} 个来源，没有第 ${index} 个；请检查序号。`;
  }
  if (!source.nextCursor && source.fullDocument) {
    return `【${index}】${source.title || source.relativePath || "资料"}在上一轮已全文读完；可发新问题检索其他资料。`;
  }
  try {
    const document = source.nextCursor
      ? await entry.session.read({ path: source.path, cursor: source.nextCursor, mode: "document", maxChars: 1500 })
      : await entry.session.read({ path: source.path, mode: "document", offset: source.endOffset, maxChars: 1500 });
    return buildInboxContinueReply(index, source, document, { mirrorLink: inboxQueryMirrorLink });
  } catch (error) {
    return `续读失败：${error instanceof Error ? error.message : String(error)}；可重新发一次问题重建会话。`;
  }
}

async function answerInboxQuery(query) {
  const messageId = String(query?.messageId || "");
  if (!messageId) return;
  const keyword = String(query?.keyword || "").trim();
  let replyText = "";
  const db = inboxQueryDatabase();
  try {
    if (query?.kind === "question") {
      replyText = await answerInboxQuestion(query);
    } else if (query?.kind === "continue") {
      replyText = await answerInboxContinue(query);
    } else if (query?.kind === "digest") {
      // 最近一份订阅日报（今天优先，找不到就回退最新镜像过的日报）。
      const today = inboxQueryDateString(Date.now());
      const libraryRoot = getAppSettings().load().settings.localRepositoryDir || "";
      const digestDir = libraryRoot ? path.join(libraryRoot, "13.认知库", "订阅日报") : "";
      const candidates = digestDir && fs.existsSync(digestDir)
        ? fs.readdirSync(digestDir).filter((name) => name.endsWith(".md")).sort().reverse()
        : [];
      const todayFile = candidates.find((name) => name.includes(today)) || candidates[0] || "";
      const link = todayFile ? inboxQueryMirrorLink(path.join(digestDir, todayFile)) : "";
      const title = todayFile ? digestDisplayTitle(fs.readFileSync(path.join(digestDir, todayFile), "utf8"), todayFile) : "";
      replyText = todayFile
        ? `最新订阅日报：《${title}》${link ? `\n阅读：${link}` : ""}\n发送「查 关键词」可检索资料库。`
        : "还没有生成订阅日报。电脑打开时说一声「生成订阅日报」，或发送「动态」看最新行业内容。";
    } else {
      const rows = [];
      if (db) {
        if (query?.kind === "news") {
          rows.push(...db.prepare(
            "SELECT event_id, title, domains_json, published_at, summary, url, content_path, document_path FROM news_events ORDER BY published_at DESC LIMIT 5"
          ).all());
          replyText = rows.length
            ? [`最近行业动态（${rows.length} 条）：`, "", ...rows.map(formatInboxQueryNewsRow)].join("\n\n")
            : "资料库还没有行业动态。转发文章到这个群即可自动入库。";
        } else if (keyword) {
          const pattern = `%${keyword.replace(/[%_]/g, "")}%`;
          const newsHits = db.prepare(
            "SELECT event_id, title, domains_json, published_at, summary, url, content_path, document_path FROM news_events WHERE title LIKE ? OR summary LIKE ? OR companies LIKE ? ORDER BY published_at DESC LIMIT 5"
          ).all(pattern, pattern, pattern);
          const projectHits = db.prepare(
            "SELECT name, domain, status, rating, notes, document_path FROM projects WHERE name LIKE ? OR notes LIKE ? LIMIT 3"
          ).all(pattern, pattern);
          const peopleHits = db.prepare(
            "SELECT name, organization, status, rating, document_path FROM people WHERE name LIKE ? OR organization LIKE ? LIMIT 3"
          ).all(pattern, pattern);
          const sections = [];
          if (projectHits.length) {
            sections.push(...projectHits.map((row) => {
              const link = inboxQueryMirrorLink(row.document_path || "");
              return [`【项目】${row.name}`, `${row.domain || "未分类"} · ${row.status || ""}${row.rating ? ` · ${row.rating}` : ""}`, inboxQueryExcerpt(row.notes, 70), link ? `主页：${link}` : ""].filter(Boolean).join("\n");
            }));
          }
          if (peopleHits.length) {
            sections.push(...peopleHits.map((row) => {
              const link = inboxQueryMirrorLink(row.document_path || "");
              return [`【人物】${row.name}${row.organization ? `（${row.organization}）` : ""}`, row.status || "", link ? `主页：${link}` : ""].filter(Boolean).join("\n");
            }));
          }
          if (newsHits.length) {
            sections.push(...newsHits.map(formatInboxQueryNewsRow));
          }
          replyText = sections.length
            ? [`「${keyword}」检索结果（${sections.length} 条）：`, "", ...sections].join("\n\n")
            : `没有找到与「${keyword}」相关的项目、人物或行业动态。换个关键词试试，或直接把相关内容转发进来。`;
        }
      }
      if (!replyText) {
        replyText = "本地资料库暂不可用，请确认 domi 已完成本地库初始化后重试。";
      }
    }
  } catch (error) {
    replyText = `查询失败：${error instanceof Error ? error.message : String(error)}`;
  } finally {
    try {
      db?.close();
    } catch {
      // read-only connection; best-effort close.
    }
  }
  try {
    await getDomiIntegration().lark(
      ["im", "+messages-reply", "--message-id", messageId, "--text", replyText],
      { label: "收件箱查询应答" }
    );
    appendRuntimeLog("intake-query-answered", { kind: query?.kind, keyword });
  } catch (error) {
    appendRuntimeLog("intake-query-reply-failed", {
      kind: query?.kind,
      keyword,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// CatPaw intake mode: when the marker file exists, forwarded items (Feishu
// inbox links/files and bookmarklet posts) are queued for the CatPaw assistant
// instead of opening a Codex task — the archival pipeline runs on CatPaw's own
// quota (fetch via scripts, summary by CatPaw, upsert through the local
// domi-repo gateway) and consumes zero ChatGPT/Codex credits. Delete the marker
// to return to native Codex dispatch; the check is per item, no restart needed.
const CATPAW_INTAKE_MARKER = path.join(os.homedir(), ".domi", "catpaw-intake.enabled");
const CATPAW_INTAKE_QUEUE = path.join(os.homedir(), ".domi", "catpaw-intake-queue.json");
const CATPAW_INTAKE_QUEUE_MAX_ITEMS = 100;
const CATPAW_QUEUE_LOCK = `${CATPAW_INTAKE_QUEUE}.lock`;

async function withCatPawQueueLock(action) {
  const deadline = Date.now() + 5_000;
  while (true) {
    try {
      fs.mkdirSync(CATPAW_QUEUE_LOCK);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      if (Date.now() >= deadline) throw new Error("CatPaw intake queue is busy; check the queue lock before retrying");
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  try {
    return await action();
  } finally {
    fs.rmdirSync(CATPAW_QUEUE_LOCK);
  }
}

async function queueIntakeItemForCatPaw(item) {
  try {
    fs.mkdirSync(path.dirname(CATPAW_INTAKE_QUEUE), { recursive: true });
    return await withCatPawQueueLock(() => {
      let state = { version: 1, items: [] };
      try {
        state = JSON.parse(fs.readFileSync(CATPAW_INTAKE_QUEUE, "utf8"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      if (!Array.isArray(state?.items)) throw new Error("CatPaw intake queue has an invalid format");
      const items = state.items;
      const dedupeKey = item?.kind === "file"
        ? `file:${item?.filePath || item?.fileName || ""}`
        : `url:${item?.url || ""}`;
      const alreadyPending = items.some((entry) =>
        entry?.dedupeKey === dedupeKey && entry?.status === "pending");
      if (!alreadyPending) {
        items.push({ ...item, dedupeKey, status: "pending", queuedAt: new Date().toISOString() });
      }
      const outstanding = items.filter((entry) => !["done", "failed"].includes(entry.status));
      const history = items.filter((entry) => ["done", "failed"].includes(entry.status))
        .slice(-CATPAW_INTAKE_QUEUE_MAX_ITEMS);
      const temporaryPath = `${CATPAW_INTAKE_QUEUE}.${process.pid}.tmp`;
      try {
        fs.writeFileSync(temporaryPath, `${JSON.stringify({ version: 1, items: [...history, ...outstanding] }, null, 2)}\n`, "utf8");
        fs.renameSync(temporaryPath, CATPAW_INTAKE_QUEUE);
      } finally {
        fs.rmSync(temporaryPath, { force: true });
      }
      return true;
    });
  } catch (error) {
    appendRuntimeLog("intake-catpaw-queue-failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function dispatchIntakeItem(item) {
  const kind = item?.kind === "file" ? "file" : "url";
  appendRuntimeLog("intake-item", { kind, url: item?.url || "", file: item?.fileName || "", source: item?.source || "" });
  if (fs.existsSync(CATPAW_INTAKE_MARKER)) {
    if (!await queueIntakeItemForCatPaw(item)) throw new Error("CatPaw 转发队列写入失败");
    appendRuntimeLog("intake-item-queued-catpaw", { kind });
    try {
      new Notification({
        title: kind === "file" ? "domi 已收到转发文件（CatPaw 待处理）" : "domi 已收到转发内容（CatPaw 待处理）",
        body: kind === "file"
          ? (item.fileName || item.title || "PDF 文件")
          : (item.title || item.url)
      }).show();
    } catch {
      // Best-effort notification only.
    }
    return;
  }
  const win = BrowserWindow.getAllWindows().find((candidate) => !candidate.isDestroyed());
  if (!win || win.webContents.isLoading()) throw new Error("domi 窗口尚未准备好，转发未被接收");
  win.webContents.send("app:intake-item", item);
  try {
    new Notification({
      title: kind === "file" ? "domi 已收到转发文件" : "domi 已收到转发内容",
      body: kind === "file"
        ? (item.fileName || item.title || "PDF 文件")
        : (item.title || item.url)
    }).show();
  } catch {
    // Notifications are best-effort; the task still opens in the app.
  }
}

function resolveIntakeConfig() {
  const bind = String(process.env.DOMI_INTAKE_BIND || "").trim().toLowerCase() === "lan"
    ? "0.0.0.0"
    : "127.0.0.1";
  const port = Number(process.env.DOMI_INTAKE_PORT) || INTAKE_DEFAULT_PORT;
  let token = String(process.env.DOMI_INTAKE_TOKEN || "").trim();
  if (bind === "0.0.0.0" && !token) {
    // LAN exposure is opt-in and always authenticated. The token persists in
    // userData so phone shortcuts keep working across restarts.
    try {
      const tokenPath = path.join(app.getPath("userData"), "intake-token.json");
      if (fs.existsSync(tokenPath)) {
        token = String(JSON.parse(fs.readFileSync(tokenPath, "utf8")).token || "");
      }
      if (!token) {
        token = crypto.randomBytes(24).toString("hex");
        fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
        fs.writeFileSync(
          tokenPath,
          `${JSON.stringify({ token, createdAt: new Date().toISOString() }, null, 2)}\n`,
          { encoding: "utf8", mode: 0o600 }
        );
      }
    } catch {
      token = "";
    }
  }
  return { bind, port, token };
}

async function startDomiIntakeServer() {
  const { bind, port, token } = resolveIntakeConfig();
  try {
    intakeServerHandle = await startIntakeServer({
      port,
      bind,
      token,
      onItem: dispatchIntakeItem
    });
    appendRuntimeLog("intake-server-started", {
      bind: intakeServerHandle.bind,
      port: intakeServerHandle.port,
      requiresToken: intakeServerHandle.requiresToken
    });
  } catch (error) {
    appendRuntimeLog("intake-server-failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  // Feishu inbox poller: picks up links shared to the dedicated group chat.
  // Stays dormant (auth check only) until the user connects lark-cli.
  try {
intakeFeishuPoller = new FeishuIntakePoller({
  statePath: path.join(app.getPath("userData"), "intake-feishu.json"),
  // Shared drop folder for files sent to the inbox; each message gets its
  // own subdirectory so the renderer can hand the absolute path to the task.
  filesDir: path.join(app.getPath("userData"), "intake-files"),
  onItem: dispatchIntakeItem,
  onQuery: (query) => {
    // 云端 worker 接管群内查询时（DOMI_QUERY_DELEGATED=1）本机保持静默，
    // 避免 PC 与云端双响应。未配置时维持本机应答。
    if (String(process.env.DOMI_QUERY_DELEGATED || "").trim() === "1") return undefined;
    return answerInboxQuery(query);
  },
  logger: (message) => appendRuntimeLog("intake-feishu", { message })
});
    if (intakeFeishuPoller.start()) {
      appendRuntimeLog("intake-feishu-poller-started", {});
    }
  } catch (error) {
    appendRuntimeLog("intake-feishu-poller-failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  // 启动后延迟几分钟跑一次增量镜像：把本地库最新内容镜像到飞书 Wiki，
  // 让手机端随时可读。sha256 账本保证无变化时几乎零 API 调用。
  const mirrorStartupTimer = setTimeout(() => {
    void syncFeishuWikiMirror("startup");
    startLibraryMirrorWatcher();
  }, 3 * 60_000);
  mirrorStartupTimer.unref?.();
  // 中文正文与摘要独立处理：Luna/medium/standard，不运行本地推理。
  // 首次补译历史材料；之后检查新增和变更内容，缓存复用已完成段落。
  const translationStartupTimer = setTimeout(translateKnowledgeInBackground, 20_000);
  translationStartupTimer.unref?.();
  knowledgeTranslationTimer = setInterval(translateKnowledgeInBackground, 60_000);
  knowledgeTranslationTimer.unref?.();
  // 周期增量镜像（30 分钟）：雷达等写库路径没有独立的镜像触发点，靠这条
  // 兜底；同步成功后顺带推送查询快照（sha 未变时零流量）。
  const mirrorIntervalTimer = setInterval(() => {
    void syncFeishuWikiMirror("interval");
  }, 30 * 60_000);
  mirrorIntervalTimer.unref?.();
  // 每日知识库日报：每 15 分钟检查一次，09:00 后的当日首检出报
  //（含开机补报：整天关机时窗口自动顺延）。
  const knowledgeReportTick = () => {
    void generateKnowledgeDailyReport().catch((error) => {
      appendRuntimeLog("knowledge-report-failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    });
  };
  const knowledgeReportFirst = setTimeout(knowledgeReportTick, 10 * 60_000);
  knowledgeReportFirst.unref?.();
  const knowledgeReportTimer = setInterval(knowledgeReportTick, 15 * 60_000);
  knowledgeReportTimer.unref?.();
}

app.on("before-quit", (event) => {
  appendRuntimeLog("app-before-quit");
  if (applicationQuitFlushComplete) return;
  event.preventDefault();
  if (applicationQuitFlushStarted) return;
  applicationQuitFlushStarted = true;
  void (async () => {
    const windows = BrowserWindow.getAllWindows().filter((candidate) => !candidate.isDestroyed());
    if (activeRuns.size > 0 && windows[0]) {
      const choice = await dialog.showMessageBox(windows[0], {
        type: "question",
        title: "退出 domi？",
        message: `还有 ${activeRuns.size} 个任务正在运行。`,
        detail: "完全退出会停止这些任务；如需任务继续，请只关闭窗口，不要退出 domi。",
        buttons: ["取消退出", "退出并停止任务"],
        defaultId: 0,
        cancelId: 0,
        noLink: true
      });
      if (choice.response !== 1) {
        applicationQuitFlushStarted = false;
        return;
      }
    }

    const flushResults = await Promise.all(
      windows.map((win) => requestRendererFlush(win, "app-quit"))
    );
    const failed = flushResults.find((result) => !result.ok);
    if (failed) {
      applicationQuitFlushStarted = false;
      if (windows[0] && !windows[0].isDestroyed()) {
        await dialog.showMessageBox(windows[0], {
          type: "warning",
          title: "尚未安全保存",
          message: "domi 已取消退出。",
          detail: failed.error || "请处理页面中的保存错误后再试。",
          buttons: ["返回继续处理"],
          noLink: true
        });
      }
      return;
    }

    if (intakeFeishuPoller) {
      intakeFeishuPoller.stop();
      intakeFeishuPoller = null;
    }
    if (intakeServerHandle) {
      const closing = intakeServerHandle.close();
      intakeServerHandle = null;
      await closing;
    }
    const remaining = await drainRunPostProcessing();
    appendRuntimeLog("app-postprocess-drained", { remaining });
    await domiIntegration?.shutdownAllPlaudOperations("app-quit");
    await documentSearchService?.close();
    await libraryToolGateway.close();
    updateService?.stop();
    clearInterval(knowledgeTranslationTimer);
    knowledgeTranslationService?.close();
    stopLibraryMirrorWatcher();
    inboxAnswerGenerator?.close();
    codexClient?.close();
    if (remaining === 0) stateStore?.close();
    applicationQuitFlushComplete = true;
    app.quit();
  })();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("app:renderer-report", (_event, payload) => {
  const kind = [
    "error",
    "unhandled-rejection",
    "react-boundary",
    "section-boundary",
    "document-operation",
    "codex-run",
    "markdown-editor-boundary",
    "markdown-editor-operation",
    "workflow-metric"
  ].includes(payload?.kind)
    ? payload.kind
    : "error";
  appendRuntimeLog("renderer-report", {
    kind,
    message: boundedRuntimeText(payload?.message, 4_000),
    stack: boundedRuntimeText(payload?.stack, 12_000),
    source: boundedRuntimeText(payload?.source, 1_000),
    line: Number.isFinite(payload?.line) ? payload.line : undefined,
    column: Number.isFinite(payload?.column) ? payload.column : undefined
  });
});

ipcMain.handle("app:notify", (_event, request = {}) => {
  if (!Notification.isSupported()) {
    return { ok: false, error: "当前系统不支持桌面通知。" };
  }
  const title = boundedRuntimeText(request.title || "domi 行业动态", 120);
  const body = boundedRuntimeText(request.body || "发现新的重要行业动态", 500);
  const notification = new Notification({
    title,
    body,
    silent: Boolean(request.silent),
    icon: nativeImage.createFromPath(appIconPath)
  });
  notification.on("click", () => {
    const win = BrowserWindow.getAllWindows().find((candidate) => !candidate.isDestroyed());
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
  notification.show();
  return { ok: true };
});

ipcMain.handle("agent:cli-status", (_event, engineId) => agentCliStatus(engineId));
ipcMain.handle("codex:check", runCodexCheckCached);
ipcMain.handle("codex:run", (event, payload) => runCodex(event.sender, payload));
ipcMain.handle("codex:stop", (_event, runId) => stopCodex(runId));
ipcMain.handle("library:citation-verify", async (_event, request = {}) => {
  if (typeof request.runId !== "string" || !request.runId || request.runId.length > 160
    || typeof request.citationId !== "string" || !/^E[a-f0-9]{12}$/.test(request.citationId)) return { ok: false, error: "无效的引用回查标识。" };
  try {
    const active = activeRuns.get(request.runId);
    const saved = active?.libraryAccess
      ? { usage: active.libraryAccess.session.snapshot(), rootPath: active.libraryAccess.rootPath }
      : completedLibraryUsage.get(request.runId) || getStateStore().loadCache(`library-usage-v2:${request.runId}`)?.value;
    const citation = saved?.usage?.citations?.find((item) => item.id === request.citationId);
    if (!citation || !saved.rootPath || active?.privateOutput) return { ok: false, error: "该引用不在宿主保存的本轮证据记录中。" };
    const reader = new DocumentReader({ rootPath: saved.rootPath, allowedPaths: [citation.path],
      cloudContentAllowed: getAppSettings().load().settings.documentSearchCloudContent === true,
      ocrPage: documentOcrPageFromSettings() });
    const checked = await verifyCitationOriginal(citation, reader);
    return { ok: true, citation: checked };
  } catch (error) { return { ok: false, error: error.message || "引用原文回查失败，不能认定当前版本已核验。" }; }
});
ipcMain.handle("codex:recover-thread", (_event, threadId) => recoverCodexThread(threadId));
ipcMain.handle("codex:bind-run", (event, runId) => bindCodexRun(runId, event.sender));
ipcMain.handle("codex:answer-user-input", (event, request) =>
  answerCodexUserInput(event.sender, request)
);
ipcMain.handle("settings:load", () => ({ ok: true, ...getAppSettings().load() }));
ipcMain.handle("settings:save", (_event, request) => saveRuntimeSettings(request));
ipcMain.handle("settings:select-directory", (event, currentPath) =>
  selectLocalDirectory(event.sender, currentPath)
);
ipcMain.handle("settings:install-codex", () => installCodexCli());
ipcMain.handle("settings:codex-runtime-status", () => codexRuntimeStatus());
ipcMain.handle("settings:update-codex-runtime", () => updateCodexRuntime());
ipcMain.handle("settings:rollback-codex-runtime", () => rollbackCodexRuntime());
ipcMain.handle("settings:configure-relay", async (event, request = {}) => {
  const requestId = normalizeConnectionTestRequestId(request?.requestId);
  const cancelOnRendererExit = () => codexConnectionTests.cancel(requestId);
  event.sender.once("destroyed", cancelOnRendererExit);
  try {
    return await configureCodexRelay({ ...request, requestId });
  } finally {
    event.sender.removeListener("destroyed", cancelOnRendererExit);
  }
});
ipcMain.handle("settings:test-codex", async (event, request = {}) => {
  const requestId = normalizeConnectionTestRequestId(request?.requestId);
  const cancelOnRendererExit = () => codexConnectionTests.cancel(requestId);
  event.sender.once("destroyed", cancelOnRendererExit);
  try {
    return await testCodexConnection({ ...request, requestId });
  } finally {
    event.sender.removeListener("destroyed", cancelOnRendererExit);
  }
});
ipcMain.handle("settings:cancel-codex-test", (_event, request) => cancelCodexConnectionTest(request));
ipcMain.handle("settings:chatgpt-login", () => startChatGptLogin());
ipcMain.handle("settings:diagnose", () => runSystemDiagnostics());
ipcMain.handle("settings:export-diagnostics", (event, report) =>
  exportSystemDiagnostics(event.sender, report)
);
ipcMain.handle("update:status", () => getUpdateService().snapshot());
ipcMain.handle("update:check", () => getUpdateService().check());
ipcMain.handle("update:download", async () => {
  const status = await getUpdateService().download();
  if (status.state === "downloaded") requestSafeUpdateInstall();
  return getUpdateService().snapshot();
});
ipcMain.handle("update:install", () => requestSafeUpdateInstall());
ipcMain.handle("files:select", (event, workspacePath, entityRequest) =>
  selectLocalFiles(event.sender, workspacePath, entityRequest)
);
ipcMain.handle("files:import", (_event, sourcePaths, workspacePath, entityRequest) =>
  importLocalFiles(workspacePath, sourcePaths, entityRequest)
);
ipcMain.handle("files:import-data", (_event, files, workspacePath, entityRequest) =>
  importLocalFileData(workspacePath, files, entityRequest)
);
ipcMain.handle("files:discard-staged", (_event, filePath) =>
  discardManagedStagingAttachment(filePath)
);
ipcMain.handle("resource:open", (_event, resource) => openResource(resource));
ipcMain.handle("markdown:open-external", (_event, resource) =>
  openMarkdownExternally(resource)
);
ipcMain.handle("document-library:list", (_event, request) => readDocumentLibrary(request));
ipcMain.handle("document-library:search", (_event, request) => searchDocumentLibrary(request));
ipcMain.handle("document-library:create", (_event, request) =>
  createDocumentLibraryItem(request)
);
ipcMain.handle("domi:subscription-digest-finalize", async (_event, request) => {
  const settings = getAppSettings().load().settings;
  if (settings.storageBackend !== "local" || !settings.localRepositoryDir) return { ok: false, error: "订阅日报需要本地资料库。" };
  const libraryRoot = settings.localRepositoryDir;
  const translator = new ChineseTranslator({
    cacheRoot: path.join(app.getPath("userData"), "chinese-translation", "blocks"), runtimeProvider: getCodexRuntime
  });
  try {
    return await finalizeSubscriptionDigest({ libraryRoot, day: request?.day, translator, beforeWrite: () => {
      if (getAppSettings().load().settings.localRepositoryDir !== libraryRoot) throw new Error("资料库配置已变化，本轮未发布。");
    } });
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  } finally { translator.close(); }
});
ipcMain.handle("markdown:read", (_event, request) => readMarkdownDocument(request));
ipcMain.handle("research:request", async (_event, request) => {
  try { return await getResearchStore().handle(request); }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
});
ipcMain.handle("markdown:save", (_event, request) => saveMarkdownDocument(request));
ipcMain.handle("markdown:rename", (_event, request) => renameMarkdownDocument(request));
ipcMain.handle("markdown:image-preview", (_event, request) => resolveMarkdownImagePreview(request));
ipcMain.handle("markdown:image-save", (_event, request) => saveMarkdownImage(request));
ipcMain.handle("markdown:copy", (_event, request) => copyMarkdownDocument(request));
ipcMain.handle("pdf:read", (_event, request) => readPdfDocument(request));
ipcMain.handle('word:read',(_event,request)=>documentAnnotations.readWord(request));
ipcMain.handle('document:export-annotated',(event,request)=>documentAnnotations.exportAnnotated(request,BrowserWindow.fromWebContents(event.sender)));
ipcMain.handle("domi:entity-workspace", async (_event, request) => {
  try {
    return await resolveCanonicalEntityWorkspace(request, {
      repairMissing: request?.repairMissing === true
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:entity-materials", async (_event, request) => {
  try {
    const cacheKey = `domi:entity-materials:${JSON.stringify(request || {})}`;
    const materials = await serviceCoordinator.run(
      cacheKey,
      () => getDomiIntegration().entityMaterials(request),
      { ttlMs: 30_000, retries: 1 }
    );
    return { ok: true, materials };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle("storage:load", (_event, defaultState) => {
  const result = getStateStore().load(defaultState);
  return { ok: true, ...result };
});

ipcMain.handle("storage:save", (_event, state) => {
  const result = getStateStore().save(state);
  return { ok: true, ...result };
});

ipcMain.handle("storage:save-patch", (_event, patch) => {
  const result = getStateStore().savePatch(patch);
  return { ok: true, ...result };
});

ipcMain.handle("workspace:create", (_event, { projectId, projectName }) => {
  const workspacePath = getStateStore().ensureProjectWorkspace(projectId, projectName);
  return { ok: true, workspacePath };
});

ipcMain.handle("workspace:open", async (_event, requestedWorkspacePath) => {
  ensureDemoWorkspace();
  const workspacePath = validCodexWorkspace(requestedWorkspacePath) || demoWorkspace;
  const error = await shell.openPath(workspacePath);
  return { ok: !error, error, workspacePath };
});

ipcMain.handle("domi:cache", () => getDomiIntegration().loadCache());
ipcMain.handle("feishu:wiki-mirror-sync", async (_event, request = {}) =>
  syncFeishuWikiMirror(String(request?.trigger || "manual"))
);
ipcMain.handle("domi:database-list", async (_event, request = {}) => {
  try {
    return await serviceCoordinator.run(
      "domi:database-list",
      () => getDomiIntegration().databaseSnapshot(),
      {
        force: request?.fresh === true,
        ttlMs: 5_000,
        retries: 0,
        allowStale: false,
        isSuccess: (value) => value?.ok !== false
      }
    );
  } catch (error) {
    return {
      ok: false,
      editable: false,
      projects: [],
      people: [],
      news: [],
      taxonomy: { domains: [], customSubdomains: [] },
      classificationReviews: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
});
ipcMain.handle("domi:database-update", async (_event, request) => {
  try {
    const result = await getDomiIntegration().updateDatabaseRecord(request);
    if (result.ok) {
      serviceCoordinator.invalidate("domi:database-list");
      serviceCoordinator.invalidate("domi:weekly-news:");
    }
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:database-update-patch", async (_event, request) => {
  try {
    const result = await getDomiIntegration().updateDatabaseRecordPatch(request);
    if (result.ok) {
      serviceCoordinator.invalidate("domi:database-list");
      serviceCoordinator.invalidate("domi:weekly-news:");
    }
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:database-preview", async (_event, request) => {
  try {
    return await getDomiIntegration().previewDatabaseRecord(request);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:database-delete", async (_event, request) => {
  try {
    const result = await getDomiIntegration().deleteDatabaseRecord(request);
    if (result.ok) {
      serviceCoordinator.invalidate("domi:database-list");
      serviceCoordinator.invalidate("domi:weekly-news:");
    }
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:database-classify", async (_event, request) => {
  try {
    const result = getDomiIntegration().classifyDatabaseProject(request);
    if (result.ok) {
      serviceCoordinator.invalidate("domi:database-list");
      serviceCoordinator.invalidate("domi:weekly-news:");
    }
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:status", async () => {
  try {
    const health = await serviceCoordinator.run(
      "domi:status",
      () => getDomiIntegration().status(),
      { ttlMs: 30_000, retries: 1 }
    );
    return { ok: true, health };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:feishu-setup-status", async (_event, request) => {
  try {
    return await getDomiIntegration().feishuSetupStatus(request);
  } catch {
    return {
      ok: false,
      connected: false,
      configured: false,
      cliAvailable: false,
      userName: "",
      error: "无法检查飞书连接状态，请重试。"
    };
  }
});
ipcMain.handle("domi:feishu-setup-start-auth", async () => {
  try {
    const result = await getDomiIntegration().startFeishuSetupAuth();
    if (!result.ok || !/^https:\/\//i.test(String(result.verificationUrl || ""))) return result;
    await shell.openExternal(result.verificationUrl);
    return { ...result, verificationOpened: true };
  } catch {
    return { ok: false, error: "无法打开飞书授权页，请检查默认浏览器后重试。" };
  }
});
ipcMain.handle("domi:feishu-setup-complete-auth", async (_event, request) => {
  try {
    return await getDomiIntegration().completeFeishuSetupAuth(request);
  } catch {
    return {
      ok: false,
      connected: false,
      configured: false,
      cliAvailable: true,
      userName: "",
      error: "飞书授权尚未完成或已过期，请重新连接。"
    };
  }
});
ipcMain.handle("domi:feishu-setup-provision", async () => {
  return {
    ok: false,
    error: "飞书现在是可选知识外挂，不再创建 Base 或切换主资料库。连接账号后可按指令搜索知识库、创建或编辑飞书文档。"
  };
});
ipcMain.handle("domi:weekly-news", async (_event, request) => {
  try {
    const normalizedRequest = {
      days: Number(request?.days) || 7,
      limit: Number(request?.limit) || 100,
      page: Number(request?.page) || 0,
      cacheOnly: Boolean(request?.cacheOnly)
    };
    return await serviceCoordinator.run(
      `domi:weekly-news:${JSON.stringify(normalizedRequest)}`,
      () => getDomiIntegration().weeklyNews(normalizedRequest),
      {
        ttlMs: normalizedRequest.cacheOnly ? 2_000 : 10_000,
        retries: normalizedRequest.cacheOnly ? 0 : 1,
        isSuccess: (value) => value?.ok !== false || value?.fromCache
      }
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:weekly-news-checkpoint", (_event, request) => {
  const result = getDomiIntegration().recordWeeklyNewsRadarCheckpoint(request);
  if (result.ok) serviceCoordinator.invalidate("domi:weekly-news:");
  return result;
});
ipcMain.handle("domi:radar-source-list", () => {
  try {
    return getDomiIntegration().listRadarSources();
  } catch (error) {
    return { ok: false, sources: [], jobs: [], updatedAt: Date.now(), error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:radar-source-save", (_event, request) => {
  try {
    const result = getDomiIntegration().saveRadarSource(request);
    serviceCoordinator.invalidate("domi:radar-source-sync:");
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:radar-source-bulk-import", (_event, request) => {
  try {
    const result = getDomiIntegration().radarSourceService.bulkImport(request);
    if (Number(result?.stats?.importedCount) > 0) {
      serviceCoordinator.invalidate("domi:radar-source-sync:");
    }
    return result;
  } catch (error) {
    return {
      ok: false,
      previewOnly: request?.previewOnly === true,
      format: "list",
      stats: {
        totalRows: 0,
        validCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        blankCount: 0,
        existingCount: 0,
        importableCount: 0,
        importedCount: 0
      },
      items: [],
      previewTruncated: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});
ipcMain.handle("domi:radar-source-delete", (_event, request) => {
  try {
    const result = getDomiIntegration().deleteRadarSource(request);
    serviceCoordinator.invalidate("domi:radar-source-sync:");
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:radar-source-sync", async (_event, request) => {
  try {
    const sourceId = String(request?.sourceId || "");
    return await serviceCoordinator.run(
      `domi:radar-source-sync:${sourceId || "all"}`,
      () => getDomiIntegration().syncRadarSources(request),
      { force: request?.fresh === true, ttlMs: 30_000, retries: 0, allowStale: false }
    );
  } catch (error) {
    return { ok: false, sources: [], jobs: [], twitterItems: [], results: [], updatedAt: Date.now(), error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:radar-source-twitter-token", (_event, request) => {
  try {
    const result = getDomiIntegration().radarSourceService.saveTwitterToken(request?.token);
    serviceCoordinator.invalidate("domi:radar-source-sync:");
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:podcast-process", async (_event, request) => {
  try {
    const jobId = String(request?.jobId || "");
    const result = await serviceCoordinator.run(
      `domi:podcast-process:${jobId}`,
      () => getDomiIntegration().processPodcastEpisode(request),
      { force: true, retries: 0, allowStale: false }
    );
    serviceCoordinator.invalidate("domi:plaud-list");
    serviceCoordinator.invalidate("domi:radar-source-sync:");
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:task-list", async (_event, request) => {
  try {
    const normalizedRequest = {
      cacheOnly: Boolean(request?.cacheOnly),
      fresh: request?.fresh === true
    };
    return await serviceCoordinator.run(
      `domi:task-list:${normalizedRequest.cacheOnly ? "cache" : "fresh"}`,
      () => getDomiIntegration().taskBoard(normalizedRequest),
      {
        ttlMs: normalizedRequest.cacheOnly ? 2_000 : 10_000,
        retries: normalizedRequest.cacheOnly ? 0 : 1,
        force: normalizedRequest.fresh,
        allowStale: true,
        isSuccess: (value) => value?.ok !== false || value?.stale
      }
    );
  } catch (error) {
    return { ok: false, configured: true, stale: false, tasks: [], error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:task-update", async (_event, request) => {
  try {
    const result = await getDomiIntegration().updateTask(request);
    serviceCoordinator.invalidate("domi:task-list:");
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:plaud-login", async (_event, request) => {
  try {
    return await getDomiIntegration().loginPlaud(request);
  } catch (error) {
    return { ok: false, connected: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:plaud-connection", async (_event, request) => {
  try {
    return await getDomiIntegration().plaudConnection(request);
  } catch (error) {
    return { ok: false, connected: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:plaud-disconnect", async (_event, request) => {
  try {
    const result = await getDomiIntegration().disconnectPlaud(request);
    serviceCoordinator.invalidate("domi:plaud-list");
    serviceCoordinator.invalidate("domi:status");
    return result;
  } catch (error) {
    return { ok: false, connected: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:plaud-list", async (_event, request) => {
  try {
    const fresh = request?.fresh === true;
    const limit = Math.min(Math.max(Number(request?.limit) || 50, 1), 100);
    const offset = Math.min(Math.max(Number(request?.offset) || 0, 0), 10_000);
    return await serviceCoordinator.run(
      `domi:plaud-list:${fresh ? "fresh" : "cached"}:${offset}:${limit}`,
      () => getDomiIntegration().plaudQueue({ offset, limit, fresh }),
      {
        ttlMs: 15_000,
        retries: 0,
        force: fresh,
        allowStale: false,
        ttlForValue: (value) => value?.ok && !value?.stale ? 15_000 : 0
      }
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:plaud-sync", async () => {
  try {
    const result = await serviceCoordinator.run(
      "domi:plaud-sync",
      () => getDomiIntegration().syncPlaud(),
      { force: true, allowStale: false, isSuccess: (value) => value?.ok !== false }
    );
    serviceCoordinator.invalidate("domi:plaud-list");
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:plaud-rename", async (_event, request) => {
  try {
    const result = await getDomiIntegration().renamePlaud(request);
    serviceCoordinator.invalidate("domi:plaud-list");
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:plaud-delete", async (_event, request) => {
  try {
    const result = await getDomiIntegration().deletePlaud(request);
    serviceCoordinator.invalidate("domi:plaud-list");
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});
ipcMain.handle("domi:sync", async () => {
  try {
    const result = await serviceCoordinator.run(
      "domi:sync",
      () => getDomiIntegration().sync(),
      { force: true, allowStale: false }
    );
    serviceCoordinator.invalidate("domi:status");
    serviceCoordinator.invalidate("domi:entity-materials:");
    return result;
  } catch (error) {
    const cached = getDomiIntegration().loadCache();
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      snapshot: cached.snapshot,
      updatedAt: cached.updatedAt
    };
  }
});
ipcMain.handle("domi:migration-preview", async () => {
  return {
    ok: false,
    error: "domi 不再把本地资料迁移为飞书主库；本地 SQLite + Markdown 始终是管理基础。"
  };
});
