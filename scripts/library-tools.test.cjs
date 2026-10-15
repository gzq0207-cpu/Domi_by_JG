const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { LibrarySession, libraryToolSpecs, startLibraryThread } = require("../electron/library-tools.cjs");
const { LibraryToolGateway } = require("../electron/library-tool-gateway.cjs");

function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-library-tools-"));
  const filePath = path.join(directory, "研究.md");
  fs.writeFileSync(filePath, "# 商业化\n企业客户愿意付费，但推理成本限制了毛利。\n");
  const updates = [];
  const session = new LibrarySession({ rootPath: directory, settings: { storageBackend: "local", semanticSearchEnabled: false },
    search: async () => ({ ok: true, results: [{ path: filePath, relativePath: "研究.md", line: 2, snippet: "推理成本限制毛利" }] }),
    onUpdate: (snapshot) => updates.push(snapshot), ...options });
  t.after(() => { session.close(); fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); });
  return { directory, filePath, session, updates };
}

test("search, read, continue searching and status share a verifiable source ledger", async (t) => {
  const { session, updates } = fixture(t);
  const search = await session.call("domi_library_search", { query: "商业化瓶颈" });
  assert.equal(search.ok, true);
  assert.equal(session.snapshot().readCount, 0, "snippets are not original-text reads");
  const doc = await session.call("domi_library_read", { path: search.results[0].path });
  assert.equal(doc.fullDocument, true);
  await session.call("domi_library_search", { query: "推理成本" });
  const status = await session.call("domi_library_status");
  assert.equal(status.readCount, 1);
  assert.equal(status.fullCount, 1);
  assert.equal(status.searches, 2);
  assert.ok(updates.length >= 4);
  assert.equal(status.sources[0].sourceId, doc.sourceId);
});

test("full text status becomes true only after all original ranges have been delivered", async (t) => {
  const { session, filePath } = fixture(t);
  const text = `# 报告\n${"正文。".repeat(2800)}末尾反例。`;
  fs.writeFileSync(filePath, text);
  let doc = await session.call("domi_library_read", { path: filePath, mode: "document", maxChars: 900 });
  assert.equal(session.snapshot().fullCount, 0);
  while (doc.nextCursor) doc = await session.call("domi_library_read", { path: filePath, cursor: doc.nextCursor, maxChars: 900 });
  assert.equal(session.snapshot().fullCount, 1);
  assert.equal(session.snapshot().sources[0].coveredChars, text.length);
});

test("parallel tool reads respect a shared budget and configuration changes revoke access", async (t) => {
  let current = true;
  const { session, filePath } = fixture(t, { maxReadChars: 15, isCurrent: () => current });
  await Promise.all([session.call("domi_library_read", { path: filePath }), session.call("domi_library_read", { path: filePath })]);
  assert.ok(session.snapshot().readChars <= 15);
  assert.equal(session.snapshot().fullCount, 0);
  current = false;
  const denied = await session.call("domi_library_read", { path: filePath });
  assert.equal(denied.ok, false);
  assert.match(denied.error, /配置已改变/);
});

test("first-turn chapter hydration is included in the ledger and tools stay read-only", async (t) => {
  const { session, filePath } = fixture(t);
  const original = fs.readFileSync(filePath, "utf8");
  const context = await session.initialContext("商业化瓶颈");
  assert.match(context.context, /企业客户愿意付费/);
  assert.equal(session.snapshot().fullCount, 1);
  assert.equal(fs.readFileSync(filePath, "utf8"), original);
  assert.deepEqual(libraryToolSpecs.map((spec) => spec.name), ["domi_library_search", "domi_library_read", "domi_library_status"]);
});

test("existing conversations can call the same tools through a revocable loopback CLI", async (t) => {
  const { session, directory } = fixture(t);
  const gateway = new LibraryToolGateway();
  const access = await gateway.add(session);
  const cliPath = path.join(__dirname, "../electron/library-tool-cli.cjs");
  try {
    const argumentPath = path.join(directory, "request.json");
    fs.writeFileSync(argumentPath, JSON.stringify({ query: "商业化" }));
    const result = await promisify(execFile)(process.execPath, [cliPath, "--endpoint", access.endpoint, "search", "--json-file", argumentPath]);
    assert.equal(JSON.parse(result.stdout).ok, true);
    assert.equal(session.snapshot().searches, 1);
    access.revoke();
    const denied = await fetch(access.endpoint, { method: "POST", body: JSON.stringify({ tool: "domi_library_status" }) });
    assert.equal(denied.status, 403);
  } finally { await gateway.close(); }
});

test("older app servers can start the same selected model through the CLI fallback", async () => {
  const requests = [];
  const client = { request: async (_method, params) => {
    requests.push(params);
    if (params.dynamicTools) throw new Error("unsupported dynamicTools");
    return { thread: { id: "same-task" } };
  } };
  const result = await startLibraryThread(client, { model: "selected-model", cwd: "/workspace", dynamicTools: libraryToolSpecs });
  assert.equal(result.toolsRegistered, false);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].model, "selected-model");
  await assert.rejects(startLibraryThread({ request: async () => { throw new Error("selected model unavailable"); } }, { dynamicTools: libraryToolSpecs }), /model unavailable/);
});
