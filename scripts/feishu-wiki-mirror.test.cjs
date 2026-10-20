const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  FeishuWikiMirror,
  MIRROR_SPACE_NAME,
  directoryChainOf,
  isMirrorTarget,
  isMirrorWatchTarget,
  mirrorTargetFiles,
  mirrorTargetFilesAsync,
  sha256File,
  sha256FileAsync,
  verifyMirrorText
} = require("../electron/feishu-wiki-mirror.cjs");

function makeLibrary() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "domi-wiki-mirror-"));
  const write = (relative, content = "# 内容\n\n正文。\n") => {
    const target = path.join(root, ...relative.split("/"));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
    return target;
  };
  return { root, write };
}

test("background mirror traversal and streaming hashes match their synchronous results", async () => {
  const { root, write } = makeLibrary();
  try {
    const file = write('07.模型层/_行业认知/动态/2026/10/正文.md', '# 正文\n' + '研究内容。'.repeat(100_000));
    write('13.认知库/订阅日报/日报.md');
    write('13.认知库/订阅日报/.sources/内部.md');
    write('03.算力芯片/普通笔记.md');
    assert.deepEqual(await mirrorTargetFilesAsync(root), mirrorTargetFiles(root));
    const pending = sha256FileAsync(file);
    let yielded = false;
    setImmediate(() => { yielded = true; });
    assert.equal(await pending, sha256File(file));
    assert.equal(yielded, true, 'hashing must yield to IPC/window events between reads');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("mirror watcher ignores ordinary notes and hidden backups", () => {
  assert.equal(isMirrorWatchTarget('03.算力芯片/普通笔记.md'), false);
  assert.equal(isMirrorWatchTarget('13.认知库/订阅日报/.sources/内部.md'), false);
  assert.equal(isMirrorWatchTarget('07.模型层/_行业认知/动态/2026/10/正文.md'), true);
  assert.equal(isMirrorWatchTarget('12.人脉\\某人\\人物主页.md'), true);
  assert.equal(isMirrorWatchTarget('07.模型层/公司/项目主页.md'), true);
});

test("mirrorTargetFiles selects news, digests and entity homepages only", () => {
  const { root, write } = makeLibrary();
  write("07.模型层/_行业认知/动态/2026/09/art_a.md");
  write("07.模型层/_行业认知/动态/2026/09/art_a-原文.md");
  write("13.认知库/订阅日报/AI-Builders-Digest-2026-09-22.md");
  write("13.认知库/知识库日报/2026-09-23.md");
  write("13.认知库/订阅日报/.sources/.backups/内部备份哈希值.md");
  write("03.算力芯片/Agent框架/AI科技/项目主页.md");
  write("03.算力芯片/Agent框架/AI科技/原始材料/尽调报告.md");
  write("03.算力芯片/Agent框架/AI科技/纪要/交流纪要.md");
  write("12.人脉/张三/人物主页.md");
  write("12.人脉/张三/交流/20260101-交流.md");
  write("0.待办事项.md");
  write("08.基础软件与工具链/_行业认知/主题研究/综述.md");

  const targets = mirrorTargetFiles(root).map((item) => item.relativePath);
  assert.ok(targets.includes("07.模型层/_行业认知/动态/2026/09/art_a.md"));
  assert.ok(targets.includes("07.模型层/_行业认知/动态/2026/09/art_a-原文.md"));
  assert.ok(targets.includes("13.认知库/订阅日报/AI-Builders-Digest-2026-09-22.md"));
  assert.ok(targets.includes("13.认知库/知识库日报/2026-09-23.md"));
  assert.ok(targets.includes("03.算力芯片/Agent框架/AI科技/项目主页.md"));
  assert.ok(targets.includes("12.人脉/张三/人物主页.md"));
  // 隐藏备份目录（.sources/.backups）不镜像到飞书。
  assert.ok(!targets.some((item) => item.includes(".sources")));
  assert.ok(!targets.some((item) => item.includes(".backups")));
  // 主题研究不属于动态镜像范围。
  assert.ok(!targets.includes("08.基础软件与工具链/_行业认知/主题研究/综述.md"));
  // 材料、纪要、待办都不镜像。
  assert.ok(!targets.some((item) => item.includes("原始材料")));
  assert.ok(!targets.some((item) => item.includes("纪要/交流纪要")));
  assert.ok(!targets.includes("0.待办事项.md"));
});

test("directoryChainOf splits the folder chain from a relative path", () => {
  assert.deepEqual(
    directoryChainOf("07.模型层/_行业认知/动态/2026/09/art_a.md"),
    ["07.模型层", "_行业认知", "动态", "2026", "09"]
  );
  assert.deepEqual(directoryChainOf("a.md"), []);
});

test("isMirrorTarget matches homepages regardless of nesting", () => {
  assert.equal(isMirrorTarget(["07.模型层", "_行业认知", "动态"], "项目主页.md"), true);
  assert.equal(isMirrorTarget(["12.人脉", "某人"], "人物主页.md"), true);
  assert.equal(isMirrorTarget(["12.人脉", "某人"], "背景研究.md"), false);
  // 隐藏目录（内部备份）即使在订阅日报目录下也不镜像。
  assert.equal(isMirrorTarget(["13.认知库", "订阅日报", ".sources", ".backups"], "备份.md"), false);
});

function fakeLarkMirror(root, statePath) {
  const calls = [];
  const docs = new Map();
  const docContent = new Map();
  let docCounter = 0;
  let nodeCounter = 0;
  const runLark = async (args, options = {}) => {
    calls.push(args);
    const command = args.join(" ");
    if (args[0] === "wiki" && args[1] === "+space-list") {
      return { data: { items: [] } };
    }
    if (args[0] === "wiki" && args[1] === "+space-create") {
      return { data: { space_id: "sp_test" } };
    }
    if (args[0] === "wiki" && args[1] === "+node-list") {
      return { data: { items: [] } };
    }
    if (args[0] === "wiki" && args[1] === "+node-create") {
      const titleIndex = args.indexOf("--title");
      const parentIndex = args.indexOf("--parent-node-token");
      const parentToken = parentIndex >= 0 ? args[parentIndex + 1] : "";
      const title = titleIndex >= 0 ? args[titleIndex + 1] : `node-${++nodeCounter}`;
      const token = `nt_${++nodeCounter}`;
      docs.set(token, { title, parentToken, children: [] });
      return { data: { node: { node_token: token, title } } };
    }
    const readContent = () => {
      const contentIndex = args.indexOf("--content");
      if (contentIndex < 0) return "";
      const file = String(args[contentIndex + 1]).replace(/^@/, "");
      try {
        return fs.readFileSync(path.join(options.cwd || process.cwd(), file), "utf8");
      } catch {
        return "";
      }
    };
    if (args[0] === "docs" && args[1] === "+create") {
      const titleIndex = args.indexOf("--title");
      const parentIndex = args.indexOf("--parent-token");
      const parentToken = parentIndex >= 0 ? args[parentIndex + 1] : "";
      const title = titleIndex >= 0 ? args[titleIndex + 1] : "doc";
      const docId = `dx_${++docCounter}`;
      const nodeToken = `nt_doc_${docCounter}`;
      docs.set(nodeToken, { title, parentToken, children: [] });
      docContent.set(docId, readContent());
      return {
        data: {
          document: {
            document_id: docId,
            node_token: nodeToken,
            url: `https://tenant.example.invalid/wiki/${nodeToken}`
          }
        }
      };
    }
    if (args[0] === "docs" && args[1] === "+update") {
      const docIndex = args.indexOf("--doc");
      const docId = args[docIndex + 1];
      docContent.set(docId, readContent());
      return { data: { document: { document_id: docId } } };
    }
    if (args[0] === "docs" && args[1] === "+fetch") {
      const docIndex = args.indexOf("--doc");
      const docId = args[docIndex + 1];
      return {
        data: {
          document: {
            document_id: docId,
            content: docContent.get(docId) || "# 空文档\n\n正文。"
          }
        }
      };
    }
    return { data: {} };
  };
  const mirror = new FeishuWikiMirror({
    statePath,
    libraryRoot: root,
    runLark,
    logger: () => {}
  });
  return { mirror, runLark, calls };
}

test("sync creates the space, mirrors documents and skips unchanged files on the second run", async () => {
  const { root, write } = makeLibrary();
  write("07.模型层/_行业认知/动态/2026/09/art_a.md");
  write("13.认知库/订阅日报/日报-2026-09-22.md");
  const statePath = path.join(root, ".state", "feishu-wiki-mirror.json");

  const { mirror } = fakeLarkMirror(root, statePath);
  const first = await mirror.sync();
  assert.equal(first.ok, true);
  assert.equal(first.created, 2);
  assert.equal(first.skipped, 0);
  assert.equal(first.spaceId, "sp_test");
  // Ledger persisted with document ids and urls.
  const ledger = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(Object.keys(ledger.documents).length, 2);
  assert.ok(ledger.documents["13.认知库/订阅日报/日报-2026-09-22.md"].url.startsWith("https://"));

  // Second run without changes: zero writes, all skipped.
  const { mirror: second } = fakeLarkMirror(root, statePath);
  const again = await second.sync();
  assert.equal(again.created, 0);
  assert.equal(again.updated, 0);
  assert.equal(again.skipped, 2);

  // Change one file: exactly one update.
  write("13.认知库/订阅日报/日报-2026-09-22.md", "# 日报\n\n更新后的内容，新增一段。\n");
  const { mirror: third } = fakeLarkMirror(root, statePath);
  const afterEdit = await third.sync();
  assert.equal(afterEdit.updated, 1);
  assert.equal(afterEdit.skipped, 1);
});

test("mirroredUrlFor maps an absolute document path to its cloud url", async () => {
  const { root, write } = makeLibrary();
  const file = write("07.模型层/_行业认知/动态/2026/09/art_b.md");
  const statePath = path.join(root, ".state", "feishu-wiki-mirror.json");
  const { mirror } = fakeLarkMirror(root, statePath);
  await mirror.sync();
  const fresh = new FeishuWikiMirror({
    statePath,
    libraryRoot: root,
    runLark: async () => ({}),
    logger: () => {}
  });
  fresh.loadLedgerOnly();
  assert.ok(fresh.mirroredUrlFor(file).startsWith("https://"));
  assert.equal(fresh.mirroredUrlFor(path.join(root, "不存在.md")), "");
});

test("sync tolerates remote images and rewrites relative links (lenient mirror mode)", async () => {
  const { root, write } = makeLibrary();
  write(
    "07.模型层/_行业认知/动态/2026/09/art_x-原文.md",
    "# 原文\n\n正文含远程图片：\n\n![公众号封面](https://mmbiz.qpic.cn/cover.jpg)\n"
  );
  write(
    "07.模型层/_行业认知/动态/2026/09/art_x.md",
    "# 摘要卡\n\n[阅读原文](art_x-原文.md)\n"
  );
  const statePath = path.join(root, ".state", "feishu-wiki-mirror.json");
  const { mirror } = fakeLarkMirror(root, statePath);
  const result = await mirror.sync();
  assert.equal(result.failed, 0);
  assert.equal(result.created, 2);
  const ledger = JSON.parse(fs.readFileSync(statePath, "utf8"));
  // 摘要卡里的相对链接在原文同步成功后被改写为镜像 URL。
  const synced = mirror.sync.bind(mirror);
  assert.ok(synced);
  const mirrorInstance = new FeishuWikiMirror({
    statePath,
    libraryRoot: root,
    runLark: async (args) => {
      if (args[0] === "docs" && args[1] === "+create") {
        return { data: { document: { document_id: `dx_${Date.now()}`, node_token: `nt_${Date.now()}`, url: "https://tenant.example.invalid/wiki/x" } } };
      }
      if (args[0] === "docs" && args[1] === "+fetch") {
        return { data: { document: { content: "# 内容\n\n正文。" } } };
      }
      return { data: {} };
    },
    logger: () => {}
  });
  mirrorInstance.loadLedgerOnly();
  // 相对链接改写：直接验证纯函数行为（命中账本 → 镜像 URL）。
  const rewritten = mirrorInstance.rewriteRelativeMarkdownLinks(
    "[阅读原文](art_x-原文.md)",
    "07.模型层/_行业认知/动态/2026/09"
  );
  assert.equal(rewritten, `[阅读原文](${ledger.documents["07.模型层/_行业认知/动态/2026/09/art_x-原文.md"].url})`);
  const fallback = mirrorInstance.rewriteRelativeMarkdownLinks(
    "[未知](不存在.md)",
    "07.模型层/_行业认知/动态/2026/09"
  );
  assert.equal(fallback, "未知（见本机资料库）");
  assert.ok(ledger.documents["07.模型层/_行业认知/动态/2026/09/art_x-原文.md"].url.startsWith("https://"));
});

test("a damaged mirror ledger stops sync without creating remote documents", async () => {
  const { root, write } = makeLibrary();
  write("07.模型层/_行业认知/动态/2026/09/art_a.md");
  const statePath = path.join(root, ".state", "feishu-wiki-mirror.json");
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, '{"version":1,"documents":');
  const { mirror, calls } = fakeLarkMirror(root, statePath);
  await assert.rejects(mirror.sync(), /镜像账本读取失败/);
  assert.equal(calls.length, 0);
  assert.equal(fs.readFileSync(statePath, "utf8"), '{"version":1,"documents":');
});

test("mirror skips oversized documents before reading their contents", async () => {
  const { root, write } = makeLibrary();
  const file = write("07.模型层/_行业认知/动态/2026/09/huge.md");
  fs.truncateSync(file, 8 * 1024 * 1024 + 1);
  const statePath = path.join(root, ".state", "feishu-wiki-mirror.json");
  const { mirror } = fakeLarkMirror(root, statePath);
  const result = await mirror.sync();
  assert.equal(result.failed, 1);
  assert.match(result.failures[0].error, /8 MB/);
});

test("sha256File is stable for identical content", () => {
  const { root, write } = makeLibrary();
  const file = write("x/a.md", "# 同\n");
  assert.equal(sha256File(file), sha256File(file));
  assert.equal(MIRROR_SPACE_NAME, "domi资料库镜像");
});

test("text completeness allows a title and formatting changes but detects missing or reordered text", () => {
  const prepared = { content: "<!-- domi:managed:start -->\n# 摘要\n\n**论据**：GPU &gt; 2，价格 $400。\n\n重复。重复。\n\n结尾。" };
  assert.equal(verifyMirrorText(prepared, "# 飞书标题\n# 摘要\n\n论据：GPU > 2，价格 \\$400。\n\n重复。重复。\n\n结尾。").ok, true);
  for (const actual of ["# 摘要", prepared.content.replace("重复。重复。", "重复。"),
    prepared.content.replace("价格 $400", "价格 $40"), prepared.content.replace("结尾。", ""),
    "结尾。\n" + prepared.content.replace("结尾。", "")]) {
    assert.equal(verifyMirrorText(prepared, actual).ok, false);
  }
});

test("text completeness tolerates Feishu merging adjacent link tokens but not real loss", () => {
  // 两个空格分隔的 t.co 链接：飞书导入后导出会丢失中间空格合并成一个单元。
  const prepared = { content: "感谢促成这件事！ https://t.co/5kDekuLbuS https://t.co/vgkesXELrf 之后见。" };
  const merged = "感谢促成这件事！ https://t.co/5kDekuLbuShttps://t.co/vgkesXELrf 之后见。";
  assert.equal(verifyMirrorText(prepared, merged).ok, true, "相邻链接合并必须通过");
  // 合并只容忍「恰好等于连续预期 token 的拼接」：丢内容、改内容仍然失败。
  assert.equal(verifyMirrorText(prepared, merged.replace("之后见", "之后")).ok, false, "内容缺失必须失败");
  assert.equal(verifyMirrorText(prepared, "感谢促成这件事！ https://t.co/5kDekuLbuS 之后见。").ok, false, "缺第二个链接必须失败");
  // token 前缀多了内容（不是精确拼接）不算合并。
  assert.equal(verifyMirrorText(prepared, "感谢促成这件事！ https://t.co/5kDekuLbuSXYZ 之后见。").ok, false);
});

test("lone ordered-list markers are escaped so Feishu keeps their literal numbers", () => {
  const { escapeLoneOrderedListStarts } = require("../electron/feishu-wiki-mirror.cjs");
  const source = [
    "前面是普通段落。",
    "",
    "> 2. 找一位世界级领域专家并与其合作",
    "",
    "1. 正常第一项",
    "2. 正常第二项",
    "",
    "3. 空行后的第三项",
    "",
    "5. 编号跳到第五项",
    "",
    "```",
    "2. 代码块里的编号不动",
    "```",
    "",
    "12. 多位编号也转义"
  ].join("\n");
  const escaped = escapeLoneOrderedListStarts(source);
  assert.ok(escaped.includes("> 2\\. 找一位世界级领域专家"), "引用块里的孤立项要转义");
  assert.ok(escaped.includes("1. 正常第一项"), "连续列表第一项不转义");
  assert.ok(escaped.includes("2. 正常第二项"), "连续列表第二项不转义");
  assert.ok(escaped.includes("3. 空行后的第三项"), "空行不中断列表，编号与位置一致时不转义");
  assert.ok(escaped.includes("5\\. 编号跳到第五项"), "编号与位置不一致要转义");
  assert.ok(escaped.includes("2. 代码块里的编号不动"), "代码块内不转义");
  assert.ok(escaped.includes("12\\. 多位编号"), "多位编号转义");
  // 转义后的内容与飞书回读的「未转义字面编号」token 等价（校验兼容）。
  assert.equal(verifyMirrorText({ content: escaped }, escaped.replace(/(\d+)\\\./g, "$1.")).ok, true);
});

test("remote images are downloaded into the hidden cache and rewritten to local paths", async () => {
  const { root } = makeLibrary();
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url, options = {}) => {
    requested.push(String(url));
    if (String(url).includes("/bad/")) throw new Error("network down");
    return { ok: true, arrayBuffer: async () => pngBytes.buffer.slice(pngBytes.byteOffset, pngBytes.byteOffset + pngBytes.byteLength) };
  };
  try {
    const mirror = new FeishuWikiMirror({ libraryRoot: root, runLark: async () => ({}) });
    const markdown = [
      "开头。",
      "",
      "[![原文图片](https://cdn.example.com/a/640?wx_fmt=jpeg)](https://mp.weixin.qq.com/s/xyz)",
      "",
      "![坏图](https://cdn.example.com/bad/x.png)",
      "",
      "结尾。"
    ].join("\n");
    const rewritten = await mirror.materializeRemoteImages(markdown);
    const cacheDir = path.join(root, ".domi-mirror-assets");
    const cached = fs.readdirSync(cacheDir);
    assert.equal(cached.length, 1, "只有可下载的图片落地");
    assert.ok(cached[0].endsWith(".png"), "按魔数判定扩展名");
    assert.ok(rewritten.includes(`![原文图片](${path.join(cacheDir, cached[0])})`), "可下载图片改写为本地路径");
    assert.ok(rewritten.includes("![坏图](https://cdn.example.com/bad/x.png)"), "下载失败保持远程语法");
    assert.ok(rewritten.includes("](https://mp.weixin.qq.com/s/xyz)"), "改写只动图片语法，外层链接保留");
    assert.deepEqual(requested.sort(), ["https://cdn.example.com/a/640?wx_fmt=jpeg", "https://cdn.example.com/bad/x.png"].sort());
    // 第二次调用直接复用缓存；只有下载失败的那张会重试（ eventual 成功）。
    requested.length = 0;
    const again = await mirror.materializeRemoteImages(markdown);
    assert.deepEqual(requested, ["https://cdn.example.com/bad/x.png"], "缓存命中不重复下载，失败的重试");
    assert.equal(again, rewritten);
    // 隐藏缓存目录不会被镜像目标扫描收录。
    const targets = mirrorTargetFiles(root).map((item) => item.relativePath);
    assert.ok(!targets.some((item) => item.includes(".domi-mirror-assets")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("asset anchor lookup retries until Feishu finishes importing the overwrite", async () => {
  const { placeFeishuAssetAtMarker } = require("../electron/feishu-markdown-assets.cjs");
  const marker = "domi飞书图片1-abc6ab896f";
  const asset = { marker, caption: "png", path: "C:/fake/a.png" };
  const calls = [];
  let keywordFetches = 0;
  const runLark = async (args) => {
    calls.push(args.join(" "));
    if (args[1] === "+fetch" && args.includes("--scope") && args.includes("keyword")) {
      keywordFetches += 1;
      // 前两次像真实情况一样拿不到未完成导入的标记，第三次才出现；
      // 容器标签会在 keyword 属性里回显标记本身（真实返回形态）。
      const content = keywordFetches >= 3
        ? `<fragment mode="keyword" keyword="${marker}"><p id="blk-1">${marker} · png</p></fragment>`
        : "<fragment mode=\"keyword\"></fragment>";
      return { data: { document: { content } } };
    }
    if (args[1] === "+media-insert") {
      return { data: { data: { block: { block_id: "img-1" } } } };
    }
    return { data: {} };
  };
  const result = await placeFeishuAssetAtMarker({ runLark, documentId: "doc1", asset, attempts: 4, delayMs: 1 });
  assert.equal(result.anchorBlockId, "blk-1");
  assert.equal(result.imageBlockId, "img-1");
  assert.equal(keywordFetches, 3, "未命中时带退避重试");
  // 上传后按锚点移动并删除锚点块。
  assert.ok(calls.some((line) => line.includes("block_move_after") && line.includes("blk-1")));
  assert.ok(calls.some((line) => line.includes("block_delete") && line.includes("blk-1")));
  // 重试耗尽仍然失败时如实抛错。
  await assert.rejects(placeFeishuAssetAtMarker({
    runLark: async () => ({ data: { document: { content: "<fragment mode=\"keyword\"></fragment>" } } }),
    documentId: "doc1", asset, attempts: 2, delayMs: 1
  }), /原位锚点/);
});

test("markerBlockId ignores the keyword echo inside the fragment opening tag", async () => {
  const { markerBlockId } = require("../electron/feishu-markdown-assets.cjs");
  const marker = "domi飞书图片1-abc6ab896f";
  // lark-cli 真实返回：容器 keyword 属性回显标记，正文在 <p> 里。
  const response = { data: { document: { content: `<fragment mode="keyword" keyword="${marker}"><p id="blk-9">${marker} · png</p></fragment>` } } };
  assert.equal(markerBlockId(response, marker), "blk-9");
  // excerpt 容器路径（top-block-id）仍然生效。
  const excerptResponse = { data: { document: { content: `<excerpt top-block-id="top-7"><p>${marker} · png</p></excerpt>` } } };
  assert.equal(markerBlockId(excerptResponse, marker), "top-7");
  // 标记不在正文时返回空。
  assert.equal(markerBlockId({ data: { document: { content: "<p>没有标记</p>" } } }, marker), "");
});

test("asynchronous import retries a nonempty partial body until the whole body appears", async () => {
  let fetches = 0;
  const mirror = new FeishuWikiMirror({ verificationDelayMs: 0, runLark: async () => {
    fetches += 1;
    return { data: { document: { content: fetches === 1 ? "# 标题" : "# 标题\n\n正文。\n\n末尾。" } } };
  } });
  const verification = await mirror.verifyFidelity("doc", { content: "# 标题\n\n正文。\n\n末尾。" });
  assert.equal(verification.ok, true);
  assert.equal(fetches, 2);
  assert.equal(verification.textCoverage, 1);
});

test("a partial import never receives a successful ledger entry", async () => {
  const { root, write } = makeLibrary();
  write("07.模型层/_行业认知/动态/2026/09/art_partial.md", "# 标题\n\n正文。\n\n末尾。");
  const statePath = path.join(root, ".state", "feishu-wiki-mirror.json");
  const { runLark } = fakeLarkMirror(root, statePath);
  const mirror = new FeishuWikiMirror({ libraryRoot: root, statePath, verificationDelayMs: 0,
    runLark: async (args, options) => args[1] === "+fetch"
      ? { data: { document: { content: "# 标题" } } } : runLark(args, options) });
  const result = await mirror.sync();
  assert.equal(result.ok, false);
  assert.equal(result.failed, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(statePath, "utf8")).documents, {});
});

test("an old low-coverage ledger is read back and revalidated instead of silently skipped", async () => {
  const { root, write } = makeLibrary();
  const relativePath = "07.模型层/_行业认知/动态/2026/09/art_legacy.md";
  write(relativePath);
  const statePath = path.join(root, ".state", "feishu-wiki-mirror.json");
  const { mirror, calls } = fakeLarkMirror(root, statePath);
  await mirror.sync();
  const ledger = JSON.parse(fs.readFileSync(statePath, "utf8"));
  delete ledger.documents[relativePath].verificationVersion;
  ledger.documents[relativePath].textCoverage = 0.0081;
  fs.writeFileSync(statePath, JSON.stringify(ledger));
  calls.length = 0;
  const result = await mirror.sync({ relativePaths: [relativePath] });
  assert.equal(result.verified, 1);
  assert.equal(result.skipped, 0);
  assert.equal(calls.filter((args) => args[1] === "+update").length, 0);
  const saved = JSON.parse(fs.readFileSync(statePath, "utf8")).documents[relativePath];
  assert.equal(saved.textCoverage, 1);
  assert.equal(saved.verificationVersion, 2);
});
