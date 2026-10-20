const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createPdfPreviewRegistry } = require('../electron/pdf-preview.cjs');
test('PDF bytes require an opaque opened-file grant; the renderer can fetch only granted PDFs',async t=>{
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'domi-pdf-preview-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const pdf = path.join(directory,'中文 材料.pdf');fs.writeFileSync(pdf,'%PDF-1.7\nfixture');
  const registry = createPdfPreviewRegistry({net:{fetch:async()=>new Response(fs.readFileSync(pdf),{headers:{'Content-Length':String(fs.statSync(pdf).size)}})}});
  const url = registry.url(pdf);
  assert.doesNotMatch(url,/材料|fixture|[Cc]:/);
  const granted = await registry.handle(new Request(url));assert.equal(granted.status,200);assert.match(await granted.text(),/^%PDF-/);assert.equal(granted.headers.get('Access-Control-Allow-Origin'),'*');
  assert.equal((await registry.handle(new Request('domi-pdf://local/'+Buffer.from(pdf).toString('base64url')))).status,403);
  assert.equal((await registry.handle(new Request(url.replace('//local/','//other/')))).status,403);
  fs.writeFileSync(pdf,'%PDF-1.7\nupdated version');assert.equal((await registry.handle(new Request(url))).status,409,'旧预览令牌不能读取已替换的新文件');
  const renewed=registry.url(pdf);assert.equal((await registry.handle(new Request(renewed))).status,200);
  registry.clear();assert.equal((await registry.handle(new Request(url))).status,403);
});
