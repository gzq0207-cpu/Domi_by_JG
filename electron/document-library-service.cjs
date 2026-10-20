const path = require("node:path");
const { Worker } = require("node:worker_threads");

// Filesystem traversal and writes stay off Electron's UI/IPC thread. The same
// worker owns both operations, so a list posted after a create sees that entry.
class DocumentLibraryService {
  constructor(options = {}) {
    this.workerPath = options.workerPath || path.join(__dirname, "document-library-worker.cjs");
    this.worker = null;
    this.sequence = 0;
    this.pending = new Map();
    this.lists = new Map();
    this.closed = false;
  }

  ensureWorker() {
    if (this.closed) throw new Error("文档目录服务已关闭。");
    if (this.worker) return this.worker;
    const worker = new Worker(this.workerPath);
    worker.on("message", ({ id, result }) => {
      const pending = this.pending.get(id);
      if (!pending || pending.worker !== worker) return;
      this.pending.delete(id);
      pending.resolve(result);
    });
    const fail = (error) => {
      if (this.worker === worker) {
        this.worker = null;
        this.lists.clear();
      }
      for (const [id, pending] of this.pending) {
        if (pending.worker !== worker) continue;
        this.pending.delete(id);
        pending.reject(error);
      }
    };
    worker.on("error", fail);
    worker.on("exit", code => fail(new Error(`文档目录后台服务已退出（${code}）。`)));
    this.worker = worker;
    return worker;
  }

  send(action, location, request) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      try {
        const worker = this.ensureWorker();
        this.pending.set(id, { worker, resolve, reject });
        worker.postMessage({ id, action, location, request });
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  list(location, request = {}) {
    const key = `${path.resolve(location.rootPath)}\0${Boolean(location.initializeStructure)}\0${request.force === true}`;
    if (this.lists.has(key)) return this.lists.get(key);
    const pending = this.send("list", location, request).finally(() => {
      if (this.lists.get(key) === pending) this.lists.delete(key);
    });
    this.lists.set(key, pending);
    return pending;
  }

  create(location, request) {
    this.lists.clear();
    return this.send("create", location, request);
  }

  move(location, request) {
    this.lists.clear();
    return this.send('move', location, request);
  }

  invalidate() {
    this.lists.clear();
    this.worker?.postMessage({ action: "invalidate" });
  }

  async close() {
    this.closed = true;
    const worker = this.worker;
    this.worker = null;
    if (worker) await worker.terminate();
  }
}

module.exports = { DocumentLibraryService };
