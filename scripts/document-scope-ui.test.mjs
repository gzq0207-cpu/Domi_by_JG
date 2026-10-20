// Exercise the real renderer and source/citation service with deterministic
// model output. No API calls or writes to the user's repository are made.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { chromium } from "playwright";
import { createServer, preview } from "vite";

const { LibrarySession, verifyCitationOriginal } = createRequire(import.meta.url)("../electron/library-tools.cjs");
const { ResearchStore } = createRequire(import.meta.url)('../electron/research-store.cjs');
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-document-scope-ui-"));
const research = new ResearchStore({ rootPath: directory });
const notebook = await research.handle({ action: 'create', title: '引用提问集成研究', industry: '算力芯片', operationId: crypto.randomUUID() });
assert.equal(notebook.ok, true);
await research.handle({ action: 'save', topicId: notebook.topic.id, expectedVersion: notebook.version,
  content: notebook.content.replace('## 我的分析', '## 我的分析\n\n客户续费存在不确定性。\n\n[其他来源](../../../范围外材料.md)') });
const files = ["收入说明.md", "风险说明.md", "范围外材料.md"].map((name, i) => {
  const filePath = path.join(directory, name);
  fs.writeFileSync(filePath, ["# 收入说明\n企业收入来自订阅服务。\n", "# 风险说明\n客户续费存在不确定性。\n", "# 范围外\n绝密范围外哨兵XYZ。\n"][i]);
  return { name, path: filePath, size: fs.statSync(filePath).size };
});
const wordPath=path.join(directory,'Word 阅读验收.docx');fs.writeFileSync(wordPath,await createRequire(import.meta.url)('./word-fixture.cjs').wordFixture());files.push({name:path.basename(wordPath),path:wordPath,size:fs.statSync(wordPath).size});
const library = { ok: true, rootPath: directory, rootName: "测试资料库", nodes: [{ kind: "folder", name: "公司研究", path: directory,
  relativePath: "公司研究", size: 0, mtimeMs: 1, children: files.map((file) => ({ ...file, kind: /\.docx$/.test(file.path)?'word':"markdown", relativePath: `公司研究/${file.name}`, mtimeMs: 1 })) }],
  documentCount: 4, folderCount: 1, truncated: false, scannedAt: 1 };
const bridge = ts.transpileModule(fs.readFileSync(path.join(root, "src/bridge.ts"), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText.replace(/\bexport /g, "");
const requests = [];
const citations = new Map();
const discarded = [];
const verifications = [];
let server;
let browser;
let page;
const errors = [];
const savedMarkdown = [];
let releaseHeldQuestion;
try {
  if (process.argv.includes('--production')) {
    server = await preview({ root, configFile: false, logLevel: 'error', preview: { host: '127.0.0.1', port: 0 }, build: { outDir: path.join(root, 'dist') } });
  } else {
    server = await createServer({ root, cacheDir: path.join(directory, "vite"), logLevel: "error", server: { host: "127.0.0.1", port: 0, strictPort: false, hmr: false } });
    await server.listen();
  }
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(10_000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.exposeFunction("__runScopedQuestion", async (payload) => {
    requests.push(payload);
    assert.ok(['selected', 'model', 'both'].includes(payload.sourceScope));
    assert.equal(payload.webSearch, false);
    assert.equal(payload.threadId, undefined, "restricted sources do not reuse historical answers");
    if (payload.requestText.includes('排队验收首问')) await new Promise(resolve => { releaseHeldQuestion = resolve; });
    if (payload.sourceScope === 'model') {
      assert.deepEqual(payload.attachmentPaths, [], '模型直答不提交资料文件');
      assert.doesNotMatch(payload.requestText, /来源路径：/);
      return { ok: true, runId: payload.runId, output: '模型直答验收：以下为通用知识解释，未读取或核验资料。', sourceScope: 'model', sourceScopeIsolated: true };
    }
    const session = new LibrarySession({ rootPath: directory, settings: { storageBackend: "local", semanticSearchEnabled: false },
      sourceScope: payload.sourceScope, selectedPaths: payload.attachmentPaths,
      search: async () => { throw new Error("global retrieval is forbidden"); } });
    try {
      const context = await session.initialContext(payload.requestText);
      assert.ok(!context.context.includes("绝密范围外哨兵XYZ"));
      const denied = await session.call("domi_library_read", { path: files[2].path });
      assert.equal(denied.ok, false);
      const doc = await session.call("domi_library_read", { path: payload.attachmentPaths[0] });
      const claim = doc.content.includes('订阅服务收入')?'订阅服务收入同比增长25%':doc.content.includes("企业收入") ? "企业收入来自订阅服务" : "客户续费存在不确定性";
      const binding = await session.call("domi_library_cite", { sourceId: doc.sourceId, quote: `${claim}。`, claim, kind: "fact" });
      assert.equal(binding.ok, true);
      const output = payload.sourceScope === 'both'
        ? `## 基于已有资料\n\n${claim}。${binding.marker}\n\n## 模型补充（未由资料核验）\n\n可从续费率等角度继续分析；这是模型通用知识补充。`
        : `${claim}。${binding.marker}`;
      await session.checkCitations(output);
      citations.set(`${payload.runId}:${binding.citation.id}`, binding.citation);
      return { ok: true, runId: payload.runId, output, libraryUsage: session.snapshot(), sourceScope: payload.sourceScope, sourceScopeIsolated: true };
    } finally { session.close(); }
  });
  await page.exposeFunction("__verifyScopeCitation", async ({ runId, citationId }) => {
    verifications.push({ runId, citationId });
    const citation = citations.get(`${runId}:${citationId}`);
    return { ok: true, citation: await verifyCitationOriginal(citation, { load: async (filePath) => {
      const { DocumentReader } = createRequire(import.meta.url)("../electron/document-reader.cjs");
      return new DocumentReader({ rootPath: directory }).load(filePath);
    } }) };
  });
  await page.exposeFunction("__discardScopeAttachment", (filePath) => { discarded.push(filePath); return { ok: true }; });
  await page.exposeFunction('__researchQuestionRpc', request => research.handle(request));
  const wordService=createRequire(import.meta.url)('../electron/document-annotations.cjs').createDocumentAnnotationService({getStore:()=>research,allowedPaths:new Set(),cacheDir:path.join(directory,'word-cache'),chooseSave:async()=>({canceled:true})});
  await page.exposeFunction('__readScopeWord',request=>wordService.readWord(request));
  await page.exposeFunction("__readScopeMarkdown", ({ resource }) => {
    const filePath = resource.replace(/:\d+$/, "");
    return { ok: true, document: { path: filePath, name: path.basename(filePath), content: fs.readFileSync(filePath, "utf8"), size: fs.statSync(filePath).size, mtimeMs: fs.statSync(filePath).mtimeMs } };
  });
  await page.exposeFunction('__saveScopeMarkdown', request => {
    savedMarkdown.push(request);
    assert.ok(request.path.startsWith(directory+path.sep));
    if (fs.statSync(request.path).mtimeMs !== request.expectedMtimeMs) return {ok:false,conflict:true,error:'文档已变化'};
    fs.writeFileSync(request.path,request.content);
    const stat=fs.statSync(request.path);
    return {ok:true,document:{path:request.path,name:path.basename(request.path),content:request.content,size:stat.size,mtimeMs:stat.mtimeMs}};
  });
  await page.addInitScript({ content: `${bridge}
    window.workbench = { ...browserFallback,
      loadSettings: async () => { const result = await browserFallback.loadSettings(); result.settings.localRepositoryDir = ${JSON.stringify(directory)}; return result; },
      loadState: async () => ({ ok: true, isNew: false, state: { version: 2, activeThreadId: "qa", threads: [{ id: "qa", projectId: "qa", title: "文档范围验收", project: "资料库", updatedAt: "今天", lastActiveAt: 1,
        pinned: false, timeline: [], lastUsage: null, codexThreadId: "history-must-not-resume", messages: [{ id: "old", role: "user", content: "历史回答不作为证据" }] }] } }),
      checkCodex: async () => ({ ...(await browserFallback.checkCodex()), ok: true, models: [{ id: "gpt-6.1-sol", name: "测试模型", supportedReasoningEfforts: [{ id: "high", name: "高" }], serviceTiers: [] }], error: undefined }),
      listDocumentLibrary: async () => (${JSON.stringify(library)}),
      onCodexEvent: (callback) => { window.__scopeCodexEvent = callback; return () => {}; },
      runCodex: async (payload) => { const result = await window.__runScopedQuestion(payload); window.__scopeCodexEvent({ ...result, type: "completed" }); return result; },
      verifyLibraryCitation: (request) => window.__verifyScopeCitation(request),
      discardStagedAttachment: (filePath) => window.__discardScopeAttachment(filePath),
      research: (request) => window.__researchQuestionRpc(request),
      readWord: (request) => window.__readScopeWord(request),
      saveMarkdown: (request) => window.__saveScopeMarkdown(request),
      readMarkdown: (request) => { window.__scopeOpened = request.resource; return window.__readScopeMarkdown(request); }
    };` });
  await page.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(origin, { waitUntil: "networkidle" });
  const input = page.getByRole("textbox", { name: "输入投资任务" });
  await page.getByRole("button", { name: "选择文档", exact: true }).click();
  let picker = page.getByRole("dialog", { name: "选择提问文档" });
  await picker.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '模型直答', exact: true }).click();
  await input.fill('联系 analyst@example.com');
  assert.equal(await page.getByRole('listbox', { name: '资料库文档候选' }).count(), 0, 'emails do not open mentions');
  await input.fill('@没有这份文档');
  await page.getByText('没有匹配的文档，请修改 @ 后的名称或文件夹。', { exact: true }).waitFor();
  await input.press('Enter');
  await page.locator('.send-button[type=submit]').click();
  assert.equal(requests.length, 0, 'a pending mention cannot send an unrestricted/model question');
  await input.press('Escape');
  assert.equal(await page.getByRole('listbox', { name: '资料库文档候选' }).count(), 0);
  await input.fill('请分析 @说明');
  let mentions = page.getByRole('listbox', { name: '资料库文档候选' });
  await mentions.getByRole('option').first().waitFor();
  assert.equal(await mentions.getByRole('option').count(), 2);
  assert.match(await mentions.innerText(), /公司研究\/收入说明.md/);
  // Confirming Chinese input must neither select a document nor submit.
  await input.dispatchEvent('compositionstart');
  await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true });
  assert.equal(requests.length, 0);
  assert.equal(await page.locator('.attachment-chip').count(), 0);
  await input.dispatchEvent('compositionend');
  await mentions.waitFor();
  await input.press('ArrowDown');
  assert.equal(await input.getAttribute('aria-activedescendant'), 'composer-document-mention-1');
  await input.press('ArrowUp');
  assert.equal(await input.getAttribute('aria-activedescendant'), 'composer-document-mention-0');
  await mentions.getByRole('option', { name: /收入说明.md/ }).click();
  assert.equal(await page.getByLabel('资料来源范围').inputValue(), 'selected', '@ overrides model mode');
  assert.equal(await input.inputValue(), '请分析 ');
  assert.equal(await page.locator('.attachment-chip').count(), 1);
  assert.equal(requests.length, 0, 'clicking a candidate adds a document without sending');
  await input.fill('@收入');
  await mentions.getByRole('option', { name: /收入说明.md/ }).waitFor();
  if (process.env.DOMI_MENTION_SCREENSHOT) await page.screenshot({ path: process.env.DOMI_MENTION_SCREENSHOT });
  await input.press('Enter');
  assert.equal(await page.locator('.attachment-chip').count(), 1, 'repeated mentions do not duplicate the file');
  await page.getByRole('button', { name: 'Both · 两者结合', exact: true }).click();
  await input.fill('收入来自哪里？ ＠风险');
  await mentions.getByRole('option', { name: /风险说明.md/ }).waitFor();
  await input.press('Tab');
  assert.equal(await page.getByLabel('资料来源范围').inputValue(), 'selected', '@ overrides Both mode');
  assert.equal(await page.locator('.attachment-chip').count(), 2);
  assert.equal(await input.inputValue(), '收入来自哪里？ ');
  assert.equal(requests.length, 0, 'Tab selects rather than sending');
  // A query in the middle of the question preserves the suffix and caret.
  await input.fill('比较 @收入 和风险');
  await input.press('Home');
  for (let index = 0; index < 6; index++) await input.press('ArrowRight');
  await mentions.getByRole('option', { name: /收入说明.md/ }).click();
  assert.equal(await input.inputValue(), '比较  和风险');
  // The full batch picker can take over an unfinished @ without leaving a
  // stale token or retaining model mode. Cancel must preserve the draft.
  await page.getByRole('button', { name: '模型直答', exact: true }).click();
  await input.fill('继续比较 @收入');
  await mentions.waitFor();
  await page.locator('.composer-scope-picker').click();
  picker = page.getByRole('dialog', { name: '选择提问文档' });
  await picker.getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(await input.inputValue(), '继续比较 @收入');
  assert.equal(await page.getByRole('button', { name: '模型直答', exact: true }).getAttribute('aria-pressed'), 'true');
  await input.fill('收入来自哪里？ @风险');
  await mentions.waitFor();
  await page.locator('.composer-scope-picker').click();
  picker = page.getByRole('dialog', { name: '选择提问文档' });
  await picker.getByRole('button', { name: '仅用这 2 份文档', exact: true }).click();
  assert.equal(await input.inputValue(), '收入来自哪里？ ');
  assert.equal(await page.getByLabel('资料来源范围').inputValue(), 'selected');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('domi.composerDrafts.v1') || '{}').qa?.attachments.length === 2);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.attachment-chip').count(), 2, '@ scope survives reload');
  assert.equal(await page.getByLabel('资料来源范围').inputValue(), 'selected');
  await page.locator('.composer-scope-picker').click();
  picker = page.getByRole("dialog", { name: "选择提问文档" });
  await picker.getByRole("button", { name: "展开 公司研究" }).click();
  await picker.getByRole("checkbox", { name: "选中 收入说明.md", exact: true }).check();
  await picker.getByRole("checkbox", { name: "选中 风险说明.md", exact: true }).check();
  await picker.getByRole("button", { name: "仅用这 2 份文档" }).click();
  assert.equal(await page.getByLabel("资料来源范围").inputValue(), "selected");
  await input.fill("收入来自哪里？");
  await page.locator(".send-button[type=submit]").click();
  await page.getByRole("button", { name: /查看引用 1/ }).first().waitFor();
  assert.deepEqual(requests[0].attachmentPaths, [files[0].path, files[1].path]);
  assert.equal(await input.inputValue(), "");
  assert.equal(await page.locator(".attachment-chip").count(), 2, "scope persists after send");
  await page.waitForFunction(() => !document.querySelector(".agent-working") && !document.querySelector(".composer-preflight-status"));
  await page.getByRole("button", { name: /查看引用 1/ }).first().click();
  await page.locator(".message-evidence-inspector").waitFor();
  await page.getByRole("button", { name: "定位核验原文" }).click();
  await page.waitForFunction(() => !!window.__scopeOpened);
  assert.match(await page.evaluate(() => window.__scopeOpened), /收入说明.md:2$/);
  assert.match(await page.locator(".message-evidence-inspector blockquote").innerText(), /企业收入来自订阅服务/);
  await page.getByRole("button", { name: "关闭引用回查" }).click();
  await input.fill("再看收入的依据。");
  await page.locator(".send-button[type=submit]").click();
  await page.waitForFunction(() => document.querySelectorAll(".message-evidence-citation").length === 2);
  assert.deepEqual(requests[1].attachmentPaths, requests[0].attachmentPaths, "follow-up uses the same document scope");
  await page.getByRole("button", { name: "调整范围" }).click();
  picker = page.getByRole("dialog", { name: "选择提问文档" });
  await picker.getByRole("textbox", { name: "搜索提问文档" }).fill("收入");
  assert.equal(await picker.getByRole("checkbox", { name: "选中 范围外材料.md" }).count(), 0);
  await picker.getByRole("checkbox", { name: "选中 收入说明.md", exact: true }).uncheck();
  await picker.getByRole("button", { name: "取消", exact: true }).click();
  assert.equal(await page.locator(".attachment-chip").count(), 2, "cancel does not edit the current scope");
  await page.getByRole("button", { name: "移除 收入说明.md", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".attachment-chip").length === 1);
  assert.ok(!discarded.includes(files[0].path), "removing a next-turn source does not delete an earlier citation");
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("domi.composerDrafts.v1") || "{}").qa?.attachments.length === 1);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByLabel("资料来源范围").inputValue(), "selected");
  assert.match(await page.locator(".attachment-list").innerText(), /风险说明.md/);
  assert.equal(await page.locator(".attachment-chip").count(), 1, "scope survives reload");
  await input.fill("主要风险是什么？");
  await page.locator(".send-button[type=submit]").click();
  await page.getByRole("button", { name: /查看引用 1/ }).first().waitFor();
  assert.deepEqual(requests[2].attachmentPaths, [files[1].path], "a changed scope applies only to later questions");
  await page.waitForFunction(() => !document.querySelector('.agent-working') && !document.querySelector('.composer-preflight-status'));
  await page.getByRole('button', { name: /查看引用 1/ }).first().click();
  await page.getByRole('button', { name: '定位核验原文' }).click();
  await page.getByRole('button', { name: '关闭引用回查' }).click();
  const reader = page.locator('.right-panel .ProseMirror');
  await reader.waitFor();
  async function quoteSelection(text) {
    await reader.evaluate((element, text) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); let node;
      while ((node = walker.nextNode())) {
        const start = node.textContent.indexOf(text); if (start < 0) continue;
        element.focus(); const range = document.createRange(); range.setStart(node, start); range.setEnd(node, start + text.length);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); document.dispatchEvent(new Event('selectionchange')); return;
      }
      throw new Error('选区文字不存在');
    }, text);
    await page.getByRole('dialog', { name: '阅读批注与主题研究' }).getByRole('button', { name: '引用提问', exact: true }).click();
  }
  await input.fill('这段风险为什么重要？');
  await quoteSelection('客户续费存在不确定性。');
  await page.locator('.composer-document-quote').waitFor();
  assert.equal(await input.inputValue(), '这段风险为什么重要？', '引用不覆盖问题草稿');
  assert.equal(requests.length, 3, '引用不会自动发送');
  assert.match(await page.getByLabel('提问引用').innerText(), /风险说明.md.*风险说明/s);
  if (process.env.DOMI_QUESTION_SCREENSHOT) await page.screenshot({ path: process.env.DOMI_QUESTION_SCREENSHOT });
  await quoteSelection('客户续费存在不确定性。');
  assert.equal(await page.locator('.composer-document-quote').count(), 1, '重复引用去重');
  await quoteSelection('客户续费');
  await page.waitForFunction(() => document.querySelectorAll('.composer-document-quote').length === 2);
  await page.getByRole('button', { name: '移除引用 2', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('domi.composerDrafts.v1')).qa?.documentQuotes?.length === 1);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.composer-document-quote').waitFor();
  assert.equal(await input.inputValue(), '这段风险为什么重要？');
  await page.locator('.send-button[type=submit]').click();
  await page.waitForFunction(() => document.querySelectorAll('.message-evidence-citation').length === 1);
  assert.equal(requests.length, 4);
  assert.match(requests[3].requestText, /这段风险为什么重要/);
  assert.match(requests[3].requestText, /> 客户续费存在不确定性。/);
  assert.deepEqual(requests[3].attachmentPaths, [files[1].path]);
  assert.equal(await page.locator('.composer-document-quote').count(), 0, '发送后清空本轮引用');
  assert.equal(await page.locator('.attachment-chip').count(), 1, '发送后保留文档范围');
  assert.equal(await input.inputValue(), '');
  // The actual research workspace saves its editor before navigating to chat.
  await page.getByRole('button', { name: '主题研究', exact: true }).click();
  const researchWorkspace = page.locator('.research-workspace');
  await researchWorkspace.getByRole('button', { name: /引用提问集成研究/ }).click();
  await researchWorkspace.locator('.ProseMirror').waitFor();
  await researchWorkspace.locator('.ProseMirror').evaluate(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); let node;
    while ((node = walker.nextNode())) {
      const text = '客户续费存在不确定性。', start = node.textContent.indexOf(text); if (start < 0) continue;
      element.focus(); const range = document.createRange(); range.setStart(node, start); range.setEnd(node, start + text.length);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); document.dispatchEvent(new Event('selectionchange')); return;
    }
    throw new Error('研究分析不存在');
  });
  await page.getByRole('dialog', { name: '研究笔记引用提问' }).getByRole('button', { name: '引用提问', exact: true }).click();
  await page.locator('.composer-document-quote').waitFor();
  assert.match(await page.getByLabel('提问引用').innerText(), /引用提问集成研究/);
  assert.equal(await researchWorkspace.isVisible(), false, '引用后进入当前对话，研究编辑器继续保留');
  await page.getByRole('button', { name: '移除 风险说明.md', exact: true }).click();
  await input.fill('请解释这条研究判断。');
  await page.locator('.send-button[type=submit]').click();
  await page.waitForFunction(() => document.querySelectorAll('.message-evidence-citation').length === 2);
  assert.equal(requests.length, 5);
  assert.deepEqual(requests[4].attachmentPaths, [notebook.topic.path], '笔记中的来源链接不会扩大引用提问范围');
  assert.match(requests[4].requestText, /客户续费存在不确定性。/);
  assert.equal(await page.locator('.composer-document-quote').count(), 0);
  await page.waitForFunction(() => !document.querySelector('.agent-working') && !document.querySelector('.composer-preflight-status'));
  const answerModes = page.getByRole('group', { name: '回答方式', exact: true });
  await quoteSelection('客户续费存在不确定性。');
  await page.locator('.composer-document-quote').waitFor();
  await input.fill('从一般知识解释这个判断。');
  await answerModes.getByRole('button', { name: '模型直答', exact: true }).click();
  assert.equal(await input.inputValue(), '从一般知识解释这个判断。');
  assert.equal(await page.locator('.composer-document-quote').count(), 1);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('domi.composerDrafts.v1')).qa?.sourceScope === 'model');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await answerModes.getByRole('button', { name: '模型直答', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.composer-document-quote').count(), 1);
  await page.locator('.send-button[type=submit]').click();
  await page.getByText('模型直答验收：以下为通用知识解释，未读取或核验资料。', { exact: true }).waitFor();
  assert.equal(requests[5].sourceScope, 'model');
  assert.match(requests[5].requestText, /客户续费存在不确定性/);
  assert.equal(await page.locator('.message-evidence-citation').count(), 0);
  assert.equal(await page.locator('.attachment-chip').count(), 1, '模型直答后文档仍保留供切换');
  assert.equal(await page.locator('.composer-document-quote').count(), 0);
  await answerModes.getByRole('button', { name: 'Both · 两者结合', exact: true }).click();
  await input.fill('请同时给出资料依据和一般知识解释。');
  await page.locator('.send-button[type=submit]').click();
  await page.getByRole('heading', { name: '模型补充（未由资料核验）', exact: true }).waitFor();
  await page.getByRole('heading', { name: '基于已有资料', exact: true }).waitFor();
  assert.equal(requests[6].sourceScope, 'both');
  assert.deepEqual(requests[6].attachmentPaths, [notebook.topic.path]);
  assert.equal(await page.locator('.message-evidence-citation').count(), 1);
  assert.equal(await answerModes.getByRole('button', { name: 'Both · 两者结合', exact: true }).getAttribute('aria-pressed'), 'true');
  if (process.env.DOMI_MODE_SCREENSHOT) await page.screenshot({ path: process.env.DOMI_MODE_SCREENSHOT });
  await page.waitForFunction(() => !document.querySelector('.agent-working') && !document.querySelector('.composer-preflight-status'));
  await input.fill('排队验收首问：请依据资料并补充分析。');
  await page.locator('.send-button[type=submit]').click();
  await page.waitForFunction(() => document.querySelector('.agent-working'));
  await answerModes.getByRole('button', { name: '模型直答', exact: true }).click();
  await input.fill('排队验收追问：只用模型知识解释。');
  await page.locator('.send-button[type=submit]').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('domi.queuedSubmissions.v1') || '{}').qa?.[0]?.sourceScope === 'model');
  await answerModes.getByRole('button', { name: '已有资料', exact: true }).click();
  assert.equal(typeof releaseHeldQuestion, 'function'); releaseHeldQuestion();
  await page.getByText('模型直答验收：以下为通用知识解释，未读取或核验资料。', { exact: true }).nth(1).waitFor({ timeout: 20_000 });
  await page.waitForFunction(() => document.querySelectorAll('.message-source-mode').length >= 4 && !document.querySelector('.agent-working') && !document.querySelector('.composer-preflight-status'), null, { timeout: 20_000 });
  assert.equal(requests[7].sourceScope, 'both'); assert.equal(requests[8].sourceScope, 'model', '排队消息保留发送时的方式');
  assert.deepEqual(requests[8].attachmentPaths, []);
  // The actual App must publish an editor's latest keystrokes before anchoring a comment.
  await page.locator('.message-evidence-citation').last().click();
  await page.getByRole('button',{name:'定位核验原文',exact:true}).click();
  await page.getByRole('button',{name:'关闭引用回查',exact:true}).click();
  const material = page.locator('.right-panel .material-reader');
  await material.getByRole('button',{name:'编辑',exact:true}).click();
  await reader.locator('p').first().click(); await page.keyboard.press('End'); await page.keyboard.type(' 及时批注的新句子。');
  await reader.evaluate(element=>{
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT); let node;
    while((node=walker.nextNode())) {const at=node.textContent.indexOf('及时批注的新句子。');if(at<0)continue;const range=document.createRange();range.setStart(node,at);range.setEnd(node,at+'及时批注的新句子。'.length);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));return;}
    throw new Error('新编辑的选段不存在');
  });
  await page.getByRole('dialog',{name:'阅读批注与主题研究'}).getByRole('button',{name:'评论',exact:true}).click();
  const commentsPanel = material.getByRole('complementary',{name:'文档评论'});
  await commentsPanel.getByRole('textbox',{name:'文档评论草稿'}).fill('正文输入后立即评论');
  await commentsPanel.getByRole('button',{name:'保存评论',exact:true}).click();
  await material.getByRole('button',{name:'评论 1',exact:true}).waitFor();
  const commented=(await research.handle({action:'source',path:notebook.topic.path})).annotations;
  assert.equal(commented[0].quote,'及时批注的新句子。');
  assert.equal(commented[0].sourceVersion,(await research.handle({action:'source',path:notebook.topic.path})).source.version);
  assert.ok(savedMarkdown.some(item=>item.path===notebook.topic.path && item.content.includes('及时批注的新句子')),'评论前必须保存最新编辑内容');
  assert.match(fs.readFileSync(notebook.topic.path,'utf8'),/及时批注的新句子/);
  await commentsPanel.getByRole('button',{name:'定位评论 1',exact:true}).click();
  await material.locator('.reading-mark.research-target').waitFor();
  assert.match(await material.locator('.reading-mark.research-target').innerText(),/及时批注的新句子/);
  await page.getByRole('button',{name:'调整范围',exact:true}).click();
  picker=page.getByRole('dialog',{name:'选择提问文档'});await picker.getByRole('button',{name:'清空选择',exact:true}).click();await picker.getByRole('button',{name:'展开 公司研究',exact:true}).click();
  await picker.getByRole('checkbox',{name:'选中 Word 阅读验收.docx',exact:true}).check();await picker.getByRole('button',{name:'仅用这 1 份文档',exact:true}).click();
  await input.fill('依据 Word 原文解释收入。');await page.locator('.send-button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('.agent-working')&&!document.querySelector('.composer-preflight-status'));
  assert.deepEqual(requests[9].attachmentPaths,[wordPath]);
  await page.locator('.message-evidence-citation').last().click();await page.getByRole('button',{name:'定位核验原文',exact:true}).click();await page.getByRole('button',{name:'关闭引用回查',exact:true}).click();
  const wordReader=page.locator('.right-panel .word-reader-content');await wordReader.locator('table').waitFor();await wordReader.getByText('收入与留存研究',{exact:true}).waitFor();
  await wordReader.evaluate(root=>{const paragraph=root.querySelector('[data-word-paragraph="p-00000002"]'),walker=document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT),nodes=[];let node;while((node=walker.nextNode()))nodes.push(node);root.focus();const range=document.createRange();range.setStart(nodes[0],0);range.setEnd(nodes[nodes.length-1],nodes[nodes.length-1].length);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);const box=range.getBoundingClientRect();root.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:box.left+2,clientY:box.bottom}));});
  await page.getByRole('dialog',{name:'阅读批注与主题研究'}).getByRole('button',{name:'引用提问',exact:true}).click();await page.locator('.composer-document-quote').waitFor();assert.match(await page.getByLabel('提问引用').innerText(),/订阅服务收入同比增长25%/);assert.equal(requests.length,10,'Word 引用不自动发送');
  await page.getByRole("button", { name: "调整范围" }).click();
  await page.getByRole("dialog", { name: "选择提问文档" }).waitFor();
  await page.getByRole("button", { name: "展开 公司研究" }).click();
  const screenshot = process.env.DOMI_SCOPE_SCREENSHOT || path.join(directory, "scope-preview.png");
  await page.screenshot({ path: screenshot });
  assert.deepEqual(errors, []);
  process.stdout.write(JSON.stringify({ ok: true, checks: ["@ filename and folder search", "@ keyboard and mouse selection without sending", "@ excludes emails", "@ respects Chinese composition", "@ no-match send guard", "@ forces selected scope from model and Both", "@ deduplication and fullwidth input", "@ caret and suffix preservation", "@ full picker handoff and cancellation", "@ scope survives reload", "multi-selection", "exact paths forwarded", "no history resume", "global retrieval denied", "out-of-scope reads denied", "verified citation click and original line", "follow-up scope", "cancel selection", "source retention", "scope persistence after reload", "changed scope on later turn", "quote selection and repeat deduplication", "quote preserves question draft", "quote does not auto-send", "quote remove and reload recovery", "quoted request carries original text", "sent quote clears and source persists", "model mode sends quote without files", "both sections and verified source", "mode survives reload", "queued mode snapshot survives later switches", "no page errors"], screenshot: process.env.DOMI_MENTION_SCREENSHOT || process.env.DOMI_MODE_SCREENSHOT || process.env.DOMI_QUESTION_SCREENSHOT || process.env.DOMI_SCOPE_SCREENSHOT || undefined }) + "\n");
} catch (error) {
  process.stderr.write(JSON.stringify({ errors, verifications, savedMarkdown:savedMarkdown.map(item=>({path:item.path,newText:item.content.includes('及时批注的新句子')})), annotations:(await research.handle({action:'source',path:notebook.topic.path})).annotations, editorHtml:page ? await page.locator('.right-panel .ProseMirror').evaluateAll(items=>items.map(item=>item.outerHTML)) : [], body: page ? (await page.locator("body").innerText()).slice(-2800) : "" }) + "\n");
  throw error;
} finally {
  if (browser) await browser.close();
  if (server) {
    if (process.argv.includes('--production')) await new Promise(resolve => server.httpServer.close(resolve));
    else await server.close();
  }
  research.close();
  assert.ok(directory.startsWith(path.join(os.tmpdir(), "domi-document-scope-ui-")));
  fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
