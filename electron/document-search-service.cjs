const path = require("node:path");
const { Worker } = require("node:worker_threads");

class DocumentSearchService {
  constructor(options) {
    this.databasePath = options.databasePath;
    this.workerPath = options.workerPath || path.join(__dirname, "document-search-worker.cjs");
    this.cloudContentAllowed = options.cloudContentAllowed || (() => false);
    this.semanticEnabled = options.semanticEnabled || (() => false);
    this.ocrCommand = options.ocrCommand || (() => "");
    this.semanticCacheDir = options.semanticCacheDir || "";
    this.worker = null;
    this.sequence = 0;
    this.pending = new Map();
    this.rootPath = '';
    this.rootEpoch = 0;
    this.closed = false;
  }

  adoptRoot(rootPath) {
    const resolved = path.resolve(rootPath);
    if (this.rootPath !== resolved) {
      this.rootPath = resolved;
      this.rootEpoch++;
      for (const [id, pending] of this.pending) {
        clearTimeout(pending.timeout);
        pending.resolve({ ok: false, stale: true, results: [], available: false, degraded: false, error: '资料库已切换，请重新搜索。' });
        this.pending.delete(id);
      }
    }
    return this.rootEpoch;
  }

  cloudContentFlag() {
    try {
      return this.cloudContentAllowed() === true;
    } catch {
      return false;
    }
  }

  semanticEnabledFlag() {
    try {
      return this.semanticEnabled() === true;
    } catch {
      return false;
    }
  }

  ocrCommandFlag() {
    try {
      return String(this.ocrCommand() || "").trim();
    } catch {
      return "";
    }
  }

  ensureWorker() {
    if (this.closed) throw new Error('文档搜索服务已关闭。');
    if (this.worker) return this.worker;
    const worker = new Worker(this.workerPath, {
      workerData: {
        databasePath: this.databasePath,
        semanticCacheDir: this.semanticCacheDir
      }
    });
    worker.on("message", (message) => {
      if (message?.type !== "response") return;
      const pending = this.pending.get(message.id);
      if (!pending || pending.worker !== worker) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      pending.resolve(pending.epoch === this.rootEpoch ? message.result
        : { ok: false, stale: true, results: [], available: false, degraded: false });
    });
    const fail = (error) => {
      if (this.worker === worker) this.worker = null;
      for (const [id, pending] of this.pending) {
        if (pending.worker !== worker) continue;
        clearTimeout(pending.timeout);
        pending.resolve({ ok: false, results: [], degraded: false, error: error.message || String(error) });
        this.pending.delete(id);
      }
    };
    worker.on("error", fail);
    worker.on("exit", (code) => {
      fail(new Error(`文档搜索后台服务已退出（${code}）。`));
    });
    this.worker = worker;
    return worker;
  }

  postToWorker(message) {
    this.adoptRoot(message.rootPath);
    this.ensureWorker().postMessage({
      ...message,
      cloudContentAllowed: this.cloudContentFlag(),
      semanticEnabled: this.semanticEnabledFlag(),
      ocrCommand: this.ocrCommandFlag()
    });
  }

  scheduleIndex(rootPath, force = false) {
    if (!rootPath) return;
    this.postToWorker({ type: "index", rootPath, force });
  }

  updateFile(rootPath, filePath) {
    if (!rootPath || !filePath) return;
    this.postToWorker({ type: "index-file", rootPath, filePath });
  }

  moveFile(rootPath, previousPath, filePath) {
    if (rootPath && previousPath && filePath) this.postToWorker({ type: 'move-file', rootPath, previousPath, filePath });
  }

  search(rootPath, request) {
    if (!rootPath || !String(request?.query || "").trim()) {
      return Promise.resolve({
        ok: true,
        results: [],
        degraded: false,
        indexing: false,
        indexedCount: 0,
        lastIndexedAt: 0
      });
    }
    const epoch = this.adoptRoot(rootPath);
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        resolve({
          ok: false,
          results: [],
          degraded: false,
          error: "文档搜索暂时繁忙，请稍后重试。"
        });
      }, 3_000);
      try {
        this.pending.set(id, { resolve, timeout, epoch, worker: this.ensureWorker() });
        this.postToWorker({
        type: "search",
        id,
        rootPath,
        request
        });
      } catch (error) { clearTimeout(timeout); this.pending.delete(id); resolve({ ok: false, results: [], degraded: false, error: error.message }); }
    });
  }

  // Semantic retrieval may include a model inference (or a cold model load
  // retry); it runs in the run-startup path in parallel with other context
  // preparation, so it gets a longer, still-bounded timeout.
  semanticSearch(rootPath, request) {
    if (!rootPath || !String(request?.query || "").trim() || !this.semanticEnabledFlag()) {
      return Promise.resolve({ ok: true, available: false, results: [], degraded: false });
    }
    const epoch = this.adoptRoot(rootPath);
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        resolve({ ok: false, available: false, results: [], degraded: false });
      }, 15_000);
      try {
        this.pending.set(id, { resolve, timeout, epoch, worker: this.ensureWorker() });
        this.postToWorker({
        type: "semantic-search",
        id,
        rootPath,
        request
        });
      } catch (error) { clearTimeout(timeout); this.pending.delete(id); resolve({ ok: false, results: [], available: false, degraded: false, error: error.message }); }
    });
  }

  async close() {
    this.closed = true;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.resolve({ ok: false, results: [], degraded: false, error: '文档搜索服务已关闭。' });
    }
    this.pending.clear();
    const worker = this.worker;
    this.worker = null;
    if (!worker) return;
    await worker.terminate();
  }
}

module.exports = { DocumentSearchService };
