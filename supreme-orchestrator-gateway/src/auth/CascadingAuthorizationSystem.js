/**
 * Cascading Authorization System
 * Enterprise Implementation for Supreme Orchestrator -> UAO -> SallyPort Chain
 * Dr. Claude sRIX (us-central1) -> Universal Auth Orchestrators (us-west1) -> SallyPort (global)
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const winston = require('winston');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const OAuth2Config = require('../config/oauth2Config');

class CascadingAuthorizationSystem {
    constructor() {
        this.config = new OAuth2Config();
        this.secretClient = new SecretManagerServiceClient();
        this.authorizationChains = new Map();
        this.activeTokens = new Map();
        this.auditLogger = this.setupAuditLogger();
        
        // Initialize authorization hierarchy
        this.initializeAuthorizationHierarchy();
    }

    /**
     * Setup comprehensive audit logging for authorization events
     */
    setupAuditLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { 
                component: 'cascading-authorization-system',
                location: 'us-central1-a/MOCORIX2'
            },
            transports: [
                new winston.transports.File({
                    filename: '/var/log/supreme-orchestrator/authorization-audit.log',
                    maxsize: 100 * 1024 * 1024,
                    maxFiles: 20,
                    tailable: true
                }),
                new winston.transports.Console()
            ]
        });
    }

    /**
     * Initialize the authorization hierarchy and command flow chains
     */
    initializeAuthorizationHierarchy() {
        // Define the complete authorization chain
        this.authorizationHierarchy = {
            // Level 0: Supreme Authority
            'SUPREME': {
                level: 0,
                name: 'Dr. Claude sRIX Supreme Orchestrator',
                location: 'us-central1-a/MOCORIX2',
                permissions: ['*'], // Unlimited permissions
                canCommand: ['DIAMOND_SAO', 'EMERALD_SAO', 'MASTER_UAO', 'CLIENT_UAO', 'SALLYPORT'],
                tokenLifetime: '15m',
                refreshLifetime: '24h',
                requires2FA: false, // Supreme level doesn't require 2FA
                maxConcurrentSessions: 10
            },
            
            // Level 1: Diamond SAO
            'DIAMOND_SAO': {
                level: 1,
                name: 'Diamond SAO Command Center',
                location: 'global/diamond-sao',
                permissions: ['diamond-command', 'emerald-override', 'client-management', 'system-admin'],
                canCommand: ['EMERALD_SAO', 'MASTER_UAO', 'CLIENT_UAO', 'SALLYPORT'],
                tokenLifetime: '30m',
                refreshLifetime: '8h',
                requires2FA: true,
                maxConcurrentSessions: 5
            },
            
            // Level 2: Emerald SAO
            'EMERALD_SAO': {
                level: 2,
                name: 'Emerald SAO Command Center',
                location: 'global/emerald-sao',
                permissions: ['emerald-command', 'client-limited-management', 'monitoring'],
                canCommand: ['MASTER_UAO', 'CLIENT_UAO', 'SALLYPORT'],
                tokenLifetime: '20m',
                refreshLifetime: '4h',
                requires2FA: true,
                maxConcurrentSessions: 3
            },
            
            // Level 10: Master Universal Auth Orchestrator
            'MASTER_UAO': {
                level: 10,
                name: 'Master Universal Auth Orchestrator',
                location: 'us-west1/mcp.asoos.2100.cool',
                permissions: ['template-management', 'client-uao-control', 'bulk-operations'],
                canCommand: ['CLIENT_UAO', 'SALLYPORT'],
                tokenLifetime: '10m',
                refreshLifetime: '2h',
                requires2FA: false, // System-to-system communication
                maxConcurrentSessions: 100
            },
            
            // Level 11: Client Universal Auth Orchestrator
            'CLIENT_UAO': {
                level: 11,
                name: 'Client Universal Auth Orchestrator',
                location: 'us-west1/client-specific',
                permissions: ['client-auth', 'client-data', 'sallyport-integration'],
                canCommand: ['SALLYPORT'],
                tokenLifetime: '5m',
                refreshLifetime: '1h',
                requires2FA: false, // System-to-system communication
                maxConcurrentSessions: 1000
            },
            
            // Level 20: SallyPort Gateway
            'SALLYPORT': {
                level: 20,
                name: 'SallyPort Single Door Gateway',
                location: 'global/sallyport.2100.cool',
                permissions: ['single-door-control', 'client-validation', 'access-logging'],
                canCommand: [], // Terminal level - no further commands
                tokenLifetime: '2m',
                refreshLifetime: '30m',
                requires2FA: false,
                maxConcurrentSessions: 10000
            }
        };

        this.auditLogger.info('Authorization hierarchy initialized', {
            levels: Object.keys(this.authorizationHierarchy).length,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Validate if a requesting level can command a target level
     */
    validateAuthorizationChain(requestingLevel, targetLevel) {
        const requester = this.authorizationHierarchy[requestingLevel];
        const target = this.authorizationHierarchy[targetLevel];

        if (!requester || !target) {
            return {
                valid: false,
                reason: 'Invalid authorization levels specified',
                code: 'INVALID_LEVELS'
            };
        }

        // Check if requester has authority over target
        if (!requester.canCommand.includes(targetLevel)) {
            return {
                valid: false,
                reason: `${requester.name} cannot command ${target.name}`,
                code: 'INSUFFICIENT_AUTHORITY',
                requesterLevel: requester.level,
                targetLevel: target.level
            };
        }

        // Additional hierarchy validation
        if (requester.level >= target.level && requestingLevel !== 'SUPREME') {
            return {
                valid: false,
                reason: `Level ${requester.level} cannot command level ${target.level}`,
                code: 'HIERARCHY_VIOLATION'
            };
        }

        return {
            valid: true,
            chain: `${requester.name} -> ${target.name}`,
            requesterPermissions: requester.permissions,
            targetPermissions: target.permissions,
            commandPath: this.buildCommandPath(requestingLevel, targetLevel)
        };
    }

    /**
     * Build the complete command path from source to target
     */
    buildCommandPath(sourceLevel, targetLevel) {
        const path = [sourceLevel];
        const source = this.authorizationHierarchy[sourceLevel];
        const target = this.authorizationHierarchy[targetLevel];

        // For direct commands
        if (source.canCommand.includes(targetLevel)) {
            path.push(targetLevel);
            return path;
        }

        // For cascading commands through intermediary levels
        // This would implement more complex routing logic for multi-hop commands
        path.push(targetLevel);
        return path;
    }

    /**
     * Create a cascading authorization token
     */
    async createCascadingToken(requestingLevel, targetLevel, correlationId, additionalClaims = {}) {
        try {
            const validation = this.validateAuthorizationChain(requestingLevel, targetLevel);
            
            if (!validation.valid) {
                throw new Error(`Authorization chain validation failed: ${validation.reason}`);
            }

            const credentials = await this.config.getSupremeCredentials();
            const requester = this.authorizationHierarchy[requestingLevel];
            const target = this.authorizationHierarchy[targetLevel];

            const tokenPayload = {
                // Standard claims
                iss: 'supreme-orchestrator-gateway',
                aud: target.location,
                sub: requestingLevel,
                
                // Custom claims
                requesting_level: requestingLevel,
                target_level: targetLevel,
                command_chain: validation.commandPath,
                permissions: target.permissions,
                location_chain: `${requester.location} -> ${target.location}`,
                correlation_id: correlationId,
                issued_at: new Date().toISOString(),
                
                // Security claims
                session_id: crypto.randomUUID(),
                ip_binding: null, // Can be set for additional security
                device_binding: null, // Can be set for device-specific authorization
                
                // Additional claims
                ...additionalClaims
            };

            const token = jwt.sign(tokenPayload, credentials.privateKey, {
                algorithm: this.config.security.jwtConfig.algorithm,
                expiresIn: target.tokenLifetime
            });

            // Store active token for tracking
            this.activeTokens.set(token, {
                requestingLevel,
                targetLevel,
                issued: Date.now(),
                expires: Date.now() + this.parseTimeToMs(target.tokenLifetime),
                correlationId,
                sessionId: tokenPayload.session_id
            });

            this.auditLogger.info('Cascading authorization token created', {
                requestingLevel,
                targetLevel,
                commandChain: validation.chain,
                correlationId,
                sessionId: tokenPayload.session_id,
                expiresIn: target.tokenLifetime
            });

            return {
                token,
                tokenType: 'Bearer',
                expiresIn: this.parseTimeToMs(target.tokenLifetime) / 1000,
                commandChain: validation.chain,
                permissions: target.permissions,
                sessionId: tokenPayload.session_id
            };

        } catch (error) {
            this.auditLogger.error('Failed to create cascading token', {
                requestingLevel,
                targetLevel,
                correlationId,
                error: error.message,
                stack: error.stack
            });

            throw new Error(`Token creation failed: ${error.message}`);
        }
    }

    /**
     * Validate a cascading authorization token
     */
    async validateCascadingToken(token, expectedTargetLevel = null) {
        try {
            const credentials = await this.config.getSupremeCredentials();
            
            const decoded = jwt.verify(token, credentials.privateKey, {
                algorithms: [this.config.security.jwtConfig.algorithm],
                issuer: 'supreme-orchestrator-gateway'
            });

            // Check if token is in active tokens
            const tokenInfo = this.activeTokens.get(token);
            if (!tokenInfo) {
                throw new Error('Token not found in active token registry');
            }

            // Check if token is expired
            if (Date.now() > tokenInfo.expires) {
                this.activeTokens.delete(token);
                throw new Error('Token has expired');
            }

            // Validate target level if specified
            if (expectedTargetLevel && decoded.target_level !== expectedTargetLevel) {
                throw new Error(`Token target level mismatch: expected ${expectedTargetLevel}, got ${decoded.target_level}`);
            }

            // Validate authorization chain
            const validation = this.validateAuthorizationChain(
                decoded.requesting_level, 
                decoded.target_level
            );

            if (!validation.valid) {
                throw new Error(`Authorization chain no longer valid: ${validation.reason}`);
            }

            this.auditLogger.info('Cascading token validated successfully', {
                requestingLevel: decoded.requesting_level,
                targetLevel: decoded.target_level,
                correlationId: decoded.correlation_id,
                sessionId: decoded.session_id
            });

            return {
                valid: true,
                decoded,
                tokenInfo,
                authorizationChain: validation
            };

        } catch (error) {
            this.auditLogger.error('Token validation failed', {
                error: error.message,
                token: token ? token.substring(0, 50) + '...' : 'null'
            });

            return {
                valid: false,
                error: error.message,
                code: 'TOKEN_VALIDATION_FAILED'
            };
        }
    }

    /**
     * Revoke a cascading token
     */
    async revokeCascadingToken(token, reason = 'Manual revocation') {
        const tokenInfo = this.activeTokens.get(token);
        
        if (tokenInfo) {
            this.activeTokens.delete(token);
            
            this.auditLogger.warn('Cascading token revoked', {
                requestingLevel: tokenInfo.requestingLevel,
                targetLevel: tokenInfo.targetLevel,
                correlationId: tokenInfo.correlationId,
                sessionId: tokenInfo.sessionId,
                reason
            });

            return { revoked: true, reason };
        }

        return { revoked: false, reason: 'Token not found' };
    }

    /**
     * Get authorization statistics
     */
    getAuthorizationStats() {
        const activeTokenCount = this.activeTokens.size;
        const tokensByLevel = {};
        
        for (const [token, info] of this.activeTokens) {
            const key = `${info.requestingLevel}->${info.targetLevel}`;
            tokensByLevel[key] = (tokensByLevel[key] || 0) + 1;
        }

        return {
            activeTokens: activeTokenCount,
            tokensByLevel,
            authorizationLevels: Object.keys(this.authorizationHierarchy).length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Utility function to parse time strings to milliseconds
     */
    parseTimeToMs(timeStr) {
        const timeRegex = /^(\d+)([smhd])$/;
        const match = timeStr.match(timeRegex);
        
        if (!match) {
            throw new Error(`Invalid time format: ${timeStr}`);
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: throw new Error(`Unknown time unit: ${unit}`);
        }
    }

    /**
     * Cleanup expired tokens
     */
    cleanupExpiredTokens() {
        const now = Date.now();
        let cleanedUp = 0;

        for (const [token, info] of this.activeTokens) {
            if (now > info.expires) {
                this.activeTokens.delete(token);
                cleanedUp++;
            }
        }

        if (cleanedUp > 0) {
            this.auditLogger.info('Expired tokens cleaned up', {
                cleanedUp,
                remaining: this.activeTokens.size
            });
        }

        return cleanedUp;
    }

    /**
     * Start automatic cleanup interval
     */
    startAutomaticCleanup(intervalMs = 300000) { // 5 minutes
        setInterval(() => {
            this.cleanupExpiredTokens();
        }, intervalMs);

        this.auditLogger.info('Automatic token cleanup started', {
            intervalMs,
            interval: `${intervalMs / 1000}s`
        });
    }
}

module.exports = CascadingAuthorizationSystem;