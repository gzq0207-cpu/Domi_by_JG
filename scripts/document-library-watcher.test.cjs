const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DocumentLibraryWatcher, isIgnoredWatchPath } = require("../electron/document-library-watcher.cjs");

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitFor(check, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (check()) return true;
    await delay(25);
  }
  return false;
}
function tempRoot() { return fs.mkdtempSync(path.join(os.tmpdir(), "domi-watcher-")); }

test("hidden and office lock paths are ignored, normal names are not", () => {
  assert.equal(isIgnoredWatchPath(".domi/ledger.json"), true);
  assert.equal(isIgnoredWatchPath("sub\\.domi\\x"), true);
  assert.equal(isIgnoredWatchPath("~$report.docx"), true);
  assert.equal(isIgnoredWatchPath("sub/~$a.docx"), true);
  assert.equal(isIgnoredWatchPath("sub\\a.pdf"), false);
  assert.equal(isIgnoredWatchPath("a.md"), false);
  assert.equal(isIgnoredWatchPath(""), false);
  assert.equal(isIgnoredWatchPath(null), false);
});

test("external add, rename and delete each notify with the resolved root", async () => {
  const root = tempRoot();
  const events = [];
  const watcher = new DocumentLibraryWatcher({ debounceMs: 30, onChanged: payload => events.push(payload) });
  watcher.watch({ rootPath: root });
  try {
    fs.writeFileSync(path.join(root, "a.md"), "hello");
    assert.ok(await waitFor(() => events.length >= 1), "新增文件应触发通知");
    assert.equal(events[0].rootPath, path.resolve(root));
    assert.equal(events[0].reason, "file-change");

    fs.renameSync(path.join(root, "a.md"), path.join(root, "b.md"));
    assert.ok(await waitFor(() => events.length >= 2), "重命名应触发通知");

    fs.rmSync(path.join(root, "b.md"));
    assert.ok(await waitFor(() => events.length >= 3), "删除应触发通知");
  } finally {
    watcher.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a burst of writes is debounced into one notification", async () => {
  const root = tempRoot();
  const events = [];
  const watcher = new DocumentLibraryWatcher({ debounceMs: 80, onChanged: payload => events.push(payload) });
  watcher.watch({ rootPath: root });
  try {
    for (let index = 0; index < 6; index += 1) fs.writeFileSync(path.join(root, `file${index}.md`), "x");
    await delay(400);
    assert.equal(events.length, 1, `连续写入应合并为一次通知，实际 ${events.length}`);
  } finally {
    watcher.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("switching roots stops the previous watcher and pending notifications", async () => {
  const first = tempRoot(), second = tempRoot();
  const events = [];
  const watcher = new DocumentLibraryWatcher({ debounceMs: 40, onChanged: payload => events.push(payload) });
  watcher.watch({ rootPath: first });
  fs.writeFileSync(path.join(first, "pending.md"), "x");
  watcher.watch({ rootPath: second });
  await delay(300);
  assert.equal(events.length, 0, "切根后旧目录的待发通知应被取消");

  fs.writeFileSync(path.join(second, "new.md"), "y");
  assert.ok(await waitFor(() => events.length >= 1), "新根目录的变更应触发通知");
  assert.equal(events[0].rootPath, path.resolve(second));

  fs.writeFileSync(path.join(first, "stale.md"), "z");
  await delay(300);
  assert.equal(events.length, 1, "旧根目录不再被监听");

  watcher.close();
  fs.rmSync(first, { recursive: true, force: true });
  fs.rmSync(second, { recursive: true, force: true });
});

test("close stops notifications entirely", async () => {
  const root = tempRoot();
  const events = [];
  const watcher = new DocumentLibraryWatcher({ debounceMs: 30, onChanged: payload => events.push(payload) });
  watcher.watch({ rootPath: root });
  watcher.close();
  fs.writeFileSync(path.join(root, "after.md"), "x");
  await delay(300);
  assert.equal(events.length, 0, "close 之后不应再通知");
  fs.rmSync(root, { recursive: true, force: true });
});

test("repeated watch calls on the same root are idempotent", async () => {
  const root = tempRoot();
  const events = [];
  const watcher = new DocumentLibraryWatcher({ debounceMs: 30, onChanged: payload => events.push(payload) });
  watcher.watch({ rootPath: root });
  watcher.watch({ rootPath: root });
  watcher.watch({ rootPath: root });
  fs.writeFileSync(path.join(root, "again.md"), "x");
  assert.ok(await waitFor(() => events.length >= 1), "幂等 watch 不应中断监听");
  watcher.close();
  fs.rmSync(root, { recursive: true, force: true });
});
