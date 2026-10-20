import type { DocumentLibraryNode, LocalAttachment, SourceScope } from "./env";

export const MAX_SCOPE_DOCUMENTS = 64;
export function isSelectedDocumentScope(scope?: SourceScope) { return scope === 'selected' || scope === 'both'; }

export function scopeDocuments(nodes: readonly DocumentLibraryNode[]): LocalAttachment[] {
  return nodes.flatMap((node) => node.kind === "folder"
    ? scopeDocuments(node.children || [])
    : [{ name: node.displayName || node.name, path: node.path, size: node.size }]);
}

export function filterScopeNodes(nodes: readonly DocumentLibraryNode[], query: string): DocumentLibraryNode[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [...nodes];
  return nodes.flatMap((node) => {
    const haystack = `${node.displayName || node.name}\n${node.relativePath}`.toLocaleLowerCase();
    // Matching a folder includes its existing descendants, so selecting it
    // still creates an explicit file snapshot rather than a directory grant.
    if (terms.every((term) => haystack.includes(term))) return [node];
    if (node.kind !== "folder") return [];
    const children = filterScopeNodes(node.children || [], query);
    return children.length ? [{ ...node, children }] : [];
  });
}

export function validateDocumentScope(scope: SourceScope | undefined, files: readonly LocalAttachment[]) {
  if (isSelectedDocumentScope(scope) && !files.length) throw new Error("请先点击「选择文档」或「＋」添加材料；已有资料与 Both 模式不会自动搜索全库。");
  if (isSelectedDocumentScope(scope) || scope === "library") {
    if (files.length > MAX_SCOPE_DOCUMENTS) throw new Error(`每轮最多选择 ${MAX_SCOPE_DOCUMENTS} 份材料，请缩小文档范围。`);
    if (files.some((file) => !/\.(?:md|markdown|txt|pdf|docx|doc)$/i.test(file.path))) {
      throw new Error("受限资料问答支持 Markdown、文本、PDF 和 Word；请先转换其他格式，或明确选择联网研究模式。");
    }
  }
}

export function remainingScopeDraft<T extends { input: string; attachments: LocalAttachment[]; attachmentError: string; sourceScope?: SourceScope; selectedWorkflowId?: string; documentQuotes?: unknown[] }>(draft: T): T {
  return { ...draft, input: "", attachmentError: "", selectedWorkflowId: undefined,
    ...(draft.documentQuotes ? { documentQuotes: [] } : {}),
    attachments: isSelectedDocumentScope(draft.sourceScope) || draft.sourceScope === 'model' ? draft.attachments : [] };
}
