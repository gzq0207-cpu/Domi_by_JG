const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { DocumentSearchService } = require('../electron/document-search-service.cjs');
const { configureRoot, openDocumentSearchIndex, upsertIndexedDocument, searchIndexedDocuments } = require('../electron/document-search-index.cjs');
const { loadPendingChunkBatch, storeEmbeddings, semanticScan } = require('../electron/semantic-chunks.cjs');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate) {
  const deadline = Date.now() + 5000;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('search fixture deadline'); await pause(10); }
}

for (const delayed of ['stat', 'word', 'word-roundtrip']) test(`a root switch during ${delayed} cannot commit old material or expose it in new-root results`, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-search-version-'));
  const a = path.join(root, 'A'), b = path.join(root, 'B'); fs.mkdirSync(a); fs.mkdirSync(b);
  const roundtrip = delayed === 'word-roundtrip';
  const fileA = path.join(a, delayed.startsWith('word') ? 'alpha.docx' : 'alpha.md'), fileB = path.join(b, 'beta.md');
  fs.writeFileSync(fileA, 'ALPHA_SENTINEL_ONLY_IN_A'); fs.writeFileSync(fileB, 'BETA_SENTINEL_ONLY_IN_B');
  const startedA = path.join(root, 'startedA'), releaseA = path.join(root, 'releaseA');
  const startedB = path.join(root, 'startedB'), releaseB = path.join(root, 'releaseB');
  const wrapper = path.join(root, 'worker.cjs'), databasePath = path.join(root, 'search.sqlite3');
  const worker = require.resolve('../electron/document-search-worker.cjs'), word = require.resolve('../electron/word-document.cjs');
  fs.writeFileSync(wrapper, `
    const fs=require('node:fs'),stat=fs.promises.stat.bind(fs.promises);let aStats=0;
    const wait=async(marker,release)=>{fs.writeFileSync(marker,'1');while(!fs.existsSync(release))await new Promise(r=>setTimeout(r,10));};
    fs.promises.stat=async(file,...rest)=>{
      if(${JSON.stringify(delayed)}==='stat'&&file===${JSON.stringify(fileA)})await wait(${JSON.stringify(startedA)},${JSON.stringify(releaseA)});
      if(${roundtrip}&&file===${JSON.stringify(fileA)}&&++aStats>1)await wait(${JSON.stringify(startedB)},${JSON.stringify(releaseB)});
      if(file===${JSON.stringify(fileB)})await wait(${JSON.stringify(startedB)},${JSON.stringify(releaseB)});
      return stat(file,...rest);
    };
    if(${JSON.stringify(delayed)}.startsWith('word')) require.cache[${JSON.stringify(word)}]={exports:{readWordFile:async()=>{
      const text=fs.readFileSync(${JSON.stringify(fileA)},'utf8');
      await wait(${JSON.stringify(startedA)},${JSON.stringify(releaseA)});return {text,incomplete:false};
    }}};
    require(${JSON.stringify(worker)});
  `);
  const service = new DocumentSearchService({ databasePath, workerPath: wrapper });
  t.after(async () => {
    await service.close();
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('domi-search-version-'));
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  service.scheduleIndex(a, true); await until(() => fs.existsSync(startedA));
  service.scheduleIndex(b, true);
  if (roundtrip) { fs.writeFileSync(fileA, 'NEW_A_SENTINEL'); service.scheduleIndex(a, true); }
  fs.writeFileSync(releaseA, '1'); await until(() => fs.existsSync(startedB));
  const snapshot = new DatabaseSync(databasePath, { readOnly: true });
  assert.equal(snapshot.prepare('SELECT COUNT(*) AS n FROM search_documents WHERE root_path=?').get(a).n, 0);
  snapshot.close();
  const targetRoot = roundtrip ? a : b;
  for (let i = 0; i < 3; i++) assert.deepEqual((await service.search(targetRoot, { query: 'ALPHA_SENTINEL_ONLY_IN_A' })).results, []);
  fs.writeFileSync(releaseB, '1');
  let current;
  for (let i = 0; i < 100; i++) {
    current = await service.search(targetRoot, { query: roundtrip ? 'NEW_A_SENTINEL' : 'BETA_SENTINEL_ONLY_IN_B' });
    if (!current.indexing && current.results.length) break;
    await pause(10);
  }
  assert.equal(current.results[0].path, roundtrip ? fileA : fileB);
});

test('the commit guard rejects a cancelled generation even when its root is active again', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-search-epoch-'));
  t.after(() => { assert.ok(path.basename(root).startsWith('domi-search-epoch-')); fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); });
  const file = path.join(root, 'content.md'); fs.writeFileSync(file, '# 原始内容\n\n一段可以索引的正文。');
  const database = openDocumentSearchIndex(path.join(root, 'search.sqlite3'));
  try {
    configureRoot(database, root);
    assert.equal(await upsertIndexedDocument(database, root, file, fs.statSync(file), 'old', { isCurrent: () => false }), false);
    assert.equal(database.prepare('SELECT COUNT(*) AS n FROM search_documents').get().n, 0);
    await upsertIndexedDocument(database, root, file, fs.statSync(file), 'new');
    database.prepare('UPDATE search_documents SET root_path=?').run(path.join(root, 'foreign'));
    assert.deepEqual(searchIndexedDocuments(database, { query: '原始内容', rootPath: root }).results, []);
    assert.deepEqual(searchIndexedDocuments(database, { query: '原始', rootPath: root }).results, []);
    const chunks = loadPendingChunkBatch(database, 8); assert.ok(chunks.length);
    storeEmbeddings(database, chunks.map(chunk => ({ id: chunk.id, embedding: [1, 0] })));
    assert.deepEqual(semanticScan(database, [1, 0], 8, null, root).results, []);
  } finally { database.close(); }
});

test('a root switch revokes in-flight semantic replies and drops old embedding batches', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-search-semantic-'));
  const a = path.join(root, 'A'), b = path.join(root, 'B'); fs.mkdirSync(a); fs.mkdirSync(b);
  const fileA = path.join(a, 'alpha.md'), fileB = path.join(b, 'beta.md');
  fs.writeFileSync(fileA, '# Alpha\nA_SENTINEL'); fs.writeFileSync(fileB, '# Beta\nB_SENTINEL');
  const wrapper = path.join(root, 'worker.cjs'), release = path.join(root, 'release'), databasePath = path.join(root, 'search.sqlite3');
  const embedder = require.resolve('../electron/semantic-embedder.cjs'), worker = require.resolve('../electron/document-search-worker.cjs');
  fs.writeFileSync(wrapper, `
    const fs=require('node:fs'),path=require('node:path');
    require.cache[${JSON.stringify(embedder)}]={exports:{EMBED_BATCH_SIZE:8,configureSemanticEmbedder:()=>{},warmSemanticEmbedder:()=>{},semanticEmbedderReady:()=>true,
      embedTexts:async(texts,kind)=>{
        if(texts.some(text=>text.includes('A_SENTINEL'))){fs.writeFileSync(path.join(${JSON.stringify(root)},kind),'1');while(!fs.existsSync(${JSON.stringify(release)}))await new Promise(r=>setTimeout(r,10));}
        return texts.map(text=>Float32Array.from(text.includes('A_SENTINEL')?[1,0]:[0,1]));
      }}};
    require(${JSON.stringify(worker)});
  `);
  let enabled = false;
  const service = new DocumentSearchService({ databasePath, workerPath: wrapper, semanticEnabled: () => enabled });
  t.after(async () => {
    await service.close(); assert.ok(path.basename(root).startsWith('domi-search-semantic-'));
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  for (let i = 0; i < 100; i++) {
    const search = await service.search(a, { query: 'A_SENTINEL' });
    if (!search.indexing && search.results.length) break;
    await pause(10);
  }
  enabled = true;
  const oldId = service.sequence + 1;
  let workerReply;
  service.worker.on('message', message => { if (message.id === oldId && message.type === 'response') workerReply = message.result; });
  const old = service.semanticSearch(a, { query: 'A_SENTINEL' });
  await until(() => fs.existsSync(path.join(root, 'query')) && fs.existsSync(path.join(root, 'passage')));
  service.scheduleIndex(b, true);
  assert.equal((await old).stale, true);
  for (let i = 0; i < 100; i++) {
    const search = await service.search(b, { query: 'B_SENTINEL' });
    if (!search.indexing && search.results.length) break;
    await pause(10);
  }
  fs.writeFileSync(release, '1'); await until(() => workerReply !== undefined);
  assert.equal(workerReply.stale, true, 'worker must revoke its own result before sending, independently of host cancellation');
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    let row;
    await until(() => { row = database.prepare('SELECT embedding FROM semantic_chunks WHERE path=? AND embedding IS NOT NULL').get(fileB); return Boolean(row); });
    const vector = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4);
    assert.deepEqual([...vector], [0, 1]);
  } finally { database.close(); }
  const current = await service.semanticSearch(b, { query: 'B_SENTINEL' });
  assert.equal(current.results[0].path, fileB);
});

test('host cancels pending old-root searches immediately and ignores their late responses', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-search-host-')), wrapper = path.join(root, 'worker.cjs');
  fs.writeFileSync(wrapper, `
    const {parentPort}=require('node:worker_threads');parentPort.on('message',m=>{
      if(m.type==='search')setTimeout(()=>parentPort.postMessage({type:'response',id:m.id,result:{ok:true,results:[{path:m.rootPath}]}}),m.request.delay||0);
    });
  `);
  const service = new DocumentSearchService({ databasePath: '', workerPath: wrapper });
  t.after(async () => { await service.close(); assert.ok(path.basename(root).startsWith('domi-search-host-')); fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); });
  const old = service.search(path.join(root, 'A'), { query: 'test', delay: 200 });
  const current = service.search(path.join(root, 'B'), { query: 'test' });
  assert.equal((await old).stale, true);
  assert.equal((await current).results[0].path, path.join(root, 'B'));
  await pause(250);
  assert.equal(service.pending.size, 0);
});
