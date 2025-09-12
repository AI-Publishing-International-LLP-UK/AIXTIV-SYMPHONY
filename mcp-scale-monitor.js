#!/usr/bin/env node

/**
 * MCP Scale Monitoring Dashboard
 * Real-time monitoring for 10K companies & 20M agents
 * Features: Health checks, performance metrics, alerts
 */

const fs = require('fs').promises;
const { execSync } = require('child_process');
const path = require('path');

class MCPScaleMonitor {
    constructor() {
        this.registryPath = '/Users/as/asoos/asoos-2100-cool-landing/mcp-company-registry.json';
        this.regions = ['us-west1', 'us-central1', 'eu-west1'];
        this.metrics = {
            companies: {},
            regions: {},
            system: {},
            alerts: [],
            lastUpdate: null
        };
        this.thresholds = {
            responseTime: 2000,      // 2 seconds
            errorRate: 1.0,          // 1%
            cpuUsage: 80,            // 80%
            memoryUsage: 85,         // 85%
            diskUsage: 90,           // 90%
            availability: 99.9       // 99.9%
        };
    }

    /**
     * Run comprehensive system monitoring
     */
    async runMonitoring() {
        console.log('🔍 Starting MCP Scale Monitoring...\n');
        
        try {
            // Parallel monitoring tasks
            const monitoringTasks = [
                this.monitorCompanies(),
                this.monitorRegions(),
                this.monitorSystemHealth(),
                this.monitorDatabase(),
                this.checkSallyPortIntegration()
            ];

            const results = await Promise.allSettled(monitoringTasks);
            
            // Process results
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`❌ Monitoring task ${index + 1} failed:`, result.reason);
                }
            });

            // Generate dashboard
            await this.generateDashboard();
            
            // Check alerts
            await this.processAlerts();
            
            this.metrics.lastUpdate = new Date().toISOString();
            
            console.log('✅ Monitoring cycle completed\n');
            
        } catch (error) {
            console.error('❌ Monitoring failed:', error.message);
        }
    }

    /**
     * Monitor individual companies
     */
    async monitorCompanies() {
        console.log('📊 Monitoring companies...');
        
        const registry = await this.loadRegistry();
        const companies = Object.keys(registry.companies || {});
        
        this.metrics.companies = {
            total: companies.length,
            active: 0,
            inactive: 0,
            errors: 0,
            responseMetrics: {}
        };

        // Batch health checks for performance
        const batchSize = 20;
        const batches = this.createBatches(companies, batchSize);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`   Checking batch ${i + 1}/${batches.length} (${batch.length} companies)`);
            
            const healthPromises = batch.map(company => 
                this.checkCompanyHealth(company, registry.companies[company])
            );
            
            const healthResults = await Promise.allSettled(healthPromises);
            
            healthResults.forEach((result, index) => {
                const company = batch[index];
                if (result.status === 'fulfilled') {
                    const health = result.value;
                    this.metrics.companies.responseMetrics[company] = health;
                    
                    if (health.status === 'healthy') {
                        this.metrics.companies.active++;
                    } else {
                        this.metrics.companies.inactive++;
                        if (health.error) {
                            this.metrics.companies.errors++;
                            this.addAlert('company_down', `Company ${company} is down: ${health.error}`);
                        }
                    }
                } else {
                    this.metrics.companies.errors++;
                    this.addAlert('monitoring_error', `Failed to check ${company}: ${result.reason}`);
                }
            });
            
            // Small delay between batches to avoid overwhelming the system
            if (i < batches.length - 1) {
                await this.delay(200);
            }
        }
        
        console.log(`   ✅ Monitored ${companies.length} companies`);
    }

    /**
     * Check individual company health
     */
    async checkCompanyHealth(companyName, companyData) {
        const startTime = Date.now();
        
        try {
            // First try to find the actual deployed service
            const actualService = await this.findActualMCPService(companyName);
            
            let healthUrl;
            if (actualService) {
                healthUrl = `${actualService}/health`;
            } else {
                // Fallback to configured endpoints or standard pattern
                const endpoints = companyData.endpoints || {};
                healthUrl = endpoints.health || `https://mcp.${companyName}.2100.cool/health`;
            }
            
            // Use curl for faster health checks
            const command = `curl -s -o /dev/null -w "%{http_code},%{time_total}" --connect-timeout 5 --max-time 10 "${healthUrl}"`;
            
            try {
                const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
                const [statusCode, responseTime] = output.trim().split(',');
                const responseTimeMs = Math.round(parseFloat(responseTime) * 1000);
                
                const isHealthy = statusCode === '200' && responseTimeMs < this.thresholds.responseTime;
                
                return {
                    status: isHealthy ? 'healthy' : 'degraded',
                    responseTime: responseTimeMs,
                    statusCode: parseInt(statusCode),
                    lastChecked: new Date().toISOString(),
                    region: companyData.region || 'unknown',
                    serviceUrl: actualService || healthUrl
                };
            } catch (execError) {
                return {
                    status: 'unhealthy',
                    error: 'Connection failed',
                    lastChecked: new Date().toISOString(),
                    region: companyData.region || 'unknown',
                    serviceUrl: actualService || healthUrl
                };
            }
            
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                lastChecked: new Date().toISOString(),
                region: companyData.region || 'unknown'
            };
        }
    }

    /**
     * Find the actual deployed MCP service for a company
     */
    async findActualMCPService(companyName) {
        try {
            // Check for common MCP service naming patterns
            const possibleNames = [
                `mcp-${companyName}-proxy`,
                `mcp-${companyName}`,
                `${companyName}-mcp`,
                `asoos-mcp-${companyName}`, // Special case for asoos pattern
            ];
            
            for (const serviceName of possibleNames) {
                try {
                    const serviceCommand = `gcloud run services describe ${serviceName} --region=us-west1 --format="value(status.url)" 2>/dev/null`;
                    const serviceUrl = execSync(serviceCommand, { encoding: 'utf8', stdio: 'pipe' }).trim();
                    
                    if (serviceUrl && serviceUrl.startsWith('https://')) {
                        return serviceUrl;
                    }
                } catch (error) {
                    // Service not found, continue checking
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Monitor regional performance
     */
    async monitorRegions() {
        console.log('🌍 Monitoring regions...');
        
        this.metrics.regions = {};
        
        for (const region of this.regions) {
            console.log(`   Checking ${region}...`);
            
            try {
                // Get Cloud Run services in region
                const servicesCommand = `gcloud run services list --region=${region} --format="value(name,status.url,status.conditions[0].status)" --filter="name:mcp-"`;
                
                let services = [];
                try {
                    const servicesOutput = execSync(servicesCommand, { encoding: 'utf8', stdio: 'pipe' });
                    services = servicesOutput.trim().split('\n').filter(line => line).map(line => {
                        const [name, url, status] = line.split('\t');
                        return { name, url, status: status === 'True' ? 'ready' : 'not_ready' };
                    });
                } catch (gcloudError) {
                    console.warn(`   ⚠️  Could not get services for ${region}: ${gcloudError.message}`);
                    services = [];
                }
                
                // Get resource utilization
                const regionMetrics = await this.getRegionMetrics(region);
                
                this.metrics.regions[region] = {
                    totalServices: services.length,
                    readyServices: services.filter(s => s.status === 'ready').length,
                    notReadyServices: services.filter(s => s.status === 'not_ready').length,
                    ...regionMetrics,
                    lastChecked: new Date().toISOString()
                };
                
                // Check for region-level issues
                const readyPercent = services.length > 0 ? 
                    (services.filter(s => s.status === 'ready').length / services.length) * 100 : 100;
                
                if (readyPercent < 95) {
                    this.addAlert('region_degraded', `Region ${region} has ${readyPercent.toFixed(1)}% services ready`);
                }
                
            } catch (error) {
                console.error(`   ❌ Error monitoring ${region}:`, error.message);
                this.metrics.regions[region] = {
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        }
        
        console.log('   ✅ Regional monitoring completed');
    }

    /**
     * Get region-specific metrics
     */
    async getRegionMetrics(region) {
        // This would integrate with GCP Monitoring API in production
        // For now, return mock data based on region load
        const mockMetrics = {
            'us-west1': { cpuUsage: 65, memoryUsage: 72, requestsPerSecond: 1250 },
            'us-central1': { cpuUsage: 45, memoryUsage: 58, requestsPerSecond: 890 },
            'eu-west1': { cpuUsage: 52, memoryUsage: 61, requestsPerSecond: 1050 }
        };
        
        return mockMetrics[region] || { cpuUsage: 0, memoryUsage: 0, requestsPerSecond: 0 };
    }

    /**
     * Monitor overall system health
     */
    async monitorSystemHealth() {
        console.log('⚡ Monitoring system health...');
        
        try {
            // Check core services
            const coreServices = [
                'integration-gateway-js',
                'asoos-complete',
                'asoos-master-mcp-mocoa-west'
            ];
            
            const serviceHealth = {};
            
            for (const service of coreServices) {
                try {
                    const logsCommand = `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${service}" --limit=10 --format="value(severity,textPayload)" --freshness=5m`;
                    
                    try {
                        const logs = execSync(logsCommand, { encoding: 'utf8', stdio: 'pipe' });
                        const errorLogs = logs.split('\n').filter(line => line.includes('ERROR')).length;
                        
                        serviceHealth[service] = {
                            status: errorLogs < 5 ? 'healthy' : 'degraded',
                            errorCount: errorLogs,
                            lastChecked: new Date().toISOString()
                        };
                        
                        if (errorLogs >= 5) {
                            this.addAlert('service_errors', `Service ${service} has ${errorLogs} errors in last 5 minutes`);
                        }
                    } catch (logsError) {
                        serviceHealth[service] = {
                            status: 'unknown',
                            error: 'Could not fetch logs',
                            lastChecked: new Date().toISOString()
                        };
                    }
                } catch (error) {
                    serviceHealth[service] = {
                        status: 'error',
                        error: error.message,
                        lastChecked: new Date().toISOString()
                    };
                }
            }
            
            this.metrics.system = {
                coreServices: serviceHealth,
                overallStatus: this.calculateSystemStatus(serviceHealth),
                lastChecked: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('   ❌ System health monitoring failed:', error.message);
            this.metrics.system = {
                error: error.message,
                lastChecked: new Date().toISOString()
            };
        }
        
        console.log('   ✅ System health monitoring completed');
    }

    /**
     * Monitor database connections and performance
     */
    async monitorDatabase() {
        console.log('🗄️  Monitoring database systems...');
        
        try {
            // This would connect to MongoDB Atlas, Firestore, Pinecone in production
            // For now, simulate database health checks
            
            const databases = {
                mongodb: await this.checkMongoDBHealth(),
                firestore: await this.checkFirestoreHealth(),
                pinecone: await this.checkPineconeHealth()
            };
            
            this.metrics.databases = databases;
            
            // Check for database issues
            Object.keys(databases).forEach(db => {
                const dbHealth = databases[db];
                if (dbHealth.status !== 'healthy') {
                    this.addAlert('database_issue', `Database ${db} status: ${dbHealth.status}`);
                }
            });
            
        } catch (error) {
            console.error('   ❌ Database monitoring failed:', error.message);
            this.metrics.databases = {
                error: error.message,
                lastChecked: new Date().toISOString()
            };
        }
        
        console.log('   ✅ Database monitoring completed');
    }

    /**
     * Check SallyPort integration health
     */
    async checkSallyPortIntegration() {
        console.log('🔐 Checking SallyPort integration...');
        
        try {
            const sallyPortUrl = 'https://sallyport.2100.cool/health';
            const command = `curl -s -o /dev/null -w "%{http_code},%{time_total}" --connect-timeout 5 --max-time 10 "${sallyPortUrl}"`;
            
            try {
                const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
                const [statusCode, responseTime] = output.trim().split(',');
                const responseTimeMs = Math.round(parseFloat(responseTime) * 1000);
                
                this.metrics.sallyPort = {
                    status: statusCode === '200' ? 'healthy' : 'degraded',
                    responseTime: responseTimeMs,
                    statusCode: parseInt(statusCode),
                    lastChecked: new Date().toISOString()
                };
                
                if (statusCode !== '200') {
                    this.addAlert('sallyport_down', `SallyPort returning status ${statusCode}`);
                }
                
            } catch (execError) {
                this.metrics.sallyPort = {
                    status: 'down',
                    error: 'Connection failed',
                    lastChecked: new Date().toISOString()
                };
                
                this.addAlert('sallyport_down', 'SallyPort is unreachable');
            }
            
        } catch (error) {
            console.error('   ❌ SallyPort check failed:', error.message);
            this.metrics.sallyPort = {
                status: 'error',
                error: error.message,
                lastChecked: new Date().toISOString()
            };
        }
        
        console.log('   ✅ SallyPort integration checked');
    }

    /**
     * Generate monitoring dashboard
     */
    async generateDashboard() {
        const dashboard = this.createDashboardHTML();
        const dashboardPath = '/Users/as/asoos/asoos-2100-cool-landing/mcp-monitoring-dashboard.html';
        
        await fs.writeFile(dashboardPath, dashboard);
        console.log(`📊 Dashboard generated: ${dashboardPath}`);
    }

    /**
     * Create HTML dashboard
     */
    createDashboardHTML() {
        const { companies, regions, system, databases, sallyPort } = this.metrics;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Scale Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
        .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .healthy { color: #4CAF50; }
        .degraded { color: #FF9800; }
        .unhealthy { color: #f44336; }
        .status-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; margin: 10px 0; }
        .status-fill { height: 100%; border-radius: 10px; }
        .alerts { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .alert-item { margin: 5px 0; color: #856404; }
        .timestamp { color: #666; font-size: 12px; margin-top: 10px; }
        .region-list { list-style: none; padding: 0; }
        .region-item { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 MCP Scale Monitoring Dashboard</h1>
        <p>Real-time monitoring for 10,000 companies & 20 million agents</p>
        <p class="timestamp">Last updated: ${this.metrics.lastUpdate || 'Never'}</p>
    </div>

    <div class="metrics-grid">
        <!-- Companies Overview -->
        <div class="metric-card">
            <div class="metric-title">📊 Companies Overview</div>
            <div class="metric-value">${companies?.total || 0}</div>
            <div>Total Companies</div>
            <div style="margin-top: 15px;">
                <div>✅ Active: ${companies?.active || 0}</div>
                <div>⚠️ Inactive: ${companies?.inactive || 0}</div>
                <div>❌ Errors: ${companies?.errors || 0}</div>
            </div>
            ${companies?.total > 0 ? `
            <div class="status-bar">
                <div class="status-fill healthy" style="width: ${((companies.active / companies.total) * 100)}%"></div>
            </div>
            <div>Availability: ${((companies.active / companies.total) * 100).toFixed(1)}%</div>
            ` : ''}
        </div>

        <!-- Regional Status -->
        <div class="metric-card">
            <div class="metric-title">🌍 Regional Status</div>
            <ul class="region-list">
                ${this.regions.map(region => {
                    const regionData = regions?.[region] || {};
                    const readyPercent = regionData.totalServices > 0 ? 
                        ((regionData.readyServices || 0) / regionData.totalServices * 100) : 0;
                    return `
                    <li class="region-item">
                        <strong>${region}</strong><br>
                        Services: ${regionData.readyServices || 0}/${regionData.totalServices || 0} ready<br>
                        CPU: ${regionData.cpuUsage || 0}% | Memory: ${regionData.memoryUsage || 0}%<br>
                        <div class="status-bar">
                            <div class="status-fill ${readyPercent >= 95 ? 'healthy' : readyPercent >= 80 ? 'degraded' : 'unhealthy'}" 
                                 style="width: ${readyPercent}%"></div>
                        </div>
                    </li>
                    `;
                }).join('')}
            </ul>
        </div>

        <!-- System Health -->
        <div class="metric-card">
            <div class="metric-title">⚡ System Health</div>
            <div class="metric-value ${this.getStatusClass(system?.overallStatus)}">${system?.overallStatus || 'Unknown'}</div>
            <div>Overall Status</div>
            ${system?.coreServices ? `
            <div style="margin-top: 15px;">
                ${Object.keys(system.coreServices).map(service => {
                    const serviceData = system.coreServices[service];
                    return `<div>📦 ${service}: <span class="${this.getStatusClass(serviceData.status)}">${serviceData.status}</span></div>`;
                }).join('')}
            </div>
            ` : ''}
        </div>

        <!-- Database Status -->
        <div class="metric-card">
            <div class="metric-title">🗄️ Database Systems</div>
            ${databases ? Object.keys(databases).map(db => {
                const dbData = databases[db];
                return `<div>💾 ${db.toUpperCase()}: <span class="${this.getStatusClass(dbData.status)}">${dbData.status}</span></div>`;
            }).join('') : '<div>No database data available</div>'}
        </div>

        <!-- SallyPort Integration -->
        <div class="metric-card">
            <div class="metric-title">🔐 SallyPort Integration</div>
            <div class="metric-value ${this.getStatusClass(sallyPort?.status)}">${sallyPort?.status || 'Unknown'}</div>
            <div>Authentication System</div>
            ${sallyPort?.responseTime ? `
            <div style="margin-top: 15px;">
                Response Time: ${sallyPort.responseTime}ms<br>
                Status Code: ${sallyPort.statusCode}
            </div>
            ` : ''}
        </div>
    </div>

    <!-- Alerts Section -->
    ${this.metrics.alerts.length > 0 ? `
    <div class="alerts">
        <h3>⚠️ Active Alerts (${this.metrics.alerts.length})</h3>
        ${this.metrics.alerts.map(alert => `
            <div class="alert-item">
                <strong>${alert.type}:</strong> ${alert.message}
                <span class="timestamp">(${new Date(alert.timestamp).toLocaleString()})</span>
            </div>
        `).join('')}
    </div>
    ` : '<div class="alerts"><h3>✅ No Active Alerts</h3></div>'}

    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, 300000);
    </script>
</body>
</html>`;
    }

    /**
     * Helper methods
     */
    getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'healthy': 
            case 'ready': 
            case 'active': 
                return 'healthy';
            case 'degraded': 
            case 'warning': 
                return 'degraded';
            case 'unhealthy': 
            case 'down': 
            case 'error': 
            case 'failed': 
                return 'unhealthy';
            default: 
                return '';
        }
    }

    addAlert(type, message) {
        this.metrics.alerts.push({
            type,
            message,
            timestamp: new Date().toISOString()
        });
    }

    calculateSystemStatus(serviceHealth) {
        const services = Object.values(serviceHealth);
        const healthyCount = services.filter(s => s.status === 'healthy').length;
        const totalCount = services.length;
        
        if (totalCount === 0) return 'unknown';
        if (healthyCount === totalCount) return 'healthy';
        if (healthyCount >= totalCount * 0.8) return 'degraded';
        return 'unhealthy';
    }

    async processAlerts() {
        if (this.metrics.alerts.length > 0) {
            console.log(`\n⚠️  ${this.metrics.alerts.length} alerts detected:`);
            this.metrics.alerts.forEach(alert => {
                console.log(`   ${alert.type}: ${alert.message}`);
            });
            
            // In production, this would send notifications via email, Slack, PagerDuty, etc.
            await this.saveAlerts();
        } else {
            console.log('\n✅ No alerts detected');
        }
    }

    async saveAlerts() {
        const alertsPath = '/Users/as/asoos/asoos-2100-cool-landing/mcp-alerts.json';
        const alertsData = {
            alerts: this.metrics.alerts,
            generatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(alertsPath, JSON.stringify(alertsData, null, 2));
    }

    // Mock database health checks (would be real in production)
    async checkMongoDBHealth() {
        return { status: 'healthy', responseTime: 45, connections: 150, lastChecked: new Date().toISOString() };
    }

    async checkFirestoreHealth() {
        return { status: 'healthy', responseTime: 32, operations: 2500, lastChecked: new Date().toISOString() };
    }

    async checkPineconeHealth() {
        return { status: 'healthy', responseTime: 67, vectors: 50000000, lastChecked: new Date().toISOString() };
    }

    // Utility methods
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async loadRegistry() {
        try {
            const data = await fs.readFile(this.registryPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { companies: {} };
        }
    }
}

// CLI Usage
if (require.main === module) {
    const monitor = new MCPScaleMonitor();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'run';

    switch (command) {
        case 'run':
            monitor.runMonitoring()
                .then(() => console.log('Monitoring completed successfully'))
                .catch(error => {
                    console.error('Monitoring failed:', error);
                    process.exit(1);
                });
            break;

        case 'continuous':
            console.log('Starting continuous monitoring (every 5 minutes)...');
            const runContinuous = async () => {
                while (true) {
                    try {
                        await monitor.runMonitoring();
                        await monitor.delay(300000); // 5 minutes
                    } catch (error) {
                        console.error('Monitoring cycle failed:', error);
                        await monitor.delay(60000); // 1 minute on error
                    }
                }
            };
            runContinuous();
            break;

        default:
            console.log('MCP Scale Monitor v1.0');
            console.log('Usage:');
            console.log('  node mcp-scale-monitor.js run        - Run single monitoring cycle');
            console.log('  node mcp-scale-monitor.js continuous - Run continuous monitoring');
    }
}

module.exports = MCPScaleMonitor;
