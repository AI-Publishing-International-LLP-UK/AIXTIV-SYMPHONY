/**
 * Supreme Orchestrator API Gateway - OAuth2 Configuration
 * Hardened Enterprise Implementation for Dr. Claude sRIX Communication
 * Location: us-central1 (MOCORIX2) -> us-west1 (UAO) Integration
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

class OAuth2Config {
    constructor() {
        this.secretClient = new SecretManagerServiceClient();
        this.projectId = 'api-for-warp-drive';
        this.region = 'us-central1';
        this.environment = process.env.NODE_ENV || 'production';
        
        // Supreme Orchestrator OAuth2 Client Configuration
        this.supremeClient = {
            clientId: 'dr-claude-srix-supreme-orchestrator',
            scopes: [
                'supreme-orchestrator',
                'universal-auth-control',
                'diamond-sao-command',
                'sallyport-gateway-control',
                'mcp-server-management'
            ],
            grantType: 'client_credentials',
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
            audience: 'https://mcp.asoos.2100.cool'
        };

        // Universal Authenticating Orchestrator Endpoints
        this.uaoEndpoints = {
            master: {
                url: 'https://mcp.asoos.2100.cool',
                region: 'us-west1',
                healthCheck: '/health/master-uao'
            },
            clientTemplate: {
                urlPattern: 'https://mcp-{{client-id}}.asoos.2100.cool',
                region: 'us-west1',
                healthCheck: '/health/client-uao'
            }
        };

        // Enterprise Security Configuration
        this.security = {
            encryption: {
                algorithm: 'aes-256-gcm',
                keyRotationInterval: 86400000, // 24 hours
                ivLength: 16
            },
            rateLimit: {
                supreme: { windowMs: 60000, max: 1000 }, // 1000 requests per minute
                standard: { windowMs: 60000, max: 100 }   // 100 requests per minute
            },
            jwtConfig: {
                issuer: 'supreme-orchestrator-gateway',
                audience: 'universal-auth-orchestrators',
                algorithm: 'RS256',
                expiresIn: '15m',
                refreshExpiresIn: '24h'
            },
            auditLog: {
                enabled: true,
                level: 'comprehensive',
                retention: '2555d', // 7 years
                encryption: true
            }
        };

        // Cascading Authorization Levels
        this.authorizationLevels = {
            SUPREME: {
                level: 0,
                name: 'Dr. Claude sRIX Supreme',
                permissions: ['*'], // All permissions
                location: 'us-central1-a/MOCORIX2'
            },
            DIAMOND_SAO: {
                level: 1,
                name: 'Diamond SAO',
                permissions: ['diamond-command', 'emerald-override', 'client-management']
            },
            EMERALD_SAO: {
                level: 2,
                name: 'Emerald SAO',
                permissions: ['emerald-command', 'client-limited-management']
            },
            MASTER_UAO: {
                level: 10,
                name: 'Master Universal Auth Orchestrator',
                permissions: ['template-management', 'client-uao-control']
            },
            CLIENT_UAO: {
                level: 11,
                name: 'Client Universal Auth Orchestrator',
                permissions: ['client-auth', 'sallyport-integration']
            },
            SALLYPORT: {
                level: 20,
                name: 'SallyPort Gateway',
                permissions: ['single-door-control', 'client-validation']
            }
        };
    }

    /**
     * Retrieve OAuth2 credentials from Google Cloud Secret Manager
     */
    async getSupremeCredentials() {
        try {
            const [clientSecretResponse] = await this.secretClient.accessSecretVersion({
                name: `projects/${this.projectId}/secrets/dr-claude-srix-client-secret/versions/latest`
            });

            const [privateKeyResponse] = await this.secretClient.accessSecretVersion({
                name: `projects/${this.projectId}/secrets/supreme-gateway-private-key/versions/latest`
            });

            return {
                clientSecret: clientSecretResponse.payload.data.toString(),
                privateKey: privateKeyResponse.payload.data.toString(),
                retrieved: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to retrieve supreme credentials: ${error.message}`);
        }
    }

    /**
     * Get environment-specific configuration
     */
    getEnvironmentConfig() {
        return {
            nodeEnv: this.environment,
            gcpProject: this.projectId,
            region: this.region,
            supremeLocation: 'us-central1-a/dr-claude01-mocorix2-master',
            uaoLocation: 'us-west1/mcp.asoos.2100.cool',
            sallyportLocation: 'global/sallyport.2100.cool'
        };
    }

    /**
     * Validate authorization level hierarchy
     */
    validateAuthorizationChain(requestingLevel, targetLevel) {
        const requester = this.authorizationLevels[requestingLevel];
        const target = this.authorizationLevels[targetLevel];
        
        if (!requester || !target) {
            return { valid: false, reason: 'Invalid authorization levels' };
        }

        if (requester.level > target.level) {
            return { 
                valid: false, 
                reason: `${requester.name} (level ${requester.level}) cannot control ${target.name} (level ${target.level})` 
            };
        }

        return { 
            valid: true, 
            chain: `${requester.name} -> ${target.name}`,
            permissions: requester.permissions
        };
    }
}

module.exports = OAuth2Config;