import { Extension, Node as TiptapNode } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { parseResearchNote, renderResearchNote } from '../shared/research-markdown.mjs';
import { workbench } from './bridge';
import type { AnnotationAnchor, ReadingAnnotation, TopicNote } from './research-types';
import { anchorRange } from './document-comments';
export { anchorRange } from './document-comments';

export function editorTextIndex(doc: ProseMirrorNode) {
  let text = '';
  const positions: number[] = [];
  let blocks = 0;
  doc.descendants((node, position) => {
    if (node.isTextblock && blocks++ > 0) { text += '\n'; positions.push(-1); }
    if (node.isText && node.text) {
      text += node.text;
      for (let i = 0; i < node.text.length; i++) positions.push(position + i);
    }
  });
  return { text, positions };
}
export const readingAnnotationKey = new PluginKey('domi-reading-annotations');
export function readingAnnotationExtension(read: () => ReadingAnnotation[], version: () => string | undefined, target: () => {id:string;nonce:number} | undefined) {
  return Extension.create({
    name: 'readingAnnotations',
    addProseMirrorPlugins() {
      return [new Plugin({ key: readingAnnotationKey, props: {
        decorations(state) {
          const { text, positions } = editorTextIndex(state.doc);
          const decorations: Decoration[] = [];
          for (const annotation of read()) {
            if (annotation.kind === 'document' || annotation.anchor.noteId) continue;
            const range = anchorRange(text, annotation.anchor, !version() || annotation.sourceVersion === version());
            if (!range) continue;
            const mapped = positions.slice(range.start, range.end).filter(pos => pos >= 0);
            if (mapped.length) decorations.push(Decoration.inline(mapped[0], mapped[mapped.length - 1] + 1, {
              class: `reading-mark${target()?.id === annotation.id ? ' research-target' : ''}`, 'data-reading-annotation': annotation.id, title: annotation.comment || '阅读批注',
              ...(target()?.id === annotation.id ? { 'data-reading-target': String(target()?.nonce) } : {})
            }));
            if (mapped.length) decorations.push(Decoration.widget(mapped[0], () => {
              const marker = document.createElement('span'); marker.className = 'reading-annotation-anchor'; marker.dataset.readingAnnotation = annotation.id; marker.setAttribute('aria-hidden','true'); return marker;
            }, { key: annotation.id, side: -1 }));
          }
          return DecorationSet.create(state.doc, decorations);
        }
      } })];
    }
  });
}

export function researchNoteExtension(documentPath: string, openSource: (id: string) => void, annotations: () => ReadingAnnotation[], version: () => string | undefined, openAnnotation: (annotation: ReadingAnnotation) => void, target: () => {id:string;nonce:number} | undefined) {
  return TiptapNode.create({
    name: 'researchNote', group: 'block', content: 'block+', draggable: true, isolating: true,
    addAttributes: () => ({ snapshot: { default: null,
      parseHTML: element => { try { return JSON.parse(element.getAttribute('data-research-snapshot') || 'null'); } catch { return null; } },
      renderHTML: attributes => ({ 'data-research-snapshot': JSON.stringify(attributes.snapshot) })
    } }),
    parseHTML: () => [{ tag: 'article[data-research-note]' }],
    renderHTML: ({ HTMLAttributes }) => ['article', { ...HTMLAttributes, 'data-research-note': '' }, 0],
    markdownTokenizer: {
      name: 'researchNote', level: 'block',
      start: src => src.indexOf('<!-- domi:note:start '),
      tokenize(src, _tokens, lexer) {
        const note = parseResearchNote(src);
        if (!note) return;
        return { type: 'researchNote', raw: note.raw, note, tokens: lexer.blockTokens(note.comment || '\n') };
      }
    },
    parseMarkdown: (token, helpers) => {
      const { raw: _raw, comment: _comment, ...snapshot } = token.note;
      const content = helpers.parseChildren(token.tokens || []);
      return helpers.createNode('researchNote', { snapshot }, content.length ? content : [{ type: 'paragraph' }]);
    },
    renderMarkdown: (node, helpers) => renderResearchNote(node.attrs?.snapshot as TopicNote, helpers.renderChildren(node.content || [])),
    addNodeView() {
      return ({ node: initial, editor, getPos }) => {
        let current = initial;
        const dom = document.createElement('article');
        dom.className = 'research-note';
        dom.dataset.researchNote = initial.attrs.snapshot?.id || '';
        dom.dataset.annotationId = initial.attrs.snapshot?.annotationId || '';
        const fixed = document.createElement('div'); fixed.contentEditable = 'false';
        const quote = document.createElement('blockquote');
        const image = document.createElement('img'); image.alt = '图表摘录'; image.hidden = true;
        const actions = document.createElement('div'); actions.className = 'research-note-actions';
        const drag = document.createElement('span'); drag.textContent = '⠿'; drag.title = '拖动摘录块'; drag.setAttribute('data-drag-handle', ''); drag.draggable = true;
        const source = document.createElement('button'); source.type = 'button';
        source.onclick = () => openSource(current.attrs.snapshot.annotationId);
        const move = document.createElement('select'); move.setAttribute('aria-label', '移动摘录到章节');
        const refreshHeadings = () => {
          move.replaceChildren(new Option('移动到章节…', ''));
          editor.state.doc.forEach((child, pos) => { if (child.type.name === 'heading') move.add(new Option(child.textContent, String(pos))); });
        };
        move.onfocus = refreshHeadings;
        move.onchange = () => {
          if (!editor.isEditable) return;
          const from = getPos(); if (typeof from !== 'number' || !move.value) return;
          const heading = Number(move.value), targetNode = editor.state.doc.nodeAt(heading);
          if (!targetNode) return;
          const tr = editor.state.tr.delete(from, from + current.nodeSize);
          const target = tr.mapping.map(heading + targetNode.nodeSize);
          tr.insert(target, current); editor.view.dispatch(tr.scrollIntoView()); move.value = '';
        };
        refreshHeadings();
        editor.on('create',refreshHeadings);
        editor.on('update',refreshHeadings);
        requestAnimationFrame(() => { if (!editor.isDestroyed) refreshHeadings(); });
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '移除'; remove.title = '仅从本主题移除';
        remove.onclick = () => { if (!editor.isEditable) return; const pos = getPos(); if (typeof pos === 'number') editor.view.dispatch(editor.state.tr.delete(pos, pos + current.nodeSize)); };
        actions.append(drag, source, move, remove);
        const label = document.createElement('small'); label.textContent = '我的评论';
        fixed.append(actions, quote, image, label);
        const contentDOM = document.createElement('div'); contentDOM.className = 'research-note-comment';
        dom.append(fixed, contentDOM);
        let alive = true;
        let quoteSignature = '';
        const render = () => {
          const note = current.attrs.snapshot as TopicNote | null;
          if (!note) { quote.textContent = '摘录元数据无效，请撤销本次粘贴或从原文重新加入。'; return; }
          const marks = annotations().filter(item => item.anchor.noteId === note.id && item.kind === 'text').flatMap(item => {
            const range = anchorRange(note.quote, item.anchor, !version() || item.sourceVersion === version()); return range ? [{ ...range, annotation: item }] : [];
          });
          const signature = JSON.stringify([note.quote, marks.map(item=>[item.start,item.end,item.annotation.id,item.annotation.updatedAt]),target()]);
          if (signature !== quoteSignature) {
            quoteSignature = signature; quote.replaceChildren();
            const boundaries = [...new Set([0,note.quote.length,...marks.flatMap(item=>[item.start,item.end])])].sort((a,b)=>a-b);
            for (let index=0;index<boundaries.length-1;index++) {
              const start=boundaries[index], end=boundaries[index+1], matching=marks.filter(item=>item.start<=start && item.end>=end);
              if (!matching.length) quote.append(document.createTextNode(note.quote.slice(start,end)));
              else {
                const mark=document.createElement('span'); mark.className=`reading-mark${matching.some(item=>item.annotation.id===target()?.id) ? ' research-target' : ''}`; mark.dataset.readingAnnotation=matching[0].annotation.id;
                mark.dataset.readingAnnotations=matching.map(item=>item.annotation.id).join(' '); mark.textContent=note.quote.slice(start,end);
                mark.title=matching.map(item=>item.annotation.comment).filter(Boolean).join('\n'); mark.onclick=()=>openAnnotation(matching[0].annotation); quote.append(mark);
              }
            }
          }
          quote.hidden = !note.quote;
          source.textContent = `${note.sourceName} · ${note.location}`;
          source.title = `回到原文 · ${new Date(note.createdAt).toLocaleString()}`;
          if (note.imagePath) void workbench.resolveMarkdownImage({ documentPath, source: note.imagePath }).then(result => {
            if (alive && result.ok && result.previewUrl) { image.src = result.previewUrl; image.hidden = false; }
          });
        };
        const refreshAnnotations = ({ transaction }: { transaction: { getMeta: (key: PluginKey) => unknown } }) => { if (transaction.getMeta(readingAnnotationKey)) render(); };
        editor.on('transaction', refreshAnnotations);
        render();
        return { dom, contentDOM,
          update(next) { if (next.type !== initial.type) return false; current = next; render(); return true; },
          stopEvent(event) { return fixed.contains(event.target as globalThis.Node) && event.type !== 'dragstart'; },
          // Read-only snapshots use the browser's native text selection. Do
          // not map it into the editable comment and collapse the selection.
          ignoreMutation(mutation) { return fixed.contains(mutation.target); },
          destroy() { alive = false; editor.off('create',refreshHeadings); editor.off('update',refreshHeadings); editor.off('transaction', refreshAnnotations); }
        };
      };
    }
  });
}
