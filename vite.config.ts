import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from 'node:fs';
import path from 'node:path';

// Keep PDF fonts, CMaps, WASM and the worker local in development and packaged builds.
function offlinePdfAssets() {
  const root = path.resolve('node_modules/pdfjs-dist');
  return {
    name: 'offline-pdf-assets',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/pdfjs', (request, response, next) => {
        const relative = decodeURIComponent((request.url || '').split('?')[0]).replace(/^\/+/, '');
        if (!/^(cmaps|standard_fonts|wasm)\//.test(relative)) return next();
        const file = path.resolve(root, relative);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.statusCode = 404; response.end(); return; }
        response.setHeader('Content-Type', file.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream');
        fs.createReadStream(file).pipe(response);
      });
    },
    closeBundle() {
      for (const directory of ['cmaps','standard_fonts','wasm']) fs.cpSync(path.join(root,directory), path.resolve('dist/pdfjs',directory), { recursive: true });
      fs.copyFileSync(path.join(root,'LICENSE'),path.resolve('dist/pdfjs/LICENSE'));
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), offlinePdfAssets()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/prosemirror-") || id.includes("/@tiptap/pm/")) {
            return "editor-prosemirror";
          }
          if (id.includes("/node_modules/@tiptap/")) return "editor-tiptap";
          return undefined;
        }
      }
    }
  }
});
