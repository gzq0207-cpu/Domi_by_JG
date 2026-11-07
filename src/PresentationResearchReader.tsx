import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PresentationDocument } from './research-types';

type Props = { document: PresentationDocument; initialSearchQuery?: string };

// 静态 PPT 阅读器：主进程已把每页幻灯片解析成带百分比定位的安全 HTML，
// 这里只负责按幻灯片原始尺寸等比缩放渲染和页内文字查找。
export default function PresentationResearchReader({ document: doc, initialSearchQuery = '' }: Props) {
  const scroll = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [scale, setScale] = useState(0);
  const [query, setQuery] = useState(initialSearchQuery);
  const [message, setMessage] = useState('');
  const searchOffset = useRef(0);

  useLayoutEffect(() => {
    const host = scroll.current;
    if (!host) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width || 0;
      setScale(Math.max(0.15, Math.min(1.3, (width - 48) / doc.width)));
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [doc.width]);

  function slides() {
    return scroll.current ? [...scroll.current.querySelectorAll<HTMLElement>('[data-ppt-slide]')] : [];
  }

  function jump(matches: HTMLElement[], index: number) {
    const target = matches[index];
    scroll.current?.querySelectorAll('.ppt-search-target').forEach(item => item.classList.remove('ppt-search-target'));
    target.classList.add('ppt-search-target');
    target.scrollIntoView({ block: 'center' });
    setMessage(`第 ${target.dataset.pptSlide} 页匹配；再次查找可跳到下一处`);
  }

  function find() {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return;
    const matches = slides().filter(slide => (slide.textContent || '').toLocaleLowerCase().includes(needle));
    if (!matches.length) { setMessage('没有找到匹配文字'); return; }
    searchOffset.current = (searchOffset.current + 1) % matches.length;
    jump(matches, searchOffset.current);
  }

  useEffect(() => {
    const needle = initialSearchQuery.trim().toLocaleLowerCase();
    if (!needle) return;
    const matches = slides().filter(slide => (slide.textContent || '').toLocaleLowerCase().includes(needle));
    if (matches.length) jump(matches, 0);
    // 仅在首次打开时定位，之后的搜索由用户驱动。
  }, [initialSearchQuery, doc.version]);

  return <div className="ppt-reader" onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'f') { event.preventDefault(); searchInput.current?.focus(); } }}>
    <div className="research-reader-tools"><strong>PPT 阅读</strong>
      <input ref={searchInput} aria-label="搜索 PPT" placeholder="搜索文字" value={query} onChange={event => { setQuery(event.target.value); searchOffset.current = 0; }} onKeyDown={event => { if (event.key === 'Enter') find(); }} />
      <button type="button" onClick={find}>查找下一处</button>
      <span>{doc.slides.length} 页幻灯片</span>
    </div>
    {doc.warnings.map(warning => <div className="research-status" key={warning}>{warning}</div>)}
    {message && <p className="research-status" role="status">{message}</p>}
    <div className="ppt-reader-scroll" ref={scroll}>
      {doc.slides.map(slide => <div className="ppt-slide-frame" key={slide.id} data-ppt-slide={slide.number} style={{ width: Math.round(doc.width * scale), height: Math.round(doc.height * scale) }}>
        <div className="ppt-slide" style={{ width: doc.width, height: doc.height, transform: `scale(${scale})` }} dangerouslySetInnerHTML={{ __html: slide.html }} />
      </div>)}
    </div>
  </div>;
}
