const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');
const run = promisify(execFile);
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const local = node => node.localName || node.nodeName?.split(':').at(-1);
const elements = node => Array.from(node?.childNodes || []).filter(child=>child.nodeType===1);
const descendants = (node,name) => node?.getElementsByTagNameNS ? Array.from(node.getElementsByTagNameNS('*',name)) : [];
const child = (node,name) => elements(node || {}).find(item=>local(item)===name);
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EMU_PER_PX = 9525;
const MAX_FILE_BYTES = 64*1024*1024;
const MAX_SLIDES = 500;
const MAX_IMAGE_BYTES = 12*1024*1024;
const MAX_IMAGE_TOTAL = 40*1024*1024;
const SLIDE_PART_PATTERN = /^ppt\/slides\/[\w\- .]+\.xml$/i;
const MEDIA_PART_PATTERN = /^ppt\/[\w\- .\/]+\.(?:png|jpe?g|gif|webp)$/i;

function xml(text) {
  if (typeof text!=='string' || text.length>24*1024*1024 || /<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('PPT XML 无效或过大。');
  const issues=[];
  const document=new DOMParser({onError:(_level,message)=>issues.push(message)}).parseFromString(text,'application/xml');
  if(issues.length || !document.documentElement) throw new Error('PPT XML 已损坏。');
  return document;
}
async function presentationPackage(bytes) {
  if(bytes.length>MAX_FILE_BYTES) throw new Error('PPT 文件超过 64 MB，暂不支持预览。');
  const zip=await JSZip.loadAsync(bytes);
  const files=Object.values(zip.files);
  if(files.length>6000 || files.some(file=>(file._data?.uncompressedSize || 0)>64*1024*1024)
    || files.reduce((sum,file)=>sum+(file._data?.uncompressedSize || 0),0)>160*1024*1024) throw new Error('PPT 压缩包解压大小超过上限。');
  if(!zip.file('ppt/presentation.xml')) throw new Error('所选文件不是有效的 PPTX 演示文稿。');
  return zip;
}
async function xmlPart(zip,name,optional=false) {
  const entry=zip.file(name); if(!entry) {if(optional)return null;throw new Error(`PPT 缺少 ${name}`);}
  return xml(await entry.async('string'));
}
// Relationship targets are relative to the part that owns the rels file. All
// resolved parts must stay inside ppt/; ../ traversal or absolute targets are
// rejected so a crafted deck cannot pull arbitrary zip entries or exfil.
function resolvePart(baseDir,target) {
  if (typeof target!=='string' || !target || /^https?:\/\//i.test(target)) return '';
  const joined=path.posix.normalize(path.posix.join(baseDir,target));
  return joined.startsWith('ppt/') && !joined.split('/').includes('..') && !joined.includes('\\') ? joined : '';
}
function relationships(document) {
  const rels=new Map();
  for(const rel of elements(document?.documentElement || {})) rels.set(rel.getAttribute('Id'),{target:rel.getAttribute('Target'),external:rel.getAttribute('TargetMode')==='External'});
  return rels;
}
function placeholderType(node) {
  return descendants(node,'ph')[0]?.getAttribute('type') || descendants(node,'ph')[0]?.getAttribute('idx') || '';
}
function shapeTransform(node) {
  const xfrm=descendants(node,'xfrm')[0];
  const off=child(xfrm,'off'),ext=child(xfrm,'ext');
  const x=Number(off?.getAttribute('x'))||0, y=Number(off?.getAttribute('y'))||0;
  const cx=Number(ext?.getAttribute('cx'))||0, cy=Number(ext?.getAttribute('cy'))||0;
  return {x,y,cx,cy};
}
function paragraphText(node) {
  return elements(node).map(item=>{
    const name=local(item);
    if(name==='br') return '\n';
    if(name==='t'||name==='fld') return item.textContent || '';
    return paragraphText(item);
  }).join('');
}
function runStyle(node) {
  const props=child(node,'rPr')||child(node,'defRPr'); if(!props) return '';
  const css=[];
  if(['1','true'].includes(props.getAttribute('b'))) css.push('font-weight:700');
  if(['1','true'].includes(props.getAttribute('i'))) css.push('font-style:italic');
  if(props.getAttribute('u')==='sng') css.push('text-decoration:underline');
  const size=Number(props.getAttribute('sz')); if(size>=100&&size<=40000) css.push(`font-size:${Math.round(size)/100}pt`);
  const color=descendants(props,'srgbClr')[0]?.getAttribute('val'); if(/^[\da-f]{6}$/i.test(color||'')) css.push(`color:#${color}`);
  return css.join(';');
}
// Renders one text body (shape or table cell) as a sequence of <p> blocks.
// Every dynamic value is either numerically constrained or escaped; the CSS
// only contains hand-written declarations plus those sanitized fragments.
function renderParagraphs(txBody) {
  const out=[];
  for(const paragraph of descendants(txBody,'p')) {
    const props=child(paragraph,'pPr');
    const level=Math.min(9,Number(props?.getAttribute('lvl'))||0);
    const align={l:'left',ctr:'center',r:'right',just:'justify'}[props?.getAttribute('algn')] || 'left';
    const runs=[];
    for(const item of elements(paragraph)) {
      const name=local(item);
      if(name==='r') {
        const text=item.textContent || '';
        if(text) runs.push(`<span style="${runStyle(item)}">${escape(text)}</span>`);
      } else if(name==='br') runs.push('<br />');
      else if(name==='fld') {
        const text=item.textContent || '';
        if(text) runs.push(`<span>${escape(text)}</span>`);
      }
    }
    out.push(`<p style="text-align:${align};margin:0 0 0.35em ${level*1.6}em">${runs.join('') || '&nbsp;'}</p>`);
  }
  return out.join('');
}
function positionStyle(transform,slideCx,slideCy) {
  const percent=(value,basis)=>basis>0?Math.round((Math.max(0,value)/basis)*10000)/100:0;
  return `left:${percent(transform.x,slideCx)}%;top:${percent(transform.y,slideCy)}%;width:${percent(transform.cx,slideCx)}%;height:${percent(transform.cy,slideCy)}%;`;
}
function renderTable(frame) {
  const table=descendants(frame,'tbl')[0]; if(!table) return '';
  const rows=[];
  for(const row of descendants(table,'tr')) {
    const cells=[];
    for(const cell of descendants(row,'tc')) cells.push(`<td>${renderParagraphs(cell)}</td>`);
    if(cells.length) rows.push(`<tr>${cells.join('')}</tr>`);
  }
  if(!rows.length) return '';
  const cols=descendants(table,'gridCol').length;
  return `<table style="width:100%;border-collapse:collapse;table-layout:fixed;${cols?`grid-template-columns:repeat(${Math.min(20,cols)},1fr);`:''}">${rows.join('')}</table>`;
}
async function renderImage(pic,rels,zip,state) {
  const blip=descendants(pic,'blip')[0];
  const relId=blip?.getAttributeNS(R,'embed') || blip?.getAttribute('r:embed');
  const rel=relId?rels.get(relId):null;
  const media=rel&&!rel.external?resolvePart('ppt/slides',rel.target):'';
  if(!media||!MEDIA_PART_PATTERN.test(media)||!zip.file(media)) return '<span class="ppt-object-placeholder">[图片无法预览]</span>';
  const data=await zip.file(media).async('nodebuffer'); state.imageBytes+=data.length;
  if(data.length>MAX_IMAGE_BYTES||state.imageBytes>MAX_IMAGE_TOTAL) throw new Error('PPT 图片超过预览上限。');
  const mime=/\.png$/i.test(media)?'image/png':/\.gif$/i.test(media)?'image/gif':/\.webp$/i.test(media)?'image/webp':'image/jpeg';
  return `<img src="data:${mime};base64,${data.toString('base64')}" alt="幻灯片图片" />`;
}
async function parsePresentation(bytes,{includeHtml=true}={}) {
  const zip=await presentationPackage(bytes);
  const presentation=await xmlPart(zip,'ppt/presentation.xml');
  const presRels=relationships(await xmlPart(zip,'ppt/_rels/presentation.xml.rels',true));
  const sldSz=descendants(presentation,'sldSz')[0];
  // 幻灯片原始 EMU 尺寸：位置百分比用它计算，像素尺寸只用于前端缩放。
  const slideCx=Number(sldSz?.getAttribute('cx'))||9600000;
  const slideCy=Number(sldSz?.getAttribute('cy'))||5400000;
  const width=Math.round(slideCx/EMU_PER_PX)||960;
  const height=Math.round(slideCy/EMU_PER_PX)||540;
  // Slide order comes from the sldIdLst relationships, never from file names.
  const targets=descendants(presentation,'sldId').map(node=>{
    const relId=node.getAttributeNS(R,'id')||node.getAttribute('r:id');
    const rel=relId?presRels.get(relId):null;
    return rel&&!rel.external?resolvePart('ppt',rel.target):'';
  }).filter(target=>SLIDE_PART_PATTERN.test(target)&&zip.file(target)).slice(0,MAX_SLIDES);
  const state={imageBytes:0};
  const slides=[];
  for(let index=0;index<targets.length;index+=1) {
    const part=targets[index], slide=await xmlPart(zip,part);
    const rels=relationships(await xmlPart(zip,`ppt/slides/_rels/${path.posix.basename(part)}.rels`,true));
    const shapes=descendants(slide,'sp');
    let title='';
    const htmlParts=[];
    if(includeHtml) {
      for(const frame of descendants(slide,'graphicFrame')) {
        const table=renderTable(frame);
        if(table) htmlParts.push(`<div class="ppt-shape ppt-table" style="${positionStyle(shapeTransform(frame),slideCx,slideCy)}">${table}</div>`);
      }
      for(const pic of descendants(slide,'pic')) {
        htmlParts.push(`<div class="ppt-shape ppt-picture" style="${positionStyle(shapeTransform(pic),slideCx,slideCy)}">${await renderImage(pic,rels,zip,state)}</div>`);
      }
      for(const shape of shapes) {
        const txBody=child(shape,'txBody'); if(!txBody) continue;
        const content=renderParagraphs(txBody); if(!content) continue;
        const type=placeholderType(shape);
        const heading=['title','ctrTitle'].includes(type);
        if(heading&&!title) title=paragraphText(txBody).trim();
        const vertical=descendants(child(shape,'bodyPr')||{}, 'anchor')[0]?.getAttribute('val');
        const css=positionStyle(shapeTransform(shape),slideCx,slideCy)
          +(heading?'font-weight:700;':'')
          +(['t','ctr','b'].includes(vertical||'')?`align-items:${vertical==='t'?'flex-start':vertical==='b'?'flex-end':'center'};display:flex;flex-direction:column;justify-content:${vertical==='t'?'flex-start':vertical==='b'?'flex-end':'center'};`:'');
        htmlParts.push(`<div class="ppt-shape${heading?' ppt-title':''}" style="${css}">${content}</div>`);
      }
    } else {
      const titled=shapes.find(shape=>['title','ctrTitle'].includes(placeholderType(shape)));
      title=paragraphText(child(titled,'txBody')).trim();
    }
    const text=shapes.map(shape=>paragraphText(child(shape,'txBody'))).filter(Boolean).join('\n');
    slides.push({id:`s-${index+1}`,number:index+1,title,text,html:htmlParts.join('')});
  }
  if(!slides.length) throw new Error('此演示文稿没有可读取的幻灯片。');
  const warnings=['PPT 阅读预览按静态版式渲染文字、表格与图片；动画、图表、SmartArt、母版继承与主题配色可能与 PowerPoint 不同，请以原件为准。'];
  return {zip,width,height,slides,warnings,incomplete:false};
}
async function convertLegacyPresentation(file,{cacheDir=path.join(os.tmpdir(),'domi-ppt-preview'),converter}={}) {
  const input=await fs.promises.readFile(file),version=digest(input);
  await fs.promises.mkdir(cacheDir,{recursive:true});
  const target=path.join(cacheDir,`${version}.pptx`);
  if(fs.existsSync(target)) {try{await presentationPackage(await fs.promises.readFile(target));return target;}catch{await fs.promises.unlink(target);}}
  const work=await fs.promises.mkdtemp(path.join(cacheDir,'convert-'));
  try {
    const staged=path.join(work,'source.ppt'),output=path.join(work,'source.pptx');await fs.promises.writeFile(staged,input);
    if(converter) await converter(staged,output);
    else {
      const candidates=process.platform==='win32'?[path.join(process.env.ProgramFiles || 'C:/Program Files','LibreOffice/program/soffice.exe')]:process.platform==='darwin'?['/Applications/LibreOffice.app/Contents/MacOS/soffice']:['/usr/bin/libreoffice','/usr/bin/soffice'];
      const soffice=candidates.find(candidate=>fs.existsSync(candidate));
      if(soffice) await run(soffice,[`-env:UserInstallation=${require('node:url').pathToFileURL(path.join(work,'profile')).href}`,'--headless','--convert-to','pptx','--outdir',work,staged],{timeout:120_000,windowsHide:true});
      else if(process.platform==='win32') {
        const script=`$ErrorActionPreference='Stop'; $app=$null; $pres=$null; try {$app=New-Object -ComObject PowerPoint.Application; $pres=$app.Presentations.Open($env:DOMI_PPT_INPUT,$true,$false,$false); $pres.SaveAs($env:DOMI_PPT_OUTPUT,24)} finally {if($pres){$pres.Close()};if($app){$app.Quit()};if($pres){[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($pres)};if($app){[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($app)}}`;
        try {await run('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{timeout:120_000,windowsHide:true,env:{...process.env,DOMI_PPT_INPUT:staged,DOMI_PPT_OUTPUT:output}});}
        catch(error) {throw new Error(`旧版 .ppt 转换失败，请使用 PowerPoint 或 LibreOffice 另存为 .pptx 后打开。${error.killed?' 转换已超时。':''}`);}
      } else throw new Error('预览旧版 .ppt 需要本机安装 LibreOffice；也可以先另存为 .pptx。');
    }
    const bytes=await fs.promises.readFile(output);await presentationPackage(bytes);
    const temporary=path.join(cacheDir,`${version}-${crypto.randomUUID()}.tmp`);await fs.promises.writeFile(temporary,bytes);await fs.promises.rename(temporary,target);
    return target;
  } finally {
    const relative=path.relative(cacheDir,work);
    if(!relative.startsWith('convert-')||relative.includes(path.sep))throw new Error('转换临时目录边界无效。');
    await fs.promises.rm(work,{recursive:true,force:true,maxRetries:4,retryDelay:100});
  }
}
async function readPresentationFile(file,options={}) {
  const before=await fs.promises.stat(file);if(!before.isFile()||before.size>MAX_FILE_BYTES)throw new Error('PPT 文件无效或超过 64 MB。');
  const original=await fs.promises.readFile(file),version=digest(original);
  const converted=/\.ppt$/i.test(file),previewPath=converted?await convertLegacyPresentation(file,options):file;
  const parsed=await parsePresentation(converted?await fs.promises.readFile(previewPath):original,{includeHtml:options.includeHtml!==false});
  const after=await fs.promises.stat(file);if(after.size!==before.size||after.mtimeMs!==before.mtimeMs)throw new Error('预览期间 PPT 文件发生变化，请重新打开。');
  return {...parsed,path:file,name:path.basename(file),size:before.size,mtimeMs:before.mtimeMs,version,converted,
    ...(converted?{warnings:['旧版 .ppt 已转换为 PPTX 阅读预览，原文件保持不变。',...parsed.warnings]}:{})};
}
function presentationView(value) {return {path:value.path,name:value.name,size:value.size,mtimeMs:value.mtimeMs,version:value.version,
  width:value.width,height:value.height,slides:value.slides.map(({id,number,title,text,html})=>({id,number,title,text,html})),
  warnings:value.warnings,converted:value.converted};}
module.exports={parsePresentation,presentationPackage,convertLegacyPresentation,readPresentationFile,presentationView,resolvePart,relationships,escape,elements,descendants,child};
