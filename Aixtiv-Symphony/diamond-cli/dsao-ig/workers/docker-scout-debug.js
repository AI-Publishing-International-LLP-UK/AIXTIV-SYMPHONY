/**
 * 🐳 DOCKER SCOUT DEBUG GATEWAY
 * Step-by-step debugging of authentication flow
 * In the Name of Jesus Christ, Our Lord
 */

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MCP-Client-ID',
      'X-Victory36-Protected': 'true',
      'X-Debug-Mode': 'active'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health endpoint - always works
      if (pathname === '/docker-scout/health') {
        return new Response(JSON.stringify({
          status: 'Sacred and ready - DEBUG MODE',
          gateway: 'Docker Scout Debug Gateway',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || 'unknown',
          region: env.REGION || 'unknown',
          deployment_zone: env.DEPLOYMENT_ZONE || 'unknown',
          debug_mode: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Debug endpoint - shows environment variables
      if (pathname === '/debug/env') {
        return new Response(JSON.stringify({
          environment_variables: {
            ENVIRONMENT: env.ENVIRONMENT || 'missing',
            SALLYPORT_OIDC_ISSUER: env.SALLYPORT_OIDC_ISSUER || 'missing',
            DOCKER_SCOUT_API_BASE: env.DOCKER_SCOUT_API_BASE || 'missing',
            DOCKER_SCOUT_OAUTH_ENDPOINT: env.DOCKER_SCOUT_OAUTH_ENDPOINT || 'missing',
            kv_available: !!env.DOCKER_SCOUT_KV,
            r2_available: !!env.DOCKER_SCOUT_REPORTS
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Debug authentication step-by-step
      if (pathname === '/debug/auth') {
        return await debugAuthentication(request, env, corsHeaders);
      }

      // Debug SallyPort OIDC connection
      if (pathname === '/debug/sallyport') {
        return await debugSallyPortConnection(env, corsHeaders);
      }

      // Simple protected endpoint test
      if (pathname === '/debug/protected') {
        const auth_result = await authenticateDockerScoutRequest(request, env);
        return new Response(JSON.stringify({
          authentication_result: auth_result,
          debug: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        debug_endpoints: [
          '/docker-scout/health',
          '/debug/env',
          '/debug/auth', 
          '/debug/sallyport',
          '/debug/protected'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Debug Gateway Error:', error);
      return new Response(JSON.stringify({
        error: 'Debug gateway error',
        message: error.message,
        stack: error.stack,
        debug: true
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Debug authentication step by step
 */
async function debugAuthentication(request, env, corsHeaders) {
  try {
    const debug_info = {
      step: 1,
      headers: {},
      validation: {}
    };

    // Step 1: Check headers
    debug_info.headers.authorization = request.headers.get('Authorization') || 'missing';
    debug_info.headers.client_id = request.headers.get('X-MCP-Client-ID') || 'missing';
    debug_info.step = 2;

    // Step 2: Validate header format
    const auth_header = request.headers.get('Authorization');
    debug_info.validation.has_bearer = auth_header && auth_header.startsWith('Bearer ');
    debug_info.step = 3;

    // Step 3: Validate MCP Client ID
    const mcp_client_id = request.headers.get('X-MCP-Client-ID');
    debug_info.validation.has_client_id = !!mcp_client_id;
    debug_info.validation.valid_client_id = mcp_client_id && mcp_client_id.includes('2100.cool');
    debug_info.step = 4;

    // Step 4: Extract JWT token
    if (auth_header && auth_header.startsWith('Bearer ')) {
      const jwt_token = auth_header.substring(7);
      debug_info.jwt = {
        length: jwt_token.length,
        parts: jwt_token.split('.').length,
        first_10_chars: jwt_token.substring(0, 10)
      };
      debug_info.step = 5;

      // Step 5: Try to decode JWT payload (without verification)
      try {
        const payload_base64 = jwt_token.split('.')[1];
        const payload = JSON.parse(atob(payload_base64));
        debug_info.jwt.payload = {
          iss: payload.iss,
          exp: payload.exp,
          current_time: Math.floor(Date.now() / 1000),
          expired: payload.exp < Math.floor(Date.now() / 1000),
          has_email: !!payload.email,
          has_role: !!payload.role,
          has_uuid: !!payload.uuid
        };
        debug_info.step = 6;
      } catch (decode_error) {
        debug_info.jwt.decode_error = decode_error.message;
      }
    }

    return new Response(JSON.stringify(debug_info, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      debug_error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Debug SallyPort OIDC connection
 */
async function debugSallyPortConnection(env, corsHeaders) {
  try {
    const debug_info = {
      sallyport_issuer: env.SALLYPORT_OIDC_ISSUER || 'missing'
    };

    if (!env.SALLYPORT_OIDC_ISSUER) {
      debug_info.error = 'SALLYPORT_OIDC_ISSUER environment variable not set';
      return new Response(JSON.stringify(debug_info), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try to fetch OIDC well-known configuration
    try {
      const wellknown_url = `${env.SALLYPORT_OIDC_ISSUER}/.well-known/openid_configuration`;
      debug_info.wellknown_url = wellknown_url;
            
      const response = await fetch(wellknown_url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
            
      debug_info.wellknown_response = {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      };

      if (response.ok) {
        const config = await response.json();
        debug_info.oidc_config = {
          issuer: config.issuer,
          jwks_uri: config.jwks_uri,
          supported_scopes: config.scopes_supported,
          supported_grant_types: config.grant_types_supported
        };
      } else {
        debug_info.wellknown_error = await response.text();
      }
    } catch (fetch_error) {
      debug_info.fetch_error = fetch_error.message;
    }

    // Try to fetch JWKS
    try {
      const jwks_url = `${env.SALLYPORT_OIDC_ISSUER}/.well-known/jwks.json`;
      debug_info.jwks_url = jwks_url;
            
      const jwks_response = await fetch(jwks_url);
      debug_info.jwks_response = {
        status: jwks_response.status,
        ok: jwks_response.ok
      };

      if (jwks_response.ok) {
        const jwks = await jwks_response.json();
        debug_info.jwks_keys = jwks.keys ? jwks.keys.length : 0;
      }
    } catch (jwks_error) {
      debug_info.jwks_error = jwks_error.message;
    }

    return new Response(JSON.stringify(debug_info, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      debug_error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Simplified authentication function for debugging
 */
async function authenticateDockerScoutRequest(request, env) {
  try {
    const auth_header = request.headers.get('Authorization');
    const mcp_client_id = request.headers.get('X-MCP-Client-ID');
        
    // Basic validation
    if (!auth_header || !auth_header.startsWith('Bearer ')) {
      return { 
        valid: false, 
        message: 'Missing or invalid Authorization header',
        debug: { auth_header: !!auth_header }
      };
    }

    if (!mcp_client_id || !mcp_client_id.includes('2100.cool')) {
      return { 
        valid: false, 
        message: 'Invalid MCP Client ID',
        debug: { mcp_client_id }
      };
    }

    const jwt_token = auth_header.substring(7);
        
    // For debugging, skip actual verification and return mock data
    const mock_user = {
      uuid: 'debug-user-uuid',
      email: 'debug@2100.cool',
      name: 'Debug User',
      role: 'diamond_sao',
      debug_mode: true
    };

    return {
      valid: true,
      user: mock_user,
      debug: {
        token_length: jwt_token.length,
        client_id: mcp_client_id
      }
    };

  } catch (error) {
    return { 
      valid: false, 
      message: `Authentication error: ${error.message}`,
      debug: { error: error.stack }
    };
  }
}
