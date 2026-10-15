import canonicalTaxonomy from "../shared/investment-taxonomy.json" with { type: "json" };
import chainSegments from "../shared/investment-chain-segments.json" with { type: "json" };

export const RADAR_DOMAIN_ORDER = [
  "能源与电力",
  "数据中心基础设施",
  "算力芯片",
  "服务器与整机制造",
  "互联与网络",
  "云与算力服务",
  "模型层",
  "基础软件与工具链",
  "Agent与平台",
  "应用",
  "终端与具身"
] as const;

export type RadarDomain = (typeof RADAR_DOMAIN_ORDER)[number];

export const LEGACY_RADAR_DEFAULT_DOMAINS: RadarDomain[] = [
  "算力芯片",
  "数据中心基础设施",
  "模型层",
  "Agent与平台",
  "应用"
];

export const SEGMENT_DIRECTORIES = chainSegments.segments as ReadonlyArray<{
  name: string;
  directory: string;
}>;

const LEGACY_DOMAIN_ALIASES: Readonly<Record<string, string>> = chainSegments.legacyDomainAliases;

const RADAR_DOMAIN_SET = new Set<string>(RADAR_DOMAIN_ORDER);

export function normalizeRadarDomains(
  value: unknown,
  fallback: readonly RadarDomain[] = LEGACY_RADAR_DEFAULT_DOMAINS
): RadarDomain[] {
  if (!Array.isArray(value)) return [...fallback];
  const selected = new Set(
    value
      .map((item) => String(item || "").trim())
      .map((item) => LEGACY_DOMAIN_ALIASES[item] || item)
  );
  return RADAR_DOMAIN_ORDER.filter((domain) => selected.has(domain));
}

export function radarTaxonomyPrompt(
  domains: readonly string[],
  customSubdomains: ReadonlyArray<{ parentDomain: string; name: string }> = []
) {
  const selected = normalizeRadarDomains(domains, []);
  const selectedSet = new Set<string>(selected);
  // 用户自定义子领域（custom_taxonomy）与 canonical 环节合入同一行，雷达
  // 搜索与分类都把自定义环节当合法目标（如 CPU、堆叠架构、光芯片、CPO、
  // DPU、AI硬件、个人Agent）。
  const customByDomain = new Map<string, string[]>();
  for (const custom of customSubdomains || []) {
    const parent = String(custom?.parentDomain || "").trim();
    const name = String(custom?.name || "").trim();
    if (!parent || !name || !selectedSet.has(parent)) continue;
    let list = customByDomain.get(parent);
    if (!list) {
      list = [];
      customByDomain.set(parent, list);
    }
    list.push(name);
  }
  return [
    "本轮行业新闻的领域范围只允许使用 followed_domains 中的值；不得自行扩大范围。领域／子领域必须使用项目库 canonical 词表（产业链链段→环节），并在写入前逐条校验父子关系。新闻可跨已关注链段，但禁止写入未关注链段。",
    ...selected.map((domain) => {
      const canonical = canonicalTaxonomy[domain as keyof typeof canonicalTaxonomy]?.join("、") || "无固定环节";
      const custom = customByDomain.get(domain);
      return `${domain}：${custom ? `${canonical}、${custom.join("、")}` : canonical}`;
    }),
    "兼容规则：历史词表（AI、半导体、智能出行等）只在读取时映射到新链段；新事件与新项目必须直接使用链段词表。同一事件涉及多个链段时可多标，项目仍只保留一个主链段。",
    "例如：GPU供应→算力芯片，光模块→互联与网络，NVL72整机柜→服务器与整机制造，推理框架→基础软件与工具链，AI眼镜→终端与具身；不得因出现 AI 字样而覆盖更准确的链段。"
  ].join("\n");
}

export function radarDomainForStoredDomain(domain: string) {
  const normalized = String(domain || "").trim();
  return LEGACY_DOMAIN_ALIASES[normalized] || normalized;
}
