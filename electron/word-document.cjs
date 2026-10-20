const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const JSZip = require('jszip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const run = promisify(execFile);
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const local = node => node.localName || node.nodeName?.split(':').at(-1);
const elements = node => Array.from(node.childNodes || []).filter(child=>child.nodeType===1);
const descendants = (node,name) => Array.from(node.getElementsByTagNameNS('*',name));
const attr = (node,name) => node?.getAttributeNS(W,name) || node?.getAttribute(`w:${name}`) || '';
const child = (node,name) => elements(node || {}).find(item=>local(item)===name);
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function xml(text) {
  if (typeof text!=='string' || text.length>24*1024*1024 || /<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Word XML 无效或过大。');
  const issues=[];
  const document=new DOMParser({onError:(_level,message)=>issues.push(message)}).parseFromString(text,'application/xml');
  if(issues.length || !document.documentElement) throw new Error('Word XML 已损坏。');
  return document;
}
async function wordPackage(bytes) {
  if(bytes.length>64*1024*1024) throw new Error('Word 文件超过 64 MB，暂不支持预览。');
  const zip=await JSZip.loadAsync(bytes);
  const files=Object.values(zip.files);
  if(files.length>6000 || files.some(file=>(file._data?.uncompressedSize || 0)>64*1024*1024)
    || files.reduce((sum,file)=>sum+(file._data?.uncompressedSize || 0),0)>160*1024*1024) throw new Error('Word 压缩包解压大小超过上限。');
  if(!zip.file('word/document.xml')) throw new Error('所选文件不是有效的 DOCX 文档。');
  return zip;
}
async function xmlPart(zip,name,optional=false) {
  const entry=zip.file(name); if(!entry) {if(optional)return null;throw new Error(`Word 缺少 ${name}`);}
  return xml(await entry.async('string'));
}
function visibleText(node) {
  const name=local(node);
  if(['del','moveFrom','pPr','rPr','drawing','object','pict','txbxContent','instrText'].includes(name)) return '';
  if(name==='t') return node.textContent || '';
  if(name==='tab') return '\t';
  if(name==='br'||name==='cr') return '\n';
  if(name==='noBreakHyphen') return '\u2011';
  if(name==='softHyphen') return '\u00ad';
  return elements(node).map(visibleText).join('');
}
function documentBlocks(document) {
  const body=descendants(document,'body')[0]; if(!body)throw new Error('Word 缺少正文。');
  let offset=0; const ids=new Set();
  const blocks=descendants(body,'p').filter(node=>{
    for(let parent=node.parentNode;parent&&parent!==body;parent=parent.parentNode) if(['del','moveFrom','txbxContent'].includes(local(parent)))return false;
    return true;
  }).map((node,index)=>{
    const native=node.getAttribute('w14:paraId'); let id=`p-${/^[\da-f]{8}$/i.test(native)?native:index}`;
    if(ids.has(id))id+=`-${index}`;ids.add(id);
    const text=visibleText(node),value={id,text,offset,node};offset+=text.length+1;return value;
  });
  return {body,blocks,text:blocks.map(item=>item.text).join('\n')};
}
function runStyle(node) {
  const props=child(node,'rPr'); if(!props)return '';
  const css=[];
  for(const [name,rule] of [['b','font-weight:700'],['i','font-style:italic']]) if(child(props,name)&&!['0','false','off'].includes(attr(child(props,name),'val')))css.push(rule);
  const decor=[];if(child(props,'u')&&attr(child(props,'u'),'val')!=='none')decor.push('underline');if(child(props,'strike'))decor.push('line-through');if(decor.length)css.push(`text-decoration:${decor.join(' ')}`);
  const color=attr(child(props,'color'),'val');if(/^[\da-f]{6}$/i.test(color))css.push(`color:#${color}`);
  const highlight=attr(child(props,'highlight'),'val'),colors={yellow:'#fff18d',green:'#a8e997',cyan:'#a0e7eb',magenta:'#e9a1e3',blue:'#a7bbf0',red:'#f0b2a7',lightGray:'#dedede',darkGray:'#aaa'};
  if(colors[highlight])css.push(`background-color:${colors[highlight]}`);
  const size=Number(attr(child(props,'sz'),'val'));if(size>=12&&size<=144)css.push(`font-size:${size/2}pt`);
  const vertical=attr(child(props,'vertAlign'),'val');if(['superscript','subscript'].includes(vertical))css.push(`vertical-align:${vertical==='superscript'?'super':'sub'};font-size:smaller`);
  return css.join(';');
}
async function parseWord(bytes,{includeHtml=true}={}) {
  const zip=await wordPackage(bytes), document=await xmlPart(zip,'word/document.xml');
  const {body,blocks,text}=documentBlocks(document), byNode=new Map(blocks.map(block=>[block.node,block]));
  const warnings=['Word 阅读预览保留正文、表格和图片；复杂分页、浮动排版及域可能与 Word 不同。'];
  const extraParts=Object.keys(zip.files).filter(name=>/^word\/(?:footnotes|endnotes|header\d+|footer\d+)\.xml$/.test(name));
  let incomplete=descendants(document,'altChunk').length>0||descendants(document,'txbxContent').length>0||descendants(document,'oMath').length>0;
  for(const name of extraParts){const part=await xmlPart(zip,name);if(visibleText(part.documentElement).trim())incomplete=true;}
  if(incomplete)warnings.push('此文档含页眉页脚、脚注、文本框、公式或嵌入内容；当前预览／文字提取可能不完整，请用 Word 核对。导出副本会保留原有部件。');
  if(!includeHtml)return {zip,document,blocks,text,warnings,incomplete};
  const relationships=await xmlPart(zip,'word/_rels/document.xml.rels',true), rels=new Map();
  for(const rel of relationships?elements(relationships.documentElement):[]) rels.set(rel.getAttribute('Id'),{target:rel.getAttribute('Target'),external:rel.getAttribute('TargetMode')==='External'});
  const styles=await xmlPart(zip,'word/styles.xml',true), headings=new Map();
  for(const style of styles?descendants(styles,'style'):[]) {
    const name=attr(child(style,'name'),'val'), level=Number(attr(child(child(style,'pPr'),'outlineLvl'),'val'));
    const match=name.match(/(?:heading|标题)\s*(\d)/i);if(match)headings.set(attr(style,'styleId'),Math.min(6,Number(match[1])));
    else if(child(child(style,'pPr'),'outlineLvl')&&level<6)headings.set(attr(style,'styleId'),level+1);
  }
  let imageBytes=0;const imageOrder=new Map(descendants(document,'blip').map((node,index)=>[node,index]));
  async function render(node) {
    const name=local(node);
    if(['del','moveFrom','pPr','rPr','tblPr','tblGrid','trPr','tcPr','sectPr','instrText'].includes(name))return '';
    if(name==='t')return escape(node.textContent || '');
    if(name==='tab')return '\t';if(name==='br'||name==='cr')return '\n';
    if(name==='noBreakHyphen')return '\u2011';if(name==='softHyphen')return '\u00ad';
    if(name==='drawing'||name==='pict') {
      let out='';
      for(const blip of descendants(node,'blip')) {
        const relId=blip.getAttributeNS(R,'embed') || blip.getAttribute('r:embed'),rel=rels.get(relId);
        const file=rel&&!rel.external?path.posix.normalize(path.posix.join('word',rel.target)):'';
        if(!file||file.startsWith('../')||!/^\w[\w/ .-]*\.(png|jpe?g|gif|webp)$/i.test(file)||!zip.file(file)) {out+='<span class="word-object-placeholder">[图片无法预览]</span>';continue;}
        const data=await zip.file(file).async('nodebuffer');imageBytes+=data.length;
        if(data.length>12*1024*1024||imageBytes>40*1024*1024)throw new Error('Word 图片超过预览上限。');
        const mime=/\.png$/i.test(file)?'image/png':/\.gif$/i.test(file)?'image/gif':/\.webp$/i.test(file)?'image/webp':'image/jpeg';
        const cx=Number(descendants(node,'extent')[0]?.getAttribute('cx')),width=cx>0?` style="width:${Math.min(1000,cx/9525)}px"`:'';
        out+=`<img data-word-image="${escape(`image-${relId}-${imageOrder.get(blip)}`)}"${width} src="data:${mime};base64,${data.toString('base64')}" alt="${escape(descendants(node,'docPr')[0]?.getAttribute('descr') || '文档图片')}" />`;
      }
      if(!out)out='<span class="word-object-placeholder">[图形／公式，请用 Word 核对]</span>';
      return out;
    }
    const content=(await Promise.all(elements(node).map(render))).join('');
    if(name==='p') {
      const block=byNode.get(node);if(!block)return '';
      const props=child(node,'pPr'),heading=headings.get(attr(child(props,'pStyle'),'val')),tag=heading?`h${heading}`:'p';
      const align=attr(child(props,'jc'),'val'),indent=Number(attr(child(props,'ind'),'left'));
      const css=[['left','right','center','both'].includes(align)?`text-align:${align==='both'?'justify':align}`:'',indent>0?`padding-left:${Math.min(indent/20,120)}pt`:''].filter(Boolean).join(';');
      const list=child(props,'numPr')?' data-word-list="true"':'';
      return `<${tag} data-word-paragraph="${block.id}" style="${css}"${list}>${content || '<br />'}</${tag}>`;
    }
    if(name==='r')return `<span style="${runStyle(node)}">${content}</span>`;
    if(name==='tbl')return `<table><tbody>${content}</tbody></table>`;
    if(name==='tr')return `<tr>${content}</tr>`;
    if(name==='tc')return `<td colspan="${Math.max(1,Math.min(50,Number(attr(child(child(node,'tcPr'),'gridSpan'),'val'))||1))}">${content}</td>`;
    if(name==='hyperlink')return `<span class="word-hyperlink">${content}</span>`;
    return content;
  }
  return {zip,document,blocks,text,html:await render(body),warnings,incomplete};
}
async function convertLegacyWord(file,{cacheDir=path.join(os.tmpdir(),'domi-word-preview'),converter}={}) {
  const input=await fs.promises.readFile(file),version=digest(input);
  await fs.promises.mkdir(cacheDir,{recursive:true});
  const target=path.join(cacheDir,`${version}.docx`);
  if(fs.existsSync(target)) {try{await wordPackage(await fs.promises.readFile(target));return target;}catch{await fs.promises.unlink(target);}}
  const work=await fs.promises.mkdtemp(path.join(cacheDir,'convert-'));
  try {
    const staged=path.join(work,'source.doc'),output=path.join(work,'source.docx');await fs.promises.writeFile(staged,input);
    if(converter) await converter(staged,output);
    else {
      const candidates=process.platform==='win32'?[path.join(process.env.ProgramFiles || 'C:/Program Files','LibreOffice/program/soffice.exe')]:process.platform==='darwin'?['/Applications/LibreOffice.app/Contents/MacOS/soffice']:['/usr/bin/libreoffice','/usr/bin/soffice'];
      const soffice=candidates.find(candidate=>fs.existsSync(candidate));
      if(soffice) await run(soffice,[`-env:UserInstallation=${require('node:url').pathToFileURL(path.join(work,'profile')).href}`,'--headless','--convert-to','docx','--outdir',work,staged],{timeout:90_000,windowsHide:true});
      else if(process.platform==='win32') {
        const script=`$ErrorActionPreference='Stop'; $word=$null; $document=$null; try {$word=New-Object -ComObject Word.Application; $word.Visible=$false; $word.DisplayAlerts=0; $word.AutomationSecurity=3; $word.Options.UpdateLinksAtOpen=$false; $document=$word.Documents.Open($env:DOMI_WORD_INPUT,$false,$true,$false); $document.SaveAs2($env:DOMI_WORD_OUTPUT,16)} finally {if($document){$document.Close(0)};if($word){$word.Quit()};if($document){[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($document)};if($word){[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)}}`;
        try {await run('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{timeout:90_000,windowsHide:true,env:{...process.env,DOMI_WORD_INPUT:staged,DOMI_WORD_OUTPUT:output}});}
        catch(error) {throw new Error(`旧版 .doc 转换失败，请使用 Word 或 LibreOffice 另存为 .docx 后打开。${error.killed?' 转换已超时。':''}`);}
      } else throw new Error('预览旧版 .doc 需要本机安装 LibreOffice；也可以先另存为 .docx。');
    }
    const bytes=await fs.promises.readFile(output);await wordPackage(bytes);
    const temporary=path.join(cacheDir,`${version}-${crypto.randomUUID()}.tmp`);await fs.promises.writeFile(temporary,bytes);await fs.promises.rename(temporary,target);
    return target;
  } finally {
    const relative=path.relative(cacheDir,work);
    if(!relative.startsWith('convert-')||relative.includes(path.sep))throw new Error('转换临时目录边界无效。');
    await fs.promises.rm(work,{recursive:true,force:true,maxRetries:4,retryDelay:100});
  }
}
async function readWordFile(file,options={}) {
  const before=await fs.promises.stat(file);if(!before.isFile()||before.size>64*1024*1024)throw new Error('Word 文件无效或超过 64 MB。');
  const original=await fs.promises.readFile(file),version=digest(original);
  const converted=/\.doc$/i.test(file),previewPath=converted?await convertLegacyWord(file,options):file;
  const parsed=await parseWord(converted?await fs.promises.readFile(previewPath):original,options);
  const after=await fs.promises.stat(file);if(after.size!==before.size||after.mtimeMs!==before.mtimeMs)throw new Error('预览期间 Word 文件发生变化，请重新打开。');
  return {...parsed,path:file,name:path.basename(file),size:before.size,mtimeMs:before.mtimeMs,version,converted,
    ...(converted?{warnings:['旧版 .doc 已转换为 DOCX 阅读预览，原文件保持不变。',...parsed.warnings]}:{})};
}
function wordView(value) {return {path:value.path,name:value.name,size:value.size,mtimeMs:value.mtimeMs,version:value.version,html:value.html,text:value.text,blocks:value.blocks.map(({id,text,offset})=>({id,text,offset})),warnings:value.warnings,converted:value.converted};}
module.exports={W,R,xml,xmlPart,wordPackage,documentBlocks,visibleText,readWordFile,parseWord,wordView,convertLegacyWord,digest,elements,descendants,attr,child,XMLSerializer};
