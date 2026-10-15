const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const url = 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json';
const moduleUrl = pathToFileURL(path.resolve(__dirname, 'follow-builders-runner.mjs')).href;
const payload = JSON.stringify({generatedAt:'2026-10-11T01:00:00Z',x:[]});
function root(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'domi-feeds-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.match(path.basename(directory), /^domi-feeds-[A-Za-z\d]+$/);
    await fs.promises.rm(directory,{recursive:true,force:true,maxRetries:6,retryDelay:150});
  });
  return directory;
}
const unavailable = async () => { const error = new Error('network unavailable'); error.code = 7; throw error; };

test('HTTP and connection failures fall back to the public GitHub content API with detailed logs', async (t) => {
  const {fetchJSON} = await import(moduleUrl), logs=[], calls=[];
  const cacheDir=root(t);
  const result=await fetchJSON(url,{cacheDir,logger:message=>logs.push(message),transport:async (exe,args,options)=>{
    calls.push(args); assert.equal(exe,'curl.exe');assert.equal(options.windowsHide,true);assert.ok(args.includes('--fail'));
    if(calls.length<3){const error=new Error('failed');error.code=22;error.stderr='curl: (22) HTTP 502';throw error;}
    assert.ok(args.includes('Accept: application/vnd.github.raw+json'));assert.ok(args.at(-1).startsWith('https://api.github.com/repos/'));
    return {stdout:payload};
  }});
  assert.equal(result._domiFetch.route,'api-proxy');assert.equal(calls.length,3);
  assert.equal(logs.filter(line=>line.includes('HTTP 502')).length,2);
  assert.equal(JSON.parse(fs.readFileSync(path.join(cacheDir,'x.json'),'utf8')).text,payload);
});

test('a temporary startup failure retries after a delay and invalid JSON cannot count as a valid feed', async (t) => {
  const {fetchJSON}=await import(moduleUrl);let calls=0;const waits=[],logs=[];
  const result=await fetchJSON(url,{cacheDir:root(t),logger:x=>logs.push(x),sleep:async ms=>waits.push(ms),transport:async ()=>{
    calls++;if(calls===1)return {stdout:'<html>temporary gateway error</html>'};
    if(calls<=4)return unavailable();return {stdout:payload};
  }});
  assert.equal(calls,5);assert.deepEqual(waits,[4000]);assert.equal(result._domiFetch.fromCache,false);
  assert.ok(logs.some(line=>line.includes('FAILED route=raw-proxy')));
});

test('only an intact same-day cache within six hours may substitute for an unavailable live feed', async (t) => {
  const {fetchJSON}=await import(moduleUrl),cacheDir=root(t),cachePath=path.join(cacheDir,'x.json');
  const now=()=>new Date('2026-10-11T02:00:00Z');
  await fetchJSON(url,{cacheDir,now,logger:()=>{},transport:async()=>({stdout:payload})});
  const options={cacheDir,now,logger:()=>{},transport:unavailable,attempts:1};
  assert.equal((await fetchJSON(url,options))._domiFetch.fromCache,true);
  const good=JSON.parse(fs.readFileSync(cachePath,'utf8'));
  for(const changed of [
    {...good,text:JSON.stringify({x:[{unexpected:'changed'}]})},
    {...good,fetchedAt:'2026-10-10T23:00:00Z'},
    {...good,fetchedAt:'2026-10-11T03:00:00Z'},
    {...good,url:url.replace('feed-x','feed-blogs')}
  ]){
    fs.writeFileSync(cachePath,JSON.stringify(changed));
    const modified=changed.fetchedAt==='2026-10-10T23:00:00Z'?{...options,now:()=>new Date('2026-10-11T06:00:00Z')}:options;
    assert.equal(await fetchJSON(url,modified),null);
  }
  fs.writeFileSync(cachePath,JSON.stringify({...good,fetchedAt:'2026-10-11T15:59:00Z'}));
  assert.equal(await fetchJSON(url,{...options,now:()=>new Date('2026-10-11T16:30:00Z')}),null);
});

test('an API error object is rejected and a cache write failure cannot discard a successfully fetched feed', async (t) => {
  const {fetchJSON}=await import(moduleUrl),directory=root(t),cacheDir=path.join(directory,'file');fs.writeFileSync(cacheDir,'existing file');let calls=0;
  const result=await fetchJSON(url,{cacheDir,logger:()=>{},transport:async()=>({stdout:++calls===1?JSON.stringify({message:'Not Found'}):payload})});
  assert.equal(calls,2);assert.deepEqual(result.x,[]);assert.equal(result._domiFetch.fromCache,false);
});
