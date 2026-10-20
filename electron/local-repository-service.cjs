const path = require('node:path');
const { BackgroundService } = require('./background-service.cjs');

class LocalRepositoryService extends BackgroundService {
  constructor(options = {}) {
    super({ workerPath: path.join(__dirname, 'local-repository-worker.cjs'), ...options });
  }

  call(source, method, args = []) {
    return this.request('call', {
      source: { localDatabasePath: source.localDatabasePath, localLibraryDir: source.localLibraryDir },
      method, args
    });
  }
}

module.exports = { LocalRepositoryService };
