import { memo, useEffect, useRef, useState } from "react";
import { AlertCircle, FileText, X } from "lucide-react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { workbench } from "./bridge";
import type { LibraryCitation, LibraryUsage } from "./env";
import { isLocalMarkdownResource, isLocalPdfResource } from "./document-resources";
import { stripDomiEntityResultMarker } from "./entity-routing";
import { codexFileCitationPath, domiEvidenceId, remarkCodexFileCitations } from "./message-citations";

type MessageContentMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  runId?: string;
  libraryUsage?: LibraryUsage;
};

function humanizeMessageStates(content: string) {
  return content
    .replace(/`?context_pending`?/gi, "“等待补充信息”")
    .replace(/`?context_ready`?/gi, "“信息已补充”")
    .replace(/`?transcript_ready`?/gi, "“文字稿已就绪”")
    .replace(/`?notes_project`?/gi, "“项目纪要已生成”")
    .replace(/`?notes_non_project`?/gi, "“非项目纪要已生成”");
}

const MessageContent = memo(function MessageContent({ message, onOpenDocument }: {
  message: MessageContentMessage;
  onOpenDocument: (resource: string) => void;
}) {
  const [inspected, setInspected] = useState<LibraryCitation | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [currentChecked, setCurrentChecked] = useState(false);
  const requestSequence = useRef(0);
  const panelRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const citations = message.libraryUsage?.citations || [];
  useEffect(() => () => { requestSequence.current += 1; }, [message.runId]);

  function closeInspector() {
    requestSequence.current += 1;
    setInspected(null);
    setChecking(false);
    setCurrentChecked(false);
    openerRef.current?.focus();
  }

  async function inspectCitation(citation: LibraryCitation, opener: HTMLButtonElement) {
    const sequence = ++requestSequence.current;
    openerRef.current = opener;
    setInspected(citation);
    setCheckError("");
    setCurrentChecked(false);
    setChecking(true);
    window.setTimeout(() => panelRef.current?.focus(), 0);
    try {
      if (!message.runId) throw new Error("这条历史回答没有运行标识，只能查看已保存的引文，不能核验当前版本。");
      const result = await workbench.verifyLibraryCitation({ runId: message.runId, citationId: citation.id });
      if (sequence !== requestSequence.current) return;
      if (!result.ok || !result.citation || result.citation.id !== citation.id) throw new Error(result.error || "无法核验当前来源版本。");
      setInspected(result.citation);
      setCurrentChecked(result.citation.status === "verified");
    } catch (error) {
      if (sequence === requestSequence.current) setCheckError(error instanceof Error ? error.message : String(error));
    } finally { if (sequence === requestSequence.current) setChecking(false); }
  }

  async function openInspectedSource() {
    if (!inspected || !message.runId || !currentChecked || checking) return;
    const sequence = ++requestSequence.current;
    setChecking(true);
    try {
      // Check again at the actual open action, not just when the inspector was
      // first opened. The host resolves IDs and never accepts a renderer path.
      const result = await workbench.verifyLibraryCitation({ runId: message.runId, citationId: inspected.id });
      if (sequence !== requestSequence.current) return;
      if (!result.ok || !result.citation || result.citation.id !== inspected.id) throw new Error(result.error || "引用回查失败。");
      setInspected(result.citation);
      setCurrentChecked(result.citation.status === "verified");
      if (result.citation.status !== "verified") return;
      const citation = result.citation;
      onOpenDocument(citation.pages.length ? `${citation.path}#page=${citation.pages[0]}` : `${citation.path}:${citation.startLine}`);
    } catch (error) {
      if (sequence === requestSequence.current) { setCurrentChecked(false); setCheckError(error instanceof Error ? error.message : String(error)); }
    } finally { if (sequence === requestSequence.current) setChecking(false); }
  }

  if (message.role !== "assistant") return <div className="message-text">{message.content}</div>;
  const displayContent = humanizeMessageStates(stripDomiEntityResultMarker(message.content));
  const audit = message.libraryUsage?.citationCheck;
  const citationWarning = audit && (audit.missing || audit.invalidCount > 0 || !audit.checked);

  return (
    <div className="message-text message-markdown">
      {citationWarning && <div className="message-citation-warning" role="status">
        <AlertCircle size={15} aria-hidden="true" />
        <span>{audit.issues.join(" ") || "本轮引用尚未完成核验，不代表结论已获得原文支持。"}</span>
      </div>}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCodexFileCitations]}
        urlTransform={(url, key, node) => {
          if (key === "href" && (codexFileCitationPath(url) || domiEvidenceId(url))) return url;
          if (key === "href" && (isLocalMarkdownResource(url) || isLocalPdfResource(url))) return url;
          return defaultUrlTransform(url);
        }}
        components={{
          table: ({ children, node: _node, ...props }) => (
            <div className="markdown-table-scroll" role="region" aria-label="表格，可左右滚动" tabIndex={0}>
              <table {...props}>{children}</table>
            </div>
          ),
          a: ({ href, children, title }) => {
            const evidenceId = domiEvidenceId(href);
            if (evidenceId) {
              const index = citations.findIndex((citation) => citation.id === evidenceId);
              const citation = citations[index];
              return <button type="button" className={`message-evidence-citation ${citation?.status === "verified" ? "" : "unverified"}`}
                disabled={!citation} aria-label={citation ? `查看引用 ${index + 1}：${citation.title}` : "引用未核验"}
                title={citation ? `${citation.title} · ${citation.kind === "inference" ? "分析推断" : "事实转述"} · 点击查看原文与核验结果` : "引用没有对应的宿主证据记录"}
                onClick={(event) => { if (citation) void inspectCitation(citation, event.currentTarget); }}>
                {citation ? `[${index + 1}]` : "[引用未核验]"}
              </button>;
            }
            const citationPath = codexFileCitationPath(href);
            const target = citationPath || href || "";
            return <a href={href} title={citationPath || title || href} className={citationPath ? "message-file-citation" : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (!target) return;
                if (isLocalMarkdownResource(target) || isLocalPdfResource(target)) onOpenDocument(target);
                else void workbench.openResource(target);
              }}>
              {citationPath && <FileText size={14} aria-hidden="true" />}<span>{children}</span>
            </a>;
          }
        }}
      >{displayContent}</ReactMarkdown>
      {inspected && <section className="message-evidence-inspector" aria-label="引用原文回查" tabIndex={-1} ref={panelRef}
        onKeyDown={(event) => { if (event.key === "Escape") closeInspector(); }}>
        <header><strong>{inspected.title}</strong><button type="button" aria-label="关闭引用回查" onClick={closeInspector}><X size={16} /></button></header>
        <div className="evidence-location">{[inspected.date, inspected.sectionTitle,
          inspected.pages.length ? `第 ${inspected.pages.join("、")} 页` : `第 ${inspected.startLine}–${inspected.endLine} 行`,
          `引用版本 ${inspected.version.slice(0, 8)}`].filter(Boolean).join(" · ")}</div>
        <div className="evidence-check-state" role="status">
          {checking ? "正在核验当前原文…" : currentChecked ? "原文、版本与读取范围已核验" : inspected.status === "stale" ? "原文已变更或不可读取 · 以下为引用时快照" : "引用未通过完整核验"}
          <span>{inspected.kind === "inference" ? "分析推断" : "事实／转述"}</span>
        </div>
        <div className="evidence-bound-claim"><small>绑定结论</small><p>{inspected.claim}</p></div>
        <small>引用时原文</small><blockquote>{inspected.quote}</blockquote>
        {inspected.issues.map((issue) => <p className="evidence-issue" key={issue}>{issue}</p>)}
        {checkError && <p className="evidence-issue" role="alert">{checkError}</p>}
        <footer><button type="button" disabled={!currentChecked || checking} onClick={() => void openInspectedSource()}><FileText size={14} />定位核验原文</button>
          <small>引文真实存在，不等于推断或结论必然正确。文件变更时不会跳转到新版冒充原引用。</small></footer>
      </section>}
    </div>
  );
}, (previous, next) => previous.message === next.message && previous.onOpenDocument === next.onOpenDocument);

export default MessageContent;
