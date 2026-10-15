import assert from "node:assert/strict";
import { test } from "node:test";
import {
  groupSubscriptionDays,
  isSubscriptionEpisodeArchivable,
  subscriptionDayKey,
  subscriptionDayLabel,
  subscriptionDigestPrompt,
  subscriptionEpisodeStatusLabel
} from "../src/subscriptions.ts";

const NOW = new Date("2026-09-22T15:00:00").getTime();
const SAME_DAY_MORNING = new Date("2026-09-22T09:30:00").getTime();
const YESTERDAY = new Date("2026-09-21T18:00:00").getTime();
const LAST_MONTH = new Date("2026-08-15T12:00:00").getTime();

function tweet(overrides = {}) {
  return {
    id: "tw-1",
    sourceId: "src-a",
    handle: "@founder",
    authorName: "某大V",
    tweetId: "111",
    text: "新模型发布了",
    url: "https://x.com/founder/status/111",
    createdAt: SAME_DAY_MORNING,
    discoveredAt: SAME_DAY_MORNING,
    updatedAt: SAME_DAY_MORNING,
    ...overrides
  };
}

function episode(overrides = {}) {
  return {
    id: "job-1",
    sourceId: "src-y",
    title: "第 42 期：算力周期",
    description: "聊聊 GPU 供需",
    publishedAt: SAME_DAY_MORNING,
    durationSec: 4200,
    episodeUrl: "https://www.youtube.com/watch?v=abc",
    mediaUrl: "",
    podcastTitle: "算力漫谈",
    sourceFormat: "youtube",
    status: "discovered",
    localAudioPath: "",
    transcriptPath: "",
    plaudFileId: "",
    discoveredAt: SAME_DAY_MORNING,
    updatedAt: SAME_DAY_MORNING,
    error: "",
    ...overrides
  };
}

test("subscriptionDayKey uses the local calendar date", () => {
  assert.equal(subscriptionDayKey(SAME_DAY_MORNING), "2026-09-22");
  assert.equal(subscriptionDayKey(null, NOW), "2026-09-22");
  assert.equal(subscriptionDayKey(0, NOW), "2026-09-22");
});

test("subscriptionDayLabel names today, yesterday and older dates", () => {
  assert.equal(subscriptionDayLabel("2026-09-22", NOW), "今天");
  assert.equal(subscriptionDayLabel("2026-09-21", NOW), "昨天");
  assert.equal(subscriptionDayLabel("2026-09-01", NOW), "9月1日");
  assert.equal(subscriptionDayLabel("2025-12-30", NOW), "2025年12月30日");
});

test("groupSubscriptionDays buckets tweets and episodes by local day", () => {
  const snapshot = {
    ok: true,
    sources: [],
    jobs: [
      episode({ id: "job-today", publishedAt: SAME_DAY_MORNING }),
      episode({ id: "job-yesterday", publishedAt: YESTERDAY, title: "昨天那集" }),
      episode({ id: "job-old", publishedAt: LAST_MONTH, title: "上月的集", status: "skipped" })
    ],
    twitterItems: [
      tweet({ id: "tw-today", createdAt: SAME_DAY_MORNING }),
      tweet({ id: "tw-yesterday", createdAt: YESTERDAY, text: "昨天的观点" })
    ],
    twitterTokenConfigured: true,
    updatedAt: NOW
  };
  const days = groupSubscriptionDays(snapshot, NOW);
  assert.equal(days.length, 3);
  assert.equal(days[0].day, "2026-09-22");
  assert.equal(days[0].label, "今天");
  assert.equal(days[0].tweets.length, 1);
  assert.equal(days[0].episodes.length, 1);
  assert.equal(days[1].day, "2026-09-21");
  assert.equal(days[1].label, "昨天");
  assert.equal(days[2].day, "2026-08-15");
  // Empty input yields no groups.
  assert.deepEqual(groupSubscriptionDays(null, NOW), []);
});

test("groupSubscriptionDays sorts items within a day newest first", () => {
  const snapshot = {
    ok: true,
    sources: [],
    jobs: [
      episode({ id: "job-early", publishedAt: new Date("2026-09-22T08:00:00").getTime(), title: "早" }),
      episode({ id: "job-late", publishedAt: new Date("2026-09-22T20:00:00").getTime(), title: "晚" })
    ],
    twitterItems: [
      tweet({ id: "tw-early", createdAt: new Date("2026-09-22T08:00:00").getTime() }),
      tweet({ id: "tw-late", createdAt: new Date("2026-09-22T20:00:00").getTime(), text: "晚上发的" })
    ],
    updatedAt: NOW
  };
  const [today] = groupSubscriptionDays(snapshot, NOW);
  assert.equal(today.episodes[0].id, "job-late");
  assert.equal(today.tweets[0].id, "tw-late");
});

test("isSubscriptionEpisodeArchivable accepts public web pages only", () => {
  assert.equal(isSubscriptionEpisodeArchivable(episode({ episodeUrl: "https://www.youtube.com/watch?v=abc" })), true);
  assert.equal(isSubscriptionEpisodeArchivable(episode({ episodeUrl: "https://youtu.be/abc" })), true);
  assert.equal(isSubscriptionEpisodeArchivable(episode({ episodeUrl: "https://www.xiaoyuzhoufm.com/episode/xyz" })), true);
  // Raw media streams and non-media pages cannot go through the media intake.
  assert.equal(isSubscriptionEpisodeArchivable(episode({ episodeUrl: "https://cdn.example.com/audio.mp3" })), false);
  assert.equal(isSubscriptionEpisodeArchivable(episode({ episodeUrl: "" })), false);
});

test("subscriptionEpisodeStatusLabel maps job statuses to readable labels", () => {
  assert.equal(subscriptionEpisodeStatusLabel("transcript_ready"), "文字稿已就绪");
  assert.equal(subscriptionEpisodeStatusLabel("discovered"), "待处理");
  assert.equal(subscriptionEpisodeStatusLabel("failed"), "处理失败");
});

test("subscriptionDigestPrompt embeds the day's content and the archive contract", () => {
  const prompt = subscriptionDigestPrompt({
    day: "2026-09-22",
    tweets: [tweet({ text: "GPU 供给在四季度仍然紧张。" })],
    episodes: [
      episode({
        title: "算力周期复盘",
        sourceId: "src-y",
        durationSec: 5400,
        description: "从云厂商资本开支看算力周期"
      }),
      episode({
        id: "job-ready",
        title: "已转写的那集",
        transcriptPath: "C:/tmp/transcript.txt",
        episodeUrl: "https://www.xiaoyuzhoufm.com/episode/xyz"
      })
    ],
    sourceNames: { "src-y": "算力漫谈（YouTube）" }
  });
  // Library placement and overwrite semantics.
  assert.ok(prompt.includes("13.认知库/订阅日报/2026-09-22.md"));
  assert.ok(prompt.includes("文件已存在就整体重写更新"));
  assert.ok(prompt.includes("13.认知库/订阅日报/.drafts/2026-09-22.md"));
  assert.ok(prompt.includes("英文原文由发布器单独存入隐藏的来源文件"));
  // Structure sections.
  assert.ok(prompt.includes("X 大V观点"));
  assert.ok(prompt.includes("单集速览"));
  assert.ok(prompt.includes("值得关注的信号"));
  assert.ok(prompt.includes("全文重要观点 → 论点1／相应论据／相应论证"));
  assert.ok(prompt.includes("先完整读取"));
  assert.ok(prompt.includes("以下仅为简介"));
  // Inline content: tweet text, episode titles, source names and transcripts.
  assert.ok(prompt.includes("GPU 供给在四季度仍然紧张。"));
  assert.ok(prompt.includes("《算力周期复盘》"));
  assert.ok(prompt.includes("算力漫谈（YouTube）"));
  assert.ok(prompt.includes("1小时30分"));
  assert.ok(prompt.includes("文字稿已就绪"));
  assert.ok(prompt.includes("C:/tmp/transcript.txt"));
  assert.ok(prompt.includes("暂无文字稿"));
  // Guardrails.
  assert.ok(prompt.includes("不下载音频"));
  assert.ok(prompt.includes("不得编造内容"));
  assert.ok(prompt.includes("当日 X 推文（1 条）"));
  assert.ok(prompt.includes("当日订阅单集（2 集）"));
});

test("subscription digest input preserves every item and full descriptions", () => {
  const description = "完整节目简介。".repeat(120) + "最后的英文内容也需要翻译。";
  const prompt = subscriptionDigestPrompt({ day: "2026-10-09",
    tweets: Array.from({ length: 75 }, (_, i) => tweet({ text: `第${i + 1}条完整推文。` })),
    episodes: Array.from({ length: 35 }, (_, i) => episode({ title: `第${i + 1}期完整单集`, description })), sourceNames: {} });
  assert.ok(prompt.includes("第75条完整推文。"));
  assert.ok(prompt.includes("第35期完整单集"));
  assert.ok(prompt.includes(description));
});

test("subscriptionDigestPrompt handles empty days gracefully", () => {
  const prompt = subscriptionDigestPrompt({
    day: "2026-09-22",
    tweets: [],
    episodes: [],
    sourceNames: {}
  });
  assert.ok(prompt.includes("（当日无推文）"));
  assert.ok(prompt.includes("（当日无单集）"));
});
