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
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      pending.resolve(message.result);
    });
    const fail = (error) => {
      if (this.worker === worker) this.worker = null;
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timeout);
        pending.resolve({ ok: false, results: [], degraded: false, error: error.message || String(error) });
      }
      this.pending.clear();
    };
    worker.on("error", fail);
    worker.on("exit", (code) => {
      if (code !== 0) fail(new Error(`文档搜索后台服务异常退出（${code}）。`));
      else if (this.worker === worker) this.worker = null;
    });
    this.worker = worker;
    return worker;
  }

  postToWorker(message) {
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
      this.pending.set(id, { resolve, timeout });
      this.postToWorker({
        type: "search",
        id,
        rootPath,
        request
      });
    });
  }

  // Semantic retrieval may include a model inference (or a cold model load
  // retry); it runs in the run-startup path in parallel with other context
  // preparation, so it gets a longer, still-bounded timeout.
  semanticSearch(rootPath, request) {
    if (!rootPath || !String(request?.query || "").trim() || !this.semanticEnabledFlag()) {
      return Promise.resolve({ ok: true, available: false, results: [], degraded: false });
    }
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        resolve({ ok: false, available: false, results: [], degraded: false });
      }, 15_000);
      this.pending.set(id, { resolve, timeout });
      this.postToWorker({
        type: "semantic-search",
        id,
        rootPath,
        request
      });
    });
  }

  async close() {
    const worker = this.worker;
    this.worker = null;
    if (!worker) return;
    await worker.terminate();
  }
}

module.exports = { DocumentSearchService };
