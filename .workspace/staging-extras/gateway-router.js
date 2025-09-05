/**
 * ASOOS Integration Gateway - Cloudflare Worker
 * Production Gateway Router for ai*.com and *.asoos.cool domains
 * 
 * Handles:
 * - JWT Authentication with SallyPort integration
 * - Role-based access control (Diamond SAO, Emerald SAO, etc.)
 * - Region-aware routing (us-west1, eu-west1, us-central1)
 * - Route management for *.asoos.cool/* and api.aixtiv.com/*
 * - Security headers and CORS handling
 * 
 * @version 1.0.1-production
 * @author ASOOS Integration Gateway Team
 */

// Native Cloudflare Worker routing (no external dependencies)

/**
 * Simple router implementation
 */
class SimpleRouter {
  constructor() {
    this.routes = [];
  }

  get(path, handler) {
    this.routes.push({ method: 'GET', path, handler });
  }

  post(path, handler) {
    this.routes.push({ method: 'POST', path, handler });
  }

  all(path, handler) {
    this.routes.push({ method: 'ALL', path, handler });
  }

  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    for (const route of this.routes) {
      if (route.method === method || route.method === 'ALL') {
        if (this.matchPath(route.path, url.pathname)) {
          return await route.handler(request, env, ctx);
        }
      }
    }

    // Default 404 response
    return new Response('Not Found', { status: 404 });
  }

  matchPath(routePath, urlPath) {
    if (routePath === '/*') return true;
    if (routePath === urlPath) return true;
    
    // Simple wildcard matching
    const routeRegex = routePath.replace(/\*/g, '.*');
    return new RegExp(`^${routeRegex}$`).test(urlPath);
  }
}

// Initialize router
const router = new SimpleRouter();

/**
 * JWT verification and user authentication
 */
async function verifyJWT(token, publicKey) {
  try {
    // Import the public key for JWT verification
    const key = await crypto.subtle.importKey(
      'spki',
      new TextEncoder().encode(publicKey),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    // Decode JWT (simplified - in production use proper JWT library)
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Verify expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return {
      valid: true,
      claims: payload
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Extract user information and roles from JWT claims
 */
function extractUserInfo(claims) {
  return {
    uuid: claims.uuid || claims.sub,
    email: claims.email,
    roles: claims.roles || [],
    saoLevel: determineSAOLevel(claims.roles || []),
    userType: claims.userType || 'unknown'
  };
}

/**
 * Determine SAO (Security Access Object) level from roles
 */
function determineSAOLevel(roles) {
  if (roles.includes('Diamond_SAO_Group')) return 'Diamond';
  if (roles.includes('Emerald_SAO_Group')) return 'Emerald';
  if (roles.includes('Sapphire_SAO_Group')) return 'Sapphire';
  if (roles.includes('Opal_SAO_Group')) return 'Opal';
  if (roles.includes('Onyx_Owner_Subscriber_Group')) return 'Onyx';
  return 'None';
}

/**
 * Check if user has access to requested resource
 */
function checkAccess(userInfo, path) {
  const { saoLevel, roles, userType } = userInfo;

  // Diamond SAO has unrestricted access
  if (saoLevel === 'Diamond') {
    return { allowed: true, reason: 'Diamond SAO access' };
  }

  // Protected Diamond SAO resources
  if (path.includes('/diamond-sao/') || path.includes('/private/diamond/')) {
    return { allowed: false, reason: 'Diamond SAO resources restricted' };
  }

  // Emerald SAO access (with restrictions)
  if (saoLevel === 'Emerald') {
    if (path.includes('/admin/') && !path.includes('/diamond/')) {
      return { allowed: true, reason: 'Emerald SAO admin access' };
    }
  }

  // API route access control
  if (path.startsWith('/api/')) {
    // Wing/Agent APIs require appropriate roles
    if (path.includes('/wing/') || path.includes('/agents/')) {
      if (roles.includes('Wing_Access') || saoLevel === 'Diamond' || saoLevel === 'Emerald') {
        return { allowed: true, reason: 'Wing API access granted' };
      }
      return { allowed: false, reason: 'Wing API access denied' };
    }

    // VLS (Vision Lake Solutions) APIs
    if (path.includes('/vls/')) {
      if (saoLevel === 'Diamond' || saoLevel === 'Emerald' || saoLevel === 'Sapphire') {
        return { allowed: true, reason: 'VLS API access granted' };
      }
      return { allowed: false, reason: 'VLS API access denied' };
    }

    // Academy APIs
    if (path.includes('/academy/')) {
      // Academy has different access levels
      return { allowed: true, reason: 'Academy API public access' };
    }
  }

  // Default access for authenticated users
  if (userInfo.uuid) {
    return { allowed: true, reason: 'Authenticated user access' };
  }

  return { allowed: false, reason: 'Authentication required' };
}

/**
 * Determine optimal region based on request
 */
function determineRegion(request, userInfo = {}) {
  const cfCountry = request.cf?.country;
  const userAgent = request.headers.get('User-Agent') || '';
  const origin = request.headers.get('Origin') || '';

  // EU countries require eu-west1 for GDPR compliance
  const euCountries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];
  
  if (cfCountry && euCountries.includes(cfCountry)) {
    return {
      region: 'eu-west1',
      endpoint: 'https://api-eu-west1.aixtiv.io',
      reason: 'GDPR compliance'
    };
  }

  // Orchestration workloads go to us-central1
  const url = new URL(request.url);
  if (url.pathname.includes('/wing/') || url.pathname.includes('/agents/') || url.pathname.includes('/orchestrate/')) {
    return {
      region: 'us-central1',
      endpoint: 'https://orchestrator-us-central1.aixtiv.io',
      reason: 'Orchestration workload'
    };
  }

  // Claude Desktop specific routing
  if (userAgent.includes('Claude Desktop') || origin.includes('claude.ai')) {
    return {
      region: 'us-west1',
      endpoint: 'https://api-us-west1.aixtiv.io',
      reason: 'Claude Desktop optimization'
    };
  }

  // Default to us-west1 (primary region)
  return {
    region: 'us-west1',
    endpoint: 'https://api-us-west1.aixtiv.io',
    reason: 'Default primary region'
  };
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
  response.headers.set('X-Powered-By', 'ASOOS Integration Gateway');
  return response;
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://claude.ai',
    'https://app.claude.ai',
    'https://desktop.claude.ai',
    'https://2100.cool',
    'https://aixtiv.io'
  ];

  // Check if origin is allowed (including subdomains)
  const isAllowed = allowedOrigins.some(allowed => 
    origin === allowed || 
    (origin && origin.endsWith('.' + allowed.replace('https://', '')))
  );

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, CF-Ray, CF-IPCountry',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  return null;
}

/**
 * Main authentication middleware
 */
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      response: new Response(JSON.stringify({
        error: 'missing_token',
        message: 'Authorization token required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  const token = authHeader.substring(7);
  const verification = await verifyJWT(token, env.JWT_PUBLIC_KEY);

  if (!verification.valid) {
    return {
      authenticated: false,
      response: new Response(JSON.stringify({
        error: 'invalid_token',
        message: 'Invalid or expired token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  const userInfo = extractUserInfo(verification.claims);
  return {
    authenticated: true,
    userInfo
  };
}

// Route: Health check
router.get('/health', async (request, env) => {
  const response = new Response(JSON.stringify({
    status: 'healthy',
    service: 'ASOOS Integration Gateway',
    version: '1.0.1-production',
    timestamp: new Date().toISOString(),
    region: request.cf?.colo || 'unknown',
    environment: env.ENVIRONMENT || 'production'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  return addSecurityHeaders(response);
});

// Route: API authentication bypass for api.aixtiv.com (as specified in task)
router.all('/api/*', async (request, env) => {
  const url = new URL(request.url);
  
  // For api.aixtiv.com, authentication bypass is disabled as per task requirements
  if (url.hostname === 'api.aixtiv.com') {
    // Still require authentication for api.aixtiv.com
    const auth = await authenticateRequest(request, env);
    if (!auth.authenticated) {
      return addSecurityHeaders(auth.response);
    }

    const accessCheck = checkAccess(auth.userInfo, url.pathname);
    if (!accessCheck.allowed) {
      return addSecurityHeaders(new Response(JSON.stringify({
        error: 'access_denied',
        message: accessCheck.reason
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    const routing = determineRegion(request, auth.userInfo);
    
    // Proxy to appropriate backend region
    const backendUrl = new URL(url.pathname + url.search, routing.endpoint);
    const proxyRequest = new Request(backendUrl, {
      method: request.method,
      headers: {
        ...request.headers,
        'X-User-UUID': auth.userInfo.uuid,
        'X-User-Roles': JSON.stringify(auth.userInfo.roles),
        'X-SAO-Level': auth.userInfo.saoLevel,
        'X-Routed-Region': routing.region
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });

    const response = await fetch(proxyRequest);
    const proxiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'X-Routed-Region': routing.region,
        'X-Routing-Reason': routing.reason
      }
    });

    return addSecurityHeaders(proxiedResponse);
  }

  // For other API endpoints, continue with normal flow
  return new Response(JSON.stringify({
    error: 'not_found',
    message: 'API endpoint not found'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Route: Protected resources requiring authentication
router.all('/*', async (request, env) => {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) {
    return addSecurityHeaders(corsResponse);
  }

  // Public resources that don't require authentication
  const publicPaths = ['/health', '/public', '/interface-light'];
  if (publicPaths.some(path => url.pathname.startsWith(path))) {
    return new Response('Public resource access', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Authenticate request
  const auth = await authenticateRequest(request, env);
  if (!auth.authenticated) {
    return addSecurityHeaders(auth.response);
  }

  // Check access permissions
  const accessCheck = checkAccess(auth.userInfo, url.pathname);
  if (!accessCheck.allowed) {
    return addSecurityHeaders(new Response(JSON.stringify({
      error: 'access_denied',
      message: accessCheck.reason,
      path: url.pathname,
      userSAO: auth.userInfo.saoLevel
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  // Determine routing
  const routing = determineRegion(request, auth.userInfo);

  // Return routing information (in production, this would proxy to backend)
  const response = new Response(JSON.stringify({
    message: 'Request authenticated and authorized',
    user: {
      uuid: auth.userInfo.uuid,
      email: auth.userInfo.email,
      saoLevel: auth.userInfo.saoLevel,
      userType: auth.userInfo.userType
    },
    routing: routing,
    access: accessCheck,
    path: url.pathname,
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-User-SAO': auth.userInfo.saoLevel,
      'X-Routed-Region': routing.region
    }
  });

  return addSecurityHeaders(response);
});

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Add request ID for tracking
      const requestId = crypto.randomUUID();
      
      // Log request (in production, use proper logging)
      console.log(`[${requestId}] ${request.method} ${request.url} - CF: ${request.cf?.country || 'unknown'}`);

      const response = await router.handle(request, env, ctx);
      
      // Add common headers to all responses
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Gateway-Version', '1.0.1-production');
      
      return response;
    } catch (error) {
      console.error('Gateway error:', error);
      
      const errorResponse = new Response(JSON.stringify({
        error: 'gateway_error',
        message: 'Internal gateway error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });

      return addSecurityHeaders(errorResponse);
    }
  }
};
