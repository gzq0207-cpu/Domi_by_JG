const { Worker } = require('node:worker_threads');

// Runtime filesystem/SQLite work stays in the worker. A timeout never replays
// or kills a write: its outcome may be unknown, so callers retain their draft
// and operation ID until they can refresh or retry idempotently.
class BackgroundService {
  constructor({ workerPath, workerData, timeoutMs = 30_000, onEvent = () => {} }) {
    this.workerPath = workerPath;
    this.workerData = workerData;
    this.timeoutMs = timeoutMs;
    this.onEvent = onEvent;
    this.pending = new Map();
    this.operations = new Map();
    this.sequence = 0;
    this.worker = null;
    this.closed = false;
    this.closeFlight = null;
  }

  get activeCount() { return this.operations.size; }

  ensureWorker() {
    if (this.worker) return this.worker;
    const worker = new Worker(this.workerPath, { workerData: this.workerData });
    const fail = error => {
      if (this.worker === worker) this.worker = null;
      for (const [id, pending] of this.pending) {
        if (pending.worker !== worker) continue;
        this.pending.delete(id);
        clearTimeout(pending.timer);
        pending.reject(error);
      }
      for (const [id, owner] of this.operations) if (owner === worker) this.operations.delete(id);
    };
    worker.on('message', message => {
      if (message.type === 'event') {
        try { this.onEvent(message.event); } catch { /* A notification cannot fail a committed write. */ }
        return;
      }
      if (this.operations.get(message.id) === worker) this.operations.delete(message.id);
      if (!this.operations.size) worker.unref();
      const pending = this.pending.get(message.id);
      if (!pending || pending.worker !== worker) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) {
        const error = Object.assign(new Error(message.error.message), message.error);
        pending.reject(error);
      } else pending.resolve(message.result);
    });
    worker.on('error', fail);
    worker.on('exit', code => fail(new Error(`后台服务已退出（${code}），请刷新后重试。`)));
    worker.unref();
    this.worker = worker;
    return worker;
  }

  request(action, payload = {}) {
    if (this.closed && action !== 'close') return Promise.reject(new Error('后台服务已关闭。'));
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      let worker;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        const error = new Error('后台操作等待超时，尚未确认是否完成；请保留当前内容，稍后刷新状态后重试。');
        error.code = 'DOMI_BACKGROUND_TIMEOUT';
        reject(error);
      }, this.timeoutMs);
      try {
        worker = this.ensureWorker();
        worker.ref();
        this.pending.set(id, { worker, resolve, reject, timer });
        this.operations.set(id, worker);
        worker.postMessage({ ...payload, id, action });
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        this.operations.delete(id);
        if (!this.operations.size) worker?.unref();
        reject(error);
      }
    });
  }

  close() {
    if (this.closeFlight) return this.closeFlight;
    this.closed = true;
    const worker = this.worker;
    if (!worker) return Promise.resolve();
    // The worker acknowledges only after its serialized write queue drains
    // and its database closes. Do not terminate on a close timeout.
    this.closeFlight = this.request('close').then(async () => {
      if (this.worker === worker) this.worker = null;
      await worker.terminate();
    }).catch(error => {
      this.closeFlight = null;
      throw error;
    });
    return this.closeFlight;
  }
}

module.exports = { BackgroundService };
