const path = require('node:path');
const { parentPort } = require('node:worker_threads');
const { LocalDomiRepository } = require('./local-domi-repository.cjs');

const methods = new Set([
  'recordDirectory', 'listNews', 'resolvePreviewDocument', 'deleteDatabaseRecord',
  'updateProject', 'updatePerson', 'updateNews', 'updateDatabaseRecordPatch',
  'materializeDatabaseRecord', 'applyProjectClassification'
]);
let repository = null;
let repositoryKey = '';
let queue = Promise.resolve();

function open(source) {
  if (!source?.localDatabasePath || !source?.localLibraryDir) throw new Error('本地资料库尚未配置。');
  const databasePath = path.resolve(source.localDatabasePath);
  const libraryDir = path.resolve(source.localLibraryDir);
  const key = `${databasePath}\0${libraryDir}`;
  if (!repository || key !== repositoryKey) {
    repository?.close(); repository = null;
    repository = new LocalDomiRepository({ databasePath, libraryDir });
    repositoryKey = key;
  }
  return repository;
}

parentPort.on('message', message => {
  queue = queue.then(async () => {
    try {
      let result;
      if (message.action === 'close') {
        repository?.close(); repository = null;
      } else {
        const current = open(message.source);
        if (message.method === 'snapshot') {
          current.cleanupStructuralGhostProjects();
          result = {
            snapshot: { ok: true, backend: 'local', editable: true, loadedAt: Date.now(),
              projects: current.listProjects(), people: current.listPeople(), news: current.listAllNews(),
              taxonomy: current.listTaxonomy(), classificationReviews: current.listClassificationReviews() },
            pending: current.listPendingMaterializations()
          };
        } else {
          if (!methods.has(message.method)) throw new Error('未知的资料库后台操作。');
          result = await current[message.method](...message.args);
        }
      }
      parentPort.postMessage({ id: message.id, result });
      if (message.action === 'close') parentPort.close();
    } catch (error) {
      parentPort.postMessage({ id: message.id, error: { message: error.message, code: error.code, conflict: error.conflict } });
    }
  });
});
