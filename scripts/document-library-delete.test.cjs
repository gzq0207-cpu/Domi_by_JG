const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { deleteDocumentLibraryEntry } = require('../electron/document-library-delete.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-delete-'));
  const from = path.join(root, '来源'), to = path.join(root, '目标');
  fs.mkdirSync(from); fs.mkdirSync(to);
  t.after(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return { root, from, to, write(name, content) { const file = path.join(from, name); fs.writeFileSync(file, content); return file; } };
}

test('Markdown, PDF and Word documents are deleted and report their parent', t => {
  const f = fixture(t);
  for (const [name, kind] of [['笔记.md', 'markdown'], ['报告.markdown', 'markdown'], ['原始.pdf', 'pdf'], ['材料.docx', 'word'], ['旧材料.doc', 'word']]) {
    const file = f.write(name, Buffer.from([0, 255, 2, 5]));
    const result = deleteDocumentLibraryEntry(f.root, { path: file });
    assert.equal(result.ok, true);
    assert.equal(result.kind, kind);
    assert.equal(result.path, file);
    assert.equal(result.parentPath, f.from);
    assert.equal(result.name, name);
    assert.equal(fs.existsSync(file), false);
  }
  assert.equal(fs.existsSync(f.from), true, 'the parent folder must remain');
});

test('folders, symlinks, foreign extensions and internal files are rejected', t => {
  const f = fixture(t);
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: f.from }), /普通文档/);
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: path.dirname(f.root) }), /只能在当前/);
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: path.join(f.to, '不存在.md') }), /文档不存在/);
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: '相对路径.md' }), /有效的文件位置/);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-delete-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, '外部.md'), '# 外部');
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: path.join(outside, '外部.md') }), /只能在当前/);
  const table = f.write('表格.xlsx', 'x');
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: table }), /仅支持删除/);
  assert.equal(fs.existsSync(table), true);
  fs.mkdirSync(path.join(f.root, '.domi'));
  fs.writeFileSync(path.join(f.root, '.domi', '内部.md'), '# 内部');
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: path.join(f.root, '.domi', '内部.md') }), /内部文件/);
  assert.equal(fs.existsSync(path.join(f.root, '.domi', '内部.md')), true);
});

test('the todo entrance and managed workspace homepages survive deletion attempts', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, '0.待办事项.md'), '# 待办事项\n');
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: path.join(f.root, '0.待办事项.md') }), /对应工作区管理/);
  const project = f.write('项目主页.md', 'entity_type: "project"\n# 公司');
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: project }), /对应工作区管理/);
  const person = f.write('人物主页.md', "entity_type: 'person'\n# 人物");
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: person }), /对应工作区管理/);
  const research = f.write('研究笔记.md', 'domiResearchId: abc\n# 研究');
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: research }), /对应工作区管理/);
  assert.equal([project, person, research].every(file => fs.existsSync(file)), true);
  // 相同关键词出现在行内时不受影响，仅行首前缀才视为托管文档。
  const normal = f.write('普通.md', '# 普通\n\n这行内提到 domiResearchId: 但不在行首\n');
  assert.equal(deleteDocumentLibraryEntry(f.root, { path: normal }).ok, true);
});

test('stale mtime and mid-delete modifications keep the document on disk', t => {
  const f = fixture(t), source = f.write('材料.md', '# 原文');
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: source, expectedMtimeMs: 1 }), /已被其他应用修改/);
  assert.equal(fs.existsSync(source), true);
  // 写入后 mtime 发生变化：未提供 expectedMtimeMs 时仍应成功。
  fs.writeFileSync(source, '# 更新');
  assert.equal(deleteDocumentLibraryEntry(f.root, { path: source }).ok, true);
  assert.equal(fs.existsSync(source), false);
});

test('junctioned library paths cannot point deletion outside the library', t => {
  const f = fixture(t);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-delete-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  const link = path.join(f.root, '链接');
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  fs.writeFileSync(path.join(outside, '外部.md'), '# 外部');
  assert.throws(() => deleteDocumentLibraryEntry(f.root, { path: path.join(link, '外部.md') }), /只能在当前/);
  assert.equal(fs.existsSync(path.join(outside, '外部.md')), true);
  fs.unlinkSync(link);
});
