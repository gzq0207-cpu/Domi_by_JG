import type { DocumentLibraryNode, DocumentLibrarySnapshot } from './env';

const nameCollator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
const pathKey = (value: string) => {
  const normalized = value.replace(/\\/g, '/').replace(/\/+$/, '');
  return /^[A-Za-z]:\//.test(normalized) ? normalized.toLowerCase() : normalized;
};

// Copy just the ancestor branch. Unchanged folders keep their identities so
// inserting one entry does not rebuild the rest of the renderer's tree.
export function insertDocumentLibraryNode(
  snapshot: DocumentLibrarySnapshot,
  rootPath: string,
  parentPath: string,
  node: DocumentLibraryNode
): DocumentLibrarySnapshot | null {
  if (!snapshot.ok || pathKey(snapshot.rootPath) !== pathKey(rootPath)) return null;
  const parent = pathKey(parentPath);
  let added = false;
  const insert = (nodes: DocumentLibraryNode[]) => {
    if (nodes.some(item => pathKey(item.path) === pathKey(node.path))) return nodes;
    const next = [...nodes];
    const compare = (item: DocumentLibraryNode) => {
      if (item.kind === 'folder' && node.kind !== 'folder') return -1;
      if (item.kind !== 'folder' && node.kind === 'folder') return 1;
      return nameCollator.compare(item.name, node.name);
    };
    let low = 0, high = next.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (compare(next[middle]) <= 0) low = middle + 1; else high = middle;
    }
    next.splice(low, 0, node);
    added = true;
    return next;
  };
  const visit = (nodes: DocumentLibraryNode[]): DocumentLibraryNode[] | null => {
    for (let index = 0; index < nodes.length; index++) {
      const item = nodes[index];
      if (item.kind !== 'folder') continue;
      const key = pathKey(item.path);
      let children: DocumentLibraryNode[] | null = null;
      if (key === parent) children = insert(item.children || []);
      else if (parent.startsWith(`${key}/`)) children = visit(item.children || []);
      if (children) {
        if (children === item.children) return nodes;
        const next = [...nodes];
        next[index] = { ...item, children };
        return next;
      }
    }
    return null;
  };
  const nodes = parent === pathKey(rootPath) ? insert(snapshot.nodes) : visit(snapshot.nodes);
  if (!nodes) return null; // Parent missing in a partial tree: caller refreshes.
  if (!added) return snapshot;
  return {
    ...snapshot, nodes,
    documentCount: snapshot.documentCount + (node.kind === 'folder' ? 0 : 1),
    folderCount: snapshot.folderCount + (node.kind === 'folder' ? 1 : 0)
  };
}

export function moveDocumentLibraryNode(snapshot: DocumentLibrarySnapshot, rootPath: string, previousPath: string, parentPath: string, node: DocumentLibraryNode): DocumentLibrarySnapshot | null {
  if (pathKey(snapshot.rootPath) !== pathKey(rootPath)) return null;
  if (pathKey(previousPath) === pathKey(node.path)) return snapshot;
  const source = pathKey(previousPath);
  const remove = (nodes: DocumentLibraryNode[]): DocumentLibraryNode[] | null => {
    for (let index = 0; index < nodes.length; index++) {
      const item = nodes[index], key = pathKey(item.path);
      if (key === source && item.kind !== 'folder') return nodes.filter((_, at) => at !== index);
      if (item.kind === 'folder' && source.startsWith(`${key}/`)) {
        const children = remove(item.children || []);
        if (children) { const next = [...nodes]; next[index] = { ...item, children }; return next; }
      }
    }
    return null;
  };
  const nodes = remove(snapshot.nodes);
  if (!nodes) return null;
  const result = insertDocumentLibraryNode({ ...snapshot, nodes, documentCount: snapshot.documentCount - 1 }, rootPath, parentPath, node);
  return result ? { ...result, documentCount: snapshot.documentCount } : null;
}
