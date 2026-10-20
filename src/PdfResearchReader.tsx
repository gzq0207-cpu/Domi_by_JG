import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import type { PdfDocument } from './env';
import type { PdfRect, ReadingAnnotation, ResearchSelection } from './research-types';
GlobalWorkerOptions.workerSrc = workerUrl;
type Props = { document: PdfDocument; annotations: ReadingAnnotation[]; onSelection: (selection: ResearchSelection) => void; onAnnotation: (annotation: ReadingAnnotation) => void; targetId?: string; targetPage?: number; targetNonce?: number };
function PdfPage({ pdf, pageNumber, scale, rotation, boxMode, annotations, onSelection, onAnnotation }: {
  pdf: PDFDocumentProxy; pageNumber: number; scale: number; rotation: number; boxMode: boolean;
  annotations: ReadingAnnotation[]; onSelection: Props['onSelection']; onAnnotation: Props['onAnnotation'];
}) {
  const host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), layer = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<PDFPageProxy | null>(null), [visible, setVisible] = useState(false), [error, setError] = useState(''), [ready,setReady] = useState(false);
  const [region, setRegion] = useState<PdfRect | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => { if (!visible) return; let active = true; void pdf.getPage(pageNumber).then(value => { if (active) setPage(value); }).catch(e => { if (active) setError(String(e)); }); return () => { active = false; }; }, [pdf, pageNumber, visible]);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { rootMargin: '700px' });
    observer.observe(host.current); return () => observer.disconnect();
  }, []);
  const viewport = page?.getViewport({ scale, rotation: ((page.rotate + rotation) % 360 + 360) % 360 });
  useEffect(() => {
    setReady(false);
    if (!visible) { if (canvas.current) { canvas.current.width=1; canvas.current.height=1; } layer.current?.replaceChildren(); return; }
    if (!page || !canvas.current || !layer.current || !viewport) return;
    const element = canvas.current, textHost = layer.current;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    element.width = Math.ceil(viewport.width * ratio); element.height = Math.ceil(viewport.height * ratio);
    const context = element.getContext('2d'); if (!context) return;
    const task = page.render({ canvasContext: context, canvas: element, viewport, transform: ratio === 1 ? undefined : [ratio,0,0,ratio,0,0] });
    let active = true; let text: TextLayer | undefined;
    textHost.replaceChildren();
    void task.promise.then(async () => {
      if (active) setReady(true);
      const content = await page.getTextContent(); if (!active) return;
      text = new TextLayer({ textContentSource: content, container: textHost, viewport });
      await text.render();
    }).catch(e => { if (active && e.name !== 'RenderingCancelledException') setError(String(e.message || e)); });
    return () => { active = false; task.cancel(); text?.cancel(); };
  }, [visible, page, scale, rotation]);
  const point = (event: React.PointerEvent) => {
    const rect = host.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)), y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)) };
  };
  return <div className={`research-pdf-page ${boxMode ? 'box-mode' : ''}`} data-pdf-page={pageNumber} ref={host}
    style={{ width: viewport?.width || 600, height: viewport?.height || 800, '--scale-factor': scale } as React.CSSProperties}>
    {error && <div role="alert">{error}</div>}
    <canvas ref={canvas} style={{ width: '100%', height: '100%' }} />
    <div ref={layer} className="textLayer" />
    <div className="research-pdf-marks">
      {viewport && annotations.flatMap(annotation => (annotation.anchor.pages || []).filter(item => item.page === pageNumber).flatMap(item => item.rects.map((rect, index) => {
        const [x1,y1,x2,y2] = viewport.convertToViewportRectangle(rect);
        return <button key={`${annotation.id}-${index}`} type="button" className={`research-pdf-mark ${annotation.kind}`} data-reading-annotation={annotation.id}
          title={annotation.comment || '阅读批注'} aria-label="打开 PDF 批注" onClick={() => onAnnotation(annotation)}
          style={{ left: Math.min(x1,x2), top: Math.min(y1,y2), width: Math.abs(x2-x1), height: Math.abs(y2-y1) }} />;
      })))}
    </div>
    {boxMode && <div className="research-pdf-box-layer" onPointerDown={event => { if (event.button !== 0 || !ready) return; event.preventDefault(); drag.current = point(event); event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={event => { if (drag.current) { const p = point(event); setRegion([drag.current.x,drag.current.y,p.x,p.y]); } }}
      onPointerCancel={() => { drag.current = null; setRegion(null); }}
      onPointerUp={event => {
        const start = drag.current; drag.current = null; setRegion(null);
        if (!start || !viewport || !canvas.current) return;
        const end = point(event), x = Math.min(start.x,end.x), y = Math.min(start.y,end.y), width = Math.abs(end.x-start.x), height = Math.abs(end.y-start.y);
        if (width < 8 || height < 8) return;
        const bitmap = canvas.current, ratioX = bitmap.width / viewport.width, ratioY = bitmap.height / viewport.height;
        const crop = document.createElement('canvas'); crop.width = Math.round(width * ratioX); crop.height = Math.round(height * ratioY);
        crop.getContext('2d')!.drawImage(bitmap, x*ratioX,y*ratioY,width*ratioX,height*ratioY,0,0,crop.width,crop.height);
        const p1 = viewport.convertToPdfPoint(x,y), p2 = viewport.convertToPdfPoint(x+width,y+height);
        onSelection({ kind: 'region', quote: '', anchor: { quote: '', pages: [{ page: pageNumber, rects: [[p1[0],p1[1],p2[0],p2[1]]] }] }, screenshot: crop.toDataURL('image/png'), x: event.clientX, y: event.clientY });
      }}>
      {region && <div className="research-region-preview" style={{ left: Math.min(region[0],region[2]), top: Math.min(region[1],region[3]), width: Math.abs(region[2]-region[0]), height: Math.abs(region[3]-region[1]) }} />}
    </div>}
    <small className="research-pdf-page-label">{pageNumber}</small>
  </div>;
}
export default function PdfResearchReader({ document: pdfDocument, annotations, onSelection, onAnnotation, targetId, targetNonce, targetPage = 1 }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null), [error, setError] = useState('');
  const [scale, setScale] = useState(1), [rotation, setRotation] = useState(0), [boxMode, setBoxMode] = useState(false);
  const [pageNumber, setPageNumber] = useState(targetPage), [query, setQuery] = useState(''), [searching, setSearching] = useState(false), [searchMessage, setSearchMessage] = useState('');
  const scroll = useRef<HTMLDivElement>(null), searchId = useRef(0);
  useEffect(() => {
    let active = true;
    const base = new URL(`${import.meta.env.BASE_URL}pdfjs/`, window.location.href).href;
    const task = getDocument({ url: pdfDocument.previewUrl, cMapUrl: `${base}cmaps/`, cMapPacked: true, standardFontDataUrl: `${base}standard_fonts/`, wasmUrl: `${base}wasm/`, isEvalSupported: false });
    void task.promise.then(value => { if (active) setPdf(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; searchId.current++; void task.destroy(); };
  }, [pdfDocument.previewUrl]);
  function goTo(page: number) { const at = Math.max(1,Math.min(pdf?.numPages || 1,page)); setPageNumber(at); scroll.current?.querySelector(`[data-pdf-page="${at}"]`)?.scrollIntoView({ block: 'start' }); }
  useEffect(() => { if (pdf && !targetId) { const timer = window.setTimeout(() => goTo(targetPage), 100); return () => window.clearTimeout(timer); } }, [pdf, targetPage, targetId]);
  useEffect(() => {
    if (!targetId || !pdf || !scroll.current) return;
    const annotation = annotations.find(item=>item.id === targetId), page = annotation?.anchor.pages?.[0]?.page || targetPage;
    scroll.current.querySelector(`[data-pdf-page="${page}"]`)?.scrollIntoView({ block:'start' }); setPageNumber(page);
    const locate = () => {
      const target = scroll.current?.querySelector<HTMLElement>(`[data-reading-annotation="${targetId}"]`);
      if (!target) return false;
      scroll.current?.querySelectorAll('.research-target').forEach(item=>item.classList.remove('research-target'));
      target.scrollIntoView({ block: 'center' }); void target.offsetWidth; target.classList.add('research-target'); return true;
    };
    const observer = new MutationObserver(() => { if (locate()) observer.disconnect(); });
    if (!locate()) observer.observe(scroll.current, { childList:true, subtree:true });
    return () => observer.disconnect();
  }, [targetId, targetNonce, pdf, scale, rotation, annotations, targetPage]);
  async function search() {
    if (!pdf || !query.trim()) return;
    const ticket = ++searchId.current; setSearching(true); setSearchMessage('');
    try {
      for (let i = 0; i < pdf.numPages; i++) {
        const number = (pageNumber - 1 + i) % pdf.numPages + 1;
        const content = await (await pdf.getPage(number)).getTextContent();
        if (ticket !== searchId.current) return;
        if (content.items.map(item => 'str' in item ? item.str : '').join('').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) { goTo(number); setSearchMessage(`找到：第 ${number} 页`); return; }
      }
      setSearchMessage('没有匹配的文字；扫描页可使用框选');
    } catch (e) { setSearchMessage(String(e)); } finally { if (ticket === searchId.current) setSearching(false); }
  }
  return <div className="research-pdf-reader">
    <div className="research-reader-tools">
      <button type="button" onClick={() => goTo(pageNumber-1)} disabled={pageNumber <= 1}>上一页</button>
      <input aria-label="PDF 页码" type="number" min="1" max={pdf?.numPages || 1} value={pageNumber} onChange={event => goTo(Number(event.target.value))} />
      <span>/ {pdf?.numPages || '…'}</span><button type="button" onClick={() => goTo(pageNumber+1)} disabled={!pdf || pageNumber >= pdf.numPages}>下一页</button>
      <select aria-label="PDF 缩放" value={scale} onChange={event => setScale(Number(event.target.value))}>{[0.5,0.75,1,1.25,1.5,2].map(value => <option key={value} value={value}>{value*100}%</option>)}</select>
      <button type="button" onClick={() => setRotation(value => (value+90)%360)}>旋转</button>
      <button type="button" aria-pressed={boxMode} onClick={() => setBoxMode(value => !value)}>框选区域</button>
      <input aria-label="搜索 PDF" placeholder="搜索文字" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void search(); }} />
      <button type="button" onClick={() => void search()} disabled={searching}>查找</button>
    </div>
    {searchMessage && <div className="research-status" role="status">{searchMessage}</div>}
    {error && <div className="research-error" role="alert">{error}</div>}
    {!pdf && !error && <div className="research-status">正在加载 PDF…</div>}
    <div className="research-pdf-scroll" ref={scroll} onScroll={() => {
      if (!scroll.current) return;
      const top = scroll.current.getBoundingClientRect().top + 80;
      const page = [...scroll.current.querySelectorAll<HTMLElement>('[data-pdf-page]')].find(element => { const rect=element.getBoundingClientRect(); return rect.top<=top && rect.bottom>top; });
      if (page) setPageNumber(Number(page.dataset.pdfPage));
    }} onMouseUp={async event => {
      if (boxMode || !pdf) return;
      const selection = window.getSelection();
      if (!selection?.rangeCount || selection.isCollapsed || !scroll.current?.contains(selection.anchorNode) || !scroll.current?.contains(selection.focusNode)) return;
      const quote = selection.toString(); if (!quote.trim()) return;
      const range = selection.getRangeAt(0), bounds = Array.from(range.getClientRects());
      const pages: { page: number; rects: PdfRect[] }[] = [];
      for (const host of scroll.current.querySelectorAll<HTMLElement>('[data-pdf-page]')) {
        const rect = host.getBoundingClientRect();
        const clipped = bounds.filter(box => box.width > 0 && box.height > 0 && Math.min(box.width,box.height) < 100 * scale && box.bottom > rect.top && box.top < rect.bottom && box.right > rect.left && box.left < rect.right);
        if (!clipped.length) continue;
        const number = Number(host.dataset.pdfPage), page = await pdf.getPage(number);
        const viewport = page.getViewport({ scale, rotation: (page.rotate + rotation)%360 });
        pages.push({ page: number, rects: clipped.map(box => {
          const a = viewport.convertToPdfPoint(Math.max(0,box.left-rect.left),Math.max(0,box.top-rect.top));
          const b = viewport.convertToPdfPoint(Math.min(rect.width,box.right-rect.left),Math.min(rect.height,box.bottom-rect.top));
          return [a[0],a[1],b[0],b[1]];
        }) });
      }
      if (pages.length) onSelection({ kind: 'text', quote, anchor: { quote, pages }, x: event.clientX, y: event.clientY });
    }}>
      {pdf && Array.from({ length: pdf.numPages }, (_,index) => <PdfPage key={index} pdf={pdf} pageNumber={index+1} scale={scale} rotation={rotation} boxMode={boxMode} annotations={annotations} onSelection={onSelection} onAnnotation={onAnnotation} />)}
    </div>
  </div>;
}
