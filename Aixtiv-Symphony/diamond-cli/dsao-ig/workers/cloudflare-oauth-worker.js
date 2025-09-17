/**
 * ASOOS Cloudflare OAuth Worker
 * Handles Cloudflare API operations with OAuth authentication
 * Part of ASOOS Cloudflare-first architecture
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Authenticate request
      if (!await authenticateRequest(request, env)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }

      // Route handlers
      if (pathname.startsWith('/cloudflare/zones')) {
        return await handleZones(request, env);
      } else if (pathname.startsWith('/cloudflare/dns')) {
        return await handleDNS(request, env);
      } else if (pathname.startsWith('/cloudflare/workers')) {
        return await handleWorkers(request, env);
      } else if (pathname.startsWith('/cloudflare/kv')) {
        return await handleKV(request, env);
      } else if (pathname.startsWith('/cloudflare/d1')) {
        return await handleD1(request, env);
      } else {
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }

    } catch (error) {
      console.error('Cloudflare OAuth Worker Error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: error.message 
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
  }
};

/**
 * Authenticate incoming requests
 */
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');
  
  // Check for API key or Bearer token
  if (!authHeader && !apiKey) {
    return false;
  }

  // Verify API key if provided
  if (apiKey && env.API_KEY && apiKey === env.API_KEY) {
    return true;
  }

  // Verify Bearer token if provided
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Add your token validation logic here
    return token === env.BEARER_TOKEN;
  }

  return false;
}

/**
 * Handle Cloudflare Zones API
 */
async function handleZones(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  if (request.method === 'GET' && pathname === '/cloudflare/zones') {
    return await listZones(env);
  }
  
  return new Response(
    JSON.stringify({ error: 'Zone endpoint not implemented' }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle Cloudflare DNS API
 */
async function handleDNS(request, env) {
  return new Response(
    JSON.stringify({ error: 'DNS endpoint not implemented' }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle Cloudflare Workers API
 */
async function handleWorkers(request, env) {
  return new Response(
    JSON.stringify({ error: 'Workers endpoint not implemented' }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle Cloudflare KV API
 */
async function handleKV(request, env) {
  return new Response(
    JSON.stringify({ error: 'KV endpoint not implemented' }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle Cloudflare D1 API
 */
async function handleD1(request, env) {
  return new Response(
    JSON.stringify({ error: 'D1 endpoint not implemented' }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * List Cloudflare Zones using OAuth token
 */
async function listZones(env) {
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/zones', {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_OAUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Cloudflare API Error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch zones',
        message: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
