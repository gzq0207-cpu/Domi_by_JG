const path = require('node:path');
const { BackgroundService } = require('./background-service.cjs');

class ResearchService extends BackgroundService {
  constructor({ rootPath, libraryRoot = rootPath, allowedPaths = new Set(), onFileChanged = () => {}, ...options }) {
    super({ workerPath: path.join(__dirname, 'research-worker.cjs'), workerData: { rootPath },
      onEvent: event => { if (event.type === 'file-changed') onFileChanged(event.path); }, ...options });
    this.root = rootPath;
    this.libraryRoot = libraryRoot;
    this.allowedPaths = allowedPaths;
  }

  async handle(request) {
    try {
      return await this.request('handle', { request, allowedPaths: [...this.allowedPaths] });
    } catch (error) { return { ok: false, error: error.message, code: error.code }; }
  }

  fingerprint(filePath) {
    return this.request('fingerprint', { path: filePath, allowedPaths: [...this.allowedPaths] });
  }
}

module.exports = { ResearchService };
