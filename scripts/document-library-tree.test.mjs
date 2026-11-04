import test from 'node:test';
import assert from 'node:assert/strict';
import { insertDocumentLibraryNode, moveDocumentLibraryNode, removeDocumentLibraryNode } from '../src/document-library-tree.ts';
import { DOCUMENT_LIBRARY_DRAG_TYPE, hasDocumentLibraryDrag, readDocumentLibraryDrag } from '../src/document-library-drag.ts';

const rootPath = 'C:\\资料库';
const node = (name, kind = 'markdown', parent = rootPath) => ({ kind, name, path: `${parent}\\${name}`, relativePath: name, size: 1, mtimeMs: 1, ...(kind === 'folder' ? { children: [] } : {}) });
const snapshot = nodes => ({ ok: true, rootPath, rootName: '资料库', nodes, documentCount: 2, folderCount: 1, truncated: false, scannedAt: 1 });

test('incremental insert preserves folder-first natural sorting and accurate counts', () => {
  const original = snapshot([node('研究', 'folder'), node('收入2.md'), node('收入10.md')]);
  const next = insertDocumentLibraryNode(original, rootPath, rootPath, node('收入3.md'));
  assert.deepEqual(next.nodes.map(item => item.name), ['研究', '收入2.md', '收入3.md', '收入10.md']);
  assert.equal(next.documentCount, 3);
  assert.equal(next.folderCount, 1);
  assert.equal(original.nodes.length, 3, 'never mutate the old snapshot');
  const folder = insertDocumentLibraryNode(next, rootPath, rootPath, node('新增', 'folder'));
  assert.equal(folder.folderCount, 2);
  assert.equal(folder.documentCount, 3);
});

test('nested insertion only copies ancestors and duplicate responses are idempotent', () => {
  const folder = node('研究', 'folder'), other = node('其他', 'folder');
  const original = snapshot([folder, other]);
  const file = node('笔记.md', 'markdown', folder.path);
  const next = insertDocumentLibraryNode(original, rootPath, folder.path, file);
  assert.equal(next.nodes[1], other);
  assert.notEqual(next.nodes[0], folder);
  assert.equal(folder.children.length, 0);
  assert.equal(next.nodes[0].children[0], file);
  assert.equal(insertDocumentLibraryNode(next, rootPath.toLowerCase(), folder.path.toLowerCase(), file), next);
});

test('old roots and missing parents require a refresh instead of corrupting the tree', () => {
  const original = snapshot([]);
  assert.equal(insertDocumentLibraryNode(original, 'D:\\其他', rootPath, node('笔记.md')), null);
  assert.equal(insertDocumentLibraryNode(original, rootPath, `${rootPath}\\缺失`, node('笔记.md')), null);
});

test('moves remove the old entry and insert the new one without changing document totals', () => {
  const a = node('A', 'folder'), b = node('B', 'folder'), c = node('C', 'folder');
  const source = node('材料.md', 'markdown', a.path); a.children = [source];
  const original = snapshot([a, b, c]);
  const moved = node('材料.md', 'markdown', b.path);
  const next = moveDocumentLibraryNode(original, rootPath, source.path, b.path, moved);
  assert.equal(next.documentCount, original.documentCount);
  assert.equal(next.nodes[0].children.length, 0);
  assert.equal(next.nodes[1].children[0].path, moved.path);
  assert.equal(next.nodes[2], c);
  assert.equal(original.nodes[0].children[0], source);
  const back = moveDocumentLibraryNode(next, rootPath, moved.path, rootPath, node('材料.md'));
  assert.equal(back.nodes[3].path, node('材料.md').path);
  assert.equal(moveDocumentLibraryNode(next, rootPath, moved.path, 'C:\\资料库\\缺失', source), null);
});

test('removals copy only the ancestor branch, recount documents and keep folders', () => {
  const a = node('A', 'folder'), b = node('B', 'folder');
  const first = node('材料.md', 'markdown', a.path), second = node('笔记.md', 'markdown', a.path);
  a.children = [first, second];
  const original = snapshot([a, b]);
  const next = removeDocumentLibraryNode(original, rootPath, second.path);
  assert.equal(next.documentCount, original.documentCount - 1);
  assert.deepEqual(next.nodes[0].children.map(item => item.name), ['材料.md']);
  assert.equal(next.nodes[1], b, 'untouched folders keep their identity');
  assert.equal(original.nodes[0].children.length, 2, 'never mutate the old snapshot');
  // 删除根目录文档和嵌套文档同样只更新计数与对应分支。
  const withRoot = insertDocumentLibraryNode(next, rootPath, rootPath, node('独立.md'));
  const removedRoot = removeDocumentLibraryNode(withRoot, rootPath, node('独立.md').path);
  assert.equal(removedRoot.documentCount, withRoot.documentCount - 1);
  assert.deepEqual(removedRoot.nodes.map(item => item.name), ['A', 'B']);
  assert.equal(removedRoot.nodes[0], next.nodes[0], 'unchanged branches keep their identity');
  // 大小写不同的路径键按同一文档处理。
  assert.equal(removeDocumentLibraryNode(removedRoot, rootPath.toLowerCase(), first.path.toUpperCase()).documentCount, removedRoot.documentCount - 1);
});

test('removals of folders, foreign paths or unknown documents fall back to a refresh', () => {
  const a = node('A', 'folder');
  a.children = [node('材料.md', 'markdown', a.path)];
  const original = snapshot([a]);
  assert.equal(removeDocumentLibraryNode(original, rootPath, a.path), null, 'folders are never removed');
  assert.equal(removeDocumentLibraryNode(original, rootPath, `${rootPath}\\材料.md`), null, 'missing paths require a refresh');
  assert.equal(removeDocumentLibraryNode(original, 'D:\\其他库', a.children[0].path), null, 'another root requires a refresh');
  assert.equal(removeDocumentLibraryNode({ ...original, ok: false }, rootPath, a.children[0].path), null);
  assert.equal(original.nodes[0].children.length, 1, 'failed removals never mutate the snapshot');
});

test('drag payloads only accept library documents from the current root', () => {
  const value = { rootPath, path: `${rootPath}\\材料.md`, mtimeMs: 1 };
  const transfer = { types: [DOCUMENT_LIBRARY_DRAG_TYPE], getData: () => JSON.stringify(value) };
  assert.equal(hasDocumentLibraryDrag(transfer), true);
  assert.deepEqual(readDocumentLibraryDrag(transfer, rootPath), value);
  assert.equal(readDocumentLibraryDrag(transfer, 'D:\\其他库'), null);
  assert.equal(readDocumentLibraryDrag({ getData: () => '{invalid' }, rootPath), null);
  assert.equal(hasDocumentLibraryDrag({ types: ['Files', 'text/plain'] }), false);
});
