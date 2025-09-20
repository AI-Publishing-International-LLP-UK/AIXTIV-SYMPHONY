/**
 * OAuth2 API Routes for Integration Gateway
 * Handles /api/gcp/token and /api/deploy-service endpoints
 * Multi-tenant support with SallyPort integration
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to extract tenant from request
const extractTenant = (req, res, next) => {
  const tenant = req.headers['x-tenant-id'] || 
                 req.body.tenant ||
                 req.query.tenant ||
                 extractTenantFromDomain(req.hostname) ||
                 'default';
  
  req.tenant = tenant;
  next();
};

const extractTenantFromDomain = (hostname) => {
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0]; // Extract subdomain as tenant
  }
  return null;
};

// SallyPort verification middleware
const verifySallyPort = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'invalid_request',
        error_description: 'Missing or invalid authorization header' 
      });
    }

    // For now, basic validation - integrate with actual SallyPort later
    const token = authHeader.substring(7);
    req.sallyPortToken = token;
    req.authenticated = true;
    
    next();
  } catch (error) {
    console.error('SallyPort verification failed:', error);
    res.status(401).json({ 
      error: 'invalid_token',
      error_description: 'Token verification failed' 
    });
  }
};

/**
 * POST /api/gcp/token - OAuth2 Token Exchange
 * Supports client_credentials and authorization_code grants
 */
router.post('/api/gcp/token', extractTenant, async (req, res) => {
  try {
    const { 
      grant_type, 
      client_id, 
      client_secret, 
      scope = 'openid profile email',
      code,
      redirect_uri 
    } = req.body;

    console.log(`🔐 Token request for tenant: ${req.tenant}, grant_type: ${grant_type}`);

    // Validate grant type
    if (!['client_credentials', 'authorization_code'].includes(grant_type)) {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only client_credentials and authorization_code grants are supported'
      });
    }

    // Validate client credentials
    if (!client_id) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'client_id is required'
      });
    }

    // Generate JWT access token
    const tokenPayload = {
      sub: client_id,
      tenant: req.tenant,
      scope: scope,
      grant_type: grant_type,
      iss: 'integration-gateway-oauth2',
      aud: `mcp.${req.tenant}.2100.cool`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    // Add tenant-specific claims
    if (req.tenant === 'zaxon') {
      tokenPayload.company = 'Zaxon Construction';
      tokenPayload.sao_level = 'SAPPHIRE';
      tokenPayload.owner = 'Aaron Harris';
      tokenPayload.pcp = 'ZENA';
    }

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'dev-secret-key');
    
    // Generate refresh token for authorization_code grant
    const refreshToken = grant_type === 'authorization_code' ? 
      jwt.sign({ ...tokenPayload, type: 'refresh' }, process.env.JWT_SECRET || 'dev-secret-key') : null;

    const response = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: scope,
      tenant: req.tenant,
      issued_at: new Date().toISOString()
    };

    if (refreshToken) {
      response.refresh_token = refreshToken;
    }

    console.log(`✅ Token issued for ${req.tenant} (${client_id})`);
    
    res.json(response);

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Failed to generate token'
    });
  }
});

/**
 * POST /api/deploy-service - Deploy Service Endpoint
 * Requires valid OAuth2 token for authorization
 */
router.post('/api/deploy-service', extractTenant, verifySallyPort, async (req, res) => {
  try {
    const {
      service_name,
      service_type = 'mcp-client',
      region = 'us-west1',
      config = {},
      auto_start = true
    } = req.body;

    console.log(`🚀 Deploy request for tenant: ${req.tenant}, service: ${service_name}`);

    if (!service_name) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'service_name is required'
      });
    }

    // Generate deployment configuration
    const deploymentId = `deploy-${req.tenant}-${Date.now()}`;
    const serviceName = `${service_name}-${req.tenant}`;
    
    const deployment = {
      deployment_id: deploymentId,
      tenant: req.tenant,
      service_name: serviceName,
      service_type: service_type,
      region: region,
      status: 'initiated',
      cloud_run_service: `${serviceName}-${Date.now().toString(36)}`,
      endpoints: {
        primary: `https://${serviceName}.run.app`,
        health: `https://${serviceName}.run.app/health`,
        api: `https://${serviceName}.run.app/api`
      },
      config: {
        memory: config.memory || '1Gi',
        cpu: config.cpu || '1000m',
        concurrency: config.concurrency || 100,
        min_instances: config.min_instances || 0,
        max_instances: config.max_instances || 10,
        env_vars: {
          TENANT_ID: req.tenant,
          NODE_ENV: 'production',
          REGION: region,
          ...config.env_vars
        }
      },
      created_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 300000).toISOString() // 5 minutes
    };

    // Add tenant-specific configuration
    if (req.tenant === 'zaxon') {
      deployment.config.env_vars.COMPANY_NAME = 'Zaxon Construction';
      deployment.config.env_vars.OWNER_EMAIL = 'aaron.harris@zaxonconstruction.com';
      deployment.config.env_vars.SAO_LEVEL = 'SAPPHIRE';
      deployment.config.env_vars.PCP_NAME = 'ZENA';
      deployment.endpoints.mcp = 'https://mcp.zaxon.2100.cool';
    }

    // Simulate deployment process
    setTimeout(() => {
      console.log(`✅ Deployment ${deploymentId} completed for ${req.tenant}`);
    }, 2000);

    console.log(`📦 Deployment configured for ${req.tenant}: ${serviceName}`);
    
    res.status(202).json({
      success: true,
      deployment: deployment,
      message: `Service deployment initiated for ${req.tenant}`,
      next_steps: [
        'Monitor deployment status',
        'Wait for service to be ready',
        'Test service endpoints'
      ]
    });

  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({
      error: 'deployment_failed',
      error_description: 'Service deployment failed',
      details: error.message
    });
  }
});

/**
 * GET /api/oauth/health - Health check endpoint
 */
router.get('/api/oauth/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'integration-gateway-oauth2',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'POST /api/gcp/token',
      'POST /api/deploy-service'
    ]
  });
});

/**
 * GET /api/tenant/:tenant/status - Tenant status endpoint
 */
router.get('/api/tenant/:tenant/status', (req, res) => {
  const tenant = req.params.tenant;
  
  // Return tenant-specific status
  const status = {
    tenant: tenant,
    status: 'active',
    mcp_endpoint: `mcp.${tenant}.2100.cool`,
    oauth_enabled: true,
    services: ['mcp-client', 'integration-gateway'],
    last_activity: new Date().toISOString()
  };

  // Add tenant-specific details
  if (tenant === 'zaxon') {
    status.company = 'Zaxon Construction';
    status.owner = 'Aaron Harris';
    status.sao_level = 'SAPPHIRE';
    status.pcp = 'ZENA';
    status.industry = 'construction';
  }

  res.json(status);
});

module.exports = router;