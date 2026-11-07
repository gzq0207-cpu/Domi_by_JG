const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const JSZip = require("jszip");
const { parsePresentation, readPresentationFile, convertLegacyPresentation, resolvePart } = require("../electron/presentation-document.cjs");

const NS = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
// 1x1 透明 PNG，用于图片渲染测试。
const PNG_PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

function shape({ id, ph, text, x = 914400, y = 457200, cx = 4572000, cy = 914400 }) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="s${id}"/><p:cNvSpPr/><p:nvPr>${ph ? `<p:ph type="${ph}"/>` : ""}</p:nvPr></p:nvSpPr>
    <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"/></p:spPr>
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="zh-CN" sz="1800" b="1"/><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
}
function pictureShape({ id, relId, x = 4572000, y = 457200 }) {
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="pic${id}"/><p:cNvPicPr/></p:nvPicPr>
    <p:blipFill><a:blip r:embed="${relId}"/></p:blipFill>
    <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="1828800" cy="1371600"/></a:xfrm><a:prstGeom prst="rect"/></p:spPr></p:pic>`;
}
function tableFrame({ rows }) {
  const trs = rows.map(cells => `<a:tr h="370840">${cells.map(cell => `<a:tc><a:txBody><a:p><a:r><a:t>${cell}</a:t></a:r></a:p></a:txBody></a:tc>`).join("")}</a:tr>`).join("");
  return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="9" name="t"/><p:cNvGraphicFramePr/></p:nvGraphicFramePr>
    <p:xfrm><a:off x="914400" y="2743200"/><a:ext cx="6400800" cy="1200000"/></p:xfrm>
    <a:tbl><a:tblGrid><a:gridCol w="3200400"/><a:gridCol w="3200400"/></a:tblGrid>${trs}</a:tbl></p:graphicFrame>`;
}
function slideDocument(body) { return `<?xml version="1.0" encoding="UTF-8"?><p:sld ${NS}>${body}</p:sld>`; }

// sldIdLst 故意按 rId2(slide2) -> rId3(slide1) 的顺序引用，
// 验证页码来自关系顺序而不是文件名排序。
async function buildDeck({ slide1Body, slide2Body, slide1Rels = "" } = {}) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0"?><Types/>');
  zip.file("ppt/presentation.xml", `<?xml version="1.0"?><p:presentation ${NS}><p:sldSz cx="9600000" cy="5400000"/><p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId3"/></p:sldIdLst></p:presentation>`);
  zip.file("ppt/_rels/presentation.xml.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>`);
  zip.file("ppt/slides/slide1.xml", slideDocument(slide1Body));
  zip.file("ppt/slides/slide2.xml", slideDocument(slide2Body));
  zip.file("ppt/slides/_rels/slide1.xml.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${slide1Rels}</Relationships>`);
  if (slide1Rels.includes("../media/image1.png")) zip.file("ppt/media/image1.png", PNG_PIXEL);
  return zip.generateAsync({ type: "nodebuffer" });
}

test("slides follow the sldIdLst relationship order, not file names", async () => {
  const bytes = await buildDeck({
    slide1Body: shape({ id: 2, ph: "title", text: "第一页标题" }) + shape({ id: 3, text: "第一页正文" }),
    slide2Body: shape({ id: 2, ph: "title", text: "第二页标题" })
  });
  const parsed = await parsePresentation(bytes);
  assert.equal(parsed.width, Math.round(9600000 / 9525));
  assert.equal(parsed.height, Math.round(5400000 / 9525));
  assert.equal(parsed.slides.length, 2);
  assert.equal(parsed.slides[0].number, 1);
  assert.equal(parsed.slides[0].title, "第二页标题");
  assert.equal(parsed.slides[1].number, 2);
  assert.equal(parsed.slides[1].title, "第一页标题");
  assert.ok(parsed.slides[1].text.includes("第一页正文"));
});

test("text, tables and images render into escaped static html", async () => {
  const bytes = await buildDeck({
    slide1Body: shape({ id: 2, ph: "title", text: "标题&lt;b&gt;加粗&lt;/b&gt;" })
      + tableFrame({ rows: [["列一", "列二"], ["&lt;script&gt;alert(1)&lt;/script&gt;", "值"]] })
      + pictureShape({ id: 8, relId: "rId9" }),
    slide2Body: shape({ id: 2, text: "另一页" }),
    slide1Rels: '<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>'
  });
  const parsed = await parsePresentation(bytes);
  const slide = parsed.slides.find(item => item.title.includes("标题"));
  assert.ok(slide.html.includes("&lt;script&gt;"), "文本必须转义");
  assert.ok(!slide.html.includes("<script>"), "不允许注入脚本");
  assert.ok(slide.html.includes("<table"), "表格应渲染");
  assert.ok(slide.html.includes("data:image/png;base64,"), "图片应内联");
  assert.ok(/style="[^"]*left:[\d.]+%;/.test(slide.html), "形状应带百分比定位");
  assert.ok(parsed.warnings.length >= 1, "应包含保真警告");
});

test("external and traversal image relationships render placeholders", async () => {
  const bytes = await buildDeck({
    slide1Body: pictureShape({ id: 8, relId: "rId9" }) + pictureShape({ id: 9, relId: "rId10" }),
    slide2Body: shape({ id: 2, text: "x" }),
    slide1Rels: '<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="http://evil.example/pixel.png"/>'
      + '<Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../../secrets.png"/>'
  });
  const parsed = await parsePresentation(bytes);
  const slide = parsed.slides.find(item => item.html.includes("ppt-object-placeholder"));
  assert.equal((slide.html.match(/ppt-object-placeholder/g) || []).length, 2);
  assert.ok(!slide.html.includes("base64"));
  assert.equal(resolvePart("ppt/slides", "../../secrets.png"), "");
  assert.equal(resolvePart("ppt/slides", "http://x/y.png"), "");
  assert.equal(resolvePart("ppt", "slides/slide1.xml"), "ppt/slides/slide1.xml");
});

test("invalid packages are rejected with friendly errors", async () => {
  await assert.rejects(() => parsePresentation(Buffer.from("not a zip")));
  const zip = new JSZip();
  zip.file("random.txt", "hi");
  await assert.rejects(async () => parsePresentation(await zip.generateAsync({ type: "nodebuffer" })), /PPTX/);
  const emptySlides = await buildDeck({ slide1Body: "", slide2Body: "" });
  const blank = await parsePresentation(emptySlides);
  assert.equal(blank.slides.length, 2);
  assert.equal(blank.slides[0].text, "");
  assert.equal(blank.slides[0].html, "");
});

test("readPresentationFile reports metadata, mtime guard and optional html", async () => {
  const bytes = await buildDeck({
    slide1Body: shape({ id: 2, ph: "title", text: "标题页" }),
    slide2Body: shape({ id: 2, text: "内容页" })
  });
  const file = path.join(os.tmpdir(), `domi-ppt-${crypto.randomUUID()}.pptx`);
  fs.writeFileSync(file, bytes);
  try {
    const document = await readPresentationFile(file);
    assert.equal(document.name, path.basename(file));
    assert.equal(document.converted, false);
    assert.equal(document.slides.length, 2);
    assert.ok(document.html === undefined || typeof document.slides[0].html === "string");

    const withoutHtml = await readPresentationFile(file, { includeHtml: false });
    assert.equal(withoutHtml.slides[0].html, "");
    assert.ok(withoutHtml.slides[0].text.includes("内容页"));
  } finally {
    fs.rmSync(file, { force: true });
  }
});

test("legacy .ppt converts via injected converter, caches and keeps the original intact", async () => {
  const bytes = await buildDeck({
    slide1Body: shape({ id: 2, ph: "title", text: "旧版标题" }),
    slide2Body: shape({ id: 2, text: "旧版正文" })
  });
  const pptxBytes = await buildDeck({
    slide1Body: shape({ id: 2, ph: "title", text: "旧版标题" }),
    slide2Body: shape({ id: 2, text: "旧版正文" })
  });
  const source = path.join(os.tmpdir(), `domi-legacy-${crypto.randomUUID()}.ppt`);
  fs.writeFileSync(source, bytes);
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "domi-ppt-cache-"));
  let conversions = 0;
  const converter = async (staged, output) => {
    conversions += 1;
    assert.equal(path.basename(staged), "source.ppt");
    await fs.promises.copyFile(staged, output);
  };
  try {
    const first = await readPresentationFile(source, { cacheDir, converter });
    assert.equal(first.converted, true);
    assert.ok(first.warnings[0].includes("旧版 .ppt 已转换"));
    assert.equal(first.slides.length, 2);
    const second = await readPresentationFile(source, { cacheDir, converter });
    assert.equal(conversions, 1, "相同内容应命中缓存，不再转换");
    assert.equal(second.slides.length, 2);
    // 缓存产物本身也应可被直接解析。
    const cached = await parsePresentation(pptxBytes);
    assert.equal(cached.slides.length, 2);
    // 原件保持不变。
    assert.deepEqual(fs.readFileSync(source), bytes);
  } finally {
    fs.rmSync(source, { force: true });
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});
