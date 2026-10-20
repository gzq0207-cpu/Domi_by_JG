import type { DocumentLibraryNode, LocalAttachment, SourceScope } from './env';
import { documentPathKey } from './document-question';
import { validateDocumentScope } from './document-scope';

export type DocumentMention = { start: number; end: number; query: string };
export type MentionDocument = LocalAttachment & { relativePath: string; mtimeMs: number };

// The caret, rather than the end of the question, determines the active query.
// ASCII word/email/URL prefixes do not trigger mentions; Chinese prose may
// touch the @ directly. Spaces in file names are allowed, newlines are not.
export function documentMentionAt(text: string, start: number, end = start): DocumentMention | null {
  if (start !== end || start < 0 || start > text.length) return null;
  const prefix = text.slice(0, start);
  const at = Math.max(prefix.lastIndexOf('@'), prefix.lastIndexOf('＠'));
  if (at < 0 || (at > 0 && /[a-z\d._%+\-/:\\@＠]/i.test(text[at - 1]))) return null;
  const query = text.slice(at + 1, start);
  return /[\r\n@＠]/.test(query) || query.length > 120 ? null : { start: at, end: start, query };
}

export function mentionDocuments(nodes: readonly DocumentLibraryNode[]): MentionDocument[] {
  const files: MentionDocument[] = [];
  const seen = new Set<string>();
  function walk(branch: readonly DocumentLibraryNode[]) {
    for (const node of branch) {
      if (node.kind === 'folder') { walk(node.children || []); continue; }
      const key = documentPathKey(node.path);
      if (seen.has(key)) continue;
      seen.add(key);
      files.push({ path: node.path, name: node.displayName || node.name, size: node.size,
        relativePath: node.relativePath, mtimeMs: node.mtimeMs });
    }
  }
  walk(nodes);
  return files.sort((a, b) => b.mtimeMs - a.mtimeMs || a.relativePath.localeCompare(b.relativePath));
}

export function matchMentionDocuments(files: readonly MentionDocument[], query: string, limit = 8): MentionDocument[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return files.filter(file => {
    const text = `${file.name}\n${file.relativePath}`.toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  }).sort((a, b) => {
    const titleMatch = (file: MentionDocument) => terms.every(term => file.name.toLocaleLowerCase().includes(term));
    return Number(titleMatch(b)) - Number(titleMatch(a));
  }).slice(0, limit);
}

export function removeDocumentMention(text: string, mention: DocumentMention) {
  if (!['@', '＠'].includes(text[mention.start]) || text.slice(mention.start + 1, mention.end) !== mention.query) {
    throw new Error('提问内容已变化，请重新输入 @ 选择文档。');
  }
  return text.slice(0, mention.start) + text.slice(mention.end);
}

export function addMentionToDraft<T extends { input: string; attachments: LocalAttachment[]; sourceScope?: SourceScope; selectedWorkflowId?: string; attachmentError: string }>(
  draft: T, file: LocalAttachment, mention: DocumentMention
) {
  const input = removeDocumentMention(draft.input, mention);
  const attachments = draft.attachments.some(item => documentPathKey(item.path) === documentPathKey(file.path))
    ? draft.attachments : [...draft.attachments, { name: file.name, path: file.path, size: file.size }];
  validateDocumentScope('selected', attachments);
  // @ is an explicit request to ground the answer in these documents, even
  // when the previous draft used model/both/library/research or a workflow.
  return { ...draft, input, attachments, sourceScope: 'selected' as const, selectedWorkflowId: undefined, attachmentError: '' };
}
