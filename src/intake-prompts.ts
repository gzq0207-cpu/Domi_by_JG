// Unified intake-archive prompts shared by every "drop content into domi"
// entry point: the Feishu inbox poller (forwarded links, PDF files, images
// and data files), the local intake server (bookmarklet / phone shortcut),
// and a bare link or a lone file pasted into a fresh workbench task. All of
// them must run the same analysis and archival pipeline: full content
// extraction, structured summary card, industry/company classification,
// local library upsert with an idempotent eventId, and read-back
// verification. Links to video / podcast platforms use the media variant:
// the skill tries public subtitles first, then extracts public video audio
// for local ASR, or transcribes public podcast audio (小宇宙).

export type IntakeArticlePromptInput = {
  url: string;
  title?: string;
  source?: string;
  excerpt?: string;
};

export const INTAKE_SUMMARY_STRUCTURE = "摘要按「全文重要观点 → 论点1：主张／相应论据／相应论证 → 论点2… → 论点N…」撰写：先概括全文的重要判断，再逐项写清主张、原文的事实或数据依据，以及这些依据如何支持该主张。论点数量由全文决定，必须覆盖后半部分的重要讨论，不固定为三点，不用字数上限截掉论点。数字保留原文的时间、范围和口径；区分作者论证与整理者推断，原文未展开论证时明确说明，不补造论据。值得关注的信号另写入 investmentMeaning。";
export const INTAKE_CHINESE_POLICY = "知识存档的标题、摘要和说明统一使用简体中文；保留公司名、产品型号、链接和数字。英文原文／字幕仍完整保存，不用中文摘要替代全文。Domi 后台会使用 GPT-6 Luna／标准智能／标准速度逐段生成「中文全文」，原文保留供核对；译文尚未完成或校验失败时如实标记，不能把中文摘要称为完整译文。摘要继续使用 GPT-6.1 Sol／高智能／标准速度。";

export function intakeArticlePrompt(item: IntakeArticlePromptInput): string {
  return [
    "请采用 domi 插件的 intake-archive 技能，处理我转发到 domi 的一篇行业认知文章：打开并完整阅读原文，把全文归档进本地行业认知库（行业信息库），按行业与公司分类，并生成结构化摘要卡片。",
    INTAKE_SUMMARY_STRUCTURE,
    INTAKE_CHINESE_POLICY,
    "入库完成后在对话里向我汇报：入库结果、行业与公司分类、值得关注的信号要点。",
    "",
    item.title ? `标题：《${item.title}》` : "",
    `链接：${item.url}`,
    item.source ? `来源：${item.source}` : "",
    item.excerpt ? `转发时选中的片段：\n${item.excerpt}` : ""
  ].filter(Boolean).join("\n");
}

// Video / podcast platforms the intake-archive skill handles with dedicated
// fetch strategies (B站/YouTube use subtitles with local ASR fallback;
// 小宇宙 episodes download public audio and transcribe locally). Keep the host lists
// in sync with the skill's URL triage sections. b23.tv is B站's short-link
// domain and resolves to any B站 page, so any link there counts as media and
// the skill's triage decides the final treatment.
const MEDIA_INTAKE_HOSTS = new Set([
  "bilibili.com",
  "www.bilibili.com",
  "m.bilibili.com",
  "b23.tv",
  "www.b23.tv",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "xiaoyuzhoufm.com",
  "www.xiaoyuzhoufm.com"
]);

export function isMediaIntakeUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(String(url || ""));
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  return MEDIA_INTAKE_HOSTS.has(parsed.hostname.toLowerCase());
}

export function intakeMediaLinkPrompt(item: IntakeArticlePromptInput): string {
  return [
    "请采用 domi 插件的 intake-archive 技能，处理我转发到 domi 的一条音视频内容（视频/播客链接）：按技能的链接分诊流程确定类型（哔哩哔哩/YouTube 视频、小宇宙播客单集或普通文章）并采用对应抓取策略——视频先调用技能的 media-intake.cjs helper 获取公开字幕，字幕缺失或不完整时提取公开音频并本地转写全文；播客单集下载公开音频并本地转写全文；分诊后实为普通文章则按普通文章流程处理。把取到的完整内容归档进本地行业认知库（行业信息库），按行业与公司分类，并生成结构化摘要卡片。",
    INTAKE_SUMMARY_STRUCTURE,
    INTAKE_CHINESE_POLICY,
    "保留 helper 返回的原始字幕、逐条时间戳、validation 和 SHA-256。先检查开头、中间缺口、末尾与视频时长，再完整阅读 transcriptPath。原文通过 originalContentFile 直接从完整文件入库，传入 originalContentFileSha256，不要让模型复制或压缩字幕。写后核对 storageReceipt.originalContentVerified 和全文哈希；飞书镜像必须回读并核对完整正文。平台字幕通过时间轴校验不等于人工逐字核对，必须注明自动字幕的来源与准确性边界。",
    "请在本回合内一次性完成抓取、提炼与入库的全部步骤，不要中途停下等待确认或分段汇报。",
    "不得绕过登录、付费或地区限制。无公开字幕不代表没有可转写的音频，不得直接退回简介；必须尝试 helper 的音频转写分支。只有获取或转写确实失败才归档可获取部分，标注失败原因、转写覆盖范围和抓取缺口，不得把部分文字稿或仅简介说成全文完成。",
    "入库完成后在对话里向我汇报：入库结果、行业与公司分类、值得关注的信号要点，以及如实标注的抓取缺口。",
    "",
    item.title ? `标题：《${item.title}》` : "",
    `链接：${item.url}`,
    item.source ? `来源：${item.source}` : "",
    item.excerpt ? `转发时选中的片段：\n${item.excerpt}` : ""
  ].filter(Boolean).join("\n");
}

// Entry point for every forwarded link: pick the article or the media prompt
// variant so the agent starts from the right intake framing.
export function intakeLinkPrompt(item: IntakeArticlePromptInput): string {
  return isMediaIntakeUrl(item.url)
    ? intakeMediaLinkPrompt(item)
    : intakeArticlePrompt(item);
}

export type IntakeFileCategory = "pdf" | "spreadsheet" | "image" | "media" | "document";

const INTAKE_CATEGORY_BY_EXTENSION: Record<string, IntakeFileCategory> = {
  pdf: "pdf",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  csv: "spreadsheet",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  heic: "image",
  gif: "image",
  bmp: "image",
  mp3: "media",
  m4a: "media",
  wav: "media",
  mp4: "media",
  mov: "media"
};

// Files that count as a "bare drop" (no accompanying text) in a fresh task:
// exactly one such file means "archive this", mirroring the inbox semantics.
// The set matches the Feishu inbox attachment whitelist so both entry
// points behave identically.
const BARE_INTAKE_FILE_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx",
  "md", "txt", "json",
  "png", "jpg", "jpeg", "webp", "heic", "gif", "bmp",
  "mp3", "m4a", "wav", "mp4", "mov"
]);

export function intakeFileCategory(fileName: string): IntakeFileCategory {
  const extension = String(fileName || "").toLowerCase().split(".").pop() || "";
  return INTAKE_CATEGORY_BY_EXTENSION[extension] || "document";
}

const INTAKE_FILE_CATEGORY_LABEL: Record<IntakeFileCategory, string> = {
  pdf: "PDF 文件",
  spreadsheet: "表格数据文件",
  image: "图片文件",
  media: "音视频文件",
  document: "文档文件"
};

const INTAKE_FILE_CATEGORY_EXTRACT: Record<IntakeFileCategory, string> = {
  pdf: "完整读取并提取 PDF 全文",
  spreadsheet: "用表格解析工具逐个工作表完整读取：字段结构、行数、时间范围和关键数据点，不要只看文件名猜测内容",
  image: "完整查看图片内容：提取图中全部可见文字（OCR），并对图表或截图做视觉描述；图中没有文字时如实描述画面信息",
  media: "调用 intake-archive 的 media-intake.cjs helper 处理本地音视频文件，提取音轨并本地转写全文；长音频分段处理，失败后复用已完成分段继续转写",
  document: "完整读取并提取文档全文"
};

const INTAKE_FILE_CATEGORY_CONTENT: Record<IntakeFileCategory, string> = {
  pdf: "originalContent 写 PDF 完整提取文本；扫描图页等无法提取的部分，在结果中如实说明缺口，不得编造。",
  spreadsheet: "originalContent 写结构化提取结果：工作表清单、字段名、行数、时间范围与关键数据点；数字必须与原表一致，不得编造。",
  image: "originalContent 写 OCR 提取的全部文字与视觉描述；看不清的部分如实标注，不得编造。",
  media: "完整文字稿和来源先保存为文件，以 originalContentFile 和 originalContentFileSha256 直接入库，核对 originalContentVerified；保留带时间戳的完整转写文本，不让模型复制或压缩原文。只有转写实际失败才保存可用部分，明确失败原因和覆盖范围，不得把部分转写或元数据说成全文完成。",
  document: "originalContent 写文档完整提取文本；无法提取的部分如实说明缺口，不得编造。"
};

export function intakeFilePrompt(item: { fileName: string }): string {
  const category = intakeFileCategory(item.fileName);
  return [
    `请采用 domi 插件的 intake-archive 技能，处理我转发到 domi 的一份${INTAKE_FILE_CATEGORY_LABEL[category]}《${item.fileName}》（输入变体：本地文件代替原文链接）：${INTAKE_FILE_CATEGORY_EXTRACT[category]}，把内容归档进本地行业认知库（行业信息库），按行业与公司分类，并生成结构化摘要卡片。`,
    INTAKE_SUMMARY_STRUCTURE,
    INTAKE_CHINESE_POLICY,
    "文件输入与链接输入的差异（其余流程与该技能完全一致）：",
    `- payload 中 url 留空；source 填「转发文件：${item.fileName}」；publishedAt 用文件内容中的时间线索，没有就用当前时间。`,
    `- ${INTAKE_FILE_CATEGORY_CONTENT[category]}`,
    "- 必须显式传 eventId（不要依赖 url 派生）：优先用文件内容 SHA-256 的前 16 个十六进制字符；同一文件重复转发自动更新同一条记录，不得新建重复记录。",
    "入库完成后在对话里向我汇报：入库结果、行业与公司分类、值得关注的信号要点。"
  ].join("\n");
}

const INTAKE_BARE_URL_PATTERN = /^(https?:\/\/\S+)$/i;

export type BareIntakeInput =
  | { kind: "url"; url: string }
  | { kind: "file"; fileName: string }
  | null;

// A "bare" input is a single URL with no surrounding instruction, or no text
// at all alongside exactly one supported file attachment (PDF, spreadsheet,
// image, media or document). Dropping such content into a fresh task means
// "archive this", mirroring the Feishu inbox semantics; any explicit wording
// keeps the normal conversational routing.
export function bareIntakeInput(
  rawInput: string,
  attachments: ReadonlyArray<{ path: string }>
): BareIntakeInput {
  const trimmed = String(rawInput || "").trim();
  const bareUrl = trimmed.match(INTAKE_BARE_URL_PATTERN);
  if (bareUrl && attachments.length === 0) {
    return { kind: "url", url: bareUrl[1] };
  }
  if (!trimmed && attachments.length === 1) {
    const [only] = attachments;
    const fileName = only.path.split(/[\\/]/).pop() || only.path;
    const extension = fileName.toLowerCase().split(".").pop() || "";
    if (BARE_INTAKE_FILE_EXTENSIONS.has(extension)) {
      return {
        kind: "file",
        fileName
      };
    }
  }
  return null;
}
