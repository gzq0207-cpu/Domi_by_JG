const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildDocumentContext,
  dedupeSemanticResults,
  extractSearchKeywords,
  formatDocumentContext,
  mergeSearchResults,
  questionEntities,
  questionYears,
  reciprocalRankFusion,
  rerankFusedResults,
  retrieveDocuments
} = require("../electron/document-context.cjs");

test("library question wording does not displace the actual topics and dates", () => {
  const keywords = extractSearchKeywords("请基于我的Domi资料库，分析AI Agent商业化的主要瓶颈，并比较2025年和2026年的观点变化");
  assert.ok(keywords.includes("商业化"));
  assert.ok(keywords.includes("瓶颈"));
  assert.ok(keywords.includes("agent"));
  assert.ok(keywords.includes("2025"));
  assert.ok(!keywords.some((keyword) => ["基于我", "domi", "资料库"].includes(keyword)));
});

test("one document retains several relevant locations for chapter expansion", () => {
  const results = dedupeSemanticResults([
    { path: "a.md", line: 10, score: 0.9, snippet: "成本" },
    { path: "a.md", line: 80, score: 0.8, snippet: "客户" },
    { path: "a.md", line: 160, score: 0.7, snippet: "竞争" }
  ]);
  assert.equal(results[0].locations.length, 3);
});

test("context hydrates original sections and does not cut an evidence block in half", async () => {
  const result = await buildDocumentContext({
    search: async () => ({ ok: true, results: [{ path: "a.md", relativePath: "a.md", line: 20, snippet: "短检索线索" }] }),
    requestText: "商业化", settings: { storageBackend: "local", semanticSearchEnabled: false },
    read: async (request) => ({ ok: true, path: request.path, relativePath: "a.md", title: "报告", sectionTitle: "成本",
      content: "完整的章节论证。".repeat(150), startOffset: 100, endOffset: 1450, startLine: 15, truncated: false }),
    maxChars: 4000
  });
  assert.match(result.context, /完整的章节论证/);
  assert.equal((result.context.match(/<domi-source-data>/g) || []).length, (result.context.match(/<\/domi-source-data>/g) || []).length);
  assert.ok(result.context.length <= 4000);
});

test("keyword extraction keeps CJK words, Latin terms, and drops stopwords", () => {
  const keywords = extractSearchKeywords("帮我整理一下 美团 融资 的最新进展，ExampleCo 怎么看？");
  assert.ok(keywords.includes("美团"));
  assert.ok(keywords.includes("融资"));
  assert.ok(keywords.includes("exampleco"));
  assert.ok(keywords.includes("最新进展"));
  assert.equal(keywords.includes("整理"), false, "instruction verbs are dropped");
  assert.equal(keywords.includes("怎么"), false);
});

test("long CJK runs degrade into sliding trigrams instead of one giant keyword", () => {
  const keywords = extractSearchKeywords("这家公司近期完成了多轮融资并且扩张迅速背后逻辑");
  assert.ok(keywords.length > 1);
  assert.ok(keywords.every((keyword) => [...keyword].length <= 3));
});

test("keyword extraction caps the total number of keywords", () => {
  const keywords = extractSearchKeywords("苹果 香蕉 橙子 葡萄 西瓜 芒果 荔枝 龙眼");
  assert.ok(keywords.length <= 12);
});

function fakeSearch(indexedByKeyword) {
  return (query) => {
    const results = indexedByKeyword[query];
    if (results === undefined) {
      return Promise.reject(new Error("search unavailable"));
    }
    return Promise.resolve({ ok: true, results });
  };
}

test("the retrieval bridge merges multi-keyword hits and formats prompt context", async () => {
  const bridge = await buildDocumentContext({
    search: fakeSearch({
      融资: [
        {
          path: "/library/纪要.md",
          relativePath: "纪要.md",
          line: 3,
          snippet: "讨论了融资节奏与估值。",
          mtimeMs: 100
        }
      ],
      美团: [
        {
          path: "/library/纪要.md",
          relativePath: "纪要.md",
          line: 3,
          snippet: "讨论了融资节奏与估值。",
          mtimeMs: 100
        },
        {
          path: "/library/美团研究.md",
          relativePath: "美团研究.md",
          line: undefined,
          snippet: "公司概况。",
          mtimeMs: 200
        }
      ]
    }),
    requestText: "美团 融资",
    settings: { storageBackend: "local" }
  });
  assert.deepEqual(bridge.keywords, ["美团", "融资"]);
  assert.match(bridge.context, /domi 本地资料检索线索/);
  assert.match(bridge.context, /纪要\.md:3/);
  assert.match(bridge.context, /讨论了融资节奏与估值/);
  // The document matched by both keywords comes first.
  assert.ok(bridge.context.indexOf("纪要.md:3") < bridge.context.indexOf("美团研究.md"));
  assert.equal(bridge.context.includes("/library"), false, "absolute paths must not leak into prompts");
});

test("search failures degrade to an empty context without keywords lost", async () => {
  const bridge = await buildDocumentContext({
    search: fakeSearch({}),
    requestText: "美团 融资",
    settings: { storageBackend: "local" }
  });
  assert.match(bridge.context, /检索失败/);
  assert.deepEqual(bridge.keywords, ["美团", "融资"]);
});

test("non-local backends and empty requests never run searches", async () => {
  let searchCalls = 0;
  const search = () => {
    searchCalls += 1;
    return Promise.resolve({ ok: true, results: [] });
  };
  const feishuBackend = await buildDocumentContext({
    search,
    requestText: "美团 融资",
    settings: { storageBackend: "legacy_feishu_primary" }
  });
  assert.equal(feishuBackend.context, "");
  assert.equal(searchCalls, 0);
  const noKeywords = await buildDocumentContext({
    search,
    requestText: "帮我看看",
    settings: { storageBackend: "local" }
  });
  assert.equal(noKeywords.context, "");
  assert.equal(searchCalls, 0);
});

test("merged results break ties toward newer documents and clip snippets", () => {
  const merged = mergeSearchResults([
    [
      { path: "old.md", mtimeMs: 1, snippet: "x" },
      { path: "new.md", mtimeMs: 9, snippet: "y" }
    ]
  ]);
  assert.equal(merged.length, 2);
  const formatted = formatDocumentContext(
    ["k"],
    [
      {
        relativePath: "长文.md",
        line: 2,
        snippet: "长".repeat(1400),
        mtimeMs: 1
      }
    ]
  );
  assert.ok(formatted.length <= 28_000);
  assert.ok(formatted.includes("…"));
});

test("empty result sets produce no context", () => {
  assert.equal(formatDocumentContext(["k"], []), "");
});

test("dedupeSemanticResults keeps the best chunk per document", () => {
  const deduped = dedupeSemanticResults([
    { path: "a.md", snippet: "第一块", score: 0.4 },
    { path: "a.md", snippet: "更相关的块", score: 0.9 },
    { path: "b.md", snippet: "另一文档", score: 0.7 }
  ]);
  assert.equal(deduped.length, 2);
  assert.equal(deduped.find((item) => item.path === "a.md").snippet, "更相关的块");
});

test("reciprocal rank fusion promotes documents found by both channels", () => {
  const keywordResults = [
    { path: "b.md", snippet: "关键词首位", keywordHits: 1 },
    { path: "a.md", snippet: "关键词次位", keywordHits: 1 },
    { path: "c.md", snippet: "仅关键词", keywordHits: 1 }
  ];
  const semanticResults = [
    { path: "a.md", snippet: "语义首位", line: 12, score: 0.91 }
  ];
  const fused = reciprocalRankFusion(keywordResults, semanticResults);
  // a.md: 1/(60+2) + 1/(60+1) beats b.md's 1/(60+1) alone.
  assert.equal(fused[0].path, "a.md");
  assert.equal(fused[0].snippet, "语义首位", "snippet comes from the better-ranked channel");
  assert.equal(fused[0].line, 12);
  assert.equal(fused[0].locations[0].line, 12, "chapter expansion should prioritize the better retrieval hit");
  assert.doesNotThrow(() => JSON.stringify(fused), "location metadata must not contain circular references");
  assert.equal(fused[1].path, "b.md");
  assert.ok(fused[0].fusedScore > fused[1].fusedScore);
});

test("semantic channel injects results even without extractable keywords", async () => {
  const bridge = await buildDocumentContext({
    search: () => Promise.reject(new Error("unused")),
    semanticSearch: () => Promise.resolve({
      ok: true,
      available: true,
      results: [
        { path: "/lib/会议.md", relativePath: "会议.md", line: 5, snippet: "上次讨论的结论。", score: 0.88 }
      ]
    }),
    requestText: "帮我看看上次聊的结论",
    settings: { storageBackend: "local", semanticSearchEnabled: true }
  });
  assert.ok(Array.isArray(bridge.keywords));
  assert.match(bridge.context, /会议\.md:5/);
  assert.match(bridge.context, /上次讨论的结论/);
});

test("semantic channel is skipped when disabled or unavailable", async () => {
  let semanticCalls = 0;
  const semanticSearch = () => {
    semanticCalls += 1;
    return Promise.resolve({ ok: true, available: true, results: [] });
  };
  const disabled = await buildDocumentContext({
    search: () => Promise.resolve({ ok: true, results: [] }),
    semanticSearch,
    requestText: "美团 融资",
    settings: { storageBackend: "local", semanticSearchEnabled: false }
  });
  assert.equal(semanticCalls, 0, "disabled setting must not call semantic search");
  assert.equal(disabled.context, "");
  const unavailable = await buildDocumentContext({
    search: () => Promise.resolve({ ok: true, results: [] }),
    semanticSearch: () => {
      semanticCalls += 1;
      return Promise.resolve({ ok: true, available: false, results: [] });
    },
    requestText: "美团 融资",
    settings: { storageBackend: "local", semanticSearchEnabled: true }
  });
  assert.match(unavailable.context, /语义模型或索引尚未就绪/);
  assert.equal(semanticCalls, 1);
});

test("semantic failures never block the keyword channel", async () => {
  const bridge = await buildDocumentContext({
    search: () => Promise.resolve({
      ok: true,
      results: [
        { path: "/lib/纪要.md", relativePath: "纪要.md", line: 1, snippet: "关键词命中。", mtimeMs: 1 }
      ]
    }),
    semanticSearch: () => Promise.reject(new Error("model not ready")),
    requestText: "美团 融资",
    settings: { storageBackend: "local", semanticSearchEnabled: true }
  });
  assert.match(bridge.context, /纪要\.md/);
});

test("question entities and years extract the named objects and time scope", () => {
  assert.deepEqual(questionEntities("「英伟达」的推理成本和《数据中心供电》的报告"), ["英伟达", "数据中心供电"]);
  assert.deepEqual(questionEntities("NVIDIA 和 TSMC 的产能对比"), ["nvidia", "tsmc"]);
  assert.deepEqual(questionEntities("帮我看看这篇"), []);
  assert.deepEqual(questionYears("比较2025年和2026年的观点变化"), [2025, 2026]);
  assert.deepEqual(questionYears("没有年份的问题"), []);
});

test("rerank promotes sub-question coverage without overriding dual-channel wins", () => {
  const keywords = ["美团", "融资", "估值"];
  // 三份文档：a/b 各命中 1 个关键词，c 在每个关键词的结果集中都出现（命中 3 个）。
  const merged = mergeSearchResults([
    [{ path: "a.md", relativePath: "a.md", snippet: "美团讨论", mtimeMs: 1 },
     { path: "c.md", relativePath: "c.md", snippet: "美团融资估值", mtimeMs: 1 }],
    [{ path: "b.md", relativePath: "b.md", snippet: "融资讨论", mtimeMs: 1 },
     { path: "c.md", relativePath: "c.md", snippet: "美团融资估值", mtimeMs: 1 }],
    [{ path: "c.md", relativePath: "c.md", snippet: "美团融资估值", mtimeMs: 1 }]
  ], keywords);
  const reranked = rerankFusedResults(merged.map((result) => ({ ...result, fusedScore: 0.02 })), { keywords });
  assert.equal(reranked[0].path, "c.md", "命中全部子问题的文档排最前");
  assert.equal(reranked[0].coverage, 1);
  // 加分小于一个 RRF 名次步长（1/61≈0.0164），不能压过双通道共同命中。
  assert.ok(reranked[0].rerankScore - 0.02 < 0.0164);
  const dominant = rerankFusedResults([
    { path: "dual.md", relativePath: "dual.md", snippet: "美团融资估值", fusedScore: 0.035, keywordHits: 3, matchedKeywords: new Set(keywords) },
    { path: "single.md", relativePath: "single.md", snippet: "美团融资估值", fusedScore: 0.02, keywordHits: 1, matchedKeywords: new Set(["美团"]) }
  ], { keywords });
  assert.equal(dominant[0].path, "dual.md", "加分不改变双通道胜出者");
});

test("rerank promotes named entities and date proximity through the full pipeline", async () => {
  const hits = {
    美团: [
      { path: "/lib/entity.md", relativePath: "entity.md", title: "英伟达调研", line: 1, snippet: "GPU 供给紧张。", mtimeMs: 1 },
      { path: "/lib/plain.md", relativePath: "plain.md", title: "行业记录", line: 1, snippet: "一些内容。", mtimeMs: 1 }
    ]
  };
  const entityResult = await retrieveDocuments({
    search: (keyword) => Promise.resolve({ ok: true, results: hits[keyword] || hits.美团 }),
    requestText: "「英伟达」的供给情况",
    settings: { storageBackend: "local", semanticSearchEnabled: false }
  });
  assert.equal(entityResult.results[0].path, "/lib/entity.md");
  assert.equal(entityResult.results[0].entityHits, 1);

  const dated = {
    美团: [
      { path: "/lib/new.md", relativePath: "new.md", title: "最新记录", date: "2026-09-01", line: 1, snippet: "内容。", mtimeMs: 1 },
      { path: "/lib/old.md", relativePath: "old.md", title: "历史记录", date: "2019-01-01", line: 1, snippet: "内容。", mtimeMs: 1 }
    ]
  };
  const dateResult = await retrieveDocuments({
    search: (keyword) => Promise.resolve({ ok: true, results: dated[keyword] || dated.美团 }),
    requestText: "2026 年的行业记录",
    settings: { storageBackend: "local", semanticSearchEnabled: false }
  });
  assert.equal(dateResult.results[0].path, "/lib/new.md");
  assert.equal(dateResult.results[0].dateBoost, 1);
  assert.ok(dateResult.results[1].dateBoost < 1);
});

test("rerank never downgrades results when the question has no entities or years", () => {
  const results = [
    { path: "a.md", relativePath: "a.md", snippet: "x", fusedScore: 0.03 },
    { path: "b.md", relativePath: "b.md", snippet: "y", fusedScore: 0.02 }
  ];
  const reranked = rerankFusedResults(results, { keywords: ["k"], requestText: "普通问题" });
  assert.equal(reranked[0].path, "a.md");
});
