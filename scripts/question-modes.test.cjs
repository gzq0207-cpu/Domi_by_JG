const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const modes = require('../electron/question-modes.cjs');
const { LibrarySession, restrictedLibraryConfig, libraryInstructions, startLibraryThread, libraryToolSpecs } = require('../electron/library-tools.cjs');
const contexts = require('../electron/codex-run-context.cjs');
const main = fs.readFileSync(path.join(__dirname, '../electron/main.cjs'), 'utf8');
function hostFunction(name, next, bindings) {
  const source = main.slice(main.indexOf(`async function ${name}(`), main.indexOf(`\n${next}`, main.indexOf(`async function ${name}(`)));
  return vm.runInNewContext(`(${source})`, bindings);
}

test('模型直答移除文件、历史会话和外部实体授权，拒绝建立资料读取器', async () => {
  const original = { sourceScope: 'model', webSearch: true, threadId: 'old', attachmentPaths: ['C:/secret.md'], activeDocumentPath: 'C:/secret.md', externalType: 'project', externalRecordId: 'private', libraryTools: true };
  const clean = modes.normalizeQuestionPayload(original);
  assert.equal(clean.webSearch, false); assert.equal(clean.threadId, undefined); assert.deepEqual(clean.attachmentPaths, []);
  assert.equal(clean.activeDocumentPath, undefined); assert.equal(clean.externalRecordId, undefined); assert.equal(clean.libraryTools, false);
  assert.deepEqual(original.attachmentPaths, ['C:/secret.md'], '已排队的问题快照不被改写');
  const fail = () => { throw new Error('模型直答不应触碰资料配置或文件'); };
  const prepare = hostFunction('prepareLibraryAccess', 'async function handleLibraryToolCall', { ...modes, fs: new Proxy({}, { get: fail }) });
  assert.equal(await prepare(new Proxy({}, { get: fail }), {}, 'run', clean), null, '使用真实主进程函数，在配置或文件读取前跳过资料链路');
  assert.throws(() => new LibrarySession({ rootPath: '/unused', sourceScope: 'model' }), /不建立资料/);
});

test('主进程为模型直答禁用资料工具，为 Both 注册精确资料工具，二者均禁用历史及外部工具', async () => {
  const starts = [];
  const start = async (_client, params, options) => { starts.push({ params, options }); return { response: { thread: { id: 'fresh' }, instructionSources: [] }, toolsRegistered: Boolean(params.dynamicTools) }; };
  const resolve = hostFunction('resolveThread', 'async function saveRuntimeSettings', {
    ...modes, ...contexts, restrictedLibraryConfig, libraryToolSpecs, startLibraryThread: start,
    liveCodexThreads: new Map(), libraryToolThreads: new Set(), codexThreadRuntimeKey: () => 'key'
  });
  const client = { capabilities: () => ({ experimentalApi: true }), request: async () => { throw new Error('不应恢复历史会话'); } };
  for (const scope of ['model', 'both']) await resolve(client, { sourceScope: scope, libraryTools: true, threadId: 'old', effectiveCodexConfig: { mcp_servers: { private: {} } } }, '/tmp', 'read-only');
  assert.equal(starts[0].params.dynamicTools, undefined); assert.equal(starts[0].options.requireDynamicTools, false);
  assert.deepEqual(starts[1].params.dynamicTools, libraryToolSpecs); assert.equal(starts[1].options.requireDynamicTools, true);
  for (const { params } of starts) {
    assert.equal(params.ephemeral, true); assert.equal(params.config.web_search, 'disabled');
    assert.equal(params.config['features.shell_tool'], false); assert.equal(params.config['features.memories'], false);
    assert.equal(params.config['mcp_servers."private".enabled'], false);
  }
});

test('Both 只检索选中文档，模型补充不能获得原文核验标记', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-both-'));
  const file = path.join(root, '报告.md'), outside = path.join(root, '范围外.md');
  fs.writeFileSync(file, '# 收入\n企业收入来自订阅服务。\n'); fs.writeFileSync(outside, '# 范围外\n秘密哨兵。');
  const session = new LibrarySession({ rootPath: root, settings: { storageBackend: 'local' }, sourceScope: 'both', selectedPaths: [file], search: async () => { throw new Error('不得搜索全库'); } });
  t.after(() => { session.close(); fs.rmSync(root, { recursive: true, force: true }); });
  const context = await session.initialContext('收入'); assert.doesNotMatch(context.context, /秘密哨兵/);
  assert.equal((await session.call('domi_library_read', { path: outside })).ok, false);
  const doc = await session.call('domi_library_read', { path: file });
  const claim = '企业收入来自订阅服务';
  const citation = await session.call('domi_library_cite', { sourceId: doc.sourceId, quote: `${claim}。`, claim, kind: 'fact' });
  assert.equal(citation.ok, true);
  const good = `## 基于已有资料\n${claim}。${citation.marker}\n\n## 模型补充（未由资料核验）\n一般可从续费率等角度进一步分析，这是模型补充。`;
  assert.equal((await session.checkCitations(good)).verifiedCount, 1);
  const bad = `## 基于已有资料\n需要核对。\n\n## 模型补充（未由资料核验）\n${claim}。${citation.marker}`;
  assert.equal((await session.checkCitations(bad)).invalidCount, 1);
  assert.equal(session.snapshot().citations[0].status, 'unbound');
});

test('三种方式拥有不同回答指令，Both 要求分列且禁止将模型知识伪装成资料来源', () => {
  assert.match(modes.questionPrompt({ sourceScope: 'model', requestText: '问题' }), /模型通用知识/);
  assert.match(modes.questionPrompt({ sourceScope: 'both', requestText: '问题' }), /## 模型补充（未由资料核验）/);
  assert.match(libraryInstructions({ sourceScope: 'selected', selectedPaths: ['/x.md'] }), /不以常识或模型记忆补全/);
  assert.doesNotMatch(libraryInstructions({ sourceScope: 'both', selectedPaths: ['/x.md'] }), /所有实质性回答都必须由这些文档支持/);
  assert.equal(modes.bothAnswerSections('没有分列'), null);
  assert.throws(() => modes.normalizeQuestionPayload({ sourceScope: 'unknown' }), /无效/);
  for (const scope of ['model', 'both']) {
    assert.equal(contexts.sourceScopeAllowsResume({ sourceScope: scope }), false);
    assert.equal(contexts.threadPersistenceOptions({ sourceScope: scope }).ephemeral, true);
  }
});
