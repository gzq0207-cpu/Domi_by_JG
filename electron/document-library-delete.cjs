const fs = require('node:fs');
const path = require('node:path');
const { assertInsideRoot, LOCAL_TODO_DOCUMENT_NAME } = require('./document-library.cjs');

// Deletion is the one irreversible filesystem write in the library, so it
// accepts strictly less than the other mutations: one regular document whose
// bytes are still the ones the renderer saw, and never an internal or
// workspace-managed file.
function deleteDocumentLibraryEntry(rootPath, request = {}) {
  const root = path.resolve(rootPath);
  if (!path.isAbsolute(request.path || '')) throw new Error('删除文档需要有效的文件位置。');
  const target = assertInsideRoot(root, request.path, false);
  let stat;
  try {
    stat = fs.lstatSync(target);
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error('文档不存在，可能已被删除，请刷新文档库。');
    throw error;
  }
  const realRoot = fs.realpathSync(root);
  assertInsideRoot(realRoot, fs.realpathSync(target), false);
  if (path.relative(root, target).split(path.sep).some(part => part.startsWith('.'))) {
    throw new Error('不能删除资料库的内部文件。');
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('请选择普通文档进行删除。');
  const kind = new Map([['.md','markdown'],['.markdown','markdown'],['.pdf','pdf'],['.docx','word'],['.doc','word']]).get(path.extname(target).toLowerCase());
  if (!kind) throw new Error('仅支持删除 Markdown、PDF 和 Word 文档。');
  if (kind === 'markdown') {
    if (stat.size > 8 * 1024 * 1024) throw new Error('Markdown 文档超过 8 MB，请使用系统文件管理器删除。');
    const text = fs.readFileSync(target, 'utf8');
    // Managed workspace entrances would leave their owner (todo board, a
    // project/person workspace or a research note) broken; delete those from
    // the owning workspace instead.
    if (target === path.join(root, LOCAL_TODO_DOCUMENT_NAME)
      || /^domiResearchId:/m.test(text)
      || /^entity_type:\s*["']?(?:project|person)["']?\s*$/m.test(text)) {
      throw new Error('项目主页、人物主页、主题研究笔记和待办入口由对应工作区管理，不能在这里删除。');
    }
  }
  const expectedMtime = Number(request.expectedMtimeMs || 0);
  if (expectedMtime && Math.abs(expectedMtime - stat.mtimeMs) > 1) {
    throw new Error('文档已被其他应用修改，请刷新后再删除。');
  }
  // The managed-document probe above read the file, so re-verify the bytes are
  // still the inspected ones right before the unlink.
  const latest = fs.statSync(target);
  if (latest.size !== stat.size || latest.mtimeMs !== stat.mtimeMs) {
    throw new Error('删除期间文档发生变化，请刷新后再试。');
  }
  fs.unlinkSync(target);
  return { ok: true, kind, rootPath: root, path: target, name: path.basename(target),
    parentPath: path.dirname(target), deletedAt: Date.now() };
}

module.exports = { deleteDocumentLibraryEntry };
