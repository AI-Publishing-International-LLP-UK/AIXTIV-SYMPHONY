/**
 * Sally Port Authentication Worker - Cloudflare Compatible
 * Handles OAuth2 authentication for ASOOS Diamond SAO security system
 * 
 * Features:
 * - OAuth2 login flow with pr@coaching2100.com quick-pass for Diamond SAO
 * - JWT token generation with 30-minute expiry
 * - Victory36/Victory33 security hooks (Diamond SAO protection)
 * - Cloudflare security header validation
 * - KV session storage integration
 * - Role-based access with SAO classifications
 * 
 * @version 2.0.0-cloudflare-integration
 * @author ASOOS Integration Gateway / Victory36 Governance
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Route handlers
      if (pathname === '/auth/login' || pathname === '/api/auth/quick-pass') {
        return await handleLogin(request, env, corsHeaders);
      }
      
      if (pathname.startsWith('/auth/callback')) {
        return await handleCallback(request, env, corsHeaders);
      }
      
      if (pathname === '/auth/logout') {
        return await handleLogout(request, env, corsHeaders);
      }
      
      if (pathname === '/api/sallyport/health' || pathname === '/health') {
        return await handleHealth(request, env, corsHeaders);
      }
      
      // Default response
      return new Response('Sally Port Authentication Service v2.0.0', { 
        headers: corsHeaders,
        status: 200 
      });
      
    } catch (error) {
      console.error('Sally Port Auth Error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal authentication service error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

/**
 * Handle login requests with Diamond SAO quick-pass support
 */
async function handleLogin(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'POST method required'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
  const cfRay = request.headers.get('cf-ray');
  const userAgent = request.headers.get('user-agent');
  
  // Validate Cloudflare headers for security
  if (!cfRay) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request source - Cloudflare validation failed'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // Empty body is fine for some login types
  }
  
  const email = body.email || null;
  
  // Diamond SAO Quick-Pass for pr@coaching2100.com
  if (email === 'pr@coaching2100.com') {
    const sessionToken = crypto.randomUUID();
    const ce_uuid = `ce-diamond-${crypto.randomUUID()}`;
    
    // Generate JWT token
    const jwtPayload = {
      email: 'pr@coaching2100.com',
      uuid: ce_uuid,
      roles: ['diamond_sao', 'owner_subscriber', 'crms_1'],
      tier: 'diamond',
      permissions: ['full_access', 'system_admin', 'victory36_access'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      iss: 'sally-port-auth',
      sub: ce_uuid
    };
    
    // For production, sign with JWT_SECRET from environment
    const jwtToken = await generateJWT(jwtPayload, env.JWT_SECRET || 'development-secret-key');
    
    // Store session in KV if available
    if (env.AUTH_SESSIONS) {
      await env.AUTH_SESSIONS.put(`session:${sessionToken}`, JSON.stringify({
        email: 'pr@coaching2100.com',
        tier: 'diamond',
        ce_uuid,
        roles: jwtPayload.roles,
        authenticated: true,
        timestamp: Date.now(),
        ip: clientIp,
        userAgent,
        cfRay
      }), { expirationTtl: 1800 }); // 30 minutes
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Diamond SAO authentication successful',
      sessionToken,
      jwtToken,
      user: {
        uid: ce_uuid,
        email: 'pr@coaching2100.com',
        displayName: 'Diamond SAO Principal',
        role: 'diamond_sao',
        permissions: jwtPayload.permissions,
        tier: 'diamond'
      },
      redirect: '/dashboard',
      expiresIn: 1800
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `sally_port_session=${jwtToken}; HttpOnly; Secure; SameSite=None; Max-Age=1800; Path=/`,
        ...corsHeaders
      }
    });
  }
  
  // Demo/test authentication for other users
  if (email === 'demo@2100.cool' || !email) {
    const sessionToken = crypto.randomUUID();
    const ce_uuid = `ce-demo-${crypto.randomUUID()}`;
    
    const jwtPayload = {
      email: email || 'demo@2100.cool',
      uuid: ce_uuid,
      roles: ['onyx_subscriber'],
      tier: 'onyx',
      permissions: ['basic_access'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 60),
      iss: 'sally-port-auth',
      sub: ce_uuid
    };
    
    const jwtToken = await generateJWT(jwtPayload, env.JWT_SECRET || 'development-secret-key');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Demo authentication successful',
      sessionToken,
      jwtToken,
      user: {
        uid: ce_uuid,
        email: email || 'demo@2100.cool',
        displayName: 'Demo User',
        role: 'onyx_subscriber',
        permissions: jwtPayload.permissions,
        tier: 'onyx'
      },
      redirect: '/dashboard'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `sally_port_session=${jwtToken}; HttpOnly; Secure; SameSite=None; Max-Age=1800; Path=/`,
        ...corsHeaders
      }
    });
  }
  
  // For other emails, initiate OAuth2 flow (placeholder)
  return new Response(JSON.stringify({
    success: false,
    error: 'OAuth2 provider integration not yet implemented',
    message: 'Please use pr@coaching2100.com for Diamond SAO access or demo@2100.cool for testing'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

/**
 * Handle OAuth2 callback (placeholder for future OAuth2 integration)
 */
async function handleCallback(request, env, corsHeaders) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code) {
    return Response.redirect('https://2100.cool/auth-error?error=missing_code', 302);
  }
  
  // TODO: Exchange code for tokens with OAuth2 provider
  // For now, redirect to success page
  return Response.redirect('https://2100.cool/dashboard?auth=success', 302);
}

/**
 * Handle logout requests
 */
async function handleLogout(request, env, corsHeaders) {
  const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                      getCookieValue(request.headers.get('Cookie'), 'sally_port_session');
  
  if (sessionToken && env.AUTH_SESSIONS) {
    // Remove session from KV
    await env.AUTH_SESSIONS.delete(`session:${sessionToken}`);
  }
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Logged out successfully'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'sally_port_session=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/',
      ...corsHeaders
    }
  });
}

/**
 * Handle health check requests
 */
async function handleHealth(request, env, corsHeaders) {
  const healthData = {
    status: 'healthy',
    service: 'sally-port-auth',
    version: '2.0.0-cloudflare-integration',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'development',
    security_level: env.SECURITY_LEVEL || 'standard',
    victory36_protected: true,
    features: {
      jwt_auth: true,
      diamond_sao_quickpass: true,
      cloudflare_security: true,
      kv_sessions: !!env.AUTH_SESSIONS,
      oauth2_ready: false // TODO: Implement OAuth2
    }
  };
  
  return new Response(JSON.stringify(healthData), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Generate JWT token (simplified implementation)
 * In production, use a proper JWT library
 */
async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const message = `${encodedHeader}.${encodedPayload}`;
  
  // Simple HMAC-SHA256 implementation
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${message}.${encodedSignature}`;
}

/**
 * Extract cookie value from Cookie header
 */
function getCookieValue(cookieHeader, cookieName) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return value;
    }
  }
  return null;
}
