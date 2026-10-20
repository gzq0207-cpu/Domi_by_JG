const fs = require("node:fs");
const path = require("node:path");
const { parentPort, workerData } = require("node:worker_threads");
const {
  configureRoot,
  openDocumentSearchIndex,
  pathInsideRoot,
  removeStaleDocuments,
  removeIndexedDocument,
  searchIndexedDocuments,
  shouldIndexFile,
  upsertIndexedDocument
} = require("./document-search-index.cjs");
const { createOcrPageExecutor } = require("./document-reader.cjs");
const {
  countPendingEmbeddings,
  fetchChunkTexts,
  loadPendingChunkBatch,
  semanticScan,
  storeEmbeddings
} = require("./semantic-chunks.cjs");
const {
  EMBED_BATCH_SIZE,
  configureSemanticEmbedder,
  embedTexts,
  semanticEmbedderReady,
  warmSemanticEmbedder
} = require("./semantic-embedder.cjs");

// Windows cannot detect cloud placeholders through stat (libuv never fills
// stat.blocks there), so guard by root path markers instead. Reading a
// placeholder would trigger an on-demand download of the whole file.
const CLOUD_ROOT_PATTERN = /(?:^|\/)(onedrive|dropbox|nutstore|坚果云|googledrive|google drive|idrive)(?:$|\/)/i;

const database = openDocumentSearchIndex(workerData.databasePath);
if (workerData.semanticCacheDir) {
  configureSemanticEmbedder({ cacheDir: workerData.semanticCacheDir });
}
let activeRoot = "";
let rootEpoch = 0;
let indexing = false;
let indexedCount = 0;
let lastIndexedAt = 0;
let lastError = "";
let lastScanComplete = false;
let cloudContentAllowed = false;
let semanticEnabled = false;
// OCR 命令由宿主随消息下发：未配置时保持原索引行为，空页 PDF 仍只按文件名匹配。
let ocrCommandValue = "";
let ocrPageExecutor = null;
let embeddingPumpActive = false;
let rerunRequested = false;
let activeGeneration = "";
const INDEX_FRESHNESS_MS = 5 * 60_000;
const EMBED_PUMP_IDLE_MS = 60_000;

function status() {
  return {
    indexing,
    indexedCount,
    lastIndexedAt,
    partial: !lastScanComplete,
    error: lastError || undefined
  };
}

// Short operations (single-file upserts, searches) are serialized through one
// queue so a search that arrives right after an index-file message always
// observes the freshly indexed content.
let queueTail = Promise.resolve();

function enqueue(operation) {
  const run = queueTail.then(operation);
  queueTail = run.then(() => undefined, () => undefined);
  return run;
}

function rootLooksCloudSynced(rootPath) {
  const normalized = String(rootPath || "").split(path.sep).join("/");
  return CLOUD_ROOT_PATTERN.test(normalized);
}

function adoptSemanticSettings(message) {
  const next = message.semanticEnabled === true;
  if (next === semanticEnabled) return;
  semanticEnabled = next;
  if (semanticEnabled) {
    // Loading (and first-use downloading) the model is fire-and-forget:
    // retrieval simply stays unavailable until it is ready.
    warmSemanticEmbedder();
    scheduleEmbeddingPump();
  }
}

// Background pump: fills embeddings for pending chunks in small batches,
// yielding between batches so queued searches are never starved for long.
function scheduleEmbeddingPump() {
  if (!semanticEnabled || embeddingPumpActive) return;
  embeddingPumpActive = true;
  const pump = async () => {
    for (;;) {
      if (!semanticEnabled) {
        // Stay alive (cheap idle poll) so re-enabling the setting never
        // leaves the pipeline without a pump.
        await new Promise((resolve) => setTimeout(resolve, EMBED_PUMP_IDLE_MS));
        continue;
      }
      if (!semanticEmbedderReady()) {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        continue;
      }
      const pending = countPendingEmbeddings(database);
      if (!pending) {
        await new Promise((resolve) => setTimeout(resolve, EMBED_PUMP_IDLE_MS));
        continue;
      }
      const batch = loadPendingChunkBatch(database, EMBED_BATCH_SIZE);
      if (!batch.length) continue;
      const epoch = rootEpoch;
      const vectors = await embedTexts(batch.map((item) => item.text), "passage");
      if (epoch !== rootEpoch) continue;
      if (!vectors) {
        // Embedding failed for this batch; back off instead of hot-looping.
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        continue;
      }
      storeEmbeddings(database, batch.map((item, index) => ({
        id: item.id,
        embedding: vectors[index]
      })));
      await new Promise((resolve) => setImmediate(resolve));
    }
  };
  void pump();
}

async function semanticSearch(message, context) {
  const query = String(message.request?.query || "").trim();
  if (!query) {
    return { ok: true, available: true, results: [], degraded: false };
  }
  if (!semanticEnabled) {
    return { ok: true, available: false, results: [], degraded: false };
  }
  if (!semanticEmbedderReady()) {
    return { ok: true, available: false, results: [], degraded: false };
  }
  const limit = Math.max(1, Math.min(Number(message.request?.limit) || 8, 60));
  const vectors = await embedTexts([query], "query");
  if (!context.isCurrent()) return staleResult();
  if (!vectors?.length) {
    return { ok: false, available: true, results: [], degraded: false };
  }
  const scan = semanticScan(database, vectors[0], limit, null, context.rootPath);
  const texts = fetchChunkTexts(database, scan.results.map((result) => result.id));
  return {
    ok: true,
    available: true,
    degraded: scan.degraded,
    scanned: scan.scanned,
    results: scan.results.map((result) => ({
      path: result.path,
      relativePath: result.relativePath,
      line: result.startLine,
      endLine: result.endLine,
      offset: result.offset,
      endOffset: result.endOffset,
      snippet: texts.get(result.id) || "",
      score: result.score
    }))
  };
}

function skipContentFor(rootPath) {
  return process.platform === "win32" && rootLooksCloudSynced(rootPath) && !cloudContentAllowed;
}

function yieldToMessages() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function* walk(rootPath, scanState, directoryPath = rootPath) {
  let directory;
  try {
    directory = await fs.promises.opendir(directoryPath);
  } catch {
    scanState.complete = false;
    return;
  }
  for await (const entry of directory) {
    if (entry.name.startsWith(".")) continue;
    const candidatePath = path.join(directoryPath, entry.name);
    if (!pathInsideRoot(rootPath, candidatePath) || entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      yield* walk(rootPath, scanState, candidatePath);
    } else if (entry.isFile() && shouldIndexFile(entry.name)) {
      yield candidatePath;
    }
  }
}

async function indexRoot(rootPath) {
  if (indexing) {
    rerunRequested = true;
    return;
  }
  indexing = true;
  lastError = "";
  const skipContent = skipContentFor(rootPath);
  const generation = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  activeGeneration = generation;
  const scanState = { complete: true };
  let scanned = 0;
  let changed = 0;
  let scanRoot = "";
  const epoch = rootEpoch;
  const isCurrent = () => rootEpoch === epoch && activeRoot === scanRoot;
  try {
    scanRoot = configureRoot(database, rootPath);
    activeRoot = scanRoot;
    for await (const filePath of walk(scanRoot, scanState)) {
      if (!isCurrent()) break;
      let stat;
      try {
        stat = await fs.promises.stat(filePath);
      } catch {
        scanState.complete = false;
        continue;
      }
      if (!isCurrent()) break;
      if (!stat.isFile()) continue;
      try {
        if (await upsertIndexedDocument(database, scanRoot, filePath, stat, generation, { skipContent, ocrPage: ocrPageExecutor || null, isCurrent })) {
          changed += 1;
        }
      } catch (error) {
        if (!isCurrent()) break;
        // Retain existing index rows when a file is temporarily unreadable.
        scanState.complete = false;
        lastError = `Index failed: ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
      }
      if (!isCurrent()) break;
      scanned += 1;
      if (scanned % 20 === 0) {
        indexedCount = scanned;
        parentPort.postMessage({ type: "status", status: status() });
        await yieldToMessages();
      }
    }
    if (isCurrent()) {
      if (scanState.complete) {
        removeStaleDocuments(database, generation);
        lastScanComplete = true;
        indexedCount = scanned;
        lastIndexedAt = Date.now();
      } else {
        // Incomplete scan: stale rows are kept on purpose (they may be merely
        // unreadable, not deleted) but the index is flagged as partial.
        lastScanComplete = false;
      }
    }
    parentPort.postMessage({ type: "indexed", status: status(), changed });
  } catch (error) {
    if (isCurrent()) {
      lastError = error instanceof Error ? error.message : String(error);
      lastScanComplete = false;
      lastIndexedAt = Date.now();
      parentPort.postMessage({ type: "status", status: status() });
    }
  } finally {
    if (activeGeneration === generation) activeGeneration = "";
    indexing = false;
    parentPort.postMessage({ type: "status", status: status() });
    if (rerunRequested) {
      rerunRequested = false;
      void indexRoot(activeRoot || rootPath);
    }
  }
}

function adoptRoot(rootPath) {
  const resolvedRoot = path.resolve(rootPath);
  if (activeRoot !== resolvedRoot) {
    rootEpoch++;
    activeRoot = configureRoot(database, resolvedRoot);
    lastIndexedAt = 0;
    indexedCount = 0;
    lastScanComplete = false;
    lastError = '';
    if (indexing) rerunRequested = true;
  }
  return activeRoot;
}

function rootContext(rootPath) {
  adoptRoot(rootPath);
  const epoch = rootEpoch;
  return { rootPath: activeRoot, isCurrent: () => epoch === rootEpoch && activeRoot === rootPath };
}

function staleResult() {
  return { ok: false, stale: true, available: false, results: [], degraded: false, error: '资料库已切换，请重新搜索。' };
}

function adoptOcrCommand(message) {
  const command = typeof message?.ocrCommand === "string" ? message.ocrCommand.trim() : "";
  if (command === ocrCommandValue) return;
  ocrCommandValue = command;
  ocrPageExecutor = command ? createOcrPageExecutor(command) : null;
}

parentPort.on("message", (message) => {
  if (!message || typeof message !== "object") return;
  adoptSemanticSettings(message);
  adoptOcrCommand(message);
  if (message.type === "index-file" || message.type === 'move-file') {
    cloudContentAllowed = message.cloudContentAllowed === true;
    const rootPath = path.resolve(message.rootPath);
    const filePath = path.resolve(message.filePath);
    const context = rootContext(rootPath);
    if (context.isCurrent()
      && pathInsideRoot(rootPath, filePath)
      && shouldIndexFile(filePath)) {
      enqueue(async () => {
        try {
          if (!context.isCurrent()) return;
          if (message.type === 'move-file' && pathInsideRoot(rootPath, message.previousPath)
            && !fs.existsSync(message.previousPath)) removeIndexedDocument(database, message.previousPath);
          const stat = await fs.promises.stat(filePath);
          if (!context.isCurrent() || !stat.isFile()) return;
          await upsertIndexedDocument(
            database,
            rootPath,
            filePath,
            stat,
            activeGeneration || `direct-${Date.now()}`,
            { skipContent: skipContentFor(rootPath), ocrPage: ocrPageExecutor || null, isCurrent: context.isCurrent }
          );
        } catch {
          // Transient races (file removed between messages) are fine.
        }
      });
    }
    return;
  }
  if (message.type === "index") {
    cloudContentAllowed = message.cloudContentAllowed === true;
    const rootPath = path.resolve(message.rootPath);
    adoptRoot(rootPath);
    if (indexing && message.force === true) {
      rerunRequested = true;
    } else if (!indexing && (message.force === true || Date.now() - lastIndexedAt >= INDEX_FRESHNESS_MS)) {
      void indexRoot(rootPath);
    }
    return;
  }
  if (message.type !== "search" && message.type !== "semantic-search") return;
  cloudContentAllowed = message.cloudContentAllowed === true;
  const rootPath = path.resolve(message.rootPath);
  const context = rootContext(rootPath);
  if (!indexing && Date.now() - lastIndexedAt >= INDEX_FRESHNESS_MS) {
    void indexRoot(rootPath);
  }
  if (message.type === "semantic-search") {
    void semanticSearch(message, context).then((result) => {
      parentPort.postMessage({
        type: "response",
        id: message.id,
        result: context.isCurrent() ? result : staleResult()
      });
    }).catch((error) => {
      parentPort.postMessage({
        type: "response",
        id: message.id,
        result: {
          ok: false,
          available: true,
          results: [],
          degraded: false,
          error: error instanceof Error ? error.message : String(error)
        }
      });
    });
    return;
  }
  enqueue(() => {
    try {
      if (!context.isCurrent()) {
        parentPort.postMessage({ type: 'response', id: message.id, result: staleResult() }); return;
      }
      const search = searchIndexedDocuments(database, { ...message.request, rootPath });
      parentPort.postMessage({
        type: "response",
        id: message.id,
        result: { ok: !lastError, results: search.results, degraded: search.degraded, ...status() }
      });
    } catch (error) {
      parentPort.postMessage({
        type: "response",
        id: message.id,
        result: {
          ok: false,
          results: [],
          degraded: false,
          error: error instanceof Error ? error.message : String(error),
          ...status()
        }
      });
    }
  });
});

process.on("exit", () => {
  try {
    database.close();
  } catch {
    // Best-effort cache close.
  }
});
