import assert from "node:assert/strict";
import test from "node:test";
import { CodexModelReadiness } from "../src/codex-model-readiness.ts";
import { resolveDomiModelPolicy } from "../src/model-policy.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function status(overrides = {}) {
  return {
    ok: true,
    models: [{
      id: "gpt-6.1-sol",
      supportedReasoningEfforts: [{ id: "high" }, { id: "max" }]
    }],
    ...overrides
  };
}

test("an intake arriving during startup waits for one check and retains its model policy", async () => {
  const connection = deferred();
  let calls = 0;
  let starts = 0;
  let published;
  const gate = new CodexModelReadiness(() => {
    calls += 1;
    return connection.promise;
  }, (value) => { published = value; });
  const startup = gate.refresh();
  const send = async () => {
    await gate.ready();
    assert.equal(gate.current(), published, "status is visible before React renders again");
    const policy = resolveDomiModelPolicy({
      runKind: "intake",
      models: gate.current().models
    });
    starts += 1;
    return policy;
  };
  const first = send();
  const second = send();
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(starts, 0);
  connection.resolve(status());
  await startup;
  for (const policy of await Promise.all([first, second])) {
    assert.equal(policy.model, "gpt-6.1-sol");
    assert.equal(policy.reasoningEffort, "high");
    assert.equal(policy.serviceTier, "standard");
  }
  assert.equal(starts, 2);
  await gate.ready();
  assert.equal(calls, 1, "a ready connection needs no additional check");
});

test("a send preceding startup initiates a check shared by startup", async () => {
  const connection = deferred();
  const requests = [];
  const gate = new CodexModelReadiness((request) => {
    requests.push(request);
    return connection.promise;
  }, () => {});
  const send = gate.ready();
  const startup = gate.refresh();
  await Promise.resolve();
  assert.deepEqual(requests, [{ refreshModels: true }]);
  connection.resolve(status());
  assert.equal(await send, await startup);
});

test("a failed connection preserves its real error and can be retried", async () => {
  let calls = 0;
  const gate = new CodexModelReadiness(async () => ++calls === 1
    ? status({ ok: false, models: [], error: "Codex account/read 请求超时" })
    : status(), () => {});
  await assert.rejects(gate.ready(), /Codex account\/read 请求超时/);
  assert.equal(gate.current().ok, false);
  assert.equal((await gate.ready()).ok, true);
  assert.equal(calls, 2);
});

test("an empty completed catalog still blocks submission", async () => {
  const gate = new CodexModelReadiness(async () => status({ models: [] }), () => {});
  await assert.rejects(gate.ready(), /model\/list.*列表为空/);
});

test("an unavailable policy model is never silently replaced", async () => {
  const gate = new CodexModelReadiness(async () => status({
    models: [{ id: "gpt-6-luna", supportedReasoningEfforts: [{ id: "high" }] }]
  }), () => {});
  await gate.ready();
  assert.throws(() => resolveDomiModelPolicy({
    runKind: "intake", models: gate.current().models
  }), /不支持策略要求的模型 gpt-6\.1-sol/);
});

test("a rejected check releases its shared slot so a later retry can succeed", async () => {
  let calls = 0;
  const gate = new CodexModelReadiness(async () => {
    if (++calls === 1) throw new Error("IPC connection lost");
    return status();
  }, () => {});
  const first = gate.ready();
  const second = gate.ready();
  await assert.rejects(first, /IPC connection lost/);
  await assert.rejects(second, /IPC connection lost/);
  assert.equal(calls, 1);
  await gate.ready();
  assert.equal(calls, 2);
});

test("a send during refresh waits instead of using an older catalog", async () => {
  const connection = deferred();
  const gate = new CodexModelReadiness(() => connection.promise, () => {});
  gate.update(status());
  const refresh = gate.refresh({ refreshModels: true });
  let finished = false;
  const send = gate.ready().finally(() => { finished = true; });
  await Promise.resolve();
  assert.equal(finished, false);
  connection.resolve(status({ ok: false, models: [], error: "请先登录 ChatGPT Codex。" }));
  await refresh;
  await assert.rejects(send, /请先登录 ChatGPT Codex/);
});

test("a settings save supersedes a check from the previous connection", async () => {
  const connection = deferred();
  const published = [];
  const gate = new CodexModelReadiness(() => connection.promise, (value) => published.push(value));
  const oldCheck = gate.refresh();
  const verified = status();
  gate.update(verified);
  connection.resolve(status({ ok: false, models: [], error: "old connection failed" }));
  assert.equal(await oldCheck, verified);
  assert.equal(await gate.ready(), verified);
  assert.deepEqual(published, [verified]);
});
