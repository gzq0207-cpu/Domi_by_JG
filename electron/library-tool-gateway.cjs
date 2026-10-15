const http = require("node:http");
const crypto = require("node:crypto");

// A per-process loopback gateway gives existing Codex conversations the same
// read-only tools as new dynamic-tool threads, without changing global config
// or replacing their conversation history. Tokens expire with their run.
class LibraryToolGateway {
  constructor() { this.sessions = new Map(); this.server = null; this.starting = null; }

  async start() {
    if (this.starting) return this.starting;
    this.server = http.createServer(async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.setHeader("Cache-Control", "no-store");
      const session = this.sessions.get(String(request.url || "").slice(1));
      if (request.method !== "POST" || request.headers.origin || !session) {
        response.writeHead(403); response.end(JSON.stringify({ ok: false, error: "资料读取会话不可用。" })); return;
      }
      try {
        const parts = [];
        let bytes = 0;
        for await (const part of request) {
          bytes += part.length;
          if (bytes > 64_000) throw new Error("资料工具请求过大。");
          parts.push(part);
        }
        const input = JSON.parse(Buffer.concat(parts).toString("utf8"));
        const result = await session.call(input.tool, input.arguments || {});
        response.end(JSON.stringify(result));
      } catch (error) {
        response.writeHead(400); response.end(JSON.stringify({ ok: false, error: error.message || String(error) }));
      }
    });
    this.server.requestTimeout = 30_000;
    this.starting = new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(0, "127.0.0.1", () => { this.server.unref(); resolve(); });
    });
    return this.starting;
  }

  async add(session) {
    await this.start();
    const token = crypto.randomBytes(24).toString("hex");
    this.sessions.set(token, session);
    return { endpoint: `http://127.0.0.1:${this.server.address().port}/${token}`, revoke: () => { this.sessions.delete(token); session.close(); } };
  }

  async close() {
    for (const session of this.sessions.values()) session.close();
    this.sessions.clear();
    if (this.server) await new Promise((resolve) => this.server.close(resolve));
    this.server = null;
    this.starting = null;
  }
}

module.exports = { LibraryToolGateway };
