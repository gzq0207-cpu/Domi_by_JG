import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{wordPackage,xmlPart,descendants,parseWord}=require('../electron/word-document.cjs');
const {PDFDocument,PDFName,PDFArray,PDFDict}=require('pdf-lib');
async function selectWord(source,fromId,from,toId=fromId,to) {
  await source.locator('.word-reader-content').evaluate((root,{fromId,from,toId,to})=>{
    const point=(id,offset)=>{const block=root.querySelector(`[data-word-paragraph="${id}"]`),walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);let cursor=0,node,last;while((node=walker.nextNode())){last=node;if(cursor+node.length>=offset)return {node,offset:offset-cursor};cursor+=node.length;}if(last)return {node:last,offset:last.length};throw new Error('缺少可选中的正文');};
    const a=point(fromId,from),b=point(toId,to);root.focus();const range=document.createRange();range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);const box=range.getBoundingClientRect();root.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:box.left+2,clientY:box.bottom}));
  },{fromId,from,toId,to});
}
export async function runWordScenario({page,source,workspace,store,wordPath,pdfPath,exportsPath,root,useElectron,selectText}) {
  const original=fs.readFileSync(wordPath),pdfOriginal=fs.readFileSync(pdfPath),capture=page.getByRole('dialog',{name:'阅读批注与主题研究'}),comments=source.getByRole('complementary',{name:'文档评论'});
  await source.locator('.word-reader-content h1').filter({hasText:'收入与留存研究'}).waitFor();assert.equal(await source.locator('.word-reader-content table').count(),1);await source.locator('.word-reader-content img').waitFor();
  const save=async text=>{await comments.getByRole('textbox',{name:'文档评论草稿'}).fill(text);await comments.getByRole('button',{name:'保存评论',exact:true}).click();await comments.getByRole('textbox',{name:'文档评论草稿'}).waitFor({state:'detached'});};
  const close=async()=>{if(await comments.count())await comments.getByRole('button',{name:'收起评论列表'}).click();};
  await selectWord(source,'p-00000002',2,'p-00000002',14);await capture.getByRole('button',{name:'评论',exact:true}).click();await save('Word 跨格式选段评论');await close();
  await source.locator('.word-annotation-text').first().click();await capture.getByRole('button',{name:'加入主题研究',exact:true}).click();
  await capture.getByRole('textbox',{name:'搜索或新建研究主题'}).fill('Word直接批注研究');await capture.getByRole('button',{name:'新建主题《Word直接批注研究》',exact:true}).click();await capture.getByRole('button',{name:'加入 1 个主题',exact:true}).click();
  await capture.getByRole('button',{name:'关闭批注工具'}).click();await source.getByRole('button',{name:'打开《Word直接批注研究》',exact:true}).click();await workspace.locator('.research-note').waitFor();
  const topic=(await store.handle({action:'list'})).topics.find(item=>item.title==='Word直接批注研究');assert.equal(topic.industry,'算力芯片');
  await close();
  await selectWord(source,'p-00000002',0,'p-00000003',10);await capture.getByRole('button',{name:'评论',exact:true}).click();await save('跨段落的评论');await close();
  await source.locator('.word-reader-content img').click();await capture.locator('img[alt="选中的图表区域"]').waitFor();await capture.getByRole('button',{name:'评论',exact:true}).click();await save('Word 图表评论');await close();
  await source.getByRole('button',{name:'新增评论',exact:true}).click();await save('Word 整篇研究评论');
  await source.getByRole('button',{name:'评论 4',exact:true}).waitFor();await comments.getByRole('button',{name:'定位评论 4',exact:true}).click();await source.locator('.word-annotation-image.research-target').waitFor();
  await source.getByRole('button',{name:'下一条评论',exact:true}).click();assert.equal(await source.getByLabel('评论导航位置').innerText(),'1 / 4');
  await source.getByRole('button',{name:'下一条评论',exact:true}).click();await source.locator('.word-annotation-text.research-target').first().waitFor();
  await close();await selectWord(source,'p-00000003',0,'p-00000003',10);await capture.getByRole('button',{name:'引用提问',exact:true}).click();assert.equal(await page.evaluate(()=>window.__documentQuestions.at(-1).path),wordPath);assert.equal(await page.evaluate(()=>window.__documentQuestions.at(-1).text),'客户续费仍需核实。');
  await workspace.locator('.research-note').first().getByRole('button',{name:/中文 Word 材料/}).click();await workspace.locator('.research-source .word-annotation-text').first().waitFor();await workspace.getByRole('button',{name:'关闭来源',exact:true}).click();
  await source.getByRole('button',{name:'导出带批注副本',exact:true}).click();await source.getByRole('status').filter({hasText:'已导出 4 条批注'}).waitFor();
  const exported=fs.readFileSync(path.join(exportsPath,'annotated.docx')),zip=await wordPackage(exported);assert.equal(descendants(await xmlPart(zip,'word/comments.xml'),'comment').length,5);assert.equal((await parseWord(exported)).text,(await parseWord(original)).text);
  const changed=await wordPackage(original),oldXml=await changed.file('word/document.xml').async('string');changed.file('word/document.xml',oldXml.replace('客户续费仍需核实。','客户续费口径已经调整。'));fs.writeFileSync(wordPath,await changed.generateAsync({type:'nodebuffer'}));
  await selectWord(source,'p-00000003',0,'p-00000003',9);await capture.getByRole('button',{name:'评论',exact:true}).click();await source.getByRole('alert').filter({hasText:'原文已变化'}).waitFor();assert.equal((await store.handle({action:'source',path:wordPath})).annotations.length,4,'不能将旧选段绑定到新 Word 版本');
  await source.getByRole('button',{name:'导出带批注副本',exact:true}).click();await source.getByRole('alert').filter({hasText:'来源版本已变化'}).waitFor();
  fs.writeFileSync(wordPath,original);await source.getByRole('button',{name:'新增评论',exact:true}).click();await comments.getByRole('textbox',{name:'文档评论草稿'}).waitFor();await comments.getByRole('button',{name:'取消',exact:true}).click();await close();
  await page.reload({waitUntil:'networkidle'});await source.getByRole('button',{name:'评论 4',exact:true}).waitFor();await source.getByRole('button',{name:'上一条评论',exact:true}).click();await source.locator('.word-annotation-image.research-target').waitFor();
  if(!useElectron){fs.mkdirSync(path.join(root,'output'),{recursive:true});await page.screenshot({path:path.join(root,'output','word-annotations-preview.png'),fullPage:true});}
  await page.getByRole('button',{name:'阅读 PDF',exact:true}).click();await source.locator('.textLayer span').filter({hasText:'Subscription revenue'}).waitFor({timeout:30_000});await selectText(source.locator('.textLayer').first(),'Subscription revenue rose 25 percent.',true);await capture.getByRole('button',{name:'评论',exact:true}).click();await save('导出 PDF 的中文评论');
  await source.getByRole('button',{name:'导出带批注副本',exact:true}).click();await source.getByRole('status').filter({hasText:'已导出 1 条批注'}).waitFor();const pdf=await PDFDocument.load(fs.readFileSync(path.join(exportsPath,'annotated.pdf'))),annots=pdf.getPages()[0].node.lookup(PDFName.of('Annots'),PDFArray);assert.equal(annots.size(),1);assert.equal(annots.lookup(0,PDFDict).lookup(PDFName.of('Contents')).decodeText(),'导出 PDF 的中文评论');
  const rect=annots.lookup(0,PDFDict).lookup(PDFName.of('Rect'),PDFArray).asArray().map(item=>item.asNumber());
  await page.evaluate(()=>window.__showExportedPdf());await source.locator('.textLayer span').filter({hasText:'Subscription revenue'}).waitFor({timeout:30_000});
  assert.equal(await source.locator('.research-pdf-mark').count(),0,'新副本没有 Domi 的叠加层，必须验证写入文件的原生高亮');
  const yellow=await source.locator('[data-pdf-page="1"] canvas').evaluate((canvas,rect)=>{const scale=canvas.width/540,data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let count=0;for(let y=Math.ceil((720-rect[3])*scale);y<(720-rect[1])*scale;y++)for(let x=Math.ceil(rect[0]*scale);x<rect[2]*scale;x++){const i=(y*canvas.width+x)*4;if(data[i]>220&&data[i+1]>170&&data[i+2]<220)count++;}return count;},rect);assert.ok(yellow>20,'原生 PDF 高亮必须直接显示在渲染出的页面上');
  if(!useElectron)await page.screenshot({path:path.join(root,'output','word-exported-pdf-preview.png'),fullPage:true});
  assert.deepEqual(fs.readFileSync(wordPath),original);assert.deepEqual(fs.readFileSync(pdfPath),pdfOriginal);
  console.log('Word UI: direct DOCX table/image/format preview, cross-run and multi-paragraph comments, image and document comments, ordered navigation, topic collection/back-link, quote question, restart recovery, native Word/PDF annotated-copy export and unchanged originals passed.');
}
