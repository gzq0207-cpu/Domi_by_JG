import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const { normalizeLocalDocumentResource } = createRequire(import.meta.url)("../electron/document-resource.cjs");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "domi-document-links-"));
const fixtureId = "/__domi_document_link_fixture__.tsx";
const resolvedFixtureId = path.join(root, fixtureId.slice(1)).replace(/\\/g, "/");
const documentPath = process.env.DOMI_LINK_TEST_DOCUMENT || "C:\\资料库\\行业认知\\2026\\报告.md";
const link = process.env.DOMI_LINK_TEST_HREF || "原始材料/算力基石.pdf#page=2";
const fixtureSource = `
import React from "react";
import { createRoot } from "react-dom/client";
import RichMarkdownEditor from "/src/RichMarkdownEditor.tsx";
import "/src/styles.css";
createRoot(document.getElementById("root")).render(
  <div style={{ height: 600 }}><RichMarkdownEditor
    documentPath={${JSON.stringify(documentPath)}}
    markdown={${JSON.stringify(`[原始PDF](${link})`)}}
    onChange={() => {}}
    onOpenDocument={(resource) => window.__domiOpenedResource = resource}
  /></div>
);
`;
let server;
let browser;
try {
  server = await createServer({
    configFile: false, root, cacheDir: cacheDirectory, logLevel: "error", appType: "custom",
    esbuild: { jsx: "automatic", jsxImportSource: "react" },
    optimizeDeps: { noDiscovery: true, include: [
      "react", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime", "lucide-react", "@tiptap/core", "@tiptap/react",
      "@tiptap/starter-kit", "@tiptap/markdown", "@tiptap/extension-table", "@tiptap/extension-image",
      "@tiptap/extension-task-item", "@tiptap/extension-task-list"
    ] },
    server: { host: "127.0.0.1", port: 0, hmr: false },
    plugins: [{
      name: "document-link-fixture",
      resolveId(id) { if (id === fixtureId) return resolvedFixtureId; },
      load(id) { if (id === resolvedFixtureId) return fixtureSource; },
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          if (request.url !== "/") return next();
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(`<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module" src="${fixtureId}"></script></body></html>`);
        });
      }
    }]
  });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(origin, { waitUntil: "networkidle" });
  try {
    await page.getByRole("link", { name: "原始PDF", exact: true }).click();
  } catch (error) {
    process.stderr.write(JSON.stringify({ errors, body: (await page.locator("body").innerText()).slice(0, 1000) }) + "\n");
    throw error;
  }
  await page.waitForFunction(() => !!window.__domiOpenedResource);
  const resource = await page.evaluate(() => window.__domiOpenedResource);
  const document = normalizeLocalDocumentResource(resource);
  assert.ok(document);
  assert.equal(document.extension, ".pdf");
  assert.equal(new URL(resource).hash, new URL(link, "file:///C:/base/").hash);
  const expectedPath = path.normalize(path.resolve(path.dirname(documentPath), link.split("#")[0]));
  if (process.platform === "win32") assert.equal(document.path, expectedPath);
  if (process.env.DOMI_LINK_TEST_DOCUMENT) {
    const file = await fs.open(document.path, "r");
    try {
      const signature = Buffer.alloc(5);
      await file.read(signature, 0, 5, 0);
      assert.equal(signature.toString("ascii"), "%PDF-");
    } finally { await file.close(); }
  }
  assert.deepEqual(errors, []);
  process.stdout.write(JSON.stringify({ ok: true, actualPdfRead: !!process.env.DOMI_LINK_TEST_DOCUMENT, checks: ["actual editor link click", "host file URL conversion", "source directory preserved", "PDF page anchor preserved", "no renderer errors"] }) + "\n");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  assert.ok(cacheDirectory.startsWith(path.join(os.tmpdir(), "domi-document-links-")));
  await fs.rm(cacheDirectory, { recursive: true, force: true });
}
