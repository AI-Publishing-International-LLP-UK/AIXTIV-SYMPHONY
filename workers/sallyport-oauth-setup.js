/**
 * Sally Port OAuth2 Setup - Cloudflare Worker
 * 
 * This worker handles:
 * 1. User registration in Sally Port (stored in Cloudflare D1)
 * 2. OAuth2 client management
 * 3. Authentication flows
 * 4. Integration with existing Sally Port security
 * 
 * Deploy: wrangler deploy --name sallyport-oauth-setup
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Route handling
      switch (path) {
        case '/setup-user':
          return await handleUserSetup(request, env);
        case '/oauth/authorize':
          return await handleOAuthAuthorize(request, env);
        case '/oauth/token':
          return await handleOAuthToken(request, env);
        case '/oauth/callback':
          return await handleOAuthCallback(request, env);
        case '/oauth/userinfo':
          return await handleUserInfo(request, env);
        case '/health':
          return new Response('OK', { status: 200, headers: corsHeaders });
        default:
          return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

/**
 * Setup new user in Sally Port system
 */
async function handleUserSetup(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { email, role = 'Diamond_SAO_Group' } = await request.json();
  
  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email is required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate secure credentials
  const userUuid = crypto.randomUUID();
  const clientId = `sallyport-${crypto.randomUUID().replace(/-/g, '')}`;
  const clientSecret = generateSecureSecret();
  
  const userData = {
    uuid: userUuid,
    email: email,
    roles: [role],
    status: 'active',
    createdAt: new Date().toISOString(),
    oauth: {
      clientId: clientId,
      clientSecret: clientSecret,
      scopes: ['openid', 'profile', 'email', 'offline_access', 'sallyport.mcp.full']
    },
    permissions: getPermissionsForRole(role)
  };

  try {
    // Store user in Cloudflare D1
    await env.SALLYPORT_DB.prepare(
      `INSERT OR REPLACE INTO users (uuid, email, roles, status, created_at, oauth_client_id, oauth_client_secret, permissions) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userUuid,
      email,
      JSON.stringify([role]),
      'active',
      new Date().toISOString(),
      clientId,
      clientSecret,
      JSON.stringify(userData.permissions)
    ).run();

    // Store OAuth2 client credentials
    await env.SALLYPORT_DB.prepare(
      `INSERT OR REPLACE INTO oauth_clients (client_id, client_secret, user_uuid, redirect_uris, scopes) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      clientId,
      clientSecret,
      userUuid,
      JSON.stringify(['https://sallyport.aixtiv.dev/oauth/callback']),
      JSON.stringify(userData.oauth.scopes)
    ).run();

    // Store MCP permissions
    await env.SALLYPORT_DB.prepare(
      `INSERT OR REPLACE INTO mcp_permissions (uuid, email, secrets_allowed, oauth_allowed, config_allowed, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      userUuid,
      email,
      userData.permissions.secretsAllowed ? 1 : 0,
      userData.permissions.oauthAllowed ? 1 : 0,
      userData.permissions.configAllowed ? 1 : 0,
      null // No expiry for Diamond SAO
    ).run();

    const response = {
      success: true,
      user: {
        uuid: userUuid,
        email: email,
        role: role,
        oauth: {
          clientId: clientId,
          authorizationUrl: `https://sallyport.aixtiv.dev/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid%20profile%20email%20offline_access%20sallyport.mcp.full&redirect_uri=https://sallyport.aixtiv.dev/oauth/callback`,
          tokenUrl: 'https://sallyport.aixtiv.dev/oauth/token'
        }
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
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create user', details: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * OAuth2 Authorization endpoint
 */
async function handleOAuthAuthorize(request, env) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const responseType = url.searchParams.get('response_type');
  const scope = url.searchParams.get('scope');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');

  if (!clientId || responseType !== 'code') {
    return new Response('Invalid request', { status: 400 });
  }

  // Verify client exists
  const client = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM oauth_clients WHERE client_id = ?'
  ).bind(clientId).first();

  if (!client) {
    return new Response('Invalid client', { status: 400 });
  }

  // Generate authorization code
  const authCode = generateSecureSecret();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Store authorization code
  await env.SALLYPORT_DB.prepare(
    `INSERT INTO auth_codes (code, client_id, user_uuid, redirect_uri, scope, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    authCode,
    clientId,
    client.user_uuid,
    redirectUri,
    scope,
    expiresAt
  ).run();

  // For now, auto-approve (in production, you'd show consent screen)
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set('code', authCode);
  if (state) callbackUrl.searchParams.set('state', state);

  return Response.redirect(callbackUrl.toString(), 302);
}

/**
 * OAuth2 Token endpoint
 */
async function handleOAuthToken(request, env) {
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

  // Verify client credentials
  const client = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM oauth_clients WHERE client_id = ? AND client_secret = ?'
  ).bind(clientId, clientSecret).first();

  if (!client) {
    return new Response(
      JSON.stringify({ error: 'invalid_client' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify authorization code
  const authCode = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM auth_codes WHERE code = ? AND client_id = ? AND expires_at > datetime("now")'
  ).bind(code, clientId).first();

  if (!authCode) {
    return new Response(
      JSON.stringify({ error: 'invalid_grant' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get user info
  const user = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM users WHERE uuid = ?'
  ).bind(authCode.user_uuid).first();

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'invalid_user' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate tokens
  const accessToken = generateSecureSecret();
  const refreshToken = generateSecureSecret();
  const expiresIn = 3600; // 1 hour

  // Store tokens
  await env.SALLYPORT_DB.prepare(
    `INSERT INTO access_tokens (token, user_uuid, client_id, scope, expires_at) 
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    accessToken,
    user.uuid,
    clientId,
    authCode.scope,
    new Date(Date.now() + expiresIn * 1000).toISOString()
  ).run();

  await env.SALLYPORT_DB.prepare(
    `INSERT INTO refresh_tokens (token, user_uuid, client_id, expires_at) 
     VALUES (?, ?, ?, ?)`
  ).bind(
    refreshToken,
    user.uuid,
    clientId,
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
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
    scope: authCode.scope
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
 * OAuth2 Callback handler
 */
async function handleOAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code) {
    return new Response('Authorization failed', { status: 400 });
  }

  // In a real implementation, you'd exchange the code for tokens
  // and redirect to your application with the tokens
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sally Port Authentication Success</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { color: #28a745; }
      </style>
    </head>
    <body>
      <h1 class="success">✅ Authentication Successful</h1>
      <p>You have successfully authenticated with Sally Port.</p>
      <p>Authorization Code: <code>${code}</code></p>
      <p>You can now access MCP resources with your credentials.</p>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * OAuth2 UserInfo endpoint
 */
async function handleUserInfo(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const accessToken = authHeader.substring(7);
  
  // Verify access token
  const tokenRecord = await env.SALLYPORT_DB.prepare(
    'SELECT * FROM access_tokens WHERE token = ? AND expires_at > datetime("now")'
  ).bind(accessToken).first();

  if (!tokenRecord) {
    return new Response('Invalid token', { status: 401 });
  }

  // Get user info
  const user = await env.SALLYPORT_DB.prepare(
    'SELECT uuid, email, roles, status, created_at FROM users WHERE uuid = ?'
  ).bind(tokenRecord.user_uuid).first();

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const userInfo = {
    sub: user.uuid,
    email: user.email,
    roles: JSON.parse(user.roles),
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
 * Generate secure secret
 */
function generateSecureSecret() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get permissions based on user role
 */
function getPermissionsForRole(role) {
  const rolePermissions = {
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

  return rolePermissions[role] || rolePermissions['Onyx_SAO_Group'];
}
