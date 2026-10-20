const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { segments, industry, industryFromPath, isWithin, rebaseTopicContent } = require('./research-layout.cjs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const id = value => {
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(String(value || ''))) throw new Error('研究记录 ID 无效。');
  return value;
};
function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
function title(value) {
  const text = String(value || '').trim();
  if (!text || text.length > 160 || /[\r\n\x00-\x1f]/.test(text)) throw new Error('主题名称需要 1–160 个字符，不能包含换行。');
  return text;
}
function atomicWrite(file, content) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, content, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally { fs.rmSync(temporary, { force: true }); }
}
class ResearchStore {
  constructor({ rootPath, onFileChanged = () => {}, allowedPaths = new Set() }) {
    this.root = fs.realpathSync(rootPath);
    this.onFileChanged = onFileChanged;
    this.allowedPaths = allowedPaths;
    const directory = path.join(this.root, '.domi');
    fs.mkdirSync(directory, { recursive: true });
    this.safe(directory);
    if (fs.existsSync(path.join(directory, 'research.sqlite3'))) this.safe(path.join(directory, 'research.sqlite3'));
    this.db = new DatabaseSync(path.join(directory, 'research.sqlite3'));
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS research_topics(id TEXT PRIMARY KEY, title TEXT NOT NULL, path TEXT NOT NULL UNIQUE, archived INTEGER DEFAULT 0, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS reading_sources(id TEXT PRIMARY KEY, path TEXT NOT NULL UNIQUE, version TEXT NOT NULL, kind TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS reading_annotations(id TEXT PRIMARY KEY, source_id TEXT NOT NULL, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS research_links(topic_id TEXT NOT NULL, note_id TEXT NOT NULL, annotation_id TEXT NOT NULL, PRIMARY KEY(topic_id,note_id));
      CREATE INDEX IF NOT EXISTS research_links_annotation ON research_links(annotation_id);
      CREATE TABLE IF NOT EXISTS research_topic_usage(topic_id TEXT PRIMARY KEY,used_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS research_operations(id TEXT PRIMARY KEY, value TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0);
    `);
  }
  safe(file, external = false) {
    const resolved = fs.realpathSync(file);
    if (!inside(this.root, resolved) && !(external && this.allowedPaths.has(resolved))) throw new Error('资料路径超出当前资料库范围。');
    return resolved;
  }
  topic(row) { return { id: row.id, title: row.title, industry: industryFromPath(row.path)?.name || '其他行业', path: path.join(this.root, row.path), archived: Boolean(row.archived), updatedAt: row.updated_at }; }
  ensureDirectory(directory) {
    if (!isWithin(this.root,directory)) throw new Error('主题目录超出当前资料库。');
    let current=this.root;
    for(const part of path.relative(this.root,directory).split(path.sep).filter(Boolean)) {
      current=path.join(current,part);
      if(fs.existsSync(current)) this.safe(current); else fs.mkdirSync(current);
    }
  }
  getTopic(topicId) {
    const row = this.db.prepare('SELECT * FROM research_topics WHERE id=?').get(id(topicId));
    if (!row) throw new Error('主题研究不存在。');
    return this.topic(row);
  }
  readTopic(topicId) {
    const topic = this.getTopic(topicId);
    this.safe(topic.path);
    const content = fs.readFileSync(topic.path, 'utf8');
    return { topic, content, version: hash(content) };
  }
  links(topicId, content) {
    const notes = this.markdown.researchNotes(content);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM research_links WHERE topic_id=?').run(topicId);
      for (const note of notes) this.db.prepare('INSERT OR IGNORE INTO research_links VALUES(?,?,?)').run(topicId, note.id, note.annotationId);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  save(topicId, content, expectedVersion) {
    if (typeof content !== 'string' || Buffer.byteLength(content) > 8 * 1024 * 1024) throw new Error('研究文档内容无效或超过 8 MB。');
    const current = this.readTopic(topicId);
    if (current.version !== expectedVersion) {
      const error = new Error('研究文档已被其他窗口或应用修改，草稿已保留。请重新载入后合并。');
      error.conflict = true;
      throw error;
    }
    // All store operations are synchronous after module loading: no concurrent IPC
    // mutation can interleave the version check and atomic replacement.
    atomicWrite(current.topic.path, content);
    this.db.prepare('UPDATE research_topics SET updated_at=? WHERE id=?').run(Date.now(), topicId);
    this.links(topicId, content);
    this.onFileChanged(current.topic.path);
    return this.readTopic(topicId);
  }
  annotation(annotationId) {
    const row = this.db.prepare('SELECT value FROM reading_annotations WHERE id=?').get(id(annotationId));
    if (!row) throw new Error('批注不存在。');
    const annotation = JSON.parse(row.value);
    annotation.topics = this.db.prepare('SELECT DISTINCT t.* FROM research_topics t JOIN research_links l ON l.topic_id=t.id WHERE l.annotation_id=? ORDER BY t.updated_at DESC').all(annotationId).map(row => this.topic(row));
    return annotation;
  }
  sourceRow(sourceId) {
    const source = this.db.prepare('SELECT * FROM reading_sources WHERE id=?').get(id(sourceId));
    if (!source) throw new Error('来源材料不存在。');
    return source;
  }
  sourceInfo(row) { return { id: row.id, path: path.isAbsolute(row.path) ? row.path : path.join(this.root, row.path), version: row.version, kind: row.kind, name: path.basename(row.path) }; }
  registerSource(requestPath) {
    const resolved = this.safe(requestPath, true);
    if (!/\.(md|markdown|pdf|docx|doc)$/i.test(resolved) || !fs.statSync(resolved).isFile()) throw new Error('仅支持 Markdown、PDF 和 Word 材料。');
    const version = hash(fs.readFileSync(resolved));
    const storedPath = inside(this.root, resolved) ? path.relative(this.root, resolved) : resolved;
    let row = this.db.prepare('SELECT * FROM reading_sources WHERE path=?').get(storedPath);
    // Relink a uniquely moved file; do not merge two extant copies just because
    // they happen to have identical bytes.
    if (!row) {
      const old = this.db.prepare('SELECT * FROM reading_sources WHERE version=?').all(version).filter(item => !fs.existsSync(this.sourceInfo(item).path));
      if (old.length === 1) { row = old[0]; this.db.prepare('UPDATE reading_sources SET path=? WHERE id=?').run(storedPath, row.id); }
    }
    const sourceId = row?.id || crypto.randomUUID();
    this.db.prepare('INSERT INTO reading_sources VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET path=excluded.path, version=excluded.version').run(sourceId, storedPath, version, /\.pdf$/i.test(resolved) ? 'pdf' : /\.docx?$/i.test(resolved) ? 'word' : 'markdown');
    return this.sourceInfo(this.sourceRow(sourceId));
  }
  discover() {
    const folders=[path.join(this.root,'14.主题研究'), ...segments.flatMap(item=>[path.join(this.root,item.directory,'主题研究'),path.join(this.root,item.directory,'_行业认知','主题研究')])];
    for(const folder of folders) {
    if (!fs.existsSync(folder)) continue;
    this.safe(folder);
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const documentPath = path.join(folder, entry.name, '研究笔记.md');
      if (!fs.existsSync(documentPath)) continue;
      this.safe(documentPath);
      const content = fs.readFileSync(documentPath, 'utf8');
      const topicId = content.match(/^domiResearchId: ([a-zA-Z0-9-]{8,80})$/m)?.[1];
      if (!topicId) continue;
      const existing = this.db.prepare('SELECT * FROM research_topics WHERE id=?').get(topicId);
      if (existing && path.join(this.root, existing.path) !== documentPath && fs.existsSync(path.join(this.root, existing.path))) continue;
      const name = content.match(/^# (.+)$/m)?.[1] || entry.name;
      this.db.prepare('INSERT INTO research_topics VALUES(?,?,?,0,?) ON CONFLICT(id) DO UPDATE SET path=excluded.path,title=excluded.title').run(topicId, name, path.relative(this.root, documentPath), fs.statSync(documentPath).mtimeMs);
      this.links(topicId, content);
    }
    }
  }
  moveTopic(topicId, name) {
    const current=this.readTopic(topicId), selected=industry(name), from=path.dirname(current.topic.path);
    const to=path.join(this.root,selected.directory,'主题研究',path.basename(from));
    if (from===to) return;
    this.safe(from);
    if(!isWithin(this.root,to) || !isWithin(this.root,from) || from===this.root) throw new Error('主题迁移目录无效。');
    if(fs.existsSync(to)) throw new Error('目标行业已存在同名主题目录，未覆盖任何文件。');
    const operationId=crypto.randomUUID();
    const operation={kind:'move',topicId,from:path.relative(this.root,from),to:path.relative(this.root,to),expectedVersion:current.version,
      content:rebaseTopicContent(current.content,from,to,selected.name,this.markdown)};
    this.db.prepare('INSERT INTO research_operations VALUES(?,?,0)').run(operationId,JSON.stringify(operation));
    this.applyOperation(operationId,operation);
  }
  migrateLegacyTopics() {
    for(const row of this.db.prepare('SELECT * FROM research_topics').all()) {
      const parts=row.path.split(path.sep), physical=industryFromPath(row.path);
      if(physical && parts[1]==='主题研究') continue;
      if(parts[0]!=='14.主题研究' && !(physical && parts[1]==='_行业认知' && parts[2]==='主题研究')) continue;
      const current=this.readTopic(row.id);
      let selected=physical?.name || current.content.match(/^domiResearchIndustry: (.+)$/m)?.[1];
      if(!selected) {
        const candidates=new Set(this.markdown.researchNotes(current.content).map(note=>industryFromPath(path.relative(this.root,path.resolve(path.dirname(current.topic.path),note.sourcePath || '')))?.name).filter(Boolean));
        selected=candidates.size===1 ? [...candidates][0] : '其他行业';
      }
      this.moveTopic(row.id,selected);
    }
    const legacy=path.join(this.root,'14.主题研究');
    if(fs.existsSync(legacy) && this.safe(legacy) && fs.readdirSync(legacy).length===0) fs.rmdirSync(legacy);
  }
  recover() {
    for (const row of this.db.prepare('SELECT * FROM research_operations WHERE done=0').all()) {
      try { this.applyOperation(row.id, JSON.parse(row.value)); }
      catch { /* Keep the journal pending. Reads and draft recovery remain usable. */ }
    }
  }
  applyOperation(operationId, operation) {
    if (operation.kind === 'create') {
      const existing=this.db.prepare('SELECT * FROM research_topics WHERE id=?').get(operation.topicId);
      if(existing && fs.existsSync(path.join(this.root,existing.path))) { this.db.prepare('UPDATE research_operations SET done=1 WHERE id=?').run(operationId); return; }
      const selected=industry(operation.industry);
      const legacy=path.join(this.root,'14.主题研究',operation.directory);
      const directory = !operation.industry && fs.existsSync(path.join(legacy,'研究笔记.md')) ? legacy : path.join(this.root,selected.directory,'主题研究',operation.directory);
      this.ensureDirectory(directory);
      this.safe(directory);
      const documentPath = path.join(directory, '研究笔记.md');
      if (!fs.existsSync(documentPath)) atomicWrite(documentPath, `---\ndomiResearchId: ${operation.topicId}\ndomiResearchIndustry: ${selected.name}\n---\n\n# ${operation.title}\n\n## 研究问题\n\n## 我的分析\n\n## 待核实问题\n\n## 待整理笔记\n`);
      this.db.prepare('INSERT OR IGNORE INTO research_topics VALUES(?,?,?,0,?)').run(operation.topicId, operation.title, path.relative(this.root, documentPath), Date.now());
      this.onFileChanged(documentPath);
    } else if(operation.kind==='move') {
      const from=path.resolve(this.root,operation.from),to=path.resolve(this.root,operation.to);
      if(!isWithin(this.root,from) || !isWithin(this.root,to) || from===this.root || to===this.root) throw new Error('主题迁移目录无效。');
      this.ensureDirectory(path.dirname(to));
      if(fs.existsSync(from)) {
        this.safe(from);
        if(fs.existsSync(to)) throw new Error('迁移目标已存在，未覆盖任何文件。');
        fs.renameSync(from,to);
      }
      const file=this.safe(path.join(to,'研究笔记.md')),content=fs.readFileSync(file,'utf8');
      if(hash(content)!==hash(operation.content)) {
        if(hash(content)!==operation.expectedVersion) { const error=new Error('主题迁移期间文件被外部修改，已保留文件和迁移记录，请核对后重试。'); error.conflict=true; throw error; }
        atomicWrite(file,operation.content);
      }
      this.db.prepare('UPDATE research_topics SET path=?,updated_at=? WHERE id=?').run(path.relative(this.root,file),Date.now(),operation.topicId);
      for(const source of this.db.prepare('SELECT * FROM reading_sources').all()) {
        const original=this.sourceInfo(source).path;
        if(isWithin(from,original)) this.db.prepare('UPDATE reading_sources SET path=? WHERE id=?').run(path.relative(this.root,path.join(to,path.relative(from,original))),source.id);
      }
      this.links(operation.topicId,operation.content);
      this.onFileChanged(path.join(from,'研究笔记.md')); this.onFileChanged(file);
    } else {
      const annotation = operation.annotation || this.annotation(operation.annotationId);
      const source = operation.source || this.sourceInfo(this.sourceRow(annotation.sourceId));
      for (const item of operation.items) {
        const current = this.readTopic(item.topicId);
        const notes = this.markdown.researchNotes(current.content);
        // Adding an existing annotation to a theme is idempotent even with a
        // fresh operation ID; removing it first permits adding it again.
        if (!notes.some(note => note.annotationId === annotation.id)) {
          let imagePath;
          if (annotation.imagePath) {
            const assetDirectory = path.join(path.dirname(current.topic.path), 'assets');
            if (fs.existsSync(assetDirectory)) this.safe(assetDirectory);
            fs.mkdirSync(assetDirectory, { recursive: true }); this.safe(assetDirectory);
            imagePath = `assets/${item.noteId}.png`;
            const image = fs.readFileSync(this.safe(path.join(this.root, annotation.imagePath)));
            atomicWrite(path.join(path.dirname(current.topic.path), imagePath), image);
          }
          const location = annotation.anchor.pages?.length ? `第 ${annotation.anchor.pages.map(page => page.page).join('、')} 页` : annotation.anchor.heading || '原文摘录';
          const note = { id: item.noteId, annotationId: annotation.id, quote: annotation.quote, comment: annotation.comment, sourceName: source.name, sourcePath: path.relative(path.dirname(current.topic.path), source.path).split(path.sep).join('/'), sourceVersion: annotation.sourceVersion, location, createdAt: operation.createdAt || Date.now(), ...(imagePath ? { imagePath } : {}) };
          this.save(item.topicId, this.markdown.appendResearchNote(current.content, note), current.version);
        } else this.links(item.topicId, current.content);
      }
    }
    this.db.prepare('UPDATE research_operations SET done=1 WHERE id=?').run(operationId);
  }
  resolve(annotationId) {
    const annotation = this.annotation(annotationId);
    let source = this.sourceInfo(this.sourceRow(annotation.sourceId));
    if (!fs.existsSync(source.path)) {
      const matches = [];
      const visit = directory => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
          const file = path.join(directory, entry.name);
          if (entry.isDirectory()) visit(file);
          else if (entry.isFile() && /\.(md|markdown|pdf|docx|doc)$/i.test(entry.name) && hash(fs.readFileSync(file)) === annotation.sourceVersion) matches.push(file);
        }
      };
      visit(this.root);
      if (matches.length !== 1) return { annotation, source, status: matches.length ? 'ambiguous' : 'missing' };
      source = this.registerSource(matches[0]);
    }
    this.safe(source.path, true);
    const currentVersion = hash(fs.readFileSync(source.path));
    return { annotation, source: { ...source, version: currentVersion }, status: currentVersion === annotation.sourceVersion ? 'exact' : 'changed' };
  }
  async handle(request) {
    try {
      if (!this.markdown) this.markdown = await import('../shared/research-markdown.mjs');
      this.recover();
      if(!this.layoutReady) { this.discover(); this.migrateLegacyTopics(); this.layoutReady=true; }
      switch (request?.action) {
        case 'list': {
          this.discover();
          return { ok: true, topics: this.db.prepare('SELECT t.* FROM research_topics t LEFT JOIN research_topic_usage u ON u.topic_id=t.id ORDER BY MAX(t.updated_at,COALESCE(u.used_at,0)) DESC').all().map(row => this.topic(row)) };
        }
        case 'create': {
          const operationId = id(request.operationId);
          let row = this.db.prepare('SELECT value FROM research_operations WHERE id=?').get(operationId);
          if (!row) {
            const name = title(request.title), topicId = crypto.randomUUID();
            const operation = { kind: 'create', topicId, title: name, industry:industry(request.industry).name, directory: `${name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0, 70)}--${topicId}` };
            this.db.prepare('INSERT INTO research_operations VALUES(?,?,0)').run(operationId, JSON.stringify(operation));
            row = { value: JSON.stringify(operation) };
          }
          const operation = JSON.parse(row.value);
          if (operation.kind !== 'create') throw new Error('操作 ID 已被使用。');
          this.applyOperation(operationId, operation);
          return { ok: true, ...this.readTopic(operation.topicId) };
        }
        case 'read': { const result = this.readTopic(request.topicId); this.links(request.topicId, result.content); this.db.prepare('INSERT INTO research_topic_usage VALUES(?,?) ON CONFLICT(topic_id) DO UPDATE SET used_at=excluded.used_at').run(request.topicId,Date.now()); return { ok: true, ...result }; }
        case 'save': return { ok: true, ...this.save(id(request.topicId), request.content, request.expectedVersion) };
        case 'update': {
          const current = this.readTopic(request.topicId);
          if (current.version !== request.expectedVersion) { const error = new Error('研究文档已变化，请重新载入后再修改主题。'); error.conflict = true; throw error; }
          if (request.title !== undefined) {
            const name = title(request.title);
            const content = current.content.replace(/^# .+$/m, `# ${name}`);
            this.save(request.topicId, content, current.version);
            this.db.prepare('UPDATE research_topics SET title=? WHERE id=?').run(name, request.topicId);
          }
          if (typeof request.archived === 'boolean') this.db.prepare('UPDATE research_topics SET archived=?,updated_at=? WHERE id=?').run(Number(request.archived), Date.now(), request.topicId);
          if(request.industry!==undefined) this.moveTopic(request.topicId,request.industry);
          return { ok: true, ...this.readTopic(request.topicId) };
        }
        case 'source': {
          const source = this.registerSource(request.path);
          const annotations = this.db.prepare('SELECT id FROM reading_annotations WHERE source_id=?').all(source.id).map(row => this.annotation(row.id));
          return { ok: true, source, annotations };
        }
        case 'annotate': {
          const annotationId = id(request.id), source = this.sourceInfo(this.sourceRow(request.sourceId));
          this.safe(source.path, true);
          if (hash(fs.readFileSync(source.path)) !== request.sourceVersion) throw new Error('材料已变化，请重新载入后再批注。');
          if (!['text','region','document'].includes(request.kind) || typeof request.quote !== 'string' || typeof request.comment !== 'string' || request.quote.length > 100_000 || request.comment.length > 100_000) throw new Error('批注内容无效或过长。');
          if (request.kind === 'document' && (!request.comment.trim() || request.quote !== '')) throw new Error('整篇文档评论需要非空评论，不能包含伪造的原文选段。');
          const anchor = request.anchor;
          if (!anchor || typeof anchor.quote !== 'string') throw new Error('批注位置无效。');
          if(source.kind==='word' && request.kind!=='document' && (!anchor.word || ![anchor.word.start,anchor.word.end].every(point=>point&&typeof point.paragraphId==='string'&&/^p-[a-zA-Z0-9-]{1,90}$/.test(point.paragraphId)&&Number.isInteger(point.offset)&&point.offset>=0)))throw new Error('Word 批注缺少有效的段落与文字位置。');
          if (source.kind === 'pdf' && request.kind !== 'document' && (!Array.isArray(anchor.pages) || !anchor.pages.length || anchor.pages.length > 100 || anchor.pages.some(page => !Number.isInteger(page.page) || page.page < 1 || !Array.isArray(page.rects) || page.rects.length > 1000 || page.rects.some(rect => !Array.isArray(rect) || rect.length !== 4 || rect.some(n => typeof n !== 'number' || !Number.isFinite(n)))))) throw new Error('PDF 批注坐标无效。');
          const previous = this.db.prepare('SELECT value FROM reading_annotations WHERE id=?').get(annotationId);
          const old = previous ? JSON.parse(previous.value) : null;
          if (old && old.sourceId !== source.id) throw new Error('批注来源不能改变。');
          let imagePath = old?.imagePath;
          if (request.screenshot) {
            const data = String(request.screenshot);
            if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data) || data.length > 24 * 1024 * 1024) throw new Error('图表截图无效或过大。');
            const bytes = Buffer.from(data.split(',')[1], 'base64');
            if (bytes.subarray(0,8).toString('hex') !== '89504e470d0a1a0a') throw new Error('图表截图不是 PNG。');
            const directory = path.join(this.root, '.domi', 'annotation-assets');
            if (fs.existsSync(directory)) this.safe(directory);
            fs.mkdirSync(directory, { recursive: true }); this.safe(directory);
            imagePath = path.relative(this.root, path.join(directory, `${annotationId}-${hash(bytes).slice(0,16)}.png`));
            atomicWrite(path.join(this.root, imagePath), bytes);
          }
          if (request.kind === 'region' && !imagePath) throw new Error('框选批注需要保存截图。');
          const annotation = { id: annotationId, sourceId: source.id, sourceVersion: request.sourceVersion, kind: request.kind, anchor: request.kind === 'document' ? { quote: '' } : anchor, quote: request.quote, comment: request.comment, createdAt: old?.createdAt || Date.now(), updatedAt: Math.max(Date.now(), (old?.updatedAt || 0) + 1), ...(imagePath ? { imagePath } : {}) };
          this.db.prepare('INSERT INTO reading_annotations VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(annotationId, source.id, JSON.stringify(annotation));
          return { ok: true, annotation: this.annotation(annotationId) };
        }
        case 'updateComment':
        case 'removeComment': {
          const previous = this.annotation(request.annotationId);
          if (previous.updatedAt !== request.expectedUpdatedAt) { const error = new Error('评论已被其他窗口修改，当前草稿已保留，请重新载入评论后合并。'); error.conflict = true; throw error; }
          if (request.action === 'updateComment' && (typeof request.comment !== 'string' || !request.comment.trim() || request.comment.length > 100_000)) throw new Error('评论需要 1–100,000 个字符。');
          if (request.action === 'removeComment' && previous.kind === 'document' && !previous.topics.length) {
            this.db.prepare('DELETE FROM reading_annotations WHERE id=?').run(previous.id);
            return { ok: true };
          }
          const { topics: _topics, ...value } = previous;
          value.comment = request.action === 'removeComment' ? '' : request.comment;
          value.updatedAt = Math.max(Date.now(), previous.updatedAt + 1);
          this.db.prepare('UPDATE reading_annotations SET value=? WHERE id=?').run(JSON.stringify(value), previous.id);
          return { ok: true, annotation: this.annotation(previous.id) };
        }
        case 'removeAnnotation': this.db.prepare('DELETE FROM reading_annotations WHERE id=?').run(id(request.annotationId)); return { ok: true };
        case 'add': {
          const operationId = id(request.operationId);
          if (!Array.isArray(request.topicIds) || !request.topicIds.length || request.topicIds.length > 64) throw new Error('请选择 1–64 个主题。');
          const topics = [...new Set(request.topicIds)].map(topicId => this.getTopic(topicId));
          if (topics.some(topic => topic.archived)) throw new Error('请先恢复归档主题再加入笔记。');
          const annotation = this.annotation(request.annotationId);
          const operation = { kind: 'add', annotationId: id(request.annotationId), annotation, source: this.sourceInfo(this.sourceRow(annotation.sourceId)), createdAt: Date.now(), items: topics.map(topic => ({ topicId: topic.id, noteId: crypto.randomUUID() })) };
          const existing = this.db.prepare('SELECT value,done FROM research_operations WHERE id=?').get(operationId);
          if (existing) {
            const previous = JSON.parse(existing.value);
            if (previous.kind !== 'add' || previous.annotationId !== operation.annotationId || JSON.stringify(previous.items.map(i => i.topicId).sort()) !== JSON.stringify(operation.items.map(i => i.topicId).sort())) throw new Error('操作 ID 已被使用。');
            if (!existing.done) this.applyOperation(operationId, previous);
          } else {
            this.db.prepare('INSERT INTO research_operations VALUES(?,?,0)').run(operationId, JSON.stringify(operation));
            this.applyOperation(operationId, operation);
          }
          return { ok: true, topics: topics.map(topic => this.getTopic(topic.id)) };
        }
        case 'resolve': return { ok: true, ...this.resolve(request.annotationId) };
        default: throw new Error('未知研究操作。');
      }
    } catch (error) { return { ok: false, error: error.message, ...(error.conflict ? { conflict: true } : {}) }; }
  }
  close() { this.db.close(); }
}
module.exports = { ResearchStore, hash };
