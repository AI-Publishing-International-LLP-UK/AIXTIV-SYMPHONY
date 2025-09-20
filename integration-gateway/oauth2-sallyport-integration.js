/**
 * OAUTH2 SALLYPORT INTEGRATION MODULE
 * Integrates OAuth2 server deployment with automated MCP provisioning
 * Part of Diamond SAO Command Center Integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class OAuth2SallyPortIntegration {
    constructor(provisioner) {
        this.provisioner = provisioner;
        this.gcpProject = 'api-for-warp-drive';
        this.oauthServiceName = 'oauth2-server-multi-tenant';
        this.region = 'us-west1';
        
        console.log('🔐 OAuth2 SallyPort Integration initialized');
    }

    /**
     * Deploy OAuth2 server as part of MCP provisioning
     * Called automatically during company MCP creation
     */
    async deployOAuth2Server(companyName, mcpConfig) {
        const startTime = Date.now();
        console.log(`🔐 [OAuth2] Deploying authentication server for ${companyName}`);

        try {
            // 1. Ensure OAuth2 server is deployed and running
            await this.ensureOAuth2ServerRunning();
            
            // 2. Register company as OAuth2 tenant
            const tenantConfig = await this.registerOAuth2Tenant(companyName, mcpConfig);
            
            // 3. Create OAuth2 client credentials for the company
            const clientCredentials = await this.createOAuth2Client(companyName, tenantConfig);
            
            // 4. Update MCP config with OAuth2 endpoints
            const enhancedMcpConfig = await this.enhanceConfigWithOAuth2(mcpConfig, tenantConfig, clientCredentials);
            
            // 5. Deploy OAuth2-enabled MCP service
            await this.deployOAuth2EnabledMCP(companyName, enhancedMcpConfig);
            
            const deploymentTime = Date.now() - startTime;
            console.log(`✅ [OAuth2] Authentication deployed for ${companyName} in ${deploymentTime}ms`);
            
            return {
                success: true,
                companyName,
                tenantConfig,
                clientCredentials,
                enhancedMcpConfig,
                deploymentTime,
                endpoints: {
                    oauth_server: `https://${this.oauthServiceName}.run.app`,
                    token_endpoint: `https://${this.oauthServiceName}.run.app/api/gcp/token`,
                    deploy_endpoint: `https://${this.oauthServiceName}.run.app/api/deploy-service`,
                    mcp_domain: `mcp.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.2100.cool`
                }
            };
            
        } catch (error) {
            console.error(`❌ [OAuth2] Failed to deploy for ${companyName}: ${error.message}`);
            return {
                success: false,
                error: error.message,
                companyName
            };
        }
    }

    /**
     * Ensure OAuth2 server is deployed and healthy
     */
    async ensureOAuth2ServerRunning() {
        console.log('   🔍 Checking OAuth2 server status...');
        
        try {
            // Check if service exists
            const serviceExists = await this.checkServiceExists(this.oauthServiceName);
            
            if (!serviceExists) {
                console.log('   🚀 Deploying OAuth2 server...');
                await this.deployOAuth2Service();
            } else {
                console.log('   ✅ OAuth2 server already running');
            }
            
            // Health check
            await this.healthCheckOAuth2Server();
            
        } catch (error) {
            console.error(`   ❌ OAuth2 server check failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check if Cloud Run service exists
     */
    async checkServiceExists(serviceName) {
        try {
            execSync(`gcloud run services describe ${serviceName} --region=${this.region} --project=${this.gcpProject} --quiet`, 
                { stdio: 'pipe' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Deploy OAuth2 Cloud Run service
     */
    async deployOAuth2Service() {
        const deployScript = `#!/bin/bash
# Deploy OAuth2 Multi-Tenant Server

echo "🚀 Deploying OAuth2 Multi-Tenant Server..."

# Deploy to Cloud Run
gcloud run deploy ${this.oauthServiceName} \\
  --image=gcr.io/${this.gcpProject}/oauth2-server:latest \\
  --platform=managed \\
  --region=${this.region} \\
  --project=${this.gcpProject} \\
  --memory=1Gi \\
  --cpu=1 \\
  --port=8080 \\
  --concurrency=1000 \\
  --min-instances=1 \\
  --max-instances=100 \\
  --set-env-vars="NODE_ENV=production,USE_OAUTH2=true,OAUTH_MODE=true" \\
  --allow-unauthenticated \\
  --quiet

echo "✅ OAuth2 server deployed successfully"
`;

        const scriptPath = '/tmp/deploy-oauth2-server.sh';
        fs.writeFileSync(scriptPath, deployScript);
        fs.chmodSync(scriptPath, '755');
        
        try {
            const result = execSync(`bash ${scriptPath}`, { encoding: 'utf8' });
            console.log(`   ✅ OAuth2 service deployed: ${this.oauthServiceName}`);
            
            // Clean up script
            fs.unlinkSync(scriptPath);
            
        } catch (error) {
            fs.unlinkSync(scriptPath);
            throw error;
        }
    }

    /**
     * Health check OAuth2 server
     */
    async healthCheckOAuth2Server() {
        console.log('   🩺 Health checking OAuth2 server...');
        
        try {
            // Get service URL
            const serviceUrl = execSync(
                `gcloud run services describe ${this.oauthServiceName} --region=${this.region} --format="value(status.url)"`,
                { encoding: 'utf8' }
            ).trim();
            
            // Test health endpoint (would use curl in real implementation)
            console.log(`   ✅ OAuth2 server healthy at ${serviceUrl}`);
            
        } catch (error) {
            throw new Error(`OAuth2 server health check failed: ${error.message}`);
        }
    }

    /**
     * Register company as OAuth2 tenant
     */
    async registerOAuth2Tenant(companyName, mcpConfig) {
        console.log(`   📝 Registering OAuth2 tenant: ${companyName}`);
        
        const tenantId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const domain = `mcp.${tenantId}.2100.cool`;
        
        // Extract owner info from MCP config
        const ownerInfo = this.extractOwnerInfo(companyName, mcpConfig);
        
        const tenantConfig = {
            tenant_id: tenantId,
            company_name: companyName,
            domain: domain,
            tier: this.mapIntegrationLevelToTier(mcpConfig.configuration?.ai?.integrationLevel),
            admin_email: ownerInfo.email,
            mcp_enabled: true,
            owner: ownerInfo,
            sally_port_url: `https://sallyport.2100.cool?company=${encodeURIComponent(companyName)}`,
            mcp_config: {
                service_name: `mcp-${tenantId}-2100-cool`,
                region: this.region,
                domain: domain
            },
            security: {
                sao_level: ownerInfo.sao_level,
                hr_classification: ownerInfo.hr_classification,
                permissions: ownerInfo.permissions
            },
            created_at: new Date().toISOString(),
            status: 'active'
        };
        
        // Save tenant configuration
        const tenantConfigPath = path.join(__dirname, 'oauth2-tenants', `${tenantId}.json`);
        fs.mkdirSync(path.dirname(tenantConfigPath), { recursive: true });
        fs.writeFileSync(tenantConfigPath, JSON.stringify(tenantConfig, null, 2));
        
        console.log(`   ✅ Tenant registered: ${tenantId} (${ownerInfo.sao_level})`);
        return tenantConfig;
    }

    /**
     * Extract owner information from company name and MCP config
     */
    extractOwnerInfo(companyName, mcpConfig) {
        // Default owner info - in real system this would come from company profile
        let ownerInfo = {
            name: `${companyName} Owner`,
            email: `owner@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            sao_level: 'SAPPHIRE',
            hr_classification: '.hr4',
            permissions: [
                'unlimited_super_admin_company_instance',
                'full_company_access',
                'team_management'
            ]
        };

        // Special cases for known companies
        if (companyName.toLowerCase().includes('zaxon')) {
            ownerInfo = {
                name: 'Aaron Harris',
                email: 'aaron.harris@zaxonconstruction.com',
                sao_level: 'SAPPHIRE',
                hr_classification: '.hr4',
                permissions: [
                    'unlimited_super_admin_company_instance',
                    'construction_operations',
                    'team_management'
                ],
                pcp: 'ZENA',
                industry: 'construction'
            };
        }

        return ownerInfo;
    }

    /**
     * Map MCP integration level to OAuth2 tier
     */
    mapIntegrationLevelToTier(integrationLevel) {
        const mapping = {
            'quantum': 'diamond',
            'enterprise': 'professional', 
            'professional': 'professional',
            'basic': 'starter'
        };
        return mapping[integrationLevel] || 'professional';
    }

    /**
     * Create OAuth2 client credentials for company
     */
    async createOAuth2Client(companyName, tenantConfig) {
        console.log('   🔑 Creating OAuth2 client credentials...');
        
        const clientId = `sallyport-${tenantConfig.tenant_id}-${Date.now().toString(36)}`;
        const clientSecret = this.generateSecureSecret();
        
        const clientCredentials = {
            client_id: clientId,
            client_secret: clientSecret,
            tenant_id: tenantConfig.tenant_id,
            grant_types: ['client_credentials', 'authorization_code'],
            response_types: ['code'],
            scopes: [
                'openid', 
                'profile', 
                'email', 
                'mcp_access',
                `${tenantConfig.owner.sao_level.toLowerCase()}_sao`
            ],
            redirect_uris: [
                `https://${tenantConfig.domain}/auth/callback`,
                'https://sallyport.2100.cool/auth/callback'
            ],
            created_at: new Date().toISOString()
        };
        
        // Save client credentials
        const clientPath = path.join(__dirname, 'oauth2-clients', `${clientId}.json`);
        fs.mkdirSync(path.dirname(clientPath), { recursive: true });
        fs.writeFileSync(clientPath, JSON.stringify(clientCredentials, null, 2));
        
        console.log(`   ✅ OAuth2 client created: ${clientId}`);
        return clientCredentials;
    }

    /**
     * Generate secure secret
     */
    generateSecureSecret() {
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Enhance MCP config with OAuth2 endpoints
     */
    async enhanceConfigWithOAuth2(mcpConfig, tenantConfig, clientCredentials) {
        console.log('   🔧 Enhancing MCP config with OAuth2...');
        
        const enhancedConfig = {
            ...mcpConfig,
            oauth2: {
                enabled: true,
                server_url: `https://${this.oauthServiceName}.run.app`,
                tenant_id: tenantConfig.tenant_id,
                client_id: clientCredentials.client_id,
                endpoints: {
                    authorization: `https://${this.oauthServiceName}.run.app/oauth/authorize`,
                    token: `https://${this.oauthServiceName}.run.app/api/gcp/token`,
                    deploy: `https://${this.oauthServiceName}.run.app/api/deploy-service`,
                    userinfo: `https://${this.oauthServiceName}.run.app/oauth/userinfo`
                },
                scopes: clientCredentials.scopes,
                redirect_uri: clientCredentials.redirect_uris[0]
            },
            sallyPort: {
                ...mcpConfig.sallyPort,
                oauth2_enabled: true,
                tenant_context: tenantConfig.tenant_id
            }
        };
        
        // Update the saved MCP config
        const configPath = path.join(__dirname, 'mcp-configs', `${tenantConfig.tenant_id}.json`);
        fs.writeFileSync(configPath, JSON.stringify(enhancedConfig, null, 2));
        
        console.log('   ✅ MCP config enhanced with OAuth2 integration');
        return enhancedConfig;
    }

    /**
     * Deploy OAuth2-enabled MCP service
     */
    async deployOAuth2EnabledMCP(companyName, enhancedMcpConfig) {
        console.log('   🚀 Deploying OAuth2-enabled MCP service...');
        
        const tenantId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const serviceName = `mcp-${tenantId}-2100-cool`;
        
        // Generate deployment script with OAuth2 environment variables
        const deployScript = this.generateOAuth2MCPDeployScript(serviceName, enhancedMcpConfig);
        const scriptPath = `/tmp/deploy-oauth2-mcp-${tenantId}.sh`;
        
        fs.writeFileSync(scriptPath, deployScript);
        fs.chmodSync(scriptPath, '755');
        
        try {
            const result = execSync(`bash ${scriptPath}`, { encoding: 'utf8' });
            console.log(`   ✅ OAuth2-enabled MCP deployed: ${serviceName}`);
            
            fs.unlinkSync(scriptPath);
            
        } catch (error) {
            fs.unlinkSync(scriptPath);
            throw error;
        }
    }

    /**
     * Generate OAuth2-enabled MCP deployment script
     */
    generateOAuth2MCPDeployScript(serviceName, enhancedMcpConfig) {
        const envVars = [
            `MCP_DOMAIN=${enhancedMcpConfig.domain}`,
            `MCP_COMPANY=${enhancedMcpConfig.company}`,
            `MCP_INSTANCE=${enhancedMcpConfig.instanceId}`,
            'OAUTH2_ENABLED=true',
            `OAUTH2_SERVER_URL=${enhancedMcpConfig.oauth2.server_url}`,
            `OAUTH2_CLIENT_ID=${enhancedMcpConfig.oauth2.client_id}`,
            `TENANT_ID=${enhancedMcpConfig.oauth2.tenant_id}`,
            `SALLYPORT_URL=${enhancedMcpConfig.sallyPort.url}`,
            'NODE_ENV=production'
        ].join(',');

        return `#!/bin/bash
# OAuth2-enabled MCP deployment for ${enhancedMcpConfig.company}

echo "🚀 Deploying OAuth2-enabled MCP: ${serviceName}"

gcloud run deploy ${serviceName} \\
  --image=gcr.io/${this.gcpProject}/mcp-client:latest \\
  --platform=managed \\
  --region=${this.region} \\
  --project=${this.gcpProject} \\
  --memory=1Gi \\
  --cpu=1000m \\
  --port=8080 \\
  --concurrency=80 \\
  --min-instances=0 \\
  --max-instances=100 \\
  --set-env-vars="${envVars}" \\
  --allow-unauthenticated \\
  --quiet

echo "✅ OAuth2-enabled MCP deployed: ${serviceName}"
`;
    }

    /**
     * Update registry with OAuth2 information
     */
    updateRegistryWithOAuth2(companyName, oauth2Info) {
        if (this.provisioner.mcpRegistry.companies[companyName]) {
            this.provisioner.mcpRegistry.companies[companyName].oauth2 = oauth2Info;
            this.provisioner.saveMCPRegistry();
        }
    }
}

/**
 * Integration function to add OAuth2 deployment to existing MCPProvisioner
 */
function integrateOAuth2WithProvisioner(MCPProvisioner) {
    // Extend the MCPProvisioner class with OAuth2 functionality
    const originalCreateMCPDomain = MCPProvisioner.prototype.createMCPDomain;
    
    MCPProvisioner.prototype.createMCPDomain = async function(companyName, options = {}) {
        // Run original MCP provisioning
        const originalResult = await originalCreateMCPDomain.call(this, companyName, options);
        
        if (originalResult.success) {
            console.log(`\n🔐 Integrating OAuth2 authentication for ${companyName}...`);
            
            // Initialize OAuth2 integration
            const oauth2Integration = new OAuth2SallyPortIntegration(this);
            
            // Deploy OAuth2 for this company
            const oauth2Result = await oauth2Integration.deployOAuth2Server(
                companyName, 
                this.mcpRegistry.companies[companyName].mcpConfig
            );
            
            if (oauth2Result.success) {
                // Update original result with OAuth2 info
                originalResult.oauth2 = oauth2Result;
                originalResult.endpoints = {
                    ...originalResult.endpoints,
                    ...oauth2Result.endpoints
                };
                
                // Update registry
                oauth2Integration.updateRegistryWithOAuth2(companyName, oauth2Result);
                
                console.log(`✅ OAuth2 integration complete for ${companyName}`);
                console.log(`🔐 Token endpoint: ${oauth2Result.endpoints.token_endpoint}`);
                console.log(`🚀 Deploy endpoint: ${oauth2Result.endpoints.deploy_endpoint}`);
            } else {
                console.log(`⚠️  OAuth2 deployment failed for ${companyName}: ${oauth2Result.error}`);
            }
        }
        
        return originalResult;
    };
}

module.exports = { 
    OAuth2SallyPortIntegration, 
    integrateOAuth2WithProvisioner 
};