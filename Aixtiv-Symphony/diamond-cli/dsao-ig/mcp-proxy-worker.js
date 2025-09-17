// MCP Proxy Worker - Routes mcp.aipub.2100.cool to Cloud Run interface
// Handles all requests to the MCP subdomain and proxies to the hosted owner interface

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Only handle MCP subdomain requests
    if (url.hostname !== 'mcp.aipub.2100.cool') {
      return new Response('Not Found', { status: 404 });
    }
    
    // Proxy to the updated mocoa service with all fixes
    const proxyUrl = `https://mocoa-859242575175.us-west1.run.app${url.pathname}${url.search}`;
    
    // Create modified request with updated URL
    const modifiedRequest = new Request(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body
    });
    
    try {
      const response = await fetch(modifiedRequest);
      
      // Pass through the response with CORS headers (PCP functions now integrated in source)
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'X-MCP-Proxy': 'active',
          'X-Target-Interface': 'mocoa-updated',
          'X-PCP-Status': 'integrated'
        }
      });
      
    } catch (error) {
      console.error('MCP Proxy error:', error);
      
      return new Response(JSON.stringify({
        error: 'MCP Proxy Error',
        message: 'Unable to reach owner interface',
        timestamp: new Date().toISOString(),
        target: 'mocoa-owner-interface-859242575175.us-west1.run.app'
      }), {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'X-MCP-Error': 'proxy-failed'
        }
      });
    }
  }
};
