const fs = require("node:fs");
const path = require("node:path");
const { parentPort } = require("node:worker_threads");
const { ensureDocumentLibraryStructure, listDocumentLibrary, createDocumentLibraryEntry } = require("./document-library.cjs");
const { moveDocumentLibraryEntry } = require('./document-library-move.cjs');

const CACHE_TTL_MS = 60_000;
let cache = null;
let initializedKey = "";

function prepare(location) {
  const rootPath = path.resolve(location.rootPath);
  const key = `${rootPath}\0${Boolean(location.initializeStructure)}`;
  if (initializedKey !== key || !fs.existsSync(rootPath)) {
    if (location.initializeStructure) ensureDocumentLibraryStructure(rootPath);
    else fs.mkdirSync(rootPath, { recursive: true });
    initializedKey = key;
  }
  return { rootPath, key };
}

parentPort.on("message", ({ id, action, location, request }) => {
  try {
    if (action === "invalidate") {
      cache = null;
      return;
    }
    const { rootPath, key } = prepare(location);
    let result;
    if (action === "list") {
      if (!request?.force && cache?.key === key && cache.expiresAt > Date.now()) {
        result = cache.snapshot;
      } else {
        result = { ...listDocumentLibrary(rootPath), structured: Boolean(location.initializeStructure) };
        cache = { key, snapshot: result, expiresAt: Date.now() + CACHE_TTL_MS };
      }
    } else if (action === "create") {
      result = createDocumentLibraryEntry(rootPath, request);
      // A create returns one node, never a recursive scan or the entire tree.
      cache = null;
    } else if (action === 'move') {
      let repository, research;
      try {
        if (location.databasePath && fs.existsSync(location.databasePath)) {
          const { LocalDomiRepository } = require('./local-domi-repository.cjs');
          repository = new LocalDomiRepository({ databasePath: location.databasePath, libraryDir: rootPath });
        }
        if (fs.existsSync(path.join(rootPath, '.domi', 'research.sqlite3'))) {
          const { ResearchStore } = require('./research-store.cjs');
          research = new ResearchStore({ rootPath });
        }
        result = moveDocumentLibraryEntry(rootPath, request, { relocate: (source, target) => {
          repository?.relocateMaterial(source, target);
          try { research?.relocateSource(source, target); }
          catch (error) {
            try { repository?.relocateMaterial(target, source); }
            catch (rollbackError) {
              const failure = new Error(`关联记录恢复失败，原文和目标副本均已保留：${rollbackError.message}`);
              failure.keepDestination = true; throw failure;
            }
            throw error;
          }
          return () => { research?.relocateSource(target, source); repository?.relocateMaterial(target, source); };
        } });
        cache = null;
      } finally { repository?.close(); research?.close(); }
    } else {
      throw new Error("未知的文档目录操作。");
    }
    parentPort.postMessage({ id, result });
  } catch (error) {
    parentPort.postMessage({ id, result: { ok: false, error: error.message || String(error) } });
  }
});
