const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

// Query snapshot for the cloud query worker (关机可查): domi builds a
// display-ready JSON snapshot of the local library — industry news summary
// cards, projects, people and subscription digests, each joined with its
// Feishu mirror URL — and pushes it to services/feishu-query-worker after
// every mirror sync (and on a sha-skip interval timer). The worker answers
// 收件箱 group queries from this snapshot while the PC is off. The snapshot
// deliberately carries summary cards only: full originals already live in the
// Feishu mirror and are reachable via the embedded links.

const MAX_NEWS = 300;
const MAX_PROJECTS = 150;
const MAX_PEOPLE = 250;
const MAX_DIGESTS = 30;

function excerpt(value, maxLength = 200) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function isoTimestamp(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  return new Date(timestamp).toISOString();
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function digestDocuments(libraryRoot, mirror) {
  try {
    const directory = path.join(libraryRoot, "13.认知库", "订阅日报");
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory)
      .filter((name) => name.toLowerCase().endsWith(".md"))
      .map((name) => {
        const filePath = path.join(directory, name);
        const stat = fs.statSync(filePath);
        return {
          name: name.replace(/\.md$/i, ""),
          url: mirror.mirroredUrlFor(filePath),
          mtimeMs: Number(stat.mtimeMs) || 0
        };
      })
      .sort((left, right) => right.mtimeMs - left.mtimeMs)
      .slice(0, MAX_DIGESTS);
  } catch {
    return [];
  }
}

function buildQuerySnapshot({ databasePath, libraryRoot, mirror }) {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const news = db.prepare(
      "SELECT title, domains_json, published_at, summary, url, companies, content_path, document_path "
      + "FROM news_events ORDER BY published_at DESC LIMIT ?"
    ).all(MAX_NEWS).map((row) => ({
      title: String(row.title || ""),
      domains: parseJsonArray(row.domains_json),
      publishedAt: isoTimestamp(row.published_at),
      summary: String(row.summary || ""),
      companies: String(row.companies || ""),
      url: String(row.url || ""),
      mirrorUrl: mirror.mirroredUrlFor(String(row.content_path || row.document_path || ""))
    }));
    const projects = db.prepare(
      "SELECT name, domain, status, rating, notes, document_path FROM projects LIMIT ?"
    ).all(MAX_PROJECTS).map((row) => ({
      name: String(row.name || ""),
      domain: String(row.domain || ""),
      status: String(row.status || ""),
      rating: String(row.rating || ""),
      notes: excerpt(row.notes),
      mirrorUrl: mirror.mirroredUrlFor(String(row.document_path || ""))
    }));
    const people = db.prepare(
      "SELECT name, organization, status, rating, document_path FROM people LIMIT ?"
    ).all(MAX_PEOPLE).map((row) => ({
      name: String(row.name || ""),
      organization: String(row.organization || ""),
      status: String(row.status || ""),
      rating: String(row.rating || ""),
      mirrorUrl: mirror.mirroredUrlFor(String(row.document_path || ""))
    }));
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      news,
      projects,
      people,
      digests: digestDocuments(libraryRoot, mirror)
    };
  } finally {
    db.close();
  }
}

function snapshotSha256(snapshot) {
  return crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

module.exports = {
  buildQuerySnapshot,
  snapshotSha256
};
