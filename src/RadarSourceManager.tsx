import {
  AlertCircle,
  ExternalLink,
  Check,
  KeyRound,
  MessageSquareText,
  Mic2,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Upload,
  Trash2,
  Twitter,
  X,
  Youtube
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { workbench } from "./bridge";
import { useAppConfirm } from "./AppConfirmDialog";
import type {
  PodcastJob,
  RadarSource,
  RadarSourceBulkImportResult,
  RadarSourceKind,
  RadarSourceSaveRequest,
  RadarSourceSnapshot,
  TwitterItem
} from "./env";

type RadarSourceManagerProps = {
  open: boolean;
  onClose: () => void;
  onSnapshot?: (snapshot: RadarSourceSnapshot) => void;
};

type SourceDraft = {
  id?: string;
  kind: RadarSourceKind;
  name: string;
  url: string;
  priority: "normal" | "important";
  keywords: string;
  enabled: boolean;
  autoProcess: boolean;
};

const EMPTY_DRAFT: SourceDraft = {
  kind: "news",
  name: "",
  url: "",
  priority: "normal",
  keywords: "",
  enabled: true,
  autoProcess: false
};

const TABS: Array<{ kind: RadarSourceKind; label: string; icon: typeof Newspaper }> = [
  { kind: "news", label: "新闻源", icon: Newspaper },
  { kind: "wechat", label: "重点公众号", icon: MessageSquareText },
  { kind: "podcast", label: "播客", icon: Mic2 },
  { kind: "youtube_channel", label: "YouTube 频道", icon: Youtube },
  { kind: "twitter", label: "X 大V", icon: Twitter }
];

const PODCAST_LIKE_KINDS: RadarSourceKind[] = ["podcast", "youtube_channel"];

function isPodcastLikeKind(kind: RadarSourceKind) {
  return PODCAST_LIKE_KINDS.includes(kind);
}

function sourceUrlLabel(kind: RadarSourceKind) {
  if (kind === "podcast") return "RSS、节目页、公开单集或 YouTube 视频链接";
  if (kind === "youtube_channel") return "YouTube 频道或播放列表链接";
  if (kind === "twitter") return "X 主页链接";
  return "网址";
}

function sourceUrlPlaceholder(kind: RadarSourceKind) {
  if (kind === "youtube_channel") return "https://www.youtube.com/@频道名";
  if (kind === "twitter") return "https://x.com/用户名";
  return "https://";
}

function sourceUrlError(kind: RadarSourceKind) {
  if (kind === "podcast") return "请粘贴播客 RSS、节目页、公开单集或 YouTube 视频链接。";
  if (kind === "youtube_channel") return "请粘贴 YouTube 频道（@频道、/channel/UC…、/c/…）或播放列表链接。";
  if (kind === "twitter") return "请粘贴形如 https://x.com/用户名 的 X 主页链接。";
  return "请粘贴新闻源网址。";
}

function sourceDraft(source: RadarSource): SourceDraft {
  return {
    id: source.id,
    kind: source.kind,
    name: source.name,
    url: source.url,
    priority: source.priority,
    keywords: source.keywords.join("，"),
    enabled: source.enabled,
    autoProcess: source.autoProcess
  };
}

function splitKeywords(value: string) {
  return [...new Set(value.split(/[,，;；\n]/).map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

function podcastStatus(job: PodcastJob) {
  if (job.status === "transcript_ready") return "文字稿已就绪";
  if (job.status === "transcribing") return "正在生成文字稿";
  if (job.status === "downloading") return "正在下载公开音频";
  if (job.status === "downloaded") return "音频已下载";
  if (job.status === "failed") return "处理失败";
  if (job.status === "skipped") return "已跳过";
  return "等待处理";
}

export default function RadarSourceManager({
  open,
  onClose,
  onSnapshot
}: RadarSourceManagerProps) {
  const { confirm, confirmDialog } = useAppConfirm();
  const [tab, setTab] = useState<RadarSourceKind>("news");
  const [snapshot, setSnapshot] = useState<RadarSourceSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<SourceDraft | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportFileName, setBulkImportFileName] = useState("");
  const [bulkImportKeywords, setBulkImportKeywords] = useState("");
  const [bulkImportImportant, setBulkImportImportant] = useState(true);
  const [bulkImportPreview, setBulkImportPreview] = useState<RadarSourceBulkImportResult | null>(null);
  const [bulkImportBusy, setBulkImportBusy] = useState(false);
  const bulkImportFileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [twitterTokenDraft, setTwitterTokenDraft] = useState("");
  const [twitterTokenSaving, setTwitterTokenSaving] = useState(false);
  const [twitterTokenConfigured, setTwitterTokenConfigured] = useState(false);

  const sources = useMemo(
    () => (snapshot?.sources || []).filter((source) => source.kind === tab),
    [snapshot, tab]
  );
  const podcastSourceIds = useMemo(
    () => new Set(sources.map((source) => source.id)),
    [sources]
  );
  const jobs = useMemo(
    () => (snapshot?.jobs || [])
      .filter((job) => isPodcastLikeKind(tab) && podcastSourceIds.has(job.sourceId))
      .sort((left, right) => (right.publishedAt || right.discoveredAt) - (left.publishedAt || left.discoveredAt)),
    [snapshot, tab, podcastSourceIds]
  );
  const tweets = useMemo(
    () => (snapshot?.twitterItems || [])
      .filter((item) => tab === "twitter" && podcastSourceIds.has(item.sourceId))
      .sort((left, right) => (right.createdAt || right.discoveredAt || 0) - (left.createdAt || left.discoveredAt || 0)),
    [snapshot, tab, podcastSourceIds]
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await workbench.listRadarSources();
      if (!result.ok) {
        setError(result.error || "暂时无法读取本机信源配置。");
        return;
      }
      setSnapshot(result);
      setTwitterTokenConfigured(result.twitterTokenConfigured === true);
      onSnapshot?.(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load();
  }, [open]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) {
      setError(draft.kind === "wechat" ? "请输入公众号名称。" : "请输入信源名称。");
      return;
    }
    if (draft.kind !== "wechat" && !draft.url.trim()) {
      setError(sourceUrlError(draft.kind));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const request: RadarSourceSaveRequest = {
        id: draft.id,
        kind: draft.kind,
        name: draft.name.trim(),
        url: draft.url.trim(),
        enabled: draft.enabled,
        priority: draft.priority,
        keywords: splitKeywords(draft.keywords),
        autoProcess: isPodcastLikeKind(draft.kind) && draft.autoProcess
      };
      const result = await workbench.saveRadarSource(request);
      if (!result.ok) {
        setError(result.error || "保存失败，请检查链接后重试。");
        return;
      }
      setDraft(null);
      setNotice(draft.id ? "信源已更新。" : "信源已添加，只保存在这台 Mac。 ");
      await load();
    } finally {
      setSaving(false);
    }
  }

  function resetBulkImport() {
    setBulkImportOpen(false);
    setBulkImportText("");
    setBulkImportFileName("");
    setBulkImportKeywords("");
    setBulkImportImportant(true);
    setBulkImportPreview(null);
    if (bulkImportFileRef.current) bulkImportFileRef.current.value = "";
  }

  function openBulkImport() {
    setDraft(null);
    setError("");
    setNotice("");
    setBulkImportOpen(true);
    setBulkImportPreview(null);
  }

  async function chooseBulkImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("List 文件超过 4 MB，请拆分后再导入。");
      event.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      setBulkImportText(text);
      setBulkImportFileName(file.name);
      setBulkImportPreview(null);
      setError("");
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "无法读取这个 List 文件。");
    }
  }

  async function runBulkImport(previewOnly: boolean) {
    if (!bulkImportText.trim()) {
      setError("请粘贴公众号名单，或选择一个 TXT、LIST、CSV、TSV 文件。");
      return;
    }
    setBulkImportBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await workbench.bulkImportRadarSources({
        kind: "wechat",
        text: bulkImportText,
        fileName: bulkImportFileName || undefined,
        previewOnly,
        enabled: true,
        priority: bulkImportImportant ? "important" : "normal",
        keywords: splitKeywords(bulkImportKeywords)
      });
      if (!result.ok) {
        setError(result.error || "批量导入失败，请检查名单格式后重试。");
        return;
      }
      setBulkImportPreview(result);
      if (previewOnly) return;
      const imported = result.stats.importedCount;
      setNotice(imported
        ? `已导入 ${imported} 个公众号；重复和已有账号已自动跳过。`
        : "没有需要新增的公众号；重复和已有账号已自动跳过。");
      resetBulkImport();
      await load();
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : String(bulkError));
    } finally {
      setBulkImportBusy(false);
    }
  }

  async function remove(source: RadarSource) {
    const approved = await confirm({
      title: "删除这个信源？",
      message: `“${source.name}”将不再参与后续扫描。`,
      detail: "已生成的本地文档、纪要和行业资料不会被删除。",
      confirmLabel: "删除信源",
      tone: "danger"
    });
    if (!approved) return;
    setError("");
    const result = await workbench.deleteRadarSource({ sourceId: source.id });
    if (!result.ok) {
      setError(result.error || "删除失败。");
      return;
    }
    setNotice("信源已删除，既有纪要和行业资料仍保留。 ");
    await load();
  }

  async function toggleSource(source: RadarSource) {
    const result = await workbench.saveRadarSource({
      id: source.id,
      kind: source.kind,
      name: source.name,
      url: source.url,
      enabled: !source.enabled,
      priority: source.priority,
      keywords: source.keywords,
      autoProcess: source.autoProcess
    });
    if (!result.ok) {
      setError(result.error || "更新失败。");
      return;
    }
    await load();
  }

  async function saveTwitterToken() {
    const token = twitterTokenDraft.trim();
    if (!token) {
      setError("请先粘贴你的 X API v2 Bearer Token。");
      return;
    }
    setTwitterTokenSaving(true);
    setError("");
    try {
      const result = await workbench.saveRadarTwitterToken({ token });
      if (!result.ok) {
        setError(result.error || "保存 X API 凭证失败。");
        return;
      }
      setTwitterTokenDraft("");
      setTwitterTokenConfigured(result.configured === true);
      setNotice("X API 凭证已保存在本机，只用于读取你订阅的大V时间线。");
    } catch (tokenError) {
      setError(tokenError instanceof Error ? tokenError.message : String(tokenError));
    } finally {
      setTwitterTokenSaving(false);
    }
  }

  async function sync() {
    setSyncing(true);
    setError("");
    setNotice("正在检查已启用信源的新内容…");
    try {
      const result = await workbench.syncRadarSources({ limit: 12 });
      if (!result.ok && !result.partial) {
        setError(result.error || "信源同步失败。");
        return;
      }
      const nextSnapshot: RadarSourceSnapshot = {
        ok: true,
        sources: result.sources,
        jobs: result.jobs,
        twitterItems: result.twitterItems,
        twitterTokenConfigured: result.twitterTokenConfigured,
        updatedAt: result.updatedAt,
        error: result.error
      };
      setSnapshot(nextSnapshot);
      if (typeof result.twitterTokenConfigured === "boolean") {
        setTwitterTokenConfigured(result.twitterTokenConfigured);
      }
      onSnapshot?.(nextSnapshot);
      const discovered = result.results.reduce((sum, item) => sum + item.discoveredCount, 0);
      setNotice(discovered ? `发现 ${discovered} 条新内容。` : "已检查，没有发现新内容。 ");

    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : String(syncError));
    } finally {
      setSyncing(false);
    }
  }

  if (!open) return null;

  return (
    <div className="radar-source-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section id="radar-source-panel" className="radar-source-panel" role="dialog" aria-modal="true" aria-labelledby="radar-source-title">
        <header>
          <div>
            <span>行业动态</span>
            <h2 id="radar-source-title">信源管理</h2>
            <p>配置仅保存在本机；订阅单集通过转发或本地整理入库。</p>
          </div>
          <button type="button" aria-label="关闭信源管理" onClick={onClose}><X size={19} /></button>
        </header>

        <div className="radar-source-tabs" role="tablist">
          {TABS.map((item) => {
            const Icon = item.icon;
            const count = snapshot?.sources.filter((source) => source.kind === item.kind).length || 0;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={tab === item.kind}
                className={tab === item.kind ? "active" : ""}
                onClick={() => { setTab(item.kind); setDraft(null); resetBulkImport(); setError(""); }}
                key={item.kind}
              >
                <Icon size={16} />{item.label}<small>{count}</small>
              </button>
            );
          })}
        </div>

        <div className="radar-source-toolbar">
          <p>{tab === "news"
            ? "扫描时优先核验这些网站。"
            : tab === "wechat"
              ? "记录重点公众号名称与关注关键词；不绕过微信访问限制。"
              : tab === "podcast"
                ? "支持公开 RSS、小宇宙公开节目页或单集页、YouTube 公开视频（需本机安装 yt-dlp）；拒绝付费、私密和 DRM 内容。"
                : tab === "youtube_channel"
                  ? "订阅 YouTube 频道或播放列表：同步时自动发现新单集，下载与转写与播客完全一致（需本机安装 yt-dlp）。"
                  : "订阅 X 上的大V：同步时通过你自己的 X API 凭证拉取最新推送；domi 不绕过登录墙。"}</p>
          <span>
            <button type="button" onClick={() => { resetBulkImport(); setDraft({ ...EMPTY_DRAFT, kind: tab }); }}>
              <Plus size={15} />添加
            </button>
            {tab === "wechat" && (
              <button type="button" onClick={openBulkImport} aria-expanded={bulkImportOpen}>
                <Upload size={15} />批量上传
              </button>
            )}
            <button type="button" onClick={() => void sync()} disabled={syncing || loading}>
              <RefreshCw className={syncing ? "spinning" : ""} size={15} />同步信源
            </button>
          </span>
        </div>

        {error && <div className="radar-source-error"><AlertCircle size={15} />{error}</div>}
        {notice && <div className="radar-source-notice"><Check size={15} />{notice}</div>}

        {tab === "wechat" && bulkImportOpen && (
          <section className="radar-source-bulk" aria-label="批量上传重点公众号">
            <div className="radar-source-form-title">
              <div>
                <strong>批量上传重点公众号</strong>
                <small>一行一个名称；也支持带表头的 CSV / TSV。</small>
              </div>
              <button type="button" aria-label="关闭批量上传" onClick={resetBulkImport}><X size={15} /></button>
            </div>
            <textarea
              value={bulkImportText}
              onChange={(event) => {
                setBulkImportText(event.target.value);
                setBulkImportFileName("");
                setBulkImportPreview(null);
              }}
              placeholder={'粘贴公众号名单，例如：\n晚点LatePost\n机器之心\n甲子光年'}
              spellCheck={false}
            />
            <div className="radar-source-bulk-file">
              <input
                ref={bulkImportFileRef}
                type="file"
                accept=".txt,.list,.csv,.tsv,text/plain,text/csv,text/tab-separated-values"
                onChange={(event) => void chooseBulkImportFile(event)}
              />
              <button type="button" onClick={() => bulkImportFileRef.current?.click()}>
                <Upload size={14} />选择 List 文件
              </button>
              <span>{bulkImportFileName || "TXT / LIST / CSV / TSV，最大 4 MB"}</span>
            </div>
            <div className="radar-source-bulk-options">
              <label>
                <span>统一关注关键词（可选）</span>
                <input
                  value={bulkImportKeywords}
                  placeholder="AI、半导体，用逗号分隔"
                  onChange={(event) => { setBulkImportKeywords(event.target.value); setBulkImportPreview(null); }}
                />
              </label>
              <label className="radar-source-bulk-check">
                <input
                  type="checkbox"
                  checked={bulkImportImportant}
                  onChange={(event) => { setBulkImportImportant(event.target.checked); setBulkImportPreview(null); }}
                />
                标记为重点关注
              </label>
            </div>
            {bulkImportPreview && (
              <div className="radar-source-bulk-preview">
                <div className="radar-source-bulk-stats">
                  <span>可导入 <strong>{bulkImportPreview.stats.importableCount}</strong></span>
                  <span>已有 {bulkImportPreview.stats.existingCount}</span>
                  <span>本批重复 {bulkImportPreview.stats.duplicateCount}</span>
                  <span className={bulkImportPreview.stats.invalidCount ? "error" : ""}>无效 {bulkImportPreview.stats.invalidCount}</span>
                </div>
                <div className="radar-source-bulk-list">
                  {bulkImportPreview.items.slice(0, 50).map((item) => (
                    <div key={`${item.row}-${item.name}-${item.status}`}>
                      <span>{item.row}</span>
                      <strong>{item.name || "未命名"}</strong>
                      <small className={item.status === "invalid" ? "error" : item.status}>
                        {item.status === "new" ? "将导入"
                          : item.status === "existing" ? "已有"
                            : item.status === "duplicate" ? "本批重复"
                              : item.error || "无效"}
                      </small>
                    </div>
                  ))}
                  {(bulkImportPreview.previewTruncated || bulkImportPreview.items.length > 50) && (
                    <p>这里只预览前 50 行，导入时会处理全部有效记录。</p>
                  )}
                </div>
              </div>
            )}
            <div className="radar-source-bulk-actions">
              <small>名单与设置只保存在本机，软件更新不会清除。</small>
              <span>
                <button type="button" onClick={() => void runBulkImport(true)} disabled={bulkImportBusy}>
                  {bulkImportBusy ? "处理中" : "预览并去重"}
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => void runBulkImport(false)}
                  disabled={bulkImportBusy || !bulkImportPreview || bulkImportPreview.stats.importableCount === 0}
                >
                  导入 {bulkImportPreview?.stats.importableCount || 0} 个
                </button>
              </span>
            </div>
          </section>
        )}

        {tab === "twitter" && (
          <section className="radar-source-bulk" aria-label="X API 凭证">
            <div className="radar-source-form-title">
              <div>
                <strong><KeyRound size={14} /> X API 凭证{twitterTokenConfigured ? "（已配置）" : "（未配置）"}</strong>
                <small>{twitterTokenConfigured
                  ? "同步时用你自己的 X API v2 凭证读取大V时间线；令牌只存在这台电脑的本地密钥库。"
                  : "自动读取 X 大V推送需要你自己的 X 开发者 Bearer Token；domi 不绕过登录墙，也不读取浏览器 Cookie。"}</small>
              </div>
            </div>
            <div className="radar-source-bulk-file">
              <input
                type="password"
                value={twitterTokenDraft}
                placeholder="粘贴 X API v2 App-only Bearer Token"
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => setTwitterTokenDraft(event.target.value)}
              />
              <button type="button" onClick={() => void saveTwitterToken()} disabled={twitterTokenSaving}>
                {twitterTokenSaving ? "保存中" : "保存凭证"}
              </button>
            </div>
          </section>
        )}

        {draft && (
          <form className="radar-source-form" onSubmit={save}>
            <div className="radar-source-form-title">
              <strong>{draft.id ? "编辑" : "添加"}{TABS.find((item) => item.kind === draft.kind)?.label}</strong>
              <button type="button" aria-label="取消编辑" onClick={() => setDraft(null)}><X size={15} /></button>
            </div>
            <label>
              <span>{draft.kind === "wechat" ? "公众号名称" : "名称"}</span>
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </label>
            <label>
              <span>{draft.kind === "wechat" ? "主页或文章链接（可选）" : sourceUrlLabel(draft.kind)}</span>
              <input value={draft.url} placeholder={sourceUrlPlaceholder(draft.kind)} onChange={(event) => setDraft({ ...draft, url: event.target.value })} />
            </label>
            <label>
              <span>关注关键词</span>
              <input value={draft.keywords} placeholder="公司、技术或人物，用逗号分隔" onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} />
            </label>
            <div className="radar-source-form-options">
              <label><input type="checkbox" checked={draft.priority === "important"} onChange={(event) => setDraft({ ...draft, priority: event.target.checked ? "important" : "normal" })} />重点关注</label>
            </div>
            <button className="radar-source-save" type="submit" disabled={saving}>{saving ? "保存中" : "保存信源"}</button>
          </form>
        )}

        <div className="radar-source-content">
          {loading && !snapshot ? <div className="radar-source-empty">正在读取本机信源…</div> : null}
          {!loading && !sources.length ? <div className="radar-source-empty">还没有{TABS.find((item) => item.kind === tab)?.label}，点击“添加”开始。</div> : null}
          {sources.map((source) => (
            <article className={`radar-source-row ${source.enabled ? "" : "disabled"}`} key={source.id}>
              <button
                type="button"
                className={`radar-source-toggle ${source.enabled ? "on" : ""}`}
                aria-label={source.enabled ? `停用 ${source.name}` : `启用 ${source.name}`}
                aria-pressed={source.enabled}
                onClick={() => void toggleSource(source)}
              ><i /></button>
              <div>
                <strong>{source.name}{source.priority === "important" && <em>重点</em>}</strong>
                <span>{source.url || "按公众号名称检索"}</span>
                {source.keywords.length ? <small>{source.keywords.join(" · ")}</small> : null}
                {source.error ? <small className="error">{source.error}</small> : null}
              </div>
              <span className="radar-source-actions">
                <button type="button" aria-label={`编辑 ${source.name}`} onClick={() => setDraft(sourceDraft(source))}><Pencil size={15} /></button>
                <button type="button" aria-label={`删除 ${source.name}`} onClick={() => void remove(source)}><Trash2 size={15} /></button>
              </span>
            </article>
          ))}

          {isPodcastLikeKind(tab) && jobs.length > 0 && (
            <section className="podcast-discovery-list">
              <h3>发现的单集 <small>{jobs.length}</small></h3>
              {jobs.slice(0, 30).map((job) => {
                return (
                  <article key={job.id}>
                    <div>
                      <strong>{job.title}</strong>
                      <span>{job.podcastTitle || "播客"}{job.publishedAt ? ` · ${new Date(job.publishedAt).toLocaleDateString("zh-CN")}` : ""}</span>
                      <small className={job.status === "failed" ? "error" : ""}>{podcastStatus(job)}{job.error ? `：${job.error}` : ""}</small>
                    </div>
                    {job.episodeUrl ? (
                      <a className="podcast-episode-link" href={job.episodeUrl} target="_blank" rel="noreferrer">打开单集<ExternalLink size={13} /></a>
                    ) : <span className="podcast-ready">已收录</span>}
                  </article>
                );
              })}
            </section>
          )}

          {tab === "twitter" && tweets.length > 0 && (
            <section className="podcast-discovery-list">
              <h3>最新推送 <small>{tweets.length}</small></h3>
              {tweets.slice(0, 30).map((item: TwitterItem) => (
                <article key={item.id}>
                  <div>
                    <strong>@{item.handle}{item.authorName && item.authorName !== item.handle ? ` · ${item.authorName}` : ""}</strong>
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "时间未知"}</span>
                    <small>{item.text}</small>
                    {item.url ? <a href={item.url} target="_blank" rel="noreferrer">查看原文</a> : null}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </section>
      {confirmDialog}
    </div>
  );
}
