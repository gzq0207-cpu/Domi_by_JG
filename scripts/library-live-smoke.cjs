// Read-only corpus smoke test. The sole SQLite write target is a disposable
// search cache; authoritative records and article files are never changed.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const { openDocumentSearchIndex, configureRoot, upsertIndexedDocument, searchIndexedDocuments } = require("../electron/document-search-index.cjs");
const { DocumentReader } = require("../electron/document-reader.cjs");
const { buildDocumentContext } = require("../electron/document-context.cjs");

async function main(configPath) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const repository = new DatabaseSync(config.localDatabasePath, { readOnly: true });
  const rows = repository.prepare("SELECT title, COALESCE(NULLIF(content_path, ''), document_path) AS path FROM news_events WHERE article_type = 'article' ORDER BY published_at DESC LIMIT 20").all();
  repository.close();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "domi-library-live-"));
  const index = openDocumentSearchIndex(path.join(directory, "search.sqlite3"));
  const reader = new DocumentReader({ rootPath: config.localRepositoryDir });
  const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const originalHashes = new Map();
  const questions = [];
  try {
    configureRoot(index, config.localRepositoryDir);
    for (const row of rows) {
      if (!row.path || !fs.existsSync(row.path)) continue;
      originalHashes.set(row.path, hash(row.path));
      await upsertIndexedDocument(index, config.localRepositoryDir, row.path, fs.statSync(row.path), "sample");
    }
    for (const row of rows.filter((item) => originalHashes.has(item.path))) {
      const result = await buildDocumentContext({
        search: async (query, options) => ({ ok: true, ...searchIndexedDocuments(index, { query, ...options }) }),
        read: (request) => reader.read(request), requestText: `请基于我的 Domi 资料库分析 ${row.title}`,
        settings: { storageBackend: "local", semanticSearchEnabled: false }
      });
      questions.push({ matchedTarget: result.candidatePaths.includes(row.path), contextChars: result.context.length,
        originalRanges: result.sources.filter((source) => source.content).length,
        validBlocks: (result.context.match(/<domi-source-data>/g) || []).length === (result.context.match(/<\/domi-source-data>/g) || []).length });
    }
    const result = { samples: questions.length, targetHits: questions.filter((question) => question.matchedTarget).length,
      withOriginalText: questions.filter((question) => question.originalRanges > 0).length,
      maxContextChars: Math.max(0, ...questions.map((question) => question.contextChars)),
      allBlocksComplete: questions.every((question) => question.validBlocks),
      sourceFilesUnchanged: [...originalHashes].every(([file, value]) => hash(file) === value) };
    process.stdout.write(JSON.stringify(result) + "\n");
    if (!result.sourceFilesUnchanged || !result.allBlocksComplete || result.maxContextChars > 28000) process.exitCode = 1;
  } finally { index.close(); reader.cache.clear(); fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); }
}

main(process.argv[2]).catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
