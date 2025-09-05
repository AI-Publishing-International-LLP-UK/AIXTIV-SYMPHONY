
// Offline Sync Service for ASOOS Mobile
import { openDB } from 'idb';

class ASOOSOfflineSync {
  constructor() {
    this.dbName = 'asoos-offline';
    this.version = 1;
    this.db = null;
    this.initDB();
    this.setupServiceWorker();
  }

  async initDB() {
    this.db = await openDB(this.dbName, this.version, {
      upgrade(db) {
        // Command queue store
        const commandStore = db.createObjectStore('commandQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
        commandStore.createIndex('timestamp', 'timestamp');
        commandStore.createIndex('status', 'status');

        // Cache store for API responses
        const cacheStore = db.createObjectStore('apiCache', {
          keyPath: 'url'
        });
        cacheStore.createIndex('expiry', 'expiry');

        // User preferences store
        const prefsStore = db.createObjectStore('preferences', {
          keyPath: 'key'
        });

        // Command history store
        const historyStore = db.createObjectStore('commandHistory', {
          keyPath: 'id',
          autoIncrement: true
        });
        historyStore.createIndex('command', 'command');
        historyStore.createIndex('timestamp', 'timestamp');
      }
    });

    console.log('📱 Offline database initialized');
  }

  async queueCommand(command, params = {}) {
    const commandItem = {
      command: command,
      params: params,
      timestamp: new Date().toISOString(),
      status: 'queued',
      retries: 0,
      maxRetries: 3
    };

    const tx = this.db.transaction('commandQueue', 'readwrite');
    const store = tx.objectStore('commandQueue');
    const id = await store.add(commandItem);
    
    console.log(`📝 Command queued offline: ${command} (ID: ${id})`);
    
    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  async processQueue() {
    if (!navigator.onLine) {
      console.log('📵 Device offline, queue processing skipped');
      return;
    }

    console.log('🔄 Processing offline command queue...');

    const tx = this.db.transaction('commandQueue', 'readwrite');
    const store = tx.objectStore('commandQueue');
    const queuedCommands = await store.index('status').getAll('queued');

    for (const cmd of queuedCommands) {
      try {
        console.log(`⚡ Executing queued command: ${cmd.command}`);
        
        // Execute command via Diamond SAO CLI
        const result = await this.executeCommand(cmd.command, cmd.params);
        
        // Mark as completed
        cmd.status = 'completed';
        cmd.result = result;
        cmd.completedAt = new Date().toISOString();
        await store.put(cmd);
        
        // Show success notification
        this.showSyncNotification(`✅ Command executed: ${cmd.command}`, 'success');
        
      } catch (error) {
        console.error(`❌ Failed to execute command: ${cmd.command}`, error);
        
        cmd.retries++;
        if (cmd.retries >= cmd.maxRetries) {
          cmd.status = 'failed';
          cmd.error = error.message;
          this.showSyncNotification(`❌ Command failed: ${cmd.command}`, 'error');
        }
        await store.put(cmd);
      }
    }

    console.log('✅ Queue processing completed');
  }

  async executeCommand(command, params) {
    // Execute via mobile worker API
    const response = await fetch('/api/diamond-cli', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, params })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async cacheResponse(url, data, ttl = 300000) { // 5 minutes default TTL
    const cacheItem = {
      url: url,
      data: data,
      timestamp: new Date().toISOString(),
      expiry: Date.now() + ttl
    };

    const tx = this.db.transaction('apiCache', 'readwrite');
    await tx.objectStore('apiCache').put(cacheItem);
  }

  async getCachedResponse(url) {
    const tx = this.db.transaction('apiCache', 'readonly');
    const cached = await tx.objectStore('apiCache').get(url);
    
    if (cached && cached.expiry > Date.now()) {
      console.log(`📋 Using cached response for: ${url}`);
      return cached.data;
    }

    return null;
  }

  async saveCommandHistory(command, result) {
    const historyItem = {
      command: command,
      result: result,
      timestamp: new Date().toISOString(),
      success: !result.error
    };

    const tx = this.db.transaction('commandHistory', 'readwrite');
    await tx.objectStore('commandHistory').add(historyItem);
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('🔧 Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Device back online - processing queued commands');
      this.processQueue();
      this.showSyncNotification('🌐 Back online - syncing commands', 'info');
    });

    window.addEventListener('offline', () => {
      console.log('📵 Device offline - commands will be queued');
      this.showSyncNotification('📵 Offline mode - commands queued for sync', 'info');
    });
  }

  showSyncNotification(message, type) {
    // Create visual notification
    const notification = document.createElement('div');
    notification.className = `sync-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

export default ASOOSOfflineSync;
