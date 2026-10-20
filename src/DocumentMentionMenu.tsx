import { Check, FileText, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { LocalAttachment } from './env';
import { documentPathKey } from './document-question';
import type { MentionDocument } from './document-mentions';
import './document-mentions.css';

export default function DocumentMentionMenu({ files, selected, activeIndex, loading, error, truncated, query, onActiveIndex, onPick, onRefresh, onClose }: {
  files: MentionDocument[]; selected: LocalAttachment[]; activeIndex: number;
  loading: boolean; error: string; truncated: boolean; query: string;
  onActiveIndex: (index: number) => void; onPick: (file: LocalAttachment) => void;
  onRefresh: () => void; onClose: () => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [activeIndex, files]);
  return <div className="document-mention-menu" onMouseDown={event => event.preventDefault()}>
    <header><strong>@ 资料库文档</strong><span>选中后仅依据这些文档回答</span>
      <button type="button" aria-label="关闭文档引用候选" onClick={onClose}><X size={14} /></button></header>
    {loading && <p role="status">正在读取资料库目录…</p>}
    {error && <p role="alert">{error}<button type="button" onClick={onRefresh}><RefreshCw size={12} />重试</button></p>}
    <div ref={list} id="composer-document-mentions" role="listbox" aria-label="资料库文档候选">
      {files.map((file, index) => <button type="button" role="option" id={`composer-document-mention-${index}`} key={file.path}
        aria-selected={index === activeIndex} title={file.relativePath} onMouseEnter={() => onActiveIndex(index)} onClick={() => onPick(file)}>
        <FileText size={16} /><span><strong>{file.name}</strong><small>{file.relativePath}</small></span>
        {selected.some(item => documentPathKey(item.path) === documentPathKey(file.path)) && <small className="document-mention-selected"><Check size={12} />已选</small>}
      </button>)}
    </div>
    {!loading && !error && !files.length && <p>{query.trim() ? '没有匹配的文档，请修改 @ 后的名称或文件夹。' : '资料库暂无文档，可通过「＋」添加本地文件。'}</p>}
    {truncated && <p>目录未完整显示，可用左侧全局搜索「加入提问」补充。</p>}
    <footer>↑↓ 选择 · Enter / Tab 添加 · Esc 关闭 · 可多次 @ 添加<br />按名称或文件夹搜索，更多文档可点击下方「选择文档」。</footer>
  </div>;
}
