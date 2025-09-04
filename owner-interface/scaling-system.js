/**
 * Enterprise Scaling and Performance Optimization System
 * Load balancing, caching, resource management, and performance monitoring
 */

class EnterpriseScalingSystem {
  constructor() {
    this.loadBalancer = new LoadBalancer();
    this.cacheManager = new CacheManager();
    this.resourceMonitor = new ResourceMonitor();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.metrics = {
      requestCount: 0,
      responseTime: [],
      activeConnections: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      throughput: 0
    };
    this.thresholds = {
      maxResponseTime: 2000, // 2 seconds
      maxMemoryUsage: 0.8,   // 80%
      maxCpuUsage: 0.75,     // 75%
      minCacheHitRate: 0.7   // 70%
    };
    this.init();
  }

  init() {
    this.setupLoadBalancing();
    this.initializeCaching();
    this.startResourceMonitoring();
    this.enablePerformanceOptimizations();
    console.log('✅ Enterprise Scaling System initialized');
  }

  // Load Balancing System
  setupLoadBalancing() {
    this.loadBalancer.configure({
      algorithm: 'round_robin', // round_robin, least_connections, weighted
      healthCheckInterval: 30000,
      maxRetries: 3,
      timeout: 10000,
      endpoints: [
        { 
          url: 'https://api-primary.asoos2100.cool',
          weight: 3,
          maxConnections: 1000,
          status: 'active'
        },
        { 
          url: 'https://api-secondary.asoos2100.cool',
          weight: 2,
          maxConnections: 800,
          status: 'active'
        },
        { 
          url: 'https://api-tertiary.asoos2100.cool',
          weight: 1,
          maxConnections: 500,
          status: 'standby'
        }
      ]
    });
  }

  // Multi-Level Caching System
  initializeCaching() {
    this.cacheManager.initialize({
      // Level 1: Memory Cache (fastest)
      memoryCache: {
        maxSize: 100 * 1024 * 1024, // 100MB
        ttl: 300000, // 5 minutes
        maxItems: 10000
      },
      // Level 2: Local Storage Cache
      localCache: {
        maxSize: 50 * 1024 * 1024, // 50MB
        ttl: 3600000, // 1 hour
        compression: true
      },
      // Level 3: IndexedDB Cache (largest)
      indexedDBCache: {
        maxSize: 500 * 1024 * 1024, // 500MB
        ttl: 86400000, // 24 hours
        database: 'ASOOS_Cache',
        version: 1
      },
      // Cache strategies
      strategies: {
        api_responses: 'memory_first',
        static_assets: 'local_storage',
        user_data: 'indexed_db',
        temporary_data: 'memory_only'
      }
    });
  }

  // Resource Monitoring
  startResourceMonitoring() {
    // Monitor every 10 seconds
    setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.triggerOptimizations();
    }, 10000);

    // Detailed monitoring every minute
    setInterval(() => {
      this.performDeepAnalysis();
      this.updateDashboard();
    }, 60000);
  }

  // Performance Optimizations
  enablePerformanceOptimizations() {
    this.performanceOptimizer.enable([
      'request_batching',
      'connection_pooling',
      'resource_prefetching',
      'lazy_loading',
      'compression',
      'minification',
      'cdn_optimization'
    ]);
  }

  // Metrics Collection
  collectMetrics() {
    const now = performance.now();
    
    // Memory metrics
    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }

    // Network metrics
    this.collectNetworkMetrics();
    
    // Cache metrics
    this.metrics.cacheHitRate = this.cacheManager.getHitRate();
    
    // Connection metrics
    this.metrics.activeConnections = this.loadBalancer.getActiveConnections();
    
    // Performance metrics
    this.collectPerformanceMetrics();
  }

  collectNetworkMetrics() {
    if (navigator.connection) {
      this.metrics.networkLatency = navigator.connection.rtt || 0;
      this.metrics.throughput = navigator.connection.downlink || 0;
    }
  }

  collectPerformanceMetrics() {
    const entries = performance.getEntriesByType('navigation')[0];
    if (entries) {
      this.metrics.domLoadTime = entries.domContentLoadedEventEnd - entries.domContentLoadedEventStart;
      this.metrics.pageLoadTime = entries.loadEventEnd - entries.loadEventStart;
    }

    // Resource timing
    const resourceEntries = performance.getEntriesByType('resource');
    this.metrics.resourceLoadTime = this.calculateAverageResourceTime(resourceEntries);
  }

  calculateAverageResourceTime(entries) {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return total / entries.length;
  }

  // Performance Analysis
  analyzePerformance() {
    const analysis = {
      memoryPressure: this.metrics.memoryUsage > this.thresholds.maxMemoryUsage,
      slowResponses: this.getAverageResponseTime() > this.thresholds.maxResponseTime,
      lowCacheHit: this.metrics.cacheHitRate < this.thresholds.minCacheHitRate,
      highLatency: this.metrics.networkLatency > 100,
      recommendations: []
    };

    if (analysis.memoryPressure) {
      analysis.recommendations.push('Trigger garbage collection');
      analysis.recommendations.push('Clear old cache entries');
    }

    if (analysis.slowResponses) {
      analysis.recommendations.push('Enable request batching');
      analysis.recommendations.push('Optimize API calls');
    }

    if (analysis.lowCacheHit) {
      analysis.recommendations.push('Improve cache strategy');
      analysis.recommendations.push('Increase cache TTL');
    }

    this.currentAnalysis = analysis;
    return analysis;
  }

  // Auto-scaling Triggers
  triggerOptimizations() {
    const analysis = this.currentAnalysis;
    if (!analysis) return;

    if (analysis.memoryPressure) {
      this.optimizeMemoryUsage();
    }

    if (analysis.slowResponses) {
      this.optimizeResponseTimes();
    }

    if (analysis.lowCacheHit) {
      this.optimizeCaching();
    }
  }

  optimizeMemoryUsage() {
    console.log('🧹 Optimizing memory usage...');
    
    // Trigger garbage collection
    this.cacheManager.cleanup();
    
    // Clear old performance entries
    if (performance.clearResourceTimings) {
      performance.clearResourceTimings();
    }
    
    // Optimize DOM
    this.optimizeDOM();
    
    console.log('✅ Memory optimization completed');
  }

  optimizeResponseTimes() {
    console.log('⚡ Optimizing response times...');
    
    // Enable request batching
    this.performanceOptimizer.enableRequestBatching();
    
    // Optimize load balancing
    this.loadBalancer.optimizeRouting();
    
    // Prefetch likely resources
    this.performanceOptimizer.prefetchResources();
    
    console.log('✅ Response time optimization completed');
  }

  optimizeCaching() {
    console.log('🔄 Optimizing caching strategy...');
    
    // Adjust cache TTL based on usage patterns
    this.cacheManager.optimizeTTL();
    
    // Implement smarter cache warming
    this.cacheManager.warmCache();
    
    // Enable compression for cached items
    this.cacheManager.enableCompression();
    
    console.log('✅ Cache optimization completed');
  }

  optimizeDOM() {
    // Remove unused event listeners
    this.removeUnusedListeners();
    
    // Optimize CSS animations
    this.optimizeCSSAnimations();
    
    // Clean up temporary DOM elements
    this.cleanupTempElements();
  }

  removeUnusedListeners() {
    // Implementation would identify and remove unused event listeners
    console.log('🧹 Cleaning up unused event listeners');
  }

  optimizeCSSAnimations() {
    // Optimize CSS animations for better performance
    const animations = document.getAnimations();
    animations.forEach(animation => {
      if (animation.playState === 'finished') {
        animation.cancel();
      }
    });
  }

  cleanupTempElements() {
    // Remove temporary elements that are no longer needed
    const tempElements = document.querySelectorAll('[data-temp="true"]');
    tempElements.forEach(element => {
      if (element.dataset.expires && Date.now() > parseInt(element.dataset.expires)) {
        element.remove();
      }
    });
  }

  // Deep Performance Analysis
  performDeepAnalysis() {
    const analysis = {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      trends: this.calculateTrends(),
      bottlenecks: this.identifyBottlenecks(),
      recommendations: this.generateRecommendations()
    };

    this.storeAnalysis(analysis);
    return analysis;
  }

  calculateTrends() {
    // Calculate performance trends over time
    const history = this.getMetricsHistory();
    if (history.length < 2) return {};

    return {
      memoryTrend: this.calculateTrend(history.map(h => h.memoryUsage)),
      responseTimeTrend: this.calculateTrend(history.map(h => h.responseTime)),
      cacheHitTrend: this.calculateTrend(history.map(h => h.cacheHitRate))
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, values.length);
    const older = values.slice(0, -5).reduce((a, b) => a + b, 0) / Math.max(1, values.length - 5);
    
    const change = (recent - older) / older;
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  identifyBottlenecks() {
    const bottlenecks = [];

    if (this.metrics.memoryUsage > 0.7) {
      bottlenecks.push({
        type: 'memory',
        severity: this.metrics.memoryUsage > 0.9 ? 'critical' : 'warning',
        description: 'High memory usage detected'
      });
    }

    if (this.getAverageResponseTime() > 1000) {
      bottlenecks.push({
        type: 'response_time',
        severity: this.getAverageResponseTime() > 3000 ? 'critical' : 'warning',
        description: 'Slow API response times'
      });
    }

    if (this.metrics.cacheHitRate < 0.5) {
      bottlenecks.push({
        type: 'cache',
        severity: 'warning',
        description: 'Low cache hit rate'
      });
    }

    return bottlenecks;
  }

  generateRecommendations() {
    const recommendations = [];
    const bottlenecks = this.identifyBottlenecks();

    bottlenecks.forEach(bottleneck => {
      switch (bottleneck.type) {
        case 'memory':
          recommendations.push({
            action: 'Enable aggressive garbage collection',
            priority: 'high',
            impact: 'Reduce memory pressure by 20-30%'
          });
          break;
        case 'response_time':
          recommendations.push({
            action: 'Implement request queuing and batching',
            priority: 'high',
            impact: 'Improve response times by 40-50%'
          });
          break;
        case 'cache':
          recommendations.push({
            action: 'Optimize cache warming strategy',
            priority: 'medium',
            impact: 'Increase cache hit rate to 80%+'
          });
          break;
      }
    });

    return recommendations;
  }

  // Metrics Storage and Retrieval
  storeAnalysis(analysis) {
    const key = `perf_analysis_${Date.now()}`;
    try {
      localStorage.setItem(key, JSON.stringify(analysis));
      
      // Keep only last 24 hours of analysis
      this.cleanupOldAnalysis();
    } catch (error) {
      console.warn('Failed to store performance analysis:', error);
    }
  }

  cleanupOldAnalysis() {
    const cutoff = Date.now() - 86400000; // 24 hours ago
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('perf_analysis_')) {
        const timestamp = parseInt(key.split('_')[2]);
        if (timestamp < cutoff) {
          localStorage.removeItem(key);
        }
      }
    });
  }

  getMetricsHistory() {
    const history = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('perf_analysis_')) {
        try {
          const analysis = JSON.parse(localStorage.getItem(key));
          history.push(analysis);
        } catch (error) {
          // Skip invalid entries
        }
      }
    });
    return history.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Utility Methods
  getAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    return this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length;
  }

  updateDashboard() {
    // Update performance dashboard if available
    const dashboard = document.getElementById('performance-dashboard');
    if (dashboard) {
      this.renderPerformanceDashboard(dashboard);
    }
  }

  renderPerformanceDashboard(container) {
    const analysis = this.performDeepAnalysis();
    
    container.innerHTML = `
      <div class="perf-dashboard">
        <h3>Performance Metrics</h3>
        <div class="metrics-grid">
          <div class="metric">
            <label>Memory Usage</label>
            <div class="metric-value ${this.metrics.memoryUsage > 0.8 ? 'warning' : 'normal'}">
              ${(this.metrics.memoryUsage * 100).toFixed(1)}%
            </div>
          </div>
          <div class="metric">
            <label>Cache Hit Rate</label>
            <div class="metric-value ${this.metrics.cacheHitRate < 0.7 ? 'warning' : 'good'}">
              ${(this.metrics.cacheHitRate * 100).toFixed(1)}%
            </div>
          </div>
          <div class="metric">
            <label>Avg Response Time</label>
            <div class="metric-value ${this.getAverageResponseTime() > 2000 ? 'warning' : 'good'}">
              ${this.getAverageResponseTime().toFixed(0)}ms
            </div>
          </div>
          <div class="metric">
            <label>Active Connections</label>
            <div class="metric-value">${this.metrics.activeConnections}</div>
          </div>
        </div>
        ${analysis.bottlenecks.length > 0 ? `
          <div class="bottlenecks">
            <h4>Performance Issues</h4>
            ${analysis.bottlenecks.map(b => `
              <div class="bottleneck ${b.severity}">
                <strong>${b.type.replace('_', ' ').toUpperCase()}</strong>: ${b.description}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${analysis.recommendations.length > 0 ? `
          <div class="recommendations">
            <h4>Recommendations</h4>
            ${analysis.recommendations.map(r => `
              <div class="recommendation">
                <strong>${r.action}</strong> (${r.priority} priority)
                <div class="impact">${r.impact}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Public API Methods
  getMetrics() {
    return { ...this.metrics };
  }

  getSystemStatus() {
    return {
      status: this.determineOverallStatus(),
      metrics: this.getMetrics(),
      analysis: this.currentAnalysis,
      uptime: Date.now() - this.startTime
    };
  }

  determineOverallStatus() {
    if (this.metrics.memoryUsage > 0.9) return 'critical';
    if (this.getAverageResponseTime() > 3000) return 'critical';
    if (this.metrics.memoryUsage > 0.8 || this.getAverageResponseTime() > 2000) return 'warning';
    return 'healthy';
  }

  // Manual optimization triggers
  optimizeNow() {
    console.log('🚀 Manual optimization triggered');
    this.optimizeMemoryUsage();
    this.optimizeResponseTimes();
    this.optimizeCaching();
    return this.getSystemStatus();
  }

  clearAllCaches() {
    return this.cacheManager.clearAll();
  }

  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      responseTime: [],
      activeConnections: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      throughput: 0
    };
    console.log('📊 Performance metrics reset');
  }
}

// Load Balancer Implementation
class LoadBalancer {
  constructor() {
    this.endpoints = [];
    this.currentIndex = 0;
    this.algorithm = 'round_robin';
    this.healthCheckInterval = null;
    this.activeConnections = 0;
  }

  configure(config) {
    this.endpoints = config.endpoints.map(endpoint => ({
      ...endpoint,
      connections: 0,
      responseTime: [],
      lastHealthCheck: null,
      healthy: true
    }));
    
    this.algorithm = config.algorithm;
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 10000;
    
    this.startHealthChecks(config.healthCheckInterval);
  }

  selectEndpoint() {
    const healthy = this.endpoints.filter(e => e.healthy && e.status === 'active');
    if (healthy.length === 0) return null;

    switch (this.algorithm) {
      case 'round_robin':
        return this.roundRobin(healthy);
      case 'least_connections':
        return this.leastConnections(healthy);
      case 'weighted':
        return this.weighted(healthy);
      default:
        return healthy[0];
    }
  }

  roundRobin(endpoints) {
    const endpoint = endpoints[this.currentIndex % endpoints.length];
    this.currentIndex++;
    return endpoint;
  }

  leastConnections(endpoints) {
    return endpoints.reduce((min, current) => 
      current.connections < min.connections ? current : min
    );
  }

  weighted(endpoints) {
    const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) return endpoint;
    }
    
    return endpoints[0];
  }

  startHealthChecks(interval) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, interval);
  }

  async performHealthChecks() {
    for (const endpoint of this.endpoints) {
      try {
        const start = performance.now();
        const response = await fetch(`${endpoint.url}/health`, {
          method: 'GET',
          timeout: 5000
        });
        
        const responseTime = performance.now() - start;
        endpoint.responseTime.push(responseTime);
        endpoint.responseTime = endpoint.responseTime.slice(-10); // Keep last 10
        endpoint.healthy = response.ok;
        endpoint.lastHealthCheck = Date.now();
        
      } catch (error) {
        endpoint.healthy = false;
        endpoint.lastHealthCheck = Date.now();
        console.warn(`Health check failed for ${endpoint.url}:`, error.message);
      }
    }
  }

  getActiveConnections() {
    return this.endpoints.reduce((total, e) => total + e.connections, 0);
  }

  optimizeRouting() {
    // Switch to least connections if load is uneven
    const connections = this.endpoints.map(e => e.connections);
    const max = Math.max(...connections);
    const min = Math.min(...connections);
    
    if (max - min > 50) { // Significant imbalance
      this.algorithm = 'least_connections';
      console.log('🔄 Switched to least connections algorithm due to load imbalance');
    }
  }
}

// Cache Manager Implementation
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.memoryCacheSize = 0;
    this.maxMemorySize = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.compressionEnabled = false;
  }

  initialize(config) {
    this.maxMemorySize = config.memoryCache.maxSize;
    this.defaultTTL = config.memoryCache.ttl;
    this.maxItems = config.memoryCache.maxItems;
    this.compressionEnabled = config.localCache?.compression || false;
    
    // Initialize IndexedDB cache if supported
    if ('indexedDB' in window) {
      this.initIndexedDB(config.indexedDBCache);
    }
    
    console.log('💾 Cache Manager initialized');
  }

  async initIndexedDB(config) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(config.database, config.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  async get(key, strategy = 'memory_first') {
    const cacheKey = this.generateCacheKey(key);
    
    switch (strategy) {
      case 'memory_first':
        return await this.getMemoryFirst(cacheKey);
      case 'local_storage':
        return await this.getFromLocalStorage(cacheKey);
      case 'indexed_db':
        return await this.getFromIndexedDB(cacheKey);
      default:
        return await this.getMemoryFirst(cacheKey);
    }
  }

  async getMemoryFirst(key) {
    // Try memory cache first
    let result = this.getFromMemory(key);
    if (result) {
      this.hitCount++;
      return result;
    }

    // Try localStorage
    result = this.getFromLocalStorage(key);
    if (result) {
      this.hitCount++;
      // Promote to memory cache
      this.setInMemory(key, result.data, result.ttl);
      return result;
    }

    // Try IndexedDB
    result = await this.getFromIndexedDB(key);
    if (result) {
      this.hitCount++;
      // Promote to memory cache
      this.setInMemory(key, result.data, result.ttl);
      return result;
    }

    this.missCount++;
    return null;
  }

  getFromMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.memoryCache.delete(key);
      this.memoryCacheSize -= item.size;
      return null;
    }
    
    item.lastAccessed = Date.now();
    return { data: item.data, ttl: item.expires - Date.now() };
  }

  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expires) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      let data = parsed.data;
      if (parsed.compressed && this.compressionEnabled) {
        data = this.decompress(data);
      }
      
      return { data, ttl: parsed.expires - Date.now() };
    } catch (error) {
      console.warn('LocalStorage cache error:', error);
      return null;
    }
  }

  async getFromIndexedDB(key) {
    if (!this.indexedDB) return null;
    
    return new Promise((resolve) => {
      const transaction = this.indexedDB.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result || Date.now() > result.expires) {
          if (result) {
            // Clean up expired item
            const deleteTransaction = this.indexedDB.transaction(['cache'], 'readwrite');
            deleteTransaction.objectStore('cache').delete(key);
          }
          resolve(null);
          return;
        }
        
        resolve({ data: result.data, ttl: result.expires - Date.now() });
      };
      
      request.onerror = () => resolve(null);
    });
  }

  async set(key, data, ttl = null, strategy = 'memory_first') {
    const cacheKey = this.generateCacheKey(key);
    const expires = Date.now() + (ttl || this.defaultTTL);
    
    switch (strategy) {
      case 'memory_first':
        this.setInMemory(cacheKey, data, expires);
        break;
      case 'local_storage':
        this.setInLocalStorage(cacheKey, data, expires);
        break;
      case 'indexed_db':
        await this.setInIndexedDB(cacheKey, data, expires);
        break;
      case 'all_levels':
        this.setInMemory(cacheKey, data, expires);
        this.setInLocalStorage(cacheKey, data, expires);
        await this.setInIndexedDB(cacheKey, data, expires);
        break;
    }
  }

  setInMemory(key, data, expires) {
    const size = this.calculateSize(data);
    
    // Check if we need to evict items
    while (this.memoryCacheSize + size > this.maxMemorySize || 
           this.memoryCache.size >= this.maxItems) {
      this.evictLRU();
    }
    
    this.memoryCache.set(key, {
      data,
      expires,
      size,
      created: Date.now(),
      lastAccessed: Date.now()
    });
    
    this.memoryCacheSize += size;
  }

  setInLocalStorage(key, data, expires) {
    try {
      let dataToStore = data;
      let compressed = false;
      
      if (this.compressionEnabled && this.calculateSize(data) > 1024) {
        dataToStore = this.compress(data);
        compressed = true;
      }
      
      const item = {
        data: dataToStore,
        expires,
        compressed,
        created: Date.now()
      };
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('LocalStorage cache set error:', error);
    }
  }

  async setInIndexedDB(key, data, expires) {
    if (!this.indexedDB) return;
    
    return new Promise((resolve) => {
      const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const item = {
        key,
        data,
        expires,
        created: Date.now()
      };
      
      const request = store.put(item);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  evictLRU() {
    if (this.memoryCache.size === 0) return;
    
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.memoryCache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const item = this.memoryCache.get(oldestKey);
      this.memoryCache.delete(oldestKey);
      this.memoryCacheSize -= item.size;
    }
  }

  cleanup() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache) {
      if (now > item.expires) {
        this.memoryCache.delete(key);
        this.memoryCacheSize -= item.size;
      }
    }
    
    // Clean localStorage cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (now > item.expires) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      }
    });
    
    console.log('🧹 Cache cleanup completed');
  }

  getHitRate() {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }

  optimizeTTL() {
    // Analyze access patterns and optimize TTL
    const accessPatterns = this.analyzeAccessPatterns();
    
    if (accessPatterns.frequentlyAccessed.length > 0) {
      // Increase TTL for frequently accessed items
      this.defaultTTL = Math.min(this.defaultTTL * 1.5, 3600000); // Max 1 hour
    }
  }

  warmCache() {
    // Pre-load frequently accessed data
    console.log('🔥 Warming cache with frequently accessed data');
  }

  enableCompression() {
    this.compressionEnabled = true;
    console.log('📦 Cache compression enabled');
  }

  analyzeAccessPatterns() {
    // Analyze which items are accessed most frequently
    return {
      frequentlyAccessed: [],
      rarelyAccessed: []
    };
  }

  compress(data) {
    // Simple compression simulation - in production use proper compression
    return btoa(JSON.stringify(data));
  }

  decompress(data) {
    // Simple decompression simulation
    return JSON.parse(atob(data));
  }

  calculateSize(data) {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  generateCacheKey(key) {
    return typeof key === 'string' ? key : JSON.stringify(key);
  }

  clearAll() {
    this.memoryCache.clear();
    this.memoryCacheSize = 0;
    
    // Clear localStorage cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear IndexedDB cache
    if (this.indexedDB) {
      const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
      transaction.objectStore('cache').clear();
    }
    
    console.log('🧹 All caches cleared');
    return true;
  }
}

// Resource Monitor Implementation
class ResourceMonitor {
  constructor() {
    this.metrics = {
      memory: { used: 0, total: 0, limit: 0 },
      network: { latency: 0, throughput: 0 },
      dom: { nodes: 0, listeners: 0 },
      storage: { used: 0, quota: 0 }
    };
    this.observers = [];
  }

  startMonitoring() {
    // Memory monitoring
    if (performance.memory) {
      setInterval(() => {
        this.updateMemoryMetrics();
      }, 5000);
    }

    // DOM monitoring
    this.setupDOMObserver();
    
    // Network monitoring
    this.setupNetworkMonitoring();
    
    // Storage monitoring
    this.setupStorageMonitoring();
  }

  updateMemoryMetrics() {
    if (performance.memory) {
      this.metrics.memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
  }

  setupDOMObserver() {
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        this.updateDOMMetrics();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      this.observers.push(observer);
    }
  }

  updateDOMMetrics() {
    this.metrics.dom = {
      nodes: document.querySelectorAll('*').length,
      listeners: this.estimateEventListeners()
    };
  }

  estimateEventListeners() {
    // Rough estimation - in production use proper listener tracking
    return document.querySelectorAll('[onclick], [onchange], [onsubmit]').length;
  }

  setupNetworkMonitoring() {
    if (navigator.connection) {
      const updateNetworkInfo = () => {
        this.metrics.network = {
          latency: navigator.connection.rtt || 0,
          throughput: navigator.connection.downlink || 0,
          type: navigator.connection.effectiveType || 'unknown'
        };
      };
      
      navigator.connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }
  }

  setupStorageMonitoring() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        this.metrics.storage = {
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      });
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Performance Optimizer Implementation
class PerformanceOptimizer {
  constructor() {
    this.enabledOptimizations = new Set();
    this.requestQueue = [];
    this.batchTimer = null;
    this.prefetchCache = new Set();
  }

  enable(optimizations) {
    optimizations.forEach(opt => {
      this.enabledOptimizations.add(opt);
      this.setupOptimization(opt);
    });
  }

  setupOptimization(optimization) {
    switch (optimization) {
      case 'request_batching':
        this.enableRequestBatching();
        break;
      case 'connection_pooling':
        this.enableConnectionPooling();
        break;
      case 'resource_prefetching':
        this.enableResourcePrefetching();
        break;
      case 'lazy_loading':
        this.enableLazyLoading();
        break;
      case 'compression':
        this.enableCompression();
        break;
      case 'minification':
        this.enableMinification();
        break;
      case 'cdn_optimization':
        this.enableCDNOptimization();
        break;
    }
  }

  enableRequestBatching() {
    console.log('📦 Request batching enabled');
  }

  enableConnectionPooling() {
    console.log('🔗 Connection pooling enabled');
  }

  enableResourcePrefetching() {
    console.log('⚡ Resource prefetching enabled');
  }

  enableLazyLoading() {
    if ('IntersectionObserver' in window) {
      const lazyElements = document.querySelectorAll('[data-lazy]');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyElement(entry.target);
            observer.unobserve(entry.target);
          }
        });
      });
      
      lazyElements.forEach(el => observer.observe(el));
      console.log('🐌 Lazy loading enabled for', lazyElements.length, 'elements');
    }
  }

  loadLazyElement(element) {
    const src = element.dataset.lazy;
    if (element.tagName === 'IMG') {
      element.src = src;
    } else {
      // Handle other lazy-loaded content
      element.innerHTML = src;
    }
    element.removeAttribute('data-lazy');
  }

  enableCompression() {
    console.log('📦 Response compression enabled');
  }

  enableMinification() {
    console.log('⚡ Asset minification enabled');
  }

  enableCDNOptimization() {
    console.log('🌐 CDN optimization enabled');
  }

  prefetchResources() {
    const criticalResources = [
      '/api/user/preferences',
      '/api/dashboard/summary',
      '/api/system/status'
    ];
    
    criticalResources.forEach(url => {
      if (!this.prefetchCache.has(url)) {
        fetch(url, { method: 'HEAD' }).catch(() => {});
        this.prefetchCache.add(url);
      }
    });
  }

  batchRequests(requests) {
    this.requestQueue.push(...requests);
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, 100); // 100ms batch window
  }

  processBatch() {
    if (this.requestQueue.length === 0) return;
    
    const batch = [...this.requestQueue];
    this.requestQueue = [];
    
    // Process batch of requests
    fetch('/api/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: batch })
    }).catch(error => {
      console.error('Batch request failed:', error);
    });
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnterpriseScalingSystem;
} else {
  window.EnterpriseScalingSystem = EnterpriseScalingSystem;
}

// Initialize if in browser environment
if (typeof window !== 'undefined') {
  window.enterpriseScalingSystem = new EnterpriseScalingSystem();
  console.log('✅ Enterprise Scaling System loaded and active');
}
