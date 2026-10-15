import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_RADAR_DEFAULT_DOMAINS,
  RADAR_DOMAIN_ORDER,
  normalizeRadarDomains,
  radarDomainForStoredDomain,
  radarTaxonomyPrompt
} from "../src/radar-domains.ts";

test("legacy users retain the previous five followed domains", () => {
  assert.deepEqual(normalizeRadarDomains(undefined), LEGACY_RADAR_DEFAULT_DOMAINS);
  assert.deepEqual(RADAR_DOMAIN_ORDER.slice(-2), ["应用", "终端与具身"]);
});

test("followed domains are deduplicated, canonical and may be empty", () => {
  assert.deepEqual(
    normalizeRadarDomains(["前沿科技", "AI", "AI", "未知"], []),
    ["模型层"]
  );
  assert.deepEqual(normalizeRadarDomains([], []), []);
});

test("legacy stored domains are displayed under chain segments without rewriting storage", () => {
  assert.equal(radarDomainForStoredDomain("消费科技"), "其他行业");
  assert.equal(radarDomainForStoredDomain("半导体"), "算力芯片");
});

test("prompt contains only selected taxonomy and the compatibility boundary", () => {
  const prompt = radarTaxonomyPrompt(["AI", "前沿科技"]);
  assert.match(prompt, /模型层：闭源基础模型、开源与开放权重模型、多模态与生成模型、模型研究与训练方法/);
  assert.doesNotMatch(prompt, /算力芯片：/);
  assert.match(prompt, /历史词表（AI、半导体、智能出行等）只在读取时映射到新链段/);
});

test("prompt merges user custom subdomains into the selected domain lines", () => {
  const prompt = radarTaxonomyPrompt(
    ["算力芯片", "互联与网络", "终端与具身"],
    [
      { parentDomain: "算力芯片", name: "光子计算" },
      { parentDomain: "互联与网络", name: "OCS" },
      { parentDomain: "终端与具身", name: "AI眼镜供应链" },
      // 未关注链段的自定义子领域不得混入。
      { parentDomain: "能源与电力", name: "核电与SMR" }
    ]
  );
  assert.match(prompt, /算力芯片：AI加速器与GPU、CPU与通用处理器、存储芯片与HBM、先进封装与制造、芯片设计与IP、光子计算/);
  assert.match(prompt, /互联与网络：光模块与光器件、光芯片与硅光、CPO与光电合封、交换机与网络设备、网络芯片与DPU、铜连接与线缆、网络架构与组网、OCS/);
  assert.match(prompt, /终端与具身：AI终端与硬件、机器人与具身智能、自动驾驶、AI眼镜供应链/);
  assert.doesNotMatch(prompt, /能源与电力：/);
  // 不传自定义时退回纯 canonical，不出现多余顿号。
  const plain = radarTaxonomyPrompt(["算力芯片"]);
  assert.match(plain, /算力芯片：AI加速器与GPU、CPU与通用处理器、存储芯片与HBM、先进封装与制造、芯片设计与IP$/m);
});
