import test from 'node:test';
import assert from 'node:assert/strict';
import { insertDocumentLibraryNode, moveDocumentLibraryNode } from '../src/document-library-tree.ts';
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

test('drag payloads only accept library documents from the current root', () => {
  const value = { rootPath, path: `${rootPath}\\材料.md`, mtimeMs: 1 };
  const transfer = { types: [DOCUMENT_LIBRARY_DRAG_TYPE], getData: () => JSON.stringify(value) };
  assert.equal(hasDocumentLibraryDrag(transfer), true);
  assert.deepEqual(readDocumentLibraryDrag(transfer, rootPath), value);
  assert.equal(readDocumentLibraryDrag(transfer, 'D:\\其他库'), null);
  assert.equal(readDocumentLibraryDrag({ getData: () => '{invalid' }, rootPath), null);
  assert.equal(hasDocumentLibraryDrag({ types: ['Files', 'text/plain'] }), false);
});
