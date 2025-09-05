/**
 * SallyPort Authentication Module
 * CommonJS version for Integration Gateway server compatibility
 * Provides session verification and authentication services
 */

const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class SallyPortAuthService {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || process.env.SALLYPORT_AUTH_URL || 'https://sallyport-cloudflare-auth-859242575175.us-west1.run.app';
        this.backupUrl = config.backupUrl || process.env.SALLYPORT_BACKUP_URL || 'https://integration-gateway-859242575175.us-west1.run.app';
        this.timeout = config.timeout || 10000;
        this.retries = config.retries || 3;
        this.jwtSecret = process.env.JWT_SECRET || 'asoos-default-jwt-secret-2025';
    }

    /**
     * Make a request with automatic failover and retry logic
     */
    async makeRequest(endpoint, options = {}) {
        const urls = [this.baseUrl, this.backupUrl];
        let lastError;

        for (const baseUrl of urls) {
            for (let attempt = 1; attempt <= this.retries; attempt++) {
                try {
                    const response = await axios({
                        method: 'GET',
                        url: `${baseUrl}${endpoint}`,
                        timeout: this.timeout,
                        validateStatus: (status) => status < 500, // Accept 4xx as valid responses
                        ...options
                    });

                    console.log(`✓ SallyPort request successful: ${endpoint} (${response.status})`);
                    return response;
                } catch (error) {
                    console.log(`✗ SallyPort request failed: ${endpoint} attempt ${attempt}/${this.retries} - ${error.message}`);
                    lastError = error;

                    // Wait before retry (exponential backoff)
                    if (attempt < this.retries) {
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    }
                }
            }
        }

        throw lastError || new Error('All SallyPort endpoints failed after retries');
    }

    /**
     * Verify session token format
     */
    isValidTokenFormat(token) {
        if (!token || typeof token !== 'string') return false;
        if (token.length < 10) return false;
        if (token.includes('invalid')) return false;
        return true;
    }

    /**
     * Generate a user UUID from session token
     */
    generateUserUuid(sessionToken) {
        const hash = crypto.createHash('sha256').update(sessionToken).digest('hex');
        return `user-${hash.substring(0, 12)}`;
    }

    /**
     * Get permissions for a given role
     */
    getPermissionsForRole(role) {
        const rolePermissions = {
            'admin': ['read', 'write', 'delete', 'admin'],
            'user': ['read', 'write'],
            'viewer': ['read'],
            'agent': ['read', 'write', 'agent'],
            'system': ['read', 'write', 'system']
        };
        return rolePermissions[role] || ['read'];
    }

    /**
     * Verify SallyPort session - Main function used by middleware
     */
    async verifySallyPortSession(request) {
        try {
            // Extract authorization header
            const authHeader = request.headers?.authorization || request.headers?.Authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Missing or invalid authorization header');
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            
            // Validate token format
            if (!this.isValidTokenFormat(token)) {
                throw new Error('Invalid token format');
            }

            // Try JWT verification first (for locally generated tokens)
            try {
                const decoded = jwt.verify(token, this.jwtSecret);
                if (decoded && decoded.user) {
                    return {
                        valid: true,
                        user: decoded.user,
                        tokenType: 'jwt'
                    };
                }
            } catch (jwtError) {
                // JWT verification failed, try SallyPort service verification
                console.log('JWT verification failed, trying SallyPort service');
            }

            // Verify with SallyPort service
            const verification = await this.verifyWithService(token);
            
            if (verification.valid) {
                return {
                    valid: true,
                    user: {
                        uuid: verification.userUuid,
                        email: verification.email,
                        displayName: verification.displayName,
                        role: verification.role,
                        permissions: verification.permissions
                    },
                    tokenType: 'sallyport'
                };
            }

            throw new Error('Session verification failed');
            
        } catch (error) {
            console.error('SallyPort session verification error:', error.message);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    /**
     * Verify session with SallyPort service
     */
    async verifyWithService(sessionToken) {
        try {
            // Use admin endpoint for verification (since /session isn't available)
            const response = await this.makeRequest('/api/admin', {
                headers: {
                    'X-Session-Token': sessionToken,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data.message) {
                return {
                    valid: true,
                    userUuid: this.generateUserUuid(sessionToken),
                    email: 'authenticated@2100.cool',
                    displayName: 'Authenticated User',
                    role: 'user',
                    permissions: this.getPermissionsForRole('user'),
                    sessionData: response.data
                };
            }

            return {
                valid: false,
                message: `Authentication failed with status: ${response.status}`,
                error: 'invalid_session'
            };
        } catch (error) {
            console.error('Service verification failed:', error.message);
            return {
                valid: false,
                message: `Authentication service error: ${error.message}`,
                error: 'service_error'
            };
        }
    }

    /**
     * Generate a session token for testing/development
     */
    generateSessionToken(credentials) {
        const payload = {
            email: credentials.email || 'test@2100.cool',
            timestamp: Date.now(),
            service: 'sallyport-auth'
        };
        return crypto.createHash('sha256')
            .update(JSON.stringify(payload))
            .digest('hex');
    }

    /**
     * Create a JWT token for development/testing
     */
    createJWTToken(user, expiresIn = '24h') {
        const payload = {
            user: {
                uuid: user.uuid || this.generateUserUuid(user.email),
                email: user.email,
                displayName: user.displayName || user.email,
                role: user.role || 'user',
                permissions: this.getPermissionsForRole(user.role || 'user')
            },
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(payload, this.jwtSecret, { expiresIn });
    }

    /**
     * Health check for SallyPort service
     */
    async healthCheck() {
        try {
            const response = await this.makeRequest('/health');
            return {
                status: response.status === 200 ? 'healthy' : 'unhealthy',
                service: 'sallyport-auth',
                timestamp: new Date().toISOString(),
                details: response.data
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'sallyport-auth',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Create a test session for development
     */
    async createTestSession(userType = 'user', email = null) {
        const user = {
            email: email || `test-${userType}@2100.cool`,
            displayName: `Test ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
            role: userType
        };

        // Create JWT token for testing
        const jwtToken = this.createJWTToken(user);
        
        return {
            sessionToken: jwtToken,
            user: {
                uuid: this.generateUserUuid(user.email),
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                permissions: this.getPermissionsForRole(user.role)
            },
            tokenType: 'jwt'
        };
    }
}

// Create singleton instance
const sallyPortAuth = new SallyPortAuthService();

/**
 * Main verification function for middleware compatibility
 */
async function verifySallyPortSession(request) {
    return await sallyPortAuth.verifySallyPortSession(request);
}

/**
 * Create test token function for development
 */
async function createTestToken(userType = 'user', email = null) {
    const session = await sallyPortAuth.createTestSession(userType, email);
    return session.sessionToken;
}

/**
 * Health check function
 */
async function healthCheck() {
    return await sallyPortAuth.healthCheck();
}

module.exports = {
    SallyPortAuthService,
    verifySallyPortSession,
    createTestToken,
    healthCheck,
    sallyPortAuth // Export instance for direct use
};
