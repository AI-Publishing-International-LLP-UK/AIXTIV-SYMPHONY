/**
 * Multi-Tenant Sally Port OAuth2 & MCP Client Setup - Cloudflare Worker
 * 
 * This cloud-to-cloud solution handles:
 * 1. Multi-tenant user registration with tier-based permissions
 * 2. Automated MCP client provisioning per tenant/user
 * 3. OAuth2/OpenID Connect authentication flows
 * 4. Integration with existing Sally Port security
 * 5. Per-client MCP server deployment automation
 * 
 * Deploy: wrangler deploy --name multi-tenant-sallyport-oauth
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Extract tenant from subdomain or header
    const tenant = extractTenant(request, url);
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Tenant-ID',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Route handling with tenant context
      switch (path) {
      case '/setup-tenant':
        return await handleTenantSetup(request, env);
      case '/setup-user':
        return await handleUserSetup(request, env, tenant);
      case '/setup-mcp-client':
        return await handleMCPClientSetup(request, env, tenant);
      case '/oauth/authorize':
        return await handleOAuthAuthorize(request, env, tenant);
      case '/oauth/token':
        return await handleOAuthToken(request, env, tenant);
      case '/oauth/callback':
        return await handleOAuthCallback(request, env, tenant);
      case '/oauth/userinfo':
        return await handleUserInfo(request, env, tenant);
      case '/mcp/deploy':
        return await handleMCPDeploy(request, env, tenant);
      case '/mcp/status':
        return await handleMCPStatus(request, env, tenant);
      case '/health':
        return new Response(JSON.stringify({ 
          status: 'OK', 
          tenant: tenant,
          timestamp: new Date().toISOString() 
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      default:
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: error.message, tenant: tenant }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

/**
 * Extract tenant from request (subdomain, header, or path)
 */
function extractTenant(request, url) {
  // Try header first
  const headerTenant = request.headers.get('X-Tenant-ID');
  if (headerTenant) return headerTenant;
  
  // Try subdomain
  const hostname = url.hostname;
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0]; // subdomain as tenant
  }
  
  // Default tenant
  return 'default';
}

/**
 * Setup new tenant with configuration
 */
async function handleTenantSetup(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { 
    tenantId, 
    tenantName, 
    tier = 'professional',
    domain,
    adminEmail,
    mcpEnabled = true,
    settings = {}
  } = await request.json();
  
  if (!tenantId || !tenantName || !adminEmail) {
    return new Response(
      JSON.stringify({ error: 'tenantId, tenantName, and adminEmail are required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const tenantUuid = crypto.randomUUID();
  const tenantData = {
    uuid: tenantUuid,
    tenantId: tenantId,
    name: tenantName,
    tier: tier,
    domain: domain,
    adminEmail: adminEmail,
    mcpEnabled: mcpEnabled,
    settings: settings,
    status: 'active',
    createdAt: new Date().toISOString(),
    limits: getTierLimits(tier)
  };

  try {
    // Store tenant configuration
    await env.SALLYPORT_DB.prepare(
      `INSERT OR REPLACE INTO tenants (uuid, tenant_id, name, tier, domain, admin_email, mcp_enabled, settings, status, created_at, limits) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      tenantUuid,
      tenantId,
      tenantName,
      tier,
      domain,
      adminEmail,
      mcpEnabled ? 1 : 0,
      JSON.stringify(settings),
      'active',
      new Date().toISOString(),
      JSON.stringify(tenantData.limits)
    ).run();

    // Create tenant-specific MCP namespace if enabled
    if (mcpEnabled) {
      await createMCPNamespace(env, tenantId);
    }

    // Setup admin user for tenant
    const adminUser = await createTenantAdminUser(env, tenantData);

    const response = {
      success: true,
      tenant: tenantData,
      adminUser: adminUser,
      mcpEndpoint: mcpEnabled ? `https://${tenantId}.mcp.sallyport.aixtiv.dev` : null,
      setupCompleted: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Tenant setup error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create tenant', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Setup user with tenant context and tier-based permissions
 */
async function handleUserSetup(request, env, tenant) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { 
    email, 
    role = 'Onyx_SAO_Group',
    firstName,
    lastName,
    department,
    mcpAccess = false,
    customScopes = []
  } = await request.json();
  
  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email is required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get tenant configuration
  const tenantConfig = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM tenants WHERE tenant_id = ? AND status = "active"'
  ).bind(tenant).first();

  if (!tenantConfig) {
    return new Response(
      JSON.stringify({ error: 'Tenant not found or inactive' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check tenant limits
  const userCount = await getUserCountForTenant(env, tenant);
  const limits = JSON.parse(tenantConfig.limits);
  
  if (userCount >= limits.maxUsers) {
    return new Response(
      JSON.stringify({ error: 'Tenant user limit exceeded', limit: limits.maxUsers }), 
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate secure credentials
  const userUuid = crypto.randomUUID();
  const clientId = `sallyport-${tenant}-${crypto.randomUUID().replace(/-/g, '')}`;
  const clientSecret = generateSecureSecret();
  
  const baseScopes = ['openid', 'profile', 'email'];
  const tierScopes = getTierScopes(tenantConfig.tier, role);
  const allScopes = [...new Set([...baseScopes, ...tierScopes, ...customScopes])];
  
  if (mcpAccess && JSON.parse(tenantConfig.mcp_enabled)) {
    allScopes.push('sallyport.mcp.full');
  }

  const userData = {
    uuid: userUuid,
    tenantId: tenant,
    email: email,
    firstName: firstName,
    lastName: lastName,
    department: department,
    roles: [role],
    status: 'active',
    createdAt: new Date().toISOString(),
    oauth: {
      clientId: clientId,
      clientSecret: clientSecret,
      scopes: allScopes
    },
    permissions: getPermissionsForRole(role, tenantConfig.tier),
    mcpAccess: mcpAccess
  };

  try {
    // Store user in tenant context
    await env.SALLYPORT_DB.prepare(
      `INSERT OR REPLACE INTO users (uuid, tenant_id, email, first_name, last_name, department, roles, status, created_at, oauth_client_id, oauth_client_secret, permissions, mcp_access) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userUuid,
      tenant,
      email,
      firstName,
      lastName,
      department,
      JSON.stringify([role]),
      'active',
      new Date().toISOString(),
      clientId,
      clientSecret,
      JSON.stringify(userData.permissions),
      mcpAccess ? 1 : 0
    ).run();

    // Store OAuth2 client credentials
    await env.SALLYPORT_DB.prepare(
      `INSERT OR REPLACE INTO oauth_clients (client_id, client_secret, user_uuid, tenant_id, redirect_uris, scopes) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      clientId,
      clientSecret,
      userUuid,
      tenant,
      JSON.stringify([
        `https://${tenant}.sallyport.aixtiv.dev/oauth/callback`,
        'https://sallyport.aixtiv.dev/oauth/callback'
      ]),
      JSON.stringify(allScopes)
    ).run();

    // Store MCP permissions if enabled
    if (mcpAccess && JSON.parse(tenantConfig.mcp_enabled)) {
      await env.SALLYPORT_DB.prepare(
        `INSERT OR REPLACE INTO mcp_permissions (uuid, tenant_id, email, secrets_allowed, oauth_allowed, config_allowed, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        userUuid,
        tenant,
        email,
        userData.permissions.secretsAllowed ? 1 : 0,
        userData.permissions.oauthAllowed ? 1 : 0,
        userData.permissions.configAllowed ? 1 : 0,
        null // No expiry for now
      ).run();
    }

    // Auto-setup MCP client if enabled
    let mcpClient = null;
    if (mcpAccess && JSON.parse(tenantConfig.mcp_enabled)) {
      mcpClient = await autoSetupMCPClient(env, userData, tenantConfig);
    }

    const response = {
      success: true,
      tenant: tenant,
      user: {
        uuid: userUuid,
        email: email,
        role: role,
        tier: tenantConfig.tier,
        oauth: {
          clientId: clientId,
          authorizationUrl: `https://${tenant}.sallyport.aixtiv.dev/oauth/authorize?client_id=${clientId}&response_type=code&scope=${encodeURIComponent(allScopes.join(' '))}&redirect_uri=https://${tenant}.sallyport.aixtiv.dev/oauth/callback`,
          tokenUrl: `https://${tenant}.sallyport.aixtiv.dev/oauth/token`
        },
        mcpClient: mcpClient
      },
      setupCompleted: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('User setup error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create user', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle automated MCP client setup
 */
async function handleMCPClientSetup(request, env, tenant) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { 
    userEmail,
    mcpServerName,
    serverType = 'standard',
    customConfig = {}
  } = await request.json();

  if (!userEmail || !mcpServerName) {
    return new Response(
      JSON.stringify({ error: 'userEmail and mcpServerName are required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get user and tenant info
    const user = await env.SALLYPORT_DB.prepare(
      'SELECT * FROM users WHERE email = ? AND tenant_id = ?'
    ).bind(userEmail, tenant).first();

    if (!user || !user.mcp_access) {
      return new Response(
        JSON.stringify({ error: 'User not found or MCP access not enabled' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tenantConfig = await env.SALLYPORT_DB.prepare(
      'SELECT * FROM tenants WHERE tenant_id = ?'
    ).bind(tenant).first();

    // Generate MCP client configuration
    const mcpConfig = await generateMCPClientConfig(env, {
      tenant: tenant,
      user: user,
      tenantConfig: tenantConfig,
      mcpServerName: mcpServerName,
      serverType: serverType,
      customConfig: customConfig
    });

    // Deploy MCP server
    const deployment = await deployMCPServer(env, mcpConfig);

    const response = {
      success: true,
      mcpConfig: mcpConfig,
      deployment: deployment,
      endpoints: {
        mcp: `https://${tenant}-${mcpServerName}.mcp.sallyport.aixtiv.dev`,
        health: `https://${tenant}-${mcpServerName}.mcp.sallyport.aixtiv.dev/health`,
        metrics: `https://${tenant}-${mcpServerName}.mcp.sallyport.aixtiv.dev/metrics`
      }
    };

    return new Response(
      JSON.stringify(response), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('MCP client setup error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to setup MCP client', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle MCP server deployment
 */
async function handleMCPDeploy(request, env, tenant) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { 
    serverName,
    config,
    autoStart = true
  } = await request.json();

  try {
    // Deploy via Cloud Run API call
    const deploymentResult = await deployToCloudRun(env, {
      tenant: tenant,
      serverName: serverName,
      config: config,
      autoStart: autoStart
    });

    return new Response(
      JSON.stringify(deploymentResult), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('MCP deployment error:', error);
    return new Response(
      JSON.stringify({ error: 'Deployment failed', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * OAuth2 Authorization with tenant context
 */
async function handleOAuthAuthorize(request, env, tenant) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const responseType = url.searchParams.get('response_type');
  const scope = url.searchParams.get('scope');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');

  if (!clientId || responseType !== 'code') {
    return new Response('Invalid request', { status: 400 });
  }

  // Verify client exists in tenant context
  const client = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM oauth_clients WHERE client_id = ? AND tenant_id = ?'
  ).bind(clientId, tenant).first();

  if (!client) {
    return new Response('Invalid client for tenant', { status: 400 });
  }

  // Generate authorization code
  const authCode = generateSecureSecret();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Store authorization code with tenant context
  await env.SALLYPORT_DB.prepare(
    `INSERT INTO auth_codes (code, client_id, user_uuid, tenant_id, redirect_uri, scope, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    authCode,
    clientId,
    client.user_uuid,
    tenant,
    redirectUri,
    scope,
    expiresAt
  ).run();

  // Auto-approve for trusted tenants (in production, show consent screen)
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set('code', authCode);
  if (state) callbackUrl.searchParams.set('state', state);

  return Response.redirect(callbackUrl.toString(), 302);
}

/**
 * OAuth2 Token exchange with tenant validation
 */
async function handleOAuthToken(request, env, tenant) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const formData = await request.formData();
  const grantType = formData.get('grant_type');
  const code = formData.get('code');
  const clientId = formData.get('client_id');
  const clientSecret = formData.get('client_secret');

  if (grantType !== 'authorization_code' || !code || !clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'invalid_request' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify client credentials in tenant context
  const client = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM oauth_clients WHERE client_id = ? AND client_secret = ? AND tenant_id = ?'
  ).bind(clientId, clientSecret, tenant).first();

  if (!client) {
    return new Response(
      JSON.stringify({ error: 'invalid_client' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify authorization code in tenant context
  const authCode = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM auth_codes WHERE code = ? AND client_id = ? AND tenant_id = ? AND expires_at > datetime("now")'
  ).bind(code, clientId, tenant).first();

  if (!authCode) {
    return new Response(
      JSON.stringify({ error: 'invalid_grant' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get user info
  const user = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM users WHERE uuid = ? AND tenant_id = ?'
  ).bind(authCode.user_uuid, tenant).first();

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'invalid_user' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate tokens with tenant context
  const accessToken = generateSecureSecret();
  const refreshToken = generateSecureSecret();
  const expiresIn = 3600;

  // Store tokens
  await env.SALLYPORT_DB.prepare(
    `INSERT INTO access_tokens (token, user_uuid, client_id, tenant_id, scope, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    accessToken,
    user.uuid,
    clientId,
    tenant,
    authCode.scope,
    new Date(Date.now() + expiresIn * 1000).toISOString()
  ).run();

  await env.SALLYPORT_DB.prepare(
    `INSERT INTO refresh_tokens (token, user_uuid, client_id, tenant_id, expires_at) 
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    refreshToken,
    user.uuid,
    clientId,
    tenant,
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  ).run();

  // Delete used authorization code
  await env.SALLYPORT_DB.prepare(
    'DELETE FROM auth_codes WHERE code = ?'
  ).bind(code).run();

  const tokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
    refresh_token: refreshToken,
    scope: authCode.scope,
    tenant: tenant
  };

  return new Response(
    JSON.stringify(tokenResponse), 
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * OAuth2 Callback with tenant branding
 */
async function handleOAuthCallback(request, env, tenant) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code) {
    return new Response('Authorization failed', { status: 400 });
  }

  // Get tenant branding
  const tenantConfig = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM tenants WHERE tenant_id = ?'
  ).bind(tenant).first();

  const tenantName = tenantConfig ? tenantConfig.name : tenant;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${tenantName} - Sally Port Authentication Success</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { color: #28a745; }
        .tenant { color: #6c757d; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="tenant">Tenant: ${tenantName} (${tenant})</div>
      <h1 class="success">✅ Authentication Successful</h1>
      <p>You have successfully authenticated with Sally Port for ${tenantName}.</p>
      <p>Authorization Code: <code>${code}</code></p>
      <p>You can now access MCP resources and tenant-specific services.</p>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * OAuth2 UserInfo with tenant context
 */
async function handleUserInfo(request, env, tenant) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const accessToken = authHeader.substring(7);
  
  // Verify access token in tenant context
  const tokenRecord = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM access_tokens WHERE token = ? AND tenant_id = ? AND expires_at > datetime("now")'
  ).bind(accessToken, tenant).first();

  if (!tokenRecord) {
    return new Response('Invalid token', { status: 401 });
  }

  // Get user info
  const user = await env.SALLYPORT_DB.prepare(
    'SELECT uuid, tenant_id, email, first_name, last_name, department, roles, status, created_at FROM users WHERE uuid = ? AND tenant_id = ?'
  ).bind(tokenRecord.user_uuid, tenant).first();

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const userInfo = {
    sub: user.uuid,
    email: user.email,
    given_name: user.first_name,
    family_name: user.last_name,
    department: user.department,
    roles: JSON.parse(user.roles),
    tenant: user.tenant_id,
    status: user.status,
    iat: Math.floor(new Date(user.created_at).getTime() / 1000)
  };

  return new Response(
    JSON.stringify(userInfo), 
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * MCP Status endpoint
 */
async function handleMCPStatus(request, env, tenant) {
  try {
    // Get all MCP deployments for tenant
    const deployments = await env.SALLYPORT_DB.prepare(
      'SELECT * FROM mcp_deployments WHERE tenant_id = ?'
    ).bind(tenant).all();

    const response = {
      tenant: tenant,
      deployments: deployments.results,
      count: deployments.results.length
    };

    return new Response(
      JSON.stringify(response), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('MCP status error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get MCP status', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper functions

/**
 * Get tier-based limits
 */
function getTierLimits(tier) {
  const limits = {
    'starter': {
      maxUsers: 5,
      maxMCPServers: 1,
      maxAPICallsPerDay: 1000,
      features: ['basic_auth', 'standard_mcp']
    },
    'professional': {
      maxUsers: 50,
      maxMCPServers: 10,
      maxAPICallsPerDay: 10000,
      features: ['basic_auth', 'standard_mcp', 'custom_domains', 'analytics']
    },
    'enterprise': {
      maxUsers: 1000,
      maxMCPServers: 100,
      maxAPICallsPerDay: 100000,
      features: ['basic_auth', 'standard_mcp', 'custom_domains', 'analytics', 'sso', 'custom_branding', 'priority_support']
    },
    'diamond': {
      maxUsers: -1, // Unlimited
      maxMCPServers: -1, // Unlimited
      maxAPICallsPerDay: -1, // Unlimited
      features: ['*'] // All features
    }
  };

  return limits[tier] || limits['starter'];
}

/**
 * Get tier-based OAuth scopes
 */
function getTierScopes(tier, role) {
  const baseScopes = ['offline_access'];
  const tierScopes = {
    'starter': ['basic_profile'],
    'professional': ['basic_profile', 'mcp_access'],
    'enterprise': ['basic_profile', 'mcp_access', 'admin_access', 'analytics'],
    'diamond': ['basic_profile', 'mcp_access', 'admin_access', 'analytics', 'system_admin']
  };

  return [...baseScopes, ...(tierScopes[tier] || [])];
}

/**
 * Get permissions based on role and tier
 */
function getPermissionsForRole(role, tier) {
  const basePermissions = {
    'Diamond_SAO_Group': {
      secretsAllowed: true,
      oauthAllowed: true,
      configAllowed: true,
      adminAccess: true,
      experimentalFeatures: true
    },
    'Emerald_SAO_Group': {
      secretsAllowed: true,
      oauthAllowed: true,
      configAllowed: true,
      adminAccess: true,
      experimentalFeatures: false
    },
    'Sapphire_SAO_Group': {
      secretsAllowed: false,
      oauthAllowed: true,
      configAllowed: true,
      adminAccess: true,
      experimentalFeatures: false
    },
    'Opal_SAO_Group': {
      secretsAllowed: false,
      oauthAllowed: true,
      configAllowed: false,
      adminAccess: true,
      experimentalFeatures: false
    },
    'Onyx_SAO_Group': {
      secretsAllowed: false,
      oauthAllowed: false,
      configAllowed: false,
      adminAccess: false,
      experimentalFeatures: false
    }
  };

  const permissions = basePermissions[role] || basePermissions['Onyx_SAO_Group'];
  
  // Tier-based permission modifications
  if (tier === 'starter') {
    permissions.secretsAllowed = false;
    permissions.experimentalFeatures = false;
  } else if (tier === 'diamond') {
    // Diamond tier gets everything
    permissions.secretsAllowed = true;
    permissions.oauthAllowed = true;
    permissions.configAllowed = true;
    permissions.adminAccess = true;
    permissions.experimentalFeatures = true;
  }

  return permissions;
}

/**
 * Create tenant admin user
 */
async function createTenantAdminUser(env, tenantData) {
  const adminUserData = {
    uuid: crypto.randomUUID(),
    tenantId: tenantData.tenantId,
    email: tenantData.adminEmail,
    firstName: 'Admin',
    lastName: 'User',
    roles: ['Diamond_SAO_Group'],
    status: 'active',
    mcpAccess: tenantData.mcpEnabled
  };

  const clientId = `sallyport-${tenantData.tenantId}-admin-${crypto.randomUUID().replace(/-/g, '')}`;
  const clientSecret = generateSecureSecret();

  // Store admin user
  await env.SALLYPORT_DB.prepare(
    `INSERT INTO users (uuid, tenant_id, email, first_name, last_name, roles, status, created_at, oauth_client_id, oauth_client_secret, permissions, mcp_access) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    adminUserData.uuid,
    tenantData.tenantId,
    tenantData.adminEmail,
    'Admin',
    'User',
    JSON.stringify(['Diamond_SAO_Group']),
    'active',
    new Date().toISOString(),
    clientId,
    clientSecret,
    JSON.stringify(getPermissionsForRole('Diamond_SAO_Group', tenantData.tier)),
    tenantData.mcpEnabled ? 1 : 0
  ).run();

  return {
    ...adminUserData,
    oauth: {
      clientId: clientId,
      clientSecret: clientSecret
    }
  };
}

/**
 * Auto-setup MCP client for user
 */
async function autoSetupMCPClient(env, userData, tenantConfig) {
  const mcpClientId = `mcp-${userData.tenantId}-${userData.uuid}`;
  
  try {
    const mcpConfig = await generateMCPClientConfig(env, {
      tenant: userData.tenantId,
      user: userData,
      tenantConfig: tenantConfig,
      mcpServerName: `user-${userData.uuid}`,
      serverType: 'standard',
      customConfig: {}
    });

    // Store MCP client configuration
    await env.SALLYPORT_DB.prepare(
      `INSERT INTO mcp_clients (client_id, user_uuid, tenant_id, config, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      mcpClientId,
      userData.uuid,
      userData.tenantId,
      JSON.stringify(mcpConfig),
      'active',
      new Date().toISOString()
    ).run();

    return {
      clientId: mcpClientId,
      config: mcpConfig,
      endpoint: `https://${userData.tenantId}-user-${userData.uuid}.mcp.sallyport.aixtiv.dev`
    };

  } catch (error) {
    console.error('Auto MCP setup error:', error);
    return null;
  }
}

/**
 * Generate MCP client configuration
 */
async function generateMCPClientConfig(env, options) {
  const { tenant, user, tenantConfig, mcpServerName, serverType, customConfig } = options;
  
  const mcpConfig = {
    name: mcpServerName,
    tenant: tenant,
    user: user.uuid,
    type: serverType,
    environment: {
      TENANT_ID: tenant,
      USER_UUID: user.uuid,
      SALLYPORT_ENDPOINT: `https://${tenant}.sallyport.aixtiv.dev`,
      MCP_CLIENT_ID: user.oauth_client_id,
      ...customConfig.environment
    },
    resources: {
      memory: serverType === 'premium' ? '2Gi' : '1Gi',
      cpu: serverType === 'premium' ? '1000m' : '500m'
    },
    scaling: {
      minInstances: serverType === 'premium' ? 1 : 0,
      maxInstances: serverType === 'premium' ? 10 : 5
    },
    ...customConfig
  };

  return mcpConfig;
}

/**
 * Deploy MCP server to Cloud Run
 */
async function deployToCloudRun(env, deploymentConfig) {
  // This would integrate with Google Cloud Run API
  // For now, simulate the deployment
  
  const deploymentId = crypto.randomUUID();
  const deploymentData = {
    id: deploymentId,
    tenant: deploymentConfig.tenant,
    serverName: deploymentConfig.serverName,
    status: 'deploying',
    endpoint: `https://${deploymentConfig.tenant}-${deploymentConfig.serverName}.mcp.sallyport.aixtiv.dev`,
    createdAt: new Date().toISOString()
  };

  // Store deployment record
  await env.SALLYPORT_DB.prepare(
    `INSERT INTO mcp_deployments (id, tenant_id, server_name, config, status, endpoint, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    deploymentId,
    deploymentConfig.tenant,
    deploymentConfig.serverName,
    JSON.stringify(deploymentConfig.config),
    'deploying',
    deploymentData.endpoint,
    new Date().toISOString()
  ).run();

  // In a real implementation, trigger Cloud Run deployment here
  // await triggerCloudRunDeployment(deploymentConfig);

  return deploymentData;
}

/**
 * Create MCP namespace for tenant
 */
async function createMCPNamespace(env, tenantId) {
  // Create namespace configuration
  const namespaceConfig = {
    tenantId: tenantId,
    namespace: `mcp-${tenantId}`,
    resources: {
      quotas: {
        'requests.cpu': '10',
        'requests.memory': '20Gi',
        'persistentvolumeclaims': '10'
      }
    }
  };

  // Store namespace configuration
  await env.SALLYPORT_DB.prepare(
    `INSERT INTO mcp_namespaces (tenant_id, namespace, config, created_at) 
     VALUES (?, ?, ?, ?)`
  ).bind(
    tenantId,
    namespaceConfig.namespace,
    JSON.stringify(namespaceConfig),
    new Date().toISOString()
  ).run();

  return namespaceConfig;
}

/**
 * Get user count for tenant
 */
async function getUserCountForTenant(env, tenantId) {
  const result = await env.SALLYPORT_DB.prepare(
    'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND status = "active"'
  ).bind(tenantId).first();
  
  return result.count;
}

/**
 * Generate secure secret
 */
function generateSecureSecret() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
