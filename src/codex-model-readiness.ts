import type { CodexCheckResult } from "./env";

type CheckRequest = { refreshModels?: boolean };

/** Share startup/refresh checks and publish their result before a send resumes. */
export class CodexModelReadiness {
  private status: CodexCheckResult | null = null;
  private pending: Promise<CodexCheckResult> | null = null;
  private revision = 0;
  private readonly check: (request?: CheckRequest) => Promise<CodexCheckResult>;
  private readonly publish: (status: CodexCheckResult) => void;

  constructor(
    check: (request?: CheckRequest) => Promise<CodexCheckResult>,
    publish: (status: CodexCheckResult) => void
  ) {
    this.check = check;
    this.publish = publish;
  }

  current() {
    return this.status;
  }

  update(status: CodexCheckResult) {
    this.revision += 1;
    this.status = status;
    this.publish(status);
  }

  refresh(request?: CheckRequest): Promise<CodexCheckResult> {
    if (this.pending) return this.pending;
    const revision = this.revision;
    this.pending = Promise.resolve().then(() => this.check(request)).then((status) => {
      // A settings save may supply a newer, verified connection while this
      // check is still running. Its result must not replace that connection.
      if (this.revision === revision) this.update(status);
      return this.status || status;
    }).finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  async ready(): Promise<CodexCheckResult> {
    const status = this.pending
      ? await this.pending
      : this.status?.ok && this.status.models.length
        ? this.status
        : await this.refresh({ refreshModels: true });
    if (!status.ok) {
      throw new Error(status.error || "Codex 连接尚未就绪，请在设置的 AI 引擎中重新检测。");
    }
    if (!status.models.length) {
      throw new Error("Codex model/list 返回的模型列表为空，请在设置的 AI 引擎中刷新模型后重试。");
    }
    return status;
  }
}
