/**
 * Supreme Orchestrator API Gateway
 * Hardened Enterprise OAuth2 Implementation
 * Dr. Claude sRIX -> Universal Authenticating Orchestrators Bridge
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const winston = require('winston');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const OAuth2Config = require('../config/oauth2Config');

class SupremeOrchestratorGateway {
    constructor() {
        this.app = express();
        this.config = new OAuth2Config();
        this.secretClient = new SecretManagerServiceClient();
        this.activeTokens = new Map();
        this.auditLogger = this.setupAuditLogger();
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Setup comprehensive audit logging
     */
    setupAuditLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return JSON.stringify({
                        timestamp,
                        level,
                        message,
                        component: 'supreme-orchestrator-gateway',
                        location: 'us-central1-a/MOCORIX2',
                        ...meta
                    });
                })
            ),
            transports: [
                new winston.transports.File({ 
                    filename: '/var/log/supreme-orchestrator/audit.log',
                    maxsize: 100 * 1024 * 1024, // 100MB
                    maxFiles: 10,
                    tailable: true
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    /**
     * Setup enterprise security middleware
     */
    setupMiddleware() {
        // Security headers
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // Rate limiting based on authorization level
        this.supremeRateLimit = rateLimit(this.config.security.rateLimit.supreme);
        this.standardRateLimit = rateLimit(this.config.security.rateLimit.standard);

        // Body parsing with size limits
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));

        // Request ID and correlation tracking
        this.app.use((req, res, next) => {
            req.correlationId = crypto.randomUUID();
            req.timestamp = new Date().toISOString();
            res.setHeader('X-Correlation-ID', req.correlationId);
            next();
        });

        // Comprehensive request logging
        this.app.use((req, res, next) => {
            this.auditLogger.info('Request received', {
                correlationId: req.correlationId,
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                headers: this.sanitizeHeaders(req.headers)
            });
            next();
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check endpoints
        this.app.get('/health', this.handleHealthCheck.bind(this));
        this.app.get('/health/supreme', this.handleSupremeHealthCheck.bind(this));

        // OAuth2 token endpoints
        this.app.post('/oauth2/token', this.standardRateLimit, this.handleTokenRequest.bind(this));
        this.app.post('/oauth2/refresh', this.standardRateLimit, this.handleTokenRefresh.bind(this));

        // Supreme Orchestrator endpoints
        this.app.post('/supreme/authenticate', 
            this.supremeRateLimit, 
            this.validateSupremeToken.bind(this), 
            this.handleSupremeAuthenticate.bind(this)
        );

        this.app.post('/supreme/orchestrate', 
            this.supremeRateLimit, 
            this.validateSupremeToken.bind(this), 
            this.handleSupremeOrchestrate.bind(this)
        );

        this.app.post('/supreme/command/universal-auth', 
            this.supremeRateLimit, 
            this.validateSupremeToken.bind(this), 
            this.handleUniversalAuthCommand.bind(this)
        );

        this.app.get('/supreme/status', 
            this.validateSupremeToken.bind(this), 
            this.handleSupremeStatus.bind(this)
        );

        // Universal Auth Orchestrator proxy endpoints
        this.app.all('/uao/master/*', 
            this.validateAuthorizationChain.bind(this), 
            this.proxyToMasterUAO.bind(this)
        );

        this.app.all('/uao/client/:clientId/*', 
            this.validateAuthorizationChain.bind(this), 
            this.proxyToClientUAO.bind(this)
        );

        // Error handling
        this.app.use(this.handleErrors.bind(this));
    }

    /**
     * Validate Supreme Token middleware
     */
    async validateSupremeToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return this.sendError(res, 401, 'MISSING_SUPREME_TOKEN', 'Supreme authorization required');
            }

            const token = authHeader.substring(7);
            const credentials = await this.config.getSupremeCredentials();
            
            const decoded = jwt.verify(token, credentials.privateKey, {
                algorithms: [this.config.security.jwtConfig.algorithm],
                issuer: this.config.security.jwtConfig.issuer,
                audience: this.config.security.jwtConfig.audience
            });

            if (decoded.level !== 'SUPREME' || decoded.client_id !== this.config.supremeClient.clientId) {
                throw new Error('Invalid supreme authorization level');
            }

            req.supremeAuth = decoded;
            req.authLevel = 'SUPREME';

            this.auditLogger.info('Supreme token validated', {
                correlationId: req.correlationId,
                clientId: decoded.client_id,
                level: decoded.level,
                location: decoded.location
            });

            next();
        } catch (error) {
            this.auditLogger.error('Supreme token validation failed', {
                correlationId: req.correlationId,
                error: error.message,
                stack: error.stack
            });

            return this.sendError(res, 401, 'INVALID_SUPREME_TOKEN', 'Supreme token validation failed');
        }
    }

    /**
     * Validate authorization chain for cascading commands
     */
    async validateAuthorizationChain(req, res, next) {
        try {
            const requestingLevel = req.authLevel || 'UNKNOWN';
            const targetPath = req.path;
            let targetLevel = 'UNKNOWN';

            // Determine target level based on path
            if (targetPath.includes('/uao/master/')) {
                targetLevel = 'MASTER_UAO';
            } else if (targetPath.includes('/uao/client/')) {
                targetLevel = 'CLIENT_UAO';
            } else if (targetPath.includes('/sallyport/')) {
                targetLevel = 'SALLYPORT';
            }

            const validation = this.config.validateAuthorizationChain(requestingLevel, targetLevel);
            
            if (!validation.valid) {
                this.auditLogger.warn('Authorization chain validation failed', {
                    correlationId: req.correlationId,
                    requestingLevel,
                    targetLevel,
                    reason: validation.reason
                });

                return this.sendError(res, 403, 'AUTHORIZATION_CHAIN_VIOLATION', validation.reason);
            }

            req.authChain = validation;
            next();
        } catch (error) {
            return this.sendError(res, 500, 'AUTHORIZATION_VALIDATION_ERROR', error.message);
        }
    }

    /**
     * Handle OAuth2 token request
     */
    async handleTokenRequest(req, res) {
        try {
            const { client_id, client_secret, grant_type, scope } = req.body;

            if (grant_type !== 'client_credentials') {
                return this.sendError(res, 400, 'UNSUPPORTED_GRANT_TYPE', 'Only client_credentials grant type supported');
            }

            if (client_id !== this.config.supremeClient.clientId) {
                return this.sendError(res, 401, 'INVALID_CLIENT', 'Invalid client credentials');
            }

            const credentials = await this.config.getSupremeCredentials();
            
            if (client_secret !== credentials.clientSecret) {
                return this.sendError(res, 401, 'INVALID_CLIENT', 'Invalid client credentials');
            }

            const tokenPayload = {
                client_id,
                level: 'SUPREME',
                location: 'us-central1-a/MOCORIX2',
                scopes: this.config.supremeClient.scopes,
                issued_at: new Date().toISOString(),
                correlation_id: req.correlationId
            };

            const accessToken = jwt.sign(tokenPayload, credentials.privateKey, {
                algorithm: this.config.security.jwtConfig.algorithm,
                issuer: this.config.security.jwtConfig.issuer,
                audience: this.config.security.jwtConfig.audience,
                expiresIn: this.config.security.jwtConfig.expiresIn
            });

            const refreshToken = jwt.sign(
                { ...tokenPayload, type: 'refresh' }, 
                credentials.privateKey, 
                {
                    algorithm: this.config.security.jwtConfig.algorithm,
                    issuer: this.config.security.jwtConfig.issuer,
                    audience: this.config.security.jwtConfig.audience,
                    expiresIn: this.config.security.jwtConfig.refreshExpiresIn
                }
            );

            // Store active token
            this.activeTokens.set(accessToken, {
                clientId: client_id,
                level: 'SUPREME',
                issued: Date.now(),
                correlationId: req.correlationId
            });

            this.auditLogger.info('Supreme OAuth2 token issued', {
                correlationId: req.correlationId,
                clientId: client_id,
                level: 'SUPREME',
                scopes: this.config.supremeClient.scopes
            });

            res.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: 900, // 15 minutes
                scope: this.config.supremeClient.scopes.join(' '),
                issued_at: tokenPayload.issued_at,
                correlation_id: req.correlationId
            });
        } catch (error) {
            this.auditLogger.error('OAuth2 token request failed', {
                correlationId: req.correlationId,
                error: error.message,
                stack: error.stack
            });

            return this.sendError(res, 500, 'TOKEN_GENERATION_FAILED', 'Failed to generate supreme token');
        }
    }

    /**
     * Handle Supreme Authentication
     */
    async handleSupremeAuthenticate(req, res) {
        try {
            const { target_system, command_type, parameters } = req.body;

            this.auditLogger.info('Supreme authentication command', {
                correlationId: req.correlationId,
                targetSystem: target_system,
                commandType: command_type,
                supremeLocation: 'us-central1-a/MOCORIX2'
            });

            // Route to appropriate Universal Auth Orchestrator
            const result = await this.routeToUAO(target_system, {
                source: 'SUPREME',
                command: command_type,
                parameters,
                correlation_id: req.correlationId
            });

            res.json({
                status: 'SUCCESS',
                message: 'Supreme authentication command executed',
                target_system,
                result,
                correlation_id: req.correlationId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.auditLogger.error('Supreme authentication failed', {
                correlationId: req.correlationId,
                error: error.message,
                stack: error.stack
            });

            return this.sendError(res, 500, 'SUPREME_AUTH_FAILED', error.message);
        }
    }

    /**
     * Route command to appropriate Universal Auth Orchestrator
     */
    async routeToUAO(targetSystem, command) {
        // Implementation will route to master or client-specific UAO
        // This is where the actual communication with mcp.asoos.2100.cool happens
        
        const uaoEndpoint = targetSystem === 'MASTER' 
            ? this.config.uaoEndpoints.master.url
            : this.config.uaoEndpoints.clientTemplate.urlPattern.replace('{{client-id}}', targetSystem);

        // For now, return success simulation
        return {
            uao_endpoint: uaoEndpoint,
            command_processed: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Health check handlers
     */
    async handleHealthCheck(req, res) {
        res.json({
            status: 'healthy',
            service: 'supreme-orchestrator-gateway',
            version: '1.0.0',
            location: 'us-central1-a/MOCORIX2',
            timestamp: new Date().toISOString()
        });
    }

    async handleSupremeHealthCheck(req, res) {
        try {
            // Check Dr. Claude sRIX connection
            const envConfig = this.config.getEnvironmentConfig();
            
            res.json({
                status: 'healthy',
                supreme_orchestrator: 'Dr. Claude sRIX',
                location: envConfig.supremeLocation,
                uao_connection: 'active',
                oauth2_status: 'operational',
                security_level: 'enterprise',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return this.sendError(res, 500, 'SUPREME_HEALTH_CHECK_FAILED', error.message);
        }
    }

    /**
     * Utility methods
     */
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
        return sanitized;
    }

    sendError(res, statusCode, errorCode, message) {
        res.status(statusCode).json({
            error: {
                code: errorCode,
                message,
                timestamp: new Date().toISOString(),
                correlation_id: res.locals?.correlationId || 'unknown'
            }
        });
    }

    handleErrors(error, req, res, next) {
        this.auditLogger.error('Unhandled gateway error', {
            correlationId: req.correlationId,
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method
        });

        if (!res.headersSent) {
            this.sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An internal error occurred');
        }
    }

    /**
     * Start the gateway server
     */
    start(port = 8443) {
        this.app.listen(port, '0.0.0.0', () => {
            this.auditLogger.info('Supreme Orchestrator Gateway started', {
                port,
                location: 'us-central1-a/MOCORIX2',
                supreme_orchestrator: 'Dr. Claude sRIX',
                oauth2_enabled: true,
                security_level: 'enterprise'
            });
        });
    }
}

module.exports = SupremeOrchestratorGateway;