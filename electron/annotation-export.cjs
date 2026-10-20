const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {PDFDocument,PDFName,PDFHexString,PDFString}=require('pdf-lib');
const {W,R,xml,xmlPart,readWordFile,digest,elements,descendants,visibleText,XMLSerializer}=require('./word-document.cjs');
function verifyVersions(annotations,version) {
  const stale=annotations.filter(item=>item.kind!=='document'&&item.sourceVersion!==version);
  if(stale.length)throw new Error(`${stale.length} 条批注的来源版本已变化，请先核对或移除旧批注，再导出副本。`);
}
async function exportPdfAnnotations(bytes,annotations) {
  verifyVersions(annotations,digest(bytes));
  const pdf=await PDFDocument.load(bytes,{updateMetadata:false}),pages=pdf.getPages(),context=pdf.context;
  for(const annotation of annotations) {
    const targets=annotation.kind==='document'?[{page:1,rects:[]}]:annotation.anchor.pages;
    if(!targets?.length)throw new Error('PDF 批注缺少页码，未导出不完整的副本。');
    for(const target of targets) {
      const page=pages[target.page-1];if(!page)throw new Error('PDF 批注指向不存在的页面。');
      const rects=target.rects.map(rect=>[Math.min(rect[0],rect[2]),Math.min(rect[1],rect[3]),Math.max(rect[0],rect[2]),Math.max(rect[1],rect[3])]);
      if(annotation.kind!=='document'&&(!rects.length||rects.some(rect=>rect.some(n=>!Number.isFinite(n))||rect[2]<=rect[0]||rect[3]<=rect[1])))throw new Error('PDF 批注坐标无效。');
      const box=rects.length?[Math.min(...rects.map(r=>r[0])),Math.min(...rects.map(r=>r[1])),Math.max(...rects.map(r=>r[2])),Math.max(...rects.map(r=>r[3]))]:[page.getCropBox().x+12,page.getCropBox().y+page.getCropBox().height-36,page.getCropBox().x+36,page.getCropBox().y+page.getCropBox().height-12];
      const subtype=annotation.kind==='document'?'Text':annotation.kind==='region'?'Square':'Highlight';
      const comment=annotation.comment || (annotation.kind==='region'?'图表摘录':'文字高亮');
      const entry={Type:'Annot',Subtype:subtype,Rect:box,T:PDFHexString.fromText('Domi'),Contents:PDFHexString.fromText(comment),
        NM:PDFString.of(`domi-${annotation.id}-${target.page}`),M:PDFString.fromDate(new Date(annotation.updatedAt)),F:4,C:[1,.78,.15]};
      const width=box[2]-box[0],height=box[3]-box[1];
      let drawing;
      if(subtype==='Highlight') {
        entry.QuadPoints=rects.flatMap(r=>[r[0],r[3],r[2],r[3],r[0],r[1],r[2],r[1]]);entry.CA=.35;
        drawing=`q /GS gs 1 0.82 0.2 rg ${rects.map(r=>`${r[0]-box[0]} ${r[1]-box[1]} ${r[2]-r[0]} ${r[3]-r[1]} re f`).join('\n')} Q`;
      } else if(subtype==='Square') {
        entry.BS={W:1.5,S:'S'};drawing=`q 1 0.65 0 RG 1.5 w 0.75 0.75 ${Math.max(.1,width-1.5)} ${Math.max(.1,height-1.5)} re S Q`;
      } else {entry.Name='Comment';entry.Open=false;drawing=`q 1 0.85 0.25 rg 0 0 ${width} ${height} re f 0.5 0.4 0.1 RG 1 w 3 5 m 20 5 l 3 10 m 20 10 l 3 15 m 20 15 l S Q`;}
      const appearance=context.flateStream(drawing,{Type:'XObject',Subtype:'Form',BBox:[0,0,width,height],Resources:{ExtGState:{GS:{Type:'ExtGState',ca:.35,CA:.35}}}});
      entry.AP={N:context.register(appearance)};
      page.node.addAnnot(context.register(context.obj(entry)));
    }
  }
  return Buffer.from(await pdf.save());
}
function wElement(document,name,attributes={}) {
  const node=document.createElementNS(W,`w:${name}`);for(const [name,value] of Object.entries(attributes))node.setAttributeNS(W,`w:${name}`,String(value));return node;
}
function mainRuns(paragraph) {
  return descendants(paragraph,'r').filter(run=>{
    for(let parent=run.parentNode;parent&&parent!==paragraph;parent=parent.parentNode)if(['del','moveFrom','p','drawing','txbxContent'].includes(parent.localName))return false;
    return true;
  });
}
function splitRun(run,offset) {
  const left=run.cloneNode(false),right=run.cloneNode(false);let consumed=0;
  for(const node of elements(run)) {
    if(node.localName==='rPr'){left.appendChild(node.cloneNode(true));right.appendChild(node.cloneNode(true));continue;}
    const text=visibleText(node),end=consumed+text.length;
    if(text.length&&offset>consumed&&offset<end) {
      if(node.localName!=='t')throw new Error('此 Word 选段跨越了暂不支持拆分的对象，原件保持不变。');
      for(const [part,value] of [[left,text.slice(0,offset-consumed)],[right,text.slice(offset-consumed)]]) {
        const clone=node.cloneNode(false);clone.setAttribute('xml:space','preserve');clone.appendChild(run.ownerDocument.createTextNode(value));part.appendChild(clone);
      }
    } else (end<=offset?left:right).appendChild(node.cloneNode(true));
    consumed=end;
  }
  const parent=run.parentNode;parent.insertBefore(left,run);parent.replaceChild(right,run);return right;
}
function boundaryAt(paragraph,offset) {
  let cursor=0;const runs=mainRuns(paragraph);
  for(const run of runs) {
    const size=visibleText(run).length;
    if(offset===cursor)return {parent:run.parentNode,before:run};
    if(offset>cursor&&offset<cursor+size){const right=splitRun(run,offset-cursor);return {parent:right.parentNode,before:right};}
    cursor+=size;
  }
  if(offset!==cursor)throw new Error('Word 批注位置与原文不一致。');
  const last=runs.at(-1);return last?{parent:last.parentNode,before:last.nextSibling}:{parent:paragraph,before:null};
}
async function exportWordAnnotations(file,annotations,options={}) {
  const value=await readWordFile(file,{...options,includeHtml:false});verifyVersions(annotations,value.version);
  const {zip,document,blocks}=value,byId=new Map(blocks.map(item=>[item.id,item]));
  let comments=await xmlPart(zip,'word/comments.xml',true);
  if(!comments)comments=xml(`<?xml version="1.0" encoding="UTF-8"?><w:comments xmlns:w="${W}"/>`);
  const existing=descendants(comments,'comment').map(node=>Number(node.getAttributeNS(W,'id'))).filter(Number.isFinite);
  let nextId=Math.max(-1,...existing)+1;const events=new Map(),highlights=[];
  const addEvent=(block,offset,node,rank)=>{const list=events.get(block)||[];list.push({offset,node,rank});events.set(block,list);};
  for(const annotation of annotations) {
    const commentId=nextId++,comment=wElement(comments,'comment',{id:commentId,author:'Domi',date:new Date(annotation.createdAt).toISOString(),initials:'D'});
    for(const line of (annotation.comment || (annotation.kind==='region'?'图表摘录':'文字高亮')).split(/\r?\n/)) {
      const paragraph=wElement(comments,'p'),run=wElement(comments,'r'),text=wElement(comments,'t');text.setAttribute('xml:space','preserve');text.appendChild(comments.createTextNode(line));run.appendChild(text);paragraph.appendChild(run);comment.appendChild(paragraph);
    }
    comments.documentElement.appendChild(comment);
    const start=wElement(document,'commentRangeStart',{id:commentId}),end=wElement(document,'commentRangeEnd',{id:commentId});
    const reference=wElement(document,'r'),properties=wElement(document,'rPr');properties.appendChild(wElement(document,'rStyle',{val:'CommentReference'}));reference.appendChild(properties);reference.appendChild(wElement(document,'commentReference',{id:commentId}));
    let first,last,from,to;
    if(annotation.kind==='document') {first=last=blocks[0];from=to=0;}
    else {
      const anchor=annotation.anchor.word;first=byId.get(anchor?.start?.paragraphId);last=byId.get(anchor?.end?.paragraphId);from=anchor?.start?.offset;to=anchor?.end?.offset;
      if(!first||!last||!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>first.text.length||to>last.text.length||first.offset+from>last.offset+to)throw new Error('Word 批注的段落或文字位置无法定位。');
      if(annotation.kind==='text'&&value.text.slice(first.offset+from,last.offset+to)!==annotation.quote)throw new Error('Word 批注摘录与原文不一致。');
      if(annotation.kind==='text')highlights.push({start:first.offset+from,end:last.offset+to});
    }
    if(!first)throw new Error('空白 Word 无法放置批注。');
    if(annotation.kind==='region'&&annotation.anchor.word?.imageId) {
      const blips=descendants(document,'blip'),image=blips.find((node,index)=>`image-${node.getAttributeNS(R,'embed') || node.getAttribute('r:embed')}-${index}`===annotation.anchor.word.imageId);
      let run=image;while(run&&run.localName!=='r')run=run.parentNode;
      if(!run||!first.node.contains(run))throw new Error('Word 图片批注无法定位。');
      run.parentNode.insertBefore(start,run);run.parentNode.insertBefore(reference,run.nextSibling);run.parentNode.insertBefore(end,reference);
    } else {
      // Insert offsets from the end towards the start. Splitting only affected
      // text runs preserves tables, images, links, formatting and prior comments.
      addEvent(first,from,start,1);addEvent(last,to,end,0);addEvent(last,to,reference,2);
    }
  }
  for(const [block,list] of events) {
    const positions=[...new Set(list.map(item=>item.offset))].sort((a,b)=>b-a);
    for(const position of positions) {
      const boundary=boundaryAt(block.node,position);
      // At point comments the start precedes the end and reference.
      const group=list.filter(item=>item.offset===position).sort((a,b)=>a.rank-b.rank);
      const pointIds=new Set(group.filter(item=>item.node.localName==='commentRangeStart').map(item=>item.node.getAttribute('w:id')));
      group.sort((a,b)=>{
        const pointA=pointIds.has(a.node.getAttribute('w:id'))&&a.node.localName==='commentRangeStart';
        const pointB=pointIds.has(b.node.getAttribute('w:id'))&&b.node.localName==='commentRangeStart';return Number(pointB)-Number(pointA)||a.rank-b.rank;
      });
      for(const item of group)boundary.parent.insertBefore(item.node,boundary.before);
    }
  }
  for(const block of blocks) {
    let position=block.offset;
    for(const run of mainRuns(block.node)) {
      const size=visibleText(run).length,end=position+size;
      if(size&&highlights.some(range=>range.start<=position&&range.end>=end)) {
        let props=elements(run).find(node=>node.localName==='rPr');if(!props){props=wElement(document,'rPr');run.insertBefore(props,run.firstChild);}
        if(!elements(props).some(node=>node.localName==='highlight'))props.appendChild(wElement(document,'highlight',{val:'yellow'}));
      }
      position=end;
    }
  }
  const relationships=await xmlPart(zip,'word/_rels/document.xml.rels',true)||xml('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
  const relNodes=elements(relationships.documentElement),commentType=`${R}/comments`;
  const previous=relNodes.find(node=>node.getAttribute('Type')===commentType);
  if(previous&&previous.getAttribute('Target')!=='comments.xml')throw new Error('此 Word 使用非标准评论部件路径，暂不导出以免破坏已有批注。');
  if(!previous){const used=new Set(relNodes.map(node=>node.getAttribute('Id')));let id='domiComments';while(used.has(id))id+='X';const rel=relationships.createElementNS(relationships.documentElement.namespaceURI,'Relationship');for(const [key,value]of Object.entries({Id:id,Type:commentType,Target:'comments.xml'}))rel.setAttribute(key,value);relationships.documentElement.appendChild(rel);}
  const contentTypes=await xmlPart(zip,'[Content_Types].xml');
  if(!elements(contentTypes.documentElement).some(node=>node.getAttribute('PartName')==='/word/comments.xml')){const type=contentTypes.createElementNS(contentTypes.documentElement.namespaceURI,'Override');type.setAttribute('PartName','/word/comments.xml');type.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml');contentTypes.documentElement.appendChild(type);}
  const serializer=new XMLSerializer();
  for(const [name,part]of [['word/document.xml',document],['word/comments.xml',comments],['word/_rels/document.xml.rels',relationships],['[Content_Types].xml',contentTypes]])zip.file(name,serializer.serializeToString(part));
  return zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
}
function writeAnnotatedCopy(target,source,bytes) {
  const canonical=fs.realpathSync(source),resolved=path.resolve(target);
  const key=value=>process.platform==='win32'?value.toLowerCase():value;
  if(key(resolved)===key(canonical)||(fs.existsSync(resolved)&&key(fs.realpathSync(resolved))===key(canonical)))throw new Error('请另存为带批注副本，不能覆盖原始文件。');
  const temporary=`${resolved}.${crypto.randomUUID()}.tmp`;
  try {fs.writeFileSync(temporary,bytes,{flag:'wx'});fs.renameSync(temporary,resolved);}finally{fs.rmSync(temporary,{force:true});}
  return resolved;
}
module.exports={exportPdfAnnotations,exportWordAnnotations,writeAnnotatedCopy,verifyVersions};
