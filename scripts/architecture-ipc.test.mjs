// Use the actual main.cjs and preload IPC. Startup integrations are held so
// no model, plugin install, external sync, or user's configuration is touched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { _electron } from 'playwright';
const require = createRequire(import.meta.url);
const { LocalDomiRepository } = require('../electron/local-domi-repository.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-architecture-ipc-'));
for (const folder of ['appData', 'documents', 'cache', 'codex', 'home']) fs.mkdirSync(path.join(directory, folder));
const entry = path.join(directory, 'entry.cjs');
fs.writeFileSync(entry, `
  const {app,BrowserWindow,session}=require('electron'),path=require('node:path');
  for(const name of ['appData','documents','cache','home'])app.setPath(name,path.join(${JSON.stringify(directory)},name));
  const whenReady=app.whenReady.bind(app);app.whenReady=()=>new Promise(()=>{});
  require(${JSON.stringify(path.join(root, 'electron/main.cjs'))});app.whenReady=whenReady;
  whenReady().then(()=>{
    session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith('file:')&&!details.url.startsWith('about:')}));
    const win=new BrowserWindow({show:false,width:1000,height:800,webPreferences:{preload:${JSON.stringify(path.join(root, 'electron/preload.cjs'))},contextIsolation:true,nodeIntegration:false}});
    win.loadURL('about:blank');
  });
`);
const env = { ...process.env, CODEX_HOME: path.join(directory, 'codex'), DOMI_DEV_ISOLATED: '1' };
delete env.ELECTRON_RUN_AS_NODE;
let application;
const checks = [];
try {
  application = await _electron.launch({ executablePath: require('electron'), args: [entry], cwd: root, env });
  const page = await application.firstWindow();
  await page.evaluate(() => window.workbench.onPrepareClose(async () => ({ ok: true })));
  const call = (method, ...args) => page.evaluate(({ method, args }) => window.workbench[method](...args), { method, args });
  const settings = await call('saveSettings', { localRepositoryDir: path.join(directory, 'library'), onboardingComplete: true,
    storageBackend: 'local', plaudConnectionMode: 'disabled', semanticSearchEnabled: false });
  assert.equal(settings.ok, true, settings.error);
  const libraryDir = settings.settings.localRepositoryDir, databasePath = settings.settings.localDatabasePath;
  for (const file of [libraryDir, databasePath]) {
    const relative = path.relative(directory, file);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'all runtime paths must stay in the temporary fixture');
  }
  const projectDirectory = path.join(libraryDir, '07.模型层', 'Agent', 'IPC项目'), homepage = path.join(projectDirectory, '项目主页.md');
  fs.mkdirSync(projectDirectory, { recursive: true });
  fs.writeFileSync(homepage, '# IPC项目\n\n<!-- domi:managed:start -->\n待更新\n<!-- domi:managed:end -->\n');
  const repository = new LocalDomiRepository({ databasePath, libraryDir });
  repository.database.prepare(`INSERT INTO projects(id,name,normalized_name,domain,subdomains_json,document_path,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?)`).run('prj_ipc_test', 'IPC项目', 'IPC项目', 'AI', '["Agent"]', homepage, 1000, 1000);
  repository.close();
  const list = await call('listDomiDatabase', { fresh: true });
  assert.equal(list.ok, true, list.error); assert.equal(list.projects[0].name, 'IPC项目'); checks.push('database snapshot through real IPC');
  const patch = await call('updateDomiDatabaseRecordPatch', { entityType: 'project', recordId: 'prj_ipc_test', expectedUpdatedAt: list.projects[0].updatedAt,
    mutationId: 'actual-ipc-patch', changes: { notes: '真实 IPC 后台编辑' } });
  assert.equal(patch.ok, true, patch.error); assert.equal(patch.record.notes, '真实 IPC 后台编辑');
  const replay = await call('updateDomiDatabaseRecordPatch', { entityType: 'project', recordId: 'prj_ipc_test', expectedUpdatedAt: list.projects[0].updatedAt,
    mutationId: 'actual-ipc-patch', changes: { notes: '真实 IPC 后台编辑' } });
  assert.equal(replay.replayed, true); checks.push('idempotent edit and background materialization');
  const workspace = await call('loadDomiEntityWorkspace', { entityType: 'project', recordId: 'prj_ipc_test' });
  assert.equal(workspace.ok, true, workspace.error); assert.equal(workspace.workspacePath, projectDirectory);
  const preview = await call('previewDomiDatabaseRecord', { entityType: 'project', recordId: 'prj_ipc_test' });
  assert.equal(preview.ok, true, preview.error); checks.push('async entity workspace and preview');
  const imported = await page.evaluate(({ projectDirectory }) => window.workbench.importFileData([
    { name: '附件.md', data: new TextEncoder().encode('# IPC 附件') }
  ], projectDirectory, { entityType: 'project', recordId: 'prj_ipc_test' }), { projectDirectory });
  assert.equal(imported.ok, true, imported.error);
  assert.ok(imported.files[0].path.startsWith(projectDirectory + path.sep)); checks.push('entity attachment boundary after async resolution');
  const pdf = path.join(projectDirectory, 'size-fixture.pdf'); fs.writeFileSync(pdf, '%PDF-1.7\nsource fingerprint fixture');
  const opened = await call('readPdf', { resource: pdf });
  assert.equal(opened.ok, true, opened.error); assert.equal(opened.document.version.length, 64); checks.push('PDF fingerprint through research worker');
  const source = await call('research', { action: 'source', path: homepage });
  assert.equal(source.ok, true, source.error);
  const annotated = await call('research', { action: 'annotate', id: crypto.randomUUID(), sourceId: source.source.id,
    sourceVersion: source.source.version, kind: 'document', anchor: { quote: '' }, quote: '', comment: '真实 IPC 评论' });
  assert.equal(annotated.ok, true, annotated.error); checks.push('source registration and comment commit');
  await application.close(); application = null; checks.push('main-process graceful shutdown drains and closes worker services');
  const output = path.join(root, 'output', 'architecture-performance'); fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'ipc-results.json'), JSON.stringify({ ok: true, checks }, null, 2));
  process.stdout.write(JSON.stringify({ ok: true, engine: 'actual Electron main.cjs + preload + worker services', checks }) + '\n');
} finally {
  if (application) {
    // Fixture failure must not wait on a renderer that never mounted its flush handler.
    await application.evaluate(({ app }) => { app.removeAllListeners('before-quit'); app.exit(0); }).catch(() => {});
  }
  assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
  assert.ok(path.basename(directory).startsWith('domi-architecture-ipc-'));
  fs.rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
