const { parentPort, workerData } = require('node:worker_threads');
const fs = require('node:fs');
const { ResearchStore, hashFile } = require('./research-store.cjs');
const { isWithin } = require('./research-layout.cjs');
let store = null;
let queue = Promise.resolve();
parentPort.on('message', message => {
  queue = queue.then(async () => {
    try {
      if (message.action === 'close') {
        store?.close(); parentPort.postMessage({ id: message.id }); parentPort.close(); return;
      }
      if (message.action === 'fingerprint') {
        const resolved = fs.realpathSync(message.path);
        if (!isWithin(workerData.rootPath, resolved) && !(message.allowedPaths || []).includes(resolved)) throw new Error('资料路径超出当前资料库范围。');
        parentPort.postMessage({ id: message.id, result: hashFile(resolved) }); return;
      }
      if (message.action !== 'handle') throw new Error('未知的主题研究后台操作。');
      if (!store) store = new ResearchStore({ rootPath: workerData.rootPath,
        onFileChanged: file => parentPort.postMessage({ type: 'event', event: { type: 'file-changed', path: file } }) });
      store.allowedPaths = new Set(message.allowedPaths || []);
      const result = await store.handle(message.request);
      parentPort.postMessage({ id: message.id, result });
    } catch (error) {
      parentPort.postMessage({ id: message.id, error: { message: error.message, code: error.code } });
    }
  });
});
