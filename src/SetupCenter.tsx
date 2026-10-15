import {
  Brain,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Cloud,
  Database,
  Download,
  ExternalLink,
  FolderOpen,
  HardDrive,
  KeyRound,
  LoaderCircle,
  LogIn,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Terminal,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { workbench } from "./bridge";
import { useAppConfirm } from "./AppConfirmDialog";
import {
  CODEX_CONNECTION_TEST_UI_TIMEOUT_MS,
  codexConnectionConfigFingerprint,
  codexConnectionDraftBlockReason,
  codexConnectionRuntimeMatchesSnapshot,
  codexConnectionRuntimeSnapshot,
  runBoundedCodexConnectionTest
} from "./codex-connection-test";
import {
  AGENT_PROVIDERS,
  agentProviderById,
  agentProviderDraftPatch
} from "./agent-providers";
import type { CodexConnectionRuntimeSnapshot } from "./codex-connection-test";
import {
  AppSettings,
  AppSettingsSaveRequest,
  AppSettingsSaveResult,
  ChatGPTLoginResult,
  CodexCheckResult,
  AgentCliStatus,
  CodexRuntimeStatus,
  DiagnosticCheck,
  DiagnosticReport,
  FeishuSetupAuthStartResult,
  FeishuSetupStatus,
  UpdateStatus
} from "./env";

type SetupCenterProps = {
  initialTab?: "connection" | "data" | "updates" | "diagnostics";
  settings: AppSettings;
  codexStatus: CodexCheckResult | null;
  required: boolean;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (request: AppSettingsSaveRequest) => Promise<AppSettingsSaveResult>;
  onLogin: () => Promise<ChatGPTLoginResult>;
  onRefresh: (verifiedStatus?: CodexCheckResult) => Promise<void>;
};

function domiWorkspacePath(selectedDirectory: string) {
  const normalized = selectedDirectory.trim().replace(/[\\/]+$/, "");
  if (!normalized) return "";
  const name = normalized.split(/[\\/]/).filter(Boolean).pop();
  return name === "domi工作区" ? normalized : `${normalized}/domi工作区`;
}

function outlookProfileEmail(output: string) {
  const candidate = String(output || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    const parsed = JSON.parse(candidate);
    const email = String(parsed?.email || "").trim();
    return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : "";
  } catch {
    return "";
  }
}

function outlookVerificationTime(timestamp: number) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

type FeishuAssistPhase = "connection" | "configuration" | "authorization";

const FEISHU_ASSIST_PHASE_LABELS: Record<FeishuAssistPhase, string> = {
  connection: "连接检查",
  configuration: "首次应用配置",
  authorization: "账号授权"
};

function sanitizedFeishuAssistError(value: unknown) {
  const input = String(value || "飞书连接尚未完成").trim().slice(0, 1600);
  const normalized = input
    .replace(/https?:\/\/\S+/gi, "[链接已隐藏]")
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, "[账号已隐藏]")
    .replace(/\/Users\/[^/\s]+/g, "/Users/[本机用户]")
    .replace(/\b[A-Z0-9]{4}(?:-[A-Z0-9]{4})+\b/gi, "[验证码已隐藏]")
    .replace(
      /\b(?:app|base|table|wiki|space|node|device|user|access|refresh)[_\s-]*(?:token|id|code)\b\s*[:=]?\s*[A-Za-z0-9_-]*/gi,
      "[标识已隐藏]"
    )
    .replace(/\b(?:bas|tbl|wik|doc|dox|nod)[A-Za-z0-9_-]{6,}\b/gi, "[标识已隐藏]")
    .replace(/\s+/g, " ")
    .trim();

  if (/network|timeout|timed out|socket|econn|网络|超时/i.test(normalized)) {
    return "网络或飞书服务暂时不可用。";
  }
  if (/admin|approval|policy|管理员|企业策略|批准|审批/i.test(normalized)) {
    return "当前企业策略需要管理员批准，必须由用户联系管理员完成。";
  }
  if (/auth|login|unauthor|forbidden|401|403|授权|登录/i.test(normalized)) {
    return "账号授权尚未完成、已失效，或当前企业需要额外批准。";
  }
  if (/ambiguous|duplicate|同名|多个/i.test(normalized)) {
    return "发现多个同名资源，需要用户确认要保留或使用哪一个。";
  }
  if (/schema|field|option|字段|选项|结构/i.test(normalized)) {
    return "现有飞书资料库结构与 domi 预期不一致，需要先确认兼容处理方式。";
  }
  if (/runtime|cli|component|binary|组件|运行时|程序/i.test(normalized)) {
    return "domi 内置连接组件暂时不可用或不完整。";
  }
  if (/config|initialize|setup|配置|初始化/i.test(normalized)) {
    return "首次应用配置尚未完成，或配置状态未能通过检查。";
  }
  return "连接流程返回了未识别的错误，需要重新检查当前步骤。";
}

export default function SetupCenter({
  initialTab = "connection",
  settings,
  codexStatus,
  required,
  onClose,
  onDirtyChange,
  onSave,
  onLogin,
  onRefresh
}: SetupCenterProps) {
  const { confirm, confirmDialog } = useAppConfirm();
  const [tab, setTab] = useState<"connection" | "data" | "updates" | "diagnostics">(initialTab);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(settings);
  // 当前选中引擎（含 API-only 标记与接入默认值）。
  const activeProvider = agentProviderById(draft.agentProvider);
  const [loginBusy, setLoginBusy] = useState(false);
  const [installBusy, setInstallBusy] = useState(false);
  const [installError, setInstallError] = useState("");
  const autoInstallAttemptedRef = useRef(false);
  const [relayBusy, setRelayBusy] = useState(false);
  const [connectionTestBusy, setConnectionTestBusy] = useState(false);
  const [connectionVerified, setConnectionVerified] = useState(false);
  const connectionTestSequenceRef = useRef(0);
  const connectionTestAttemptRef = useRef<{
    requestId: string;
    controller: AbortController;
    configFingerprint: string;
    kind: "connection-test" | "relay-configure";
    expectedRuntime: CodexConnectionRuntimeSnapshot;
  } | null>(null);
  const [relayApiKey, setRelayApiKey] = useState("");
  const [diagnosing, setDiagnosing] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [codexRuntime, setCodexRuntime] = useState<CodexRuntimeStatus | null>(null);
  const [codexRuntimeBusy, setCodexRuntimeBusy] = useState(false);
  const [agentCliStatus, setAgentCliStatus] = useState<AgentCliStatus | null>(null);
  const [agentCliChecking, setAgentCliChecking] = useState(false);
  const [outlookProfileBusy, setOutlookProfileBusy] = useState(false);
  const [feishuStatus, setFeishuStatus] = useState<FeishuSetupStatus | null>(null);
  const [feishuStatusBusy, setFeishuStatusBusy] = useState(false);
  const [feishuAuth, setFeishuAuth] = useState<FeishuSetupAuthStartResult | null>(null);
  const [feishuAuthBusy, setFeishuAuthBusy] = useState(false);
  const [feishuAssistBusy, setFeishuAssistBusy] = useState(false);
  const [feishuAssistMessage, setFeishuAssistMessage] = useState("");
  const [feishuAssistIssue, setFeishuAssistIssue] = useState<{
    phase: FeishuAssistPhase;
    error: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(settings)
    || Boolean(relayApiKey.trim());
const connectionConfigFingerprint = codexConnectionConfigFingerprint({
authMode: draft.authMode,
apiBaseUrl: draft.apiBaseUrl,
apiModel: draft.apiModel,
apiWireApi: draft.apiWireApi,
relayCredentialConfigured: draft.relayCredentialConfigured,
          codexPath: draft.codexPath,
          agentProvider: draft.agentProvider,
relayApiKey,
runtimeAuthMode: codexStatus?.authMode,
runtimeApiBaseUrl: codexStatus?.apiBaseUrl,
runtimeApiWireApi: codexStatus?.apiWireApi,
runtimeModel: codexStatus?.configuredModel,
runtimePath: codexStatus?.path,
runtimeAccount: codexStatus?.account?.email
});
  const connectionConfigFingerprintRef = useRef(connectionConfigFingerprint);
  connectionConfigFingerprintRef.current = connectionConfigFingerprint;

  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => {
    if (initialTab !== "connection") cancelConnectionTest({ silent: true });
    setTab(initialTab);
  }, [initialTab]);
  useEffect(() => {
    onDirtyChangeRef.current?.(hasUnsavedChanges);
  }, [hasUnsavedChanges]);
  useEffect(() => () => onDirtyChangeRef.current?.(false), []);
  useEffect(() => () => {
    const attempt = connectionTestAttemptRef.current;
    connectionTestAttemptRef.current = null;
    attempt?.controller.abort();
  }, []);


  async function refreshFeishuStatus(force = false) {
    setFeishuStatusBusy(true);
    try {
      const status = await workbench.getFeishuSetupStatus({ force });
      setFeishuStatus(status);
      if (!status.connected && status.error) {
        setFeishuAssistIssue((current) => current && current.phase !== "connection"
          ? current
          : { phase: "connection", error: status.error || "飞书连接尚未完成" });
      } else if (status.connected) {
        setFeishuAssistIssue(null);
      }
      return status;
    } catch (statusError) {
      const statusMessage = statusError instanceof Error ? statusError.message : String(statusError);
      const status: FeishuSetupStatus = {
        ok: false,
        connected: false,
        configured: false,
        cliAvailable: false,
        userName: "",
        error: statusMessage
      };
      setFeishuStatus(status);
      setFeishuAssistIssue({ phase: "connection", error: statusMessage });
      return status;
    } finally {
      setFeishuStatusBusy(false);
    }
  }

  useEffect(() => {
    if (tab !== "data") return;
    void refreshFeishuStatus(false);
  }, [tab]);

  async function startFeishuAuth() {
    setFeishuAuthBusy(true);
    setFeishuAssistMessage("");
    setError("");
    setNotice("");
    try {
      const result = await workbench.startFeishuSetupAuth();
      if (!result.ok) {
        const resultError = result.error || "无法启动飞书授权，请重试。";
        setFeishuAssistIssue({
          phase: feishuAuth?.flow === "authorization" ? "authorization" : "configuration",
          error: resultError
        });
        setError(resultError);
        return;
      }
      setFeishuAuth(result);
      setFeishuAssistIssue(null);
      if (result.flow === "configuration") {
        setNotice(result.verificationOpened
          ? "已在浏览器打开首次飞书应用配置页；完成后回到 domi，点击“应用已配置，继续”。"
          : "请先在浏览器完成首次飞书应用配置，再回到 domi 继续授权。");
      } else {
        setNotice(result.verificationOpened
          ? "已在浏览器打开飞书授权页；完成授权后回到 domi 继续。"
          : "请在浏览器完成飞书授权后回到 domi 继续。");
      }
    } catch (authError) {
      const authMessage = authError instanceof Error ? authError.message : String(authError);
      setFeishuAssistIssue({
        phase: feishuAuth?.flow === "authorization" ? "authorization" : "configuration",
        error: authMessage
      });
      setError(authMessage);
    } finally {
      setFeishuAuthBusy(false);
    }
  }

  async function completeFeishuAuth() {
    const deviceCode = String(feishuAuth?.deviceCode || "").trim();
    if (!deviceCode) {
      await startFeishuAuth();
      return;
    }
    setFeishuAuthBusy(true);
    setError("");
    setNotice("正在确认飞书授权…");
    try {
      const status = await workbench.completeFeishuSetupAuth({ deviceCode });
      setFeishuStatus(status);
      if (!status.ok || !status.connected) {
        const statusError = status.error || "飞书授权尚未完成，请在浏览器完成后重试。";
        setNotice("");
        setFeishuAssistIssue({ phase: "authorization", error: statusError });
        setError(statusError);
        return;
      }
      setFeishuAuth(null);
      setFeishuAssistIssue(null);
      setFeishuAssistMessage("");
      setNotice(`飞书已连接${status.userName ? ` · ${status.userName}` : ""}。本地资料库不会因此迁移或改变。`);
    } catch (authError) {
      const authMessage = authError instanceof Error ? authError.message : String(authError);
      setNotice("");
      setFeishuAssistIssue({ phase: "authorization", error: authMessage });
      setError(authMessage);
    } finally {
      setFeishuAuthBusy(false);
    }
  }

  async function assistFeishuConnection() {
    if (!codexStatus?.ok) {
      setError("Codex 尚未就绪，请先完成 Codex 连接。");
      return;
    }

    const phase: FeishuAssistPhase = feishuAssistIssue?.phase
      || (feishuAuth?.flow === "configuration"
        ? "configuration"
          : feishuAuth?.flow === "authorization"
            ? "authorization"
            : "connection");
    const safeError = sanitizedFeishuAssistError(
      feishuAssistIssue?.error
      || feishuStatus?.error
      || "飞书连接尚未完成"
    );

    setFeishuAssistBusy(true);
    setFeishuAssistMessage("");
    setError("");
    setNotice("");
    try {
      const result = await workbench.runCodex({
        runId: `connection-guidance-${Date.now()}`,
        prompt: [
          "你是 domi 的连接引导助手。只根据下面两项脱敏信息，向普通用户解释当前问题和下一步：",
          `当前阶段：${FEISHU_ASSIST_PHASE_LABELS[phase]}`,
          `脱敏错误：${safeError}`,
          "",
          "严格限制：",
          "1. 只做诊断说明和操作引导；不得调用任何工具、终端、浏览器、网络或本地文件。",
          "2. 不得启动或代替用户完成应用初始化、登录、验证码、账号授权、企业管理员批准或资源写入。",
          "3. 不得要求或猜测 App ID、App Secret、Base Token、Table ID、Wiki Space ID、设备码、验证码、用户名或任何凭据。",
          "4. 如果涉及企业策略或管理员批准，明确告诉用户需要联系管理员；如果存在多个同名资源，只能让用户选择，不能替用户决定。",
          "5. 不得建议切换资料库模式、迁移资料，或清除已有配置。",
          "6. 优先引导用户继续使用当前页面已有按钮；不要让用户输入命令。",
          "",
          "最终用不超过三条简短中文说明：发生了什么、现在点哪里、什么情况必须由用户或管理员完成。"
        ].join("\n"),
        // 该字符串和 workflow 都刻意不包含外部数据关键词。助手只解释已脱敏状态，
        // 不应触发外部访问授权的系统模态框。
        requestText: "诊断当前连接引导",
        requestOrigin: "programmatic",
        userInstructionText: "",
        ephemeral: true,
        background: false,
        allowUserInput: false,
        privateOutput: true,
        webSearch: false,
        workflowId: "connection-guidance",
        workspacePath: codexStatus.workspacePath
      });
      if (!result.ok) {
        setError(result.error || "Codex 暂时无法给出连接建议，请重试。");
        return;
      }
      setFeishuAssistMessage(
        String(result.output || "请按当前页面提示继续连接；登录、验证码和管理员批准必须由你本人完成。")
          .trim()
          .slice(0, 2400)
      );
    } catch (assistError) {
      setError(assistError instanceof Error ? assistError.message : String(assistError));
    } finally {
      const refreshed = await refreshFeishuStatus(true);
      if (refreshed.connected) {
        setFeishuAssistIssue(null);
      }
      setFeishuAssistBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    let receivedLiveUpdateStatus = false;
    const unsubscribe = workbench.onUpdateStatus((status) => {
      if (cancelled) return;
      receivedLiveUpdateStatus = true;
      setUpdateStatus(status);
    });
    workbench.getUpdateStatus().then((status) => {
      if (!cancelled && !receivedLiveUpdateStatus) setUpdateStatus(status);
    }).catch((statusError) => {
      if (!cancelled) {
        setError(statusError instanceof Error
          ? statusError.message
          : `无法读取软件更新状态：${String(statusError)}`);
      }
    });
    workbench.getCodexRuntimeStatus().then((status) => {
      if (!cancelled) setCodexRuntime(status);
    }).catch((runtimeError) => {
      if (!cancelled) {
        setError(runtimeError instanceof Error
          ? runtimeError.message
          : `无法读取 Codex Runtime 状态：${String(runtimeError)}`);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function save(complete: boolean) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await onSave({
        ...draft,
        storageBackend: "local",
        storageMigration: "none",
        onboardingComplete: complete || settings.onboardingComplete
      });
      if (!result.ok) {
        setError(result.error || "保存设置失败。");
        return false;
      }
      setNotice(result.warning || (result.codex?.ok
          ? "连接已保存并验证。"
          : "设置已保存；本地资料库继续作为唯一主资料库。"));
      if (complete) onClose();
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function requestClose() {
    if (saving) return;
    if (hasUnsavedChanges) {
      const approved = await confirm({
        title: "放弃尚未保存的设置？",
        message: "关闭设置后，本次修改将不会保留。",
        confirmLabel: "放弃修改",
        tone: "danger"
      });
      if (!approved) return;
    }
    cancelConnectionTest({ silent: true });
    onClose();
  }

  function cancelConnectionTest({ silent = false } = {}) {
    const attempt = connectionTestAttemptRef.current;
    if (!attempt) return false;
    connectionTestAttemptRef.current = null;
    attempt.controller.abort();
    setConnectionTestBusy(false);
    setRelayBusy(false);
    setConnectionVerified(false);
    if (!silent) {
      setNotice("");
      setError(attempt.kind === "relay-configure"
        ? "中转站配置验证已取消。若安全保存已经完成，配置会保留但不会标记为已实测；请重新测试确认。"
        : "连接测试已取消。连接设置没有改动，可以调整后重新测试。");
    }
    return true;
  }

  // 本地客户端状态卡：检测可执行文件、版本与登录态。
  async function refreshAgentCliStatus(engineId?: "claude" | "workbuddy") {
    const target = engineId || (activeProvider.id === "workbuddy" ? "workbuddy" : "claude");
    if (!agentCliChecking) setAgentCliChecking(true);
    try {
      // 状态卡需要读取用户刚填的 CLI 路径：先落一次草稿再检测。
      if (draft.claudeCliPath !== settings.claudeCliPath
        || draft.workbuddyCliPath !== settings.workbuddyCliPath
        || draft.workbuddyArgs !== settings.workbuddyArgs
        || draft.claudeModel !== settings.claudeModel) {
        await onSave({
          claudeCliPath: draft.claudeCliPath,
          workbuddyCliPath: draft.workbuddyCliPath,
          workbuddyArgs: draft.workbuddyArgs,
          claudeModel: draft.claudeModel
        });
      }
      const status = await workbench.checkAgentCli(target);
      setAgentCliStatus(status);
    } catch (statusError) {
      setAgentCliStatus({
        ok: false,
        engine: target,
        detected: false,
        path: "",
        via: "",
        version: "",
        login: { loggedIn: null, detail: "" },
        error: statusError instanceof Error ? statusError.message : String(statusError)
      });
    } finally {
      setAgentCliChecking(false);
    }
  }


  async function startLogin() {
    if (connectionTestAttemptRef.current) return;
    setLoginBusy(true);
    setError("");
    setNotice("");
    setConnectionVerified(false);
    setDraft((current) => ({
      ...current,
      authMode: "chatgpt",
      apiBaseUrl: "",
      apiModel: "",
      apiWireApi: "responses",
      relayCredentialConfigured: false,
      agentProvider: "codex"
    }));
    const saved = await onSave({ ...draft, authMode: "chatgpt", agentProvider: "codex" });
    if (!saved.ok) {
      setError(saved.error || "无法切换到 ChatGPT 登录模式。");
      setLoginBusy(false);
      return;
    }
    const result = await onLogin();
    setLoginBusy(false);
    if (!result.ok) {
      setError(result.error || "无法打开 ChatGPT 登录页面。");
      return;
    }
    setNotice("登录页面已在浏览器打开。完成登录后回到 domi 重新检测。");
  }

  async function installCodex(automatic = false) {
    if (connectionTestAttemptRef.current) return;
    setInstallBusy(true);
    setInstallError("");
    setError("");
    setNotice("");
    try {
      const result = await workbench.installCodex();
      if (!result.ok) {
        setInstallError(result.error || "Codex CLI 安装失败。");
        return;
      }
      setDraft((current) => ({ ...current, codexPath: result.path }));
      await onSave({ codexPath: result.path });
      await onRefresh();
      if (!automatic) {
        setNotice(result.installedNow
          ? `Codex CLI 已安装并验证：${result.version}`
          : `已检测到可用的 Codex CLI：${result.version}`);
      }
    } catch (installFailure) {
      setInstallError(installFailure instanceof Error ? installFailure.message : String(installFailure));
    } finally {
      setInstallBusy(false);
    }
  }

  async function configureRelay() {
    if (connectionTestAttemptRef.current) return;
    const pathBlockReason = codexConnectionDraftBlockReason({
      draftCodexPath: draft.codexPath,
      savedCodexPath: settings.codexPath,
      runtimePath: codexStatus?.path,
      relayApiKey: ""
    });
    if (pathBlockReason) {
      setConnectionVerified(false);
      setNotice("");
      setError(pathBlockReason);
      return;
    }
    const requestId = `relay-${Date.now()}-${connectionTestSequenceRef.current += 1}`;
    const attempt = {
      requestId,
      controller: new AbortController(),
      configFingerprint: connectionConfigFingerprintRef.current,
      kind: "relay-configure" as const,
    expectedRuntime: codexConnectionRuntimeSnapshot({
      authMode: "relay",
      path: codexStatus?.path,
      apiBaseUrl: draft.apiBaseUrl,
      apiWireApi: draft.apiWireApi,
      configuredModel: draft.apiModel
    })
    };
    connectionTestAttemptRef.current = attempt;
    setRelayBusy(true);
    setError("");
    setNotice("");
    setConnectionVerified(false);
    try {
      const outcome = await runBoundedCodexConnectionTest({
        requestId,
        signal: attempt.controller.signal,
        invoke: ({ requestId: currentRequestId }) => workbench.configureCodexRelay({
          requestId: currentRequestId,
          baseUrl: draft.apiBaseUrl,
          model: draft.apiModel,
          wireApi: draft.apiWireApi,
          apiKey: relayApiKey || undefined,
          keepExistingKey: !relayApiKey && draft.relayCredentialConfigured,
          codexPath: draft.codexPath,
          agentProvider: draft.agentProvider
        }),
        cancel: (request) => workbench.cancelCodexConnectionTest(request),
        timeoutMs: CODEX_CONNECTION_TEST_UI_TIMEOUT_MS
      });
      if (connectionTestAttemptRef.current !== attempt) return;
      if (outcome.status === "cancelled") {
        setError("中转站配置验证已取消。若安全保存已经完成，配置会保留但不会标记为已实测；请重新测试确认。");
        return;
      }
      if (outcome.status === "timed-out") {
        setError("中转站安全保存与完整连接测试超过 90 秒，界面已停止等待并请求终止后台操作。请检查网络、代理和中转站地址后重试；如仍失败，请到“系统诊断”导出脱敏报告。");
        return;
      }
      if (outcome.status === "failed") {
        setError(outcome.error || "中转站配置或测试失败。");
        return;
      }
      const result = outcome.result;
      if (result.requestId !== requestId) {
        setError("中转站测试返回了过期结果，已安全忽略；请重新测试当前配置。");
        return;
      }
      if (!result.ok) {
        setError(result.error || "中转站配置或测试失败。");
        return;
      }
      if (connectionTestAttemptRef.current !== attempt) return;
      if (connectionConfigFingerprintRef.current !== attempt.configFingerprint) {
        setError("中转站配置在测试期间发生了变化，旧测试结果已忽略。请确认当前地址、模型和 Codex 路径后重新测试。");
        return;
      }
      if (!codexConnectionRuntimeMatchesSnapshot(attempt.expectedRuntime, result.codex)) {
        setError("实际测试的 Codex 运行配置与当前中转站设置不一致，结果已安全忽略。请刷新运行状态后重新测试。");
        return;
      }
      const nextDraft = {
        ...draft,
        authMode: "relay" as const,
        agentProvider: draft.agentProvider,
        apiBaseUrl: result.codex?.apiBaseUrl || draft.apiBaseUrl,
        apiModel: result.codex?.configuredModel || draft.apiModel,
        relayCredentialConfigured: true
      };
      setDraft(nextDraft);
      setRelayApiKey("");
      const saved = await onSave({
        authMode: "relay",
        apiBaseUrl: nextDraft.apiBaseUrl,
        apiModel: nextDraft.apiModel,
        relayCredentialConfigured: true,
        codexPath: result.codex?.path || nextDraft.codexPath
      });
      if (!saved.ok) {
        setConnectionVerified(false);
        setError(saved.error || "中转站已通过测试，但本地设置未能同步，请重新打开设置确认。");
        return;
      }
      setConnectionVerified(true);
      setNotice(result.verification?.detail || "中转站模型响应与工具调用均已通过。");
      void onRefresh(result.codex).catch(() => undefined);
    } catch (relayError) {
      if (connectionTestAttemptRef.current !== attempt) return;
      setError(relayError instanceof Error ? relayError.message : String(relayError));
    } finally {
      if (connectionTestAttemptRef.current === attempt) {
        connectionTestAttemptRef.current = null;
        setRelayBusy(false);
      }
    }
  }

  // 引擎或模式变化时自动检测本地客户端（状态卡）。
  useEffect(() => {
    if (tab !== "connection" || !activeProvider.apiOnly || draft.authMode !== "agent-cli") return;
    void refreshAgentCliStatus();
  }, [tab, draft.agentProvider, draft.authMode]);


  function selectTab(nextTab: "connection" | "data" | "updates" | "diagnostics") {
    if (nextTab !== "connection") cancelConnectionTest({ silent: true });
    setTab(nextTab);
  }

  async function saveConnection(continueToData: boolean) {
    if (draft.authMode === "agent-cli") {
      if (!activeProvider.apiOnly) {
        setError("Codex 引擎不支持本地客户端模式，请选择 ChatGPT 或 API 接入。");
        return;
      }
      const detected = agentCliStatus?.detected
        && agentCliStatus.engine === activeProvider.id;
      if (!detected) {
        setError(`未检测到 ${activeProvider.label} 本地客户端。请先安装并登录其官方客户端，填写可执行文件路径后重新检测；或改用 API 接入。`);
        return;
      }
      if (await save(continueToData)) return;
      return;
    }
    if (codexPathRequiresApply) {
      const applied = await save(false);
      if (applied) {
        setConnectionVerified(false);
        setError("");
        setNotice("Codex 路径已应用并刷新运行状态。现在请测试完整连接；测试通过后即可继续。");
      }
      return;
    }
    if (!codexStatus?.path) {
      setError("请先安装 Codex CLI。");
      return;
    }
    if (!selectedConnectionReady) {
      setError(draft.authMode === "relay"
        ? "请先安全保存 API 配置并完成测试；无需登录 ChatGPT。"
        : "请先完成 ChatGPT 登录并测试连接。");
      return;
    }
    if (required && !connectionVerified) {
      const verified = await testConnection();
      if (!verified) return;
    }
    if (await save(false) && continueToData) setTab("data");
  }

  async function checkOutlookProfile() {
    if (!codexStatus?.ok) {
      setError("Codex 尚未就绪，无法读取 Outlook 当前登录账号。");
      return;
    }
    setOutlookProfileBusy(true);
    setError("");
    setNotice("正在通过 Outlook Calendar 只读检测当前发送账号…");
    try {
      const result = await workbench.runCodex({
        runId: `outlook-profile-${Date.now()}`,
        prompt: [
          "DOMI_OUTLOOK_PROFILE_CHECK_V1",
          "使用已安装 domi 插件中的 $schedule，只执行 Outlook 发送账号检测。",
          "必须调用 Outlook Calendar 连接器的 get_profile；不得读取日程、不得创建或修改任何事件。",
          "最终只输出单行 JSON，不要 Markdown、解释或脱敏：{\"email\":\"当前登录账号的完整邮箱\"}。",
          "该结果由 domi 作为私密输出接收，只保存到本机 Application Support，不写入任务产物或日志。"
        ].join("\n"),
        requestText: "检测 Outlook 发送账号",
        requestOrigin: "programmatic",
        userInstructionText: "",
        ephemeral: true,
        background: true,
        privateOutput: true,
        workflowId: "schedule",
        workspacePath: codexStatus.workspacePath
      });
      if (!result.ok) {
        setNotice("");
        setError(result.error || "Outlook 当前登录账号检测失败。");
        return;
      }
      const email = outlookProfileEmail(result.output || "");
      if (!email) {
        setNotice("");
        setError("Outlook 未返回可识别的登录邮箱，请确认已连接自己的 Outlook Calendar 账号后重试。");
        return;
      }
      const verifiedAt = Date.now();
      const saved = await onSave({
        outlookCalendarEmail: email,
        outlookCalendarEmailVerifiedAt: verifiedAt
      });
      if (!saved.ok) {
        setNotice("");
        setError(saved.error || "已读取 Outlook 账号，但无法保存本机显示状态。");
        return;
      }
      setDraft((current) => ({
        ...current,
        outlookCalendarEmail: email,
        outlookCalendarEmailVerifiedAt: verifiedAt
      }));
      setNotice("已验证 Outlook 当前发送账号；实际发送前还会再次核对当前登录身份。");
    } catch (profileError) {
      setNotice("");
      setError(profileError instanceof Error ? profileError.message : String(profileError));
    } finally {
      setOutlookProfileBusy(false);
    }
  }

  async function testConnection(): Promise<boolean> {
    if (connectionTestAttemptRef.current) return false;
    const blockReason = codexConnectionDraftBlockReason({
      draftCodexPath: draft.codexPath,
      savedCodexPath: settings.codexPath,
      runtimePath: codexStatus?.path,
      relayApiKey
    });
    if (blockReason) {
      setConnectionVerified(false);
      setNotice("");
      setError(blockReason);
      return false;
    }
    const requestId = `setup-${Date.now()}-${connectionTestSequenceRef.current += 1}`;
    const attempt = {
      requestId,
      controller: new AbortController(),
      configFingerprint: connectionConfigFingerprintRef.current,
      kind: "connection-test" as const,
      expectedRuntime: codexConnectionRuntimeSnapshot({
        authMode: draft.authMode,
        path: codexStatus?.path,
        apiBaseUrl: draft.authMode === "relay" ? draft.apiBaseUrl : "",
        configuredModel: draft.authMode === "relay"
          ? draft.apiModel
          : codexStatus?.configuredModel
      })
    };
    connectionTestAttemptRef.current = attempt;
    setConnectionTestBusy(true);
    setError("");
    setNotice("");
    setConnectionVerified(false);
    try {
      const outcome = await runBoundedCodexConnectionTest({
        requestId,
        signal: attempt.controller.signal,
        invoke: (request) => workbench.testCodexConnection(request),
        cancel: (request) => workbench.cancelCodexConnectionTest(request),
        timeoutMs: CODEX_CONNECTION_TEST_UI_TIMEOUT_MS
      });
      if (connectionTestAttemptRef.current !== attempt) return false;
      if (outcome.status === "cancelled") {
        setError("连接测试已取消。连接设置没有改动，可以调整后重新测试。");
        return false;
      }
      if (outcome.status === "timed-out") {
        setError("完整连接测试超过最大等待时间，界面已停止等待并请求终止后台测试。请检查网络或代理、确认 ChatGPT 登录仍有效后重试；如仍失败，请到“系统诊断”导出脱敏报告。");
        return false;
      }
      if (outcome.status === "failed") {
        setError(outcome.error || "Codex 完整连接测试失败。");
        return false;
      }
      const result = outcome.result;
      if (result.requestId !== requestId) {
        setError("连接测试返回了过期结果，已安全忽略；请重新测试当前配置。");
        return false;
      }
      if (!result.ok) {
        setError(result.error || "Codex 完整连接测试失败。");
        return false;
      }
      if (connectionTestAttemptRef.current !== attempt) return false;
      if (!codexConnectionRuntimeMatchesSnapshot(attempt.expectedRuntime, result.codex)) {
        setConnectionVerified(false);
        setError("实际测试的 Codex 身份或运行配置与当前设置不一致，结果已安全忽略。请刷新运行状态后重新测试。");
        return false;
      }
      if (connectionConfigFingerprintRef.current !== attempt.configFingerprint) {
        setConnectionVerified(false);
        setError("连接配置在测试期间发生了变化，旧测试结果已忽略。请确认当前账号、地址和 Codex 路径后重新测试。");
        return false;
      }
      setConnectionVerified(true);
      setNotice(result.verification?.detail || "模型响应与 Shell 工具调用均已通过。");
      void onRefresh(result.codex).catch(() => undefined);
      return true;
    } catch (testError) {
      if (connectionTestAttemptRef.current !== attempt) return false;
      setError(testError instanceof Error ? testError.message : String(testError));
      return false;
    } finally {
      if (connectionTestAttemptRef.current === attempt) {
        connectionTestAttemptRef.current = null;
        setConnectionTestBusy(false);
      }
    }
  }

  async function chooseLocalLibraryDirectory() {
    setError("");
    const targetField = "localRepositoryDir";
    const result = await workbench.selectDirectory(draft[targetField]);
    if (!result.ok) {
      setError(result.error || "无法选择本地资料库目录。");
      return;
    }
    if (result.canceled || !result.path) return;
    const selectedPath = result.path.trim().replace(/[\\/]+$/, "");
    const preservesExistingLocalRoot = targetField === "localRepositoryDir"
      && settings.onboardingComplete
      && selectedPath === draft.localRepositoryDir.trim().replace(/[\\/]+$/, "");
    const nextPath = targetField === "localRepositoryDir" && !preservesExistingLocalRoot
      ? domiWorkspacePath(selectedPath)
      : selectedPath;
    setDraft((current) => ({ ...current, [targetField]: nextPath }));
    setNotice(targetField === "localRepositoryDir"
      ? "已选择上级目录；domi 将在其中创建“domi工作区”，保存后生效。"
      : "已选择本地资料库目录，保存后生效。");
  }

  async function diagnose() {
    setDiagnosing(true);
    setError("");
    try {
      setReport(await workbench.runDiagnostics());
    } catch (diagnosticError) {
      setError(diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError));
    } finally {
      setDiagnosing(false);
    }
  }

  async function exportReport() {
    if (!report) return;
    const result = await workbench.exportDiagnostics(report);
    if (!result.ok) setError(result.error || "无法导出诊断报告。");
  }

  async function saveUpdateSettings() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await onSave({ updateChannel: draft.updateChannel });
      if (!result.ok) {
        setError(result.error || "保存更新设置失败。");
        return;
      }
      setNotice(draft.updateChannel === "beta" ? "已切换到测试版通道。" : "已切换到稳定版通道。");
      await checkUpdates();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function checkUpdates() {
    setUpdateBusy(true);
    setError("");
    try {
      setUpdateStatus(await workbench.checkForUpdates());
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : String(updateError));
    } finally {
      setUpdateBusy(false);
    }
  }

  async function downloadAvailableUpdate() {
    setUpdateBusy(true);
    setError("");
    try {
      setUpdateStatus(await workbench.downloadUpdate());
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : String(updateError));
    } finally {
      setUpdateBusy(false);
    }
  }

  async function installDownloadedUpdate() {
    setUpdateBusy(true);
    setError("");
    try {
      const result = await workbench.installUpdate();
      if (!result.ok) {
        setError(result.error || "暂时无法安装更新。");
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : String(updateError));
    } finally {
      setUpdateBusy(false);
    }
  }

  async function updateRuntime() {
    setCodexRuntimeBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await workbench.updateCodexRuntime();
      if (!result.ok) {
        setError(result.error || "Codex Runtime 更新失败，当前版本保持不变。");
        return;
      }
      setCodexRuntime(result.runtime || result);
      await onRefresh();
      setNotice(`Codex Runtime 已更新：${result.version || "当前版本已生效"}。`);
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : String(runtimeError));
    } finally {
      setCodexRuntimeBusy(false);
    }
  }

  async function rollbackRuntime() {
    setCodexRuntimeBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await workbench.rollbackCodexRuntime();
      if (!result.ok) {
        setError(result.error || "没有可恢复的 Codex Runtime。");
        return;
      }
      setCodexRuntime(result);
      await onRefresh();
      setNotice(`已恢复 Codex Runtime：${result.version || "上一版本"}。`);
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : String(runtimeError));
    } finally {
      setCodexRuntimeBusy(false);
    }
  }

  const downloadedUpdateLabel = updateStatus?.installing
    ? "正在安装，domi 将自动重启"
    : updateStatus?.error
      ? "更新重启未完成，可重试"
      : updateStatus?.restartPending && Number(updateStatus.busyTaskCount || 0) > 0
        ? "更新已下载，任务完成后自动重启"
        : "更新已下载，正在安全保存并重启";
  const updateStateLabel = updateStatus
    ? {
        disabled: "开发版不执行安装更新",
        idle: "等待检查",
        checking: "正在检查更新",
        available: `发现 ${updateStatus.availableVersion || "新版本"}`,
        "up-to-date": "当前已是最新版本",
        downloading: `正在下载 ${Math.round(updateStatus.percent)}%`,
        downloaded: downloadedUpdateLabel,
        error: "更新检查失败"
      }[updateStatus.state]
    : "正在读取版本信息";
  const codexInstalled = Boolean(codexStatus?.path);
  const connectionOperationBusy = connectionTestBusy || relayBusy;
  const codexPathRequiresApply = draft.codexPath.trim() !== settings.codexPath.trim();
  const connectionTestBlockReason = codexConnectionDraftBlockReason({
    draftCodexPath: draft.codexPath,
    savedCodexPath: settings.codexPath,
    runtimePath: codexStatus?.path,
    relayApiKey
  });
  const agentCliDraftReady = draft.authMode !== "agent-cli" || Boolean(
    activeProvider.apiOnly
    && agentCliStatus?.detected
    && agentCliStatus.engine === activeProvider.id
  );
  const relayDraftMatchesRuntime = draft.authMode !== "relay" || Boolean(
    draft.relayCredentialConfigured
    && draft.apiBaseUrl.trim() === codexStatus?.apiBaseUrl
    && draft.apiModel.trim() === codexStatus?.configuredModel
  );
  const selectedConnectionReady = Boolean(
    draft.authMode === "agent-cli"
      ? agentCliDraftReady
      : codexStatus?.ok
    && codexStatus.authMode === draft.authMode
    && relayDraftMatchesRuntime
  );
  const connectionDetail = draft.authMode === "agent-cli"
    ? [agentCliStatus?.version, agentCliStatus?.path, agentCliStatus?.login?.detail]
      .filter(Boolean)
      .join(" · ")
      || (agentCliStatus?.error
        ? agentCliStatus.error
        : "正在检测本地客户端…")
    : selectedConnectionReady
    ? draft.authMode === "relay"
      ? [codexStatus?.configuredModel, codexStatus?.apiBaseUrl, codexStatus?.version].filter(Boolean).join(" · ")
      : [codexStatus?.account?.email, codexStatus?.account?.planType, codexStatus?.version].filter(Boolean).join(" · ")
    : codexStatus?.error || (draft.authMode === "relay"
      ? "请填写中转站信息并保存测试"
      : "请登录 ChatGPT 后重新测试");
  const installStepState = codexInstalled
    ? "ok"
    : installError
      ? "error"
      : installBusy || required
        ? "working"
        : "warning";

  useEffect(() => {
    if (
      !required
      || tab !== "connection"
      || codexStatus === null
      || codexInstalled
      || autoInstallAttemptedRef.current
    ) {
      return;
    }
    autoInstallAttemptedRef.current = true;
    void installCodex(true);
  }, [required, tab, codexStatus, codexInstalled]);

  return (
    <div className="setup-overlay" role="dialog" aria-modal="true" aria-label="domi 设置">
      <div className="setup-window">
        <aside className="setup-nav">
          <div className="setup-brand">
            <img src="./domi-icon.png" alt="" />
            <div><strong>domi</strong><span>{required ? "首次启动配置" : "设置"}</span></div>
          </div>
          <nav>
            <button className={tab === "connection" ? "active" : ""} onClick={() => selectTab("connection")}>
              <Settings2 size={16} />AI 引擎
            </button>
            <button className={tab === "data" ? "active" : ""} onClick={() => selectTab("data")}>
              <Database size={16} />资料连接
            </button>
            <button className={tab === "updates" ? "active" : ""} onClick={() => selectTab("updates")}>
              <Download size={16} />软件更新
            </button>
            <button className={tab === "diagnostics" ? "active" : ""} onClick={() => selectTab("diagnostics")}>
              <ShieldCheck size={16} />系统诊断
            </button>
          </nav>
          <div className="setup-security-note">
            <ShieldCheck size={15} />
            <span>ChatGPT 登录由 Codex 管理；API 密钥只保存在本机系统安全存储。</span>
          </div>
        </aside>

        <section className={`setup-content ${tab === "connection" ? "connection-tab" : ""}`}>
          <header className="setup-header">
            <div>
              <span>{required ? "开始使用 domi" : "偏好设置"}</span>
              <h2>{tab === "connection"
                ? "选择 AI 引擎与接入方式"
                : tab === "data"
                  ? "配置 domi 资料库"
                  : tab === "updates"
                    ? "软件更新"
                    : "系统诊断"}</h2>
              <p>{tab === "connection"
              ? "domi 会自动准备本地运行时；选择 Codex、Claude 或 WorkBuddy 引擎，再选择各自的接入方式。"
                : tab === "data"
                  ? "domi 默认使用本地 SQLite + Markdown；飞书可选连接，作为外部参考资料库和发布平台。配置仅保存在这台 Mac。"
                : tab === "updates"
                  ? "检查签名版本并更新程序本体；历史、工作区和本机配置会继续保留。"
                  : "检查 Codex、Keychain、本地数据库、工作区和 domi 插件。"}</p>
            </div>
            {!required && (
              <button className="setup-close" type="button" onClick={requestClose} title="关闭设置"><X size={18} /></button>
            )}
          </header>

          {tab === "connection" ? (
            <div className="setup-form connection-form">
              <div className={`codex-install-step ${installStepState}`}>
                <i>{codexInstalled
                  ? <CheckCircle2 size={18} />
                  : installError
                    ? <CircleAlert size={18} />
                    : installBusy || required
                      ? <LoaderCircle className="spinning" size={18} />
                      : <Terminal size={18} />}</i>
                <span>
                  <strong>{codexInstalled
                    ? "Codex CLI 已准备好"
                    : installError
                      ? "Codex CLI 自动安装未完成"
                      : "正在自动准备 Codex CLI"}</strong>
                  <small>{codexInstalled
                    ? `${codexStatus?.version || "版本已检测"} · ${codexStatus?.path}`
                    : installError
                      ? installError
                      : "正在校验并安装 domi 内置的 Codex Runtime，无需打开终端或连接 GitHub。"}</small>
                </span>
                {codexInstalled ? (
                  <b className="codex-install-badge">已完成</b>
                ) : installError || !required ? (
                  <button type="button" onClick={() => void installCodex(false)} disabled={installBusy || connectionOperationBusy}>
                    {installBusy ? <LoaderCircle className="spinning" size={15} /> : <RefreshCw size={15} />}
                    {installBusy ? "正在重试…" : "重新安装"}
                  </button>
                ) : (
                  <b className="codex-install-badge">自动进行</b>
                )}
              </div>

              <div className="agent-engine-options" role="radiogroup" aria-label="AI 引擎">
                {AGENT_PROVIDERS.map((provider) => {
                  const ProviderIcon = provider.id === "claude"
                    ? Brain
                    : provider.id === "workbuddy"
                      ? UsersRound
                      : Terminal;
                  const providerSelected = draft.agentProvider === provider.id
                    || (!draft.agentProvider && provider.id === "codex");
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      role="radio"
                      aria-checked={providerSelected}
                      className={providerSelected ? "selected" : ""}
                      disabled={connectionOperationBusy}
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          ...agentProviderDraftPatch(provider.id, current),
                          authMode: provider.apiOnly ? "agent-cli" : current.authMode
                        }));
                        setConnectionVerified(false);
                        setError("");
                        setNotice("");
                      }}
                    >
                      <ProviderIcon size={17} />
                      <span>
                        <strong>{provider.label}</strong>
                        <small>{provider.tagline}</small>
                      </span>
                      <i>{providerSelected ? <CheckCircle2 size={16} /> : null}</i>
                    </button>
                  );
                })}
              </div>

              {activeProvider.id === "codex" && (
              <div className="codex-mode-options" role="radiogroup" aria-label="Codex 连接方式（二选一）">
                <button
                  type="button"
                  role="radio"
                  aria-checked={draft.authMode === "chatgpt"}
                  className={draft.authMode === "chatgpt" ? "selected" : ""}
                  disabled={connectionOperationBusy}
                  onClick={() => {
                    setDraft((current) => ({
                      ...current,
                      authMode: "chatgpt",
                      apiBaseUrl: "",
                      apiModel: "",
                      relayCredentialConfigured: false
                    }));
                    setConnectionVerified(false);
                    setError("");
                    setNotice("");
                  }}
                >
                  <LogIn size={18} />
                  <span>
                    <strong>ChatGPT 账号</strong>
                    <small>选择后只需完成 Codex 官方登录与连接测试。</small>
                  </span>
                  <i>{draft.authMode === "chatgpt" ? <CheckCircle2 size={17} /> : null}</i>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={draft.authMode === "relay"}
                  className={draft.authMode === "relay" ? "selected" : ""}
                  disabled={connectionOperationBusy}
                  onClick={() => {
                    setDraft((current) => ({ ...current, authMode: "relay" }));
                    setConnectionVerified(false);
                    setError("");
                    setNotice("");
                  }}
                >
                  <KeyRound size={18} />
                  <span>
                    <strong>API 中转站</strong>
                    <small>接入任何 OpenAI 兼容大模型 API（DeepSeek、Kimi、通义、GLM、聚合网关等），不要求登录 ChatGPT。</small>
                  </span>
                  <i>{draft.authMode === "relay" ? <CheckCircle2 size={17} /> : null}</i>
                </button>
              </div>
              )}

              {activeProvider.apiOnly && (
                <div className="agent-cli-mode-options" role="radiogroup" aria-label={`${activeProvider.label} 接入方式`}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={draft.authMode === "agent-cli"}
                    className={draft.authMode === "agent-cli" ? "selected" : ""}
                    disabled={connectionOperationBusy}
                    onClick={() => {
                      setDraft((current) => ({ ...current, authMode: "agent-cli" }));
                      setConnectionVerified(false);
                      setError("");
                      setNotice("");
                    }}
                  >
                    <Terminal size={17} />
                    <span>
                      <strong>本地客户端</strong>
                      <small>复用你已登录的 {activeProvider.label} 桌面客户端，用订阅额度执行任务（推荐）。</small>
                    </span>
                    <i>{draft.authMode === "agent-cli" ? <CheckCircle2 size={16} /> : null}</i>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={draft.authMode === "relay"}
                    className={draft.authMode === "relay" ? "selected" : ""}
                    disabled={connectionOperationBusy}
                    onClick={() => {
                      setDraft((current) => ({ ...current, authMode: "relay" }));
                      setConnectionVerified(false);
                      setError("");
                      setNotice("");
                    }}
                  >
                    <KeyRound size={17} />
                    <span>
                      <strong>API 接入</strong>
                      <small>用 {activeProvider.label} 的 OpenAI 兼容 API + 密钥，按 API 额度计费。</small>
                    </span>
                    <i>{draft.authMode === "relay" ? <CheckCircle2 size={16} /> : null}</i>
                  </button>
                </div>
              )}

              {draft.authMode === "agent-cli" && activeProvider.apiOnly && (
                <div className="agent-cli-settings">
                  <label>
                    <span>{activeProvider.label} 可执行文件路径（可选）</span>
                    <input
                      value={activeProvider.id === "claude" ? draft.claudeCliPath : draft.workbuddyCliPath}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDraft((current) => activeProvider.id === "claude"
                          ? { ...current, claudeCliPath: value }
                          : { ...current, workbuddyCliPath: value });
                        setConnectionVerified(false);
                      }}
                      placeholder="留空自动从 PATH 和常见安装位置检测"
                      spellCheck={false}
                      disabled={connectionOperationBusy}
                    />
                    <small>安装并登录 {activeProvider.label} 桌面客户端后保持默认即可；只有自动检测失败时才需要填写。</small>
                  </label>
                  {activeProvider.id === "claude" && (
                    <label>
                      <span>模型（可选）</span>
                      <input
                        value={draft.claudeModel}
                        onChange={(event) => {
                          setDraft((current) => ({ ...current, claudeModel: event.target.value }));
                          setConnectionVerified(false);
                        }}
                        placeholder="留空使用账号默认模型，如 claude-sonnet-4-5"
                        spellCheck={false}
                        disabled={connectionOperationBusy}
                      />
                    </label>
                  )}
                  {activeProvider.id === "workbuddy" && (
                    <label>
                      <span>启动参数模板（可选）</span>
                      <input
                        value={draft.workbuddyArgs}
                        onChange={(event) => {
                          setDraft((current) => ({ ...current, workbuddyArgs: event.target.value }));
                          setConnectionVerified(false);
                        }}
                        placeholder="如 run --model {model} --session {sessionId}"
                        spellCheck={false}
                        disabled={connectionOperationBusy}
                      />
                      <small>仅当 WorkBuddy 不是 Claude 兼容 CLI 时填写；{"{model}"} 与 {"{sessionId}"} 会被替换。</small>
                    </label>
                  )}
                  <div className={`agent-cli-status-card ${agentCliStatus?.detected ? "ok" : agentCliStatus?.error ? "error" : ""}`}>
                    <i>
                      {agentCliChecking
                        ? <LoaderCircle className="spinning" size={18} />
                        : agentCliStatus?.detected
                          ? <CheckCircle2 size={18} />
                          : <CircleAlert size={18} />}
                    </i>
                    <div>
                      <strong>{agentCliStatus?.detected
                        ? `${activeProvider.label} 本地客户端已就绪`
                        : agentCliStatus?.error || "尚未检测本地客户端"}</strong>
                      <small>{[
                        agentCliStatus?.version,
                        agentCliStatus?.path,
                        agentCliStatus?.login?.loggedIn === true
                          ? agentCliStatus.login.detail
                          : agentCliStatus?.login?.loggedIn === false
                            ? agentCliStatus.login.detail
                            : ""
                      ].filter(Boolean).join(" · ")}</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (draft.authMode === "agent-cli") void refreshAgentCliStatus();
                        else testConnection();
                      }}
                      disabled={draft.authMode === "agent-cli"
                        ? agentCliChecking
                        : Boolean(connectionTestBlockReason) || !codexInstalled || (draft.authMode === "relay" && !draft.relayCredentialConfigured)}
                    >
                      {agentCliChecking ? "检测中" : "重新检测"}
                    </button>
                  </div>
                </div>
              )}

              {draft.authMode === "relay" && (
                <div className="relay-settings">
                  <label>
                    <span>{activeProvider.apiOnly ? `${activeProvider.label} API 地址` : "中转站地址"}</span>
                    <input
                      value={draft.apiBaseUrl}
                      onChange={(event) => {
                        setDraft((current) => ({ ...current, apiBaseUrl: event.target.value }));
                        setConnectionVerified(false);
                      }}
                      placeholder={activeProvider.baseUrlPlaceholder}
                      spellCheck={false}
                      disabled={connectionOperationBusy}
                    />
                    <small>{activeProvider.baseUrlHint}</small>
                  </label>
                  {activeProvider.id === "codex" && (
                  <div className="relay-wire-api" role="radiogroup" aria-label="接口协议">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={draft.apiWireApi !== "chat"}
                      className={draft.apiWireApi !== "chat" ? "selected" : ""}
                      disabled={connectionOperationBusy}
                      onClick={() => {
                        setDraft((current) => ({ ...current, apiWireApi: "responses" }));
                        setConnectionVerified(false);
                      }}
                    >
                      <strong>Responses API</strong>
                      <small>OpenAI 新协议，完整 Codex 能力（推理摘要、工具编排）；适用于官方或高兼容中转</small>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={draft.apiWireApi === "chat"}
                      className={draft.apiWireApi === "chat" ? "selected" : ""}
                      disabled={connectionOperationBusy}
                      onClick={() => {
                        setDraft((current) => ({ ...current, apiWireApi: "chat" }));
                        setConnectionVerified(false);
                      }}
                    >
                      <strong>Chat Completions</strong>
                      <small>通用 OpenAI 兼容协议，DeepSeek、Kimi、通义、GLM 及多数聚合网关都支持</small>
                    </button>
                  </div>
                  )}
                  <div>
                    <label>
                      <span>{activeProvider.apiOnly ? "模型 ID" : "模型名称"}</span>
                      <input
                        value={draft.apiModel}
                        onChange={(event) => {
                          setDraft((current) => ({ ...current, apiModel: event.target.value }));
                          setConnectionVerified(false);
                        }}
                        placeholder={activeProvider.modelPlaceholder}
                        spellCheck={false}
                        disabled={connectionOperationBusy}
                      />
                    </label>
                    <label>
                      <span>API Key</span>
                      <input
                        type="password"
                        value={relayApiKey}
                        onChange={(event) => {
                          setRelayApiKey(event.target.value);
                          setConnectionVerified(false);
                        }}
                        placeholder={draft.relayCredentialConfigured ? "已保存到系统安全存储，留空则沿用" : "仅保存到系统安全存储"}
                        autoComplete="new-password"
                        spellCheck={false}
                        disabled={connectionOperationBusy}
                      />
                    </label>
                  </div>
                  <button
                    className={`relay-configure-button ${relayBusy ? "connection-test-cancel" : ""}`}
                    type="button"
                    onClick={() => {
                      if (relayBusy) cancelConnectionTest();
                      else void configureRelay();
                    }}
                    disabled={connectionTestBusy || !codexInstalled}
                  >
                    {relayBusy ? <X size={15} /> : <ShieldCheck size={15} />}
                    {relayBusy ? "取消配置测试" : "安全保存并测试"}
                  </button>
                </div>
              )}

              <div className={`connection-panel ${selectedConnectionReady ? "ok" : "warning"}`}>
                <div className="connection-status">
                  <i className="connection-status-icon">
                    {selectedConnectionReady ? <BadgeCheck size={20} /> : <CircleAlert size={20} />}
                  </i>
                  <div>
                    <small>{draft.authMode === "agent-cli"
                      ? `${activeProvider.label} 本地客户端`
                      : activeProvider.apiOnly
                        ? `${activeProvider.label} API`
                        : draft.authMode === "relay"
                          ? (draft.apiWireApi === "chat" ? "Chat Completions 中转站" : "Responses 中转站")
                          : "ChatGPT / Codex"}</small>
                    <strong>{selectedConnectionReady
                      ? draft.authMode === "agent-cli"
                        ? `${activeProvider.label} 客户端已就绪`
                        : activeProvider.apiOnly
                        ? `${activeProvider.label} 接入已就绪`
                        : draft.authMode === "relay" ? "中转站配置已就绪" : "ChatGPT 身份已就绪"
                      : "尚未检测到可用连接"}</strong>
                    <span>{connectionDetail}</span>
                  </div>
                  <b className="connection-status-badge">
                    {connectionVerified
                      ? "已实测"
                      : selectedConnectionReady
                        ? required ? "下一步自动测试" : "待实测"
                        : "待连接"}
                  </b>
                </div>
                <div className="setup-inline-actions">
                  {draft.authMode === "chatgpt" && (
                    <button type="button" onClick={startLogin} disabled={connectionOperationBusy || loginBusy || !codexInstalled}>
                      {loginBusy ? <LoaderCircle className="spinning" size={16} /> : <LogIn size={16} />}
                      {selectedConnectionReady ? "切换 ChatGPT 账号" : "登录 ChatGPT"}
                      <ExternalLink size={13} />
                    </button>
                  )}
                  {connectionOperationBusy ? (
                    <button className="connection-test-cancel" type="button" onClick={() => cancelConnectionTest()}>
                      <X size={15} />{relayBusy ? "取消配置测试" : "取消测试"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void refreshAgentCliStatus()}
                      disabled={agentCliChecking}
                    >
                      <RefreshCw size={15} className={agentCliChecking ? "spinning" : ""} />{draft.authMode === "agent-cli" ? "检测本地客户端" : "测试完整连接"}
                    </button>
                  )}
                </div>
                {connectionOperationBusy && (
                  <div className="connection-test-progress" role="status">
                    <LoaderCircle className="spinning" size={14} />
                    <span>{relayBusy
                      ? "正在安全保存中转站并验证模型与 Shell 工具；最多等待 90 秒，可随时取消。"
                      : "正在验证模型响应与 Shell 工具；最多等待 90 秒，可随时取消。"}</span>
                  </div>
                )}
                {!connectionOperationBusy && connectionTestBlockReason && (
                  <div className="connection-test-prerequisite" role="note">
                    <CircleAlert size={13} />
                    <span>{connectionTestBlockReason}</span>
                  </div>
                )}
              </div>

              <details className="advanced-settings">
                <summary><HardDrive size={15} />高级设置</summary>
                <button
                  className={`permission-setting ${draft.externalAccessMode === "always" ? "enabled" : ""}`}
                  type="button"
                  role="switch"
                  aria-checked={draft.externalAccessMode === "always"}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    externalAccessMode: current.externalAccessMode === "always" ? "ask" : "always"
                  }))}
                >
                  <ShieldCheck size={17} />
                  <span>
                    <strong>始终允许外部数据访问</strong>
                    <small>允许 Codex 直接读取飞书、Wiki 和所选本地资料库，不再逐次询问。</small>
                  </span>
                  <i aria-hidden="true"><b /></i>
                </button>
                <button
                  className={`permission-setting ${draft.documentSearchCloudContent ? "enabled" : ""}`}
                  type="button"
                  role="switch"
                  aria-checked={draft.documentSearchCloudContent === true}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    documentSearchCloudContent: current.documentSearchCloudContent !== true
                  }))}
                >
                  <ShieldCheck size={17} />
                  <span>
                    <strong>索引云盘资料库正文</strong>
                    <small>默认跳过 OneDrive/Dropbox 等云盘目录的正文索引，避免触发整库按需下载；开启后会读取并下载云盘文件。</small>
                  </span>
                  <i aria-hidden="true"><b /></i>
                </button>
                <button
                  className={`permission-setting ${draft.semanticSearchEnabled !== false ? "enabled" : ""}`}
                  type="button"
                  role="switch"
                  aria-checked={draft.semanticSearchEnabled !== false}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    semanticSearchEnabled: current.semanticSearchEnabled === false
                  }))}
                >
                  <ShieldCheck size={17} />
                  <span>
                    <strong>语义检索（本地向量模型）</strong>
                    <small>在关键词检索之外启用本地向量化语义召回，提升大资料库下的命中质量。首次使用会在后台下载约 120MB 的本地模型，全部在本机运行，不上传任何文档内容。</small>
                  </span>
                  <i aria-hidden="true"><b /></i>
                </button>
                <label>
                  <span>自定义 Codex 路径</span>
                  <input
                    value={draft.codexPath}
                    onChange={(event) => {
                      setDraft((current) => ({ ...current, codexPath: event.target.value }));
                      setConnectionVerified(false);
                    }}
                    placeholder="自动检测，通常无需填写"
                    spellCheck={false}
                    disabled={connectionOperationBusy}
                  />
                </label>
              </details>

              {(error || notice) && <div className={`setup-feedback ${error ? "error" : "success"}`}>{error || notice}</div>}
            </div>
          ) : tab === "data" ? (
            <div className="setup-form data-connection-form">
              <div className="storage-backend-options local-only" aria-label="本地主资料库">
                <div className="selected">
                  <HardDrive size={19} />
                  <span>
                    <strong>{settings.storageBackend === "feishu"
                      ? "本地资料库 · 目标架构"
                      : "本地资料库 · 默认基础"}</strong>
                    <small>{settings.storageBackend === "feishu"
                      ? "旧版飞书主库尚未导入；下方只是准备本地工作区，不代表已经完成迁移或切换。"
                      : "SQLite 管理结构化数据，Markdown 保存文档和图片；项目、人脉、行业动态均以本机内容为准。"}</small>
                  </span>
                  <i><CheckCircle2 size={17} /></i>
                </div>
              </div>
              {settings.storageBackend === "feishu" ? (
                <div className="setup-feedback success legacy-feishu-compatibility" role="status">
                  <strong>旧版飞书主库仍按原模式运行</strong>
                  <span>为避免现有项目和人脉突然消失，domi 不会静默切到空的本地库。当前读写与文档连接可继续使用；待你明确完成“安全导入本地”并逐项核验后，才会切换主资料库，且不会删除飞书内容。</span>
                </div>
              ) : null}
              <section className={`feishu-connection-card ${feishuStatus?.connected ? "connected" : ""}`}>
                <span className="feishu-connection-icon">
                  {feishuStatus?.connected ? <BadgeCheck size={21} /> : <Cloud size={21} />}
                </span>
                <span className="feishu-connection-copy">
                  <strong>{feishuStatusBusy && !feishuStatus
                    ? "正在检查飞书连接"
                    : feishuStatus?.connected
                      ? `飞书已连接${feishuStatus.userName ? ` · ${feishuStatus.userName}` : ""}`
                      : "连接飞书（可选）"}</strong>
                  <small>{feishuStatus?.connected
                    ? settings.storageBackend === "feishu"
                      ? "旧版飞书主库继续按原模式安全运行；完整飞书权限和既有资料连接都会保留，本地安全导入完成后才接管管理。"
                      : "可按你的指令访问飞书资料、联系人和消息，或创建、编辑、发布文档；本地资料库始终是管理基础。"
                    : feishuStatus?.error && !feishuStatusBusy
                      ? feishuStatus.error
                      : "连接后保留此前完整的飞书业务能力；不会自动创建或接管 Base，也不会改变、迁移本地资料。"}</small>
                  <small className="feishu-permission-scope">授权范围：多维表格、知识库、云文档、云盘、消息与通讯录；仅在你的明确指令或已启用工作流需要时使用。</small>
                </span>
                <span className="feishu-connection-actions">
                  {feishuStatus?.connected ? (
                    <button type="button" onClick={() => void refreshFeishuStatus(true)} disabled={feishuStatusBusy}>
                      {feishuStatusBusy ? <LoaderCircle className="spinning" size={14} /> : <RefreshCw size={14} />}
                      检查连接
                    </button>
                  ) : feishuAuth?.flow === "configuration" ? (
                    <button type="button" onClick={startFeishuAuth} disabled={feishuAuthBusy}>
                      {feishuAuthBusy ? <LoaderCircle className="spinning" size={14} /> : <CheckCircle2 size={14} />}
                      应用已配置，继续
                    </button>
                  ) : feishuAuth?.deviceCode ? (
                    <button type="button" onClick={completeFeishuAuth} disabled={feishuAuthBusy}>
                      {feishuAuthBusy ? <LoaderCircle className="spinning" size={14} /> : <CheckCircle2 size={14} />}
                      我已完成授权
                    </button>
                  ) : (
                    <button type="button" onClick={startFeishuAuth} disabled={feishuAuthBusy || feishuStatusBusy}>
                      {feishuAuthBusy ? <LoaderCircle className="spinning" size={14} /> : <LogIn size={14} />}
                      连接飞书
                    </button>
                  )}
                  {codexStatus?.ok
                    && (Boolean(feishuAssistIssue) || Boolean(feishuStatus && !feishuStatus.connected)) ? (
                    <button
                      type="button"
                      onClick={assistFeishuConnection}
                      disabled={feishuAssistBusy || feishuAuthBusy}
                    >
                      {feishuAssistBusy
                        ? <LoaderCircle className="spinning" size={14} />
                        : <Sparkles size={14} />}
                      {feishuAssistBusy ? "Codex 正在判断" : "让 Codex 帮我"}
                    </button>
                  ) : null}
                </span>
                {feishuAuth?.verificationUrl ? (
                  <span className="feishu-auth-progress">
                    <ExternalLink size={15} />
                    <span>
                      <strong>{feishuAuth.flow === "configuration"
                        ? "第 1 步：初始化飞书应用"
                        : "第 2 步：授权飞书账号"}</strong>
                      <small>{feishuAuth.flow === "configuration"
                        ? "应用凭据只会保存在 macOS 钥匙串；完成后回到这里继续账号授权。"
                        : `${feishuAuth.userCode ? `验证码：${feishuAuth.userCode} · ` : ""}授权完成后回到这里继续。`}</small>
                    </span>
                    <button type="button" onClick={startFeishuAuth} disabled={feishuAuthBusy}>重新打开</button>
                  </span>
                ) : null}
                {feishuAssistBusy || feishuAssistMessage ? (
                  <span className="feishu-assist-result" aria-live="polite">
                    <strong>{feishuAssistBusy ? "Codex 正在分析当前步骤" : "Codex 连接建议"}</strong>
                    <small>{feishuAssistBusy
                      ? "只会读取脱敏后的阶段和错误，不会打开浏览器或代替你登录、授权。"
                      : feishuAssistMessage}</small>
                  </span>
                ) : null}
              </section>
              <div className="data-privacy-note">
                <ShieldCheck size={19} />
                <span>
                  <strong>{settings.storageBackend === "feishu" ? "兼容期不会丢失旧资料" : "本地是唯一主资料库"}</strong>
                  <small>{settings.storageBackend === "feishu"
                    ? "当前旧飞书主库继续按原模式运行；不会自动切换、导入、覆盖或删除。新用户和完成安全导入后的用户均以本地为准。"
                    : "飞书是可选的外部参考资料库和发布平台。未经你的明确指令，domi 不会把本地记录发布到飞书，也不会用飞书内容覆盖本地数据。"}</small>
                </span>
              </div>
              <div className="local-storage-panel">
                  <div className="local-storage-summary">
                    <Database size={20} />
                    <span>
                      <strong>一套资料库，三种内容自动对应</strong>
                      <small>项目、人脉和行业事件写入 SQLite；项目主页与纪要写成 Markdown；BP、录音和附件保留原文件。</small>
                    </span>
                  </div>
                  <label className="local-library-setting">
                    <span>domi 工作区</span>
                    <div className="directory-picker">
                      <input
                        value={draft.localRepositoryDir}
                        onChange={(event) => setDraft((current) => ({ ...current, localRepositoryDir: event.target.value }))}
                        placeholder="请选择工作区的上级目录"
                        spellCheck={false}
                      />
                      <button type="button" onClick={chooseLocalLibraryDirectory} title="选择本地资料库目录" aria-label="选择本地资料库目录">
                        <FolderOpen size={16} />
                      </button>
                    </div>
                    <small>选择上级目录后，domi 会先创建“domi工作区”，在根目录生成“0.待办事项.md”，再建立行业研究、行业动态、项目库和人脉库；已有文件不会被删除或覆盖。</small>
                  </label>
                  <div className="local-database-location">
                    <span>SQLite 数据库</span>
                    <code>{draft.localDatabasePath || "保存设置后自动创建"}</code>
                    <small>数据库保存在 Application Support，不放入同步盘，Markdown 和附件仍可选择 iCloud、OneDrive 或普通文件夹。</small>
                  </div>
                </div>
              <section className="task-calendar-settings">
                <div className="task-calendar-settings-heading">
                  <CalendarDays size={20} />
                  <span>
                    <strong>待办事项与日历</strong>
                    {required ? <em>可稍后设置</em> : null}
                    <small>{required
                      ? "这部分不影响完成资料库配置；可以先跳过，之后再连接 Outlook 和添加常用参会人。"
                      : "domi 使用工作区根目录的“0.待办事项.md”；日程邀请由当前 Outlook 账号的默认日历发出。"}</small>
                  </span>
                </div>
                <div className={`outlook-account-card ${draft.outlookCalendarEmailVerifiedAt ? "verified" : ""}`}>
                  <span className="outlook-account-icon">
                    {draft.outlookCalendarEmailVerifiedAt
                      ? <BadgeCheck size={19} />
                      : <CalendarDays size={19} />}
                  </span>
                  <span className="outlook-account-copy">
                    <strong>发送账号</strong>
                    <b>{draft.outlookCalendarEmail || "尚未检测当前 Outlook 登录账号"}</b>
                    <small>{draft.outlookCalendarEmailVerifiedAt
                      ? `上次通过 Outlook Calendar 验证：${outlookVerificationTime(draft.outlookCalendarEmailVerifiedAt)}。该账号将作为日程组织者发送邀请。`
                      : draft.outlookCalendarEmail
                        ? "这是旧版保存的账号提示，尚未与 Outlook 当前登录身份核对。"
                        : "连接 Outlook 后点击检测；domi 不使用 SMTP，也不会自行选择其他邮箱。"}</small>
                  </span>
                  <button
                    type="button"
                    onClick={checkOutlookProfile}
                    disabled={outlookProfileBusy || !codexStatus?.ok}
                  >
                    {outlookProfileBusy
                      ? <LoaderCircle className="spinning" size={14} />
                      : <RefreshCw size={14} />}
                    {outlookProfileBusy
                      ? "检测中"
                      : draft.outlookCalendarEmailVerifiedAt
                        ? "重新检测"
                        : "检测账号"}
                  </button>
                </div>
                <div className="task-calendar-settings-grid">
                  <section className="calendar-timezone-setting">
                    <label>
                      <span>默认时区</span>
                      <input
                        value={draft.outlookCalendarTimezone}
                        onChange={(event) => setDraft((current) => ({ ...current, outlookCalendarTimezone: event.target.value }))}
                        placeholder="Asia/Shanghai"
                        spellCheck={false}
                      />
                      <small>使用 IANA 时区名称；跨城市日程仍以当次明确输入为准。</small>
                    </label>
                  </section>
                  <section className="calendar-recipient-setting">
                    <label>
                      <span>常用参会人（可多个）</span>
                      <textarea
                        rows={3}
                        value={draft.outlookCalendarRecipients}
                        onChange={(event) => setDraft((current) => ({
                          ...current,
                          outlookCalendarRecipients: event.target.value
                        }))}
                        placeholder={"张三 <zhangsan@example.com>\n李四 <lisi@example.com>"}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <small>使用逗号、分号或换行分隔。约日程时由用户选择一个或多个，不会默认全部发送。</small>
                    </label>
                  </section>
                </div>
              </section>
              {(error || notice) && <div className={`setup-feedback ${error ? "error" : "success"}`}>{error || notice}</div>}
            </div>
          ) : tab === "updates" ? (
            <div className="update-view">
              <div className={`update-summary ${updateStatus?.state === "error" ? "error" : ""}`}>
                <span><Sparkles size={22} /></span>
                <div>
                  <small>当前版本</small>
                  <strong>{updateStatus?.currentVersion || "读取中"}</strong>
                  <p>{updateStateLabel}</p>
                </div>
              </div>

              <section className="codex-runtime-update">
                <div className="codex-runtime-update-copy">
                  <Terminal size={18} />
                  <span>
                    <strong>Codex Runtime</strong>
                    <small>
                      {codexRuntime?.ok
                        ? `${codexRuntime.version}${codexRuntime.bundledVersion ? ` · 内置基线 ${codexRuntime.bundledVersion}` : ""}`
                        : codexRuntime?.error || "正在读取运行时版本"}
                    </small>
                  </span>
                </div>
                <div className="codex-runtime-actions">
                  <button type="button" onClick={updateRuntime} disabled={codexRuntimeBusy}>
                    {codexRuntimeBusy ? <LoaderCircle className="spinning" size={15} /> : <RefreshCw size={15} />}
                    检查并更新
                  </button>
                  {codexRuntime?.rollbackAvailable && (
                    <button type="button" onClick={rollbackRuntime} disabled={codexRuntimeBusy}>
                      恢复 {codexRuntime.rollbackVersion || "上一版本"}
                    </button>
                  )}
                </div>
                <p>更新走系统网络设置；下载或校验失败时继续使用当前版本，不影响 domi 和本地资料。</p>
              </section>

              <section className="update-channel-setting">
                <div>
                  <strong>更新通道</strong>
                  <span>稳定版适合团队日常使用；测试版用于提前验证新功能。</span>
                </div>
                <div className="update-channel-options" role="radiogroup" aria-label="更新通道">
                  <button
                    type="button"
                    className={draft.updateChannel === "stable" ? "selected" : ""}
                    onClick={() => setDraft((current) => ({ ...current, updateChannel: "stable" }))}
                  >稳定版</button>
                  <button
                    type="button"
                    className={draft.updateChannel === "beta" ? "selected" : ""}
                    onClick={() => setDraft((current) => ({ ...current, updateChannel: "beta" }))}
                  >测试版</button>
                </div>
              </section>

              {updateStatus?.state === "downloading" && (
                <div className="update-progress" aria-label={`下载进度 ${Math.round(updateStatus.percent)}%`}>
                  <i style={{ width: `${Math.max(0, Math.min(100, updateStatus.percent))}%` }} />
                </div>
              )}

              <div className="update-actions">
                {updateStatus?.state === "available" ? (
                  <button type="button" onClick={downloadAvailableUpdate} disabled={updateBusy}>
                    <Download size={16} />更新到 {updateStatus.availableVersion}
                  </button>
                ) : updateStatus?.state === "downloaded" ? (
                  <button
                    className="primary"
                    type="button"
                    onClick={installDownloadedUpdate}
                    disabled={updateBusy || Boolean(updateStatus.installing) || Boolean(updateStatus.restartPending && !updateStatus.error)}
                  >
                    <RefreshCw className={updateStatus.installing || updateStatus.restartPending ? "spinning" : ""} size={16} />
                    {updateStatus.error ? "重试安全重启" : "等待安全重启"}
                  </button>
                ) : (
                  <button type="button" onClick={checkUpdates} disabled={updateBusy || !updateStatus?.supported}>
                    {updateBusy || updateStatus?.state === "checking"
                      ? <LoaderCircle className="spinning" size={16} />
                      : <RefreshCw size={16} />}
                    检查更新
                  </button>
                )}
              </div>

              <div className="update-data-note">
                <ShieldCheck size={18} />
                <span>
                  <strong>升级不会清除本地数据</strong>
                  <small>对话历史和设置保存在 Application Support，任务材料保存在 domi 工作区；更新只替换应用程序。</small>
                </span>
              </div>
              {(error || notice || updateStatus?.error) && (
                <div className={`setup-feedback ${error || updateStatus?.error || updateStatus?.state === "error" ? "error" : "success"}`}>
                  {error || updateStatus?.error || notice}
                </div>
              )}
            </div>
          ) : (
            <div className="diagnostic-view">
              <div className="diagnostic-summary">
                <div>
                  <strong>{report ? (report.ok ? "系统已就绪" : "发现需要处理的问题") : "运行一次完整检查"}</strong>
                  <span>{report ? `${report.checks.filter((item) => item.ok).length}/${report.checks.length} 项通过 · ${report.durationMs}ms` : "诊断信息会自动脱敏，可安全导出给管理员排查。"}</span>
                </div>
                <button type="button" onClick={diagnose} disabled={diagnosing}>
                  {diagnosing ? <LoaderCircle className="spinning" size={16} /> : <RefreshCw size={16} />}
                  {report ? "重新检查" : "开始检查"}
                </button>
              </div>
              <div className="diagnostic-list">
                {report?.checks.map((check) => (
                  <div key={check.id}>
                    {check.ok ? <CheckCircle2 className="ok" size={18} /> : <CircleAlert className="bad" size={18} />}
                    <span><strong>{check.label}</strong><small>{check.detail}</small></span>
                  </div>
                ))}
                {!report && <div className="diagnostic-placeholder"><ShieldCheck size={28} /><span>尚未运行诊断</span></div>}
              </div>
              {report && (
                <button className="export-diagnostics" type="button" onClick={exportReport}>
                  <Download size={15} />导出脱敏诊断报告
                </button>
              )}
              {error && <div className="setup-feedback error">{error}</div>}
            </div>
          )}

          <footer className="setup-footer">
            <span>{tab === "connection"
              ? "更改连接会重启本地 Codex 服务，不影响 domi 中的对话记录。"
              : tab === "data"
                ? "配置保存在 Application Support；覆盖安装和自动更新会继续沿用，无需重复配置。"
              : tab === "updates"
                ? "更新包必须通过 Developer ID 签名与 Apple 公证。"
                : "诊断报告不包含登录令牌或 Base 标识。"}</span>
            {tab === "connection" && (
              <button
                className="setup-primary"
                type="button"
                onClick={() => connectionOperationBusy
                  ? cancelConnectionTest()
                  : saveConnection(required)}
                disabled={saving || installBusy
                  || (!codexInstalled && !codexPathRequiresApply && draft.authMode !== "agent-cli")}
              >
                {saving && <LoaderCircle className="spinning" size={16} />}
                {connectionOperationBusy
                  ? relayBusy ? "取消中转站配置测试" : "取消连接测试"
                  : codexPathRequiresApply
                    ? "应用 Codex 路径"
                  : required
                    ? "下一步：资料连接"
                    : "保存设置"}
              </button>
            )}
            {tab === "data" && (
              <button
                className="setup-primary"
                type="button"
                onClick={() => save(required)}
                disabled={saving || feishuAuthBusy}
              >
                {(saving || feishuAuthBusy) && <LoaderCircle className="spinning" size={16} />}
                {feishuAuthBusy
                  ? "正在连接飞书…"
                  : required
                    ? "保存并进入 domi"
                    : "保存资料连接"}
              </button>
            )}
            {tab === "updates" && (
              <button className="setup-primary" type="button" onClick={saveUpdateSettings} disabled={saving || updateBusy}>
                {saving && <LoaderCircle className="spinning" size={16} />}
                保存并检查
              </button>
            )}
          </footer>
        </section>
      </div>
      {confirmDialog}
    </div>
  );
}