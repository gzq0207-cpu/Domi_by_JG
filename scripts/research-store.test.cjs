const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { ResearchStore, hash } = require('../electron/research-store.cjs');
const uuid = () => crypto.randomUUID();
async function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'domi-research-'));
  const original = path.join(root,'中文 原始材料.md');
  fs.writeFileSync(original,'# 研究材料\n\n企业收入来自订阅服务。\n\n续费率仍需核实。\n');
  let store = new ResearchStore({ rootPath: root });
  t.after(() => { store.close(); const relative=path.relative(os.tmpdir(),root); assert.ok(relative.startsWith('domi-research-') && !relative.includes(path.sep)); fs.rmSync(root,{ recursive:true,force:true,maxRetries:10,retryDelay:100 }); });
  const call = async request => { const result = await store.handle(request); assert.equal(result.ok,true,result.error); return result; };
  const create = async (title,industry='其他行业') => (await call({ action:'create',title,industry,operationId:uuid() })).topic;
  const source = (await call({ action:'source',path:original })).source;
  const annotate = async (extra = {}) => (await call({ action:'annotate',id:uuid(),sourceId:source.id,sourceVersion:source.version,kind:'text',anchor:{ quote:'企业收入来自订阅服务。',prefix:'研究材料\n\n',offset:8 },quote:'企业收入来自订阅服务。',comment:'商业模式清楚，需要验证留存。',...extra })).annotation;
  return { root, original, call, create, source, annotate, get store() { return store; }, restart() { store.close(); store = new ResearchStore({ rootPath:root }); } };
}
test('跨主题快照、自由正文、材料批注独立保存，重启后恢复',async t => {
  const f = await fixture(t), before = hash(fs.readFileSync(f.original));
  const first = await f.create('推理成本'), second = await f.create('商业模式');
  const annotation = await f.annotate();
  await f.call({ action:'add',annotationId:annotation.id,topicIds:[first.id,second.id],operationId:uuid() });
  const { researchNotes,renderResearchNote } = await import('../shared/research-markdown.mjs');
  let a = await f.call({ action:'read',topicId:first.id });
  const b = await f.call({ action:'read',topicId:second.id });
  assert.equal(researchNotes(a.content).length,1); assert.equal(researchNotes(b.content).length,1);
  const note = researchNotes(a.content)[0];
  const edited = a.content.replace(note.raw,renderResearchNote(note,'这个主题的独立判断')).replace('## 我的分析','## 我的分析\n\n这里是自由撰写的完整观点。');
  await f.call({ action:'save',topicId:first.id,content:edited,expectedVersion:a.version });
  await f.annotate({ id:annotation.id,comment:'材料上的新评论' });
  f.restart();
  a = await f.call({ action:'read',topicId:first.id });
  assert.match(a.content,/自由撰写的完整观点/); assert.equal(researchNotes(a.content)[0].comment,'这个主题的独立判断');
  assert.equal(researchNotes((await f.call({ action:'read',topicId:second.id })).content)[0].comment,'商业模式清楚，需要验证留存。');
  const material = await f.call({ action:'source',path:f.original });
  assert.equal(material.annotations[0].comment,'材料上的新评论'); assert.equal(material.annotations[0].topics.length,2);
  assert.equal(hash(fs.readFileSync(f.original)),before,'批注不能修改原始材料');
});
test('任意 Markdown/PDF 支持整篇评论，重启恢复且不修改材料',async t => {
  const f = await fixture(t), before = fs.readFileSync(f.original);
  const pdf = path.join(f.root,'整篇评论.pdf'); fs.writeFileSync(pdf,'%PDF-1.7\nfixture');
  for (const file of [f.original,pdf]) {
    const source = (await f.call({action:'source',path:file})).source;
    const request = {action:'annotate',id:uuid(),sourceId:source.id,sourceVersion:source.version,kind:'document',anchor:{quote:''},quote:'',comment:'整篇文档的评论'};
    await f.call(request);
    assert.equal((await f.store.handle({...request,id:uuid(),comment:' '})).ok,false);
    assert.equal((await f.store.handle({...request,id:uuid(),quote:'伪造摘录'})).ok,false);
    if (file===pdf) assert.equal((await f.store.handle({...request,id:uuid(),kind:'text'})).ok,false,'选段评论仍要求 PDF 坐标');
  }
  f.restart();
  for (const file of [f.original,pdf]) {
    const {annotations} = await f.call({action:'source',path:file});
    assert.equal(annotations.length,1); assert.equal(annotations[0].kind,'document'); assert.equal(annotations[0].comment,'整篇文档的评论');
    await f.call({action:'removeComment',annotationId:annotations[0].id,expectedUpdatedAt:annotations[0].updatedAt});
    assert.equal((await f.call({action:'source',path:file})).annotations.length,0);
  }
  assert.deepEqual(fs.readFileSync(f.original),before);
});
test('编辑评论保留原锚点和版本，冲突不会覆盖评论或主题快照',async t => {
  const f = await fixture(t), a = await f.annotate(), topic = await f.create('独立快照');
  await f.call({action:'add',annotationId:a.id,topicIds:[topic.id],operationId:uuid()});
  fs.appendFileSync(f.original,'\n来源已有更新。');
  const updated = (await f.call({action:'updateComment',annotationId:a.id,comment:'更新后的评论',expectedUpdatedAt:a.updatedAt})).annotation;
  assert.equal(updated.sourceVersion,a.sourceVersion); assert.deepEqual(updated.anchor,a.anchor); assert.equal(updated.createdAt,a.createdAt); assert.ok(updated.updatedAt>a.updatedAt);
  const conflict = await f.store.handle({action:'updateComment',annotationId:a.id,comment:'过期窗口的评论',expectedUpdatedAt:a.updatedAt});
  assert.equal(conflict.ok,false); assert.equal(conflict.conflict,true);
  assert.equal((await f.store.handle({action:'removeComment',annotationId:a.id,expectedUpdatedAt:a.updatedAt})).conflict,true);
  const cleared = (await f.call({action:'removeComment',annotationId:a.id,expectedUpdatedAt:updated.updatedAt})).annotation;
  assert.equal(cleared.comment,''); assert.equal(cleared.topics[0].id,topic.id); assert.deepEqual(cleared.anchor,a.anchor);
  const {researchNotes} = await import('../shared/research-markdown.mjs');
  assert.equal(researchNotes((await f.call({action:'read',topicId:topic.id})).content)[0].comment,a.comment);
  assert.equal((await f.call({action:'resolve',annotationId:a.id})).status,'changed');
});
test('添加幂等、移除与归档边界，文件名保留稳定身份',async t => {
  const f = await fixture(t), topic = await f.create('同一个主题'), annotation = await f.annotate();
  const operationId = uuid(), request = { action:'add',annotationId:annotation.id,topicIds:[topic.id],operationId };
  await f.call(request); await f.call(request); await f.call({ ...request,operationId:uuid() });
  const { researchNotes } = await import('../shared/research-markdown.mjs');
  let read = await f.call({ action:'read',topicId:topic.id });
  assert.equal(researchNotes(read.content).length,1);
  await f.call({ action:'save',topicId:topic.id,content:read.content.replace(researchNotes(read.content)[0].raw,''),expectedVersion:read.version });
  await f.call(request);
  read = await f.call({ action:'read',topicId:topic.id }); assert.equal(researchNotes(read.content).length,0,'已完成操作重试不能恢复已删除笔记');
  assert.equal((await f.call({ action:'source',path:f.original })).annotations[0].topics.length,0);
  const renamed = await f.call({ action:'update',topicId:topic.id,title:'新的主题名',expectedVersion:read.version });
  assert.equal(renamed.topic.path,topic.path); assert.match(renamed.content,/# 新的主题名/);
  await f.call({ action:'update',topicId:topic.id,archived:true,expectedVersion:renamed.version });
  const denied = await f.store.handle({ ...request,operationId:uuid() }); assert.equal(denied.ok,false); assert.match(denied.error,/归档/);
});
test('加入笔记保留最新正文；外部修改冲突不会覆盖文件',async t => {
  const f = await fixture(t), topic = await f.create('并发保存'), annotation = await f.annotate();
  const old = await f.call({ action:'read',topicId:topic.id });
  fs.appendFileSync(topic.path,'\n用户在其他编辑器写的新段落。\n');
  const conflict = await f.store.handle({ action:'save',topicId:topic.id,content:old.content+'旧草稿',expectedVersion:old.version });
  assert.equal(conflict.conflict,true); assert.match(fs.readFileSync(topic.path,'utf8'),/其他编辑器写的新段落/);
  await f.call({ action:'add',annotationId:annotation.id,topicIds:[topic.id],operationId:uuid() });
  assert.match(fs.readFileSync(topic.path,'utf8'),/其他编辑器写的新段落/);
});
test('来源改名后唯一回跳，替换后标记版本变化，删除后保留摘录',async t => {
  const f = await fixture(t), annotation = await f.annotate(), topic = await f.create('来源跟踪');
  await f.call({ action:'add',annotationId:annotation.id,topicIds:[topic.id],operationId:uuid() });
  const moved = path.join(f.root,'移动后的中文材料.md'); fs.renameSync(f.original,moved);
  let result = await f.call({ action:'resolve',annotationId:annotation.id }); assert.equal(result.status,'exact'); assert.equal(result.source.id,f.source.id); assert.equal(result.source.path,moved);
  fs.appendFileSync(moved,'内容已经变化');
  result = await f.call({ action:'resolve',annotationId:annotation.id }); assert.equal(result.status,'changed');
  fs.unlinkSync(moved); result = await f.call({ action:'resolve',annotationId:annotation.id }); assert.equal(result.status,'missing');
  assert.match((await f.call({ action:'read',topicId:topic.id })).content,/企业收入来自订阅服务/);
});
test('PDF 区域截图独立复制到各主题，非法图片与坐标被拒绝',async t => {
  const f = await fixture(t), pdf = path.join(f.root,'图表.pdf'); fs.writeFileSync(pdf,'%PDF-1.7\nfixture');
  const source = (await f.call({ action:'source',path:pdf })).source;
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6c2kAAAAASUVORK5CYII=';
  const request = { action:'annotate',id:uuid(),sourceId:source.id,sourceVersion:source.version,kind:'region',quote:'',comment:'图表需结合口径判断',anchor:{ quote:'',pages:[{ page:2,rects:[[10,20,30,40]] }] },screenshot:png };
  const annotation = (await f.call(request)).annotation, topic = await f.create('图表研究');
  await f.call({ action:'add',annotationId:annotation.id,topicIds:[topic.id],operationId:uuid() });
  const { researchNotes } = await import('../shared/research-markdown.mjs');
  const note = researchNotes((await f.call({ action:'read',topicId:topic.id })).content)[0];
  assert.equal(note.location,'第 2 页'); assert.ok(fs.existsSync(path.join(path.dirname(topic.path),note.imagePath)));
  assert.equal(hash(fs.readFileSync(path.join(path.dirname(topic.path),note.imagePath))),hash(Buffer.from(png.split(',')[1],'base64')));
  assert.equal((await f.store.handle({ ...request,id:uuid(),screenshot:'data:image/png;base64,AAAA' })).ok,false);
  assert.equal((await f.store.handle({ ...request,id:uuid(),anchor:{ quote:'',pages:[{ page:1,rects:[[NaN,0,1,2]] }] } })).ok,false);
});
test('中断的多主题操作恢复原始快照，已完成主题不重复插入',async t => {
  const f = await fixture(t), first = await f.create('主题甲'), second = await f.create('主题乙'), annotation = await f.annotate();
  let fail = true;
  f.store.onFileChanged = file => { if (file === first.path && fail) { fail = false; throw new Error('模拟中断'); } };
  const operationId = uuid();
  const result = await f.store.handle({ action:'add',annotationId:annotation.id,topicIds:[first.id,second.id],operationId }); assert.equal(result.ok,false);
  // Simulate an annotation change between the crash and journal recovery.
  const value = JSON.parse(f.store.db.prepare('SELECT value FROM reading_annotations WHERE id=?').get(annotation.id).value); value.comment = '之后的修改';
  f.store.db.prepare('UPDATE reading_annotations SET value=? WHERE id=?').run(JSON.stringify(value),annotation.id);
  f.restart(); await f.call({ action:'list' });
  const { researchNotes } = await import('../shared/research-markdown.mjs');
  for (const topic of [first,second]) { const notes = researchNotes((await f.call({ action:'read',topicId:topic.id })).content); assert.equal(notes.length,1); assert.equal(notes[0].comment,annotation.comment); }
  assert.equal(f.store.db.prepare('SELECT done FROM research_operations WHERE id=?').get(operationId).done,1);
});
test('路径边界、格式标记及自定义章节不会吞掉笔记',async t => {
  const f = await fixture(t), outside = path.join(os.tmpdir(),`outside-${uuid()}.md`); fs.writeFileSync(outside,'outside'); t.after(() => fs.rmSync(outside,{ force:true }));
  assert.equal((await f.store.handle({ action:'source',path:outside })).ok,false);
  assert.equal((await f.store.handle({ action:'create',title:'非法\n名称',operationId:uuid() })).ok,false);
  const { appendResearchNote,researchNotes,renderResearchNote } = await import('../shared/research-markdown.mjs');
  const note = { id:uuid(),annotationId:uuid(),quote:'原文包含 <!-- domi:note:end -->\n第二行',comment:'**判断**\n\n```js\nconst n = 1;\n```',sourceName:'a.md',sourcePath:'a.md',sourceVersion:'v',location:'章节',createdAt:1 };
  const content = appendResearchNote('# 自定义\n\n## 待整理笔记\n\n## 最后的章节\n保留我',note);
  assert.equal(researchNotes(content).length,1); assert.equal(researchNotes(content)[0].quote,note.quote); assert.equal(researchNotes(content)[0].comment,note.comment); assert.ok(content.indexOf('domi:note:start') < content.indexOf('## 最后的章节'));
  assert.equal(researchNotes(renderResearchNote(note)).length,1);
  let rendered = renderResearchNote(note);
  const initial = rendered;
  for(let i=0;i<30;i++) rendered = renderResearchNote(researchNotes(rendered)[0]);
  assert.equal(rendered,initial,'往返序列化不能把 raw/offset 等解析字段递归保存');
});
test('主题文档可检索；选定笔记问答不能沿来源链接扩大范围',async t => {
  const f = await fixture(t), topic = await f.create('限定材料的主题研究');
  const annotation = await f.annotate({comment:'主题独有观点 哨兵TOPICONLY123'});
  await f.call({action:'add',annotationId:annotation.id,topicIds:[topic.id],operationId:uuid()});
  const {openDocumentSearchIndex,configureRoot,upsertIndexedDocument,searchIndexedDocuments} = require('../electron/document-search-index.cjs');
  const database = openDocumentSearchIndex(path.join(f.root,'.domi','search-test.sqlite3'));
  try {
    configureRoot(database,f.root);
    await upsertIndexedDocument(database,f.root,topic.path,fs.statSync(topic.path),'test');
    const result = searchIndexedDocuments(database,{query:'TOPICONLY123',limit:10});
    assert.equal(result.results.length,1); assert.equal(result.results[0].path,topic.path);
  } finally { database.close(); }
  const {LibrarySession} = require('../electron/library-tools.cjs');
  const session = new LibrarySession({rootPath:f.root,settings:{storageBackend:'local',semanticSearchEnabled:false},sourceScope:'selected',selectedPaths:[topic.path]});
  const read = await session.call('domi_library_read',{path:topic.path}); assert.equal(read.ok,true); assert.match(read.content,/TOPICONLY123/);
  const denied = await session.call('domi_library_read',{path:f.original}); assert.equal(denied.ok,false); assert.match(denied.error,/范围/);
  session.close();
});
test('最近打开的主题优先出现在主题选择器中',async t => {
  const f = await fixture(t), first = await f.create('较早创建'), second = await f.create('后来创建');
  f.store.db.prepare('UPDATE research_topics SET updated_at=1 WHERE id=?').run(first.id);
  f.store.db.prepare('UPDATE research_topics SET updated_at=2 WHERE id=?').run(second.id);
  await f.call({action:'read',topicId:first.id});
  assert.equal((await f.call({action:'list'})).topics[0].id,first.id);
});
test('主题按行业创建，库初始化在每个行业下建立主题研究目录',async t=>{
  const f=await fixture(t),{ensureDocumentLibraryStructure}=require('../electron/document-library.cjs');
  const {segments}=require('../shared/investment-chain-segments.json');
  ensureDocumentLibraryStructure(f.root);
  for(const item of segments) assert.ok(fs.statSync(path.join(f.root,item.directory,'主题研究')).isDirectory());
  assert.equal(fs.existsSync(path.join(f.root,'14.主题研究')),false);
  const a=await f.create('芯片研究','算力芯片'),b=await f.create('云服务研究','云与算力服务');
  assert.ok(a.path.startsWith(path.join(f.root,'03.算力芯片','主题研究')+path.sep)); assert.equal(a.industry,'算力芯片');
  assert.ok(b.path.startsWith(path.join(f.root,'06.云与算力服务','主题研究')+path.sep));
  assert.equal((await f.store.handle({action:'create',title:'非法行业',industry:'../../outside',operationId:uuid()})).ok,false);
});
test('旧根目录主题按来源行业迁移，保留 ID、截图、评论、归档及来源链接',async t=>{
  const f=await fixture(t),topicId=uuid(),annotationId=uuid(),noteId=uuid(),createOperation=uuid();
  const material=path.join(f.root,'03.算力芯片','原始材料','说明.md'); fs.mkdirSync(path.dirname(material),{recursive:true}); fs.writeFileSync(material,'# 来源\n芯片研究证据。');
  const source=(await f.call({action:'source',path:material})).source;
  await f.call({action:'annotate',id:annotationId,sourceId:source.id,sourceVersion:source.version,kind:'text',anchor:{quote:'芯片研究证据。'},quote:'芯片研究证据。',comment:'材料评论'});
  const oldDirectory=path.join(f.root,'14.主题研究',`旧主题--${topicId}`); fs.mkdirSync(path.join(oldDirectory,'assets'),{recursive:true});
  fs.writeFileSync(path.join(oldDirectory,'assets','图.png'),Buffer.from('保留原截图字节'));
  fs.writeFileSync(path.join(path.dirname(material),'附图.png'),'外部配图');
  const {renderResearchNote,researchNotes}=await import('../shared/research-markdown.mjs');
  const snapshot={id:noteId,annotationId,sourceName:'说明.md',sourcePath:'../../03.算力芯片/原始材料/说明.md',sourceVersion:source.version,location:'来源',createdAt:1,quote:'芯片研究证据。',comment:'主题中的独立评论',imagePath:'assets/图.png'};
  const oldContent=`---\ndomiResearchId: ${topicId}\n---\n\n# 旧主题\n\n![外部配图](../../03.算力芯片/原始材料/附图.png)\n\n\`[代码链接](../../原样保留.md)\`\n\n${renderResearchNote(snapshot)}\n`;
  fs.writeFileSync(path.join(oldDirectory,'研究笔记.md'),oldContent);
  f.store.db.prepare('INSERT INTO research_topics VALUES(?,?,?,1,1)').run(topicId,'旧主题',path.relative(f.root,path.join(oldDirectory,'研究笔记.md')));
  f.store.db.prepare('INSERT INTO research_operations VALUES(?,?,1)').run(createOperation,JSON.stringify({kind:'create',topicId,title:'旧主题',directory:path.basename(oldDirectory)}));
  f.restart();
  const migrated=(await f.call({action:'list'})).topics.find(item=>item.id===topicId);
  assert.equal(migrated.industry,'算力芯片'); assert.equal(migrated.archived,true); assert.equal(fs.existsSync(oldDirectory),false);
  assert.equal(fs.existsSync(path.join(f.root,'14.主题研究')),false);
  const read=await f.call({action:'read',topicId}),note=researchNotes(read.content)[0];
  assert.equal(note.id,noteId); assert.equal(note.comment,snapshot.comment); assert.equal(fs.readFileSync(path.join(path.dirname(migrated.path),note.imagePath),'utf8'),'保留原截图字节');
  assert.equal(path.resolve(path.dirname(migrated.path),note.sourcePath),material);
  assert.match(read.content,/!\[外部配图\]\(\.\.\/\.\.\/原始材料\/附图.png\)/);
  assert.match(read.content,/`\[代码链接\]\(\.\.\/\.\.\/原样保留.md\)`/);
  assert.equal((await f.call({action:'resolve',annotationId})).source.path,material);
  assert.equal((await f.call({action:'source',path:material})).annotations[0].topics[0].id,topicId);
  await f.call({action:'create',title:'旧主题',operationId:createOperation});
  assert.equal(fs.existsSync(oldDirectory),false,'旧创建操作重放不能恢复旧目录');
  f.restart(); assert.equal((await f.call({action:'list'})).topics.filter(item=>item.id===topicId).length,1);
});
test('调整行业时移动完整主题，来源索引及相对链接继续有效',async t=>{
  const f=await fixture(t),topic=await f.create('跨行业主题','算力芯片'),annotation=await f.annotate();
  await f.call({action:'add',annotationId:annotation.id,topicIds:[topic.id],operationId:uuid()});
  const source=(await f.call({action:'source',path:topic.path})).source;
  const read=await f.call({action:'read',topicId:topic.id});
  const changed=await f.call({action:'update',topicId:topic.id,industry:'云与算力服务',expectedVersion:read.version});
  assert.equal(changed.topic.id,topic.id); assert.equal(changed.topic.industry,'云与算力服务'); assert.equal(fs.existsSync(topic.path),false);
  assert.ok(changed.topic.path.startsWith(path.join(f.root,'06.云与算力服务','主题研究')+path.sep));
  assert.equal(f.store.sourceInfo(f.store.sourceRow(source.id)).path,changed.topic.path);
  const {researchNotes}=await import('../shared/research-markdown.mjs');
  assert.equal(path.resolve(path.dirname(changed.topic.path),researchNotes(changed.content)[0].sourcePath),f.original);
});
test('迁移目标冲突不覆盖文件，中断迁移可在重启后恢复',async t=>{
  const f=await fixture(t),topic=await f.create('迁移恢复','算力芯片');
  const target=path.join(f.root,'07.模型层','主题研究',path.basename(path.dirname(topic.path)));
  fs.mkdirSync(target,{recursive:true}); fs.writeFileSync(path.join(target,'保留.txt'),'目标内容');
  const read=await f.call({action:'read',topicId:topic.id});
  const denied=await f.store.handle({action:'update',topicId:topic.id,industry:'模型层',expectedVersion:read.version});
  assert.equal(denied.ok,false); assert.equal(fs.readFileSync(path.join(target,'保留.txt'),'utf8'),'目标内容'); assert.ok(fs.existsSync(topic.path));
  const emptyTarget=path.join(f.root,'06.云与算力服务','主题研究',path.basename(path.dirname(topic.path)));
  let interrupted=false; f.store.onFileChanged=()=>{if(!interrupted) {interrupted=true;throw new Error('模拟迁移完成前中断');}};
  assert.equal((await f.store.handle({action:'update',topicId:topic.id,industry:'云与算力服务',expectedVersion:read.version})).ok,false);
  assert.ok(fs.existsSync(path.join(emptyTarget,'研究笔记.md')));
  f.restart(); const recovered=(await f.call({action:'list'})).topics.find(item=>item.id===topic.id);
  assert.equal(recovered.industry,'云与算力服务'); assert.equal(fs.existsSync(topic.path),false);
  assert.equal(f.store.db.prepare("SELECT COUNT(*) AS n FROM research_operations WHERE done=0").get().n,0);
});
