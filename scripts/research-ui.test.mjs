import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, _electron } from 'playwright';
import { createServer, build } from 'vite';
import { researchNotes } from '../shared/research-markdown.mjs';
import {runWordScenario} from './word-ui-scenario.mjs';
const require = createRequire(import.meta.url);
const { ResearchStore } = require('../electron/research-store.cjs');
const PDFDocument = require('pdfkit');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(),'domi-research-ui-'));
const useProduction = process.argv.includes('--production');
const useElectron = useProduction || process.argv.includes('--electron');
const wordMode=process.argv.includes('--word');
const webDirectory = path.join(directory,'web-dist');
const original = path.join(directory,'03.算力芯片','中文 材料.md'), pdfPath = path.join(directory,'Subscription report.pdf');
fs.mkdirSync(path.dirname(original),{recursive:true});
fs.writeFileSync(original,'# 收入研究\n\n企业收入来自订阅服务。\n\n客户续费仍需观察。\n\n| 指标 | 数值 |\n|---|---|\n| 留存 | 90% |\n');
const originalBytes = fs.readFileSync(original);
const wordPath=path.join(directory,'03.算力芯片','中文 Word 材料.docx');if(wordMode)fs.writeFileSync(wordPath,await require('./word-fixture.cjs').wordFixture());
await new Promise(resolve => {
  const pdf = new PDFDocument({ size:[540,720] }), stream = fs.createWriteStream(pdfPath);
  pdf.pipe(stream); pdf.fontSize(17).text('Subscription revenue rose 25 percent.',45,70);
  pdf.fontSize(12).text('Customer retention still needs verification.',45,112);
  pdf.rect(60,180,300,150).fill('#628474'); pdf.fillColor('white').fontSize(20).text('CHART 1',150,240);
  pdf.addPage({ size:[540,720] }).fillColor('black').text('Second page of the research material.',45,80);
  pdf.end(); stream.on('finish',resolve);
});
let store = new ResearchStore({ rootPath:directory });
const exportsPath=path.join(directory,'exports');fs.mkdirSync(exportsPath);
const {createDocumentAnnotationService}=require('../electron/document-annotations.cjs');
const annotationService=createDocumentAnnotationService({getStore:()=>store,allowedPaths:new Set(),cacheDir:path.join(directory,'word-cache'),chooseSave:async options=>({canceled:false,filePath:path.join(exportsPath,options.filters[0].extensions[0]==='pdf'?'annotated.pdf':'annotated.docx')})});
let server, browser, page, origin, electronApp;
const errors = [], requests = [];
const fixture = `
import React, {useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import MaterialReader from '/src/MaterialReader.tsx';
import ResearchWorkspace from '/src/ResearchWorkspace.tsx';
import {flushResearchDocuments,mutateResearch} from '/src/research-runtime.ts';
import '/src/styles.css';
function Harness() {
 const [kind,setKind] = useState(${JSON.stringify(wordMode?'word':'markdown')}), [material,setMaterial] = useState(null), [request,setRequest] = useState({nonce:0});
 const [pdfFile,setPdfFile]=useState(${JSON.stringify(pdfPath)});window.__showExportedPdf=()=>{setMaterial(null);setPdfFile(${JSON.stringify(path.join(exportsPath,'annotated.pdf'))});setKind('pdf');};
 useEffect(()=>{const listener=e=>setRequest({...e.detail,nonce:Date.now()}); window.addEventListener('domi:open-research',listener); return()=>window.removeEventListener('domi:open-research',listener);},[]);
 useEffect(()=>{window.workbench[kind==='word'?'readWord':kind==='pdf'?'readPdf':'readMarkdown']({resource:kind==='word'?${JSON.stringify(wordPath)}:kind==='pdf'?pdfFile:${JSON.stringify(original)}}).then(r=>setMaterial(r.document));},[kind,pdfFile]);
 window.__flushResearch = flushResearchDocuments; window.__mutateResearch = mutateResearch;
 return <div style={{height:'100vh',display:'flex',flexDirection:'column'}}><header style={{padding:8}}><button onClick={()=>{setMaterial(null);setKind('markdown')}}>阅读 Markdown</button><button onClick={()=>{setMaterial(null);setKind('pdf')}}>阅读 PDF</button>${wordMode?'<button onClick={()=>{setMaterial(null);setKind(\'word\')}}>阅读 Word</button>':''}</header>
 <main style={{display:'flex',flex:1,minHeight:0}}><div id="source-fixture" style={{width:'43%',height:'100%',minWidth:0,borderRight:'1px solid #ddd'}}>{material&&<MaterialReader key={kind} markdown={kind==='markdown'?material:undefined} pdf={kind==='pdf'?material:undefined} word={kind==='word'?material:undefined}/>}</div><div id="workspace-fixture" style={{width:'57%',height:'100%',minWidth:0}}><ResearchWorkspace visible request={request}/></div></main></div>;
}
createRoot(document.getElementById('root')).render(<Harness/>);`;
async function readMarkdown(resource) {
  const stat = fs.statSync(resource);
  return { ok:true,document:{ path:resource,name:path.basename(resource),content:fs.readFileSync(resource,'utf8'),size:stat.size,mtimeMs:stat.mtimeMs } };
}
async function selectText(container, needle, mouseup = false) {
  await container.evaluate((element,{needle,mouseup}) => {
    const walker = document.createTreeWalker(element,NodeFilter.SHOW_TEXT); let node;
    while ((node = walker.nextNode())) {
      const at = node.textContent.indexOf(needle); if (at < 0) continue;
      const range = document.createRange(); range.setStart(node,at); range.setEnd(node,at+needle.length);
      (element.closest('.ProseMirror') || element).focus(); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
      if (mouseup) { const rect = range.getBoundingClientRect(); element.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:rect.left+10,clientY:rect.bottom})); }
      return;
    }
    throw new Error('找不到选区文字 '+needle);
  },{ needle,mouseup });
}
try {
  server = await createServer({ configFile:false,root,cacheDir:path.join(directory,'vite'),logLevel:'error',esbuild:{jsx:'automatic',jsxImportSource:'react'},
    optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','lucide-react','@tiptap/core','@tiptap/react','@tiptap/starter-kit','@tiptap/markdown','@tiptap/pm/state','@tiptap/pm/view','@tiptap/pm/model','@tiptap/extension-table','@tiptap/extension-image','@tiptap/extension-task-item','@tiptap/extension-task-list','pdfjs-dist']},
    server:{host:'127.0.0.1',port:0,strictPort:false,hmr:false},plugins:[{
    name:'research-ui-fixture',
    resolveId(id) { if (id === '/__research_fixture.tsx') return '\0research-fixture'; },
    load(id) { if (id === '\0research-fixture') return { code:fixture, map:null }; },
    transform(code,id) { if (id === '\0research-fixture') return import('typescript').then(ts=>({ code:ts.transpileModule(code,{ compilerOptions:{ jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022 } }).outputText,map:null })); },
    configureServer(vite) { vite.middlewares.use((request,response,next)=>{
      if (request.url === '/__research_test__') { response.setHeader('Content-Type','text/html; charset=utf-8'); response.end('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><div id="root"></div><script type="module" src="/__research_fixture.tsx"></script></body></html>'); }
      else if (request.url === '/__fixture_pdf') { response.setHeader('Content-Type','application/pdf'); fs.createReadStream(pdfPath).pipe(response); }
      else if (request.url === '/__fixture_exported_pdf') { response.setHeader('Content-Type','application/pdf'); fs.createReadStream(path.join(exportsPath,'annotated.pdf')).pipe(response); }
      else if (/^\/pdfjs\/(cmaps|standard_fonts|wasm)\//.test(request.url || '')) { const file = path.resolve(root,'node_modules/pdfjs-dist',request.url.slice(7)); if (file.startsWith(path.join(root,'node_modules/pdfjs-dist')+path.sep) && fs.existsSync(file)) { response.setHeader('Content-Type',file.endsWith('.wasm')?'application/wasm':'application/octet-stream'); fs.createReadStream(file).pipe(response); } else { response.statusCode=404; response.end(); } }
      else next();
    }); }
  }] });
  await server.listen(); origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  let testUrl = `${origin}/__research_test__`;
  if (useProduction) {
    await build({configFile:false,root,base:'./',logLevel:'error',esbuild:{jsx:'automatic',jsxImportSource:'react'},plugins:[server.config.plugins.find(plugin=>plugin.name==='research-ui-fixture')],
      build:{outDir:webDirectory,emptyOutDir:false,cssCodeSplit:false,rollupOptions:{input:'/__research_fixture.tsx',output:{entryFileNames:'fixture.js',assetFileNames:'assets/[name][extname]'}}}});
    for(const name of ['cmaps','standard_fonts','wasm']) fs.cpSync(path.join(root,'node_modules/pdfjs-dist',name),path.join(webDirectory,'pdfjs',name),{recursive:true});
    const styles = fs.readdirSync(path.join(webDirectory,'assets')).filter(name=>name.endsWith('.css')).map(name=>`<link rel="stylesheet" href="./assets/${name}">`).join('');
    fs.writeFileSync(path.join(webDirectory,'index.html'),`<!doctype html><html><head><meta charset="utf-8">${styles}</head><body style="margin:0"><div id="root"></div><script type="module" src="./fixture.js"></script></body></html>`);
    testUrl = pathToFileURL(path.join(webDirectory,'index.html')).href;
  }
  if (useElectron) {
    const entry = path.join(directory,'electron-fixture.cjs');
    fs.writeFileSync(entry,`const {app,BrowserWindow,ipcMain,protocol,net}=require('electron');
      const fs=require('node:fs'),path=require('node:path');
      const {ResearchStore}=require(${JSON.stringify(path.join(root,'electron/research-store.cjs'))});
      const {createPdfPreviewRegistry}=require(${JSON.stringify(path.join(root,'electron/pdf-preview.cjs'))});
      const {createDocumentAnnotationService}=require(${JSON.stringify(path.join(root,'electron/document-annotations.cjs'))});
      app.setPath('userData',${JSON.stringify(path.join(directory,'electron-user-data'))});app.disableHardwareAcceleration();
      protocol.registerSchemesAsPrivileged([{scheme:'domi-pdf',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}}]);
      const registry=createPdfPreviewRegistry({net}),store=new ResearchStore({rootPath:${JSON.stringify(directory)}});global.requestActions=[];
      const annotations=createDocumentAnnotationService({getStore:()=>store,allowedPaths:new Set(),cacheDir:${JSON.stringify(path.join(directory,'word-cache'))},chooseSave:async options=>({canceled:false,filePath:path.join(${JSON.stringify(exportsPath)},options.filters[0].extensions[0]==='pdf'?'annotated.pdf':'annotated.docx')})});
      app.whenReady().then(()=>{
        protocol.handle('domi-pdf',request=>registry.handle(request));
        ipcMain.handle('research:request',(_e,request)=>{global.requestActions.push(request.action);return store.handle(request);});
        ipcMain.handle('word:read',(_e,request)=>annotations.readWord(request));ipcMain.handle('document:export-annotated',(_e,request)=>annotations.exportAnnotated(request));
        ipcMain.handle('markdown:read',(_e,request)=>{const file=request.resource,stat=fs.statSync(file);return {ok:true,document:{path:file,name:path.basename(file),content:fs.readFileSync(file,'utf8'),size:stat.size,mtimeMs:stat.mtimeMs}};});
        ipcMain.handle('pdf:read',(_event,request)=>{const file=request.resource,stat=fs.statSync(file);return {ok:true,document:{path:file,name:path.basename(file),previewUrl:registry.url(file),size:stat.size,mtimeMs:stat.mtimeMs,version:require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex')}};});
        ipcMain.handle('markdown:image-preview',(_e,request)=>({ok:true,previewUrl:'data:image/png;base64,'+fs.readFileSync(path.resolve(path.dirname(request.documentPath),request.source)).toString('base64')}));
        ipcMain.on('app:renderer-report',()=>{});ipcMain.handle('resource:open',()=>({ok:true}));
        const win=new BrowserWindow({width:1660,height:1050,show:false,webPreferences:{preload:${JSON.stringify(path.join(root,'electron/preload.cjs'))},contextIsolation:true,sandbox:true,backgroundThrottling:false}});win.loadURL('about:blank');
      });app.on('window-all-closed',()=>app.quit());`);
    const environment = {...process.env}; delete environment.ELECTRON_RUN_AS_NODE;
    electronApp = await _electron.launch({executablePath:require('electron'),args:[entry],env:environment}); page = await electronApp.firstWindow(); await page.setViewportSize({width:1660,height:1050});
  } else { browser = await chromium.launch({ headless:true }); page = await browser.newPage({ viewport:{width:1660,height:1050} }); }
  page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{ if(m.type()==='error') errors.push(m.text()); });
  await page.exposeFunction('__researchRpc',async request=>{ requests.push(request.action); return store.handle(request); });
  await page.exposeFunction('__readMarkdown',request=>readMarkdown(request.resource));
  await page.exposeFunction('__readWord',request=>annotationService.readWord(request));await page.exposeFunction('__exportAnnotated',request=>annotationService.exportAnnotated(request));
  await page.exposeFunction('__readPdf',request=>{const file=request.resource;return {ok:true,document:{path:file,name:path.basename(file),previewUrl:`${origin}/${file===pdfPath?'__fixture_pdf':'__fixture_exported_pdf'}`,size:fs.statSync(file).size,mtimeMs:fs.statSync(file).mtimeMs,version:require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex')}};});
  await page.exposeFunction('__resolveImage',request=>{
    const file = path.resolve(path.dirname(request.documentPath),request.source);
    if (!file.startsWith(directory+path.sep)) return {ok:false,error:'outside'};
    return {ok:true,previewUrl:`data:image/png;base64,${fs.readFileSync(file).toString('base64')}`};
  });
  if (!useElectron) await page.addInitScript(()=>{ window.workbench={ research:r=>window.__researchRpc(r),readMarkdown:r=>window.__readMarkdown(r),readPdf:r=>window.__readPdf(r),readWord:r=>window.__readWord(r),exportAnnotatedDocument:r=>window.__exportAnnotated(r),resolveMarkdownImage:r=>window.__resolveImage(r),reportRendererIssue:()=>{},openResource:async()=>({ok:true}) }; });
  await page.route('**/*',route=>(!useProduction && new URL(route.request().url()).origin === origin) || /^(data:|domi-pdf:)/.test(route.request().url()) || (useProduction && route.request().url().startsWith(pathToFileURL(webDirectory+path.sep).href)) ? route.continue() : route.abort());
  await page.goto(testUrl,{waitUntil:'networkidle'});
  await page.evaluate(() => {
    window.__documentQuestions = [];
    window.addEventListener('domi:quote-document', event => { window.__documentQuestions.push(event.detail.quote); event.detail.accept(Promise.resolve()); });
  });
  console.log(`Research UI: ${useProduction ? 'production file:// + sandbox' : useElectron ? 'Electron' : 'Chromium'} fixture ready`);
  const source = page.locator('#source-fixture'), workspace = page.locator('#workspace-fixture');
  if(wordMode) {
    await runWordScenario({page,source,workspace,store,wordPath,pdfPath,exportsPath,root,useElectron,selectText});assert.deepEqual(errors,[]);
  }else {
  await source.locator('.ProseMirror[contenteditable=false]').waitFor();
  assert.ok((await source.locator('.rich-markdown-scroll').boundingBox()).height>400,'阅读模式正文必须占满面板');
  await source.locator('.ProseMirror').click(); await page.keyboard.press('Control+f');
  await source.getByRole('textbox',{name:'搜索关键词',exact:true}).fill('订阅服务');
  await source.locator('.rich-markdown-search-count').filter({hasText:'1/1'}).waitFor();
  assert.equal(await workspace.locator('.rich-markdown-search').count(),0,'查找快捷键只能作用于当前阅读器');
  await page.keyboard.press('Escape');
  await selectText(source.locator('.ProseMirror'),'企业收入来自订阅服务。');
  const capture = page.getByRole('dialog',{name:'阅读批注与主题研究'}); await capture.waitFor();
  await capture.getByRole('button',{name:'引用提问',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__documentQuestions[0].text),'企业收入来自订阅服务。');
  assert.equal(await page.evaluate(()=>window.__documentQuestions[0].path),original);
  assert.equal((await store.handle({action:'source',path:original})).annotations.length,0,'引用提问不创建阅读批注');
  await selectText(source.locator('.ProseMirror'),'企业收入来自订阅服务。'); await capture.waitFor();
  await capture.getByRole('button',{name:'评论',exact:true}).click();
  const sourceComments = source.getByRole('complementary',{name:'文档评论'});
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).fill('需要验证付费留存。');
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await source.locator('.reading-mark').first().waitFor();
  await sourceComments.getByRole('button',{name:'收起评论列表'}).click();
  await source.locator('.reading-mark').first().click();
  assert.deepEqual(fs.readFileSync(original),originalBytes);
  await capture.getByRole('button',{name:'加入主题研究',exact:true}).click();
  const topicSearch = capture.getByRole('textbox',{name:'搜索或新建研究主题'});
  assert.equal(await capture.getByRole('combobox',{name:'新主题所属行业'}).inputValue(),'算力芯片','新主题默认跟随材料行业');
  for (const [name,industry] of [['推理成本研究','算力芯片'],['收入质量研究','云与算力服务']]) {
    await capture.getByRole('combobox',{name:'新主题所属行业'}).selectOption(industry);
    await topicSearch.fill(name); await capture.getByRole('button',{name:`新建主题《${name}》`,exact:true}).click(); await topicSearch.waitFor();
    await capture.getByLabel(name,{exact:true}).waitFor();
  }
  await capture.getByRole('button',{name:'加入 2 个主题',exact:true}).click();
  await source.getByRole('button',{name:'打开《推理成本研究》',exact:true}).waitFor();
  await capture.getByRole('button',{name:'关闭批注工具'}).click();
  await source.getByRole('button',{name:'打开《推理成本研究》',exact:true}).click();
  // Selected comments, whole-document comments, edit/delete and cyclic navigation share one panel.
  await selectText(source.locator('.ProseMirror'),'客户续费仍需观察。'); await capture.waitFor();
  await capture.getByRole('button',{name:'评论',exact:true}).click();
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).fill('续费率的第二条评论');
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await source.getByRole('button',{name:'新增评论',exact:true}).click();
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).fill('整篇材料的研究问题');
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await sourceComments.getByRole('button',{name:'定位评论 3',exact:true}).click();
  await source.getByRole('button',{name:'下一条评论',exact:true}).click();
  assert.equal(await source.getByLabel('评论导航位置').innerText(),'1 / 3');
  await source.getByRole('button',{name:'下一条评论',exact:true}).click();
  assert.equal(await source.getByLabel('评论导航位置').innerText(),'2 / 3');
  await source.locator('.reading-mark.research-target').waitFor();
  await sourceComments.getByRole('button',{name:'编辑评论 3',exact:true}).click();
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).fill('续费率的已修改评论');
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await sourceComments.getByText('续费率的已修改评论',{exact:true}).waitFor();
  await sourceComments.getByRole('button',{name:'编辑评论 3',exact:true}).click();
  const concurrent = (await store.handle({action:'source',path:original})).annotations.find(item=>item.comment==='续费率的已修改评论');
  await store.handle({action:'updateComment',annotationId:concurrent.id,expectedUpdatedAt:concurrent.updatedAt,comment:'另一个窗口的意见'});
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await sourceComments.getByRole('alert').filter({hasText:'草稿已保留'}).waitFor();
  assert.equal(await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).inputValue(),'续费率的已修改评论');
  await sourceComments.getByRole('button',{name:'载入最新评论并保留草稿',exact:true}).click();
  await sourceComments.getByText('另一个窗口的意见',{exact:true}).waitFor();
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).fill('续费率的已修改评论；另一个窗口的意见');
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await sourceComments.getByRole('button',{name:'删除评论 1',exact:true}).click();
  await source.getByRole('button',{name:'评论 2',exact:true}).waitFor();
  await sourceComments.getByRole('button',{name:'收起评论列表'}).click();
  await workspace.locator('.research-note').waitFor();
  await workspace.locator('.research-document .ProseMirror h2').filter({hasText:'我的分析'}).waitFor();
  assert.match(await workspace.locator('.research-note').innerText(),/企业收入来自订阅服务/);
  const topics = (await store.handle({action:'list'})).topics, topic = topics.find(item=>item.title==='推理成本研究'), other = topics.find(item=>item.title==='收入质量研究');
  assert.equal(topic.industry,'算力芯片'); assert.equal(other.industry,'云与算力服务');
  assert.ok(topic.path.startsWith(path.join(directory,'03.算力芯片','主题研究')+path.sep));
  const firstAnnotation = researchNotes(fs.readFileSync(topic.path,'utf8'))[0].annotationId;
  await workspace.locator('.research-note select').selectOption({label:'我的分析'});
  await workspace.locator('.research-note-comment p').click(); await page.keyboard.press('End'); await page.keyboard.type(' 本主题的独立判断。');
  await selectText(workspace.locator('.research-document .ProseMirror'),'本主题的独立判断。');
  await page.getByRole('dialog',{name:'研究笔记引用提问'}).getByRole('button',{name:'引用提问',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__documentQuestions.at(-1).text),'本主题的独立判断。');
  assert.equal(await page.evaluate(()=>window.__documentQuestions.at(-1).path),topic.path);
  assert.equal(await page.evaluate(()=>window.__flushResearch()),true);
  const saved = fs.readFileSync(topic.path,'utf8');
  assert.match(saved,/独立判断/); assert.ok(saved.indexOf('domi:note:start') < saved.indexOf('## 待核实问题'));
  assert.doesNotMatch(fs.readFileSync(other.path,'utf8'),/独立判断/);
  await selectText(workspace.locator('.research-note blockquote').first(),'企业收入来自订阅服务。');
  await page.getByRole('dialog',{name:'研究笔记引用提问'}).getByRole('button',{name:'引用提问',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__documentQuestions.at(-1).text),'企业收入来自订阅服务。','只读摘录也能引用提问');
  await selectText(workspace.locator('.research-note blockquote').first(),'企业收入来自订阅服务。');
  await page.getByRole('dialog',{name:'研究笔记引用提问'}).getByRole('button',{name:'评论',exact:true}).click();
  const notebookComments = workspace.locator('.research-document').getByRole('complementary',{name:'文档评论'});
  await notebookComments.getByRole('textbox',{name:'文档评论草稿'}).fill('对只读摘录的文档评论');
  await notebookComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await notebookComments.getByRole('button',{name:'定位评论 1',exact:true}).click();
  await workspace.locator('.research-note blockquote .research-target').waitFor();
  const notebookAnnotations=(await store.handle({action:'source',path:topic.path})).annotations;
  assert.ok(notebookAnnotations[0].anchor.noteId,'只读摘录评论使用稳定笔记身份定位');
  await notebookComments.getByRole('button',{name:'收起评论列表'}).click();
  // Immediate insertion while the document has a fresh, unflushed edit.
  await workspace.locator('.research-note-comment p').click(); await page.keyboard.press('End'); await page.keyboard.type(' 刚输入的草稿。');
  const sourceInfo = (await store.handle({action:'source',path:original})).source;
  const secondAnnotation = crypto.randomUUID();
  await store.handle({action:'annotate',id:secondAnnotation,sourceId:sourceInfo.id,sourceVersion:sourceInfo.version,kind:'text',anchor:{quote:'客户续费仍需观察。'},quote:'客户续费仍需观察。',comment:'第二条研究笔记'});
  const added = await page.evaluate(({annotationId,topicId})=>window.__mutateResearch({action:'add',annotationId,topicIds:[topicId],operationId:crypto.randomUUID()}),{annotationId:secondAnnotation,topicId:topic.id});
  assert.equal(added.ok,true,added.error); await workspace.locator('.research-note').nth(1).waitFor();
  assert.match(fs.readFileSync(topic.path,'utf8'),/刚输入的草稿/);
  assert.equal(await workspace.locator('.research-note').count(),2);
  console.log('Research UI: Markdown, editor and concurrent insertion passed');
  await workspace.locator('.research-note').first().getByRole('button',{name:/中文 材料/}).click();
  await workspace.locator('.research-source .reading-mark').first().waitFor();
  assert.equal(await workspace.locator('.research-document .research-note').count(),2);
  await workspace.getByRole('button',{name:'关闭来源',exact:true}).click();
  // Both sources use the real PDF renderer, local fonts and worker.
  await page.getByRole('button',{name:'阅读 PDF',exact:true}).click();
  await source.locator('.textLayer span').filter({hasText:'Subscription revenue'}).waitFor({timeout:30000});
  await selectText(source.locator('.textLayer').first(),'Subscription revenue rose 25 percent.',true);
  await capture.waitFor(); await capture.getByRole('button',{name:'引用提问',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>window.__documentQuestions.at(-1).pages),[1]);
  assert.equal(await page.evaluate(()=>window.__documentQuestions.at(-1).path),pdfPath);
  await selectText(source.locator('.textLayer').first(),'Subscription revenue rose 25 percent.',true);
  await capture.waitFor(); await capture.getByRole('button',{name:'高亮',exact:true}).click();
  await source.locator('.research-pdf-mark.text').first().waitFor();
  await capture.getByRole('button',{name:'关闭批注工具'}).click();
  await source.getByRole('combobox',{name:'PDF 缩放'}).selectOption('1.25');
  await source.getByRole('button',{name:'旋转',exact:true}).click();
  await source.locator('.textLayer span').filter({hasText:'Subscription revenue'}).waitFor();
  const markBox = await source.locator('.research-pdf-mark.text').first().boundingBox(); assert.ok(markBox.width>0 && markBox.height>0);
  await source.getByRole('button',{name:'框选区域',exact:true}).click();
  const chart = await source.locator('[data-pdf-page="1"] canvas').evaluate(canvas=>{
    const context = canvas.getContext('2d'), data = context.getImageData(0,0,canvas.width,canvas.height).data;
    let minX=canvas.width,minY=canvas.height,maxX=0,maxY=0;
    for(let y=0;y<canvas.height;y+=3)for(let x=0;x<canvas.width;x+=3){const i=(y*canvas.width+x)*4;if(Math.abs(data[i]-98)<3&&Math.abs(data[i+1]-132)<3&&Math.abs(data[i+2]-116)<3){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
    const rect=canvas.getBoundingClientRect(),ratio=rect.width/canvas.width;
    return {x:rect.x+minX*ratio+8,y:rect.y+minY*ratio+8,width:(maxX-minX)*ratio-16,height:(maxY-minY)*ratio-16};
  });
  assert.ok(chart.width>20&&chart.height>20,'真实 PDF 图表必须已经渲染');
  await page.mouse.move(chart.x,chart.y); await page.mouse.down(); await page.mouse.move(chart.x+chart.width,chart.y+chart.height,{steps:8}); await page.mouse.up();
  await capture.locator('img[alt="选中的图表区域"]').waitFor();
  assert.ok(await capture.locator('img').evaluate(image=>{const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');context.drawImage(image,0,0);const pixel=context.getImageData(2,2,1,1).data;return pixel[1]>pixel[0]+20;}),'截图必须来自选中的图表，不能是空白占位');
  await capture.getByRole('button',{name:'评论',exact:true}).click();
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).fill('图表摘录的评论');
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await sourceComments.getByRole('button',{name:'收起评论列表'}).click();
  await source.getByRole('button',{name:'框选区域',exact:true}).click();
  await source.locator('.research-pdf-mark.region').first().click();
  await capture.getByRole('button',{name:'加入主题研究',exact:true}).click();
  await capture.getByLabel('推理成本研究',{exact:true}).check();
  await capture.getByRole('button',{name:'加入 1 个主题',exact:true}).click();
  await workspace.locator('.research-note img:not([hidden])').waitFor();
  await capture.getByRole('button',{name:'关闭批注工具'}).click();
  await source.getByRole('button',{name:'下一页',exact:true}).click();
  await source.locator('[data-pdf-page="2"] .textLayer span').filter({hasText:'Second page'}).waitFor();
  await selectText(source.locator('[data-pdf-page="2"] .textLayer'),'Second page of the research material.',true);
  await capture.getByRole('button',{name:'评论',exact:true}).click();
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).fill('第二页的评论');
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await sourceComments.getByRole('button',{name:'定位评论 2',exact:true}).click();
  await source.getByRole('button',{name:'上一条评论',exact:true}).click();
  await source.locator('[data-pdf-page="1"] .research-pdf-mark.region.research-target').waitFor();
  await source.getByRole('button',{name:'下一条评论',exact:true}).click();
  await source.locator('[data-pdf-page="2"] .research-pdf-mark.text.research-target').waitFor();
  await sourceComments.getByRole('button',{name:'收起评论列表'}).click();
  const notes = researchNotes(fs.readFileSync(topic.path,'utf8')); assert.equal(notes.length,3);
  console.log('Research UI: PDF text and chart capture passed');
  const regionNote = notes.find(item=>item.imagePath); assert.ok(regionNote); assert.ok(fs.statSync(path.join(path.dirname(topic.path),regionNote.imagePath)).size>100);
  const oldTopicPath=topic.path;
  await workspace.getByRole('combobox',{name:'当前主题所属行业'}).selectOption('模型层');
  await page.waitForFunction(async topicId=>(await window.workbench.research({action:'read',topicId})).topic?.industry==='模型层',topic.id);
  topic.path=(await store.handle({action:'read',topicId:topic.id})).topic.path;
  assert.equal(fs.existsSync(oldTopicPath),false); assert.ok(topic.path.startsWith(path.join(directory,'07.模型层','主题研究')+path.sep));
  assert.ok(fs.statSync(path.join(path.dirname(topic.path),regionNote.imagePath)).size>100);
  // Card removal updates reverse links, but does not delete material annotations.
  await workspace.locator(`.research-note[data-annotation-id="${secondAnnotation}"]`).getByRole('button',{name:'移除',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__flushResearch()),true);
  assert.equal(researchNotes(fs.readFileSync(topic.path,'utf8')).length,2);
  assert.ok((await store.handle({action:'source',path:original})).annotations.some(item=>item.id===secondAnnotation));
  fs.mkdirSync(path.join(root,'output'),{recursive:true});
  if (!useElectron) {
    const card = workspace.locator(`.research-note[data-annotation-id="${firstAnnotation}"]`);
    await card.getByRole('button',{name:/中文 材料/}).click();
    await page.locator('#source-fixture').evaluate(element=>element.style.display='none');
    await workspace.evaluate(element=>element.style.width='100%');
    await page.screenshot({path:path.join(root,'output','research-workspace-preview.png'),fullPage:true});
    await page.locator('#source-fixture').evaluate(element=>element.style.display='');
    await workspace.evaluate(element=>element.style.width='57%');
    await workspace.getByRole('button',{name:'关闭来源',exact:true}).click();
  }
  // Reopen the actual editor and SQLite, then exercise an external-write conflict.
  store.close(); store = new ResearchStore({rootPath:directory});
  await page.reload({waitUntil:'networkidle'}); await workspace.locator('.research-note').first().waitFor();
  assert.equal(await workspace.locator('.research-note').count(),2);
  await source.getByRole('button',{name:'评论 3',exact:true}).waitFor();
  await source.getByRole('button',{name:'下一条评论',exact:true}).click();
  await sourceComments.getByText('需要验证付费留存。',{exact:true}).waitFor();
  await sourceComments.getByText('续费率的已修改评论；另一个窗口的意见',{exact:true}).waitFor();
  await workspace.locator('.research-document').getByRole('button',{name:'评论 1',exact:true}).click();
  await notebookComments.getByRole('button',{name:'定位评论 1',exact:true}).click();
  await workspace.locator('.research-note blockquote .research-target').waitFor();
  await source.getByRole('button',{name:'新增评论',exact:true}).click();
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).fill('未保存但应恢复的评论草稿');
  await page.reload({waitUntil:'networkidle'});
  await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).waitFor();
  assert.equal(await sourceComments.getByRole('textbox',{name:'文档评论草稿'}).inputValue(),'未保存但应恢复的评论草稿');
  await sourceComments.getByRole('button',{name:'保存评论',exact:true}).click();
  await source.getByRole('button',{name:'评论 4',exact:true}).waitFor();
  await page.getByRole('button',{name:'阅读 PDF',exact:true}).click();
  await source.getByRole('button',{name:'评论 2',exact:true}).waitFor();
  await source.getByRole('button',{name:'上一条评论',exact:true}).click();
  await source.locator('[data-pdf-page="2"] .research-pdf-mark.text.research-target').waitFor();
  await sourceComments.getByText('第二页的评论',{exact:true}).waitFor();
  await page.getByRole('button',{name:'阅读 Markdown',exact:true}).click();
  await source.getByRole('button',{name:'评论 4',exact:true}).click();
  if (!useElectron) await page.screenshot({path:path.join(root,'output','document-comments-preview.png'),fullPage:true});
  fs.appendFileSync(topic.path,'\n外部编辑器添加的内容。\n');
  await workspace.locator('.research-note-comment p').first().click(); await page.keyboard.press('End'); await page.keyboard.type('需要保留的冲突草稿。');
  assert.equal(await page.evaluate(()=>window.__flushResearch()),false);
  await workspace.getByRole('alert').filter({hasText:'草稿已保留'}).waitFor();
  assert.match(fs.readFileSync(topic.path,'utf8'),/外部编辑器添加的内容/); assert.doesNotMatch(fs.readFileSync(topic.path,'utf8'),/需要保留的冲突草稿/);
  assert.ok(await page.evaluate(id=>localStorage.getItem(`domi.research-draft.${id}`).includes('需要保留的冲突草稿'),topic.id));
  assert.deepEqual(fs.readFileSync(original),originalBytes);
  const recorded = useElectron ? await electronApp.evaluate(()=>global.requestActions) : requests;
  assert.ok(recorded.includes('resolve')); assert.ok(recorded.includes('add'));
  assert.deepEqual(errors,[]);
  console.log('Research UI: selected/whole-document comments, ordered navigation, edit/delete, comment conflict merge, draft/restart recovery, read-only snapshot comments, rotated PDF cross-page navigation, quote questions, multi-topic snapshots, concurrent insertion and document conflicts passed.');
  }
} catch (error) {
  if (page) console.error('Selection state:',await page.evaluate(()=>({text:window.getSelection()?.toString(),anchor:window.getSelection()?.anchorNode?.parentElement?.outerHTML?.slice(0,650),focus:document.activeElement?.outerHTML?.slice(0,350),dialogs:[...document.querySelectorAll('[role=dialog]')].map(item=>item.getAttribute('aria-label'))})).catch(()=>({})));
  if (page && !useElectron) { fs.mkdirSync(path.join(root,'output'),{recursive:true}); await page.screenshot({path:path.join(root,'output','research-ui-failure.png'),fullPage:true}).catch(()=>{}); }
  console.error('Browser errors:',errors); throw error;
} finally { await browser?.close(); await electronApp?.close(); await server?.close(); store.close(); const relative=path.relative(os.tmpdir(),directory); assert.ok(relative.startsWith('domi-research-ui-')&&!relative.includes(path.sep)); fs.rmSync(directory,{recursive:true,force:true,maxRetries:10,retryDelay:100}); }
