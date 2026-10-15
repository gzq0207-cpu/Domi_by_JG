// AI 引擎注册表：domi 的 agent 运行时统一通过本地 Codex 执行器驱动，
// 引擎选择决定把请求路由到哪个模型 API。所有引擎共享同一条
// OpenAI 兼容接入链路（安全密钥存储 + 连接测试），Claude 与 WorkBuddy
// 也走各自的 OpenAI 兼容端点，因此工作区、技能与工具全部保持可用。

export type AgentProviderId = "codex" | "claude" | "workbuddy";

export type AgentProviderPreset = {
  id: AgentProviderId;
  label: string;
  tagline: string;
  /** API-only 引擎没有 ChatGPT 登录模式，只能通过 API 接入。 */
  apiOnly: boolean;
  defaultBaseUrl: string;
  defaultModel: string;
  baseUrlPlaceholder: string;
  modelPlaceholder: string;
  baseUrlHint: string;
};

export const AGENT_PROVIDERS: AgentProviderPreset[] = [
  {
    id: "codex",
    label: "Codex",
    tagline: "ChatGPT 官方登录，或任意 OpenAI 兼容 API / 中转站",
    apiOnly: false,
    defaultBaseUrl: "",
    defaultModel: "",
    baseUrlPlaceholder: "https://api.deepseek.com/v1 或中转站地址",
    modelPlaceholder: "中转站支持的模型 ID",
    baseUrlHint: "服务的 OpenAI 兼容根地址，通常以 /v1 结尾；不含密钥。"
  },
  {
    id: "claude",
    label: "Claude",
    tagline: "Anthropic Claude 模型，经 OpenAI 兼容端点接入",
    apiOnly: true,
    defaultBaseUrl: "https://api.anthropic.com/v1/",
    defaultModel: "claude-sonnet-4-5",
    baseUrlPlaceholder: "https://api.anthropic.com/v1/",
    modelPlaceholder: "如 claude-sonnet-4-5、claude-opus-4-5",
    baseUrlHint: "默认使用 Anthropic 官方 OpenAI 兼容端点；也可改为支持 Claude 的网关地址。"
  },
  {
    id: "workbuddy",
    label: "WorkBuddy",
    tagline: "WorkBuddy 或企业内网 OpenAI 兼容 API 网关",
    apiOnly: true,
    defaultBaseUrl: "",
    defaultModel: "",
    baseUrlPlaceholder: "WorkBuddy OpenAI 兼容地址，如 https://…/v1",
    modelPlaceholder: "网关支持的模型 ID",
    baseUrlHint: "填写 WorkBuddy 提供的 OpenAI 兼容根地址，通常以 /v1 结尾；不含密钥。"
  }
];

export function agentProviderById(id: string | undefined): AgentProviderPreset {
  const normalized = String(id || "").trim();
  return AGENT_PROVIDERS.find((provider) => provider.id === normalized) || AGENT_PROVIDERS[0];
}

function trimmedBaseUrl(value: string): string {
  const raw = String(value || "").trim();
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

// 切换引擎时预填 API 接入默认值：仅当当前值为空、或仍是其他引擎的
// 默认值时才覆盖，避免吞掉用户自己填写的地址与模型。
export function agentProviderDraftPatch(
  nextId: AgentProviderId,
  current: { apiBaseUrl: string; apiModel: string; apiWireApi: string }
): {
  agentProvider: AgentProviderId;
  apiBaseUrl: string;
  apiModel: string;
  apiWireApi: "responses" | "chat";
} {
  const preset = agentProviderById(nextId);
  const currentBaseUrl = trimmedBaseUrl(current.apiBaseUrl);
  const currentIsPresetBaseUrl = AGENT_PROVIDERS.some(
    (provider) => provider.defaultBaseUrl && trimmedBaseUrl(provider.defaultBaseUrl) === currentBaseUrl
  );
  const currentIsPresetModel = AGENT_PROVIDERS.some(
    (provider) => provider.defaultModel && provider.defaultModel === String(current.apiModel || "").trim()
  );
  const rawBaseUrl = String(current.apiBaseUrl || "").trim();
  const rawModel = String(current.apiModel || "").trim();
  const nextBaseUrl = preset.apiOnly
    ? (!rawBaseUrl || currentIsPresetBaseUrl ? preset.defaultBaseUrl : rawBaseUrl)
    : (currentIsPresetBaseUrl ? "" : rawBaseUrl);
  const nextModel = preset.apiOnly
    ? (!rawModel || currentIsPresetModel ? preset.defaultModel : rawModel)
    : (currentIsPresetModel ? "" : rawModel);
  return {
    agentProvider: preset.id,
    apiBaseUrl: nextBaseUrl,
    apiModel: nextModel,
    // API-only 引擎统一走 Chat Completions 协议；Codex 引擎保持用户选择。
    apiWireApi: preset.apiOnly ? "chat" : (current.apiWireApi === "chat" ? "chat" : "responses")
  };
}

