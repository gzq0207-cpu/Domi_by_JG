const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {normalizeLocalDocumentResource}=require('./document-resource.cjs');
const {readWordFile,wordView}=require('./word-document.cjs');
const {exportPdfAnnotations,exportWordAnnotations,writeAnnotatedCopy}=require('./annotation-export.cjs');
const stamp=annotations=>crypto.createHash('sha256').update(JSON.stringify(annotations)).digest('hex');
function createDocumentAnnotationService({getStore,allowedPaths,cacheDir,chooseSave}) {
  const options=()=>({cacheDir:typeof cacheDir==='function'?cacheDir():cacheDir});
  return {
    async readWord(request) {
      try {
        const resource=normalizeLocalDocumentResource(request?.resource);
        if(!resource||!['.docx','.doc'].includes(resource.extension))throw new Error('请选择 Word 文档。');
        const file=path.isAbsolute(resource.path)?resource.path:request.basePath&&path.isAbsolute(request.basePath)?path.resolve(path.dirname(request.basePath),resource.path):'';
        if(!file)throw new Error('Word 文件需要有效的绝对路径。');
        const resolved=fs.realpathSync(file),document=await readWordFile(resolved,options());allowedPaths.add(resolved);
        return {ok:true,document:wordView(document)};
      }catch(error){return {ok:false,error:error.message || String(error)};}
    },
    async exportAnnotated(request,owner) {
      try {
        const store=getStore(),current=await store.handle({action:'source',path:request?.path});
        if(!current.ok)throw new Error(current.error);
        if(!['pdf','word'].includes(current.source.kind))throw new Error('带批注副本仅支持 PDF 和 Word。');
        if(current.source.version!==request.expectedVersion)throw new Error('来源版本已变化，请重新打开文档后导出。');
        const annotations=current.annotations || [];if(!annotations.length)throw new Error('此文档还没有可导出的批注。');
        const unlocated=annotations.filter(item=>item.kind!=='document'&&item.sourceVersion!==current.source.version);
        if(unlocated.length&&!request.preserveUnlocated)return {ok:false,unlocatedCount:unlocated.length,error:`${unlocated.length} 条批注的来源版本已变化，不能把旧位置写入新文档。可将这些批注保留为整篇文档评论后导出。`};
        const notes=annotations.map(item=>unlocated.includes(item)?{...item,kind:'document',quote:'',anchor:{quote:''},comment:['【原文已变化，此批注未定位到新文档】',item.quote?`旧版摘录：${item.quote}`:'旧版图表／高亮位置已失效。',item.comment,item.imagePath?'图表截图仍保留在 Domi 原批注中。':''].filter(Boolean).join('\n\n')}:item);
        const snapshot=stamp(annotations),extension=current.source.kind==='pdf'?'.pdf':'.docx',source=current.source.path;
        const choice=await chooseSave({title:'导出带批注副本',defaultPath:path.join(path.dirname(source),`${path.basename(source,path.extname(source))}-带批注${extension}`),filters:[{name:extension==='.pdf'?'PDF 文档':'Word 文档',extensions:[extension.slice(1)]}]},owner);
        if(choice.canceled||!choice.filePath)return {ok:true,canceled:true};
        if(path.extname(choice.filePath).toLowerCase()!==extension)throw new Error(`副本文件需要使用 ${extension} 扩展名。`);
        const bytes=current.source.kind==='pdf'?await exportPdfAnnotations(fs.readFileSync(source),notes):await exportWordAnnotations(source,notes,options());
        const latest=await store.handle({action:'source',path:source});
        if(!latest.ok||latest.source.version!==current.source.version||stamp(latest.annotations || [])!==snapshot)throw new Error('导出期间文档或评论发生变化，请重试；原件未修改。');
        return {ok:true,path:writeAnnotatedCopy(choice.filePath,source,bytes),count:annotations.length,unlocatedCount:unlocated.length};
      }catch(error){return {ok:false,error:error.message || String(error)};}
    }
  };
}
module.exports={createDocumentAnnotationService};
