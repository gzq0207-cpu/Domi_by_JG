export type ResearchTopic = { id: string; title: string; industry: string; path: string; archived: boolean; updatedAt: number };
export type SourceIdentity = { id: string; path: string; version: string; name: string; kind: 'markdown' | 'pdf' | 'word' };
export type WordDocument = { path:string; name:string; size:number; mtimeMs:number; version:string; html:string; text:string; blocks:{id:string;text:string;offset:number}[]; warnings:string[]; converted:boolean };
export type PdfRect = [number, number, number, number];
export type AnnotationAnchor = {
  quote: string; prefix?: string; suffix?: string; offset?: number; heading?: string;
  noteId?: string; documentOffset?: number;
  word?: {start:{paragraphId:string;offset:number};end:{paragraphId:string;offset:number};imageId?:string};
  pages?: { page: number; rects: PdfRect[] }[];
};
export type ReadingAnnotation = {
  id: string; sourceId: string; sourceVersion: string; kind: 'text' | 'region' | 'document';
  anchor: AnnotationAnchor; quote: string; comment: string; imagePath?: string;
  createdAt: number; updatedAt: number; topics: ResearchTopic[];
};
export type TopicNote = {
  id: string; annotationId: string; quote: string; comment: string; imagePath?: string;
  sourceName: string; sourcePath: string; sourceVersion: string; location: string; createdAt: number;
};
export type ResearchSelection = {
  kind: 'text' | 'region'; anchor: AnnotationAnchor; quote: string;
  screenshot?: string; snapshot?: boolean; x: number; y: number;
};
export type ResearchRequest =
  | { action: 'list' }
  | { action: 'create'; title: string; industry?: string; operationId: string }
  | { action: 'update'; topicId: string; title?: string; industry?: string; archived?: boolean; expectedVersion: string }
  | { action: 'read'; topicId: string }
  | { action: 'save'; topicId: string; content: string; expectedVersion: string }
  | { action: 'source'; path: string }
  | { action: 'annotate'; id: string; sourceId: string; sourceVersion: string; kind: 'text' | 'region' | 'document'; anchor: AnnotationAnchor; quote: string; comment: string; screenshot?: string }
  | { action: 'updateComment'; annotationId: string; comment: string; expectedUpdatedAt: number }
  | { action: 'removeComment'; annotationId: string; expectedUpdatedAt: number }
  | { action: 'removeAnnotation'; annotationId: string }
  | { action: 'add'; annotationId: string; topicIds: string[]; operationId: string }
  | { action: 'resolve'; annotationId: string };
export type ResearchResult = {
  ok: boolean; error?: string; conflict?: boolean; topics?: ResearchTopic[]; topic?: ResearchTopic;
  content?: string; version?: string; source?: SourceIdentity; annotations?: ReadingAnnotation[];
  annotation?: ReadingAnnotation; status?: 'exact' | 'changed' | 'missing' | 'ambiguous';
};
