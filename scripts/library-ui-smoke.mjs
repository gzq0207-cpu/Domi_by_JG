import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { chromium } from "playwright";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const bridge = ts.transpileModule(fs.readFileSync(path.join(root, "src/bridge.ts"), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText.replace(/\bexport /g, "");
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const page = await browser.newPage({ viewport: { width: 1360, height: 920 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.addInitScript({ content: `${bridge}
window.workbench = {
  ...browserFallback,
  loadState: async () => ({ ok: true, isNew: false, state: { version: 2, activeThreadId: "qa", threads: [{
    id: "qa", projectId: "project-qa", title: "资料库问答验收", project: "资料库", updatedAt: "今天", lastActiveAt: Date.now(), pinned: false,
    timeline: [], lastUsage: null, messages: [{ id: "question", role: "user", content: "请基于资料库分析商业化。" }, { id: "answer", role: "assistant", status: "done", content: "依据原文，商业化的关键是企业付费和推理成本。", libraryUsage: {
      candidateCount: 8, readCount: 2, fullCount: 1, readChars: 5000, remainingChars: 155000, searches: 2, remainingSearches: 10,
      warnings: ["报告中的图像需要核验原始页面。"], sources: [
        { sourceId: "S1", path: "/library/商业化.md", relativePath: "商业化.md", title: "商业化研究", date: "2026-10-13", totalChars: 3000, coveredChars: 3000, fullDocument: true, sections: ["全文"], pages: [], line: 1 },
        { sourceId: "S2", path: "/library/报告.pdf", relativePath: "报告.pdf", title: "报告.pdf", date: "", totalChars: 6000, coveredChars: 2000, fullDocument: false, sections: ["第二页"], pages: [2], line: 20 }
      ]
    } }]
  }] } }),
  readPdf: async () => ({ ok: true, document: { path: "/library/报告.pdf", name: "报告.pdf", previewUrl: "about:blank", size: 1000, mtimeMs: 1 } })
};` });
  await page.goto(process.argv[2] || "http://127.0.0.1:4182/", { waitUntil: "networkidle" });
  const usage = page.locator(".message-library-usage");
  await usage.waitFor();
  assert.match(await usage.innerText(), /8 篇候选，已提供 2 份原文/);
  await usage.locator("summary").click();
  assert.equal(await usage.locator("button").count(), 2);
  assert.match(await usage.innerText(), /全文/);
  assert.match(await usage.innerText(), /部分原文/);
  await usage.getByRole("button", { name: /报告.pdf/ }).click();
  await page.locator(".pdf-preview-frame").waitFor();
  assert.match(await page.locator(".pdf-preview-frame").getAttribute("src"), /page=2/);
  assert.deepEqual(errors, []);
  const screenshot = path.join(os.tmpdir(), "domi-library-ui-smoke.png");
  await page.screenshot({ path: screenshot });
  process.stdout.write(JSON.stringify({ ok: true, checks: ["source summary", "full/partial labels", "PDF page link", "no page errors"], screenshot }) + "\n");
} catch (error) {
  process.stderr.write(JSON.stringify({ pageErrors: errors, body: (await page.locator("body").innerText()).slice(0, 1800) }) + "\n");
  throw error;
} finally { await browser.close(); }
