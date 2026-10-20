// Production renderer + Electron IPC + the real directory worker. All writes
// are confined to a disposable 4,000-document library, never the user's data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { _electron as electron } from 'playwright';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-library-ui-'));
const libraryRoot = path.join(directory, 'library');
fs.mkdirSync(libraryRoot);
for (let folder = 0; folder < 80; folder++) {
  const parent = path.join(libraryRoot, `行业${folder}`);
  fs.mkdirSync(parent);
  for (let file = 0; file < 50; file++) fs.writeFileSync(path.join(parent, `材料${file}.md`), '# 研究材料\n\n这是测试资料。\n');
}
const bridge = ts.transpileModule(fs.readFileSync(path.join(root, 'src/bridge.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText.replace(/\bexport /g, '');
const preload = path.join(directory, 'preload.cjs');
fs.writeFileSync(preload, `const {contextBridge,ipcRenderer}=require('electron');
  contextBridge.exposeInMainWorld('__libraryRpc', {call: (action,request)=>ipcRenderer.invoke('library-test',action,request)});`);
const entry = path.join(directory, 'electron.cjs');
fs.writeFileSync(entry, `
  const {app,BrowserWindow,ipcMain}=require('electron');
  const fs=require('node:fs'),path=require('node:path');
  const {DocumentLibraryService}=require(${JSON.stringify(path.join(root, 'electron/document-library-service.cjs'))});
  const service=new DocumentLibraryService();
  const location={rootPath:${JSON.stringify(libraryRoot)},initializeStructure:false};
  global.metrics={lists:0,creates:[],moves:[]};
  const describe=file=>{const stat=fs.statSync(file);return {path:file,name:path.basename(file),content:fs.readFileSync(file,'utf8'),size:stat.size,mtimeMs:stat.mtimeMs};};
  ipcMain.handle('library-test',async(_,action,request)=>{
    if(action==='list'){global.metrics.lists++;return service.list(location,request);}
    if(action==='create'){const start=performance.now();const result=await service.create(location,request);global.metrics.creates.push({ok:result.ok,kind:request.kind,ms:performance.now()-start});return result;}
    if(action==='move'){const result=await service.move(location,request);global.metrics.moves.push(result.ok);return result;}
    if(action==='read')return {ok:true,document:describe(request.resource)};
    if(action==='save'){fs.writeFileSync(request.path,request.content);return {ok:true,document:describe(request.path)};}
    if(action==='research')return request.action==='source' ? {ok:true,source:{id:request.path,path:request.path,name:path.basename(request.path),kind:'markdown',version:'fixture'},annotations:[]} : {ok:true,topics:[]};
  });
  app.setPath('userData',${JSON.stringify(path.join(directory, 'user-data'))});
  app.whenReady().then(()=>{new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{preload:${JSON.stringify(preload)},contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}}).loadURL('about:blank');});
  app.on('before-quit',()=>void service.close());
`);
let server, electronApp, page;
const errors = [];
const output = path.join(root, 'output', 'document-library-performance');
fs.mkdirSync(output, { recursive: true });
try {
  server = await preview({ root, configFile: false, logLevel: 'error', preview: { host: '127.0.0.1', port: 0 }, build: { outDir: path.join(root, 'dist') } });
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  electronApp = await electron.launch({ executablePath: require('electron'), args: [entry], cwd: root, env });
  page = await electronApp.firstWindow();
  page.setDefaultTimeout(15_000);
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript({ content: `${bridge}
    window.workbench = {...browserFallback,
      loadState:async()=>({ok:true,isNew:false,state:{version:2,activeThreadId:'qa',threads:[{id:'qa',projectId:'qa',title:'目录性能验收',project:'资料库',updatedAt:'今天',lastActiveAt:1,pinned:false,timeline:[],lastUsage:null,messages:[]}]}}),
      loadSettings:async()=>{const result=await browserFallback.loadSettings();result.settings.localRepositoryDir=${JSON.stringify(libraryRoot)};return result;},
      listDocumentLibrary:request=>window.__libraryRpc.call('list',request),
      createDocumentLibraryEntry:request=>window.__libraryRpc.call('create',request),
      moveDocumentLibraryEntry:request=>window.__libraryRpc.call('move',request),
      readMarkdown:request=>window.__libraryRpc.call('read',request),
      saveMarkdown:request=>window.__libraryRpc.call('save',request),
      research:request=>window.__libraryRpc.call('research',request)
    };
    window.__keyDurations=[];
    // Hidden Electron windows throttle painting; measure event processing,
    // not requestAnimationFrame latency, which would reflect that throttling.
    document.addEventListener('input',e=>{if(e.target.name==='entryName'){const start=performance.now();queueMicrotask(()=>window.__keyDurations.push(performance.now()-start));}},true);
  ` });
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '文档库', exact: true }).click();
  const sidebar = page.getByLabel('本地文档库目录');
  await sidebar.getByRole('treeitem', { name: '行业0', exact: true }).waitFor();
  // Hold an older refresh response until both writes have completed. It must
  // not erase the freshly inserted branch when it eventually arrives.
  await page.evaluate(() => {
    const list = window.workbench.listDocumentLibrary;
    window.workbench.listDocumentLibrary = async request => {
      const snapshot = await list(request);
      window.__heldSnapshotReady = true;
      window.workbench.listDocumentLibrary = list;
      return new Promise(resolve => { window.__releaseSnapshot = () => resolve(snapshot); });
    };
  });
  await page.getByRole('button', { name: '文档库', exact: true }).click();
  await page.waitForFunction(() => window.__heldSnapshotReady);
  const listsBefore = await electronApp.evaluate(() => global.metrics.lists);
  await sidebar.getByRole('button', { name: '新建文件夹', exact: true }).click();
  await sidebar.getByRole('textbox', { name: '文件夹名称' }).pressSequentially('流畅性验证', { delay: 5 });
  await sidebar.locator('button[type=submit]').click();
  await sidebar.getByRole('treeitem', { name: '流畅性验证', exact: true }).waitFor();
  const folderPath = path.join(libraryRoot, '流畅性验证');
  assert.ok(fs.statSync(folderPath).isDirectory());
  await sidebar.getByRole('button', { name: '新建 Markdown 文档', exact: true }).click();
  await sidebar.getByRole('textbox', { name: '文档名称' }).pressSequentially('连续新建中文研究笔记', { delay: 5 });
  await sidebar.locator('button[type=submit]').click();
  const editor = page.locator('.document-library-workspace .ProseMirror');
  await editor.waitFor();
  assert.match(await editor.innerText(), /连续新建中文研究笔记/);
  assert.equal(await electronApp.evaluate(() => global.metrics.lists), listsBefore, 'creating must not request a full directory refresh');
  await page.evaluate(() => window.__releaseSnapshot());
  await sidebar.getByRole('treeitem', { name: /连续新建中文研究笔记.md/ }).waitFor();
  const filePath = path.join(folderPath, '连续新建中文研究笔记.md');
  const original = fs.readFileSync(filePath, 'utf8');
  await sidebar.getByRole('button', { name: '新建 Markdown 文档', exact: true }).click();
  await sidebar.getByRole('textbox', { name: '文档名称' }).fill('连续新建中文研究笔记');
  await sidebar.locator('button[type=submit]').click();
  await sidebar.locator('.document-library-create small').filter({ hasText: '已经存在' }).waitFor();
  assert.equal(fs.readFileSync(filePath, 'utf8'), original);
  await sidebar.getByRole('textbox', { name: '文档名称' }).press('Escape');
  await sidebar.getByRole('button', { name: '新建 Markdown 文档', exact: true }).click();
  assert.equal(await sidebar.getByRole('textbox', { name: '文档名称' }).inputValue(), '', 'a new create form resets the old name');
  await sidebar.getByRole('textbox', { name: '文档名称' }).press('Escape');
  // Rename-independent refresh: an external file must become visible on reopening.
  fs.writeFileSync(path.join(folderPath, '外部更新.md'), '# 外部更新\n');
  await page.getByRole('button', { name: '文档库', exact: true }).click();
  await sidebar.getByRole('treeitem', { name: /外部更新.md/ }).waitFor();
  const row = file => sidebar.locator(`[data-document-library-path=${JSON.stringify(file)}]`);
  async function drag(source, target) {
    await page.waitForFunction(() => document.querySelector('[aria-label="本地文档库目录"]')?.getAttribute('aria-busy') !== 'true');
    await source.scrollIntoViewIfNeeded();
    const from = await source.boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    // Start the native drag before scrolling to a distant destination. A
    // scroll before dragstart can otherwise put a different row under the mouse.
    await page.mouse.move(from.x + from.width / 2 + 8, from.y + from.height / 2 + 4, { steps: 3 });
    await target.scrollIntoViewIfNeeded();
    const to = await target.boundingBox();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    await page.mouse.up();
  }
  const listsBeforeMove = await electronApp.evaluate(() => global.metrics.lists);
  // Native HTML drag and drop must save the open editor and update both paths.
  await page.locator('.document-library-workspace').getByRole('button', { name: '编辑', exact: true }).click();
  await editor.fill('移动前未保存的新内容。');
  await drag(row(filePath), sidebar.getByRole('treeitem', { name: '行业0', exact: true }));
  const movedPath = path.join(libraryRoot, '行业0', path.basename(filePath));
  await row(movedPath).waitFor();
  await page.waitForFunction(file => document.querySelector('.document-library-workspace')?.textContent?.includes(file), movedPath);
  assert.equal(fs.existsSync(filePath), false);
  assert.match(fs.readFileSync(movedPath, 'utf8'), /移动前未保存的新内容/);
  await drag(row(movedPath), sidebar.getByRole('button', { name: '全部文档', exact: true }));
  const rootFile = path.join(libraryRoot, path.basename(filePath));
  await row(rootFile).waitFor();
  assert.equal(fs.existsSync(movedPath), false);
  await drag(row(rootFile), sidebar.getByRole('treeitem', { name: '流畅性验证', exact: true }));
  await row(filePath).waitFor();
  assert.equal(await electronApp.evaluate(() => global.metrics.lists), listsBeforeMove, 'moving documents must not force a full library refresh');
  // A destination conflict keeps both files and leaves the current editor usable.
  const collisionPath = path.join(libraryRoot, '行业1', path.basename(filePath));
  fs.writeFileSync(collisionPath, '# 原有内容必须保留\n');
  await drag(row(filePath), sidebar.getByRole('treeitem', { name: '行业1', exact: true }));
  await sidebar.locator('.document-library-state.error').filter({ hasText: '已存在' }).waitFor();
  assert.match(fs.readFileSync(filePath, 'utf8'), /移动前未保存的新内容/);
  assert.equal(fs.readFileSync(collisionPath, 'utf8'), '# 原有内容必须保留\n');
  await drag(row(filePath), sidebar.getByRole('treeitem', { name: '流畅性验证', exact: true }));
  await sidebar.locator('.document-library-notice').filter({ hasText: '已在此文件夹' }).waitFor();
  await sidebar.getByRole('textbox', { name: '搜索本地文档库' }).fill('材料49');
  await sidebar.getByRole('treeitem', { name: /材料49.md/ }).first().waitFor();
  assert.equal(await sidebar.getByRole('treeitem', { name: /材料49.md/ }).count(), 80);
  await sidebar.getByRole('button', { name: '清除文档搜索' }).click();
  const metrics = await electronApp.evaluate(() => global.metrics);
  const input = await page.evaluate(() => ({ samples: window.__keyDurations.length, maxProcessingMs: Math.max(0,...window.__keyDurations), definition: 'input event capture through microtask checkpoint; excludes hidden-window painting' }));
  assert.ok(input.samples >= 2);
  assert.deepEqual(errors, []);
  const screenshot = await electronApp.evaluate(async ({ BrowserWindow }) => {
    const image = await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true, stayAwake: true });
    if (image.isEmpty()) throw new Error('Electron capture returned an empty image');
    return image.toPNG().toString('base64');
  });
  fs.writeFileSync(path.join(output, 'electron-library.png'), Buffer.from(screenshot, 'base64'));
  const report = { ok: true, engine: 'Electron production renderer + real worker + real filesystem', documents: 4000,
    checks: ['nested folder + Markdown creation', 'new file opens in editor', 'no full refresh on create', 'stale refresh cannot erase new entries', 'duplicate keeps original', 'cancel resets name', 'external update refresh', 'native file drag saves open draft', 'drag to root and back', 'moves avoid full refresh', 'drag collision preserves both files', 'same-folder drop', 'search through 80 folders', 'no renderer errors'], metrics, input };
  fs.writeFileSync(path.join(output, 'ui-results.json'), JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify(report) + '\n');
} catch (error) {
  if (page) {
    await page.screenshot({ path: path.join(output, 'failure.png'), timeout: 3000 }).catch(() => {});
    process.stderr.write(JSON.stringify({ errors, body: (await page.locator('body').innerText()).slice(0, 2500) }) + '\n');
  }
  throw error;
} finally {
  await electronApp?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
  fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
