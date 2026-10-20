import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
// Resolve the renderer's extensionless TS imports without changing the app's
// bundler configuration or duplicating its selection/validation logic.
const compiled = ts.transpileModule(fs.readFileSync(new URL('../src/document-mentions.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText.replace(/from ['"]\.\/(document-question|document-scope)['"]/g,
  (_, name) => `from ${JSON.stringify(new URL(`../src/${name}.ts`, import.meta.url).href)}`);
const { addMentionToDraft, documentMentionAt, matchMentionDocuments, mentionDocuments, removeDocumentMention } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('@ follows the caret, supports Chinese/space/fullwidth input and excludes email, URLs, selections and prior lines', () => {
  for (const value of ['@', '请看@算力', '参考 ＠算力 报告.pdf']) {
    const mention = documentMentionAt(value, value.length);
    assert.ok(mention);
    assert.equal(value[mention.start], value.includes('＠') ? '＠' : '@');
  }
  const value = '比较 @算力 与其他因素';
  assert.deepEqual(documentMentionAt(value, 6), { start: 3, end: 6, query: '算力' });
  assert.equal(removeDocumentMention(value, documentMentionAt(value, 6)), '比较  与其他因素');
  for (const value of ['user@example.com', 'https://host/@someone', 'name+tag@example.com', '@算力\n问题', '@' + '字'.repeat(121)]) {
    assert.equal(documentMentionAt(value, value.length), null, value);
  }
  assert.equal(documentMentionAt('@算力', 1, 3), null);
  assert.throws(() => removeDocumentMention('已改问题', { start: 0, end: 3, query: '收入' }), /已变化/);
});

test('document candidates preserve distinct paths, deduplicate Windows case and prioritize matching titles', () => {
  const file = (name, folder, mtimeMs) => ({ kind: 'markdown', name, path: `C:\\库\\${folder}\\${name}`, relativePath: `${folder}/${name}`, size: 12, mtimeMs });
  const nodes = [{ kind: 'folder', children: [file('报告.md', '芯片', 3), file('报告.md', '云', 2), file('芯片.md', '访谈', 1)] }, file('芯片.md', '访谈', 1)];
  const files = mentionDocuments(nodes);
  assert.equal(files.length, 3);
  assert.equal(matchMentionDocuments(files, '报告').length, 2);
  assert.equal(matchMentionDocuments(files, '芯片')[0].name, '芯片.md');
  assert.equal(matchMentionDocuments(files, '芯片 报告')[0].relativePath, '芯片/报告.md');
  assert.equal(matchMentionDocuments(files, '不存在').length, 0);
  assert.equal(matchMentionDocuments(files, '', 1).length, 1);
  assert.equal(mentionDocuments([file('AA.md', '访谈', 1), file('aa.md', '访谈', 1)]).length, 1);
});

test('@ forces selected-document scope from every mode while preserving the question, prior documents and quotes', () => {
  const file = { name: '收入.md', path: 'C:/库/收入.md', size: 12 };
  const other = { name: '风险.md', path: 'C:/库/风险.md', size: 10 };
  for (const sourceScope of ['research', 'library', 'both', 'model', 'selected']) {
    const draft = { input: '请比较 @收入 业务风险', sourceScope, attachments: [other], documentQuotes: [{ text: '已引用' }], selectedWorkflowId: 'research', attachmentError: '旧错误' };
    const next = addMentionToDraft(draft, file, documentMentionAt(draft.input, 7));
    assert.equal(next.input, '请比较  业务风险');
    assert.equal(next.sourceScope, 'selected');
    assert.equal(next.selectedWorkflowId, undefined);
    assert.deepEqual(next.attachments.map(item => item.path), [other.path, file.path]);
    assert.equal(next.documentQuotes, draft.documentQuotes);
    assert.equal(next.attachmentError, '');
    assert.equal(draft.attachments.length, 1, 'submitted snapshots are not mutated');
    const duplicate = addMentionToDraft({ ...next, input: '@收入' }, { ...file, path: 'c:\\库\\收入.md' }, { start: 0, end: 3, query: '收入' });
    assert.equal(duplicate.attachments.length, 2);
  }
});

test('@ rejects unsupported existing files and the 65th document without widening or mutating the draft', () => {
  const draft = { input: '@', attachments: [{ path: '/data.xlsx' }], sourceScope: 'research', attachmentError: '' };
  assert.throws(() => addMentionToDraft(draft, { path: '/note.md' }, { start: 0, end: 1, query: '' }), /Markdown/);
  assert.equal(draft.sourceScope, 'research');
  assert.equal(draft.input, '@');
  const attachments = Array.from({ length: 64 }, (_, i) => ({ path: `/note-${i}.md` }));
  assert.throws(() => addMentionToDraft({ ...draft, attachments }, { path: '/extra.md' }, { start: 0, end: 1, query: '' }), /64/);
  assert.equal(attachments.length, 64);
});
