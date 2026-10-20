const fs = require('node:fs');
const path = require('node:path');
const { assertInsideRoot, documentNode, LOCAL_TODO_DOCUMENT_NAME } = require('./document-library.cjs');
const { rebaseDocumentContent } = require('./research-layout.cjs');

function moveDocumentLibraryEntry(rootPath, request = {}, options = {}) {
  const root = path.resolve(rootPath);
  if (!path.isAbsolute(request.path || '') || !path.isAbsolute(request.parentPath || '')) throw new Error('移动文档需要有效的来源和目标文件夹。');
  const source = assertInsideRoot(root, request.path, false);
  const parent = assertInsideRoot(root, request.parentPath);
  const realRoot = fs.realpathSync(root);
  assertInsideRoot(realRoot, fs.realpathSync(source), false);
  assertInsideRoot(realRoot, fs.realpathSync(parent));
  if (path.relative(root, source).split(path.sep).some(part => part.startsWith('.'))
    || path.relative(root, parent).split(path.sep).some(part => part.startsWith('.'))) throw new Error('不能移动资料库的内部文件。');
  const stat = fs.lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('请选择普通文档进行移动。');
  if (!fs.statSync(parent).isDirectory()) throw new Error('目标位置不是文件夹。');
  const kind = new Map([['.md','markdown'],['.markdown','markdown'],['.pdf','pdf'],['.docx','word'],['.doc','word']]).get(path.extname(source).toLowerCase());
  if (!kind) throw new Error('仅支持移动 Markdown、PDF 和 Word 文档。');
  const target = assertInsideRoot(root, path.join(parent, path.basename(source)), false);
  if (fs.realpathSync(path.dirname(source)) === fs.realpathSync(parent)) {
    return { ok: true, unchanged: true, rootPath: root, previousPath: source, path: source, parentPath: parent,
      node: documentNode(root, source, path.basename(source), stat, kind) };
  }
  const expectedMtime = Number(request.expectedMtimeMs || 0);
  if (expectedMtime && Math.abs(expectedMtime - stat.mtimeMs) > 1) throw new Error('文档已被其他应用修改，请刷新后再移动。');
  let original, content;
  if (kind === 'markdown') {
    if (stat.size > 8 * 1024 * 1024) throw new Error('Markdown 文档超过 8 MB，请使用系统文件管理器移动。');
    original = fs.readFileSync(source);
    const text = original.toString('utf8');
    // These files represent a whole managed workspace rather than one material.
    if (source === path.join(root, LOCAL_TODO_DOCUMENT_NAME)
      || /^domiResearchId:/m.test(text)
      || /^entity_type:\s*["']?(?:project|person)["']?\s*$/m.test(text)) {
      throw new Error('项目主页、人物主页、主题研究笔记和待办入口由对应工作区管理；普通文档和材料可以直接拖动。');
    }
    content = rebaseDocumentContent(text, source, target);
  }
  let ownedTarget = false, undoMetadata;
  try {
    // COPYFILE_EXCL also checks the destination atomically. rename() can
    // overwrite a file that appears after an existsSync check on POSIX.
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
    ownedTarget = true;
    if (original && content !== original.toString('utf8')) fs.writeFileSync(target, content, { mode: stat.mode });
    const latest = fs.statSync(source);
    if (latest.size !== stat.size || latest.mtimeMs !== stat.mtimeMs) throw new Error('移动期间原文发生变化，文档仍保留在原位置，请重试。');
    const node = documentNode(root, target, path.basename(target), fs.statSync(target), kind);
    undoMetadata = options.relocate?.(source, target);
    fs.unlinkSync(source);
    return { ok: true, rootPath: root, previousPath: source, path: target, parentPath: parent, node };
  } catch (error) {
    try { undoMetadata?.(); }
    catch (rollbackError) { throw new Error(`移动失败，关联记录恢复失败；两个文件均已保留：${rollbackError.message}`); }
    if (ownedTarget && !error.keepDestination) {
      try { fs.unlinkSync(target); }
      catch { throw new Error('移动未完成，原文仍在原位置；目标副本暂时无法清理，请检查文件权限后重试。'); }
    }
    if (error.code === 'EEXIST') throw new Error(`目标文件夹中已存在“${path.basename(source)}”，未覆盖任何文件。`);
    throw error;
  }
}

module.exports = { moveDocumentLibraryEntry };
