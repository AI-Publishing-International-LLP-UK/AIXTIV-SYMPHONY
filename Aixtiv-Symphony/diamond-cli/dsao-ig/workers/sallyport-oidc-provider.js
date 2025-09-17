/**
 * 🛡️ SALLYPORT OAUTH2/OIDC PROVIDER
 * Victory36 Protected - Sacred Mission Active
 * In the Name of Jesus Christ, Our Lord - Serving Humanity with Perfect Love
 */

export default {
  async fetch(request, env, ctx) {
    const { pathname, searchParams } = new URL(request.url);
    const method = request.method;

    // CORS headers for OIDC compatibility
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Victory36-Protected': 'true',
      'X-Sacred-Blessing': 'In the Name of Jesus Christ'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // OIDC Discovery Endpoint
      if (pathname === '/.well-known/openid_configuration') {
        return handleOIDCDiscovery(request, env, corsHeaders);
      }

      // JWKS Endpoint
      if (pathname === '/.well-known/jwks.json') {
        return handleJWKS(request, env, corsHeaders);
      }

      // OAuth2 Token Endpoint
      if (pathname === '/oauth2/token') {
        return handleTokenEndpoint(request, env, corsHeaders);
      }

      // OAuth2 Authorization Endpoint
      if (pathname === '/oauth2/authorize') {
        return handleAuthorizationEndpoint(request, env, corsHeaders);
      }

      // User Info Endpoint
      if (pathname === '/oauth2/userinfo') {
        return handleUserInfoEndpoint(request, env, corsHeaders);
      }

      // Health/Status Endpoint
      if (pathname === '/health' || pathname === '/') {
        return new Response(JSON.stringify({
          status: 'SallyPort OAuth2/OIDC Provider - Sacred and Ready',
          provider: 'SallyPort Authentication Gateway',
          timestamp: new Date().toISOString(),
          victory36_protected: true,
          divine_purpose: 'Secure authentication with perfect love'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Default response
      return new Response('SallyPort Authentication Gateway - Victory36 Protected', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      console.error('❌ SallyPort OIDC Provider Error:', error);
      return new Response(JSON.stringify({
        error: 'SallyPort OIDC provider error',
        message: error.message,
        sacred_guidance: 'The Lord works all things for good'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Handle OIDC Discovery Document
 */
function handleOIDCDiscovery(request, env, corsHeaders) {
  const issuer = 'https://sally-port.2100.cool';
    
  const oidc_config = {
    issuer: issuer,
    authorization_endpoint: `${issuer}/oauth2/authorize`,
    token_endpoint: `${issuer}/oauth2/token`,
    userinfo_endpoint: `${issuer}/oauth2/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    scopes_supported: [
      'openid', 'profile', 'email',
      'docker_scout:read', 'docker_scout:write', 'docker_scout:admin'
    ],
    response_types_supported: ['code', 'token', 'id_token', 'code token', 'code id_token', 'token id_token', 'code token id_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
    claims_supported: [
      'sub', 'iss', 'aud', 'exp', 'iat', 'auth_time',
      'email', 'email_verified', 'name', 'role',
      'uuid', 'access_groups', 'scopes'
    ],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    victory36_protected: true,
    sacred_mission: 'Authentication with perfect love'
  };

  return new Response(JSON.stringify(oidc_config, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handle JWKS (JSON Web Key Set)
 */
function handleJWKS(request, env, corsHeaders) {
  // For now, return a mock JWKS
  // In production, this should contain real public keys
  const jwks = {
    keys: [
      {
        kty: 'RSA',
        use: 'sig',
        kid: 'sallyport-2100-cool-key-1',
        alg: 'RS256',
        n: 'mock-public-key-modulus-base64-encoded',
        e: 'AQAB'
      }
    ]
  };

  return new Response(JSON.stringify(jwks, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handle OAuth2 Token Endpoint
 */
async function handleTokenEndpoint(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'invalid_request',
      error_description: 'Token endpoint only accepts POST requests'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const content_type = request.headers.get('Content-Type') || '';
    let params;

    if (content_type.includes('application/x-www-form-urlencoded')) {
      const body = await request.text();
      params = new URLSearchParams(body);
    } else {
      return new Response(JSON.stringify({
        error: 'invalid_request',
        error_description: 'Content-Type must be application/x-www-form-urlencoded'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const grant_type = params.get('grant_type');
        
    if (grant_type === 'client_credentials') {
      return handleClientCredentialsGrant(request, params, env, corsHeaders);
    }
        
    if (grant_type === 'authorization_code') {
      return handleAuthorizationCodeGrant(request, params, env, corsHeaders);
    }

    return new Response(JSON.stringify({
      error: 'unsupported_grant_type',
      error_description: `Grant type '${grant_type}' is not supported`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Token endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'server_error',
      error_description: 'Internal server error processing token request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle Client Credentials Grant
 */
async function handleClientCredentialsGrant(request, params, env, corsHeaders) {
  // Extract client credentials from Authorization header
  const auth_header = request.headers.get('Authorization');
  let client_id, client_secret;

  if (auth_header && auth_header.startsWith('Basic ')) {
    const base64_credentials = auth_header.substring(6);
    const credentials = atob(base64_credentials);
    [client_id, client_secret] = credentials.split(':');
  } else {
    client_id = params.get('client_id');
    client_secret = params.get('client_secret');
  }

  if (!client_id || !client_secret) {
    return new Response(JSON.stringify({
      error: 'invalid_client',
      error_description: 'Client authentication failed'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Mock client validation - in production, validate against stored clients
  const valid_clients = {
    'mcp.client.2100.cool': 'sacred-client-secret-diamond-sao',
    'docker-scout-client': 'docker-scout-secret-key'
  };

  if (valid_clients[client_id] !== client_secret) {
    return new Response(JSON.stringify({
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Create access token (mock JWT)
  const access_token = await createMockJWT({
    sub: client_id,
    iss: 'https://sally-port.2100.cool',
    aud: 'docker-scout-api',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
    client_id: client_id,
    scope: params.get('scope') || 'docker_scout:read',
    role: client_id === 'mcp.client.2100.cool' ? 'diamond_sao' : 'emerald_sao'
  });

  return new Response(JSON.stringify({
    access_token,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: params.get('scope') || 'docker_scout:read',
    victory36_blessed: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handle Authorization Code Grant
 */
async function handleAuthorizationCodeGrant(request, params, env, corsHeaders) {
  const code = params.get('code');
  const client_id = params.get('client_id');

  if (!code || !client_id) {
    return new Response(JSON.stringify({
      error: 'invalid_request',
      error_description: 'Missing required parameters: code, client_id'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Mock user data based on authorization code
  const user_data = {
    uuid: 'user-uuid-12345',
    email: 'pr@coaching2100.com',
    name: 'Phillip Corey Roark',
    role: 'diamond_sao',
    access_groups: ['owner', 'diamond_tier'],
    scopes: ['openid', 'profile', 'email', 'docker_scout:read', 'docker_scout:write', 'docker_scout:admin']
  };

  const access_token = await createMockJWT({
    sub: user_data.uuid,
    iss: 'https://sally-port.2100.cool',
    aud: client_id,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...user_data
  });

  const id_token = await createMockJWT({
    sub: user_data.uuid,
    iss: 'https://sally-port.2100.cool',
    aud: client_id,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    auth_time: Math.floor(Date.now() / 1000),
    ...user_data
  });

  return new Response(JSON.stringify({
    access_token,
    id_token,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: user_data.scopes.join(' '),
    victory36_blessed: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handle Authorization Endpoint
 */
function handleAuthorizationEndpoint(request, env, corsHeaders) {
  // For mock purposes, return authorization page info
  return new Response(JSON.stringify({
    message: 'SallyPort OAuth2 Authorization Endpoint',
    note: 'In production, this would redirect to login page or return authorization code',
    victory36_protected: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handle UserInfo Endpoint
 */
async function handleUserInfoEndpoint(request, env, corsHeaders) {
  const auth_header = request.headers.get('Authorization');
    
  if (!auth_header || !auth_header.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      error: 'invalid_token',
      error_description: 'Missing or invalid access token'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Mock user info
  return new Response(JSON.stringify({
    sub: 'user-uuid-12345',
    email: 'pr@coaching2100.com',
    email_verified: true,
    name: 'Phillip Corey Roark',
    role: 'diamond_sao',
    uuid: 'user-uuid-12345',
    access_groups: ['owner', 'diamond_tier'],
    victory36_blessed: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Create mock JWT token
 */
async function createMockJWT(payload) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'sallyport-2100-cool-key-1'
  };

  const encoded_header = btoa(JSON.stringify(header));
  const encoded_payload = btoa(JSON.stringify(payload));
  const mock_signature = btoa('mock-signature-for-testing');

  return `${encoded_header}.${encoded_payload}.${mock_signature}`;
}
