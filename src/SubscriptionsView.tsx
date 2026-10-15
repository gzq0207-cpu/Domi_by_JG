import { useMemo } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FilePlus2,
  FileText,
  Inbox,
  RefreshCw,
  Rss,
  Settings
} from "lucide-react";
import type { PodcastJob, RadarSourceSnapshot } from "./env";
import {
  groupSubscriptionDays,
  isSubscriptionEpisodeArchivable,
  subscriptionDayKey,
  subscriptionEpisodeStatusLabel
} from "./subscriptions";

export type SubscriptionDigestDocument = {
  name: string;
  path: string;
  mtimeMs: number;
};

export type SubscriptionsViewProps = {
  snapshot: RadarSourceSnapshot | null;
  loading: boolean;
  syncing: boolean;
  archivingJobIds: ReadonlySet<string>;
  digestDay: string;
  digestedDay: string;
  lastDigestAt: number | null;
  autoSyncEnabled: boolean;
  digestDocuments: ReadonlyArray<SubscriptionDigestDocument>;
  mirrorSyncing: boolean;
  onSyncMirror: () => void;
  onSync: () => void;
  onRefresh: () => void;
  onOpenSourceManager: () => void;
  onArchiveEpisode: (job: PodcastJob) => void;
  onGenerateDigest: (day: string) => void;
  onOpenUrl: (url: string) => void;
  onOpenDigest: (path: string) => void;
};

function sourceCountLabel(snapshot: RadarSourceSnapshot | null): string {
  const sources = snapshot?.sources || [];
  const enabled = sources.filter((source) => source.enabled);
  const media = enabled.filter((source) => source.kind === "twitter" || source.kind === "youtube_channel" || source.kind === "podcast");
  if (!sources.length) return "尚未配置信源";
  if (!media.length) return "暂无 X / YouTube / 播客信源";
  return `${media.length} 个订阅信源`;
}

function timeLabel(value: number | null | undefined): string {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  const date = new Date(timestamp);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function relativeLabel(value: number | null | undefined): string {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  const delta = Date.now() - timestamp;
  if (delta < 60_000) return "刚刚";
  if (delta < 60 * 60_000) return `${Math.floor(delta / 60_000)} 分钟前`;
  if (delta < 24 * 60 * 60_000) return `${Math.floor(delta / (60 * 60_000))} 小时前`;
  return `${Math.floor(delta / (24 * 60 * 60_000))} 天前`;
}

function durationLabel(seconds: number | null | undefined): string {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return "";
  const hours = Math.floor(value / 3600);
  const minutes = Math.round((value % 3600) / 60);
  return hours > 0 ? `${hours} 小时${minutes ? ` ${minutes} 分` : ""}` : `${minutes} 分钟`;
}

function digestDocumentDay(name: string): string {
  const match = String(name || "").match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export default function SubscriptionsView({
  snapshot,
  loading,
  syncing,
  archivingJobIds,
  digestDay,
  digestedDay,
  lastDigestAt,
  autoSyncEnabled,
  digestDocuments,
  mirrorSyncing,
  onSyncMirror,
  onSync,
  onRefresh,
  onOpenSourceManager,
  onArchiveEpisode,
  onGenerateDigest,
  onOpenUrl,
  onOpenDigest
}: SubscriptionsViewProps) {
  const sourceNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const source of snapshot?.sources || []) names[source.id] = source.name;
    return names;
  }, [snapshot]);
  const days = useMemo(() => groupSubscriptionDays(snapshot), [snapshot]);
  const today = subscriptionDayKey(Date.now());
  const hasSources = (snapshot?.sources || []).some(
    (source) => source.enabled && (source.kind === "twitter" || source.kind === "youtube_channel" || source.kind === "podcast")
  );
  const twitterConfigured = snapshot?.twitterTokenConfigured === true;

  const metaParts = [
    sourceCountLabel(snapshot),
    snapshot?.updatedAt ? `同步于 ${relativeLabel(snapshot.updatedAt)}` : "",
    autoSyncEnabled ? "自动同步已开启" : "自动同步未开启"
  ].filter(Boolean);

  return (
    <section className="subscriptions" aria-labelledby="subscriptions-title" aria-busy={loading || syncing}>
      <div className="subscriptions-header">
        <div className="subscriptions-heading">
          <Rss size={18} />
          <div>
            <h2 id="subscriptions-title">订阅</h2>
            <p>{loading && !snapshot ? "正在读取订阅信源" : metaParts.join(" · ")}</p>
          </div>
        </div>
        <div className="subscriptions-actions">
          <button
            className="subscriptions-action"
            type="button"
            onClick={onOpenSourceManager}
            title="添加 X 大V、YouTube 频道或播客信源"
          >
            <Settings size={13} />信源管理
          </button>
          <button
            className="subscriptions-action"
            type="button"
            onClick={onSyncMirror}
            disabled={mirrorSyncing}
            title="把资料库最新内容镜像到飞书 Wiki（手机端可读）"
          >
            <RefreshCw size={13} className={mirrorSyncing ? "spinning" : ""} />同步到飞书
          </button>
          <button
            className="subscriptions-action"
            type="button"
            onClick={onRefresh}
            disabled={loading || syncing}
            title="重新读取本机订阅状态"
          >
            <RefreshCw size={13} className={loading ? "spinning" : ""} />刷新
          </button>
          <button
            className="subscriptions-sync"
            type="button"
            onClick={onSync}
            disabled={loading || syncing}
            title="立即同步 X 时间线与频道新单集"
          >
            <RefreshCw size={13} className={syncing ? "spinning" : ""} />
            {syncing ? "正在同步" : "立即同步"}
          </button>
        </div>
      </div>

      {!hasSources && digestDocuments.length === 0 && (
        <div className="subscriptions-empty">
          <Inbox size={28} />
          <h3>还没有订阅信源</h3>
          <p>把你想每天追的 X 大V、YouTube 频道和播客加进信源管理，domi 会每天自动同步新内容，并整理成订阅日报。</p>
          <ul>
            <li>X 大V：需要配置自己的 X API Token（信源管理右上角）</li>
            <li>YouTube 频道：需要本机能访问 YouTube（代理环境）</li>
            <li>播客：支持小宇宙节目与公开 RSS</li>
          </ul>
          <button className="primary" type="button" onClick={onOpenSourceManager}>
            <Settings size={14} />去添加信源
          </button>
        </div>
      )}

      {hasSources && days.length === 0 && (
        <div className="subscriptions-empty">
          <Inbox size={28} />
          <h3>暂无同步到的内容</h3>
          <p>
            {twitterConfigured
              ? "订阅信源还没有收进任何推文或单集。"
              : "尚未配置 X API Token，X 大V时间线不会同步；YouTube/播客信源不受影响。"}
            {autoSyncEnabled
              ? "应用开着时会每天自动同步一次，也可以现在手动同步。"
              : "当前未开启自动同步：在 设置 → 连接 中开启外部访问后，每天会自动同步。"}
          </p>
          <button className="primary" type="button" onClick={onSync} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? "spinning" : ""} />
            {syncing ? "正在同步" : "立即同步"}
          </button>
        </div>
      )}

      {digestDocuments.length > 0 && (
        <div className="subscriptions-digest-docs">
          <div className="subscriptions-digest-docs-heading">
            <FileText size={14} />
            <h3>订阅日报</h3>
            <small>由 follow-builders 计划任务每日生成，自动同步进资料库</small>
          </div>
          <div className="subscriptions-digest-docs-list">
            {digestDocuments.map((doc) => {
              const day = digestDocumentDay(doc.name);
              return (
                <button
                  key={doc.path}
                  type="button"
                  className="subscriptions-digest-doc"
                  onClick={() => onOpenDigest(doc.path)}
                  title={`打开 ${doc.name}`}
                >
                  <FileText size={13} />
                  <strong>{day || doc.name}</strong>
                  <small>{day ? `${/AI.?Builders|AI 构建者/i.test(doc.name) ? "AI 构建者日报" : "订阅日报"} · ${day}` : doc.name}</small>
                  <span className="subscriptions-digest-doc-meta">{relativeLabel(doc.mtimeMs)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {days.length > 0 && (
<div className="subscriptions-days">
{Number(lastDigestAt) > 0 && (
            <p className="subscriptions-digest-meta">
              上次订阅日报：{relativeLabel(lastDigestAt)}（{digestedDay}）
            </p>
          )}
          {days.map((day) => (
            <div key={day.day} className="subscriptions-day">
              <div className="subscriptions-day-heading">
                <h3>{day.label}<small>{day.day}</small></h3>
                <div className="subscriptions-day-meta">
                  {day.tweets.length > 0 && <span>{day.tweets.length} 条推文</span>}
                  {day.episodes.length > 0 && <span>{day.episodes.length} 集单集</span>}
                </div>
                <button
                  className="subscriptions-digest-button"
                  type="button"
                  disabled={digestDay === day.day}
                  onClick={() => onGenerateDigest(day.day)}
                  title="把这一天的订阅内容整理成订阅日报文档"
                >
                  {digestDay === day.day
                    ? <><RefreshCw size={13} className="spinning" />正在整理</>
                    : digestedDay === day.day
                      ? <><RefreshCw size={13} />重新生成日报</>
                      : <><FilePlus2 size={13} />生成订阅日报</>}
                </button>
              </div>
              {day.tweets.length > 0 && (
                <div className="subscriptions-tweets">
                  {day.tweets.map((tweet) => (
                    <article key={tweet.id} className="subscription-tweet">
                      <header>
                        <strong>{tweet.authorName || tweet.handle || "未知作者"}</strong>
                        {tweet.handle && <small>@{tweet.handle.replace(/^@/, "")}</small>}
                        {timeLabel(tweet.createdAt) && <time>{timeLabel(tweet.createdAt)}</time>}
                      </header>
                      <p>{tweet.text}</p>
                      {tweet.url && (
                        <button type="button" onClick={() => onOpenUrl(tweet.url)}>
                          <ExternalLink size={12} />原文
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
              {day.episodes.length > 0 && (
                <div className="subscriptions-episodes">
                  {day.episodes.map((job) => {
                    const archivable = isSubscriptionEpisodeArchivable(job);
                    const archiving = archivingJobIds.has(job.id);
                    return (
                      <article key={job.id} className={`subscription-episode ${job.status}`}>
                        <header>
                          <strong>{job.title}</strong>
                          <small>
                            {sourceNames[job.sourceId] || job.podcastTitle || "订阅单集"}
                            {durationLabel(job.durationSec) ? ` · ${durationLabel(job.durationSec)}` : ""}
                          </small>
                        </header>
                        {job.description && <p>{job.description}</p>}
                        <footer>
                          <span className="subscription-episode-status">
                            {job.status === "transcript_ready" && <CheckCircle2 size={12} />}
                            {subscriptionEpisodeStatusLabel(job.status)}
                          </span>
                          <span className="subscription-episode-actions">
                            {job.episodeUrl && (
                              <button type="button" onClick={() => onOpenUrl(job.episodeUrl)}>
                                <ExternalLink size={12} />原文
                              </button>
                            )}
                            {archivable && (
                              <button
                                type="button"
                                className="subscription-archive-button"
                                disabled={archiving}
                                onClick={() => onArchiveEpisode(job)}
                                title="按转发视频/播客的流程整理这一集：读公开字幕或转写公开音频，归档进行业认知库"
                              >
                                <FilePlus2 size={12} />
                                {archiving ? "正在整理" : "一键入库"}
                              </button>
                            )}
                          </span>
                        </footer>
                        {job.status === "failed" && job.error && (
                          <p className="subscription-episode-error">{job.error}</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
              {day.day === today && (
                <p className="subscriptions-day-hint">今天的内容会随每日自动同步更新；单集可单独「一键入库」，日报在任意时间都能重新生成。</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
