/**
 * Enterprise Self-Healing and Resilience System
 * Auto-recovery, circuit breakers, retry logic, and failover mechanisms
 */

class EnterpriseSelfHealingSystem {
  constructor() {
    this.circuitBreakers = new Map();
    this.retryPolicies = new Map();
    this.failoverSystems = new Map();
    this.healthChecks = new Map();
    this.recoveryCallbacks = new Map();
    this.systemMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitBreakerTrips: 0,
      recoveries: 0,
      uptime: Date.now()
    };
    this.init();
  }

  init() {
    this.setupCircuitBreakers();
    this.setupRetryPolicies();
    this.setupFailoverSystems();
    this.setupHealthChecks();
    this.startPeriodicHealthChecks();
    console.log('✅ Enterprise Self-Healing System initialized');
  }

  // Circuit Breaker Implementation
  setupCircuitBreakers() {
    // API Circuit Breaker
    this.circuitBreakers.set('api', {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      successCount: 0,
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      resetTimeout: 60000, // 1 minute
      lastFailureTime: null,
      requests: []
    });

    // Database Circuit Breaker
    this.circuitBreakers.set('database', {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      failureThreshold: 3,
      recoveryTimeout: 60000, // 1 minute
      resetTimeout: 120000, // 2 minutes
      lastFailureTime: null,
      requests: []
    });

    // Voice Service Circuit Breaker
    this.circuitBreakers.set('voice', {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      failureThreshold: 5,
      recoveryTimeout: 15000, // 15 seconds
      resetTimeout: 30000, // 30 seconds
      lastFailureTime: null,
      requests: []
    });

    // OAuth Service Circuit Breaker
    this.circuitBreakers.set('oauth', {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      failureThreshold: 3,
      recoveryTimeout: 45000, // 45 seconds
      resetTimeout: 90000, // 1.5 minutes
      lastFailureTime: null,
      requests: []
    });
  }

  // Retry Policies
  setupRetryPolicies() {
    // Exponential backoff retry
    this.retryPolicies.set('exponential', {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      jitter: true
    });

    // Fixed interval retry
    this.retryPolicies.set('fixed', {
      maxAttempts: 5,
      delay: 2000,
      jitter: false
    });

    // Linear backoff retry
    this.retryPolicies.set('linear', {
      maxAttempts: 4,
      baseDelay: 1000,
      increment: 1000,
      maxDelay: 5000,
      jitter: true
    });
  }

  // Failover Systems
  setupFailoverSystems() {
    // API Failover
    this.failoverSystems.set('api', {
      primary: '/api/primary',
      fallbacks: ['/api/secondary', '/api/tertiary'],
      currentIndex: 0,
      healthCheck: (url) => this.checkEndpointHealth(url)
    });

    // Voice Service Failover
    this.failoverSystems.set('voice', {
      primary: 'elevenlabs',
      fallbacks: ['openai', 'browser'],
      currentIndex: 0,
      healthCheck: (service) => this.checkVoiceServiceHealth(service)
    });

    // Authentication Failover
    this.failoverSystems.set('auth', {
      primary: 'oauth2',
      fallbacks: ['basic', 'anonymous'],
      currentIndex: 0,
      healthCheck: (method) => this.checkAuthMethodHealth(method)
    });
  }

  // Health Checks
  setupHealthChecks() {
    this.healthChecks.set('system', {
      interval: 30000, // 30 seconds
      timeout: 5000,
      check: () => this.performSystemHealthCheck()
    });

    this.healthChecks.set('memory', {
      interval: 60000, // 1 minute
      timeout: 1000,
      check: () => this.performMemoryHealthCheck()
    });

    this.healthChecks.set('storage', {
      interval: 120000, // 2 minutes
      timeout: 3000,
      check: () => this.performStorageHealthCheck()
    });
  }

  // Circuit Breaker Logic
  async executeWithCircuitBreaker(serviceName, operation) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      throw new Error(`Circuit breaker not found for service: ${serviceName}`);
    }

    this.systemMetrics.totalRequests++;

    // Check circuit breaker state
    if (circuitBreaker.state === 'OPEN') {
      // Check if recovery timeout has passed
      if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.recoveryTimeout) {
        circuitBreaker.state = 'HALF_OPEN';
        circuitBreaker.successCount = 0;
        console.log(`🔄 Circuit breaker for ${serviceName} moved to HALF_OPEN state`);
      } else {
        // Circuit is still open, reject immediately
        throw new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
      }
    }

    try {
      // Execute the operation
      const result = await operation();
      
      // Success - update circuit breaker
      this.handleCircuitBreakerSuccess(serviceName);
      this.systemMetrics.successfulRequests++;
      
      return result;
    } catch (error) {
      // Failure - update circuit breaker
      this.handleCircuitBreakerFailure(serviceName, error);
      this.systemMetrics.failedRequests++;
      
      throw error;
    }
  }

  handleCircuitBreakerSuccess(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (circuitBreaker.state === 'HALF_OPEN') {
      circuitBreaker.successCount++;
      
      // If we've had enough successes, close the circuit
      if (circuitBreaker.successCount >= 3) {
        circuitBreaker.state = 'CLOSED';
        circuitBreaker.failureCount = 0;
        circuitBreaker.successCount = 0;
        this.systemMetrics.recoveries++;
        console.log(`✅ Circuit breaker for ${serviceName} CLOSED - service recovered`);
        
        // Trigger recovery callback if exists
        const recoveryCallback = this.recoveryCallbacks.get(serviceName);
        if (recoveryCallback) {
          recoveryCallback();
        }
      }
    } else if (circuitBreaker.state === 'CLOSED') {
      // Reset failure count on success
      circuitBreaker.failureCount = Math.max(0, circuitBreaker.failureCount - 1);
    }
  }

  handleCircuitBreakerFailure(serviceName, error) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();
    
    // Add to request history
    circuitBreaker.requests.push({
      timestamp: Date.now(),
      success: false,
      error: error.message
    });
    
    // Keep only recent requests (last hour)
    const oneHourAgo = Date.now() - 3600000;
    circuitBreaker.requests = circuitBreaker.requests.filter(req => req.timestamp > oneHourAgo);
    
    // Check if we should open the circuit
    if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
      circuitBreaker.state = 'OPEN';
      this.systemMetrics.circuitBreakerTrips++;
      console.log(`🔴 Circuit breaker for ${serviceName} OPENED due to ${circuitBreaker.failureCount} failures`);
      
      // Schedule automatic reset
      setTimeout(() => {
        if (circuitBreaker.state === 'OPEN') {
          circuitBreaker.state = 'HALF_OPEN';
          console.log(`🟡 Circuit breaker for ${serviceName} moved to HALF_OPEN for testing`);
        }
      }, circuitBreaker.resetTimeout);
    }
  }

  // Retry Logic with Various Strategies
  async executeWithRetry(operation, policyName = 'exponential', context = {}) {
    const policy = this.retryPolicies.get(policyName);
    if (!policy) {
      throw new Error(`Retry policy not found: ${policyName}`);
    }

    let lastError;
    let attempt = 0;

    while (attempt < policy.maxAttempts) {
      try {
        const result = await operation(attempt, context);
        
        if (attempt > 0) {
          console.log(`✅ Operation succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt >= policy.maxAttempts) {
          console.log(`❌ Operation failed after ${policy.maxAttempts} attempts`);
          break;
        }

        const delay = this.calculateRetryDelay(policy, attempt);
        console.log(`🔄 Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`);
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  calculateRetryDelay(policy, attempt) {
    let delay;

    switch (policy.type || 'exponential') {
    case 'exponential':
      delay = Math.min(
        policy.baseDelay * Math.pow(policy.backoffFactor, attempt - 1),
        policy.maxDelay
      );
      break;
    case 'linear':
      delay = Math.min(
        policy.baseDelay + (policy.increment * (attempt - 1)),
        policy.maxDelay
      );
      break;
    case 'fixed':
    default:
      delay = policy.delay || policy.baseDelay;
      break;
    }

    // Add jitter if enabled
    if (policy.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  // Failover Logic
  async executeWithFailover(serviceName, operation) {
    const failoverSystem = this.failoverSystems.get(serviceName);
    if (!failoverSystem) {
      throw new Error(`Failover system not found: ${serviceName}`);
    }

    const allEndpoints = [failoverSystem.primary, ...failoverSystem.fallbacks];
    let lastError;

    for (let i = 0; i < allEndpoints.length; i++) {
      const endpoint = allEndpoints[i];
      
      try {
        // Check endpoint health first
        const isHealthy = await failoverSystem.healthCheck(endpoint);
        if (!isHealthy && i === 0) {
          // Primary is unhealthy, skip to fallback
          console.log(`⚠️ Primary ${serviceName} endpoint unhealthy, failing over`);
          continue;
        }

        const result = await operation(endpoint, i);
        
        // Success - update current index if we failed over
        if (i !== failoverSystem.currentIndex) {
          console.log(`✅ Failover successful for ${serviceName}, using endpoint ${i}`);
          failoverSystem.currentIndex = i;
        }
        
        return result;
      } catch (error) {
        lastError = error;
        console.log(`❌ ${serviceName} endpoint ${i} failed: ${error.message}`);
        
        // Try next endpoint
        continue;
      }
    }

    // All endpoints failed
    throw new Error(`All ${serviceName} endpoints failed. Last error: ${lastError?.message}`);
  }

  // Health Check Implementations
  async performSystemHealthCheck() {
    const startTime = Date.now();
    const checks = {
      timestamp: startTime,
      uptime: startTime - this.systemMetrics.uptime,
      memory: this.getMemoryUsage(),
      circuitBreakers: this.getCircuitBreakerStatus(),
      errors: this.getRecentErrors()
    };

    const isHealthy = checks.memory.heapUsed < checks.memory.heapTotal * 0.9 &&
                     Object.values(checks.circuitBreakers).every(cb => cb.state !== 'OPEN');

    return {
      healthy: isHealthy,
      checks,
      timestamp: startTime
    };
  }

  async performMemoryHealthCheck() {
    const memory = this.getMemoryUsage();
    const threshold = 0.85; // 85% memory usage threshold
    
    const isHealthy = memory.heapUsed < memory.heapTotal * threshold;
    
    if (!isHealthy) {
      console.warn('⚠️ High memory usage detected, triggering garbage collection');
      this.triggerGarbageCollection();
    }

    return {
      healthy: isHealthy,
      usage: memory,
      threshold
    };
  }

  async performStorageHealthCheck() {
    try {
      // Test localStorage availability and quota
      const testKey = '__storage_health_check__';
      const testValue = 'health_check_value_' + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const isHealthy = retrieved === testValue;
      
      return {
        healthy: isHealthy,
        available: true,
        quota: this.getStorageQuota()
      };
    } catch (error) {
      return {
        healthy: false,
        available: false,
        error: error.message
      };
    }
  }

  // Health Check Helpers
  getMemoryUsage() {
    if (performance.memory) {
      return {
        heapUsed: performance.memory.usedJSHeapSize,
        heapTotal: performance.memory.totalJSHeapSize,
        heapLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return { heapUsed: 0, heapTotal: 0, heapLimit: 0 };
  }

  getCircuitBreakerStatus() {
    const status = {};
    for (const [name, cb] of this.circuitBreakers.entries()) {
      status[name] = {
        state: cb.state,
        failureCount: cb.failureCount,
        successCount: cb.successCount,
        lastFailureTime: cb.lastFailureTime
      };
    }
    return status;
  }

  getRecentErrors() {
    const oneHourAgo = Date.now() - 3600000;
    const errors = [];
    
    for (const [name, cb] of this.circuitBreakers.entries()) {
      const recentErrors = cb.requests
        .filter(req => !req.success && req.timestamp > oneHourAgo)
        .slice(-5); // Last 5 errors
      
      if (recentErrors.length > 0) {
        errors.push({ service: name, errors: recentErrors });
      }
    }
    
    return errors;
  }

  getStorageQuota() {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      return { used, estimated: true };
    } catch {
      return { used: 0, estimated: false };
    }
  }

  // Recovery and Maintenance
  triggerGarbageCollection() {
    // Clear old circuit breaker requests
    for (const [name, cb] of this.circuitBreakers.entries()) {
      const oneHourAgo = Date.now() - 3600000;
      cb.requests = cb.requests.filter(req => req.timestamp > oneHourAgo);
    }

    // Clear old localStorage items if needed
    try {
      const keysToRemove = [];
      for (let key in localStorage) {
        if (key.startsWith('temp_') || key.startsWith('cache_')) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const data = JSON.parse(item);
              if (data.timestamp && Date.now() - data.timestamp > 86400000) { // 24 hours
                keysToRemove.push(key);
              }
            } catch (e) {
              // Invalid JSON, remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleaned up ${keysToRemove.length} old storage items`);
    } catch (error) {
      console.warn('Storage cleanup failed:', error);
    }
  }

  // Periodic Health Checks
  startPeriodicHealthChecks() {
    for (const [name, healthCheck] of this.healthChecks.entries()) {
      setInterval(async () => {
        try {
          const result = await Promise.race([
            healthCheck.check(),
            this.timeoutPromise(healthCheck.timeout)
          ]);
          
          if (!result.healthy) {
            console.warn(`⚠️ Health check failed for ${name}:`, result);
            await this.handleHealthCheckFailure(name, result);
          }
        } catch (error) {
          console.error(`❌ Health check error for ${name}:`, error);
          await this.handleHealthCheckFailure(name, { error: error.message });
        }
      }, healthCheck.interval);
    }
  }

  async handleHealthCheckFailure(checkName, result) {
    switch (checkName) {
    case 'memory':
      this.triggerGarbageCollection();
      break;
    case 'storage':
      this.clearExpiredCache();
      break;
    case 'system':
      this.performSystemRecovery();
      break;
    }
  }

  async performSystemRecovery() {
    console.log('🔄 Performing system recovery...');
    
    // Reset circuit breakers if they've been open too long
    const maxOpenTime = 300000; // 5 minutes
    for (const [name, cb] of this.circuitBreakers.entries()) {
      if (cb.state === 'OPEN' && Date.now() - cb.lastFailureTime > maxOpenTime) {
        cb.state = 'HALF_OPEN';
        cb.failureCount = Math.floor(cb.failureCount / 2);
        console.log(`🔄 Force-reset circuit breaker for ${name}`);
      }
    }
    
    // Clear caches
    this.clearExpiredCache();
    
    // Trigger garbage collection
    this.triggerGarbageCollection();
    
    console.log('✅ System recovery completed');
  }

  clearExpiredCache() {
    // Implementation would clear expired cache entries
    console.log('🧹 Clearing expired cache entries');
  }

  // Utility Methods
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  timeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeout);
    });
  }

  // API Methods for External Integration
  addRecoveryCallback(serviceName, callback) {
    this.recoveryCallbacks.set(serviceName, callback);
  }

  getSystemMetrics() {
    return {
      ...this.systemMetrics,
      circuitBreakers: this.getCircuitBreakerStatus(),
      uptime: Date.now() - this.systemMetrics.uptime
    };
  }

  // Health Check Endpoint Implementations
  async checkEndpointHealth(url) {
    try {
      const response = await fetch(url + '/health', {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkVoiceServiceHealth(service) {
    // Implement voice service specific health checks
    switch (service) {
    case 'elevenlabs':
      return await this.checkEndpointHealth('https://api.elevenlabs.io');
    case 'openai':
      return await this.checkEndpointHealth('https://api.openai.com');
    case 'browser':
      return 'speechSynthesis' in window;
    default:
      return false;
    }
  }

  async checkAuthMethodHealth(method) {
    // Implement auth method specific health checks
    switch (method) {
    case 'oauth2':
      return this.circuitBreakers.get('oauth')?.state !== 'OPEN';
    case 'basic':
      return true; // Basic auth is always available
    case 'anonymous':
      return true; // Anonymous is always available as fallback
    default:
      return false;
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnterpriseSelfHealingSystem;
} else {
  window.EnterpriseSelfHealingSystem = EnterpriseSelfHealingSystem;
}

// Initialize if in browser environment
if (typeof window !== 'undefined') {
  window.selfHealingSystem = new EnterpriseSelfHealingSystem();
  console.log('✅ Enterprise Self-Healing System loaded and active');
}
