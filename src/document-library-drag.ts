export const DOCUMENT_LIBRARY_DRAG_TYPE = 'application/x-domi-library-document';
export type DocumentLibraryDrag = { rootPath: string; path: string; mtimeMs: number };
export const hasDocumentLibraryDrag = (transfer: DataTransfer) => Array.from(transfer.types).includes(DOCUMENT_LIBRARY_DRAG_TYPE);
export function readDocumentLibraryDrag(transfer: DataTransfer, rootPath: string): DocumentLibraryDrag | null {
  try {
    const value = JSON.parse(transfer.getData(DOCUMENT_LIBRARY_DRAG_TYPE));
    return value && value.rootPath === rootPath && typeof value.path === 'string' && Number.isFinite(value.mtimeMs) ? value : null;
  } catch { return null; }
}
