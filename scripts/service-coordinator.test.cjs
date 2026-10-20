const assert = require("node:assert/strict");
const test = require("node:test");
const { ServiceCoordinator, TaskQueue } = require("../electron/service-coordinator.cjs");

test("invalidated reads cannot overwrite newer values or clear their in-flight request", async () => {
  const coordinator = new ServiceCoordinator();
  let releaseOld, releaseNew;
  const old = coordinator.run('records', () => new Promise(resolve => { releaseOld = resolve; }), { ttlMs: 5000 });
  coordinator.invalidate('records');
  let calls = 0;
  const fresh = coordinator.run('records', () => {
    calls++;
    return new Promise(resolve => { releaseNew = resolve; });
  }, { force: true, ttlMs: 5000 });
  releaseOld({ revision: 'old' });
  await old;
  const joined = coordinator.run('records', () => { throw new Error('must share current generation'); });
  releaseNew({ revision: 'new' });
  assert.deepEqual(await fresh, { revision: 'new' });
  assert.deepEqual(await joined, { revision: 'new' });
  assert.equal(calls, 1);
  assert.deepEqual(await coordinator.run('records', () => { throw new Error('must use new cache'); }), { revision: 'new' });
});

test("an invalidated failure cannot open a circuit for newer data", async () => {
  const coordinator = new ServiceCoordinator();
  let rejectOld;
  const old = coordinator.run('records', () => new Promise((_, reject) => { rejectOld = reject; }), { failureThreshold: 1 });
  const settled = old.catch(error => error);
  coordinator.invalidate('records');
  await coordinator.run('records', async () => ({ revision: 'new' }), { ttlMs: 5000 });
  rejectOld(new Error('old connection failed'));
  await settled;
  assert.equal(coordinator.snapshot()[0].failures, 0);
  assert.equal(coordinator.snapshot()[0].circuitOpen, false);
});

test("service coordinator merges requests, retries and serves stale data", async () => {
  let now = 1000;
  const coordinator = new ServiceCoordinator({ now: () => now, sleep: async () => undefined });
  let calls = 0;
  const operation = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { ok: true, value: calls };
  };
  const [first, second] = await Promise.all([
    coordinator.run("shared", operation, { ttlMs: 100 }),
    coordinator.run("shared", operation, { ttlMs: 100 })
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(await coordinator.run("shared", operation, { ttlMs: 100 }), first);

  now += 101;
  let attempts = 0;
  const retried = await coordinator.run("retry", async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("temporary");
    return { ok: true };
  }, { retries: 1 });
  assert.equal(retried.ok, true);
  assert.equal(attempts, 2);

  const stale = await coordinator.run("shared", async () => {
    throw new Error("offline");
  }, { force: true, allowStale: true });
  assert.equal(stale.stale, true);
  assert.match(stale.coordinatorError, /offline/);

  let dynamicCalls = 0;
  const dynamicOperation = async () => {
    dynamicCalls += 1;
    return { ok: dynamicCalls > 1 };
  };
  await coordinator.run("dynamic", dynamicOperation, {
    ttlMs: 100,
    ttlForValue: (value) => value.ok ? 100 : 5
  });
  now += 6;
  await coordinator.run("dynamic", dynamicOperation, {
    ttlMs: 100,
    ttlForValue: (value) => value.ok ? 100 : 5
  });
  assert.equal(dynamicCalls, 2);
});

test("task queue enforces its concurrency limit", async () => {
  const queue = new TaskQueue(2);
  let active = 0;
  let maximumActive = 0;
  const results = await Promise.all([1, 2, 3, 4].map((value) => queue.run(async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value;
  })));
  assert.deepEqual(results, [1, 2, 3, 4]);
  assert.equal(maximumActive, 2);
  assert.deepEqual(queue.snapshot(), { activeCount: 0, pendingCount: 0 });
});

test("task queue cancels pending work without restarting it after active work exits", async () => {
  const queue = new TaskQueue(1);
  let releaseActive;
  const blocker = new Promise((resolve) => {
    releaseActive = resolve;
  });
  const active = queue.run(() => blocker);
  let pendingStarted = false;
  const pending = queue.run(async () => {
    pendingStarted = true;
  });
  const pendingResult = pending.then(
    () => ({ ok: true }),
    (error) => ({ ok: false, error })
  );

  assert.deepEqual(queue.snapshot(), { activeCount: 1, pendingCount: 1 });
  assert.equal(queue.cancelPending(new Error("shutdown")), 1);
  releaseActive();
  await active;
  const result = await pendingResult;

  assert.equal(result.ok, false);
  assert.match(result.error.message, /shutdown/);
  assert.equal(pendingStarted, false);
  assert.deepEqual(queue.snapshot(), { activeCount: 0, pendingCount: 0 });
});
