const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_DEBOUNCE_MS = 1_000;
const DEFAULT_RECOVERY_MS = 10_000;

// The library tree skips dot directories (including .domi) and Office lock
// files. The watcher must apply the same rule, otherwise internal writes
// (research store, mirror ledgers) would trigger notify -> force refresh
// loops that dwarf the value of an external drop notification.
function isIgnoredWatchPath(fileName) {
  // 有些平台在目录重命名等场景只报空文件名；宁可多刷新也不能漏报。
  if (typeof fileName !== "string" || !fileName) return false;
  return fileName.split(/[\\/]+/).some(segment => !segment
    || segment.startsWith(".")
    || segment.startsWith("~$"));
}

// Watches the configured document library root so files dropped, renamed or
// deleted outside domi still reach the UI. fs.watch events are debounced into
// a single onChanged notification; a slow recovery timer re-establishes the
// watcher when the root disappears (external rename) or the handle errors.
class DocumentLibraryWatcher {
  constructor(options = {}) {
    this.onChanged = typeof options.onChanged === "function" ? options.onChanged : null;
    this.debounceMs = options.debounceMs === undefined ? DEFAULT_DEBOUNCE_MS : options.debounceMs;
    this.recoveryMs = options.recoveryMs === undefined ? DEFAULT_RECOVERY_MS : options.recoveryMs;
    this.rootPath = "";
    this.watcher = null;
    this.debounceTimer = null;
    this.recoveryTimer = null;
    this.closed = false;
  }

  // Idempotent: repeated calls with the same resolved root are no-ops, so the
  // caller can adopt the watched root on every library list without churn.
  watch(location) {
    if (this.closed || !location?.rootPath) return;
    const rootPath = path.resolve(location.rootPath);
    if (this.rootPath === rootPath) return;
    this.stop();
    this.rootPath = rootPath;
    // The root may not exist yet (first run before the worker creates the
    // workspace structure). The recovery timer then establishes the watcher.
    this.startWatcher();
    this.startRecovery();
  }

  startWatcher() {
    if (this.closed || !this.rootPath || this.watcher) return;
    if (!fs.existsSync(this.rootPath)) return;
    try {
      this.watcher = fs.watch(this.rootPath, { recursive: true }, (_event, fileName) => {
        if (isIgnoredWatchPath(fileName)) return;
        this.scheduleNotify("file-change");
      });
      this.watcher.on("error", () => {
        // EPERM/EBUSY while the root or an ancestor is being renamed. The
        // recovery timer rebuilds the handle once the directory settles.
        this.detachWatcher();
      });
    } catch {
      // Recursive watching is unavailable; the recovery timer keeps retrying
      // so a platform restart or a later Node upgrade still heals this.
      this.watcher = null;
    }
  }

  detachWatcher() {
    if (!this.watcher) return;
    try { this.watcher.close(); } catch { /* best effort */ }
    this.watcher = null;
  }

  scheduleNotify(reason) {
    if (this.closed || !this.onChanged) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.closed || !this.rootPath || !this.onChanged) return;
      this.onChanged({ rootPath: this.rootPath, reason });
    }, this.debounceMs);
    this.debounceTimer.unref?.();
  }

  startRecovery() {
    if (this.closed || this.recoveryTimer) return;
    this.recoveryTimer = setInterval(() => {
      if (this.closed) return;
      this.startWatcher();
    }, this.recoveryMs);
    this.recoveryTimer.unref?.();
  }

  stop() {
    this.detachWatcher();
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); this.debounceTimer = null; }
    if (this.recoveryTimer) { clearInterval(this.recoveryTimer); this.recoveryTimer = null; }
    this.rootPath = "";
  }

  close() {
    this.closed = true;
    this.stop();
  }
}

module.exports = { DocumentLibraryWatcher, isIgnoredWatchPath };
