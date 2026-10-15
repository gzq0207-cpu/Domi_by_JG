const assert = require("node:assert/strict");
const test = require("node:test");
const { startIntakeServer, normalizeIntakePayload } = require("../electron/intake-server.cjs");

async function withServer(options, run) {
  const server = await startIntakeServer({
    port: 0,
    onItem: () => {},
    ...options
  });
  try {
    return await run(server);
  } finally {
    await server.close();
  }
}

function post(port, path, body, headers = {}) {
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

test("accepts a valid article and forwards it to onItem", async () => {
  const received = [];
  const result = await withServer({ onItem: (item) => received.push(item) }, async (server) => {
    const response = await post(server.port, "/intake", {
      url: "https://mp.weixin.qq.com/s/example",
      title: "测试文章",
      text: "选中的片段",
      source: "bookmarklet"
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    const status = await fetch(`http://127.0.0.1:${server.port}/status`);
    assert.equal((await status.json()).service, "domi-intake");
    return received;
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].url, "https://mp.weixin.qq.com/s/example");
  assert.equal(result[0].title, "测试文章");
  assert.equal(result[0].source, "bookmarklet");
  assert.ok(result[0].receivedAt);
});

test("rejects invalid urls and payloads", async () => {
  await withServer({}, async (server) => {
    const missingUrl = await post(server.port, "/intake", { title: "no url" });
    assert.equal(missingUrl.status, 400);
    assert.equal((await missingUrl.json()).error.includes("url"), true);

    const badProtocol = await post(server.port, "/intake", { url: "ftp://example.com/a" });
    assert.equal(badProtocol.status, 400);

    const badJson = await post(server.port, "/intake", "{not json", {});
    assert.equal(badJson.status, 400);

    const notFound = await post(server.port, "/nope", {});
    assert.equal(notFound.status, 404);
  });
});

test("CORS preflight is answered for bookmarklets", async () => {
  await withServer({}, async (server) => {
    const response = await fetch(`http://127.0.0.1:${server.port}/intake`, { method: "OPTIONS" });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.equal(
      response.headers.get("access-control-allow-headers").includes("X-Domi-Token"),
      true
    );
  });
});

test("LAN binding requires and enforces the token", async () => {
  await assert.rejects(
    () => startIntakeServer({ port: 0, bind: "0.0.0.0", onItem: () => {} }),
    /DOMI_INTAKE_TOKEN/
  );

  await withServer({ bind: "0.0.0.0", token: "secret-token" }, async (server) => {
    const unauthorized = await post(server.port, "/intake", { url: "https://example.com/a" });
    assert.equal(unauthorized.status, 401);

    const wrongToken = await post(server.port, "/intake", { url: "https://example.com/a" }, {
      "X-Domi-Token": "wrong"
    });
    assert.equal(wrongToken.status, 401);

    const authorized = await post(server.port, "/intake", { url: "https://example.com/a" }, {
      "X-Domi-Token": "secret-token"
    });
    assert.equal(authorized.status, 200);
  });
});

test("rate limit kicks in after the configured burst", async () => {
  await withServer({ rateLimitMaxItems: 3 }, async (server) => {
    const statuses = [];
    for (let index = 0; index < 5; index += 1) {
      const response = await post(server.port, "/intake", { url: `https://example.com/${index}` });
      statuses.push(response.status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 429, 429]);
  });
});

test("reports intake dispatch failures instead of confirming receipt", async () => {
  await withServer({ onItem: () => { throw new Error("no available window"); } }, async (server) => {
    const response = await post(server.port, "/intake", { url: "https://example.com/a" });
    assert.equal(response.status, 500);
    assert.equal((await response.json()).ok, false);
  });
});

test("normalizeIntakePayload trims and caps fields", () => {
  const normalized = normalizeIntakePayload({
    url: "  https://example.com/article  ",
    title: "标".repeat(600),
    text: "x".repeat(300_000),
    source: "phone"
  });
  assert.equal(normalized.item.url, "https://example.com/article");
  assert.equal(normalized.item.title.length, 500);
  assert.equal(normalized.item.text.length, 200_000);
});
