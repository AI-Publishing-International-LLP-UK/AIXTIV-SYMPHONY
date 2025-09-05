/**
 * Cloudflare Worker: OAuth2 Authentication-Only (No API Exposure)
 * 
 * This worker handles ONLY OAuth2 authentication flows.
 * Zero API endpoints are exposed - perfect for Diamond SAO security.
 * 
 * Features:
 * - OAuth2 authorization flow initiation
 * - OAuth2 callback handling  
 * - JWT token generation for authenticated users
 * - NO data APIs exposed
 * - NO user CRUD operations
 * - NO admin endpoints
 * 
 * Security: Diamond SAO level - authentication only, no data access
 */

import { OAuth2AuthOnlyService, enforceAuthOnlyRouting } from './config/oauth2-auth-only.js';

// Initialize the authentication service
const authService = new OAuth2AuthOnlyService();

/**
 * Main Cloudflare Worker handler
 * Enforces OAuth2-auth-only policy
 */
export default {
  async fetch(request, env, ctx) {
    // Initialize auth service
    await authService.initialize();

    // First, enforce route security - block any API endpoints
    const securityCheck = enforceAuthOnlyRouting(request);
    if (securityCheck) {
      return securityCheck; // Return 403 or 404 for blocked routes
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Handle OAuth2 authentication routes ONLY
      switch (path) {
        case '/auth/oauth2/authorize':
          return handleAuthorizationRequest(request, url);
          
        case '/auth/oauth2/callback':
          return handleAuthCallback(request);
          
        case '/auth/logout':
          return handleLogout(request);
          
        case '/auth/login.html':
          return serveLoginPage();
          
        case '/auth/callback.html':
          return serveCallbackPage();
          
        case '/auth/status':
          return handleAuthStatus(request);
          
        default:
          // All other routes are blocked
          return new Response(
            JSON.stringify({
              error: 'Authentication service only',
              message: 'This system provides OAuth2 authentication only',
              availableEndpoints: [
                '/auth/oauth2/authorize',
                '/auth/oauth2/callback', 
                '/auth/logout',
                '/auth/login.html'
              ],
              securityLevel: 'diamond_sao',
              apiAccess: false
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            }
          );
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Authentication error',
          message: error.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

/**
 * Handle OAuth2 authorization request (Step 1)
 * Generates authorization URL and redirects user
 */
async function handleAuthorizationRequest(request, url) {
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state') || crypto.randomUUID();
  const scopes = (url.searchParams.get('scope') || 'profile').split(' ');

  if (!clientId || !redirectUri) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Missing required parameters: client_id, redirect_uri'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Generate authorization URL
  const authURL = authService.generateAuthorizationURL(
    clientId,
    redirectUri,
    state,
    scopes
  );

  // Redirect to Sally Port for authentication
  return Response.redirect(authURL, 302);
}

/**
 * Handle OAuth2 callback (Step 2)
 * Processes authorization code and returns JWT token
 */
async function handleAuthCallback(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await request.json();
  const { code, state } = body;

  if (!code || !state) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Missing authorization code or state'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Process the OAuth2 callback
    const result = await authService.handleAuthCallback(code, state);
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          tier: result.user.tier
        },
        token: result.token,
        message: result.message,
        accessLevel: result.accessLevel,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'authentication_failed',
        error_description: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle user logout
 * Removes authentication state
 */
async function handleLogout(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await request.json();
  const { email } = body;

  if (!email) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Email required for logout'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const result = await authService.logoutUser(email);
  
  return new Response(
    JSON.stringify({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Handle authentication status check
 * Returns user authentication status (internal use)
 */
async function handleAuthStatus(request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Email parameter required'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const authStatus = await authService.verifyUserAuthentication(email);
  
  return new Response(
    JSON.stringify({
      authenticated: authStatus.authenticated,
      ...(authStatus.authenticated && {
        sessionId: authStatus.sessionId,
        authenticatedAt: authStatus.authenticatedAt,
        user: {
          email: authStatus.user.email,
          name: authStatus.user.name,
          role: authStatus.user.role,
          tier: authStatus.user.tier
        }
      }),
      ...(authStatus.reason && { reason: authStatus.reason }),
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  );
}

/**
 * Serve login page
 * Simple HTML page for OAuth2 login initiation
 */
function serveLoginPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASOOS Authentication - Diamond SAO</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: white;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .auth-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem;
            max-width: 400px;
            width: 100%;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            background: linear-gradient(45deg, #00d4ff, #ffb347);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: #cccccc;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }
        .auth-button {
            background: linear-gradient(45deg, #00d4ff, #0066cc);
            border: none;
            border-radius: 50px;
            color: white;
            padding: 1rem 2rem;
            font-size: 1rem;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
            margin-bottom: 1rem;
        }
        .auth-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
        }
        .security-notice {
            font-size: 0.8rem;
            color: #999;
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            border-left: 3px solid #00d4ff;
        }
        .no-api-notice {
            background: rgba(255, 193, 7, 0.2);
            border-left-color: #ffc107;
            color: #fff3cd;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="logo">🎭 ASOOS</div>
        <div class="subtitle">Aixtiv Symphony Authentication</div>
        
        <button class="auth-button" onclick="initiateAuth()">
            🔐 Authenticate with Sally Port
        </button>
        
        <div class="security-notice">
            <strong>🔒 Diamond SAO Security Level</strong><br>
            Authentication only - No API endpoints exposed
        </div>
        
        <div class="security-notice no-api-notice">
            <strong>⚠️ Notice:</strong> This system provides OAuth2 authentication only. 
            No data APIs are accessible externally.
        </div>
    </div>

    <script>
        function initiateAuth() {
            const clientId = 'coaching2100-diamond-sao';
            const redirectUri = window.location.origin + '/auth/callback.html';
            const state = generateRandomState();
            const scopes = 'profile';
            
            const authUrl = '/auth/oauth2/authorize?' + new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                state: state,
                scope: scopes
            });
            
            // Store state for validation
            localStorage.setItem('oauth_state', state);
            
            window.location.href = authUrl;
        }
        
        function generateRandomState() {
            return Math.random().toString(36).substring(2) + 
                   Math.random().toString(36).substring(2);
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Serve callback page
 * Handles OAuth2 callback and displays result
 */
function serveCallbackPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Result - ASOOS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: white;
            margin: 0;
            padding: 2rem;
            min-height: 100vh;
        }
        .result-container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .success { border-left: 4px solid #28a745; }
        .error { border-left: 4px solid #dc3545; }
        .loading { border-left: 4px solid #ffc107; }
        .status-icon {
            font-size: 3rem;
            text-align: center;
            margin-bottom: 1rem;
        }
        .user-info {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        .token-info {
            background: rgba(0, 212, 255, 0.1);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
            border: 1px solid rgba(0, 212, 255, 0.3);
        }
        .warning {
            background: rgba(255, 193, 7, 0.2);
            border: 1px solid #ffc107;
            color: #fff3cd;
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        pre {
            background: rgba(0, 0, 0, 0.5);
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="result-container loading">
        <div class="status-icon">⏳</div>
        <h2>Processing Authentication...</h2>
        <p>Please wait while we verify your authentication.</p>
    </div>

    <script>
        async function processCallback() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            
            const container = document.querySelector('.result-container');
            
            if (error) {
                showError('OAuth2 Error: ' + (urlParams.get('error_description') || error));
                return;
            }
            
            if (!code || !state) {
                showError('Missing authorization code or state parameter');
                return;
            }
            
            // Verify state
            const storedState = localStorage.getItem('oauth_state');
            if (state !== storedState) {
                showError('Invalid state parameter - possible CSRF attack');
                return;
            }
            
            try {
                // Exchange code for token
                const response = await fetch('/auth/oauth2/callback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code, state })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showSuccess(result);
                } else {
                    showError(result.error_description || 'Authentication failed');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            }
            
            // Clean up stored state
            localStorage.removeItem('oauth_state');
        }
        
        function showSuccess(result) {
            const container = document.querySelector('.result-container');
            container.className = 'result-container success';
            container.innerHTML = \`
                <div class="status-icon">✅</div>
                <h2>Authentication Successful!</h2>
                <p>Welcome, <strong>\${result.user.name}</strong></p>
                
                <div class="user-info">
                    <h3>User Information</h3>
                    <p><strong>Email:</strong> \${result.user.email}</p>
                    <p><strong>Role:</strong> \${result.user.role}</p>
                    <p><strong>Tier:</strong> \${result.user.tier}</p>
                    <p><strong>Access Level:</strong> \${result.accessLevel}</p>
                </div>
                
                <div class="token-info">
                    <h3>🔐 JWT Token</h3>
                    <p><em>Authentication token issued (30-minute expiry)</em></p>
                    <pre>\${result.token}</pre>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong> \${result.message}
                    <br><br>
                    This token is for authentication verification only. 
                    No external API access is granted or available.
                </div>
                
                <p><small>Authenticated at: \${result.timestamp}</small></p>
            \`;
        }
        
        function showError(message) {
            const container = document.querySelector('.result-container');
            container.className = 'result-container error';
            container.innerHTML = \`
                <div class="status-icon">❌</div>
                <h2>Authentication Failed</h2>
                <p>\${message}</p>
                <button onclick="window.location.href='/auth/login.html'">
                    Try Again
                </button>
            \`;
        }
        
        // Process callback on page load
        processCallback();
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
