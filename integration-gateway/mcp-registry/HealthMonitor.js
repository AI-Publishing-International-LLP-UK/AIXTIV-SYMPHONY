#!/usr/bin/env node

/**
 * MCP HEALTH MONITORING SYSTEM
 * Diamond SAO Command Center Integration
 * 
 * Purpose: Automated health checking and monitoring for MCP services
 * Features: Periodic health checks, failure detection, recovery automation, alerting
 * Authority: Diamond SAO Command Center Integration
 * 
 * Integration: Service Registry, Diamond SAO dashboards, Alert Manager
 * Monitoring: Multi-level health checks with intelligent failure handling
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const EventEmitter = require('events');
const crypto = require('crypto');

console.log(`🔍 MCP HEALTH MONITORING SYSTEM`);
console.log(`💎 Diamond SAO Command Center Integration`);
console.log(`⚡ Automated Health & Recovery Operations`);
console.log(``);

class MCPHealthMonitor extends EventEmitter {
    constructor(serviceRegistry, config = {}) {
        super();
        
        if (!serviceRegistry) {
            throw new Error('ServiceRegistry instance required');
        }
        
        this.serviceRegistry = serviceRegistry;
        this.config = {
            defaultInterval: config.defaultInterval || 60000, // 1 minute
            defaultTimeout: config.defaultTimeout || 10000,   // 10 seconds
            maxConcurrentChecks: config.maxConcurrentChecks || 50,
            retryDelay: config.retryDelay || 5000,            // 5 seconds
            alertThreshold: config.alertThreshold || 3,        // consecutive failures
            recoveryThreshold: config.recoveryThreshold || 2,  // consecutive successes
            diamondCommandCenter: config.diamondCommandCenter || 'https://mocoa.2100.cool',
            alertWebhook: config.alertWebhook || null,
            enableRecovery: config.enableRecovery || true,
            healthCheckEndpoints: config.healthCheckEndpoints || ['/health', '/ready', '/metrics'],
            ...config
        };
        
        this.activeChecks = new Map(); // serviceId -> check info
        this.checkQueue = [];
        this.isRunning = false;
        this.stats = {
            totalChecks: 0,
            successfulChecks: 0,
            failedChecks: 0,
            servicesMonitored: 0,
            alertsSent: 0,
            startTime: null
        };
        
        // Health check result constants
        this.HEALTH_STATUS = {
            HEALTHY: 'healthy',
            UNHEALTHY: 'unhealthy',
            DEGRADED: 'degraded',
            UNKNOWN: 'unknown'
        };
        
        // Alert severity levels
        this.ALERT_LEVELS = {
            INFO: 'info',
            WARNING: 'warning',
            CRITICAL: 'critical',
            EMERGENCY: 'emergency'
        };
    }

    // Start health monitoring
    async start() {
        if (this.isRunning) {
            console.log(`⚠️  Health monitor already running`);
            return;
        }

        try {
            console.log(`🚀 Starting MCP Health Monitor...`);
            
            // Initialize service registry connection
            await this.serviceRegistry.initialize();
            
            this.isRunning = true;
            this.stats.startTime = new Date().toISOString();
            
            // Start monitoring loop
            this.startMonitoringLoop();
            
            console.log(`✅ Health Monitor started successfully`);
            console.log(`⏱️  Default interval: ${this.config.defaultInterval}ms`);
            console.log(`🔄 Max concurrent checks: ${this.config.maxConcurrentChecks}`);
            console.log(`🚨 Alert threshold: ${this.config.alertThreshold} failures`);
            
            // Emit start event
            this.emit('monitor.started', { startTime: this.stats.startTime });
            
        } catch (error) {
            console.error(`❌ Failed to start health monitor: ${error.message}`);
            throw error;
        }
    }

    // Stop health monitoring
    async stop() {
        console.log(`🛑 Stopping Health Monitor...`);
        
        this.isRunning = false;
        
        // Clear all active checks
        for (const [serviceId, checkInfo] of this.activeChecks) {
            if (checkInfo.timeoutId) {
                clearTimeout(checkInfo.timeoutId);
            }
            if (checkInfo.intervalId) {
                clearInterval(checkInfo.intervalId);
            }
        }
        
        this.activeChecks.clear();
        this.checkQueue = [];
        
        console.log(`✅ Health Monitor stopped`);
        this.emit('monitor.stopped', { stopTime: new Date().toISOString() });
    }

    // Start main monitoring loop
    startMonitoringLoop() {
        const monitorLoop = async () => {
            if (!this.isRunning) return;
            
            try {
                // Get all active services from registry
                const activeServices = await this.getActiveServices();
                
                // Update monitoring for active services
                await this.updateServiceMonitoring(activeServices);
                
                // Process check queue
                await this.processCheckQueue();
                
                // Update statistics
                this.updateStatistics();
                
            } catch (error) {
                console.error(`❌ Monitoring loop error: ${error.message}`);
                this.emit('monitor.error', { error: error.message });
            }
            
            // Schedule next loop iteration
            if (this.isRunning) {
                setTimeout(monitorLoop, Math.min(this.config.defaultInterval, 30000));
            }
        };
        
        // Start the loop
        setImmediate(monitorLoop);
    }

    // Get active services from registry
    async getActiveServices() {
        try {
            const result = await this.serviceRegistry.discoverServices({
                status: ['active', 'unhealthy', 'degraded'],
                limit: 1000
            }, 'diamond-sao-token'); // Use high-privilege token for monitoring
            
            return result.services || [];
            
        } catch (error) {
            console.error(`❌ Failed to get active services: ${error.message}`);
            return [];
        }
    }

    // Update monitoring for services
    async updateServiceMonitoring(services) {
        this.stats.servicesMonitored = services.length;
        
        for (const service of services) {
            if (!this.activeChecks.has(service.serviceId)) {
                // Start monitoring new service
                await this.startServiceMonitoring(service);
            } else {
                // Update existing monitoring if config changed
                await this.updateServiceMonitoring_single(service);
            }
        }
        
        // Stop monitoring services that are no longer active
        const activeServiceIds = new Set(services.map(s => s.serviceId));
        for (const [serviceId, checkInfo] of this.activeChecks) {
            if (!activeServiceIds.has(serviceId)) {
                await this.stopServiceMonitoring(serviceId);
            }
        }
    }

    // Start monitoring for a single service
    async startServiceMonitoring(service) {
        try {
            console.log(`🔍 Starting health monitoring for service: ${service.serviceId}`);
            
            const healthConfig = service.healthCheckConfig || {};
            const interval = this.parseInterval(healthConfig.interval) || this.config.defaultInterval;
            const timeout = this.parseInterval(healthConfig.timeout) || this.config.defaultTimeout;
            
            const checkInfo = {
                serviceId: service.serviceId,
                companyName: service.companyName,
                domain: service.domain,
                endpoints: service.serviceInfo.endpoints,
                healthConfig,
                interval,
                timeout,
                consecutiveFailures: 0,
                consecutiveSuccesses: 0,
                lastCheck: null,
                lastStatus: this.HEALTH_STATUS.UNKNOWN,
                intervalId: null,
                timeoutId: null
            };
            
            // Schedule periodic health checks
            checkInfo.intervalId = setInterval(() => {
                this.queueHealthCheck(service.serviceId);
            }, interval);
            
            // Perform initial check immediately
            this.queueHealthCheck(service.serviceId);
            
            this.activeChecks.set(service.serviceId, checkInfo);
            
        } catch (error) {
            console.error(`❌ Failed to start monitoring for ${service.serviceId}: ${error.message}`);
        }
    }

    // Update monitoring for existing service
    async updateServiceMonitoring_single(service) {
        const checkInfo = this.activeChecks.get(service.serviceId);
        if (!checkInfo) return;
        
        const healthConfig = service.healthCheckConfig || {};
        const newInterval = this.parseInterval(healthConfig.interval) || this.config.defaultInterval;
        
        // Update interval if changed
        if (newInterval !== checkInfo.interval) {
            console.log(`🔄 Updating check interval for ${service.serviceId}: ${newInterval}ms`);
            
            clearInterval(checkInfo.intervalId);
            checkInfo.interval = newInterval;
            checkInfo.intervalId = setInterval(() => {
                this.queueHealthCheck(service.serviceId);
            }, newInterval);
        }
        
        // Update configuration
        checkInfo.healthConfig = healthConfig;
        checkInfo.timeout = this.parseInterval(healthConfig.timeout) || this.config.defaultTimeout;
    }

    // Stop monitoring for a service
    async stopServiceMonitoring(serviceId) {
        console.log(`🛑 Stopping health monitoring for service: ${serviceId}`);
        
        const checkInfo = this.activeChecks.get(serviceId);
        if (!checkInfo) return;
        
        if (checkInfo.intervalId) {
            clearInterval(checkInfo.intervalId);
        }
        
        if (checkInfo.timeoutId) {
            clearTimeout(checkInfo.timeoutId);
        }
        
        this.activeChecks.delete(serviceId);
    }

    // Queue a health check
    queueHealthCheck(serviceId) {
        if (this.checkQueue.length >= this.config.maxConcurrentChecks * 2) {
            console.log(`⚠️  Check queue full, skipping check for ${serviceId}`);
            return;
        }
        
        this.checkQueue.push({
            serviceId,
            queuedAt: Date.now()
        });
    }

    // Process health check queue
    async processCheckQueue() {
        const currentChecks = Array.from(this.activeChecks.values())
            .filter(check => check.timeoutId !== null).length;
        
        while (this.checkQueue.length > 0 && currentChecks < this.config.maxConcurrentChecks) {
            const checkItem = this.checkQueue.shift();
            if (checkItem) {
                setImmediate(() => this.performHealthCheck(checkItem.serviceId));
            }
        }
    }

    // Perform health check for a service
    async performHealthCheck(serviceId) {
        const checkInfo = this.activeChecks.get(serviceId);
        if (!checkInfo) return;
        
        const startTime = Date.now();
        checkInfo.lastCheck = new Date().toISOString();
        
        try {
            console.log(`🔍 Health check: ${serviceId} (${checkInfo.domain})`);
            
            // Perform multi-endpoint health check
            const healthResult = await this.checkServiceHealth(checkInfo);
            
            const responseTime = Date.now() - startTime;
            
            // Update check info
            checkInfo.timeoutId = null;
            
            // Process health check result
            await this.processHealthCheckResult(serviceId, healthResult, responseTime);
            
            this.stats.totalChecks++;
            this.stats.successfulChecks++;
            
        } catch (error) {
            console.error(`❌ Health check failed for ${serviceId}: ${error.message}`);
            
            const responseTime = Date.now() - startTime;
            checkInfo.timeoutId = null;
            
            // Process failure
            await this.processHealthCheckFailure(serviceId, error, responseTime);
            
            this.stats.totalChecks++;
            this.stats.failedChecks++;
        }
    }

    // Check service health across multiple endpoints
    async checkServiceHealth(checkInfo) {
        const results = [];
        const endpoints = checkInfo.healthConfig.endpoints || this.config.healthCheckEndpoints;
        
        // Check primary endpoint
        const primaryResult = await this.checkEndpoint(
            checkInfo.endpoints.primary,
            checkInfo.timeout,
            checkInfo.healthConfig.expectedStatus || 200
        );
        results.push({ endpoint: 'primary', ...primaryResult });
        
        // Check health endpoints
        for (const endpoint of endpoints) {
            try {
                const fullUrl = checkInfo.endpoints.primary + endpoint;
                const result = await this.checkEndpoint(
                    fullUrl,
                    checkInfo.timeout,
                    checkInfo.healthConfig.expectedStatus || 200
                );
                results.push({ endpoint, ...result });
            } catch (error) {
                results.push({ 
                    endpoint, 
                    healthy: false, 
                    status: null, 
                    responseTime: 0, 
                    error: error.message 
                });
            }
        }
        
        // Determine overall health
        const healthyCount = results.filter(r => r.healthy).length;
        const totalCount = results.length;
        const healthPercentage = (healthyCount / totalCount) * 100;
        
        let overallStatus;
        if (healthPercentage >= 80) {
            overallStatus = this.HEALTH_STATUS.HEALTHY;
        } else if (healthPercentage >= 50) {
            overallStatus = this.HEALTH_STATUS.DEGRADED;
        } else {
            overallStatus = this.HEALTH_STATUS.UNHEALTHY;
        }
        
        return {
            status: overallStatus,
            healthPercentage,
            endpoints: results,
            responseTime: Math.max(...results.map(r => r.responseTime))
        };
    }

    // Check single endpoint
    async checkEndpoint(url, timeout, expectedStatus = 200) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                timeout: timeout,
                headers: {
                    'User-Agent': 'AIXTIV-MCP-HealthMonitor/1.0',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            };
            
            const req = client.request(options, (res) => {
                const responseTime = Date.now() - startTime;
                const healthy = res.statusCode === expectedStatus;
                
                resolve({
                    healthy,
                    status: res.statusCode,
                    responseTime,
                    headers: res.headers
                });
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                reject(new Error(`Request failed: ${error.message}`));
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${timeout}ms`));
            });
            
            req.end();
        });
    }

    // Process successful health check result
    async processHealthCheckResult(serviceId, healthResult, responseTime) {
        const checkInfo = this.activeChecks.get(serviceId);
        if (!checkInfo) return;
        
        const previousStatus = checkInfo.lastStatus;
        checkInfo.lastStatus = healthResult.status;
        
        if (healthResult.status === this.HEALTH_STATUS.HEALTHY) {
            checkInfo.consecutiveSuccesses++;
            checkInfo.consecutiveFailures = 0;
            
            // Check if service recovered
            if (previousStatus !== this.HEALTH_STATUS.HEALTHY && 
                checkInfo.consecutiveSuccesses >= this.config.recoveryThreshold) {
                
                console.log(`✅ Service recovered: ${serviceId}`);
                await this.handleServiceRecovery(serviceId, healthResult);
            }
            
        } else {
            checkInfo.consecutiveFailures++;
            checkInfo.consecutiveSuccesses = 0;
            
            // Check if service needs attention
            if (checkInfo.consecutiveFailures >= this.config.alertThreshold) {
                console.log(`🚨 Service unhealthy: ${serviceId} (${checkInfo.consecutiveFailures} failures)`);
                await this.handleServiceUnhealthy(serviceId, healthResult);
            }
        }
        
        // Update service registry
        await this.updateServiceHealth(serviceId, healthResult, responseTime);
        
        // Emit health check event
        this.emit('health.check', {
            serviceId,
            companyName: checkInfo.companyName,
            domain: checkInfo.domain,
            status: healthResult.status,
            responseTime,
            consecutiveFailures: checkInfo.consecutiveFailures,
            consecutiveSuccesses: checkInfo.consecutiveSuccesses
        });
    }

    // Process health check failure
    async processHealthCheckFailure(serviceId, error, responseTime) {
        const checkInfo = this.activeChecks.get(serviceId);
        if (!checkInfo) return;
        
        checkInfo.consecutiveFailures++;
        checkInfo.consecutiveSuccesses = 0;
        checkInfo.lastStatus = this.HEALTH_STATUS.UNHEALTHY;
        
        console.log(`❌ Health check failed for ${serviceId}: ${error.message}`);
        
        // Check if alert threshold reached
        if (checkInfo.consecutiveFailures >= this.config.alertThreshold) {
            await this.handleServiceUnhealthy(serviceId, {
                status: this.HEALTH_STATUS.UNHEALTHY,
                error: error.message,
                responseTime
            });
        }
        
        // Update service registry
        await this.updateServiceHealth(serviceId, {
            status: this.HEALTH_STATUS.UNHEALTHY,
            error: error.message
        }, responseTime);
        
        // Emit failure event
        this.emit('health.failure', {
            serviceId,
            companyName: checkInfo.companyName,
            domain: checkInfo.domain,
            error: error.message,
            consecutiveFailures: checkInfo.consecutiveFailures
        });
    }

    // Handle service recovery
    async handleServiceRecovery(serviceId, healthResult) {
        const checkInfo = this.activeChecks.get(serviceId);
        if (!checkInfo) return;
        
        // Update service status in registry
        try {
            await this.serviceRegistry.updateService(serviceId, {
                status: 'active',
                'healthStatus.lastCheck': new Date().toISOString(),
                'healthStatus.consecutiveFailures': 0
            }, 'diamond-sao-token');
            
        } catch (error) {
            console.error(`❌ Failed to update service status: ${error.message}`);
        }
        
        // Send recovery alert
        await this.sendAlert({
            level: this.ALERT_LEVELS.INFO,
            type: 'service.recovered',
            serviceId,
            companyName: checkInfo.companyName,
            domain: checkInfo.domain,
            message: `Service ${serviceId} has recovered and is healthy`,
            healthResult
        });
        
        this.emit('service.recovered', { serviceId, healthResult });
    }

    // Handle unhealthy service
    async handleServiceUnhealthy(serviceId, healthResult) {
        const checkInfo = this.activeChecks.get(serviceId);
        if (!checkInfo) return;
        
        // Update service status in registry
        try {
            await this.serviceRegistry.updateService(serviceId, {
                status: 'unhealthy',
                'healthStatus.lastCheck': new Date().toISOString(),
                'healthStatus.consecutiveFailures': checkInfo.consecutiveFailures,
                'healthStatus.lastFailure': new Date().toISOString()
            }, 'diamond-sao-token');
            
        } catch (error) {
            console.error(`❌ Failed to update service status: ${error.message}`);
        }
        
        // Determine alert level
        let alertLevel = this.ALERT_LEVELS.WARNING;
        if (checkInfo.consecutiveFailures >= this.config.alertThreshold * 2) {
            alertLevel = this.ALERT_LEVELS.CRITICAL;
        }
        if (checkInfo.consecutiveFailures >= this.config.alertThreshold * 3) {
            alertLevel = this.ALERT_LEVELS.EMERGENCY;
        }
        
        // Send alert
        await this.sendAlert({
            level: alertLevel,
            type: 'service.unhealthy',
            serviceId,
            companyName: checkInfo.companyName,
            domain: checkInfo.domain,
            message: `Service ${serviceId} is unhealthy (${checkInfo.consecutiveFailures} consecutive failures)`,
            healthResult,
            consecutiveFailures: checkInfo.consecutiveFailures
        });
        
        this.emit('service.unhealthy', { serviceId, healthResult, consecutiveFailures: checkInfo.consecutiveFailures });
    }

    // Update service health in registry
    async updateServiceHealth(serviceId, healthResult, responseTime) {
        try {
            const healthUpdate = {
                'healthStatus.lastCheck': new Date().toISOString(),
                'healthStatus.responseTime': responseTime || 0
            };
            
            if (healthResult.healthPercentage !== undefined) {
                healthUpdate['healthStatus.uptime'] = healthResult.healthPercentage;
            }
            
            await this.serviceRegistry.updateService(serviceId, healthUpdate, 'diamond-sao-token');
            
        } catch (error) {
            console.error(`❌ Failed to update health status: ${error.message}`);
        }
    }

    // Send alert
    async sendAlert(alertData) {
        try {
            console.log(`🚨 Sending ${alertData.level} alert for ${alertData.serviceId}`);
            
            this.stats.alertsSent++;
            
            // Emit alert event
            this.emit('alert', alertData);
            
            // Send to Diamond SAO Command Center (if configured)
            if (this.config.alertWebhook) {
                await this.sendWebhookAlert(alertData);
            }
            
        } catch (error) {
            console.error(`❌ Failed to send alert: ${error.message}`);
        }
    }

    // Send webhook alert
    async sendWebhookAlert(alertData) {
        // Implementation for webhook alerts to Diamond SAO Command Center
        // This would integrate with the existing alert management system
        console.log(`📡 Webhook alert sent for ${alertData.serviceId}`);
    }

    // Update statistics
    updateStatistics() {
        // Calculate uptime statistics, performance metrics, etc.
        const runtime = Date.now() - new Date(this.stats.startTime).getTime();
        const uptimeHours = runtime / (1000 * 60 * 60);
        
        // Log periodic statistics
        if (this.stats.totalChecks > 0 && this.stats.totalChecks % 100 === 0) {
            const successRate = (this.stats.successfulChecks / this.stats.totalChecks * 100).toFixed(2);
            console.log(`📊 Health Monitor Stats - Services: ${this.stats.servicesMonitored}, Checks: ${this.stats.totalChecks}, Success: ${successRate}%, Alerts: ${this.stats.alertsSent}`);
        }
    }

    // Parse interval string to milliseconds
    parseInterval(interval) {
        if (!interval || typeof interval === 'number') {
            return interval;
        }
        
        const match = interval.match(/^(\d+)(s|m|h)?$/);
        if (!match) return null;
        
        const value = parseInt(match[1]);
        const unit = match[2] || 's';
        
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            default: return value;
        }
    }

    // Get monitoring statistics
    getStatistics() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            activeChecks: this.activeChecks.size,
            queueLength: this.checkQueue.length,
            runtime: this.stats.startTime ? Date.now() - new Date(this.stats.startTime).getTime() : 0
        };
    }
}

module.exports = { MCPHealthMonitor };