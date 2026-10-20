import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, FileText, Folder, RefreshCw, Search, X } from "lucide-react";
import type { DocumentLibraryNode, DocumentLibrarySnapshot, LocalAttachment, SourceScope } from "./env";
import { filterScopeNodes, MAX_SCOPE_DOCUMENTS, scopeDocuments, validateDocumentScope } from "./document-scope";
import "./document-scope.css";

export default function DocumentScopePicker({ library, loading, error, initialSelection, sourceScope, onRefresh, onApply, onClose }: {
  library: DocumentLibrarySnapshot | null;
  loading: boolean;
  error: string;
  initialSelection: LocalAttachment[];
  sourceScope?: SourceScope;
  onRefresh: () => void;
  onApply: (files: LocalAttachment[]) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Map(initialSelection.map((file) => [file.path, file])));
  const [expanded, setExpanded] = useState(new Set<string>());
  const [selectionError, setSelectionError] = useState("");
  const nodes = useMemo(() => filterScopeNodes(library?.nodes || [], query), [library, query]);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    search.current?.focus();
    return () => { element?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);

  function toggle(files: LocalAttachment[]) {
    const removing = files.every((file) => selected.has(file.path));
    const next = new Map(selected);
    for (const file of files) {
      if (removing) next.delete(file.path);
      else next.set(file.path, file);
    }
    if (next.size > MAX_SCOPE_DOCUMENTS) { setSelectionError(`最多选择 ${MAX_SCOPE_DOCUMENTS} 份文档，请展开文件夹后缩小范围。`); return; }
    setSelected(next);
    setSelectionError("");
  }

  function renderNode(node: DocumentLibraryNode, depth = 0) {
    const folder = node.kind === "folder";
    const files = scopeDocuments([node]);
    const count = files.filter((file) => selected.has(file.path)).length;
    const open = folder && (Boolean(query.trim()) || expanded.has(node.path));
    return <div key={node.path}>
      <div className="document-scope-row" style={{ paddingLeft: 12 + depth * 18 }}>
        {folder ? <button type="button" className="document-scope-disclosure" aria-label={`${open ? "收起" : "展开"} ${node.displayName || node.name}`}
          aria-expanded={open} onClick={() => setExpanded((current) => {
            const next = new Set(current); if (next.has(node.path)) next.delete(node.path); else next.add(node.path); return next;
          })}><ChevronRight size={14} className={open ? "open" : ""} /></button> : <span className="document-scope-disclosure" />}
        <label title={node.relativePath}>
          <input type="checkbox" checked={files.length > 0 && count === files.length} disabled={!files.length}
            ref={(element) => { if (element) element.indeterminate = count > 0 && count < files.length; }}
            aria-label={`选中 ${node.displayName || node.name}`} onChange={() => toggle(files)} />
          {folder ? <Folder size={16} /> : <FileText size={16} />}
          <span>{node.displayName || node.name}</span>
        </label>
        <small>{folder ? `${count ? `${count}/` : ""}${files.length} 份` : node.kind === "pdf" ? "PDF" : node.kind==='word'?'Word':"Markdown"}</small>
      </div>
      {open && node.children?.map((child) => renderNode(child, depth + 1))}
    </div>;
  }

  return <dialog ref={dialog} className="document-scope-dialog" aria-labelledby="document-scope-title" aria-describedby="document-scope-description"
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="document-scope-content">
      <header><div><h2 id="document-scope-title">选择提问文档</h2><p id="document-scope-description">{sourceScope === 'both' ? '选择资料回答使用的文档，关键结论附原文引用；模型补充会单独列出并标明未经资料核验。' : sourceScope === 'model' ? '文档保留供切换回答方式使用；模型直答只使用问题和主动引用选段，本轮不读取这些文档。' : '回答仅依据选中文档，关键结论附原文引用；材料没有答案时说明证据不足。'}</p></div>
        <button type="button" aria-label="关闭文档选择" onClick={onClose}><X size={18} /></button></header>
      <div className="document-scope-search"><Search size={16} /><input ref={search} value={query} onChange={(event) => setQuery(event.target.value)}
        placeholder="按文档名或文件夹搜索" aria-label="搜索提问文档" />
        <button type="button" disabled={loading} onClick={onRefresh} aria-label="刷新可选文档"><RefreshCw size={15} className={loading ? "spinning" : ""} /></button></div>
      <div className="document-scope-browser" aria-label="可选提问文档" aria-busy={loading}>
        {loading && !library && <p role="status">正在读取文档库…</p>}
        {error && <p role="alert">{error}</p>}
        {nodes.map((node) => renderNode(node))}
        {!loading && !error && !nodes.length && <p>{query ? "没有匹配的文档，请换个名称或文件夹。" : "文档库暂无可选文档，也可以关闭后通过「＋」添加本地材料。"}</p>}
      </div>
      {library?.truncated && <p className="document-scope-hint">文档目录未完整显示。可通过左侧全局搜索「加入提问」，或用「＋」选择本地文件。</p>}
      <section className="document-scope-selection" aria-label="已选提问文档"><div><strong>已选 {selected.size} / {MAX_SCOPE_DOCUMENTS} 份</strong>
        <button type="button" disabled={!selected.size} onClick={() => { setSelected(new Map()); setSelectionError(""); }}>清空选择</button></div>
        <div className="document-scope-chips">{[...selected.values()].map((file) => <button type="button" key={file.path} title={file.path}
          aria-label={`取消选择 ${file.name}`} onClick={() => toggle([file])}><FileText size={13} /><span>{file.name}</span><X size={12} /></button>)}</div>
      </section>
      {selectionError && <p className="document-scope-error" role="alert">{selectionError}</p>}
      <footer><span>范围会保留，可继续追问或随时调整。</span><button type="button" onClick={onClose}>取消</button>
        <button type="button" className="primary" disabled={!selected.size} onClick={() => {
          const files = [...selected.values()];
          try { validateDocumentScope("selected", files); onApply(files); }
          catch (cause) { setSelectionError(cause instanceof Error ? cause.message : String(cause)); }
        }}>{sourceScope === 'both' ? `以这 ${selected.size} 份为资料` : sourceScope === 'model' ? `保留这 ${selected.size} 份文档` : `仅用这 ${selected.size} 份文档`}</button></footer>
    </div>
  </dialog>;
}
