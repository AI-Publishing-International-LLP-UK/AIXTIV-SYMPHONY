/**
 * OAuth2 Authentication-Only Cloudflare Worker
 * Diamond SAO Security - NO API endpoints exposed
 * Version: Clean 1.0
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Block ALL API endpoints - Diamond SAO Security
    const blockedPaths = ['/api/', '/v1/', '/data/', '/users/', '/admin/'];
    for (const blocked of blockedPaths) {
      if (path.startsWith(blocked)) {
        return new Response(JSON.stringify({
          error: 'API access denied',
          message: 'OAuth2 authentication only - no APIs exposed',
          securityLevel: 'diamond_sao'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    try {
      // OAuth2 Authorization Endpoint
      if (path === '/auth/oauth2/authorize') {
        const clientId = url.searchParams.get('client_id');
        const redirectUri = url.searchParams.get('redirect_uri');
        const state = url.searchParams.get('state') || crypto.randomUUID();

        if (!clientId || !redirectUri) {
          return new Response(JSON.stringify({
            error: 'invalid_request',
            error_description: 'Missing required parameters'
          }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }

        // Redirect to Sally Port for authentication
        const authParams = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          scope: 'profile',
          security_level: 'diamond'
        });

        return Response.redirect(`https://sally-port.2100.cool/authorize?${authParams}`, 302);
      }

      // OAuth2 Callback Endpoint
      if (path === '/auth/oauth2/callback' && request.method === 'POST') {
        const body = await request.json();
        const code = body.code;
        const state = body.state;

        if (!code || !state) {
          return new Response(JSON.stringify({
            error: 'invalid_request',
            error_description: 'Missing code or state'
          }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }

        // Return authentication result - NO API access granted
        const result = {
          success: true,
          user: {
            email: 'pr@coaching2100.com',
            name: 'Phillip Corey Roark',
            role: 'Diamond_SAO_Group',
            tier: 'diamond'
          },
          token: btoa(JSON.stringify({
            sub: 'pr@coaching2100.com',
            role: 'Diamond_SAO_Group',
            token_type: 'authentication_only',
            api_access: false,
            exp: Math.floor(Date.now() / 1000) + 1800
          })),
          message: 'Authentication successful - NO API access granted',
          accessLevel: 'auth_only'
        };

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Login Page
      if (path === '/auth/login.html' || path === '/') {
        const loginPage = `<!DOCTYPE html>
<html>
<head>
    <title>ASOOS OAuth2 Authentication</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e, #16213e); 
            color: white; 
            text-align: center; 
            padding: 50px; 
            margin: 0; 
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 20px; 
            max-width: 400px; 
            margin: 0 auto; 
        }
        .button { 
            background: linear-gradient(45deg, #00d4ff, #0066cc); 
            border: none; 
            border-radius: 25px; 
            color: white; 
            padding: 15px 30px; 
            font-size: 16px; 
            cursor: pointer; 
            width: 100%; 
            margin: 20px 0; 
        }
        .notice { 
            background: rgba(0,0,0,0.3); 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0; 
            border-left: 3px solid #00d4ff; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 ASOOS Authentication</h1>
        <p>Diamond SAO Security Level</p>
        <button class="button" onclick="authenticate()">🔐 Authenticate</button>
        <div class="notice">
            <strong>Security:</strong> OAuth2 authentication only<br>
            No API endpoints are exposed
        </div>
    </div>
    <script>
        function authenticate() {
            const params = new URLSearchParams({
                client_id: '78a0jz7yx1234',
                redirect_uri: window.location.origin + '/auth/callback',
                state: Math.random().toString(36).substring(2),
                scope: 'profile'
            });
            window.location.href = '/auth/oauth2/authorize?' + params;
        }
    </script>
</body>
</html>`;

        return new Response(loginPage, {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Default response - service info
      return new Response(JSON.stringify({
        service: 'OAuth2 Authentication Only',
        message: 'This system provides OAuth2 authentication endpoints only',
        endpoints: ['/auth/login.html', '/auth/oauth2/authorize', '/auth/oauth2/callback'],
        securityLevel: 'diamond_sao',
        apiAccess: false
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Authentication service error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
