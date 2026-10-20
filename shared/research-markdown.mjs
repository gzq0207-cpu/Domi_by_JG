// Portable, readable Markdown is the source of truth for a research document.
export const NOTE_END = '<!-- domi:note:end -->';
export function renderResearchNote(note, comment = note.comment || '') {
  const metadata = { id:note.id, annotationId:note.annotationId, quote:note.quote || '', sourceName:note.sourceName,
    sourcePath:note.sourcePath, sourceVersion:note.sourceVersion, location:note.location, createdAt:note.createdAt,
    ...(note.imagePath ? { imagePath:note.imagePath } : {}) };
  const header = JSON.stringify(metadata).replace(/</g, '\\u003c');
  const quote = String(note.quote || '').split('\n').map(line => `> ${line}`).join('\n');
  const fileLink = note.sourcePath ? ` · [打开材料](<${note.sourcePath.replace(/>/g,'%3E')}>)` : '';
  return `<!-- domi:note:start ${header} -->\n${quote}\n\n${note.imagePath ? `![图表摘录](<${note.imagePath}>)\n\n` : ''}**我的评论**\n\n<!-- domi:comment -->\n${comment.trim()}\n<!-- /domi:comment -->\n\n[来源：${String(note.sourceName).replace(/[\[\]\\]/g, '')} · ${note.location || '原文'}](domi-annotation:${note.annotationId})${fileLink}\n\n${NOTE_END}`;
}
export function parseResearchNote(raw) {
  if (!raw.startsWith('<!-- domi:note:start ')) return null;
  const match = raw.match(/^<!-- domi:note:start (\{[^\n]*\}) -->\r?\n([\s\S]*?)^<!-- domi:note:end -->/m);
  if (!match) return null;
  try {
    const note = JSON.parse(match[1]);
    if (!/^[a-zA-Z0-9-]{8,80}$/.test(note.id) || !/^[a-zA-Z0-9-]{8,80}$/.test(note.annotationId)) return null;
    const comment = match[2].match(/<!-- domi:comment -->\r?\n([\s\S]*?)\r?\n<!-- \/domi:comment -->/);
    if (!comment) return null;
    const quoted = match[2].match(/^(?:>[^\n]*(?:\r?\n|$))+/)?.[0];
    if (quoted !== undefined) note.quote = quoted.trimEnd().split(/\r?\n/).map(line => line.replace(/^> ?/, '')).join('\n');
    return { ...note, comment: comment[1], raw: match[0] };
  } catch { return null; }
}
export function researchNotes(markdown) {
  const result = [];
  const pattern = /^<!-- domi:note:start [^\n]* -->\r?\n[\s\S]*?^<!-- domi:note:end -->/gm;
  for (const match of markdown.matchAll(pattern)) {
    const note = parseResearchNote(match[0]);
    if (note) result.push({ ...note, offset: match.index });
  }
  return result;
}
export function appendResearchNote(markdown, note) {
  if (researchNotes(markdown).some(item => item.id === note.id)) return markdown;
  const heading = /^## 待整理笔记\s*$/m.exec(markdown);
  const block = `\n\n${renderResearchNote(note)}\n`;
  if (!heading) return `${markdown.trimEnd()}\n\n## 待整理笔记${block}`;
  const tail = markdown.slice(heading.index + heading[0].length);
  const next = /^#{1,2} /m.exec(tail);
  const at = next ? heading.index + heading[0].length + next.index : markdown.length;
  return `${markdown.slice(0, at).trimEnd()}${block}\n${markdown.slice(at)}`;
}
