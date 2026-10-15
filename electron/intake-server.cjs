const http = require("node:http");
const crypto = require("node:crypto");

// Local intake endpoint for forwarding articles into the domi workbench from
// outside the app: browser bookmarklets, phone shortcuts and future bridges
// all POST {url, title, text, source} here. The main process forwards each
// accepted item to the renderer, which opens a fresh task for it.
//
// Security model:
// - Default binding is loopback only (127.0.0.1), so nothing off-machine can
//   reach the endpoint. No token is required in that mode because every
//   caller is already a process on this machine.
// - LAN mode (bind 0.0.0.0) is opt-in and REQUIRES a token; requests must
//   carry a matching X-Domi-Token header, compared in constant time.
// - Every response carries permissive CORS headers: bookmarklets run inside
//   arbitrary https pages, so the browser needs the preflight to pass.

const DEFAULT_PORT = 48119;
const MAX_BODY_BYTES = 512 * 1024;
const MAX_URL_LENGTH = 2048;
const MAX_TITLE_LENGTH = 500;
const MAX_TEXT_LENGTH = 200_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ITEMS = 30;

function constantTimeEquals(actual, expected) {
  const left = Buffer.from(String(actual || ""));
  const right = Buffer.from(String(expected || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function safeTrim(value, maxLength) {
  const text = String(value == null ? "" : value).trim();
  return text.slice(0, maxLength);
}

function normalizeIntakePayload(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "请求体必须是 JSON 对象" };
  }
  const url = safeTrim(raw.url, MAX_URL_LENGTH);
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { error: "url 字段缺失或不是合法链接" };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { error: "url 只支持 http/https 链接" };
  }
  return {
    item: {
      url,
      title: safeTrim(raw.title, MAX_TITLE_LENGTH),
      text: safeTrim(raw.text, MAX_TEXT_LENGTH),
      source: safeTrim(raw.source, 60),
      receivedAt: new Date().toISOString()
    }
  };
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Domi-Token",
    "Access-Control-Max-Age": "86400",
    ...extra
  };
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, corsHeaders({
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  }));
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    request.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error("payload_too_large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function startIntakeServer(options = {}) {
  const {
    port = Number(process.env.DOMI_INTAKE_PORT) || DEFAULT_PORT,
    bind = "127.0.0.1",
    token = "",
    onItem = () => {},
    rateLimitMaxItems = RATE_LIMIT_MAX_ITEMS,
    rateLimitWindowMs = RATE_LIMIT_WINDOW_MS
  } = options;

  const requiresToken = String(bind) !== "127.0.0.1";
  if (requiresToken && !token) {
    return Promise.reject(new Error("LAN 模式必须配置 DOMI_INTAKE_TOKEN"));
  }

  const recentTimestamps = [];

  function withinRateLimit(now = Date.now()) {
    while (recentTimestamps.length && now - recentTimestamps[0] > rateLimitWindowMs) {
      recentTimestamps.shift();
    }
    if (recentTimestamps.length >= rateLimitMaxItems) return false;
    recentTimestamps.push(now);
    return true;
  }

  const server = http.createServer(async (request, response) => {
    try {
      if (request.method === "OPTIONS") {
        response.writeHead(204, corsHeaders());
        response.end();
        return;
      }
      if (request.method === "GET" && request.url.split("?")[0] === "/status") {
        sendJson(response, 200, { ok: true, service: "domi-intake", version: 1 });
        return;
      }
      if (request.method === "POST" && request.url.split("?")[0] === "/intake") {
        if (requiresToken) {
          const provided = request.headers["x-domi-token"];
          if (!provided || !constantTimeEquals(provided, token)) {
            sendJson(response, 401, { ok: false, error: "缺少或错误的 X-Domi-Token" });
            return;
          }
        }
        let raw;
        try {
          raw = JSON.parse(await readBody(request) || "{}");
        } catch (error) {
          if (error && error.message === "payload_too_large") {
            sendJson(response, 413, { ok: false, error: "请求体超过 512KB 限制" });
            return;
          }
          sendJson(response, 400, { ok: false, error: "请求体不是合法 JSON" });
          return;
        }
        const normalized = normalizeIntakePayload(raw);
        if (normalized.error) {
          sendJson(response, 400, { ok: false, error: normalized.error });
          return;
        }
        if (!withinRateLimit()) {
          sendJson(response, 429, { ok: false, error: "转发过于频繁，请稍后再试" });
          return;
        }
        let accepted = true;
        try {
          const result = onItem(normalized.item);
          if (result && typeof result.then === "function") await result;
        } catch {
          accepted = false;
        }
        sendJson(response, accepted ? 200 : 500, accepted
          ? { ok: true }
          : { ok: false, error: "domi 未能接收本次转发" });
        return;
      }
      sendJson(response, 404, { ok: false, error: "未知路径" });
    } catch (error) {
      sendJson(response, 500, { ok: false, error: "intake 服务内部错误" });
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, bind, () => {
      resolve({
        port: server.address().port,
        bind,
        requiresToken,
        close: () => new Promise((resolveClose) => server.close(() => resolveClose()))
      });
    });
  });
}

module.exports = { startIntakeServer, normalizeIntakePayload, DEFAULT_PORT };
