const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { moveDocumentLibraryEntry } = require('../electron/document-library-move.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-move-'));
  const from = path.join(root, '来源'), to = path.join(root, '目标');
  fs.mkdirSync(from); fs.mkdirSync(to);
  t.after(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return { root, from, to, write(name, content) { const file = path.join(from, name); fs.writeFileSync(file, content); return file; } };
}

test('Markdown moves preserve local image/link targets and leave code and URLs unchanged', t => {
  const f = fixture(t);
  const source = f.write('中文 笔记.md', '# 笔记\n\n![图片](assets/图%20片.png)\n[附件](材料.pdf#page=2)\n[外部](https://example.com/a)\n[跳转](#收入)\n\n`[代码](材料.pdf)`\n```md\n[代码](材料.pdf)\n```\n');
  const result = moveDocumentLibraryEntry(f.root, { path: source, parentPath: f.to });
  assert.equal(result.ok, true); assert.equal(fs.existsSync(source), false);
  const text = fs.readFileSync(result.path, 'utf8');
  assert.match(text, /!\[图片\]\(\.\.\/来源\/assets\/图%20片.png\)/);
  assert.match(text, /\[附件\]\(\.\.\/来源\/材料.pdf#page=2\)/);
  assert.match(text, /`\[代码\]\(材料.pdf\)`/);
  assert.match(text, /```md\n\[代码\]\(材料.pdf\)\n```/);
  assert.match(text, /https:\/\/example.com\/a/);
  const back = moveDocumentLibraryEntry(f.root, { path: result.path, parentPath: f.from });
  assert.match(fs.readFileSync(back.path, 'utf8'), /!\[图片\]\(assets\/图%20片.png\)/);
});

test('PDF and Word moves retain every byte, including a move back to the library root', t => {
  const f = fixture(t);
  for (const name of ['原始.pdf', '材料.docx', '旧材料.doc']) {
    const bytes = Buffer.from([0, 255, 2, 5, 11, 30]);
    const source = f.write(name, bytes);
    const result = moveDocumentLibraryEntry(f.root, { path: source, parentPath: f.to });
    assert.deepEqual(fs.readFileSync(result.path), bytes);
    const root = moveDocumentLibraryEntry(f.root, { path: result.path, parentPath: f.root });
    assert.deepEqual(fs.readFileSync(root.path), bytes);
    assert.equal(root.node.kind, name.endsWith('pdf') ? 'pdf' : 'word');
  }
});

test('same-folder drops do nothing and conflicting destinations never overwrite either file', t => {
  const f = fixture(t), source = f.write('笔记.md', '# 原文');
  assert.equal(moveDocumentLibraryEntry(f.root, { path: source, parentPath: f.from }).unchanged, true);
  fs.writeFileSync(path.join(f.to, '笔记.md'), '# 已存在');
  assert.throws(() => moveDocumentLibraryEntry(f.root, { path: source, parentPath: f.to }), /已存在/);
  assert.equal(fs.readFileSync(source, 'utf8'), '# 原文');
  assert.equal(fs.readFileSync(path.join(f.to, '笔记.md'), 'utf8'), '# 已存在');
});

test('stale versions, folders, managed workspace entrances and escaping paths are rejected', t => {
  const f = fixture(t), source = f.write('材料.md', '# 原文');
  assert.throws(() => moveDocumentLibraryEntry(f.root, { path: source, parentPath: f.to, expectedMtimeMs: 1 }), /已被其他应用修改/);
  assert.throws(() => moveDocumentLibraryEntry(f.root, { path: f.from, parentPath: f.to }), /普通文档/);
  assert.throws(() => moveDocumentLibraryEntry(f.root, { path: source, parentPath: path.dirname(f.root) }), /只能在当前/);
  const homepage = f.write('主页.md', 'entity_type: "project"\n# 公司');
  assert.throws(() => moveDocumentLibraryEntry(f.root, { path: homepage, parentPath: f.to }), /对应工作区管理/);
  assert.equal(fs.existsSync(homepage), true);
});

test('metadata or filesystem errors retain the original and roll back the exclusive destination', t => {
  const f = fixture(t), source = f.write('材料.md', '# 原文');
  assert.throws(() => moveDocumentLibraryEntry(f.root, { path: source, parentPath: f.to }, { relocate() { throw new Error('database busy'); } }), /database busy/);
  assert.equal(fs.existsSync(source), true); assert.equal(fs.existsSync(path.join(f.to, '材料.md')), false);
  const unlink = fs.unlinkSync;
  let restored = false;
  fs.unlinkSync = file => { if (file === source) throw new Error('source locked'); return unlink(file); };
  try {
    assert.throws(() => moveDocumentLibraryEntry(f.root, { path: source, parentPath: f.to }, { relocate() { return () => { restored = true; }; } }), /source locked/);
  } finally { fs.unlinkSync = unlink; }
  assert.equal(restored, true); assert.equal(fs.existsSync(source), true); assert.equal(fs.existsSync(path.join(f.to, '材料.md')), false);
});

test('junctions outside the library cannot be used as either source or destination', t => {
  const f = fixture(t), outside = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-move-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  const link = path.join(f.root, '链接');
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  const source = f.write('材料.md', '# 文档');
  assert.throws(() => moveDocumentLibraryEntry(f.root, { path: source, parentPath: link }), /只能在当前/);
  fs.writeFileSync(path.join(outside, '外部.md'), '# 外部');
  assert.throws(() => moveDocumentLibraryEntry(f.root, { path: path.join(link, '外部.md'), parentPath: f.to }), /只能在当前/);
  fs.unlinkSync(link);
});
