import { execFileSync } from "node:child_process";
import process from "node:process";

const PROXY_KEYS = [
  ["http_proxy", "HTTP_PROXY"],
  ["https_proxy", "HTTPS_PROXY"],
  ["all_proxy", "ALL_PROXY"],
  ["no_proxy", "NO_PROXY"],
];

function proxyUrl(scheme, host, port) {
  const cleanHost = String(host || "").trim();
  const cleanPort = Number(port);
  if (!cleanHost || !Number.isInteger(cleanPort) || cleanPort <= 0 || cleanPort > 65_535) return "";
  const formattedHost = cleanHost.includes(":") && !cleanHost.startsWith("[")
    ? `[${cleanHost}]`
    : cleanHost;
  return `${scheme}://${formattedHost}:${cleanPort}`;
}

export function parseMacSystemProxy(output) {
  const values = new Map();
  const exceptions = [];
  let readingExceptions = false;

  for (const line of String(output || "").split(/\r?\n/)) {
    if (/^\s*ExceptionsList\s*:/.test(line)) {
      readingExceptions = true;
      continue;
    }
    if (readingExceptions) {
      const exception = line.match(/^\s*\d+\s*:\s*(.*?)\s*$/)?.[1];
      if (exception) {
        if (exception !== "<local>") exceptions.push(exception.replace(/^\*\./, "."));
        continue;
      }
      if (/^\s*}\s*$/.test(line)) readingExceptions = false;
    }
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*(.*?)\s*$/);
    if (match) values.set(match[1], match[2]);
  }

  const environment = {};
  if (values.get("HTTPEnable") === "1") {
    environment.http_proxy = proxyUrl("http", values.get("HTTPProxy"), values.get("HTTPPort"));
  }
  if (values.get("HTTPSEnable") === "1") {
    environment.https_proxy = proxyUrl("http", values.get("HTTPSProxy"), values.get("HTTPSPort"));
  }
  if (values.get("SOCKSEnable") === "1") {
    environment.all_proxy = proxyUrl("socks5h", values.get("SOCKSProxy"), values.get("SOCKSPort"));
  }
  if (exceptions.length) environment.no_proxy = [...new Set(exceptions)].join(",");
  return Object.fromEntries(Object.entries(environment).filter(([, value]) => value));
}

function readMacSystemProxy() {
  if (process.platform !== "darwin") return {};
  try {
    const output = execFileSync("/usr/sbin/scutil", ["--proxy"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2_000,
    });
    return parseMacSystemProxy(output);
  } catch {
    return {};
  }
}

export function parseWindowsSystemProxy(registryOutput) {
  // 解析 `reg query "HKCU\...\Internet Settings"` 的输出。
  const values = new Map();
  for (const line of String(registryOutput || "").split(/\r?\n/)) {
    const match = line.match(/^\s+(\S+)\s+REG_(?:DWORD|SZ)\s+(\S+)/);
    if (match) values.set(match[1].toLowerCase(), match[2]);
  }
  const environment = {};
  const proxyEnable = values.get("proxyenable");
  const proxyServer = values.get("proxyserver") || "";
  if (proxyEnable === "0x1" && proxyServer) {
    // proxyserver 可能是 "host:port"（全协议共用）或 "http=...;https=...;socks=..."。
    if (proxyServer.includes("=")) {
      const entries = new Map(
        proxyServer.split(";")
          .map((entry) => entry.split("=", 2))
          .filter(([key, value]) => key && value)
          .map(([key, value]) => [key.trim().toLowerCase(), value.trim()]),
      );
      const http = entries.get("http");
      const https = entries.get("https");
      const socks = entries.get("socks");
      if (http) environment.http_proxy = `http://${http}`;
      if (https) environment.https_proxy = `http://${https}`;
      if (socks) environment.all_proxy = `socks5h://${socks}`;
    } else {
      environment.http_proxy = `http://${proxyServer}`;
      environment.https_proxy = `http://${proxyServer}`;
    }
  }
  return Object.fromEntries(Object.entries(environment).filter(([, value]) => value));
}

function readWindowsSystemProxy() {
  if (process.platform !== "win32") return {};
  try {
    const output = execFileSync("reg", [
      "query",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
    ], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2_000,
    });
    return parseWindowsSystemProxy(output);
  } catch {
    return {};
  }
}

function readSystemProxy() {
  if (process.platform === "win32") return readWindowsSystemProxy();
  return readMacSystemProxy();
}

export function resolvedProxyEnvironment(environment = process.env, systemProxy = readSystemProxy()) {
  const resolved = {};
  for (const [lowercase, uppercase] of PROXY_KEYS) {
    const value = environment[lowercase] || environment[uppercase]
      || systemProxy[lowercase] || systemProxy[uppercase];
    if (!value) continue;
    resolved[lowercase] = String(value);
    resolved[uppercase] = String(value);
  }
  return resolved;
}
