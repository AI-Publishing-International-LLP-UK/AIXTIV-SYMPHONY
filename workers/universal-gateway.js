/**
 * ASOOS Universal Gateway - OAuth2 ChatGPT Integration
 * Routes requests between main site, authentication, and ASOOS infrastructure
 * Deployed on Cloudflare Workers for asoos.2100.cool
 * 
 * Implements OpenAPI 3.1.0 specification for OAuth2-enabled universal connection
 * to AIXTIV SYMPHONY ORCHESTRATING OPERATING SYSTEM (ASOOS)
 */

// Import handlers
import { handleMainSite } from './asoos-main-site.js';
import { handleAuth } from './sally-port-auth.js';

// ASOOS Infrastructure Endpoints
const INFRASTRUCTURE_ENDPOINTS = {
  integration_gateway: 'https://integration-gateway.pr-aef.workers.dev',
  vision_lake: 'https://vision-lake.mocorix2-us-central1.com',
  aixtiv_symphony: 'https://aixtiv-symphony.mocorix-us-west1-c.com',
  mocorix2_cluster: 'https://mocorix2-cluster.us-central1.com',
  sallyport_security: 'https://sallyport.asoos.2100.cool',
  data_sync_adapter: 'https://data-sync.mocoa-us-west1.com',
  agent_coordination: 'https://agent-coord.mocorix2-us-central1.com',
  performance_monitor: 'https://perf-mon.mocoa-us-west1.com',
  security_scanner: 'https://sec-scan.sallyport.2100.cool',
  learning_coordinator: 'https://learning.mocorix-us-west1-c.com',
  emergency_protocols: 'https://emergency.victory36.mocorix2.com',
  backup_systems: 'https://backup.mocoswarm.distributed.com'
};

// OAuth2 Configuration
const OAUTH2_CONFIG = {
  authorizationUrl: 'https://integration-gateway.pr-aef.workers.dev/oauth2/authorize',
  tokenUrl: 'https://integration-gateway.pr-aef.workers.dev/oauth2/token',
  scopes: {
    'gateway:access': 'Access gateway functions',
    'pilot:orchestrate': 'Orchestrate pilot operations',
    'system:execute': 'Execute system operations',
    'emergency:response': 'Emergency response capabilities'
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Log the request for debugging
    console.log(`Universal Gateway OAuth2: ${method} ${path}`);
    
    try {
      // OAuth2 Universal Connection API
      if (path === '/api/v3/oauth2-universal-connect' && method === 'POST') {
        return await handleOAuth2UniversalConnect(request, env, ctx);
      }
      
      // OAuth2 Bulk Operations API
      if (path === '/api/v3/oauth2-bulk-operations' && method === 'POST') {
        return await handleOAuth2BulkOperations(request, env, ctx);
      }
      
      // OAuth2 Status API
      if (path === '/api/v3/oauth2-status' && method === 'GET') {
        return await handleOAuth2Status(request, env, ctx);
      }
      
      // OAuth2 Gateway Health API
      if (path === '/api/v3/oauth2-gateway-health' && method === 'GET') {
        return await handleOAuth2GatewayHealth(request, env, ctx);
      }
      
      // OAuth2 Emergency Auth API
      if (path === '/api/v3/oauth2-emergency-auth' && method === 'POST') {
        return await handleOAuth2EmergencyAuth(request, env, ctx);
      }
      
      // Route authentication requests
      if (path.startsWith('/auth/') || path.startsWith('/api/auth/')) {
        console.log('Routing to authentication handler');
        return await handleAuth(request, env, ctx);
      }
      
      // Route API requests to OAuth2 handlers or main site
      if (path.startsWith('/api/v3/')) {
        console.log('OAuth2 API endpoint not found');
        return new Response(JSON.stringify({ error: 'OAuth2 API endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Route other API requests to main site handler  
      if (path.startsWith('/api/')) {
        console.log('Routing to API handler (main site)');
        return await handleMainSite(request, env, ctx);
      }
      
      // All other requests go to main site
      console.log('Routing to main site handler');
      return await handleMainSite(request, env, ctx);
      
    } catch (error) {
      console.error('Universal Gateway Error:', error);
      
      // Return a generic error page
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Service Temporarily Unavailable</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            .error { color: #666; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="logo">ASOOS</div>
          <h1>Service Temporarily Unavailable</h1>
          <p class="error">We're experiencing technical difficulties. Please try again in a few moments.</p>
          <p class="error">Error ID: ${Date.now()}</p>
        </body>
        </html>
        `,
        { 
          status: 503,
          headers: { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }
  }
};

// Export individual handlers for testing/debugging
export { handleMainSite, handleAuth };
