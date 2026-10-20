import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {anchorRange} from './document-comments';
import type {ReadingAnnotation,ResearchSelection,WordDocument} from './research-types';
type Props={document:WordDocument;annotations:ReadingAnnotation[];target?:{id:string;nonce:number};initialSearchQuery?:string;onSelection:(selection:ResearchSelection|null)=>void;onAnnotation:(annotation:ReadingAnnotation)=>void;onLocate:(result:{found:boolean;rebased:boolean})=>void};
function textNodes(root:Node) {
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement?.closest('.word-object-placeholder')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const result:Text[]=[];let node;while((node=walker.nextNode()))result.push(node as Text);return result;
}
function offsetWithin(block:HTMLElement,container:Node,offset:number) {
  const range=document.createRange();range.selectNodeContents(block);range.setEnd(container,offset);let total=0;
  for(const node of textNodes(block)) {if(node===container)return total+offset;if(range.comparePoint(node,node.length)===0)total+=node.length;}
  return total;
}
export default function WordResearchReader({document:doc,annotations,target,initialSearchQuery='',onSelection,onAnnotation,onLocate}:Props) {
  const root=useRef<HTMLDivElement>(null),scroll=useRef<HTMLDivElement>(null),searchInput=useRef<HTMLInputElement>(null);
  const [query,setQuery]=useState(initialSearchQuery),[message,setMessage]=useState('');const searchOffset=useRef(-1);
  const callbacks=useRef({onLocate});callbacks.current={onLocate};
  useLayoutEffect(()=>{if(root.current)root.current.innerHTML=doc.html;},[doc.html]);
  useLayoutEffect(()=>{
    const host=root.current;if(!host)return;
    const oldTop=scroll.current?.scrollTop || 0;
    host.querySelectorAll('.word-annotation-text').forEach(mark=>mark.replaceWith(...Array.from(mark.childNodes)));
    host.normalize();host.querySelectorAll('[data-word-image]').forEach(image=>{image.classList.remove('word-annotation-image','research-target');image.removeAttribute('data-reading-annotation');image.removeAttribute('data-reading-annotations');});
    const ranges=annotations.filter(item=>item.kind==='text').flatMap(annotation=>{const range=anchorRange(doc.text,annotation.anchor,annotation.sourceVersion===doc.version);return range?[{...range,annotation}]:[];});
    for(const block of doc.blocks) {
      const element=host.querySelector<HTMLElement>(`[data-word-paragraph="${block.id}"]`);if(!element)continue;
      let cursor=block.offset;
      for(const node of textNodes(element)) {
        const start=cursor,end=start+node.length,text=node.textContent || '';cursor=end;
        const relevant=ranges.filter(range=>range.start<end&&range.end>start);if(!relevant.length)continue;
        const bounds=[...new Set([start,end,...relevant.flatMap(range=>[Math.max(start,range.start),Math.min(end,range.end)])])].sort((a,b)=>a-b),fragment=document.createDocumentFragment();
        for(let index=0;index<bounds.length-1;index++) {
          const a=bounds[index],b=bounds[index+1],cover=relevant.filter(range=>range.start<=a&&range.end>=b),piece=document.createTextNode(text.slice(a-start,b-start));
          if(!cover.length)fragment.append(piece);
          else {const mark=document.createElement('span');mark.className=`reading-mark word-annotation-text${cover.some(range=>range.annotation.id===target?.id)?' research-target':''}`;mark.dataset.readingAnnotation=cover[0].annotation.id;mark.dataset.readingAnnotations=cover.map(range=>range.annotation.id).join(' ');mark.title=cover.map(range=>range.annotation.comment).filter(Boolean).join('\n');mark.append(piece);fragment.append(mark);}
        }
        node.replaceWith(fragment);
      }
    }
    for(const annotation of annotations.filter(item=>item.kind==='region'&&item.sourceVersion===doc.version)) {
      const id=annotation.anchor.word?.imageId,image=id&&host.querySelector<HTMLElement>(`[data-word-image="${CSS.escape(id)}"]`);if(!image)continue;
      image.classList.add('word-annotation-image');if(annotation.id===target?.id)image.classList.add('research-target');image.dataset.readingAnnotation=annotation.id;image.dataset.readingAnnotations=annotation.id;
    }
    if(scroll.current)scroll.current.scrollTop=oldTop;
  },[doc.html,doc.text,doc.version,annotations,target?.id,target?.nonce]);
  useEffect(()=>{
    if(!target||!root.current)return;
    const annotation=annotations.find(item=>item.id===target.id);if(!annotation||annotation.kind==='document')return;
    const element=root.current.querySelector<HTMLElement>(`[data-reading-annotations~="${target.id}"]`);
    element?.scrollIntoView({block:'center'});callbacks.current.onLocate({found:Boolean(element),rebased:annotation.sourceVersion!==doc.version});
  },[target?.id,target?.nonce,annotations,doc.version]);
  function find() {
    const needle=query.trim();if(!needle||!root.current)return;
    const text=doc.text.toLocaleLowerCase(),at=text.indexOf(needle.toLocaleLowerCase(),searchOffset.current+1),offset=at<0?text.indexOf(needle.toLocaleLowerCase()):at;
    searchOffset.current=offset;if(offset<0){setMessage('没有找到匹配文字');return;}
    root.current.querySelectorAll('.word-search-target').forEach(item=>item.classList.remove('word-search-target'));
    const block=doc.blocks.find(item=>item.offset<=offset&&item.offset+item.text.length>=offset),element=block&&root.current.querySelector<HTMLElement>(`[data-word-paragraph="${block.id}"]`);
    element?.classList.add('word-search-target');element?.scrollIntoView({block:'center'});setMessage('已定位匹配段落；再次查找可跳到下一处');
  }
  useEffect(()=>{if(initialSearchQuery){setQuery(initialSearchQuery);searchOffset.current=-1;const at=doc.text.toLocaleLowerCase().indexOf(initialSearchQuery.toLocaleLowerCase()),block=doc.blocks.find(item=>item.offset<=at&&item.offset+item.text.length>=at);if(block){const element=root.current?.querySelector<HTMLElement>(`[data-word-paragraph="${block.id}"]`);element?.scrollIntoView({block:'center'});element?.classList.add('word-search-target');}}},[initialSearchQuery,doc.html]);
  function selection() {
    const native=window.getSelection();if(!native?.rangeCount||native.isCollapsed||!root.current)return;
    const range=native.getRangeAt(0);if(!root.current.contains(range.startContainer)||!root.current.contains(range.endContainer))return;
    const blockFor=(node:Node)=>(node.nodeType===Node.ELEMENT_NODE?node as Element:node.parentElement)?.closest<HTMLElement>('[data-word-paragraph]');
    const startElement=blockFor(range.startContainer),endElement=blockFor(range.endContainer);
    const first=doc.blocks.find(block=>block.id===startElement?.dataset.wordParagraph),last=doc.blocks.find(block=>block.id===endElement?.dataset.wordParagraph);if(!first||!last||!startElement||!endElement)return;
    const from=offsetWithin(startElement,range.startContainer,range.startOffset),to=offsetWithin(endElement,range.endContainer,range.endOffset),offset=first.offset+from,end=last.offset+to,quote=doc.text.slice(offset,end);if(!quote.trim())return;
    const headings=Array.from(root.current.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(item=>item===startElement||Boolean(item.compareDocumentPosition(startElement)&Node.DOCUMENT_POSITION_FOLLOWING));
    const bounds=range.getBoundingClientRect();onSelection({kind:'text',quote,anchor:{quote,offset,documentOffset:offset,prefix:doc.text.slice(Math.max(0,offset-48),offset),suffix:doc.text.slice(end,end+48),heading:headings[headings.length-1]?.textContent || undefined,word:{start:{paragraphId:first.id,offset:from},end:{paragraphId:last.id,offset:to}}},x:bounds.left,y:bounds.bottom});
  }
  function click(event:React.MouseEvent) {
    const element=event.target instanceof Element?event.target:null,mark=element?.closest<HTMLElement>('[data-reading-annotation]');
    if(mark){const annotation=annotations.find(item=>item.id===mark.dataset.readingAnnotation);if(annotation){onAnnotation(annotation);return;}}
    const image=element?.closest<HTMLImageElement>('img[data-word-image]');if(!image)return;
    const paragraph=image.closest<HTMLElement>('[data-word-paragraph]'),block=doc.blocks.find(item=>item.id===paragraph?.dataset.wordParagraph);if(!block)return;
    const canvas=document.createElement('canvas'),ratio=Math.min(1,2000/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));canvas.getContext('2d')?.drawImage(image,0,0,canvas.width,canvas.height);
    const bounds=image.getBoundingClientRect(),point={paragraphId:block.id,offset:0};onSelection({kind:'region',quote:'',anchor:{quote:'',offset:block.offset,documentOffset:block.offset,heading:'文档图片',word:{start:point,end:point,imageId:image.dataset.wordImage}},screenshot:canvas.toDataURL('image/png'),x:bounds.left,y:bounds.bottom});
  }
  return <div className="word-reader" onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.key==='f'){event.preventDefault();searchInput.current?.focus();}}}>
    <div className="research-reader-tools"><strong>Word 阅读</strong><input ref={searchInput} aria-label="搜索 Word" placeholder="搜索文字" value={query} onChange={event=>{setQuery(event.target.value);searchOffset.current=-1;}} onKeyDown={event=>{if(event.key==='Enter')find();}}/><button type="button" onClick={find}>查找下一处</button><span>点击图片可添加图表评论</span></div>
    {doc.warnings.map(warning=><div className="research-status" key={warning}>{warning}</div>)}{message&&<p className="research-status" role="status">{message}</p>}
    <div className="word-reader-scroll" ref={scroll}><div className="word-reader-content" ref={root} tabIndex={0} onMouseUp={selection} onClick={click} /></div>
  </div>;
}
