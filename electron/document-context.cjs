// Retrieval bridge: turns a user's request into local-library search leads
// that are injected into the Codex runtime context. This is intentionally a
// heuristic keyword pipeline plus local semantic recall, with explicit
// source-scoped retrieval and lossless original-section hydration.

const MAX_KEYWORDS = 12;
const KEYWORD_MIN_CODEPOINTS = 2;
const MAX_SEARCHES = 12;
const SEARCH_LIMIT_PER_KEYWORD = 20;
const MAX_CONTEXT_CHARS = 28_000;
const MAX_SNIPPET_CHARS = 800;
const MAX_FUSED_RESULTS = 16;
const RRF_K = 60;
const SEMANTIC_QUERY_MAX_CHARS = 3_000;
const LATIN_STOPWORDS = new Set([
  "the", "and", "for", "with", "about", "into", "from", "that", "this",
  "what", "when", "which", "please", "help", "find", "look", "give",
  "tell", "make", "need", "want", "have", "does", "onto", "over", "domi"
]);
const CJK_STOPWORDS = new Set([
  "我们", "你们", "他们", "这个", "那个", "什么", "怎么", "如何",
  "可以", "应该", "还是", "以及", "因为", "所以", "但是", "然后",
  "所有", "哪些", "有没有", "整理", "分析", "研究", "总结", "归纳",
  "对比", "复盘", "看看", "查查", "进展", "情况", "问题", "东西",
  "基于", "根据", "结合", "我的", "你的", "资料库", "本地", "材料", "内容", "回答",
  "主要", "相关", "比较", "变化", "请问", "最近", "说明", "分析一下", "使用"
]);
// Function-word filler stripped from the edges of CJK runs. Trimming keeps
// the content word (帮我整理一下 → 整理) and lets the stopword filter finish
// the job instead of promoting a whole instruction phrase to a keyword.
const CJK_LEADING_FILLER = /^(?:请|麻烦|帮我|帮忙|给我|我想|我要|顺便|再|又|就|都|也|还|并且|然后|但是|所以|因为|的|了|是|和|与|对|在)+/;
const CJK_TRAILING_FILLER = /(?:一下|看看|怎么办|怎么样|如何|吗|呢|吧|啊|哈|么|的|了|是)+$/;

function codePointLength(value) {
  return [...String(value || "")].length;
}

function isStopword(candidate) {
  return CJK_STOPWORDS.has(candidate) || LATIN_STOPWORDS.has(candidate.toLowerCase("en-US"));
}

// CJK runs are trimmed of filler, then kept whole when short (they read as
// one word, e.g. 融资节奏). Long unsegmented runs degrade into a few evenly
// spread trigrams — without a segmenter that is the best bounded heuristic.
function cjkKeywordsFromRun(run) {
  const trimmed = run
    .replace(CJK_LEADING_FILLER, "")
    .replace(CJK_TRAILING_FILLER, "");
  if (!trimmed) return [];
  const chars = [...trimmed];
  const length = chars.length;
  if (typeof Intl.Segmenter === "function") {
    const segments = [...new Intl.Segmenter("zh-CN", { granularity: "word" }).segment(trimmed)]
      .filter((item) => item.isWordLike).map((item) => item.segment);
    const meaningful = [];
    for (let index = 0; index < segments.length; index += 1) {
      const word = segments[index];
      if (word.length >= 2 && !isStopword(word)) {
        meaningful.push(segments[index + 1] === "化" ? `${word}化` : word);
      }
    }
    if (meaningful.length) return [...new Set([...(length <= 6 && !isStopword(trimmed) ? [trimmed] : []), ...meaningful])];
  }
  if (length <= 6) return [trimmed];
  const picks = Math.min(3, Math.max(1, Math.floor(length / 4)));
  const step = picks > 1 ? (length - 3) / (picks - 1) : 0;
  const keywords = [];
  for (let index = 0; index < picks; index += 1) {
    const start = Math.round(index * step);
    keywords.push(chars.slice(start, start + 3).join(""));
  }
  return [...new Set(keywords)];
}

function keywordCandidatesFromText(text) {
  const candidates = [];
  const cleaned = String(text || "")
    .replace(/(?:请)?(?:只|仅)?(?:基于|根据|结合|使用|读取|检索|查询)\s*(?:我(?:的)?|你(?:的)?)?\s*(?:domi\s*)?(?:本地)?资料库/gi, " ");
  for (const match of cleaned.matchAll(/[\u3400-\u9FFF\u3040-\u30FF]+|[A-Za-z][A-Za-z0-9-]{1,}|\b20\d{2}\b/g)) {
    const token = match[0];
    if (/[A-Za-z]/.test(token)) {
      const lowered = token.toLowerCase("en-US");
      if (!LATIN_STOPWORDS.has(lowered)) candidates.push(lowered);
      continue;
    }
    candidates.push(...cjkKeywordsFromRun(token));
  }
  return candidates;
}

function extractSearchKeywords(requestText) {
  const seen = new Set();
  const keywords = [];
  for (const candidate of keywordCandidatesFromText(requestText)) {
    if (codePointLength(candidate) < KEYWORD_MIN_CODEPOINTS) continue;
    if (isStopword(candidate)) continue;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    keywords.push(candidate);
    if (keywords.length >= MAX_KEYWORDS) break;
  }
  return keywords;
}

function clipSnippet(snippet) {
  const value = String(snippet || "").trim();
  return value.length <= MAX_SNIPPET_CHARS ? value : `${value.slice(0, MAX_SNIPPET_CHARS)}…`;
}

// Merges multi-keyword result sets: earlier (more prominent) keywords keep
// priority, ties break toward documents that matched multiple keywords.
// Each set corresponds to keywords[index]; the per-document matched-keyword set
// feeds sub-question coverage reranking downstream.
function mergeSearchResults(resultSets, keywords = []) {
  const byPath = new Map();
  for (const [index, results] of (resultSets || []).entries()) {
    const keyword = keywords[index];
    for (const result of results || []) {
      const existing = byPath.get(result.path);
      if (existing) {
        existing.keywordHits += 1;
        if (keyword) existing.matchedKeywords.add(keyword);
        const locations = existing.locations || (existing.locations = []);
        if (locations.length < 3 && !locations.some((item) => item.line === result.line && item.offset === result.offset)) locations.push(result);
        continue;
      }
      byPath.set(result.path, { ...result, keywordHits: 1, matchedKeywords: new Set(keyword ? [keyword] : []), locations: [result] });
    }
  }
  return [...byPath.values()];
}

// Multiple chunks of the same document collapse to the best-scoring one:
// the injected context is document-level, one snippet per path.
function dedupeSemanticResults(results) {
  const byPath = new Map();
  for (const result of results || []) {
    if (!result?.path) continue;
    const items = byPath.get(result.path) || [];
    items.push(result);
    byPath.set(result.path, items);
  }
  return [...byPath.values()].map((items) => {
    items.sort((left, right) => (right.score || 0) - (left.score || 0));
    return { ...items[0], locations: items.slice(0, 3) };
  });
}

// Reciprocal-rank fusion of the two retrieval channels. Each list contributes
// 1/(k + rank); a document found by both channels wins even when neither rank
// is top. The snippet/line shown comes from whichever channel ranked it better.
function reciprocalRankFusion(keywordResults, semanticResults, k = RRF_K) {
  const byPath = new Map();
  const add = (result, rank, channel) => {
    const existing = byPath.get(result.path);
    const contribution = 1 / (k + rank + 1);
    if (!existing) {
      byPath.set(result.path, {
        ...result,
        fusedScore: contribution,
        bestRank: rank,
        bestChannel: channel,
        keywordHits: result.keywordHits || 0,
        locations: result.locations || [{ ...result }]
      });
      return;
    }
    existing.fusedScore += contribution;
    const previousLocations = existing.locations;
    const incomingLocations = result.locations || [result];
    existing.locations = (rank < existing.bestRank ? [...incomingLocations, ...previousLocations] : [...previousLocations, ...incomingLocations])
      .filter((item, index, items) => items.findIndex((other) => other.line === item.line && other.offset === item.offset) === index).slice(0, 4);
    if (rank < existing.bestRank) {
      existing.bestRank = rank;
      existing.bestChannel = channel;
      existing.relativePath = result.relativePath || existing.relativePath;
      existing.snippet = result.snippet || existing.snippet;
      existing.line = result.line || existing.line;
      existing.offset = result.offset;
    }
  };
  (keywordResults || []).forEach((result, index) => add(result, index, "keyword"));
  (semanticResults || []).forEach((result, index) => add(result, index, "semantic"));
  return [...byPath.values()].sort((left, right) =>
    (right.fusedScore - left.fusedScore)
      || (right.keywordHits - left.keywordHits)
      || (right.mtimeMs || 0) - (left.mtimeMs || 0));
}

// 问题里明确点名的对象：引号/书名号内的词，以及连续大写开头的英文专名。
// 实体命中是重排的信号，不是穷尽判定；未点名不惩罚。
function questionEntities(requestText) {
  const entities = new Set();
  const text = String(requestText || "");
  for (const match of text.matchAll(/[「『“]([^「」『』“”]{2,40})[」』”]|《([^《》]{2,40})》/g)) {
    const value = String(match[1] || match[2] || "").trim().toLowerCase();
    if (value && !isStopword(value)) entities.add(value);
  }
  for (const match of text.matchAll(/\b[A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*\b/g)) {
    const value = match[0].toLowerCase();
    if (!LATIN_STOPWORDS.has(value)) entities.add(value);
  }
  return [...entities];
}

// 问题里点名的年份（2020–2100）：用于日期邻近重排。
function questionYears(requestText) {
  const years = new Set();
  for (const match of String(requestText || "").matchAll(/\b(20[2-9]\d)\s*(?:年|年度|\.|-|–|—)?/g)) {
    years.add(Number(match[1]));
  }
  return [...years];
}

function documentYearOf(result) {
  const fromText = String(result?.date || "").match(/(20\d{2})/);
  if (fromText) return Number(fromText[1]);
  if (Number.isFinite(result?.mtimeMs) && result.mtimeMs > 0) {
    return new Date(result.mtimeMs).getFullYear();
  }
  return 0;
}

// 重排：在 RRF 融合分之上叠加保守的确定性加分——子问题（关键词）覆盖、
// 命名实体命中、日期邻近。加分总和小于一个 RRF 名次步长，只能提升同名次
// 附近的排序，不会压过双通道共同命中的文档；不宣称排序即质量优势。
function rerankFusedResults(results, { keywords = [], requestText = "" } = {}) {
  const entities = questionEntities(requestText);
  const years = questionYears(requestText);
  return results.map((result) => {
    const matchedKeywords = result.matchedKeywords instanceof Set ? [...result.matchedKeywords] : [];
    const coverage = keywords.length ? matchedKeywords.length / keywords.length : 0;
    const haystack = `${result.title || ""}\n${result.snippet || ""}\n${result.relativePath || ""}`.toLowerCase();
    const entityHits = entities.filter((entity) => haystack.includes(entity)).length;
    const documentYear = documentYearOf(result);
    const dateBoost = years.length && documentYear
      ? (years.includes(documentYear) ? 1 : 1 / (1 + Math.min(5, Math.abs(years[0] - documentYear))))
      : 0;
    const bonus = 0.004 * coverage
      + 0.003 * Math.min(entityHits, 2)
      + 0.003 * dateBoost;
    return { ...result, rerankScore: (result.fusedScore || 0) + bonus, coverage, entityHits, dateBoost };
  }).sort((left, right) =>
    (right.rerankScore - left.rerankScore)
      || (right.keywordHits - left.keywordHits)
      || (right.mtimeMs || 0) - (left.mtimeMs || 0));
}

function formatDocumentContext(keywords, results, options = {}) {
  if (!results.length) return "";
  const maxChars = options.maxChars || MAX_CONTEXT_CHARS;
  const blocks = ["domi 本地资料检索线索与已展开原文（检索命中不等于证据成立；只能根据已提供或实际读取的范围回答，缺口请继续检索／续读）："];
  for (const result of results) {
      const location = result.line
        ? `${result.relativePath}:${result.line}`
        : result.relativePath;
      const snippet = clipSnippet(result.snippet);
      const block = result.content
        ? `[${result.sourceId || "资料"}] ${result.title || location}${result.date ? ` · ${result.date}` : ""}\n来源：${location}；${result.fullDocument ? "全文" : result.sectionTitle || "相关章节"}；${result.truncated ? "部分读取，仍有未读内容" : "所示范围完整"}\n<domi-source-data>\n${result.content}\n</domi-source-data>\n${result.nextCursor ? `续读位置：${result.nextCursor}` : ""}`
        : `- ${location}${snippet ? ` —— ${snippet}` : ""}（检索线索，尚未展开正文）`;
      if (blocks.join("\n\n").length + block.length + 400 > maxChars) {
        blocks.push("本轮原文预算已用完；其余候选尚未提供，请按需继续搜索和读取。");
        break;
      }
      blocks.push(block);
      options.onIncluded?.(result);
  }
  return blocks.join("\n\n");
}

async function retrieveDocuments({ search, semanticSearch, requestText, settings, allowedPaths }) {
  if (settings?.storageBackend !== "local" && allowedPaths === undefined) return { results: [], keywords: [], warnings: [] };
  const keywords = extractSearchKeywords(requestText);
  const semanticEnabled = settings?.semanticSearchEnabled !== false && typeof semanticSearch === "function";
  if (!keywords.length && !semanticEnabled) return { results: [], keywords: [], warnings: [] };
  const warnings = new Set();
  const collect = (result) => {
    if (result?.partial || result?.indexing) warnings.add("文档索引尚不完整，检索结果可能缺少资料。");
    if (result?.degraded) warnings.add("检索已降级，部分正文或语义候选可能未覆盖。");
    if (result?.ok === false) warnings.add("部分检索失败，不能据此认定资料库没有相关内容。");
    for (const item of result?.results || []) {
      if (item.contentStatus === "truncated") warnings.add(`${item.relativePath} 的搜索索引只覆盖部分正文，可继续分段读取原文。`);
      if (["blocked", "unreadable"].includes(item.contentStatus)) warnings.add(`${item.relativePath} 仅匹配文件名，正文尚未成功索引。`);
    }
    return (result?.results || []).filter((item) => allowedPaths === undefined || allowedPaths.includes(item.path));
  };
  // The semantic channel embeds the request itself, so it survives even when
  // keyword extraction is empty (function-word-only requests). A failure or
  // timeout in either channel must never block the run.
  const [resultSets, semanticResponse] = await Promise.all([
    keywords.length
      ? Promise.all(
          keywords.slice(0, MAX_SEARCHES).map((keyword) =>
            search(keyword, { limit: SEARCH_LIMIT_PER_KEYWORD, ...(allowedPaths === undefined ? {} : { allowedPaths }) })
              .then(collect)
              .catch(() => { warnings.add("关键词检索失败，不能据此认定资料库没有相关内容。"); return []; })
          )
        ).catch(() => [])
      : Promise.resolve([]),
    semanticEnabled
      ? semanticSearch(String(requestText || "").slice(0, SEMANTIC_QUERY_MAX_CHARS), {
          limit: 40, ...(allowedPaths === undefined ? {} : { allowedPaths })
        })
          .then((result) => {
            if (result?.available === false) warnings.add("语义模型或索引尚未就绪，语义结果未参与本轮召回。");
            return collect(result);
          })
          .catch(() => { warnings.add("语义检索失败，本轮使用关键词检索。"); return []; })
      : Promise.resolve([])
  ]);
  const merged = mergeSearchResults(resultSets, keywords)
    .sort((left, right) =>
      (right.keywordHits - left.keywordHits)
      || (right.mtimeMs || 0) - (left.mtimeMs || 0));
  const semantic = dedupeSemanticResults(semanticResponse);
  const fused = rerankFusedResults(reciprocalRankFusion(merged, semantic), { keywords, requestText });
  return { results: fused, keywords, warnings: [...warnings] };
}

async function buildDocumentContext({ read, onSourceIncluded, prepareSource, preferredPaths = [], maxChars = MAX_CONTEXT_CHARS, ...options }) {
  const retrieved = await retrieveDocuments(options);
  // Explicitly selected attachments must not vanish when a generic question
  // has no matching keyword or when the global index is still warming up.
  const preferred = [...new Set(preferredPaths)].map((filePath) => retrieved.results.find((item) => item.path === filePath)
    || { path: filePath, relativePath: require("node:path").basename(filePath), locations: [{}] });
  const selected = [...preferred, ...retrieved.results.filter((item) => !preferredPaths.includes(item.path))].slice(0, Math.max(MAX_FUSED_RESULTS, preferred.length));
  const sources = [];
  const warnings = [...retrieved.warnings];
  let remaining = Math.max(0, maxChars - Math.min(4_000, Math.floor(maxChars / 4)));
  for (const [index, result] of selected.entries()) {
    if (!read || remaining < 600) { sources.push(result); continue; }
    const locations = (result.locations || [result]).slice(0, 2);
    for (const location of locations) {
      if (remaining < 600) break;
      try {
        const document = await read({ path: result.path, line: location.line, offset: location.offset,
          anchorText: location.snippet, keywords: retrieved.keywords, mode: "section",
          maxChars: Math.min(6_000, Math.max(800, Math.floor(remaining / Math.min(8, selected.length - index)))) });
        if (!document?.ok || !document.content) { warnings.push(`无法读取 ${result.relativePath} 的正文。`); continue; }
        for (const warning of document.warnings || []) warnings.push(`${document.title}：${warning}`);
        if (sources.some((source) => source.path === document.path && source.startOffset <= document.startOffset && source.endOffset >= document.endOffset)) continue;
        remaining -= document.content.length;
        const source = { ...result, ...document, line: document.startLine };
        sources.push(prepareSource ? prepareSource(source) : source);
      } catch { warnings.push(`无法读取 ${result.relativePath} 的正文，请继续核验原始材料。`); }
    }
  }
  const included = [];
  const context = formatDocumentContext(retrieved.keywords, sources, { maxChars: Math.max(500, maxChars - 1_500),
    onIncluded: (source) => { included.push(source); if (source.content) onSourceIncluded?.(source); } });
  const visibleWarnings = [];
  for (const warning of [...new Set(warnings)]) {
    if (context.length + visibleWarnings.join(" ").length + warning.length + 120 > maxChars) break;
    visibleWarnings.push(warning);
  }
  const warningContext = warnings.length ? `\n\n资料覆盖说明：${visibleWarnings.join(" ")}${visibleWarnings.length < new Set(warnings).size ? " 更多缺口请查看本轮资料记录。" : ""}` : "";
  return { context: context + warningContext, keywords: retrieved.keywords, sources: included,
    candidateCount: new Set([...preferredPaths, ...retrieved.results.map((result) => result.path)]).size,
    candidatePaths: [...new Set([...preferredPaths, ...retrieved.results.map((result) => result.path)])], warnings: [...new Set(warnings)] };
}

module.exports = {
  extractSearchKeywords,
  buildDocumentContext,
  dedupeSemanticResults,
  formatDocumentContext,
  mergeSearchResults,
  questionEntities,
  questionYears,
  reciprocalRankFusion,
  rerankFusedResults,
  retrieveDocuments
};
