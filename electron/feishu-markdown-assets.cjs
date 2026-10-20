const path = require("node:path");

function responseData(response) {
  const first = response?.data ?? response ?? {};
  return first?.data ?? first;
}

function nestedObjects(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) return value.flatMap((item) => nestedObjects(item, seen));
  return [value, ...Object.values(value).flatMap((item) => nestedObjects(item, seen))];
}

function insertedBlockId(response) {
  for (const value of nestedObjects(responseData(response))) {
    const blockId = String(value?.block_id || value?.blockId || "").trim();
    if (blockId) return blockId;
  }
  return "";
}

function markerBlockId(response, marker) {
  const data = responseData(response);
  const document = data?.document || data?.doc || data;
  const content = String(document?.content || "");
  // 关键词定位的返回会在容器标签属性里回显关键词本身（<fragment
  // mode="keyword" keyword="标记">），属性位置不是正文位置：先剥掉
  // fragment 容器开标签再定位标记，否则标记永远落在第一个块标签之前，
  // 找不到前置块 ID。excerpt 容器（top-block-id）不受影响。
  const text = content.replace(/<fragment\b[^>]*>/gi, "");
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return "";
  const excerptStart = text.lastIndexOf("<excerpt", markerIndex);
  if (excerptStart >= 0) {
    const opening = text.slice(excerptStart, text.indexOf(">", excerptStart) + 1);
    const topBlockId = opening.match(/\btop-block-id="([^"]+)"/)?.[1];
    if (topBlockId) return topBlockId;
  }
  const beforeMarker = text.slice(0, markerIndex);
  const candidates = [...beforeMarker.matchAll(/<(?:p|blockquote|li|h[1-9])\b[^>]*\bid="([^"]+)"[^>]*>/gi)];
  return candidates.at(-1)?.[1] || "";
}

async function placeFeishuAssetAtMarker({ runLark, documentId, asset, attempts = 4, delayMs = 2500 }) {
  // 飞书 markdown 导入是异步的：overwrite 后立即按关键词定位新写入的标记
  // 常拿到未完成状态（索引滞后），必须带退避重试，否则整篇镜像失败。
  let anchorBlockId = "";
  let located = null;
  for (let attempt = 0; attempt < attempts && !anchorBlockId; attempt += 1) {
    located = await runLark([
      "docs", "+fetch", "--doc", documentId,
      "--scope", "keyword", "--keyword", asset.marker,
      "--detail", "with-ids", "--format", "json"
    ], { timeout: 120000 });
    anchorBlockId = markerBlockId(located, asset.marker);
    if (!anchorBlockId && attempt + 1 < attempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  if (!anchorBlockId) throw new Error(`飞书回读未找到图片“${asset.caption}”的原位锚点。`);

  const inserted = await runLark([
    "docs", "+media-insert", "--doc", documentId,
    "--file", `./${path.basename(asset.path)}`, "--type", "image",
    "--caption", asset.caption, "--align", "center", "--format", "json"
  ], { timeout: 180000, cwd: path.dirname(asset.path) });
  const imageBlockId = insertedBlockId(inserted);
  if (!imageBlockId) throw new Error(`飞书上传图片“${asset.caption}”后没有返回图片 block ID。`);

  await runLark([
    "docs", "+update", "--doc", documentId,
    "--command", "block_move_after", "--block-id", anchorBlockId,
    "--src-block-ids", imageBlockId, "--format", "json"
  ], { timeout: 120000 });
  await runLark([
    "docs", "+update", "--doc", documentId,
    "--command", "block_delete", "--block-id", anchorBlockId,
    "--format", "json"
  ], { timeout: 120000 });
  return { anchorBlockId, imageBlockId };
}

module.exports = {
  insertedBlockId,
  markerBlockId,
  placeFeishuAssetAtMarker
};
