import test from 'node:test';
import assert from 'node:assert/strict';
import { addQuoteToDraft, composeDocumentQuestion, normalizeDocumentQuotes, quoteFromSelection, quoteLocation } from '../src/document-question.ts';
import { remainingScopeDraft } from '../src/document-scope.ts';
const quote = (text = '企业收入来自订阅服务。', path = 'C:\\资料库\\收入.md') => ({ id: crypto.randomUUID(), path, name: '收入.md', text, heading: '收入结构' });

test('引用保留问题草稿和已选材料，默认进入精确文档范围，重复选区不增加记录', () => {
  const draft = { input: '原先写了一半的问题', attachments: [{ name: '风险.md', path: 'C:\\资料库\\风险.md', size: 1 }], selectedWorkflowId: 'analysis', sourceScope: 'research' };
  const selected = quote(), next = addQuoteToDraft(draft, selected);
  assert.equal(next.input, draft.input);
  assert.equal(next.sourceScope, 'selected');
  assert.equal(next.selectedWorkflowId, undefined);
  assert.deepEqual(next.attachments.map(file => file.path), [draft.attachments[0].path, selected.path]);
  const duplicate = addQuoteToDraft(next, { ...selected, id: crypto.randomUUID(), path: 'c:/资料库/收入.md' });
  assert.equal(duplicate.documentQuotes.length, 1); assert.equal(duplicate.attachments.length, 2);
  assert.equal(draft.attachments.length, 1, '原草稿和发送快照不被引用操作修改');
});

test('多份文档的逐字引用和页码进入请求，引用不扩大来源链接授权，旧请求保持独立快照', () => {
  const first = quote(), second = { ...quote('原文第一行\n原文第二行', 'C:\\资料库\\报告.pdf'), pages: [3, 4] };
  const next = addQuoteToDraft({ attachments: [], input: '两段材料如何联系？' }, first);
  const request = composeDocumentQuestion(next.input, next.documentQuotes);
  const combined = addQuoteToDraft(next, second), output = composeDocumentQuestion(combined.input, combined.documentQuotes);
  assert.match(output, /两段材料如何联系/); assert.match(output, /第 3、4 页/);
  assert.match(output, /> 原文第一行\n> 原文第二行/); assert.match(output, /链接不增加材料范围/);
  assert.equal(quoteLocation(second), '第 3、4 页');
  assert.doesNotMatch(request, /原文第二行/); assert.equal(next.documentQuotes.length, 1);
  assert.equal(composeDocumentQuestion('普通问题'), '普通问题');
});

test('恢复引用草稿过滤无效数据；引用过长或过多时保留原草稿并拒绝追加', () => {
  assert.equal(normalizeDocumentQuotes([null, {}, { ...quote(), text: '' }, { ...quote(), path: '/bad.png' }, quote()]).length, 1);
  assert.throws(() => quoteFromSelection({ path: '/x.md', name: 'x' }, { quote: 'a'.repeat(12_001), anchor: { quote: '' } }), /12,000/);
  const draft = { attachments: [], documentQuotes: Array.from({ length: 12 }, (_, index) => quote(String(index))) };
  assert.throws(() => addQuoteToDraft(draft, quote('新的引用')), /12/);
  assert.equal(draft.documentQuotes.length, 12);
});

test('发送后清空本轮引用和问题，保留选定文档供连续追问', () => {
  const draft = { input: '为什么？', attachments: [{ path: '/材料.md', name: '材料', size: 1 }], sourceScope: 'selected', documentQuotes: [quote()], attachmentError: '' };
  const sent = remainingScopeDraft(draft);
  assert.equal(sent.input, ''); assert.deepEqual(sent.documentQuotes, []); assert.equal(sent.attachments, draft.attachments);
  assert.equal(draft.documentQuotes.length, 1, '已发送问题中的引用快照不变');
});

test('引用和发送保留用户选择的模型直答或 Both；模型直答不注入文件路径与读取指令', () => {
  for (const sourceScope of ['model', 'both']) {
    const draft = addQuoteToDraft({ input: '解释一下', attachments: [], sourceScope }, quote());
    assert.equal(draft.sourceScope, sourceScope);
    const prompt = composeDocumentQuestion(draft.input, draft.documentQuotes, sourceScope);
    assert.match(prompt, /企业收入来自订阅服务/);
    if (sourceScope === 'model') { assert.doesNotMatch(prompt, /来源路径/); assert.match(prompt, /本轮不读取来源文件/); }
    const after = remainingScopeDraft({ ...draft, attachmentError: '' });
    assert.equal(after.sourceScope, sourceScope); assert.equal(after.attachments.length, 1); assert.equal(after.documentQuotes.length, 0);
  }
});
