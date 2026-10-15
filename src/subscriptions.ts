// Subscription digest helpers shared by the Subscriptions workbench view and
// its background runs. The daily source sync (radar-sources) discovers X
// timeline tweets and podcast/YouTube episodes into the local snapshot; these
// helpers turn that raw feed into per-day groups and the two intake prompts:
// a per-episode archival run (reuses the intake-archive media pipeline) and a
// once-per-day digest document written into the library.

import type { PodcastJob, RadarSourceSnapshot, TwitterItem } from "./env";

export type SubscriptionDay = {
  day: string;
  label: string;
  tweets: TwitterItem[];
  episodes: PodcastJob[];
};

const MAX_SUBSCRIPTION_DAYS = 30;

export function subscriptionDayKey(timestamp: number | null | undefined, fallback = Date.now()): string {
  const value = Number(timestamp);
  const date = new Date(Number.isFinite(value) && value > 0 ? value : fallback);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function subscriptionDayLabel(day: string, now = Date.now()): string {
  const today = subscriptionDayKey(now);
  const yesterday = subscriptionDayKey(now - 24 * 60 * 60 * 1000);
  if (day === today) return "今天";
  if (day === yesterday) return "昨天";
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return day;
  const currentYear = new Date(now).getFullYear();
  return Number(match[1]) === currentYear
    ? `${Number(match[2])}月${Number(match[3])}日`
    : `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

function episodeDayTimestamp(job: PodcastJob): number {
  return Number(job?.publishedAt) || Number(job?.discoveredAt) || 0;
}

// Group the snapshot's tweets and podcast/YouTube episode jobs into local-day
// buckets sorted newest first. A day shows up when it has at least one item of
// either kind; empty days in between are skipped (this is a feed, not a diary).
export function groupSubscriptionDays(
  snapshot: RadarSourceSnapshot | null,
  now = Date.now()
): SubscriptionDay[] {
  const tweets = snapshot?.twitterItems || [];
  const jobs = snapshot?.jobs || [];
  const buckets = new Map<string, { tweets: TwitterItem[]; episodes: PodcastJob[] }>();
  const bucketOf = (day: string) => {
    let bucket = buckets.get(day);
    if (!bucket) {
      bucket = { tweets: [], episodes: [] };
      buckets.set(day, bucket);
    }
    return bucket;
  };
  for (const tweet of tweets) {
    if (!tweet || !tweet.text) continue;
    const day = subscriptionDayKey(tweet.createdAt ?? tweet.discoveredAt, now);
    bucketOf(day).tweets.push(tweet);
  }
  for (const job of jobs) {
    if (!job || !job.title) continue;
    const day = subscriptionDayKey(episodeDayTimestamp(job), now);
    bucketOf(day).episodes.push(job);
  }
  return [...buckets.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .slice(0, MAX_SUBSCRIPTION_DAYS)
    .map(([day, bucket]) => ({
      day,
      label: subscriptionDayLabel(day, now),
      tweets: bucket.tweets
        .sort((left, right) => (right.createdAt ?? right.discoveredAt ?? 0) - (left.createdAt ?? left.discoveredAt ?? 0)),
      episodes: bucket.episodes
        .sort((left, right) => episodeDayTimestamp(right) - episodeDayTimestamp(left))
    }))
    .filter((group) => group.tweets.length > 0 || group.episodes.length > 0);
}

export function subscriptionEpisodeStatusLabel(status: PodcastJob["status"]): string {
  switch (status) {
    case "transcript_ready": return "文字稿已就绪";
    case "transcribing": return "正在生成文字稿";
    case "downloading": return "正在下载公开音频";
    case "downloaded": return "已下载，等待转写";
    case "failed": return "处理失败";
    case "skipped": return "已跳过";
    default: return "待处理";
  }
}

// A "可一键入库" episode is one with a public web page the intake-archive
// media pipeline can fetch (YouTube video page or 小宇宙 episode page). Jobs
// whose episode URL is only a media stream cannot go through that flow.
export function isSubscriptionEpisodeArchivable(job: PodcastJob): boolean {
  const url = String(job?.episodeUrl || "");
  if (!/^https?:\/\//i.test(url)) return false;
  if (/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//i.test(url)) return true;
  if (/^https?:\/\/(?:www\.)?xiaoyuzhoufm\.com\/episode\//i.test(url)) return true;
  return false;
}

function tweetTimeLabel(tweet: TwitterItem): string {
  const value = Number(tweet?.createdAt);
  if (!Number.isFinite(value) || value <= 0) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function episodeDurationLabel(seconds: number | null): string {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return "";
  const hours = Math.floor(value / 3600);
  const minutes = Math.round((value % 3600) / 60);
  return hours > 0 ? `${hours}小时${minutes ? `${minutes}分` : ""}` : `${minutes}分钟`;
}

// Prompt for the once-per-day digest document run. Tweets are embedded inline
// (they are short and already local); episodes are listed with title, source,
// link, duration, description and transcript state. The run must not download
// or transcribe new media — it summarizes what the day brought in.
export function subscriptionDigestPrompt(input: {
  day: string;
  tweets: TwitterItem[];
  episodes: PodcastJob[];
  sourceNames: Record<string, string>;
}): string {
  const tweetLines = input.tweets.map((tweet, index) => {
    const author = tweet.authorName || tweet.handle || "未知作者";
    const time = tweetTimeLabel(tweet);
    return [
      `${index + 1}. ${author}${time ? `（${time}）` : ""}：`,
      tweet.text.trim(),
      tweet.url ? `   链接：${tweet.url}` : ""
    ].filter(Boolean).join("\n");
  });
  const episodeLines = input.episodes.map((job, index) => {
    const sourceName = input.sourceNames[job.sourceId] || job.podcastTitle || "订阅单集";
    const duration = episodeDurationLabel(job.durationSec);
    const meta = [sourceName, duration].filter(Boolean).join(" · ");
    return [
      `${index + 1}. 《${job.title}》（${meta}）`,
      job.description ? `   简介：${job.description.trim()}` : "",
      `   链接：${job.episodeUrl || "（无）"}`,
      job.transcriptPath ? `   已有文字稿：${job.transcriptPath}` : "   暂无文字稿"
    ].filter(Boolean).join("\n");
  });
  return [
    `请整理一份 domi 订阅日报（${input.day}），把下面当日订阅信源收进来的内容汇总成一份可快速通读的 Markdown 日报。最终发布路径为「13.认知库/订阅日报/${input.day}.md」（相对当前资料库根目录；文件已存在就整体重写更新，不要另建副本）。本轮先保存到「13.认知库/订阅日报/.drafts/${input.day}.md」并回读，Domi 会在全文中文翻译校验通过后发布到最终路径。`,
    "日报结构：",
    "1. 开头用 3-5 句话概括今天订阅里最值得注意的整体动态。",
    "2. 「X 大V观点」：逐条写重要观点及原文提供的论据与论证（保留作者与原话要点；纯转发或低信息量的可合并成一行带过，不强行拆出多个论点）；涉及公司、产品、数字的内容保持原文口径，不得演绎。",
    "3. 「单集速览」：已有文字稿时先完整读取，再按全文重要观点及各论点的相应论据、相应论证整理，并注明「文字稿已就绪」；没有文字稿的只基于标题、节目名和简介概括并注明「暂无文字稿，以下仅为简介」，不得写成全文摘要或编造论证。",
    "摘要结构：全文重要观点 → 论点1／相应论据／相应论证 → 论点2… → 论点N…。按全文确定论点数量，覆盖后半部分的重要讨论；区分作者论证与整理者推断，原文未展开论证时明确说明，不补造论据。",
    "4. 「值得关注的信号」：从当日内容中提炼对行业格局、公司竞争或投资判断有意义的信号；没有就写「今日无特殊信号」。",
    "约束：不下载音频、不转写新内容、不联网补搜；只基于下面提供的内容整理，不得编造内容；日报全文使用简体中文。",
    "英文标题、作者简介、推文引用、节目标题与简介、博客标题与简介和自然语言提示词示例全部译成中文。agent、prompt、token、feed、bug 等普通词语也用中文。保留人名、公司及产品正式名称、型号、账号、链接及数字；英文原文由发布器单独存入隐藏的来源文件，不在日报正文附加英文段落。覆盖全部输入条目，可分批整理，不得静默截掉后面的推文或单集。中文全文翻译与发布校验使用 GPT-6 Luna／标准智能／标准速度，摘要仍使用 GPT-6.1 Sol／高智能／标准速度。",
    "完成后在结果中汇报：日报保存路径、当日推文条数与单集数、值得关注的信号要点。",
    "",
    `当日 X 推文（${input.tweets.length} 条）：`,
    tweetLines.length ? tweetLines.join("\n\n") : "（当日无推文）",
    "",
    `当日订阅单集（${input.episodes.length} 集）：`,
    episodeLines.length ? episodeLines.join("\n\n") : "（当日无单集）"
  ].join("\n");
}
