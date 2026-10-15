import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bareIntakeInput,
  intakeArticlePrompt,
  intakeFilePrompt,
  intakeLinkPrompt,
  intakeMediaLinkPrompt,
  isMediaIntakeUrl
} from "../src/intake-prompts.ts";

test("intakeArticlePrompt renders the shared archival instruction", () => {
  const prompt = intakeArticlePrompt({
    url: "https://mp.weixin.qq.com/s/abc",
    title: "AI 的瓶颈",
    source: "feishu-inbox",
    excerpt: "值得读的片段"
  });
  assert.ok(prompt.includes("intake-archive"));
  assert.ok(prompt.includes("https://mp.weixin.qq.com/s/abc"));
  assert.ok(prompt.includes("《AI 的瓶颈》"));
  assert.ok(prompt.includes("来源：feishu-inbox"));
  assert.ok(prompt.includes("转发时选中的片段"));
});

test("intakeArticlePrompt omits empty optional fields", () => {
  const prompt = intakeArticlePrompt({ url: "https://example.com/a" });
  assert.ok(!prompt.includes("标题："));
  assert.ok(!prompt.includes("来源："));
  assert.ok(!prompt.includes("转发时选中的片段"));
});

test("intakeFilePrompt mirrors the article pipeline with PDF input variants", () => {
  const prompt = intakeFilePrompt({ fileName: "算力行业报告.pdf" });
  // Same skill, same archival destination and summary card structure.
  assert.ok(prompt.includes("intake-archive"));
  assert.ok(prompt.includes("本地行业认知库"));
  assert.ok(prompt.includes("全文重要观点 → 论点1"));
  assert.ok(prompt.includes("《算力行业报告.pdf》"));
  // PDF-specific contract: no url-derived identity, explicit idempotent eventId.
  assert.ok(prompt.includes("url 留空"));
  assert.ok(prompt.includes("eventId"));
  assert.ok(prompt.includes("不得新建重复记录"));
});

test("every intake entry uses arguments, evidence and reasoning across the full source", () => {
  for (const prompt of [intakeArticlePrompt({ url: "https://example.com" }),
    intakeMediaLinkPrompt({ url: "https://youtu.be/abcdefghijk" }), intakeFilePrompt({ fileName: "test.mp3" })]) {
    assert.match(prompt, /全文重要观点/);
    assert.match(prompt, /相应论据.*相应论证/);
    assert.match(prompt, /后半部分/);
    assert.match(prompt, /原文未展开论证/);
    assert.doesNotMatch(prompt, /核心观点／关键事实/);
    assert.match(prompt, /标题、摘要和说明统一使用简体中文/);
    assert.match(prompt, /GPT-6 Luna／标准智能／标准速度/);
    assert.match(prompt, /原文保留供核对/);
  }
  const media = intakeMediaLinkPrompt({ url: "https://youtu.be/abcdefghijk" });
  assert.match(media, /originalContentFileSha256/);
  assert.match(media, /originalContentVerified/);
});

test("intakeFilePrompt adapts extraction rules per file category", () => {
  const spreadsheet = intakeFilePrompt({ fileName: "算力供给数据.xlsx" });
  assert.ok(spreadsheet.includes("表格数据文件"));
  assert.ok(spreadsheet.includes("逐个工作表"));
  assert.ok(spreadsheet.includes("工作表清单、字段名、行数"));
  assert.ok(spreadsheet.includes("转发文件：算力供给数据.xlsx"));

  const image = intakeFilePrompt({ fileName: "会场白板照片.png" });
  assert.ok(image.includes("图片文件"));
  assert.ok(image.includes("OCR"));
  assert.ok(image.includes("视觉描述"));
  assert.ok(image.includes("eventId"));

  // Unknown extensions still get the generic document pipeline.
  const doc = intakeFilePrompt({ fileName: "调研笔记.docx" });
  assert.ok(doc.includes("文档文件"));
  assert.ok(doc.includes("url 留空"));
});

test("isMediaIntakeUrl recognizes video and podcast platform links", () => {
  // B站: full, mobile, and short-link domains.
  assert.equal(isMediaIntakeUrl("https://www.bilibili.com/video/BV1GJ411x7h7"), true);
  assert.equal(isMediaIntakeUrl("https://m.bilibili.com/video/BV1GJ411x7h7"), true);
  assert.equal(isMediaIntakeUrl("https://b23.tv/AbCdEfG"), true);
  // YouTube and 小宇宙.
  assert.equal(isMediaIntakeUrl("https://www.youtube.com/watch?v=abc"), true);
  assert.equal(isMediaIntakeUrl("https://youtu.be/abc"), true);
  assert.equal(isMediaIntakeUrl("https://www.xiaoyuzhoufm.com/episode/abc"), true);
});

test("isMediaIntakeUrl rejects ordinary pages and malformed input", () => {
  assert.equal(isMediaIntakeUrl("https://mp.weixin.qq.com/s/abc"), false);
  assert.equal(isMediaIntakeUrl("https://substack.com/p/great"), false);
  assert.equal(isMediaIntakeUrl("https://example.com/a"), false);
  // Look-alike hosts must not match.
  assert.equal(isMediaIntakeUrl("https://bilibili.com.evil.example/video/BV1"), false);
  assert.equal(isMediaIntakeUrl("not a url"), false);
  assert.equal(isMediaIntakeUrl(""), false);
});

test("intakeLinkPrompt routes media links to the media variant", () => {
  const media = intakeLinkPrompt({
    url: "https://www.bilibili.com/video/BV1GJ411x7h7",
    title: "GPT-5 深度解读",
    source: "feishu-inbox"
  });
  assert.ok(media.includes("intake-archive"));
  assert.ok(media.includes("链接分诊"));
  assert.ok(media.includes("公开字幕"));
  assert.ok(media.includes("本地转写全文"));
  assert.ok(media.includes("media-intake.cjs"));
  assert.ok(media.includes("字幕缺失或不完整时提取公开音频"));
  assert.ok(media.includes("不得直接退回简介"));
  assert.ok(media.includes("转写覆盖范围"));
  assert.ok(media.includes("哔哩哔哩/YouTube 视频、小宇宙播客单集"));
  assert.ok(media.includes("https://www.bilibili.com/video/BV1GJ411x7h7"));
  assert.ok(media.includes("《GPT-5 深度解读》"));
  assert.ok(media.includes("来源：feishu-inbox"));
  // Gap reporting is part of the media contract.
  assert.ok(media.includes("抓取缺口"));
});

test("intakeLinkPrompt keeps ordinary links on the article pipeline", () => {
  const article = intakeLinkPrompt({ url: "https://mp.weixin.qq.com/s/abc" });
  assert.ok(article.includes("打开并完整阅读原文"));
  assert.ok(!article.includes("链接分诊"));
});

test("intakeMediaLinkPrompt omits empty optional fields", () => {
  const prompt = intakeMediaLinkPrompt({ url: "https://b23.tv/xyz" });
  assert.ok(prompt.includes("https://b23.tv/xyz"));
  assert.ok(!prompt.includes("标题："));
  assert.ok(!prompt.includes("来源："));
  assert.ok(!prompt.includes("转发时选中的片段"));
});

test("local media drops explicitly run local ASR instead of saving metadata", () => {
  for (const fileName of ["访谈.mp4", "访谈.mp3", "访谈.m4a", "访谈.wav"]) {
    const prompt = intakeFilePrompt({ fileName });
    assert.ok(prompt.includes("media-intake.cjs"));
    assert.ok(prompt.includes("本地转写全文"));
    assert.ok(prompt.includes("失败后复用已完成分段"));
    assert.ok(prompt.includes("只有转写实际失败"));
  }
});

test("bareIntakeInput detects a lone link without instructions", () => {
  assert.deepEqual(
    bareIntakeInput("https://substack.com/p/great", []),
    { kind: "url", url: "https://substack.com/p/great" }
  );
  assert.deepEqual(bareIntakeInput("  https://example.com/a  ", []), {
    kind: "url",
    url: "https://example.com/a"
  });
});

test("bareIntakeInput ignores links accompanied by wording or attachments", () => {
  // Link plus commentary stays a normal conversation.
  assert.equal(bareIntakeInput("看看这篇 https://example.com/a 很不错", []), null);
  // Link plus an attachment is not a bare drop.
  assert.equal(
    bareIntakeInput("https://example.com/a", [{ path: "C:/tmp/x.pdf" }]),
    null
  );
  // Multiple links are ambiguous, keep normal routing.
  assert.equal(bareIntakeInput("https://a.com/1 https://b.com/2", []), null);
});

test("bareIntakeInput detects a single supported file dropped without any text", () => {
  assert.deepEqual(
    bareIntakeInput("", [{ path: "C:/Users/me/inbox/算力行业报告.PDF" }]),
    { kind: "file", fileName: "算力行业报告.PDF" }
  );
  assert.deepEqual(bareIntakeInput("   ", [{ path: "/tmp/report.pdf" }]), {
    kind: "file",
    fileName: "report.pdf"
  });
  // Spreadsheets and images dropped alone trigger the same intake flow.
  assert.deepEqual(bareIntakeInput("", [{ path: "C:/tmp/算力供给数据.xlsx" }]), {
    kind: "file",
    fileName: "算力供给数据.xlsx"
  });
  assert.deepEqual(bareIntakeInput("", [{ path: "C:\\Users\\me\\会场白板照片.png" }]), {
    kind: "file",
    fileName: "会场白板照片.png"
  });
});

test("bareIntakeInput ignores mixed, multiple or documented attachments", () => {
  // Any wording keeps the normal routing.
  assert.equal(
    bareIntakeInput("帮我分析这个", [{ path: "/tmp/report.pdf" }]),
    null
  );
  // Unsupported attachment type (e.g. an archive).
  assert.equal(bareIntakeInput("", [{ path: "/tmp/资料.zip" }]), null);
  // Multiple attachments at once.
  assert.equal(
    bareIntakeInput("", [{ path: "/tmp/a.pdf" }, { path: "/tmp/b.pdf" }]),
    null
  );
  // Nothing dropped at all.
  assert.equal(bareIntakeInput("", []), null);
});
