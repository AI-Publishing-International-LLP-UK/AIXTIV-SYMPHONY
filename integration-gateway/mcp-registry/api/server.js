#!/usr/bin/env node

/**
 * MCP SERVICE DISCOVERY API SERVER
 * Diamond SAO Command Center Integration
 * 
 * Purpose: REST API for MCP service discovery and health monitoring
 * Features: OAuth2 authentication, SAO authorization, service management
 * Authority: Diamond SAO Command Center Integration
 * 
 * Security: OAuth2 + SAO-based authorization with SallyPort integration
 * Database: MongoDB Atlas with multi-region replication
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MCPServiceRegistry } = require('../ServiceRegistry');
const { MCPHealthMonitor } = require('../HealthMonitor');

console.log(`🌐 MCP SERVICE DISCOVERY API SERVER`);
console.log(`💎 Diamond SAO Command Center Integration`);
console.log(`🔐 OAuth2 + SAO Authorization System`);
console.log(``);

class MCPDiscoveryAPIServer {
    constructor(config = {}) {
        this.config = {
            port: config.port || process.env.PORT || 8080,
            host: config.host || '0.0.0.0',
            corsOrigins: config.corsOrigins || [
                'https://sallyport.2100.cool',
                'https://mocoa.2100.cool',
                'https://*.2100.cool'
            ],
            oauth2Config: {
                issuer: config.oauth2Config?.issuer || 'https://sallyport.2100.cool/oauth2',
                clientId: config.oauth2Config?.clientId || process.env.OAUTH2_CLIENT_ID,
                clientSecret: config.oauth2Config?.clientSecret || process.env.OAUTH2_CLIENT_SECRET,
                redirectUri: config.oauth2Config?.redirectUri || process.env.OAUTH2_REDIRECT_URI,
                scopes: config.oauth2Config?.scopes || ['read:services', 'write:services', 'admin:services']
            },
            sallyPortConfig: {
                endpoint: config.sallyPortConfig?.endpoint || 'https://sallyport.2100.cool/api/auth/verify',
                webhook: config.sallyPortConfig?.webhook || 'https://sallyport.2100.cool/api/webhooks/sao'
            },
            rateLimiting: {
                windowMs: config.rateLimiting?.windowMs || 15 * 60 * 1000, // 15 minutes
                maxRequests: config.rateLimiting?.maxRequests || 1000, // requests per window
                maxRequestsPerIP: config.rateLimiting?.maxRequestsPerIP || 100
            },
            ...config
        };

        this.app = express();
        this.serviceRegistry = null;
        this.healthMonitor = null;
        this.server = null;
        this.isRunning = false;

        // Initialize components
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    // Setup Express middleware
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https://sallyport.2100.cool", "https://mocoa.2100.cool"]
                }
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration for 2100.cool ecosystem
        this.app.use(cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, etc.)
                if (!origin) return callback(null, true);
                
                // Check against allowed origins
                const isAllowed = this.config.corsOrigins.some(allowedOrigin => {
                    if (allowedOrigin.includes('*')) {
                        const pattern = allowedOrigin.replace('*', '.*');
                        return new RegExp(pattern).test(origin);
                    }
                    return allowedOrigin === origin;
                });
                
                callback(null, isAllowed);
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-SAO-Level', 'X-Company-Scope']
        }));

        // Rate limiting
        const generalLimiter = rateLimit({
            windowMs: this.config.rateLimiting.windowMs,
            max: this.config.rateLimiting.maxRequests,
            message: {
                error: 'Rate limit exceeded',
                retryAfter: this.config.rateLimiting.windowMs / 1000
            },
            standardHeaders: true,
            legacyHeaders: false
        });

        const strictLimiter = rateLimit({
            windowMs: this.config.rateLimiting.windowMs,
            max: this.config.rateLimiting.maxRequestsPerIP,
            message: {
                error: 'Rate limit exceeded for IP',
                retryAfter: this.config.rateLimiting.windowMs / 1000
            }
        });

        this.app.use('/api/v1', generalLimiter);
        this.app.use('/api/v1/admin', strictLimiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }

    // OAuth2 authentication middleware
    async authenticateOAuth2(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'OAuth2 token required',
                    message: 'Please provide a valid OAuth2 Bearer token'
                });
            }

            const token = authHeader.substring(7);
            
            // Verify OAuth2 token with SallyPort
            const verificationResult = await this.verifyOAuth2Token(token);
            
            if (!verificationResult.valid) {
                return res.status(401).json({
                    error: 'Invalid OAuth2 token',
                    message: verificationResult.error || 'Token verification failed'
                });
            }

            // Add authentication info to request
            req.auth = {
                token,
                userId: verificationResult.userId,
                saoLevel: verificationResult.saoLevel,
                companyScope: verificationResult.companyScope,
                scopes: verificationResult.scopes || [],
                verified: true
            };

            next();
        } catch (error) {
            console.error(`❌ OAuth2 authentication error: ${error.message}`);
            res.status(500).json({
                error: 'Authentication service error',
                message: 'Please try again later'
            });
        }
    }

    // Verify OAuth2 token with SallyPort
    async verifyOAuth2Token(token) {
        try {
            // Mock implementation - replace with actual SallyPort OAuth2 verification
            // In production, this would make a request to SallyPort's token verification endpoint
            
            console.log(`🔐 Verifying OAuth2 token with SallyPort...`);
            
            // Simulated verification response
            return {
                valid: true,
                userId: 'user-12345',
                saoLevel: 'diamond', // From your SAO system
                companyScope: null, // null for Diamond/Emerald, specific company for others
                scopes: ['read:services', 'write:services', 'admin:services'],
                tokenType: 'Bearer',
                expiresIn: 3600
            };
        } catch (error) {
            console.error(`❌ Token verification failed: ${error.message}`);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // SAO authorization middleware
    checkSAOAuthorization(requiredLevel = 'onyx', allowCompanyScope = true) {
        return (req, res, next) => {
            try {
                if (!req.auth || !req.auth.verified) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        message: 'Please authenticate with OAuth2'
                    });
                }

                const userSaoLevel = req.auth.saoLevel;
                const saoHierarchy = ['onyx', 'opal', 'sapphire', 'emerald', 'diamond'];
                
                const userLevel = saoHierarchy.indexOf(userSaoLevel);
                const requiredLevelIndex = saoHierarchy.indexOf(requiredLevel);

                if (userLevel < requiredLevelIndex) {
                    return res.status(403).json({
                        error: 'Insufficient SAO authorization',
                        message: `Required: ${requiredLevel}, Current: ${userSaoLevel}`,
                        requiredLevel,
                        currentLevel: userSaoLevel
                    });
                }

                // Check company scope for lower SAO levels
                if (allowCompanyScope && req.auth.companyScope && 
                    (userSaoLevel === 'sapphire' || userSaoLevel === 'opal' || userSaoLevel === 'onyx')) {
                    req.companyScope = req.auth.companyScope;
                }

                next();
            } catch (error) {
                console.error(`❌ SAO authorization error: ${error.message}`);
                res.status(500).json({
                    error: 'Authorization service error',
                    message: 'Please try again later'
                });
            }
        };
    }

    // Setup API routes
    setupRoutes() {
        // Health check endpoint (no auth required)
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'mcp-service-discovery',
                version: '1.0.0'
            });
        });

        // API v1 routes
        const apiRouter = express.Router();

        // Service registration (Sapphire+ SAO required)
        apiRouter.post('/services/register', 
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('sapphire'),
            this.registerService.bind(this)
        );

        // Service discovery (Onyx+ SAO required)
        apiRouter.get('/services/discover',
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('onyx'),
            this.discoverServices.bind(this)
        );

        // Get specific service (Onyx+ SAO required)
        apiRouter.get('/services/:serviceId',
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('onyx'),
            this.getService.bind(this)
        );

        // Update service (Sapphire+ SAO required)
        apiRouter.put('/services/:serviceId',
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('sapphire'),
            this.updateService.bind(this)
        );

        // Deregister service (Sapphire+ SAO required)
        apiRouter.delete('/services/:serviceId',
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('sapphire'),
            this.deregisterService.bind(this)
        );

        // Health status endpoints
        apiRouter.get('/services/:serviceId/health',
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('onyx'),
            this.getServiceHealth.bind(this)
        );

        apiRouter.post('/services/:serviceId/heartbeat',
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('sapphire'),
            this.serviceHeartbeat.bind(this)
        );

        // Administrative endpoints (Emerald+ SAO required)
        apiRouter.get('/admin/statistics',
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('emerald'),
            this.getStatistics.bind(this)
        );

        apiRouter.get('/admin/monitoring',
            this.authenticateOAuth2.bind(this),
            this.checkSAOAuthorization('emerald'),
            this.getMonitoringStatus.bind(this)
        );

        // OAuth2 endpoints
        apiRouter.get('/oauth2/authorize', this.oauth2Authorize.bind(this));
        apiRouter.post('/oauth2/token', this.oauth2Token.bind(this));
        apiRouter.get('/oauth2/userinfo',
            this.authenticateOAuth2.bind(this),
            this.oauth2UserInfo.bind(this)
        );

        this.app.use('/api/v1', apiRouter);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                service: 'MCP Service Discovery API',
                version: '1.0.0',
                authority: 'Diamond SAO Command Center',
                ecosystem: 'AIXTIV Symphony MCP',
                authentication: 'OAuth2 + SAO Authorization',
                endpoints: {
                    discovery: '/api/v1/services/discover',
                    registration: '/api/v1/services/register',
                    health: '/api/v1/services/{serviceId}/health',
                    admin: '/api/v1/admin/statistics'
                },
                documentation: '/api/v1/docs'
            });
        });
    }

    // Service registration endpoint
    async registerService(req, res) {
        try {
            console.log(`📝 Service registration request from ${req.auth.userId}`);
            
            const serviceData = req.body;
            
            // Validate required fields
            if (!serviceData.companyName || !serviceData.domain || !serviceData.instanceId) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    required: ['companyName', 'domain', 'instanceId']
                });
            }

            // Check company scope authorization for non-Diamond/Emerald users
            if (req.companyScope && serviceData.companyName !== req.companyScope) {
                return res.status(403).json({
                    error: 'Company scope violation',
                    message: `Not authorized for company: ${serviceData.companyName}`
                });
            }

            const result = await this.serviceRegistry.registerService(serviceData, req.auth.token);
            
            res.status(201).json({
                success: true,
                message: 'Service registered successfully',
                ...result
            });
            
        } catch (error) {
            console.error(`❌ Service registration failed: ${error.message}`);
            res.status(400).json({
                error: 'Service registration failed',
                message: error.message
            });
        }
    }

    // Service discovery endpoint
    async discoverServices(req, res) {
        try {
            console.log(`🔍 Service discovery request from ${req.auth.userId}`);
            
            const queryParams = req.query;
            
            // Apply company scope for non-Diamond/Emerald users
            if (req.companyScope && !queryParams.company) {
                queryParams.company = req.companyScope;
            }

            const result = await this.serviceRegistry.discoverServices(queryParams, req.auth.token);
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                ...result
            });
            
        } catch (error) {
            console.error(`❌ Service discovery failed: ${error.message}`);
            res.status(400).json({
                error: 'Service discovery failed',
                message: error.message
            });
        }
    }

    // Get specific service endpoint
    async getService(req, res) {
        try {
            const { serviceId } = req.params;
            
            const result = await this.serviceRegistry.getService(serviceId, req.auth.token);
            
            // Check company scope authorization
            if (req.companyScope && result.service.companyName !== req.companyScope) {
                return res.status(403).json({
                    error: 'Company scope violation',
                    message: `Not authorized for service: ${serviceId}`
                });
            }
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                ...result
            });
            
        } catch (error) {
            console.error(`❌ Get service failed: ${error.message}`);
            res.status(404).json({
                error: 'Service not found',
                message: error.message
            });
        }
    }

    // Update service endpoint
    async updateService(req, res) {
        try {
            const { serviceId } = req.params;
            const updateData = req.body;
            
            const result = await this.serviceRegistry.updateService(serviceId, updateData, req.auth.token);
            
            res.json({
                success: true,
                message: 'Service updated successfully',
                timestamp: new Date().toISOString(),
                ...result
            });
            
        } catch (error) {
            console.error(`❌ Service update failed: ${error.message}`);
            res.status(400).json({
                error: 'Service update failed',
                message: error.message
            });
        }
    }

    // Deregister service endpoint
    async deregisterService(req, res) {
        try {
            const { serviceId } = req.params;
            
            const result = await this.serviceRegistry.deregisterService(serviceId, req.auth.token);
            
            res.json({
                success: true,
                message: 'Service deregistered successfully',
                timestamp: new Date().toISOString(),
                ...result
            });
            
        } catch (error) {
            console.error(`❌ Service deregistration failed: ${error.message}`);
            res.status(400).json({
                error: 'Service deregistration failed',
                message: error.message
            });
        }
    }

    // Get service health endpoint
    async getServiceHealth(req, res) {
        try {
            const { serviceId } = req.params;
            
            // Get health information from monitor
            const healthInfo = this.healthMonitor ? 
                this.healthMonitor.activeChecks.get(serviceId) : null;
            
            if (!healthInfo) {
                return res.status(404).json({
                    error: 'Service health information not found',
                    serviceId
                });
            }
            
            res.json({
                success: true,
                serviceId,
                health: {
                    status: healthInfo.lastStatus,
                    lastCheck: healthInfo.lastCheck,
                    consecutiveFailures: healthInfo.consecutiveFailures,
                    consecutiveSuccesses: healthInfo.consecutiveSuccesses,
                    monitoringInterval: healthInfo.interval,
                    domain: healthInfo.domain
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error(`❌ Get service health failed: ${error.message}`);
            res.status(500).json({
                error: 'Health check failed',
                message: error.message
            });
        }
    }

    // Service heartbeat endpoint
    async serviceHeartbeat(req, res) {
        try {
            const { serviceId } = req.params;
            const heartbeatData = req.body;
            
            // Update service with heartbeat data
            await this.serviceRegistry.updateService(serviceId, {
                'healthStatus.lastHeartbeat': new Date().toISOString(),
                'healthStatus.heartbeatData': heartbeatData
            }, req.auth.token);
            
            res.json({
                success: true,
                message: 'Heartbeat received',
                serviceId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error(`❌ Heartbeat failed: ${error.message}`);
            res.status(400).json({
                error: 'Heartbeat failed',
                message: error.message
            });
        }
    }

    // Get statistics endpoint
    async getStatistics(req, res) {
        try {
            const serviceStats = await this.serviceRegistry.getStatistics(req.auth.token);
            const monitorStats = this.healthMonitor ? this.healthMonitor.getStatistics() : null;
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                serviceRegistry: serviceStats,
                healthMonitor: monitorStats,
                apiStats: {
                    version: '1.0.0',
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version
                }
            });
            
        } catch (error) {
            console.error(`❌ Get statistics failed: ${error.message}`);
            res.status(500).json({
                error: 'Statistics retrieval failed',
                message: error.message
            });
        }
    }

    // Get monitoring status endpoint
    async getMonitoringStatus(req, res) {
        try {
            const monitorStats = this.healthMonitor ? this.healthMonitor.getStatistics() : null;
            
            if (!monitorStats) {
                return res.status(503).json({
                    error: 'Health monitor not running',
                    status: 'unavailable'
                });
            }
            
            res.json({
                success: true,
                monitoring: {
                    status: monitorStats.isRunning ? 'running' : 'stopped',
                    ...monitorStats
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error(`❌ Get monitoring status failed: ${error.message}`);
            res.status(500).json({
                error: 'Monitoring status retrieval failed',
                message: error.message
            });
        }
    }

    // OAuth2 authorization endpoint
    async oauth2Authorize(req, res) {
        try {
            // OAuth2 authorization flow
            const { client_id, redirect_uri, response_type, scope, state } = req.query;
            
            // Validate parameters
            if (!client_id || !redirect_uri || response_type !== 'code') {
                return res.status(400).json({
                    error: 'invalid_request',
                    error_description: 'Missing or invalid parameters'
                });
            }
            
            // Redirect to SallyPort for authorization
            const authUrl = `${this.config.oauth2Config.issuer}/authorize?` +
                `client_id=${encodeURIComponent(client_id)}&` +
                `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
                `response_type=${response_type}&` +
                `scope=${encodeURIComponent(scope || 'read:services')}&` +
                `state=${encodeURIComponent(state || '')}`;
            
            res.redirect(authUrl);
            
        } catch (error) {
            console.error(`❌ OAuth2 authorization failed: ${error.message}`);
            res.status(500).json({
                error: 'server_error',
                error_description: error.message
            });
        }
    }

    // OAuth2 token endpoint
    async oauth2Token(req, res) {
        try {
            // OAuth2 token exchange
            const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;
            
            if (grant_type !== 'authorization_code') {
                return res.status(400).json({
                    error: 'unsupported_grant_type',
                    error_description: 'Only authorization_code grant type is supported'
                });
            }
            
            // Exchange code for token with SallyPort
            // Mock response - replace with actual SallyPort integration
            res.json({
                access_token: 'mock-access-token-' + Date.now(),
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh-token-' + Date.now(),
                scope: 'read:services write:services'
            });
            
        } catch (error) {
            console.error(`❌ OAuth2 token exchange failed: ${error.message}`);
            res.status(500).json({
                error: 'server_error',
                error_description: error.message
            });
        }
    }

    // OAuth2 user info endpoint
    async oauth2UserInfo(req, res) {
        try {
            res.json({
                sub: req.auth.userId,
                sao_level: req.auth.saoLevel,
                company_scope: req.auth.companyScope,
                scopes: req.auth.scopes,
                iss: this.config.oauth2Config.issuer,
                aud: this.config.oauth2Config.clientId
            });
            
        } catch (error) {
            console.error(`❌ OAuth2 user info failed: ${error.message}`);
            res.status(500).json({
                error: 'server_error',
                error_description: error.message
            });
        }
    }

    // Setup error handling
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                message: `${req.method} ${req.path} is not a valid endpoint`,
                availableEndpoints: [
                    'GET /health',
                    'GET /api/v1/services/discover',
                    'POST /api/v1/services/register',
                    'GET /api/v1/admin/statistics'
                ]
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error(`❌ API Error: ${error.message}`, error);
            
            res.status(error.status || 500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'production' ? 
                    'An unexpected error occurred' : error.message,
                timestamp: new Date().toISOString(),
                requestId: req.id || 'unknown'
            });
        });
    }

    // Start the API server
    async start() {
        try {
            console.log(`🚀 Starting MCP Service Discovery API Server...`);
            
            // Initialize service registry
            this.serviceRegistry = new MCPServiceRegistry();
            await this.serviceRegistry.initialize();
            
            // Initialize health monitor
            this.healthMonitor = new MCPHealthMonitor(this.serviceRegistry);
            await this.healthMonitor.start();
            
            // Start HTTP server
            this.server = this.app.listen(this.config.port, this.config.host, () => {
                this.isRunning = true;
                console.log(`✅ MCP Service Discovery API Server started`);
                console.log(`🌐 Server: http://${this.config.host}:${this.config.port}`);
                console.log(`🔐 OAuth2 Issuer: ${this.config.oauth2Config.issuer}`);
                console.log(`💎 SAO Authorization: Enabled`);
                console.log(`📊 Health Monitor: Active`);
                console.log(`🔗 CORS Origins: ${this.config.corsOrigins.join(', ')}`);
            });
            
        } catch (error) {
            console.error(`❌ Failed to start API server: ${error.message}`);
            throw error;
        }
    }

    // Stop the API server
    async stop() {
        try {
            console.log(`🛑 Stopping MCP Service Discovery API Server...`);
            
            if (this.healthMonitor) {
                await this.healthMonitor.stop();
            }
            
            if (this.serviceRegistry) {
                await this.serviceRegistry.close();
            }
            
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
            }
            
            this.isRunning = false;
            console.log(`✅ API Server stopped`);
            
        } catch (error) {
            console.error(`❌ Error stopping server: ${error.message}`);
            throw error;
        }
    }
}

// Export for use as module
module.exports = { MCPDiscoveryAPIServer };

// Run as standalone server if executed directly
if (require.main === module) {
    const server = new MCPDiscoveryAPIServer();
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    
    // Start the server
    server.start().catch((error) => {
        console.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    });
}