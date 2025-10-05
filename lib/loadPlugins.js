import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import chokidar from 'chokidar';

import log from '#lib/logger.js';

const importCache = new Map();
const CACHE_TTL = 5000;

async function importModule(modulePath) {
  const now = Date.now();
  const cached = importCache.get(modulePath);
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.module;
  }

  const moduleURL = `${pathToFileURL(modulePath).href}?id=${now}`;
  
  try {
    const esm = await import(moduleURL);
    const module = esm?.default ?? esm;
    
    importCache.set(modulePath, { module, timestamp: now });
    return module;
  } catch (error) {
    log.error(`Error importing ${modulePath}: ${error.message}`);
    importCache.delete(modulePath);
    throw error;
  }
}

export default class PluginsLoad {
  constructor(directory, { debug = false } = {}) {
    if (!directory) {
      throw new Error('You must add plugins path before using this code!');
    }
    this.directory = resolve(directory);
    this.plugins = {};
    this.watcher = null;
    this.debug = debug;
    this.loadQueue = new Set();
  }

  async add(p, { silent = false } = {}) {
    if (this.loadQueue.has(p)) return null;
    this.loadQueue.add(p);

    try {
      importCache.delete(p);
      
      if (p in this.plugins) delete this.plugins[p];
      
      const data = await importModule(p);
      this.plugins[p] = data;

      if (this.debug && !silent) {
        log.success(`Loaded plugin: ${p}`);
      }

      return data;
    } catch (error) {
      delete this.plugins[p];
      if (!silent) {
        log.error(`Failed to load ${p}: ${error.message}`);
      }
      return null;
    } finally {
      this.loadQueue.delete(p);
    }
  }

  async scan(dir = this.directory) {
    let items;
    
    try {
      items = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      log.error(`Error scanning ${dir}: ${error.message}`);
      return;
    }
    
    const directories = [];
    const files = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const p = join(dir, item.name);
      
      if (item.isDirectory()) {
        directories.push(p);
      } else if (item.isFile() && item.name.endsWith('.js')) {
        files.push(p);
      }
    }

    const BATCH_SIZE = 10;
    const batches = [];
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      batches.push(files.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      await Promise.allSettled(batch.map(p => this.add(p, { silent: true })));
    }

    if (directories.length > 0) {
      await Promise.allSettled(directories.map(p => this.scan(p)));
    }
  }

  async load() {
    const startTime = Date.now();
    await this.scan();
    const loadTime = Date.now() - startTime;
    
    const count = Object.keys(this.plugins).length;
    log.info(`Loaded ${count} plugins in ${loadTime}ms`);

    if (this.watcher) await this.watcher.close();

    this.watcher = chokidar.watch(this.directory, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      },
      usePolling: false,
      ignorePermissionErrors: true,
      atomic: true
    });

    const debounceMap = new Map();
    const debounce = (path, fn, delay = 500) => {
      const timer = debounceMap.get(path);
      if (timer) clearTimeout(timer);
      
      debounceMap.set(path, setTimeout(() => {
        fn();
        debounceMap.delete(path);
      }, delay));
    };

    this.watcher.on('add', (path) => {
      if (!path.endsWith('.js')) return;
      
      debounce(path, async () => {
        await this.add(path);
        log.info(`New plugin detected: ${path}`);
      });
    });

    this.watcher.on('change', (path) => {
      if (!path.endsWith('.js')) return;
      
      debounce(path, async () => {
        await this.add(path);
        log.info(`Plugin updated: ${path}`);
      });
    });

    this.watcher.on('unlink', (path) => {
      if (!(path in this.plugins)) return;
      
      delete this.plugins[path];
      importCache.delete(path);
      log.warn(`Plugin removed: ${path}`);
    });

    this.watcher.on('error', (error) => {
      log.error(`Watcher error: ${error.message}`);
    });
  }

  async destroy() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.plugins = {};
    importCache.clear();
  }

  async reload(pluginPath) {
    return await this.add(resolve(this.directory, pluginPath));
  }

  getStats() {
    const keys = Object.keys(this.plugins);
    return {
      total: keys.length,
      paths: keys,
      cacheSize: importCache.size
    };
  }
}