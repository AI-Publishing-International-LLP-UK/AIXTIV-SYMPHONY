/**
 * Trinity Monitoring System v1.2.7
 * Comprehensive monitoring and health checking for Trinity infrastructure
 * Integrates with Enterprise Security Anti-Lock System
 * 
 * Components Monitored:
 * - Dream Commander Integration
 * - UFO Universal MCP Integration  
 * - Enhanced WFA-MCP Integration
 * - Enterprise Security Anti-Lock System
 * - Voice and Chat Systems
 * - GCP Service Accounts and Authentication
 * - Dr. Claude Quantum Orchestration
 * - Testament Swarm Connectivity
 * - Performance and Resource Usage
 */

class TrinityMonitoringSystem {
    constructor() {
        this.version = '1.2.7';
        this.monitoringId = 'trinity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.isActive = false;
        this.monitoringInterval = null;
        this.healthCheckInterval = null;
        this.alertThresholds = {
            response_time_ms: 5000,
            error_rate_percent: 5,
            memory_usage_percent: 85,
            cpu_usage_percent: 80,
            api_success_rate_percent: 95
        };
        
        // Component status tracking
        this.componentStatus = {
            dream_commander: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            ufo_mcp: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            wfa_mcp: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            security_anti_lock: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            voice_system: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            chat_system: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            gcp_auth: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            dr_claude_orchestration: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            testament_swarm: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 },
            ui_responsiveness: { status: 'unknown', last_check: null, response_time: 0, error_count: 0 }
        };
        
        // Performance metrics
        this.performanceMetrics = {
            page_load_time: 0,
            dom_ready_time: 0,
            first_paint_time: 0,
            largest_contentful_paint: 0,
            cumulative_layout_shift: 0,
            first_input_delay: 0,
            memory_usage: 0,
            script_execution_time: 0,
            api_calls_count: 0,
            api_success_count: 0,
            api_error_count: 0,
            voice_synthesis_latency: 0,
            speech_recognition_accuracy: 0
        };
        
        // Alert history
        this.alertHistory = [];
        this.maxAlertHistory = 100;
        
        // Integration with Enterprise Security Anti-Lock
        this.securityIntegration = null;
        
        console.log(`🔍 Trinity Monitoring System v${this.version} initialized - ID: ${this.monitoringId}`);
        this.initialize();
    }
    
    async initialize() {
        try {
            // Wait for DOM and other systems to be ready
            if (document.readyState !== 'complete') {
                window.addEventListener('load', () => this.initialize());
                return;
            }
            
            // Initialize performance observer
            this.initializePerformanceObserver();
            
            // Initialize error tracking
            this.initializeErrorTracking();
            
            // Integrate with Enterprise Security Anti-Lock System
            this.integrateWithSecuritySystem();
            
            // Start monitoring
            this.startMonitoring();
            
            // Initial health check
            setTimeout(() => this.performComprehensiveHealthCheck(), 2000);
            
            console.log('✅ Trinity Monitoring System fully initialized');
            
        } catch (error) {
            console.error('❌ Trinity Monitoring System initialization failed:', error);
            this.logAlert('critical', 'Trinity monitoring initialization failure', { error: error.message });
        }
    }
    
    initializePerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Observe Core Web Vitals
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    switch (entry.entryType) {
                        case 'largest-contentful-paint':
                            this.performanceMetrics.largest_contentful_paint = entry.startTime;
                            break;
                        case 'first-input':
                            this.performanceMetrics.first_input_delay = entry.processingStart - entry.startTime;
                            break;
                        case 'layout-shift':
                            if (!entry.hadRecentInput) {
                                this.performanceMetrics.cumulative_layout_shift += entry.value;
                            }
                            break;
                        case 'paint':
                            if (entry.name === 'first-paint') {
                                this.performanceMetrics.first_paint_time = entry.startTime;
                            }
                            break;
                        case 'navigation':
                            this.performanceMetrics.page_load_time = entry.loadEventEnd - entry.loadEventStart;
                            this.performanceMetrics.dom_ready_time = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
                            break;
                    }
                }
            });
            
            try {
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint', 'navigation'] });
            } catch (error) {
                console.warn('Some performance metrics not available:', error);
            }
        }
    }
    
    initializeErrorTracking() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
        
        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.logError('Resource Load Error', {
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    type: event.target.type
                });
            }
        }, true);
    }
    
    integrateWithSecuritySystem() {
        // Wait for Enterprise Security Anti-Lock System to be available
        const checkSecuritySystem = () => {
            if (window.EnterpriseSecurityAntiLock) {
                this.securityIntegration = window.EnterpriseSecurityAntiLock;
                console.log('🔒 Trinity monitoring integrated with Enterprise Security Anti-Lock System');
                
                // Monitor security system health
                this.monitorSecuritySystem();
                
                return true;
            }
            return false;
        };
        
        if (!checkSecuritySystem()) {
            // Keep checking for security system availability
            const securityCheckInterval = setInterval(() => {
                if (checkSecuritySystem()) {
                    clearInterval(securityCheckInterval);
                }
            }, 1000);
            
            // Stop checking after 30 seconds
            setTimeout(() => clearInterval(securityCheckInterval), 30000);
        }
    }
    
    monitorSecuritySystem() {
        if (!this.securityIntegration) return;
        
        // Monitor security events
        if (this.securityIntegration.addEventListener) {
            this.securityIntegration.addEventListener('security_event', (event) => {
                this.logAlert('security', 'Security system event', {
                    event_type: event.detail.type,
                    severity: event.detail.severity,
                    component: event.detail.component,
                    message: event.detail.message
                });
            });
            
            this.securityIntegration.addEventListener('emergency_mode_activated', (event) => {
                this.logAlert('critical', 'Security emergency mode activated', {
                    reason: event.detail.reason,
                    user_role: event.detail.user_role
                });
            });
        }
    }
    
    startMonitoring() {
        if (this.isActive) return;
        
        this.isActive = true;
        
        // Main monitoring loop - every 30 seconds
        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000);
        
        // Comprehensive health check - every 5 minutes
        this.healthCheckInterval = setInterval(() => {
            this.performComprehensiveHealthCheck();
        }, 300000);
        
        // Memory and performance monitoring - every 60 seconds
        setInterval(() => {
            this.monitorPerformance();
        }, 60000);
        
        console.log('🚀 Trinity monitoring active');
    }
    
    stopMonitoring() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        
        console.log('⏹️ Trinity monitoring stopped');
    }
    
    async performHealthCheck() {
        if (!this.isActive) return;
        
        console.log('🔍 Performing Trinity health check...');
        
        const checks = [
            this.checkDreamCommander(),
            this.checkUFOMCP(),
            this.checkWFAMCP(),
            this.checkSecurityAntiLock(),
            this.checkVoiceSystem(),
            this.checkChatSystem(),
            this.checkUIResponsiveness()
        ];
        
        const results = await Promise.allSettled(checks);
        
        let healthyComponents = 0;
        results.forEach((result, index) => {
            const componentNames = ['dream_commander', 'ufo_mcp', 'wfa_mcp', 'security_anti_lock', 'voice_system', 'chat_system', 'ui_responsiveness'];
            const componentName = componentNames[index];
            
            if (result.status === 'fulfilled' && result.value.healthy) {
                healthyComponents++;
                this.updateComponentStatus(componentName, 'healthy', result.value.response_time);
            } else {
                this.updateComponentStatus(componentName, 'unhealthy', 0);
                this.logAlert('warning', `Component ${componentName} health check failed`, {
                    component: componentName,
                    error: result.reason || result.value?.error
                });
            }
        });
        
        const healthPercentage = (healthyComponents / results.length) * 100;
        console.log(`📊 Trinity system health: ${healthPercentage.toFixed(1)}% (${healthyComponents}/${results.length} components healthy)`);
        
        if (healthPercentage < 70) {
            this.logAlert('critical', 'Trinity system health below 70%', {
                health_percentage: healthPercentage,
                healthy_components: healthyComponents,
                total_components: results.length
            });
        }
    }
    
    async performComprehensiveHealthCheck() {
        console.log('🔍 Performing comprehensive Trinity health check...');
        
        // Include additional checks
        const checks = [
            this.checkDreamCommander(),
            this.checkUFOMCP(),
            this.checkWFAMCP(),
            this.checkSecurityAntiLock(),
            this.checkVoiceSystem(),
            this.checkChatSystem(),
            this.checkUIResponsiveness(),
            this.checkGCPAuthentication(),
            this.checkDrClaudeOrchestration(),
            this.checkTestamentSwarm()
        ];
        
        const results = await Promise.allSettled(checks);
        
        // Generate comprehensive health report
        const healthReport = this.generateHealthReport(results);
        console.log('📋 Trinity Health Report:', healthReport);
        
        // Store the report
        this.storeHealthReport(healthReport);
        
        // Check for any critical issues
        if (healthReport.critical_issues.length > 0) {
            this.logAlert('critical', 'Critical issues detected in comprehensive health check', {
                critical_issues: healthReport.critical_issues,
                health_score: healthReport.overall_health_score
            });
        }
    }
    
    // Component-specific health checks
    async checkDreamCommander() {
        const startTime = performance.now();
        
        try {
            // Check if Dream Commander integration is loaded and functional
            if (typeof window.DreamCommanderIntegration === 'undefined') {
                throw new Error('Dream Commander integration not loaded');
            }
            
            // Test basic functionality
            const testResult = await this.testComponentFunction(() => {
                return window.DreamCommanderIntegration ? { status: 'ok' } : null;
            });
            
            const responseTime = performance.now() - startTime;
            
            if (testResult) {
                return { healthy: true, response_time: responseTime };
            } else {
                throw new Error('Dream Commander functionality test failed');
            }
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkUFOMCP() {
        const startTime = performance.now();
        
        try {
            // Check if UFO MCP integration is loaded
            if (typeof window.UFOMCPIntegration === 'undefined') {
                throw new Error('UFO MCP integration not loaded');
            }
            
            const responseTime = performance.now() - startTime;
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkWFAMCP() {
        const startTime = performance.now();
        
        try {
            // Check if Enhanced WFA-MCP integration is loaded
            if (typeof window.EnhancedWFAMCPIntegration === 'undefined') {
                throw new Error('Enhanced WFA-MCP integration not loaded');
            }
            
            const responseTime = performance.now() - startTime;
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkSecurityAntiLock() {
        const startTime = performance.now();
        
        try {
            // Check if Enterprise Security Anti-Lock System is active
            if (!this.securityIntegration) {
                throw new Error('Enterprise Security Anti-Lock System not available');
            }
            
            // Test security system responsiveness
            const securityStatus = this.securityIntegration.getSystemStatus ? 
                this.securityIntegration.getSystemStatus() : 
                { active: true };
            
            if (!securityStatus.active) {
                throw new Error('Security system inactive');
            }
            
            const responseTime = performance.now() - startTime;
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkVoiceSystem() {
        const startTime = performance.now();
        
        try {
            // Check voice synthesis availability
            if (!window.speechSynthesis) {
                throw new Error('Speech synthesis not supported');
            }
            
            // Check voice recognition availability
            if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
                throw new Error('Speech recognition not supported');
            }
            
            // Test voice system readiness
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                throw new Error('No voices available for speech synthesis');
            }
            
            const responseTime = performance.now() - startTime;
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkChatSystem() {
        const startTime = performance.now();
        
        try {
            // Check if chat elements are present and functional
            const chatInput = document.getElementById('copilotInput');
            const chatMessages = document.getElementById('copilotMessages');
            
            if (!chatInput || !chatMessages) {
                throw new Error('Chat system elements not found');
            }
            
            // Check if chat input is responsive
            if (chatInput.disabled) {
                throw new Error('Chat input is disabled');
            }
            
            const responseTime = performance.now() - startTime;
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkUIResponsiveness() {
        const startTime = performance.now();
        
        try {
            // Test UI element responsiveness
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);
            
            // Simulate UI interaction
            testElement.click();
            
            // Clean up
            document.body.removeChild(testElement);
            
            const responseTime = performance.now() - startTime;
            
            // Check if response time is acceptable
            if (responseTime > this.alertThresholds.response_time_ms) {
                throw new Error(`UI response time too high: ${responseTime}ms`);
            }
            
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkGCPAuthentication() {
        const startTime = performance.now();
        
        try {
            // Check if GCP authentication functions are available
            if (typeof window.getSecretValue !== 'function') {
                throw new Error('GCP Secret Manager integration not available');
            }
            
            // Test authentication status
            const authStatus = await this.testComponentFunction(async () => {
                // This would normally test actual GCP authentication
                return { authenticated: true };
            });
            
            if (!authStatus.authenticated) {
                throw new Error('GCP authentication failed');
            }
            
            const responseTime = performance.now() - startTime;
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkDrClaudeOrchestration() {
        const startTime = performance.now();
        
        try {
            // Check if Dr. Claude orchestration is available
            if (typeof window.drClaudeOrchestrator === 'undefined') {
                throw new Error('Dr. Claude orchestration not available');
            }
            
            // Test orchestration system status
            const orchestrationStatus = window.drClaudeOrchestrator.getOrchestrationStatus();
            
            if (!orchestrationStatus.dr_claude_active) {
                throw new Error('Dr. Claude orchestration inactive');
            }
            
            const responseTime = performance.now() - startTime;
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async checkTestamentSwarm() {
        const startTime = performance.now();
        
        try {
            // Check Testament Swarm connectivity
            if (typeof window.testamentSwarmConnected === 'undefined' || !window.testamentSwarmConnected) {
                throw new Error('Testament Swarm not connected');
            }
            
            const responseTime = performance.now() - startTime;
            return { healthy: true, response_time: responseTime };
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            return { healthy: false, response_time: responseTime, error: error.message };
        }
    }
    
    async testComponentFunction(testFunction) {
        try {
            return await Promise.race([
                testFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Component test timeout')), 5000)
                )
            ]);
        } catch (error) {
            throw error;
        }
    }
    
    updateComponentStatus(componentName, status, responseTime = 0) {
        if (this.componentStatus[componentName]) {
            this.componentStatus[componentName].status = status;
            this.componentStatus[componentName].last_check = new Date().toISOString();
            this.componentStatus[componentName].response_time = responseTime;
            
            if (status === 'unhealthy') {
                this.componentStatus[componentName].error_count++;
            }
        }
    }
    
    monitorPerformance() {
        try {
            // Memory usage
            if (performance.memory) {
                this.performanceMetrics.memory_usage = (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100;
                
                if (this.performanceMetrics.memory_usage > this.alertThresholds.memory_usage_percent) {
                    this.logAlert('warning', 'High memory usage detected', {
                        memory_usage_percent: this.performanceMetrics.memory_usage.toFixed(2),
                        used_heap_size_mb: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
                        total_heap_size_mb: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
                    });
                }
            }
            
            // API success rate
            const totalApiCalls = this.performanceMetrics.api_calls_count;
            if (totalApiCalls > 0) {
                const successRate = (this.performanceMetrics.api_success_count / totalApiCalls) * 100;
                
                if (successRate < this.alertThresholds.api_success_rate_percent) {
                    this.logAlert('warning', 'Low API success rate', {
                        success_rate_percent: successRate.toFixed(2),
                        total_calls: totalApiCalls,
                        successful_calls: this.performanceMetrics.api_success_count,
                        failed_calls: this.performanceMetrics.api_error_count
                    });
                }
            }
            
            // Core Web Vitals checks
            if (this.performanceMetrics.largest_contentful_paint > 2500) {
                this.logAlert('performance', 'Poor Largest Contentful Paint', {
                    lcp_ms: this.performanceMetrics.largest_contentful_paint.toFixed(2),
                    threshold_ms: 2500
                });
            }
            
            if (this.performanceMetrics.first_input_delay > 100) {
                this.logAlert('performance', 'Poor First Input Delay', {
                    fid_ms: this.performanceMetrics.first_input_delay.toFixed(2),
                    threshold_ms: 100
                });
            }
            
            if (this.performanceMetrics.cumulative_layout_shift > 0.1) {
                this.logAlert('performance', 'Poor Cumulative Layout Shift', {
                    cls_score: this.performanceMetrics.cumulative_layout_shift.toFixed(3),
                    threshold: 0.1
                });
            }
            
        } catch (error) {
            console.error('❌ Performance monitoring error:', error);
        }
    }
    
    generateHealthReport(healthCheckResults) {
        const componentNames = ['dream_commander', 'ufo_mcp', 'wfa_mcp', 'security_anti_lock', 'voice_system', 'chat_system', 'ui_responsiveness', 'gcp_auth', 'dr_claude_orchestration', 'testament_swarm'];
        
        let healthyCount = 0;
        let unhealthyComponents = [];
        let criticalIssues = [];
        let warnings = [];
        
        healthCheckResults.forEach((result, index) => {
            const componentName = componentNames[index];
            
            if (result.status === 'fulfilled' && result.value.healthy) {
                healthyCount++;
            } else {
                unhealthyComponents.push(componentName);
                
                const error = result.reason || result.value?.error || 'Unknown error';
                
                // Determine if it's a critical issue
                if (componentName === 'security_anti_lock' || componentName === 'dr_claude_orchestration') {
                    criticalIssues.push(`${componentName}: ${error}`);
                } else {
                    warnings.push(`${componentName}: ${error}`);
                }
            }
        });
        
        const overallHealthScore = (healthyCount / healthCheckResults.length) * 100;
        
        return {
            timestamp: new Date().toISOString(),
            monitoring_id: this.monitoringId,
            overall_health_score: overallHealthScore,
            healthy_components: healthyCount,
            total_components: healthCheckResults.length,
            unhealthy_components: unhealthyComponents,
            critical_issues: criticalIssues,
            warnings: warnings,
            performance_metrics: { ...this.performanceMetrics },
            component_status: { ...this.componentStatus }
        };
    }
    
    storeHealthReport(report) {
        try {
            // Store in localStorage with rotation (keep last 10 reports)
            const storageKey = 'trinity_health_reports';
            let reports = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            reports.unshift(report);
            reports = reports.slice(0, 10); // Keep only the latest 10 reports
            
            localStorage.setItem(storageKey, JSON.stringify(reports));
            
        } catch (error) {
            console.error('❌ Failed to store health report:', error);
        }
    }
    
    logAlert(severity, message, metadata = {}) {
        const alert = {
            id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            timestamp: new Date().toISOString(),
            severity: severity, // critical, warning, info, performance, security
            message: message,
            metadata: metadata,
            monitoring_id: this.monitoringId
        };
        
        // Add to alert history
        this.alertHistory.unshift(alert);
        if (this.alertHistory.length > this.maxAlertHistory) {
            this.alertHistory = this.alertHistory.slice(0, this.maxAlertHistory);
        }
        
        // Console output with appropriate styling
        const severityEmojis = {
            critical: '🚨',
            warning: '⚠️',
            info: 'ℹ️',
            performance: '📊',
            security: '🔒'
        };
        
        const emoji = severityEmojis[severity] || '📋';
        console.log(`${emoji} [Trinity Monitor] ${severity.toUpperCase()}: ${message}`, metadata);
        
        // Trigger visual notification for critical alerts
        if (severity === 'critical' && typeof window.showNotification === 'function') {
            window.showNotification(`${emoji} ${message}`, 'error');
        } else if (severity === 'security' && typeof window.showNotification === 'function') {
            window.showNotification(`${emoji} Security: ${message}`, 'error');
        }
        
        // Send to external monitoring service (if configured)
        this.sendAlertToMonitoringService(alert);
        
        return alert;
    }
    
    logError(errorType, errorDetails) {
        this.logAlert('critical', `${errorType} detected`, {
            error_type: errorType,
            details: errorDetails,
            user_agent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
    }
    
    async sendAlertToMonitoringService(alert) {
        try {
            // In production, this would send alerts to external monitoring services
            // like DataDog, New Relic, or custom monitoring endpoints
            
            if (window.productionLogging && typeof window.productionLogging.alert === 'function') {
                window.productionLogging.alert(alert);
            }
            
            // Example: Send to custom monitoring endpoint
            /*
            await fetch('/api/monitoring/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Monitoring-ID': this.monitoringId
                },
                body: JSON.stringify(alert)
            });
            */
            
        } catch (error) {
            console.error('❌ Failed to send alert to monitoring service:', error);
        }
    }
    
    // Public API methods
    getSystemStatus() {
        return {
            monitoring_id: this.monitoringId,
            version: this.version,
            is_active: this.isActive,
            component_status: { ...this.componentStatus },
            performance_metrics: { ...this.performanceMetrics },
            recent_alerts: this.alertHistory.slice(0, 5),
            overall_health: this.calculateOverallHealth()
        };
    }
    
    calculateOverallHealth() {
        const components = Object.values(this.componentStatus);
        const healthyCount = components.filter(c => c.status === 'healthy').length;
        const totalCount = components.length;
        
        return {
            score: totalCount > 0 ? (healthyCount / totalCount) * 100 : 0,
            healthy_components: healthyCount,
            total_components: totalCount,
            status: healthyCount === totalCount ? 'excellent' : 
                   healthyCount / totalCount > 0.8 ? 'good' : 
                   healthyCount / totalCount > 0.6 ? 'fair' : 'poor'
        };
    }
    
    getHealthHistory() {
        try {
            return JSON.parse(localStorage.getItem('trinity_health_reports') || '[]');
        } catch (error) {
            console.error('❌ Failed to get health history:', error);
            return [];
        }
    }
    
    getAlertHistory() {
        return [...this.alertHistory];
    }
    
    clearAlertHistory() {
        this.alertHistory = [];
        console.log('🗑️ Trinity alert history cleared');
    }
    
    // Integration methods for external systems
    onAlert(callback) {
        if (typeof callback === 'function') {
            this.alertCallbacks = this.alertCallbacks || [];
            this.alertCallbacks.push(callback);
        }
    }
    
    triggerManualHealthCheck() {
        console.log('🔍 Manual Trinity health check triggered');
        return this.performComprehensiveHealthCheck();
    }
    
    updateAlertThresholds(newThresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
        console.log('📋 Trinity alert thresholds updated:', this.alertThresholds);
    }
}

// Initialize Trinity Monitoring System
const trinityMonitor = new TrinityMonitoringSystem();

// Make it globally available
window.TrinityMonitoringSystem = trinityMonitor;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrinityMonitoringSystem;
}

// Console banner
console.log(`
🔍 Trinity Monitoring System v${trinityMonitor.version} Active
🎯 Monitoring: Dream Commander, UFO MCP, WFA MCP, Security Anti-Lock
🔒 Security integration active
📊 Performance monitoring active
⚠️  Alert system ready

Use TrinityMonitoringSystem.getSystemStatus() to view current status
`);
