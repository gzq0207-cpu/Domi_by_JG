import { workbench } from './bridge';
import type { ResearchRequest, ResearchResult } from './research-types';
type OpenDocument = { flush: () => Promise<boolean>; lock: (locked: boolean) => void; reload: () => Promise<void> };
const documents = new Set<OpenDocument>();
export function registerResearchDocument(document: OpenDocument) { documents.add(document); return () => { documents.delete(document); }; }
export async function flushResearchDocuments() {
  for (const document of documents) if (!await document.flush()) return false;
  return true;
}
let mutation = Promise.resolve<ResearchResult>({ ok: true });
export function mutateResearch(request: ResearchRequest): Promise<ResearchResult> {
  const next = mutation.catch(() => ({ ok: false })).then(async () => {
    const open = [...documents];
    open.forEach(document => document.lock(true));
    try {
      for (const document of open) if (!await document.flush()) return { ok: false, error: '请先处理研究文档的保存错误，草稿已保留。' };
      const result = await workbench.research(request);
      // Also reload after a partial multi-topic failure: committed notes remain
      // visible, while retrying the journal finishes the remaining topics.
      for (const document of open) await document.reload();
      window.dispatchEvent(new Event('domi:research-changed'));
      return result;
    } catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
    finally { open.forEach(document => document.lock(false)); }
  });
  mutation = next;
  return next;
}
export function openResearchTopic(topicId: string, annotationId?: string) {
  window.dispatchEvent(new CustomEvent('domi:open-research', { detail: { topicId, annotationId } }));
}
