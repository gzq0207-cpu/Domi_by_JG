import type { AnnotationAnchor, ReadingAnnotation } from './research-types';
export const COMMENTS_CHANGED = 'domi:comments-changed';
export function orderedComments(annotations: readonly ReadingAnnotation[]) {
  const position = (annotation: ReadingAnnotation) => {
    if (annotation.kind === 'document') return [-1, 0, 0];
    const page = [...(annotation.anchor.pages || [])].sort((a,b) => a.page-b.page)[0];
    if (page) return [page.page, -Math.max(...page.rects.map(rect => Math.max(rect[1], rect[3])), 0), page.rects.length ? Math.min(...page.rects.map(rect => Math.min(rect[0], rect[2])) ) : 0];
    return [0, annotation.anchor.documentOffset ?? annotation.anchor.offset ?? Number.MAX_SAFE_INTEGER, 0];
  };
  return annotations.filter(item => item.comment.trim()).sort((a,b) => {
    const first = position(a), second = position(b);
    for (let index=0;index<first.length;index++) if (first[index] !== second[index]) return first[index]-second[index];
    return a.createdAt-b.createdAt || a.id.localeCompare(b.id);
  });
}
export function adjacentComment(comments: readonly ReadingAnnotation[], currentId: string, direction: -1 | 1) {
  if (!comments.length) return undefined;
  const index = comments.findIndex(item => item.id === currentId);
  return comments[index < 0 ? direction > 0 ? 0 : comments.length-1 : (index+direction+comments.length)%comments.length];
}
export function commentLocation(annotation: ReadingAnnotation) {
  return annotation.kind === 'document' ? '整篇文档' : annotation.anchor.pages?.length ? `第 ${annotation.anchor.pages.map(item=>item.page).join('、')} 页` : annotation.anchor.heading || (annotation.anchor.noteId ? '研究摘录' : '文档选段');
}
export function notifyCommentsChanged(path: string) { window.dispatchEvent(new CustomEvent(COMMENTS_CHANGED, { detail: { path } })); }
export function anchorRange(text: string, anchor: AnnotationAnchor, allowOffset = true) {
  if (!anchor.quote) return null;
  const matches: number[] = [];
  for (let offset = text.indexOf(anchor.quote); offset >= 0; offset = text.indexOf(anchor.quote, offset + 1)) {
    if (anchor.prefix && !text.slice(0, offset).endsWith(anchor.prefix)) continue;
    if (anchor.suffix && !text.slice(offset + anchor.quote.length).startsWith(anchor.suffix)) continue;
    matches.push(offset);
  }
  if (!matches.length && !allowOffset) {
    for (let offset = text.indexOf(anchor.quote); offset >= 0; offset = text.indexOf(anchor.quote, offset + 1)) matches.push(offset);
  }
  const start = matches.length === 1 ? matches[0] : allowOffset ? matches.find(offset => offset === anchor.offset) : undefined;
  return start === undefined ? null : { start, end: start + anchor.quote.length };
}
