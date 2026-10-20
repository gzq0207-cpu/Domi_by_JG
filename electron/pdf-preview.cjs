const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// PDF.js fetches bytes from the renderer. Grant an opaque token for an opened
// file rather than exposing a cross-origin endpoint that accepts arbitrary paths.
function createPdfPreviewRegistry({ net, scheme = 'domi-pdf' }) {
  const grants = new Map();
  return {
    url(filePath, expectedVersion) {
      const resolved = fs.realpathSync(filePath);
      if (path.extname(resolved).toLowerCase() !== '.pdf') throw new Error('仅支持 PDF 文件。');
      const token = crypto.randomUUID();
      const version=expectedVersion || crypto.createHash('sha256').update(fs.readFileSync(resolved)).digest('hex');
      grants.set(token,{ original: path.resolve(filePath), resolved, version });
      return `${scheme}://local/${token}`;
    },
    clear() { grants.clear(); },
    async handle(request) {
      try {
        const url = new URL(request.url), grant = grants.get(url.pathname.slice(1));
        if (url.hostname !== 'local' || !grant || fs.realpathSync(grant.original) !== grant.resolved) return new Response('PDF not granted',{ status:403 });
        const bytes=await fs.promises.readFile(grant.resolved);
        if(crypto.createHash('sha256').update(bytes).digest('hex')!==grant.version)return new Response('PDF changed; reopen the document',{status:409});
        // Return exactly the bytes whose digest was checked. Re-opening a file
        // URL here could serve a different version after an external write.
        return new Response(bytes,{status:200,headers:{'Access-Control-Allow-Origin':'*','Content-Type':'application/pdf','Content-Length':String(bytes.length)}});
      } catch { return new Response('PDF unavailable',{status:404}); }
    }
  };
}
module.exports = { createPdfPreviewRegistry };
