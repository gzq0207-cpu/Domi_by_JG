// Real production renderer. No model/network requests or user data writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bridge = ts.transpileModule(fs.readFileSync(path.join(root, 'src/bridge.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText.replace(/\bexport /g, '');
const content = '## 商业化与盈利能力\n\n' + ('收入增长取决于付费客户、产品渗透率、交付能力和续费表现。利润率还受折旧、利用率和推理成本影响。**假设需要持续核验**。\n\n').repeat(8)
  + '| 指标 | 基准 | 乐观 | 悲观 |\n|---|---:|---:|---:|\n|收入增速|20%|30%|10%|\n|利润率|15%|20%|8%|\n';
const server = await preview({ root, configFile: false, logLevel: 'error', preview: { host: '127.0.0.1', port: 0 }, build: { outDir: path.join(root, 'dist') } });
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const pairs of [1, 20, 60]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const messages = Array.from({ length: pairs }, (_, i) => [
      { id: `u${i}`, role: 'user', content: `第 ${i} 轮问题，请解释商业模式。` },
      { id: `a${i}`, role: 'assistant', status: 'done', content }
    ]).flat();
    await page.addInitScript({ content: `
      window.__messageProps=new Map();window.__callbackChanges=0;window.__messageObservations=0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject:()=>1,onCommitFiberUnmount:()=>{},onCommitFiberRoot:(_,root)=>{
        function visit(fiber){if(!fiber)return;const p=fiber.memoizedProps;
          if(p?.message?.id&&typeof p.onOpenDocument==='function'){
            const before=window.__messageProps.get(p.message.id);window.__messageObservations++;
            if(before&&before.message===p.message&&before.handler!==p.onOpenDocument)window.__callbackChanges++;
            window.__messageProps.set(p.message.id,{message:p.message,handler:p.onOpenDocument});
          }visit(fiber.child);visit(fiber.sibling);
        }visit(root.current);
      }};
      ${bridge}
      window.workbench={...browserFallback,
        loadState:async()=>({ok:true,isNew:false,state:{version:2,activeThreadId:'qa',threads:[{id:'qa',projectId:'qa',project:'研究',title:'架构回归隔离样本',lastActiveAt:1,pinned:false,timeline:[],messages:${JSON.stringify(messages)}}]}})
      };
      window.__longTasks=[];new PerformanceObserver(list=>window.__longTasks.push(...list.getEntries().map(x=>x.duration))).observe({type:'longtask',buffered:true});
    ` });
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.locator('.message-markdown table').last().waitFor();
    const composer = page.getByRole('textbox', { name: '输入投资任务', exact: true });
    await composer.focus(); await composer.pressSequentially('warmup', { delay: 30 }); await composer.fill('');
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__longTasks = []; window.__callbackChanges = 0; window.__messageObservations = 0; });
    const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
    const before = (await cdp.send('Performance.getMetrics')).metrics;
    const text = 'architecture review input latency measurement';
    await composer.pressSequentially(text, { delay: 30 }); await page.waitForTimeout(300);
    assert.equal(await composer.inputValue(), text);
    const after = (await cdp.send('Performance.getMetrics')).metrics;
    const metric = (list, key) => list.find(x => x.name === key)?.value || 0;
    const observation = await page.evaluate(() => ({ tasks: window.__longTasks, callbackChanges: window.__callbackChanges, observations: window.__messageObservations }));
    assert.ok(observation.observations >= pairs, 'production commit hook must observe real message props');
    assert.equal(observation.callbackChanges, 0, 'typing must not invalidate unchanged message callbacks');
    assert.deepEqual(errors, []);
    results.push({ pairs, messageCount: messages.length, charsPerAnswer: content.length,
      rendererTaskMs: (metric(after, 'TaskDuration') - metric(before, 'TaskDuration')) * 1000,
      longTaskCount: observation.tasks.length, longestTaskMs: Math.max(0, ...observation.tasks),
      callbackChanges: observation.callbackChanges, messageObservations: observation.observations, errors });
    await page.close();
  }
  const output = path.join(root, 'output', 'architecture-performance'); fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'ui-results.json'), JSON.stringify(results, null, 2));
  process.stdout.write(JSON.stringify({ ok: true, engine: 'production renderer, headless Chromium, simulated bridge', results }) + '\n');
} finally { await browser.close(); await new Promise(resolve => server.httpServer.close(resolve)); }
