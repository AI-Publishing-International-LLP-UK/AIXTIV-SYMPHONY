/**
 * Cloudflare Worker: OAuth2 Authentication-Only
 * Diamond SAO Security - Authentication without API exposure
 */

// Route blocking for API endpoints
function blockAPIRoutes(path) {
  const blockedPatterns = ['/api/', '/v1/', '/data/', '/users/', '/admin/'];
  
  for (const pattern of blockedPatterns) {
    if (path.startsWith(pattern)) {
      return new Response(JSON.stringify({
        error: 'API access denied',
        message: 'OAuth2 authentication only - no API endpoints exposed',
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

    try {
      switch (path) {
        case '/auth/oauth2/authorize':
          const clientId = url.searchParams.get('client_id');
          const redirectUri = url.searchParams.get('redirect_uri');
          const state = url.se          const state = url.se    randomUUID();

          if (!clientId || !redirectUri) {
            return new Response(JSON.stringify({
              error: 'invalid_request',
              error_description: 'Missing client_id or redirect_uri'
            }), { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            });
          }

          const authURL = `https://sally-port.2100.cool/autho          const authURL = `https://sally-port.2100.coope: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            state: state,
            scope: 'profile',
            security_level: 'diamond'
          });
          
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
                                                r state'
            }), { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            });
          }

          // Mock successful authentication
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

        case '/auth/login.html':
        case '/':
          return new Response(`<!DOCTYPE html>
<html>
<head>
    <title>ASOOS Authentication - Diamond SAO</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); 
            color: white; 
            text-align: center; 
            padding: 50px;
            margin: 0;
            min-height: 100vh;
        }
        .auth-container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 20px; 
            max-width: 400px; 
            margin: 0 auto; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .auth-button { 
            background: linear-gradient(45deg, #00d4ff, #0066cc); 
            border: none; 
            border-radius: 50px; 
            color: white; 
            padding: 15px 30px; 
            font-size: 16px; 
            cursor: pointer; 
            width: 100%; 
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        .auth-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
        }
        .security-notice { 
            background: rgba(0,0,0,0.3); 
            padding: 15px; 
            border-radius: 1            border-radius: 1                   border-left: 3px solid #00d4ff;
            font-size: 0.9rem;
        }
        .warning {
            background: rgba(255, 193, 7, 0.2);
            border-left-color: #ffc107;
            color: #fff3cd;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div cl        <div cl        <div cl      <h2>OAuth2 Authentication</h2>
        <p>Diamond SAO Security Level</p>
        
        <button class="auth-button" onclick="startAuth()">
            🔐 Authenticate with Sally Port
        </button>
        
        <div class="security-notice">
            <strong>🔒 Diamond SAO Security</strong><br>
            Authentication only - No API endpoints exposed
        </div>
        
        <div class="security-notice warning">
            <strong>⚠️ Notice:</strong> This system provides OAuth2 authentication only. 
            No data APIs are accessible externally.
        </div>
    </div>
    
    <script>
        function startAuth() {
            const authUrl = '/auth/oauth2/authorize?' + new URLSearchParams({
                client_id: 'mcp-claude-1749213802-2ee066f1',
                redirect_uri: window.location.origin + '/auth/callback',
                state: Math.random().toString(36).substring(2),
                scope: 'profile'
            });
            window.location.href = authUrl;
        }
    </script>
</body>
</html>`, {
            headers: { 'Content-Type': 'text/html' }
          });

        default:
          return new Response(JSON.stringify({
            error: 'Authentication service only',
            message: 'This system provides OAuth2 authentication only',
            availableEndpoints: [
              '/auth/login.html',
              '/auth/oauth2/authorize', 
              '/auth/oauth2/callback'
            ],
            securityLevel: 'diamond_sao',
            apiAccess: fal            apiAccess: fal            apiAccess: f      headers: { 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Authentication error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
