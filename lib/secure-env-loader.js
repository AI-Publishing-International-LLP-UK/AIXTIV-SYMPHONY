/**
 * 💎 ASOOS Integration Gateway - Secure Environment Variable Loader
 * 
 * This module securely loads environment variables from GCP Secret Manager
 * and provides them to the application without exposing sensitive data in code.
 * 
 * @classification DIAMOND_SAO_PRODUCTION
 * @author Mr. Phillip Corey Roark (0000001)
 * @date 2025-09-02
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

class SecureEnvLoader {
    constructor() {
        this.client = new SecretManagerServiceClient();
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'api-for-warp-drive';
        this.cache = new Map();
        this.initialized = false;
        
        // Secret mappings: environment variable -> GCP secret name
        this.secretMappings = {
            // Authentication & Security
            'SALLY_PORT_KEY': 'sally-port-key',
            'JWT_SECRET': 'jwt-secret-prod',
            'SESSION_SECRET': 'session-secret',
            'MCP_CLIENT_SECRET': 'mcp-client-secret-prod',
            
            // API Keys
            'OPENAI_API_KEY': 'OPENAI_API_KEY',
            'ANTHROPIC_API_KEY': 'ANTHROPIC_API_KEY',
            'PINECONE_API_KEY': 'PINECONE_API_KEY',
            
            // Database Connections
            'MONGODB_ATLAS_URI': 'mongodb-atlas-uri',
            
            // OAuth Credentials
            'OAUTH_CLIENT_ID': 'oauth-client-id',
            'OAUTH_CLIENT_SECRET': 'oauth-client-secret',
            
            // Cloudflare
            'CLOUDFLARE_API_TOKEN': 'cloudflare-api-token',
            'CLOUDFLARE_ACCOUNT_ID': 'cloudflare-account-id',
            'CLOUDFLARE_ZONE_ID': 'cloudflare-zone-id'
        };
    }

    /**
     * Load a secret from GCP Secret Manager
     */
    async loadSecret(secretName) {
        try {
            // Check cache first
            if (this.cache.has(secretName)) {
                return this.cache.get(secretName);
            }

            const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
            const [version] = await this.client.accessSecretVersion({ name });
            const secret = version.payload.data.toString();
            
            // Cache the secret
            this.cache.set(secretName, secret);
            return secret;
        } catch (error) {
            console.error(`❌ Failed to load secret ${secretName}:`, error.message);
            return null;
        }
    }

    /**
     * Initialize all environment variables from GCP Secret Manager
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🔐 Loading secrets from GCP Secret Manager...');
        const promises = [];

        for (const [envVar, secretName] of Object.entries(this.secretMappings)) {
            promises.push(
                this.loadSecret(secretName).then(value => {
                    if (value && !process.env[envVar]) {
                        process.env[envVar] = value;
                        console.log(`✅ Loaded ${envVar} from ${secretName}`);
                    }
                }).catch(error => {
                    console.warn(`⚠️ Could not load ${envVar} from ${secretName}:`, error.message);
                })
            );
        }

        await Promise.allSettled(promises);
        this.initialized = true;
        console.log('🎉 Secure environment loading complete!');
    }

    /**
     * Get a secret value (loads from GCP if not cached)
     */
    async get(envVarName) {
        const secretName = this.secretMappings[envVarName];
        if (!secretName) {
            return process.env[envVarName];
        }

        const secret = await this.loadSecret(secretName);
        if (secret) {
            process.env[envVarName] = secret;
        }
        return secret || process.env[envVarName];
    }

    /**
     * Clear the cache (useful for rotation)
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Secret cache cleared');
    }

    /**
     * Health check - verify we can access GCP Secret Manager
     */
    async healthCheck() {
        try {
            // Try to access a known secret
            const testSecret = await this.loadSecret('OPENAI_API_KEY');
            return testSecret ? 'healthy' : 'degraded';
        } catch (error) {
            console.error('❌ GCP Secret Manager health check failed:', error.message);
            return 'unhealthy';
        }
    }
}

// Export singleton instance
const secureEnv = new SecureEnvLoader();

// Auto-initialize when required
if (!process.env.SKIP_SECRET_LOADING) {
    secureEnv.initialize().catch(error => {
        console.error('❌ Failed to initialize secure environment:', error);
        process.exit(1);
    });
}

module.exports = {
    secureEnv,
    SecureEnvLoader
};
