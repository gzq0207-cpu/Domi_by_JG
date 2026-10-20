const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DocumentLibraryService } = require('../electron/document-library-service.cjs');

function fixture() {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-library-service-'));
  const workerPath = path.join(rootPath, '.instrumented-worker.cjs');
  fs.writeFileSync(workerPath, `
    const {parentPort}=require('node:worker_threads');
    const library=require(${JSON.stringify(require.resolve('../electron/document-library.cjs'))});
    const scan=library.listDocumentLibrary;
    library.listDocumentLibrary=(...args)=>{parentPort.postMessage({scan:true});
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,120);return scan(...args);};
    require(${JSON.stringify(require.resolve('../electron/document-library-worker.cjs'))});
  `);
  const service = new DocumentLibraryService({ workerPath });
  const scans = [];
  service.ensureWorker().on('message', message => { if (message.scan) scans.push(message); });
  return { service, scans, location: { rootPath, initializeStructure: false }, async close() {
    await service.close();
    fs.rmSync(rootPath, { recursive: true, force: true });
  } };
}

test('directory scans yield the main event loop and concurrent refreshes share one scan', async () => {
  const f = fixture();
  let ticks = 0;
  const timer = setInterval(() => ticks++, 5);
  try {
    const first = f.service.list(f.location, { force: true });
    assert.equal(first, f.service.list(f.location, { force: true }));
    const result = await first;
    assert.equal(result.ok, true);
    assert.equal(f.scans.length, 1);
    assert.ok(ticks >= 5, 'IPC and window events must run while the worker scans');
    await f.service.list(f.location);
    assert.equal(f.scans.length, 1, 'a fresh cached tree must not be scanned again');
  } finally { clearInterval(timer); await f.close(); }
});

test('file and folder creation return only new nodes, without scanning the library', async () => {
  const f = fixture();
  try {
    await f.service.list(f.location);
    const folder = await f.service.create(f.location, { kind: 'folder', name: '主题研究' });
    const file = await f.service.create(f.location, { kind: 'markdown', parentPath: folder.path, name: '收入2' });
    assert.equal(folder.ok, true);
    assert.deepEqual(folder.node.children, []);
    assert.equal(file.ok, true);
    assert.equal(file.node.kind, 'markdown');
    assert.equal(file.node.relativePath, path.join('主题研究', '收入2.md'));
    assert.equal(file.snapshot, undefined);
    assert.equal(f.scans.length, 1, 'creation must not trigger recursive scanning');
    assert.equal(fs.readFileSync(file.path, 'utf8'), '# 收入2\n');
    const duplicate = await f.service.create(f.location, { kind: 'markdown', parentPath: folder.path, name: '收入2' });
    assert.equal(duplicate.ok, false);
    assert.match(duplicate.error, /已经存在/);
    const snapshot = await f.service.list(f.location);
    assert.equal(snapshot.documentCount, 1);
    assert.equal(snapshot.folderCount, 1);
    assert.equal(f.scans.length, 2, 'a later refresh must see the actual filesystem');
  } finally { await f.close(); }
});

test('refresh after an in-flight scan and create sees the new entry', async () => {
  const f = fixture();
  try {
    const before = f.service.list(f.location, { force: true });
    const created = f.service.create(f.location, { kind: 'markdown', name: '并发' });
    const after = f.service.list(f.location, { force: true });
    assert.notEqual(after, before, 'do not coalesce across a write');
    assert.equal((await before).documentCount, 0);
    assert.equal((await created).ok, true);
    assert.equal((await after).documentCount, 1);
    f.service.invalidate();
    await f.service.list(f.location);
    assert.equal(f.scans.length, 3);
  } finally { await f.close(); }
});

test('root changes and failed scans do not reuse another library snapshot', async () => {
  const f = fixture();
  try {
    const a = await f.service.list(f.location);
    const second = { rootPath: path.join(f.location.rootPath, '另一资料库'), initializeStructure: true };
    const b = await f.service.list(second);
    assert.notEqual(a.rootPath, b.rootPath);
    assert.equal(b.structured, true);
    fs.writeFileSync(path.join(f.location.rootPath, '不是文件夹'), 'text');
    const error = await f.service.list({ rootPath: path.join(f.location.rootPath, '不是文件夹') });
    assert.equal(error.ok, false);
    assert.equal((await f.service.list(f.location, { force: true })).ok, true);
  } finally { await f.close(); }
});

test('worker exit settles pending operations and a later request can recover', async () => {
  const f = fixture();
  try {
    const request = f.service.list(f.location, { force: true });
    const rejected = assert.rejects(request, /后台服务已退出/);
    await f.service.worker.terminate();
    await rejected;
    assert.equal((await f.service.list(f.location)).ok, true);
  } finally { await f.close(); }
});

test('creation cannot follow a directory junction outside the library', async () => {
  const f = fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-library-outside-'));
  try {
    const linked = path.join(f.location.rootPath, '外部链接');
    fs.symlinkSync(outside, linked, process.platform === 'win32' ? 'junction' : 'dir');
    const result = await f.service.create(f.location, { parentPath: linked, kind: 'markdown', name: '越界' });
    assert.equal(result.ok, false);
    assert.match(result.error, /只能在当前本地文档库内/);
    assert.deepEqual(fs.readdirSync(outside), []);
    fs.unlinkSync(linked);
  } finally { await f.close(); fs.rmSync(outside, { recursive: true, force: true }); }
});

test('worker moves keep article paths and reading comments linked without a directory scan', async () => {
  const f = fixture();
  const { LocalDomiRepository } = require('../electron/local-domi-repository.cjs');
  const { ResearchStore } = require('../electron/research-store.cjs');
  const databasePath = path.join(f.location.rootPath, '.repository.sqlite3');
  const repository = new LocalDomiRepository({ databasePath, libraryDir: f.location.rootPath });
  const research = new ResearchStore({ rootPath: f.location.rootPath });
  try {
    const source = path.join(f.location.rootPath, '原始.md'), parent = path.join(f.location.rootPath, '目标');
    fs.writeFileSync(source, '# 原始\n研究证据。'); fs.mkdirSync(parent);
    repository.database.prepare('INSERT INTO news_events(event_id,title,published_at,created_at,updated_at,document_path,content_path) VALUES(?,?,?,?,?,?,?)')
      .run('article-move', '原始', 1, 1, 1, source, source);
    repository.database.prepare('INSERT INTO documents(id,owner_type,owner_id,kind,title,path,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)')
      .run('doc-move', 'news', 'article-move', 'markdown', '原始', source, 1, 1);
    repository.database.prepare('INSERT INTO people(id,name,normalized_name,created_at,updated_at,interaction_documents_json) VALUES(?,?,?,?,?,?)')
      .run('person-move', '测试人物', '测试人物', 1, 1, JSON.stringify([{ path: source, url: require('node:url').pathToFileURL(source).href }]));
    const registered = await research.handle({ action: 'source', path: source });
    const annotation = await research.handle({ action: 'annotate', id: require('node:crypto').randomUUID(), sourceId: registered.source.id,
      sourceVersion: registered.source.version, kind: 'document', anchor: { quote: '' }, quote: '', comment: '移动后保留这条评论' });
    assert.equal(annotation.ok, true);
    const location = { ...f.location, databasePath };
    await f.service.list(location);
    const moved = await f.service.move(location, { path: source, parentPath: parent });
    assert.equal(moved.ok, true, moved.error);
    assert.equal(f.scans.length, 1, 'moving must not scan the entire directory');
    assert.equal(fs.existsSync(source), false);
    assert.equal(repository.database.prepare('SELECT content_path FROM news_events WHERE event_id=?').get('article-move').content_path, moved.path);
    assert.equal(repository.database.prepare('SELECT path FROM documents WHERE id=?').get('doc-move').path, moved.path);
    const materials = JSON.parse(repository.database.prepare('SELECT interaction_documents_json FROM people WHERE id=?').get('person-move').interaction_documents_json);
    assert.equal(materials[0].path, moved.path);
    assert.equal(materials[0].url, require('node:url').pathToFileURL(moved.path).href);
    const comments = await research.handle({ action: 'source', path: moved.path });
    assert.equal(comments.source.id, registered.source.id);
    assert.equal(comments.annotations[0].comment, '移动后保留这条评论');
    const back = await f.service.move(location, { path: moved.path, parentPath: f.location.rootPath });
    assert.equal(back.ok, true, back.error);
    assert.equal(back.path, source);
    assert.equal(f.scans.length, 1);
  } finally { research.close(); repository.close(); await f.close(); }
});
