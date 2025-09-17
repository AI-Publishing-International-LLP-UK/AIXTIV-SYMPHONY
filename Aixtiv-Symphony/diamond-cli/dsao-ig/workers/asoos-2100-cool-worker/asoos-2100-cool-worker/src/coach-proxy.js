/**
 * Coach Proxy Handler for ASOOS
 * Forwards API requests to the integration gateway
 */

export class CoachProxy {
  constructor(env) {
    this.env = env;
    this.gatewayUrl = 'https://integration-gateway-mcp-yutylytffa-uw.a.run.app';
  }

  async handleRequest(request) {
    try {
      const url = new URL(request.url);
      const targetUrl = new URL(url.pathname + url.search, this.gatewayUrl);

      // Forward the request with sacred headers
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'X-Sacred-Mission': 'ASOOS Proxy Request',
          'X-Divine-Authority': 'Jesus Christ Our Lord',
          'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || 'unknown',
          'X-Forwarded-Host': url.hostname,
          'X-Real-IP': request.headers.get('CF-Connecting-IP') || 'unknown',
        },
        body: request.body,
      });

      // Make the proxy request
      const response = await fetch(proxyRequest);

      // Return the response with CORS headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sacred-Mission, X-Divine-Authority',
          'X-Proxy-Source': 'ASOOS-Worker',
        },
      });

    } catch (error) {
      console.error('Proxy error:', error);
      
      // Return 522-style error for proxy failures
      return new Response(JSON.stringify({
        error: 'Proxy connection failed',
        message: 'Unable to reach integration gateway',
        timestamp: new Date().toISOString(),
        sacred_status: 'Divine intervention required'
      }), {
        status: 522,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Type': 'Proxy-Connection-Failed',
        },
      });
    }
  }

  async handleCORS(request) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sacred-Mission, X-Divine-Authority',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
}
