const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const crypto=require('node:crypto');
const {wordFixture}=require('./word-fixture.cjs');
const {parseWord,readWordFile,wordPackage,xmlPart,descendants,documentBlocks,digest,convertLegacyWord}=require('../electron/word-document.cjs');
const {exportWordAnnotations,exportPdfAnnotations,writeAnnotatedCopy}=require('../electron/annotation-export.cjs');
const {PDFDocument,PDFName,PDFArray,PDFDict,PDFHexString}=require('pdf-lib');
async function fixture(t) {const directory=fs.mkdtempSync(path.join(os.tmpdir(),'domi-word-test-')),close=[];t.after(()=>{for(const dispose of close)dispose();const relative=path.relative(os.tmpdir(),directory);assert.ok(relative.startsWith('domi-word-test-')&&!relative.includes(path.sep));fs.rmSync(directory,{recursive:true,force:true,maxRetries:5,retryDelay:100});});const file=path.join(directory,'中文 研究.docx'),bytes=await wordFixture();fs.writeFileSync(file,bytes);return {directory,file,bytes,close};}
function annotation(value,first,last,from,to,comment='原生中文评论') {return {id:crypto.randomUUID(),sourceVersion:value.version,kind:'text',anchor:{quote:value.text.slice(first.offset+from,last.offset+to),word:{start:{paragraphId:first.id,offset:from},end:{paragraphId:last.id,offset:to}}},quote:value.text.slice(first.offset+from,last.offset+to),comment,createdAt:Date.now(),updatedAt:Date.now()};}
test('DOCX 直接读取保留中文段落、跨 run 文本、表格和本地图片，不加载外部图片',async t=>{
  const f=await fixture(t),value=await readWordFile(f.file);
  assert.match(value.text,/订阅服务收入同比增长25%。/);assert.match(value.html,/<table>/);assert.match(value.html,/font-weight:700/);assert.match(value.html,/data:image\/png;base64/);assert.doesNotMatch(value.html,/https:|<script|onclick/i);
  assert.equal(value.blocks[1].id,'p-00000002');assert.equal(value.converted,false);assert.equal(value.version,digest(f.bytes));assert.deepEqual(fs.readFileSync(f.file),f.bytes);
});
test('Word 导出插入原生范围评论，保留正文、格式、表格、图片和已有评论，支持重叠与跨段落',async t=>{
  const f=await fixture(t),value=await readWordFile(f.file),first=value.blocks[1],last=value.blocks[2];
  const a=annotation(value,first,first,2,first.text.length),b=annotation(value,first,last,0,last.text.length,'跨段评论'),c=annotation(value,first,first,4,9,'重叠评论');
  const whole={...a,id:crypto.randomUUID(),kind:'document',quote:'',anchor:{quote:''},comment:'整篇评论'};
  const region={...a,id:crypto.randomUUID(),kind:'region',quote:'',anchor:{quote:'',word:{start:{paragraphId:value.blocks.at(-1).id,offset:0},end:{paragraphId:value.blocks.at(-1).id,offset:0},imageId:'image-rIdImage-0'}},comment:'图表评论'};
  const bytes=await exportWordAnnotations(f.file,[a,b,c,whole,region]),zip=await wordPackage(bytes),document=await xmlPart(zip,'word/document.xml'),comments=await xmlPart(zip,'word/comments.xml');
  assert.equal(documentBlocks(document).text,value.text);assert.equal(descendants(comments,'comment').length,6);assert.equal(descendants(document,'commentRangeStart').length,6);assert.equal(descendants(document,'commentRangeEnd').length,6);assert.equal(descendants(document,'commentReference').length,6);
  assert.match(comments.toString(),/原文件已有的评论/);assert.match(comments.toString(),/原生中文评论/);assert.match(document.toString(),/w:b/);assert.ok(descendants(document,'highlight').length>0);assert.equal(descendants(document,'tbl').length,1);
  assert.deepEqual(await zip.file('word/media/chart.png').async('nodebuffer'),await value.zip.file('word/media/chart.png').async('nodebuffer'));
  assert.deepEqual(fs.readFileSync(f.file),f.bytes);
  await assert.rejects(exportWordAnnotations(f.file,[{...a,sourceVersion:'old'}]),/版本已变化/);
  await assert.rejects(exportWordAnnotations(f.file,[{...a,quote:'伪造原文'}]),/摘录与原文不一致/);
});
test('旧版 DOC 使用稳定缓存；失败会明确报错，原文件保持不变',async t=>{
  const f=await fixture(t),file=path.join(f.directory,'legacy.doc');fs.writeFileSync(file,'binary legacy fixture');let count=0;
  const options={cacheDir:path.join(f.directory,'cache'),converter:async(_input,output)=>{count++;fs.writeFileSync(output,f.bytes);}};
  const first=await readWordFile(file,options),second=await readWordFile(file,options);assert.equal(first.converted,true);assert.equal(count,1);assert.equal(first.version,second.version);assert.match(first.text,/订阅服务/);assert.equal(fs.readFileSync(file,'utf8'),'binary legacy fixture');
  const failed=path.join(f.directory,'failed.doc');fs.writeFileSync(failed,'different');await assert.rejects(convertLegacyWord(failed,{cacheDir:options.cacheDir,converter:async()=>{throw new Error('converter unavailable');}}),/unavailable/);
});
test('PDF 副本包含可读取的原生高亮、区域和中文评论，保留页旋转及已有批注',async t=>{
  const f=await fixture(t),pdf=await PDFDocument.create(),page=pdf.addPage([540,720]);page.setRotation(require('pdf-lib').degrees(90));
  page.node.addAnnot(pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'Text',Rect:[10,10,30,30],Contents:PDFHexString.fromText('原有 PDF 评论')})));
  const input=Buffer.from(await pdf.save()),version=digest(input),base={id:crypto.randomUUID(),sourceVersion:version,kind:'text',anchor:{quote:'quote',pages:[{page:1,rects:[[50,600,200,620],[50,570,150,590]]}]},quote:'quote',comment:'中文高亮评论',createdAt:Date.now(),updatedAt:Date.now()};
  const bytes=await exportPdfAnnotations(input,[base,{...base,id:crypto.randomUUID(),kind:'region',comment:'图表评论'},{...base,id:crypto.randomUUID(),kind:'document',comment:'整篇 PDF 评论',anchor:{quote:''}}]),result=await PDFDocument.load(bytes),out=result.getPages()[0],annots=out.node.lookup(PDFName.of('Annots'),PDFArray);
  assert.equal(out.getRotation().angle,90);assert.equal(annots.size(),4);
  const kinds=[];for(let index=0;index<annots.size();index++){const item=annots.lookup(index,PDFDict);kinds.push(item.get(PDFName.of('Subtype')).toString());assert.ok(item.lookup(PDFName.of('Contents')).decodeText());if(index>0)assert.ok(item.lookup(PDFName.of('AP'),PDFDict));}
  assert.deepEqual(kinds,['/Text','/Highlight','/Square','/Text']);
  await assert.rejects(exportPdfAnnotations(input,[{...base,sourceVersion:'old'}]),/版本已变化/);
  assert.throws(()=>writeAnnotatedCopy(f.file,f.file,bytes),/不能覆盖/);
});
test('Word 已接入资料库、受限原文读取及批注身份，不能越过选定材料范围',async t=>{
  const f=await fixture(t),{ResearchStore}=require('../electron/research-store.cjs'),store=new ResearchStore({rootPath:f.directory});f.close.push(()=>store.close());
  const source=await store.handle({action:'source',path:f.file});assert.equal(source.source.kind,'word');
  const {DocumentReader}=require('../electron/document-reader.cjs'),reader=new DocumentReader({rootPath:f.directory,allowedPaths:[f.file]}),doc=await reader.load(f.file);assert.match(doc.text,/订阅服务收入/);
  await assert.rejects(reader.load(path.join(f.directory,'other.docx')),/选定材料/);
  const {listDocumentLibrary}=require('../electron/document-library.cjs');const library=listDocumentLibrary(f.directory);assert.ok(JSON.stringify(library).includes('word'));
  const {openDocumentSearchIndex,configureRoot,upsertIndexedDocument,searchIndexedDocuments}=require('../electron/document-search-index.cjs'),db=openDocumentSearchIndex(path.join(f.directory,'index.sqlite3'));f.close.push(()=>db.close());configureRoot(db,f.directory);await upsertIndexedDocument(db,f.directory,f.file,fs.statSync(f.file),'word');assert.equal(searchIndexedDocuments(db,{query:'订阅服务收入',limit:10}).results[0].kind,'word');
});
test('导出服务验证来源版本与评论快照，取消不写文件，始终拒绝覆盖原件',async t=>{
  const f=await fixture(t),{ResearchStore}=require('../electron/research-store.cjs'),{createDocumentAnnotationService}=require('../electron/document-annotations.cjs');
  const allowedPaths=new Set(),store=new ResearchStore({rootPath:f.directory,allowedPaths});f.close.push(()=>store.close());
  let behavior='cancel';const output=path.join(f.directory,'annotated.docx');
  const service=createDocumentAnnotationService({getStore:()=>store,allowedPaths,cacheDir:path.join(f.directory,'cache'),chooseSave:async()=>{if(behavior==='cancel')return {canceled:true};if(behavior==='change'){const a=(await store.handle({action:'source',path:f.file})).annotations[0];await store.handle({action:'updateComment',annotationId:a.id,expectedUpdatedAt:a.updatedAt,comment:'并发窗口修改'});}return {canceled:false,filePath:behavior==='overwrite'?f.file:output};}});
  const preview=await service.readWord({resource:require('node:url').pathToFileURL(f.file).href});assert.equal(preview.ok,true);assert.ok(allowedPaths.has(fs.realpathSync(f.file)));
  const source=(await store.handle({action:'source',path:f.file})).source,value=await readWordFile(f.file),a=annotation(value,value.blocks[1],value.blocks[1],0,4);
  assert.equal((await store.handle({action:'annotate',...a,sourceId:source.id})).ok,true);
  assert.equal((await service.exportAnnotated({path:f.file,expectedVersion:'old'})).ok,false);
  assert.equal((await service.exportAnnotated({path:f.file,expectedVersion:source.version})).canceled,true);assert.equal(fs.existsSync(output),false);
  behavior='change';assert.match((await service.exportAnnotated({path:f.file,expectedVersion:source.version})).error,/评论发生变化/);assert.equal(fs.existsSync(output),false);
  behavior='overwrite';assert.match((await service.exportAnnotated({path:f.file,expectedVersion:source.version})).error,/不能覆盖/);assert.deepEqual(fs.readFileSync(f.file),f.bytes);
  behavior='save';const saved=await service.exportAnnotated({path:f.file,expectedVersion:source.version});assert.equal(saved.ok,true,saved.error);assert.equal(saved.path,output);assert.equal(saved.count,1);
  const row=store.db.prepare('SELECT value FROM reading_annotations WHERE id=?').get(a.id),old=JSON.parse(row.value);old.sourceVersion='old';store.db.prepare('UPDATE reading_annotations SET value=? WHERE id=?').run(JSON.stringify(old),a.id);
  assert.equal((await service.exportAnnotated({path:f.file,expectedVersion:source.version})).unlocatedCount,1);
  const safe=await service.exportAnnotated({path:f.file,expectedVersion:source.version,preserveUnlocated:true});assert.equal(safe.ok,true,safe.error);assert.equal(safe.unlocatedCount,1);assert.match((await xmlPart(await wordPackage(fs.readFileSync(output)),'word/comments.xml')).toString(),/此批注未定位到新文档/);
});
test('含脚注等未展开部件的 Word 明确披露提取缺口，副本保留原始部件',async t=>{
  const f=await fixture(t),zip=await wordPackage(f.bytes),footnote='<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:footnote w:id="1"><w:p><w:r><w:t>关键脚注：指标口径发生变化。</w:t></w:r></w:p></w:footnote></w:footnotes>';
  zip.file('word/footnotes.xml',footnote);fs.writeFileSync(f.file,await zip.generateAsync({type:'nodebuffer'}));const value=await readWordFile(f.file);assert.equal(value.incomplete,true);assert.ok(value.warnings.some(item=>item.includes('脚注')));
  const {DocumentReader}=require('../electron/document-reader.cjs'),doc=await new DocumentReader({rootPath:f.directory}).load(f.file);assert.equal(doc.extractionIncomplete,true);
  const output=await exportWordAnnotations(f.file,[annotation(value,value.blocks[1],value.blocks[1],0,4)]);assert.equal(await (await wordPackage(output)).file('word/footnotes.xml').async('string'),footnote);
});
