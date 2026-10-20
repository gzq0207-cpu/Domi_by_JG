import { memo, useRef, useState, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ChevronRight, FileText, FileType2, Folder, FolderOpen } from 'lucide-react';
import type { DocumentLibraryNode } from './env';
import { DOCUMENT_LIBRARY_DRAG_TYPE, hasDocumentLibraryDrag, readDocumentLibraryDrag } from './document-library-drag';

type Props = {
  nodes: DocumentLibraryNode[];
  rootPath: string;
  expandedPaths: Set<string>;
  selectedFolder: string;
  selectedDocument: string;
  searching: boolean;
  activePath: string;
  onOpen: (node: DocumentLibraryNode, parentPath: string) => void;
  formatSize: (size: number) => string;
  moving: boolean;
  onMove: (path: string, parentPath: string, mtimeMs: number) => void;
  onExpand: (path: string) => void;
};

// App also owns conversation streaming, editor drafts and timers. None of
// those updates should rebuild the document tree while its props are stable.
export default memo(function DocumentLibraryTree(props: Props) {
  const [over, setOver] = useState('');
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hover = useRef('');
  const clearHover = () => { hover.current = ''; setOver(''); if (expandTimer.current) clearTimeout(expandTimer.current); expandTimer.current = null; };
  useEffect(() => () => { if (expandTimer.current) clearTimeout(expandTimer.current); }, []);
  function renderNode(node: DocumentLibraryNode, parentPath: string, depth = 0): ReactNode {
    const isFolder = node.kind === 'folder';
    const expanded = isFolder && (props.searching || props.expandedPaths.has(node.path));
    const selected = (isFolder ? props.selectedFolder : props.selectedDocument) === node.path;
    const keyboardActive = props.searching && props.activePath === node.path;
    return <div className="document-library-node" key={node.path}>
      <button className={['document-library-node-row', selected ? 'selected' : '', keyboardActive ? 'keyboard-active' : '', over === node.path ? 'drop-target' : ''].filter(Boolean).join(' ')}
        type="button" style={{ '--tree-indent': `${depth * 14}px` } as CSSProperties}
        onClick={() => props.onOpen(node, parentPath)} title={`${node.path}\n${isFolder ? '将文档拖到这里可移动到此文件夹' : '可拖动到其他文件夹以移动文档'}`} role="treeitem"
        aria-expanded={isFolder ? expanded : undefined} aria-selected={selected || keyboardActive} data-document-library-path={node.path}
        draggable={!isFolder}
        onDragStart={event => {
          if (isFolder || props.moving) { event.preventDefault(); return; }
          event.stopPropagation(); event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData(DOCUMENT_LIBRARY_DRAG_TYPE, JSON.stringify({ rootPath: props.rootPath, path: node.path, mtimeMs: node.mtimeMs }));
        }}
        onDragEnd={clearHover}
        onDragOver={event => {
          if (!isFolder || props.moving || !hasDocumentLibraryDrag(event.dataTransfer)) return;
          event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move';
          if (hover.current !== node.path) {
            clearHover(); hover.current = node.path; setOver(node.path);
            if (!expanded) expandTimer.current = setTimeout(() => props.onExpand(node.path), 650);
          }
        }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) clearHover(); }}
        onDrop={event => {
          if (!isFolder || !hasDocumentLibraryDrag(event.dataTransfer)) return;
          event.preventDefault(); event.stopPropagation(); clearHover();
          const dragged = readDocumentLibraryDrag(event.dataTransfer, props.rootPath);
          if (dragged && !props.moving) props.onMove(dragged.path, node.path, dragged.mtimeMs);
        }}>
        <span className="document-library-disclosure" aria-hidden="true">{isFolder ? <ChevronRight className={expanded ? 'open' : ''} size={13} /> : null}</span>
        <span className={`document-library-node-icon ${node.kind}`} aria-hidden="true">
          {isFolder ? expanded ? <FolderOpen size={16} /> : <Folder size={16} /> : node.kind === 'pdf' ? <FileType2 size={16} /> : <FileText size={16} />}
        </span>
        <span className="document-library-node-name">{node.displayName || node.name}</span>
        {!isFolder && <small>{props.formatSize(node.size)}</small>}
      </button>
      {expanded && node.children && <div className="document-library-children" role="group">
        {node.children.length ? node.children.map(child => renderNode(child, node.path, depth + 1)) :
          <span className="document-library-empty-folder" style={{ '--tree-indent': `${(depth + 1) * 14}px` } as CSSProperties}>空文件夹</span>}
      </div>}
    </div>;
  }
  return <>{props.nodes.map(node => renderNode(node, props.rootPath))}</>;
});
