const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { once } = require('node:events');
const { fileURLToPath } = require('node:url');
const { Worker } = require('node:worker_threads');
const { BackgroundService } = require('../electron/background-service.cjs');
const { LocalRepositoryService } = require('../electron/local-repository-service.cjs');
const { LocalDomiRepository } = require('../electron/local-domi-repository.cjs');
const { ResearchService } = require('../electron/research-service.cjs');

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate) {
  const deadline = Date.now() + 5000;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('fixture deadline'); await pause(10); }
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-background-'));
  const services = [], workers = [];
  t.after(async () => {
    await Promise.all(services.map(service => service.close()));
    await Promise.all(workers.map(worker => worker.terminate()));
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('domi-background-'));
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  return { root, services, workers };
}
function seed(root, name = '线程项目') {
  const source = { localDatabasePath: path.join(root, 'repository.sqlite3'), localLibraryDir: path.join(root, 'library') };
  const repository = new LocalDomiRepository({ databasePath: source.localDatabasePath, libraryDir: source.localLibraryDir });
  repository.database.prepare('INSERT INTO projects(id,name,normalized_name,created_at,updated_at) VALUES(?,?,?,?,?)')
    .run('prj_worker_test', name, name, 1000, 1000);
  repository.close();
  return source;
}

test('a database write lock delays the worker while caller heartbeats keep running', async t => {
  const f = fixture(t), source = seed(f.root);
  const service = new LocalRepositoryService(); f.services.push(service);
  const holder = new Worker(`
    const {parentPort,workerData}=require('node:worker_threads');
    const {DatabaseSync}=require('node:sqlite');
    const db=new DatabaseSync(workerData);db.exec('BEGIN IMMEDIATE');parentPort.postMessage('locked');
    setTimeout(()=>{db.exec('COMMIT');db.close();parentPort.close();},800);
  `, { eval: true, workerData: source.localDatabasePath });
  f.workers.push(holder); await once(holder, 'message');
  const start = performance.now();
  const pending = service.call(source, 'snapshot');
  const heartbeat = await new Promise(resolve => setTimeout(() => resolve(performance.now() - start), 10));
  assert.ok(heartbeat < 300, `caller stalled for ${heartbeat} ms`);
  assert.equal(service.activeCount, 1);
  const { snapshot } = await pending;
  assert.equal(snapshot.projects[0].name, '线程项目');
  const worker = service.worker;
  assert.equal((await service.call(source, 'snapshot')).snapshot.projects.length, 1);
  assert.equal(service.worker, worker, 'the open database connection is reused');
});

test('worker field patches preserve idempotency, version conflicts and queued materialization', async t => {
  const f = fixture(t), source = seed(f.root), service = new LocalRepositoryService(); f.services.push(service);
  const request = { entityType: 'project', recordId: 'prj_worker_test', expectedUpdatedAt: 1000,
    mutationId: 'worker-idempotent-edit', changes: { notes: '后台保存内容' } };
  const first = await service.call(source, 'updateDatabaseRecordPatch', [request]);
  assert.equal(first.record.notes, '后台保存内容');
  assert.equal(first.materialization, 'pending');
  const retry = await service.call(source, 'updateDatabaseRecordPatch', [request]);
  assert.equal(retry.replayed, true);
  assert.equal(retry.record.updatedAt, first.record.updatedAt);
  await service.call(source, 'materializeDatabaseRecord', ['project', 'prj_worker_test']);
  await assert.rejects(service.call(source, 'updateDatabaseRecordPatch', [{ ...request, mutationId: 'stale-edit', changes: { notes: '不能覆盖' } }]), /记录已被其他流程更新/);
  const { snapshot, pending } = await service.call(source, 'snapshot');
  assert.equal(pending.length, 0);
  assert.match(fs.readFileSync(fileURLToPath(snapshot.projects[0].link), 'utf8'), /后台保存内容/);
  const secondRoot = path.join(f.root, 'other'); fs.mkdirSync(secondRoot);
  const other = seed(secondRoot, '另一个资料库');
  assert.equal((await service.call(other, 'snapshot')).snapshot.projects[0].name, '另一个资料库');
  assert.equal((await service.call(source, 'snapshot')).snapshot.projects[0].name, '线程项目');
});

test('a timed-out write is not replayed or killed and remains busy until its late acknowledgement', async t => {
  const f = fixture(t), workerPath = path.join(f.root, 'slow.cjs'), committed = path.join(f.root, 'committed');
  fs.writeFileSync(workerPath, `
    const fs=require('node:fs'),{parentPort}=require('node:worker_threads');let tail=Promise.resolve();
    parentPort.on('message',m=>{tail=tail.then(async()=>{
      if(m.action==='write'){await new Promise(r=>setTimeout(r,200));fs.appendFileSync(${JSON.stringify(committed)},'one\\n');}
      parentPort.postMessage({id:m.id,result:'ok'});if(m.action==='close')parentPort.close();
    });});
  `);
  const service = new BackgroundService({ workerPath, timeoutMs: 100 }); f.services.push(service);
  await assert.rejects(service.request('write'), { code: 'DOMI_BACKGROUND_TIMEOUT' });
  assert.equal(service.activeCount, 1);
  await until(() => service.activeCount === 0);
  assert.equal(fs.readFileSync(committed, 'utf8'), 'one\n');
});

test('worker failure settles requests, later calls recover, and close drains queued work', async t => {
  const f = fixture(t), workerPath = path.join(f.root, 'fixture.cjs');
  fs.writeFileSync(workerPath, `
    const {parentPort}=require('node:worker_threads');let tail=Promise.resolve();
    parentPort.on('message',m=>{tail=tail.then(async()=>{
      if(m.action==='crash')process.exit(7);await new Promise(r=>setTimeout(r,20));
      parentPort.postMessage({id:m.id,result:m.action});if(m.action==='close')parentPort.close();
    });});
  `);
  const service = new BackgroundService({ workerPath }); f.services.push(service);
  await assert.rejects(service.request('crash'), /退出/);
  assert.equal(await service.request('recovered'), 'recovered');
  const queued = service.request('queued'), close = service.close();
  assert.equal(await queued, 'queued'); await close;
  assert.equal(service.activeCount, 0);
  await assert.rejects(service.request('late'), /已关闭/);
});

test('research worker preserves source permissions, exact versions, comments and reopen recovery', async t => {
  const f = fixture(t), library = path.join(f.root, 'research'); fs.mkdirSync(library);
  const original = path.join(library, '来源.md'), outside = path.join(f.root, '外部.md');
  fs.writeFileSync(original, '# 原文\n可验证内容'); fs.writeFileSync(outside, '# 外部材料');
  const allowedPaths = new Set(), service = new ResearchService({ rootPath: library, allowedPaths }); f.services.push(service);
  assert.equal((await service.handle({ action: 'source', path: outside })).ok, false);
  await assert.rejects(service.fingerprint(outside), /超出/);
  allowedPaths.add(outside);
  assert.equal((await service.handle({ action: 'source', path: outside })).ok, true);
  allowedPaths.delete(outside);
  assert.equal((await service.handle({ action: 'source', path: outside })).ok, false);
  const source = (await service.handle({ action: 'source', path: original })).source;
  const request = { action: 'annotate', id: crypto.randomUUID(), sourceId: source.id, sourceVersion: source.version,
    kind: 'document', anchor: { quote: '' }, quote: '', comment: '完整评论' };
  assert.equal((await service.handle(request)).ok, true);
  fs.appendFileSync(original, '\n新版本');
  assert.equal((await service.handle({ ...request, id: crypto.randomUUID() })).ok, false);
  assert.equal(await service.fingerprint(original), crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex'));
  await service.close();
  const reopened = new ResearchService({ rootPath: library }); f.services.push(reopened);
  const read = await reopened.handle({ action: 'source', path: original });
  assert.equal(read.annotations[0].comment, '完整评论');
});

test('large source hashing runs outside the caller event loop with a bounded read buffer', async t => {
  const f = fixture(t), original = path.join(f.root, 'large.pdf');
  const bytes = Buffer.alloc(32 * 1024 * 1024, 32); fs.writeFileSync(original, bytes);
  const service = new ResearchService({ rootPath: f.root }); f.services.push(service);
  const start = performance.now();
  const pending = service.fingerprint(original);
  const heartbeat = await new Promise(resolve => setTimeout(() => resolve(performance.now() - start), 10));
  assert.ok(heartbeat < 300, `caller stalled for ${heartbeat} ms`);
  assert.equal(await pending, crypto.createHash('sha256').update(bytes).digest('hex'));
});
