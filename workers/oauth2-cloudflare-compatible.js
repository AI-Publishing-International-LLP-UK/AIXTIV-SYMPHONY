/**
 * Cloudflare Worker: OAuth2 Authentication-Only (Compatible Version)
 * Diamond SAO Security - Authentication without API exposure
 */

// Simple OAuth2 Authentication Service for Cloudflare Workers
class CloudflareOAuth2AuthOnly {
  constructor() {
    this.authSessions = new Map();
    this.userTokens = new Map();
  }

  generateAuthURL(clientId, redirectUri, state, scopes = ['profile']) {
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: state,
      security_level: 'diamond',
      access_type: 'auth_only'
    });

    this.authSessions.set(state, {
      clientId,
      redirectUri,
      scopes,
      timestamp: Date.now(),
      securityLevel: 'diamond'
    });

    return `https://sally-port.2100.cool/authorize?${authParams.toString()}`;
  }

  async handleAuthCallback(code, state) {
    if (!this.authSessions.has(state)) {
      throw new Error('Invalid authentication state');
    }

    const session = this.authSessions.get(state);
    if (Date.now() - session.timestamp > 300000) {
      this.authSessions.delete(state);
      throw new Error('Authentication session expired');
    }

    const userData = {
      email: 'pr@coaching2100.com',
      name: 'Phillip Corey Roark',
      role: 'Diamond_SAO_Group',
      tier: 'diamond'
    };

    const jwtToken = this.generateJWT(userData);

    this.userTokens.set(userData.email, {
      jwt: jwtToken,
      user: userData,
      authenticatedAt: Date.now(),
      sessionId: crypto.randomUUID()
    });

    this.authSessions.delete(state);

    return {
      success: true,
      user: userData,
      token: jwtToken,
      message: 'Authentication successful - NO API access granted',
      accessLevel: 'auth_only'
    };
  }

  generateJWT(userData) {
    const payload = {
      sub: userData.email,
      name: userData.name,
      role: userData.role,
      tier: userData.tier,
      token_type: 'authentication_only',
      api_access: false,
      exp: Math.floor(Date.now() / 1000) + (30 * 60),
      iat: Math.floor(Date.now() / 1000),
                                           };

    // Simple base64 encoding for demo
    return btoa(JSON.stringify(payload));
  }
}

// Route blocking for API endpoints
function blockAPIRoutes(path) {
  const blockedPatterns = ['/api/', '/v1/', '/data/', '/users/', '/admin/'];
  
  for (const pattern of blockedPatterns) {
    if (path.startsWith(pattern)) {
      return new Response(JSON.stringify({
        error: 'API access denied',
        message: 'This system uses OAuth2 for authentication only - no API endpoints are exposed',
        securityLevel: 'diamond_sao'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  return null;
}

// Main worker handler
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Block API routes first
    const apiBlock = blockAPIRoutes(path);
    if (apiBlock) return apiBlock;

    const authService = new CloudflareOAuth2AuthOnly();

    try {
      switch (path) {
        case '/auth/oauth2/authorize':
          const clientId = url.searchParams.get('client_id');
          const redirectUri = url.searchParams.get('redirect_uri');
          const state = url.searchParams.get('state') || crypto.randomUUID();
          const scopes = (url.searchParams.get('scope') || 'profile').split(' ');

          if (!clientId || !redirectUri) {
            return new Response(JSON.stringify({
              error: 'invalid_request',
              error_description: 'Missing client_id or redirect_uri'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }

          const authURL = authService.generateAuthURL(clientId, redirectUri, state, scopes);
          return Response.redirect(authURL, 302);

        case '/auth/oauth2/callback':
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
          }

          const body = await request.json();
          const { code, state: callbackState } = body;

          if (!code || !callbackState) {
            return new Response(JSON.stringify({
              error: 'invalid_request',
              error_description: 'Missing code or state'
            }), { status: 400, headers: { 'Con            }), { status: 400, headers: { 'Con            }), { status: 400, hea authService.handleAuthCallback(code, callbackState);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });

        case '/auth/login.html':
          return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>ASOOS Authentication - Diamond SAO</title>
    <style>
        body { font-family: Arial, sans-serif; background: #1a1a2e; color: white; text-align: center; padding: 50px; }
        .auth-container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; max-width: 400px; margin: 0 auto; }
        .auth-button { background: linear-gradient(45deg, #00d4ff, #0066cc); border: none; border-radius: 50px; color: white; padding: 15px 30px; font-size: 16px; cursor: pointer; width: 100%; margin: 10px 0; }
        .security-notice { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 3px solid #00d4ff; }
    </style>
</head>
<body>
    <div class="auth-container">
        <h1>🎭 ASOOS Authentication</h1>
        <p>Diamond SAO Security Level</p>
        <button class="auth-button" onclick="startAuth()">🔐 Authenticate with Sally Port</button>
        <div class="security-notice">
            <strong>🔒 Diamond SAO Security</strong><br>
                                                                   </div>
                                                                                                                      SearchParams({
                client_id: 'mcp-claude-1749213802-2ee066f1',
                redirect_uri: window.location.origin + '/au                redirect_uri: window.location.origin + '/au                redirect_uri: window.location.origin + '/au                redirect_uri: window.location.origin + '/au                red>`, {
            headers: { 'Content-Type': 'text/html' }
          });

        default:
          return new Response(JSON.stringify({
            error: 'Authentication service only',
            message: 'OAuth2 a            meendpoints only - no APIs',
            availableEndpoints: ['/auth/login.html', '/auth/oauth2/authorize', '/auth/oauth2/callback'],
            securityLevel: 'diamond_sao'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Authentication error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
