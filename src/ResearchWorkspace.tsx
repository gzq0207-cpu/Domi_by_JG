import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { workbench } from './bridge';
import RichMarkdownEditor from './RichMarkdownEditor';
import MaterialReader from './MaterialReader';
import { restoreMarkdownFromEditor } from './markdownDialect';
import { registerResearchDocument, mutateResearch } from './research-runtime';
import { RESEARCH_INDUSTRIES } from './research-industries';
import { quoteFromSelection, requestDocumentQuestion } from './document-question';
import DocumentComments, { CommentNavigation, useDocumentComments } from './DocumentComments';
import type { MarkdownDocument, PdfDocument } from './env';
import type { ResearchSelection, ResearchTopic, WordDocument } from './research-types';
import './research.css';
type Request = { topicId?: string; annotationId?: string; nonce: number };
type DocumentState = { topic: ResearchTopic; content: string; version: string };
type SourceState = { markdown?: MarkdownDocument; pdf?: PdfDocument; word?:WordDocument; targetId?: string; page?: number; warning?: string };
const draftKey = (id: string) => `domi.research-draft.${id}`;
export default function ResearchWorkspace({ visible, request }: { visible: boolean; request: Request }) {
  const [topics, setTopics] = useState<ResearchTopic[]>([]), [query, setQuery] = useState(''), [showArchived, setShowArchived] = useState(false);
  const [industry,setIndustry] = useState('其他行业');
  const [selection, setSelection] = useState<ResearchSelection | null>(null);
  const [document, setDocument] = useState<DocumentState | null>(null), [draft, setDraft] = useState(''), [revision, setRevision] = useState(0);
  const [error, setError] = useState(''), [saving, setSaving] = useState(false), [locked, setLocked] = useState(false), [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(''), [source, setSource] = useState<SourceState | null>(null), [mobileTab, setMobileTab] = useState('notes');
  const editor = useRef<Editor | null>(null), state = useRef<DocumentState | null>(null), content = useRef(''), saveFlight = useRef<Promise<boolean> | null>(null);
  const frozen = useRef(false), conflict = useRef(false), createId = useRef(''), serial = useRef(0), panel = useRef<HTMLDivElement>(null);
  state.current = document;
  const actions = useRef({ flush: async () => true, reload: async () => {} });
  const comments = useDocumentComments({ path: document?.topic.path || '', revision: document?.version, beforeCreate: () => actions.current.flush() });
  useEffect(() => {
    if (!comments.target) return;
    setSelection(null);
    if (comments.target.annotation.kind === 'document') {
      const content = panel.current?.querySelector<HTMLElement>('.research-document .rich-markdown-scroll'); if (content) content.scrollTop = 0;
    }
  }, [comments.target]);
  async function refreshTopics() {
    const result = await workbench.research({ action: 'list' });
    if (result.ok) setTopics(result.topics || []); else setError(result.error || '读取主题失败');
  }
  function keepDraft(value: string) {
    content.current = value; setDraft(value);
    if (!state.current) return;
    try { localStorage.setItem(draftKey(state.current.topic.id), JSON.stringify({ content: value, version: state.current.version })); }
    catch { setError('本机草稿缓存失败，请先保存文档后再关闭。'); }
  }
  function editorContent() {
    const current = state.current;
    if (!current || !editor.current || editor.current.isDestroyed) return content.current;
    const frontmatter = current.content.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n?)/)?.[0] || '';
    return frontmatter + restoreMarkdownFromEditor(editor.current.getMarkdown());
  }
  async function flush(): Promise<boolean> {
    if (saveFlight.current) { if (!await saveFlight.current) return false; return flush(); }
    const current = state.current;
    if (!current) return true;
    const value = editorContent();
    if (value !== content.current) keepDraft(value);
    if (value === current.content) return true;
    if (conflict.current) return false;
    setSaving(true);
    const pending = (async () => {
      const result = await workbench.research({ action: 'save', topicId: current.topic.id, content: value, expectedVersion: current.version });
      if (!result.ok || result.content === undefined || !result.version || !result.topic) {
        conflict.current = Boolean(result.conflict); setError(result.error || '保存失败，草稿已保留'); return false;
      }
      const next = { topic: result.topic, content: result.content, version: result.version };
      state.current = next; setDocument(next);
      try {
        if (content.current === value) localStorage.removeItem(draftKey(current.topic.id));
        else localStorage.setItem(draftKey(current.topic.id), JSON.stringify({ content: content.current, version: result.version }));
      } catch { /* The authoritative file has already been saved. */ }
      setError(''); return true;
    })().catch(e => { setError(String(e)); return false; });
    saveFlight.current = pending;
    try { return await pending; } finally { saveFlight.current = null; setSaving(false); }
  }
  async function reload() {
    const current = state.current; if (!current) return;
    const result = await workbench.research({ action: 'read', topicId: current.topic.id });
    if (!result.ok || result.content === undefined || !result.version || !result.topic) { setError(result.error || '重新载入失败'); return; }
    const next = { topic: result.topic, content: result.content, version: result.version };
    state.current = next; content.current = next.content; setDocument(next); setDraft(next.content); setTitle(next.topic.title); setIndustry(next.topic.industry); conflict.current = false; setRevision(value => value+1);
  }
  actions.current = { flush, reload };
  useEffect(() => registerResearchDocument({
    flush: () => actions.current.flush(), reload: () => actions.current.reload(),
    lock: value => { frozen.current = value; setLocked(value); editor.current?.setEditable(!value && !state.current?.topic.archived); }
  }), []);
  useEffect(() => {
    if (!visible || frozen.current || !document || document.topic.archived || conflict.current || draft === document.content) return;
    const timer = window.setTimeout(() => void actions.current.flush(), 500);
    return () => window.clearTimeout(timer);
  }, [draft, document, visible, locked]);
  useEffect(() => { void refreshTopics(); const changed = () => void refreshTopics(); window.addEventListener('domi:research-changed',changed); return () => window.removeEventListener('domi:research-changed',changed); }, []);
  async function openTopic(topicId: string, annotationId?: string) {
    if (!await actions.current.flush()) return;
    setSelection(null);
    const ticket = ++serial.current;
    const result = await workbench.research({ action: 'read', topicId });
    if (ticket !== serial.current) return;
    if (!result.ok || !result.topic || result.content === undefined || !result.version) { setError(result.error || '打开主题失败'); return; }
    const next = { topic: result.topic, content: result.content, version: result.version };
    state.current = next; setDocument(next); setTitle(next.topic.title); setIndustry(next.topic.industry); setError(''); conflict.current = false;
    let value = next.content;
    try {
      const cached = JSON.parse(localStorage.getItem(draftKey(topicId)) || 'null');
      if (cached && typeof cached.content === 'string' && cached.content !== next.content) {
        value = cached.content;
        if (cached.version !== next.version) { conflict.current = true; setError('发现未保存草稿，磁盘版本也已变化。草稿已恢复，请复制草稿后载入磁盘版本进行合并。'); }
      }
      localStorage.setItem('domi.research-last-topic',topicId);
    } catch { setError('无法读取本机草稿缓存'); }
    content.current = value; setDraft(value); setRevision(value => value+1); setMobileTab('notes');
    if (annotationId) window.setTimeout(() => {
      const note = panel.current?.querySelector<HTMLElement>(`[data-annotation-id="${annotationId}"]`); note?.scrollIntoView({ block: 'center' }); note?.classList.add('research-target');
    }, 350);
  }
  async function openSource(annotationId: string) {
    setError('');
    const result = await workbench.research({ action: 'resolve', annotationId });
    if (!result.ok || !result.source || !result.annotation) { setError(result.error || '来源无法定位'); return; }
    if (result.status === 'missing' || result.status === 'ambiguous') { setError(result.status === 'missing' ? '来源文件已删除或移动，暂时无法定位。研究笔记中的摘录仍然保留。' : '找到多份相同材料，无法唯一定位原文。'); return; }
    const warning = result.status === 'changed' ? '来源材料版本已变化，请核对当前内容。原有摘录仍然保留。' : undefined;
    const base = { targetId: result.status === 'exact' ? annotationId : undefined, page: result.annotation.anchor.pages?.[0]?.page || 1, warning };
    if (result.source.kind === 'pdf') {
      const read = await workbench.readPdf({ resource: result.source.path });
      if (read.ok && read.document) setSource({ ...base, pdf: read.document }); else setError(read.error || '读取 PDF 失败');
    } else if(result.source.kind==='word') {
      const read=await workbench.readWord({resource:result.source.path});if(read.ok&&read.document)setSource({...base,word:read.document});else setError(read.error||'读取 Word 失败');
    } else {
      const read = await workbench.readMarkdown({ resource: result.source.path });
      if (read.ok && read.document) setSource({ ...base, markdown: read.document }); else setError(read.error || '读取来源失败');
    }
    setMobileTab('source');
  }
  const sourceAction = useRef(openSource); sourceAction.current = openSource;
  useEffect(() => { const listener = (event: Event) => void sourceAction.current((event as CustomEvent).detail.annotationId); window.addEventListener('domi:open-annotation',listener); return () => window.removeEventListener('domi:open-annotation',listener); }, []);
  useEffect(() => {
    if (request.topicId) void openTopic(request.topicId,request.annotationId);
    else if (request.annotationId) void openSource(request.annotationId);
  }, [request.nonce]);
  useEffect(() => {
    if (!visible || state.current || request.topicId) return;
    const last = localStorage.getItem('domi.research-last-topic');
    if (last && topics.some(topic => topic.id === last)) void openTopic(last);
  }, [visible, topics]);
  async function create() {
    if (!query.trim() || !await flush()) return;
    setBusy(true);
    try {
      if (!createId.current) createId.current = crypto.randomUUID();
      const result = await workbench.research({ action: 'create', title: query.trim(), industry, operationId: createId.current });
      if (!result.ok || !result.topic) { setError(result.error || '新建失败'); return; }
      createId.current = ''; setQuery(''); await refreshTopics(); await openTopic(result.topic.id);
    } finally { setBusy(false); }
  }
  async function update(archived?: boolean) {
    if (!state.current || !await flush()) return;
    setBusy(true);
    try {
      const current = state.current;
      const result = await workbench.research({ action: 'update', topicId: current.topic.id, expectedVersion: current.version, ...(archived === undefined ? { title } : { archived }) });
      if (!result.ok) { setError(result.error || '修改失败'); return; }
      await reload(); await refreshTopics();
    } finally { setBusy(false); }
  }
  async function changeIndustry(industry: string) {
    if(busy || locked || !state.current || !await flush()) return;
    setBusy(true);
    try {
      const current=state.current;
      const result=await mutateResearch({action:'update',topicId:current.topic.id,industry,expectedVersion:current.version});
      if(!result.ok) { setError(result.error || '调整行业失败，原文件仍保留'); return; }
      setIndustry(industry); await refreshTopics();
    } finally { setBusy(false); }
  }
  async function quoteQuestion() {
    const current = state.current;
    if (!current || !selection) return;
    setBusy(true);
    try {
      const quote = quoteFromSelection({ path: current.topic.path, name: `${current.topic.title} · 研究笔记` }, selection);
      if (!await actions.current.flush()) return;
      await requestDocumentQuestion(quote); setSelection(null);
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  const filtered = topics.filter(topic => topic.archived === showArchived && `${topic.title} ${topic.industry}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <div className="research-workspace" style={{ display: visible ? undefined : 'none' }} ref={panel} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void flush(); } }}>
    <aside className="research-topics">
      <h2>主题研究</h2><input aria-label="搜索研究主题" placeholder="搜索或输入新主题名称" value={query} onChange={event => { setQuery(event.target.value); createId.current = ''; }} onKeyDown={event => { if (event.key === 'Enter' && query.trim()) void create(); }} />
      <select aria-label="新主题所属行业" value={industry} disabled={busy || locked} onChange={event=>{setIndustry(event.target.value);createId.current='';}}>{RESEARCH_INDUSTRIES.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select>
      <button type="button" disabled={busy || !query.trim()} onClick={() => void create()}>＋ 新建主题</button>
      <label><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} />查看已归档</label>
      <nav aria-label="研究主题列表">{filtered.map(topic => <button type="button" key={topic.id} className={topic.id === document?.topic.id ? 'active' : ''} onClick={() => void openTopic(topic.id)}><strong>{topic.title}</strong><small>{topic.industry} · {new Date(topic.updatedAt).toLocaleDateString()}</small></button>)}</nav>
      {!filtered.length && <p>创建一个主题，开始收集研究笔记。</p>}
    </aside>
    <div className="research-body">
      <div className="research-mobile-tabs"><button type="button" onClick={() => setMobileTab('notes')}>研究文档</button><button type="button" disabled={!source} onClick={() => setMobileTab('source')}>来源材料</button></div>
      {error && <div className="research-error" role="alert">{error}{conflict.current && <><button type="button" onClick={() => { void navigator.clipboard.writeText(content.current).then(() => setError('草稿已复制。可以载入磁盘版本后粘贴合并。')); }}>复制草稿</button><button type="button" onClick={() => { try { localStorage.setItem(`${draftKey(state.current!.topic.id)}.backup.${Date.now()}`,content.current); } catch { setError('草稿备份失败，请先复制草稿。'); return; } void reload(); }}>保留草稿备份并载入磁盘版本</button></>}</div>}
      <div className={`research-columns mobile-${mobileTab} ${source ? 'has-source' : ''}`}>
        <section className="research-document">
          {document ? <>
            <div className="research-document-tools"><input aria-label="研究主题名称" value={title} disabled={locked || busy} onChange={event => setTitle(event.target.value)} onBlur={() => { if (title.trim() && title !== document.topic.title) void update(); }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
              <select aria-label="当前主题所属行业" title="调整所属行业并移动主题文件夹" value={document.topic.industry} disabled={locked || busy || document.topic.archived} onChange={event=>void changeIndustry(event.target.value)}>{RESEARCH_INDUSTRIES.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select>
              <span aria-live="polite">{saving ? '保存中…' : locked ? '正在加入摘录…' : draft !== document.content ? '等待保存' : '已保存'}</span>
              <button type="button" disabled={busy || locked} onClick={() => void flush()}>保存</button>
              <button type="button" disabled={busy || locked} onClick={() => void update(!document.topic.archived)}>{document.topic.archived ? '恢复主题' : '归档'}</button>
              <CommentNavigation controller={comments} />
            </div>
            {comments.error && !comments.open && <div className="research-error" role="alert">{comments.error}</div>}
            <div className="material-reader-body"><div className="material-reader-document">
            <RichMarkdownEditor key={`${document.topic.id}:${document.topic.path}`} documentPath={document.topic.path} markdown={draft} externalRevision={revision} readOnly={locked || document.topic.archived}
              annotations={comments.annotations} sourceVersion={comments.source?.version} annotationTarget={comments.target ? { id: comments.target.annotation.id, nonce: comments.target.nonce } : undefined}
              onAnnotationClick={annotation=>comments.jump(annotation)} onAnnotationLocate={({found,rebased})=>comments.setNotice(!found ? '无法唯一定位此选段，评论内容仍然保留。' : rebased ? '原文有更新，已按唯一匹配的选段重新定位。' : '')}
              onReady={value => { editor.current = value; }} onSelection={setSelection} onChange={value => { if (!frozen.current) keepDraft(value); }} onBlur={() => { if (!frozen.current) void flush(); }} onOpenAnnotation={id => void openSource(id)} />
            </div><DocumentComments controller={comments} /></div>
          </> : <div className="research-welcome"><h2>把材料读成自己的研究</h2><p>创建主题后，在材料中划线、写评论或框选图表，点击“加入主题研究”。</p></div>}
        </section>
        {source && <section className="research-source"><div className="research-source-title"><strong>{source.markdown?.name || source.pdf?.name}</strong><button type="button" onClick={() => setSource(null)}>关闭来源</button></div>
          {source.warning && <div className="research-status">{source.warning}</div>}
          <MaterialReader key={`${source.markdown?.path || source.pdf?.path || source.word?.path}:${source.targetId}`} markdown={source.markdown} pdf={source.pdf} word={source.word} targetId={source.targetId} targetPage={source.page} onOpenAnnotation={id => void openSource(id)} />
        </section>}
      </div>
    </div>
    {visible && selection && <div className="research-capture research-question-selection" role="dialog" aria-label="研究笔记引用提问"
      style={{ left: Math.max(12, Math.min(selection.x, window.innerWidth - 240)), top: Math.max(60, Math.min(selection.y + 8, window.innerHeight - 80)) }}
      onMouseDown={event => event.preventDefault()}>
      <button type="button" disabled={busy || locked} onClick={() => void quoteQuestion()}>引用提问</button>
      <button type="button" disabled={busy || locked || comments.busy} onClick={() => { void comments.begin(selection); setSelection(null); }}>评论</button>
      <button type="button" aria-label="关闭引用工具" onClick={() => setSelection(null)}>×</button>
    </div>}
  </div>;
}
