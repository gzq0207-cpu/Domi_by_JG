import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import RichMarkdownEditor from './RichMarkdownEditor';
import { workbench } from './bridge';
import { mutateResearch, openResearchTopic } from './research-runtime';
import { RESEARCH_INDUSTRIES, researchIndustryForPath } from './research-industries';
import { quoteFromSelection, requestDocumentQuestion } from './document-question';
import DocumentComments, { CommentNavigation, useDocumentComments } from './DocumentComments';
import { notifyCommentsChanged } from './document-comments';
import { restoreMarkdownFromEditor } from './markdownDialect';
import type { MarkdownDocument, PdfDocument } from './env';
import type { ReadingAnnotation, ResearchSelection, ResearchTopic, WordDocument } from './research-types';
import WordResearchReader from './WordResearchReader';
import './research.css';
const PdfResearchReader = lazy(() => import('./PdfResearchReader'));
type Props = {
  markdown?: MarkdownDocument; pdf?: PdfDocument; word?:WordDocument; draft?: string;
  onChange?: (content: string) => void; onBlur?: () => void; onCopyDocument?: () => void; onBeforeComment?: () => Promise<boolean>;
  onOpenDocument?: (path: string) => void; initialSearchQuery?: string;
  targetId?: string; targetPage?: number; onOpenAnnotation?: (id: string) => void;
};
export default function MaterialReader({ markdown, pdf, word, draft, onChange, onBlur, onCopyDocument, onBeforeComment, onOpenDocument, initialSearchQuery, targetId, targetPage, onOpenAnnotation }: Props) {
  const path = markdown?.path || pdf?.path || word?.path || '';
  const richEditor = useRef<Editor | null>(null);
  const [editing, setEditing] = useState(Boolean(onChange && markdown?.content.includes('domiResearchId:')));
  async function prepareComment() {
    const editor = richEditor.current;
    if (onChange && markdown && editor?.isEditable && !editor.isDestroyed) {
      const frontmatter = markdown.content.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n?)/)?.[0] || '';
      onChange(frontmatter + restoreMarkdownFromEditor(editor.getMarkdown()));
    }
    return onBeforeComment ? onBeforeComment() : true;
  }
  const comments = useDocumentComments({ path, revision: markdown?.mtimeMs || pdf?.mtimeMs || word?.mtimeMs, expectedVersion:word?.version || pdf?.version, beforeCreate: prepareComment });
  const { source, annotations, refresh } = comments;
  const [selection, setSelection] = useState<ResearchSelection | null>(null), [existing, setExisting] = useState<ReadingAnnotation | null>(null);
  const [comment, setComment] = useState(''), [picker, setPicker] = useState(false);
  const [topics, setTopics] = useState<ResearchTopic[]>([]), [chosen, setChosen] = useState<string[]>([]), [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [showAnnotations, setShowAnnotations] = useState(false);
  const [addedTopics, setAddedTopics] = useState<ResearchTopic[]>([]);
  const [exportedPath,setExportedPath]=useState('');
  const [exportUnlocatedCount,setExportUnlocatedCount]=useState(0);
  const [industry,setIndustry] = useState(()=>researchIndustryForPath(path));
  const annotationId = useRef(''), operation = useRef(''), createOperation = useRef('');
  const annotationPopup = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!targetId) return;
    const annotation = annotations.find(item=>item.id === targetId);
    if (annotation?.comment) { comments.setActiveId(targetId); comments.setOpen(true); }
  }, [targetId, annotations]);
  useEffect(() => {
    if (!comments.target) return;
    annotationPopup.current = false;
    setSelection(null);
    if (comments.target.annotation.kind === 'document') {
      const content = root.current?.querySelector<HTMLElement>('.rich-markdown-scroll, .research-pdf-scroll, .word-reader-scroll'); if (content) content.scrollTop = 0;
    }
  }, [comments.target]);
  function capture(value: ResearchSelection | null) {
    if (busy) return;
    if (!value) { if (!annotationPopup.current) setSelection(null); return; }
    annotationPopup.current = false;
    setSelection(value); setExisting(null); setComment(''); setPicker(false); setChosen([]);
    annotationId.current = crypto.randomUUID(); operation.current = ''; setError(''); setNotice(''); setAddedTopics([]);
  }
  function editAnnotation(annotation: ReadingAnnotation) {
    if (annotation.kind === 'document') { comments.edit(annotation); return; }
    annotationPopup.current = true;
    const mark = root.current?.querySelector<HTMLElement>(`[data-reading-annotation="${annotation.id}"]`), rect = mark?.getBoundingClientRect();
    setSelection({ kind: annotation.kind, quote: annotation.quote, anchor: annotation.anchor, x: rect?.left || 80, y: rect?.bottom || 150 });
    setExisting(annotation); annotationId.current = annotation.id; operation.current = ''; setComment(annotation.comment); setPicker(false); setChosen([]); setError('');
    if (annotation.comment) { comments.setActiveId(annotation.id); comments.setOpen(true); }
  }
  async function persist() {
    if (!selection || !source) throw new Error('材料批注尚未就绪，请稍后重试。');
    if (existing) return existing;
    if (!await prepareComment()) throw new Error('文档草稿尚未保存，请先处理保存提示。');
    const current = await refresh(); if (!current?.source) throw new Error('材料批注尚未就绪，请重试。');
    const renderedVersion=word?.version || pdf?.version;if(renderedVersion&&renderedVersion!==current.source.version)throw new Error('原文已变化，请重新载入阅读器后再批注。');
    const result = await workbench.research({ action: 'annotate', id: annotationId.current, sourceId: current.source.id, sourceVersion: current.source.version,
      kind: selection.kind, anchor: selection.anchor, quote: selection.quote, comment, screenshot: selection.screenshot });
    if (!result.ok || !result.annotation) throw new Error(result.error || '保存批注失败');
    setExisting(result.annotation); notifyCommentsChanged(path); await refresh(); return result.annotation;
  }
  async function saveAnnotation() {
    setBusy(true); setError('');
    try { await persist(); setNotice('批注已保存'); } catch (e) { setError(String(e instanceof Error ? e.message : e)); } finally { setBusy(false); }
  }
  async function quoteQuestion() {
    if (!selection) return;
    setBusy(true); setError('');
    try {
      await requestDocumentQuestion(quoteFromSelection({ path, name: markdown?.name || pdf?.name || word?.name || path }, selection));
      setSelection(null);
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  async function chooseTopics() {
    setBusy(true); setError('');
    try {
      const annotation = await persist();
      const result = await workbench.research({ action: 'list' }); if (!result.ok) throw new Error(result.error);
      setTopics(result.topics || []); setChosen(annotation.topics.filter(topic => !topic.archived).map(topic => topic.id)); setQuery(''); setPicker(true);
    } catch (e) { setError(String(e instanceof Error ? e.message : e)); } finally { setBusy(false); }
  }
  async function addToTopics() {
    setBusy(true); setError('');
    try {
      await persist();
      if (!operation.current) operation.current = crypto.randomUUID();
      const result = await mutateResearch({ action: 'add', annotationId: annotationId.current, topicIds: chosen, operationId: operation.current });
      if (!result.ok) throw new Error(result.error);
      setAddedTopics(result.topics || []); setNotice(`已加入 ${result.topics?.length || 0} 个主题`); setPicker(false); await refresh();
    } catch (e) { setError(String(e instanceof Error ? e.message : e)); } finally { setBusy(false); }
  }
  async function createTopic() {
    if (!query.trim()) return;
    setBusy(true); setError('');
    try {
      if (!createOperation.current) createOperation.current = crypto.randomUUID();
      const result = await workbench.research({ action: 'create', title: query.trim(), industry, operationId: createOperation.current });
      if (!result.ok || !result.topic) throw new Error(result.error);
      setTopics(current => [result.topic!, ...current]); setChosen(current => [...current,result.topic!.id]); setQuery(''); createOperation.current = ''; operation.current = '';
      window.dispatchEvent(new Event('domi:research-changed'));
    } catch (e) { setError(String(e instanceof Error ? e.message : e)); } finally { setBusy(false); }
  }
  const valid = useMemo(() => pdf ? annotations.filter(item => item.kind !== 'document' && item.sourceVersion === (pdf.version || source?.version)) : annotations, [annotations, pdf, source?.version]);
  async function exportCopy(preserveUnlocated=false) {
    if(!source)return;setBusy(true);setError('');
    try {const result=await workbench.exportAnnotatedDocument({path,expectedVersion:word?.version || pdf?.version || source.version,preserveUnlocated});if(!result.ok){setExportUnlocatedCount(result.unlocatedCount || 0);throw new Error(result.error || '导出失败');}if(!result.canceled){setExportUnlocatedCount(0);setExportedPath(result.path || '');setNotice(`已导出 ${result.count} 条批注${result.unlocatedCount?`（${result.unlocatedCount} 条旧版批注已保留为文档评论）`:''}：${result.path}`);}}
    catch(error){setError(error instanceof Error?error.message:String(error));}finally{setBusy(false);}
  }
  const changed = annotations.filter(item=>item.kind !== 'document' && item.sourceVersion !== source?.version).length;
  const target = comments.target?.annotation.kind === 'document' ? undefined : comments.target;
  const navigation = target ? { id: target.annotation.id, nonce: target.nonce } : targetId ? { id: targetId, nonce: 0 } : undefined;
  return <div className="material-reader" ref={root}>
    <div className="research-reader-tools">
      {markdown && <><button type="button" aria-pressed={!editing} onClick={() => { setEditing(false); setSelection(null); onBlur?.(); }}>阅读</button>
        {onChange && <button type="button" aria-pressed={editing} onClick={() => { setEditing(true); setSelection(null); }}>编辑</button>}</>}
      <button type="button" aria-pressed={showAnnotations} onClick={() => setShowAnnotations(value => !value)}>批注 {annotations.length}</button>
      <CommentNavigation controller={comments} />
      {(pdf||word)&&<button type="button" disabled={busy||comments.busy||Boolean(comments.draft)||!annotations.length} onClick={()=>void exportCopy()}>导出带批注副本</button>}
      <span>{pdf ? '选中文字可引用提问，图表可框选加入主题研究' : editing ? '编辑模式 · 选中文字可引用提问' : '选中文字后可以引用提问、高亮或加入主题研究'}</span>
    </div>
    {error && <div className="research-error" role="alert">{error}</div>}
    {exportUnlocatedCount>0&&<div className="research-status"><button type="button" disabled={busy} onClick={()=>void exportCopy(true)}>将 {exportUnlocatedCount} 条失效批注保留为文档评论并导出</button></div>}
    {comments.error && !comments.open && <div className="research-error" role="alert">{comments.error}</div>}
    {changed > 0 && <div className="research-status">{changed} 条批注的来源版本已变化，保留记录供核对。</div>}
    {notice && <div className="research-status" role="status">{notice} {notice.startsWith('已导出')&&exportedPath&&<button type="button" onClick={()=>void workbench.openResource(exportedPath)}>打开副本</button>} {addedTopics.map(topic => <button key={topic.id} type="button" onClick={() => openResearchTopic(topic.id, annotationId.current)}>打开《{topic.title}》</button>)}</div>}
    {showAnnotations && <div className="research-annotation-list">{annotations.length ? annotations.map(annotation => <div key={annotation.id}>
      <button type="button" onClick={() => editAnnotation(annotation)}>{annotation.kind === 'document' ? '整篇文档' : annotation.quote.slice(0,120) || '图表摘录'}{annotation.comment && ` · ${annotation.comment}`}</button>
      {annotation.topics.map(topic => <button type="button" key={topic.id} onClick={() => openResearchTopic(topic.id, annotation.id)}>《{topic.title}》</button>)}
      {annotation.sourceVersion !== source?.version && <small>来源版本已变化</small>}
    </div>) : <p>还没有阅读批注</p>}</div>}
    <div className="material-reader-body"><div className="material-reader-document">
    {markdown ? <RichMarkdownEditor documentPath={markdown.path} markdown={draft ?? markdown.content} readOnly={!editing} annotations={valid} sourceVersion={source?.version} annotationTarget={navigation}
      onAnnotationLocate={({found,rebased})=>comments.setNotice(!found ? '无法唯一定位此选段，评论内容仍然保留。' : rebased ? '原文有更新，已按唯一匹配的选段重新定位。' : '')}
      onReady={editor=>{richEditor.current=editor;}} onSelection={capture} onAnnotationClick={editAnnotation} onChange={content => onChange?.(content)} onBlur={onBlur}
      onCopyDocument={onCopyDocument} onOpenDocument={onOpenDocument} initialSearchQuery={initialSearchQuery}
      onOpenAnnotation={onOpenAnnotation || (id => window.dispatchEvent(new CustomEvent('domi:open-annotation', { detail: { annotationId: id } })))} />
      : word ? <WordResearchReader document={word} annotations={valid} target={navigation} initialSearchQuery={initialSearchQuery} onSelection={capture} onAnnotation={editAnnotation} onLocate={({found,rebased})=>comments.setNotice(!found?'无法唯一定位此选段或图片，评论仍然保留。':rebased?'原文有更新，已按唯一匹配的选段定位。':'')} />
      : pdf && <Suspense fallback={<p>正在加载 PDF 阅读器…</p>}><PdfResearchReader document={pdf} annotations={valid} onSelection={capture} onAnnotation={editAnnotation} targetId={navigation?.id} targetNonce={navigation?.nonce} targetPage={target?.annotation.anchor.pages?.[0]?.page || targetPage} /></Suspense>}
    </div><DocumentComments controller={comments} /></div>
    {selection && <div className="research-capture" role="dialog" aria-label="阅读批注与主题研究"
      style={{ left: Math.max(12,Math.min(selection.x,window.innerWidth-380)), top: Math.max(60,Math.min(selection.y+8,window.innerHeight-(picker ? 480 : 180))) }}
      onMouseDown={event => { if (event.target instanceof Element && event.target.closest('button')) event.preventDefault(); }}>
      <div className="research-capture-actions">
        {selection.quote.trim() && <button type="button" disabled={busy} onClick={() => void quoteQuestion()}>引用提问</button>}
        <button type="button" disabled={busy || comments.busy} onClick={() => { annotationPopup.current = false; if (existing) comments.edit(existing); else void comments.begin(selection); setSelection(null); }}>评论</button>
        {!editing && !selection.snapshot && <><button type="button" disabled={busy || !source} onClick={() => void saveAnnotation()}>{existing ? '保存批注' : selection.kind==='region'?'保存图表摘录':'高亮'}</button>
          <button type="button" className="research-primary" disabled={busy || !source} onClick={() => void chooseTopics()}>加入主题研究</button></>}
        <button type="button" disabled={busy} aria-label="关闭批注工具" onClick={() => { annotationPopup.current = false; setSelection(null); }}>×</button>
      </div>
      {selection.screenshot && <img className="research-capture-preview" src={selection.screenshot} alt="选中的图表区域" />}
      {existing?.comment && <p className="research-capture-comment">{existing.comment}</p>}
      {existing?.topics.length ? <div className="research-linked-topics">已加入：{existing.topics.map(topic => <button key={topic.id} type="button" onClick={() => openResearchTopic(topic.id,existing.id)}>{topic.title}</button>)}</div> : null}
      {picker && <div className="research-topic-picker">
        <input autoFocus aria-label="搜索或新建研究主题" placeholder="搜索或新建主题" value={query} onChange={event => { setQuery(event.target.value); createOperation.current = ''; }} />
        <select aria-label="新主题所属行业" value={industry} onChange={event=>{setIndustry(event.target.value);createOperation.current='';}}>{RESEARCH_INDUSTRIES.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select>
        <div className="research-topic-options">{topics.filter(topic => !topic.archived && `${topic.title} ${topic.industry}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(topic => <label key={topic.id}>
          <input type="checkbox" aria-label={topic.title} checked={chosen.includes(topic.id)} onChange={() => { operation.current = ''; setChosen(current => current.includes(topic.id) ? current.filter(id => id !== topic.id) : [...current,topic.id]); }} />{topic.title}<small>{topic.industry}</small>
        </label>)}</div>
        {query.trim() && <button type="button" disabled={busy} onClick={() => void createTopic()}>新建主题《{query.trim()}》</button>}
        <button type="button" disabled={busy || !chosen.length} onClick={() => void addToTopics()}>{busy ? '保存中…' : `加入 ${chosen.length} 个主题`}</button>
      </div>}
    </div>}
  </div>;
}
