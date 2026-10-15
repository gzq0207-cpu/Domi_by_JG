// Only Node built-ins are required; older PATH Node versions can call the
// gateway while the desktop runtime owns SQLite and PDF extraction.
const fs = require("node:fs");
const http = require("node:http");

async function main(argv) {
  const endpoint = argv[argv.indexOf("--endpoint") + 1];
  if (!argv.includes("--endpoint") || !/^http:\/\/127\.0\.0\.1:\d+\/[a-f0-9]{48}$/.test(endpoint || "")) throw new Error("无效的本轮资料读取地址。");
  const operation = argv.find((value) => ["search", "read", "cite", "status"].includes(value));
  if (!operation) throw new Error("请选择 search、read、cite 或 status。");
  let args = {};
  if (argv.includes("--json-file")) {
    const filePath = argv[argv.indexOf("--json-file") + 1];
    const stat = fs.statSync(filePath);
    if (stat.size > 64_000) throw new Error("资料工具参数文件过大。");
    args = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } else if (operation !== "status") throw new Error("请使用 --json-file 提供参数。");
  const body = JSON.stringify({ tool: `domi_library_${operation}`, arguments: args });
  const result = await new Promise((resolve, reject) => {
    const request = http.request(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (part) => { data += part; });
      response.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("资料工具返回无效结果。")); } });
    });
    request.setTimeout(30_000, () => request.destroy(new Error("资料读取超时，请重试或缩小读取范围。")));
    request.on("error", reject);
    request.end(body);
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (require.main === module) main(process.argv.slice(2)).catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
module.exports = { main };
