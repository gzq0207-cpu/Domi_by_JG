import { useEffect, useRef, useState } from 'react';
import { workbench } from './bridge';
import { adjacentComment, COMMENTS_CHANGED, commentLocation, notifyCommentsChanged, orderedComments } from './document-comments';
import { documentPathKey } from './document-question';
import type { AnnotationAnchor, ReadingAnnotation, ResearchSelection, SourceIdentity } from './research-types';

type Draft = { id: string; annotation?: ReadingAnnotation; kind: ReadingAnnotation['kind']; anchor: AnnotationAnchor; quote: string; comment: string; sourceVersion: string; screenshot?: string };
export type CommentTarget = { annotation: ReadingAnnotation; nonce: number };
export function useDocumentComments({ path, revision, expectedVersion, beforeCreate }: { path: string; revision?: string | number; expectedVersion?:string; beforeCreate?: () => Promise<boolean> }) {
  const [source, setSource] = useState<SourceIdentity | null>(null), [annotations, setAnnotations] = useState<ReadingAnnotation[]>([]);
  const [open, setOpen] = useState(false), [activeId, setActiveId] = useState(''), [target, setTarget] = useState<CommentTarget | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const alive = useRef(true), serial = useRef(0), restored = useRef(''), sourceRef = useRef(source), draftRef = useRef(draft);
  const livePath = useRef(path), navigationSerial = useRef(0); livePath.current = path;
  sourceRef.current = source; draftRef.current = draft;
  const cacheKey = (sourceId: string) => `domi.comment-draft.${sourceId}`;
  useEffect(() => {
    sourceRef.current = null; draftRef.current = null; restored.current = '';
    setSource(null); setAnnotations([]); setDraft(null); setTarget(null); setActiveId(''); setOpen(false); setError(''); setNotice(''); setConflict(false);
  }, [path]);
  function keepDraft(value: Draft | null) {
    const current = sourceRef.current;
    if (current) try { if (value) localStorage.setItem(cacheKey(current.id), JSON.stringify(value)); else localStorage.removeItem(cacheKey(current.id)); }
    catch { setError('评论草稿缓存失败，请先保存评论后再关闭文档。'); }
    draftRef.current = value; setDraft(value);
  }
  async function refresh() {
    if (!path) return null;
    const ticket = ++serial.current;
    const result = await workbench.research({ action: 'source', path });
    if (!alive.current || livePath.current !== path) return null;
    if (ticket !== serial.current) return result.ok ? result : null;
    if (!result.ok || !result.source) { setError(result.error || '无法读取文档评论'); return null; }
    sourceRef.current = result.source; setSource(result.source); setAnnotations(result.annotations || []);
    if (restored.current !== result.source.id) {
      restored.current = result.source.id;
      try {
        const saved = JSON.parse(localStorage.getItem(cacheKey(result.source.id)) || 'null');
        if (saved && typeof saved.id === 'string' && typeof saved.comment === 'string' && typeof saved.quote === 'string' && typeof saved.sourceVersion === 'string'
          && ['text','region','document'].includes(saved.kind) && saved.anchor && typeof saved.anchor.quote === 'string') {
          draftRef.current = saved; setDraft(saved); setOpen(true); setNotice('已恢复未保存的评论草稿。');
        }
      } catch { setError('无法读取评论草稿缓存'); }
    }
    return result;
  }
  const refreshRef = useRef(refresh); refreshRef.current = refresh;
  useEffect(() => {
    alive.current = true;
    const load = () => void refreshRef.current().catch(error=>{ if (alive.current) setError(error instanceof Error ? error.message : '读取文档评论失败'); });
    load();
    const changed = (event: Event) => { if (documentPathKey((event as CustomEvent).detail?.path || '') === documentPathKey(path)) load(); };
    window.addEventListener(COMMENTS_CHANGED, changed);
    return () => { alive.current = false; serial.current++; window.removeEventListener(COMMENTS_CHANGED, changed); };
  }, [path, revision]);
  const comments = orderedComments(annotations);
  function jump(annotation: ReadingAnnotation) {
    if (draftRef.current) { setNotice('请先保存或取消当前评论草稿，再逐条跳转。'); return; }
    setActiveId(annotation.id); setOpen(true); setError('');
    if (annotation.kind !== 'document' && sourceRef.current?.kind === 'pdf' && annotation.sourceVersion !== sourceRef.current.version) {
      setNotice('原文版本已变化，无法可靠定位此 PDF 评论；评论内容仍然保留。'); setTarget(null); return;
    }
    setNotice(''); setTarget({ annotation, nonce: ++navigationSerial.current });
  }
  async function begin(selection?: ResearchSelection) {
    if (busy || draftRef.current) { setOpen(true); return; }
    setBusy(true); setError(''); setConflict(false);
    try {
      if (beforeCreate && !await beforeCreate()) throw new Error('文档草稿尚未保存，请先处理保存提示，再添加评论。');
      const current = await refresh();
      if (!current?.source) throw new Error('文档评论尚未就绪，请重试。');
      if(expectedVersion && expectedVersion!==current.source.version)throw new Error('原文已变化，请重新载入阅读器后再添加评论；当前选段未写入新版本。');
      sourceRef.current = current.source; setSource(current.source);
      keepDraft({ id: crypto.randomUUID(), kind: selection?.kind || 'document', anchor: selection?.anchor || { quote: '' }, quote: selection?.quote || '', comment: '',
        sourceVersion: current.source.version, screenshot: selection?.screenshot });
      setOpen(true); setNotice('');
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  function edit(annotation: ReadingAnnotation) {
    if (draftRef.current) { setNotice('请先保存或取消当前评论草稿。'); return; }
    setActiveId(annotation.id); setOpen(true); setError(''); setConflict(false);
    keepDraft({ id: annotation.id, annotation, kind: annotation.kind, anchor: annotation.anchor, quote: annotation.quote, comment: annotation.comment, sourceVersion: annotation.sourceVersion });
  }
  async function save() {
    const value = draftRef.current, current = sourceRef.current;
    if (!value || !current || !value.comment.trim() || busy) return;
    setBusy(true); setError('');
    try {
      if (!value.annotation && beforeCreate && !await beforeCreate()) throw new Error('文档草稿尚未保存，评论草稿已保留。');
      const result = await workbench.research(value.annotation
        ? { action: 'updateComment', annotationId: value.id, comment: value.comment, expectedUpdatedAt: value.annotation.updatedAt }
        : { action: 'annotate', id: value.id, sourceId: current.id, sourceVersion: value.sourceVersion, kind: value.kind, anchor: value.anchor, quote: value.quote, comment: value.comment, screenshot: value.screenshot });
      if (!result.ok || !result.annotation) { setConflict(Boolean(result.conflict)); throw new Error(result.error || '保存评论失败，草稿已保留。'); }
      const annotation = result.annotation;
      if (!alive.current || sourceRef.current?.id !== current.id) {
        localStorage.removeItem(cacheKey(current.id)); notifyCommentsChanged(path); return;
      }
      setAnnotations(items => [...items.filter(item => item.id !== annotation.id), annotation]);
      keepDraft(null); setConflict(false); setActiveId(annotation.id); setNotice('评论已保存');
      notifyCommentsChanged(path);
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  async function reloadForMerge() {
    const value = draftRef.current, current = sourceRef.current;
    if (!value?.annotation || !current || busy) return;
    setBusy(true);
    try {
      const result = await refresh();
      if (!result || sourceRef.current?.id !== current.id) return;
      const latest = result.annotations?.find(item=>item.id === value.id);
      if (!latest) throw new Error('这条评论已被删除，输入框中的草稿仍然保留。');
      keepDraft({ ...value, annotation: latest }); setConflict(false); setError('');
      setNotice('已载入最新评论（见下方列表），输入框中的草稿已保留；请合并后再保存。');
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  async function remove(annotation: ReadingAnnotation) {
    if (busy || draftRef.current) return;
    const current = sourceRef.current;
    setBusy(true); setError('');
    try {
      const result = await workbench.research({ action: 'removeComment', annotationId: annotation.id, expectedUpdatedAt: annotation.updatedAt });
      if (!result.ok) throw new Error(result.error || '删除评论失败');
      if (!alive.current || sourceRef.current?.id !== current?.id) { notifyCommentsChanged(path); return; }
      setAnnotations(items => result.annotation ? items.map(item => item.id === annotation.id ? result.annotation! : item) : items.filter(item => item.id !== annotation.id));
      if (activeId === annotation.id) { setActiveId(''); setTarget(null); }
      setNotice('评论已删除，已有摘录和来源定位仍然保留。'); notifyCommentsChanged(path);
    } catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  function next(direction: -1 | 1) { const annotation = adjacentComment(comments, activeId, direction); if (annotation) jump(annotation); }
  const current = Boolean(source && documentPathKey(source.path) === documentPathKey(path));
  return { source: current ? source : null, annotations: current ? annotations : [], comments: current ? comments : [], open: current && open, setOpen, activeId, setActiveId, target: current ? target : null, draft: current ? draft : null, busy, error, notice, conflict, setNotice, refresh, begin, edit, save, remove, next, jump, reloadForMerge,
    updateDraft: (comment: string) => { if (draftRef.current) keepDraft({ ...draftRef.current, comment }); }, cancel: () => { keepDraft(null); setError(''); setConflict(false); } };
}
type Controller = ReturnType<typeof useDocumentComments>;
export function CommentNavigation({ controller }: { controller: Controller }) {
  const { comments, activeId, busy, draft } = controller;
  return <div className="document-comment-navigation" role="group" aria-label="逐条浏览评论">
    <button type="button" onClick={() => controller.setOpen(!controller.open)} aria-pressed={controller.open}>评论 {comments.length}</button>
    <button type="button" aria-label="上一条评论" disabled={!comments.length || busy || Boolean(draft)} onClick={() => controller.next(-1)}>上一条</button>
    <output aria-label="评论导航位置" aria-live="polite">{Math.max(0, comments.findIndex(item=>item.id === activeId)+1)} / {comments.length}</output>
    <button type="button" aria-label="下一条评论" disabled={!comments.length || busy || Boolean(draft)} onClick={() => controller.next(1)}>下一条</button>
    <button type="button" disabled={busy} onClick={() => void controller.begin()}>新增评论</button>
  </div>;
}
export default function DocumentComments({ controller }: { controller: Controller }) {
  if (!controller.open) return null;
  return <aside className="document-comments" aria-label="文档评论">
    <header><strong>文档评论</strong><button type="button" aria-label="收起评论列表" onClick={() => controller.setOpen(false)}>×</button></header>
    {controller.error && <p className="research-error" role="alert">{controller.error}</p>}
    {controller.notice && <p className="research-status" role="status">{controller.notice}</p>}
    {controller.draft && <div className="document-comment-draft">
      <strong>{controller.draft.annotation ? '编辑评论' : controller.draft.kind === 'document' ? '整篇文档评论' : '选段评论'}</strong>
      {controller.draft.quote && <blockquote>{controller.draft.quote}</blockquote>}
      {controller.draft.screenshot && <img className="research-capture-preview" src={controller.draft.screenshot} alt="评论所选图表" />}
      <textarea autoFocus aria-label="文档评论草稿" maxLength={100_000} placeholder="写下你的评论…" value={controller.draft.comment} onChange={event => controller.updateDraft(event.target.value)} />
      {controller.conflict && <button type="button" disabled={controller.busy} onClick={()=>void controller.reloadForMerge()}>载入最新评论并保留草稿</button>}
      <div><button type="button" disabled={controller.busy || !controller.draft.comment.trim()} onClick={() => void controller.save()}>保存评论</button><button type="button" disabled={controller.busy} onClick={controller.cancel}>取消</button></div>
    </div>}
    <div className="document-comment-items">{controller.comments.map((annotation, index) => <article key={annotation.id} className={controller.activeId === annotation.id ? 'active' : ''}>
      <button type="button" className="document-comment-jump" disabled={Boolean(controller.draft)} onClick={() => controller.jump(annotation)} aria-label={`定位评论 ${index+1}`}><strong>{index+1} · {commentLocation(annotation)}</strong>{annotation.quote && <blockquote>{annotation.quote}</blockquote>}<p>{annotation.comment}</p></button>
      {annotation.kind !== 'document' && annotation.sourceVersion !== controller.source?.version && <small>原文有更新，定位时将核对选段</small>}
      <footer><time>{new Date(annotation.createdAt).toLocaleString()}</time><button type="button" disabled={controller.busy || Boolean(controller.draft)} aria-label={`编辑评论 ${index+1}`} onClick={() => controller.edit(annotation)}>编辑</button><button type="button" disabled={controller.busy || Boolean(controller.draft)} aria-label={`删除评论 ${index+1}`} onClick={() => void controller.remove(annotation)}>删除</button></footer>
    </article>)}</div>
    {!controller.comments.length && !controller.draft && <p>选中文字写评论，或点击“新增评论”评论整篇文档。</p>}
  </aside>;
}
