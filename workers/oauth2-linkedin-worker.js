/**
 * Cloudflare Worker: LinkedIn OAuth2 Authentication
 * 
 * Quick & Dirty Implementation - 5 Minutes to Production
 * 
 * Features:
 * - GET /auth/linkedin/start → redirects to LinkedIn
 * - GET /auth/linkedin/callback → exchanges code for token, creates JWT, redirects to dashboard
 * - Built on existing SallyPort JWT infrastructure
 * - Diamond SAO security level
 */

/**
 * Main Cloudflare Worker handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Add CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route LinkedIn OAuth flows
      switch (path) {
        case '/auth/linkedin/start':
          return handleLinkedInStart(request, env);
          
        case '/auth/linkedin/callback':
          return handleLinkedInCallback(request, env);
          
        case '/auth/linkedin/status':
          return handleLinkedInStatus(request, env);

        case '/auth/linkedin/disconnect':
          return handleLinkedInDisconnect(request, env);
          
        default:
          return new Response(
            JSON.stringify({
              error: 'Not Found',
              message: 'LinkedIn OAuth service only',
              availableEndpoints: [
                '/auth/linkedin/start',
                '/auth/linkedin/callback', 
                '/auth/linkedin/status',
                '/auth/linkedin/disconnect'
              ],
              securityLevel: 'diamond_sao'
            }),
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
      console.error('LinkedIn OAuth Error:', error);
      return new Response(
        JSON.stringify({
          error: 'LinkedIn Authentication Error',
          message: error.message,
          timestamp: new Date().toISOString()
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
 * Step 1: Start LinkedIn OAuth flow
 */
async function handleLinkedInStart(request, env) {
  try {
    const url = new URL(request.url);
    
    // Generate secure state parameter
    const state = crypto.randomUUID();
    
    // LinkedIn OAuth configuration
    const clientId = env.LINKEDIN_DR_MEMORIA_CLIENT_ID || '78pgcfb9rvgstu';
    const redirectUri = 'https://auth.asoos.2100.cool/auth/linkedin/callback';
    const scopes = ['openid', 'profile', 'email', 'w_member_social'].join(' ');
    
    // Store state in KV for validation (expires in 10 minutes)
    if (env.AUTH_SESSIONS) {
      await env.AUTH_SESSIONS.put(`linkedin_state_${state}`, JSON.stringify({
        timestamp: Date.now(),
        redirectAfter: url.searchParams.get('redirect') || '/interface'
      }), { expirationTtl: 600 });
    }
    
    // Build LinkedIn authorization URL
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scopes)}`;
    
    console.log('LinkedIn OAuth Start:', { state, redirectUri, scopes });
    
    // Redirect to LinkedIn
    return Response.redirect(authUrl, 302);
    
  } catch (error) {
    console.error('LinkedIn Start Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start LinkedIn authentication' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Step 2: Handle LinkedIn OAuth callback
 */
async function handleLinkedInCallback(request, env) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code || !state) {
      return new Response(
        `<html><body><h1>LinkedIn OAuth Error</h1><p>Missing authorization code or state parameter</p><p><a href="/interface">Return to Dashboard</a></p></body></html>`,
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    // Validate state parameter
    let stateData = null;
    if (env.AUTH_SESSIONS) {
      const storedState = await env.AUTH_SESSIONS.get(`linkedin_state_${state}`);
      if (storedState) {
        stateData = JSON.parse(storedState);
        await env.AUTH_SESSIONS.delete(`linkedin_state_${state}`);
      } else {
        return new Response(
          `<html><body><h1>LinkedIn OAuth Error</h1><p>Invalid or expired state parameter</p><p><a href="/interface">Return to Dashboard</a></p></body></html>`,
          { status: 400, headers: { 'Content-Type': 'text/html' } }
        );
      }
    }
    
    // Exchange authorization code for access token
    const clientId = env.LINKEDIN_DR_MEMORIA_CLIENT_ID || '78pgcfb9rvgstu';
    const clientSecret = env.LINKEDIN_DR_MEMORIA_CLIENT_SECRET || 'YOUR_SECRET_HERE';
    const redirectUri = 'https://auth.asoos.2100.cool/auth/linkedin/callback';
    
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('LinkedIn Token Exchange Failed:', errorText);
      return new Response(
        `<html><body><h1>LinkedIn OAuth Error</h1><p>Token exchange failed</p><pre>${errorText}</pre><p><a href="/interface">Return to Dashboard</a></p></body></html>`,
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    const tokens = await tokenResponse.json();
    console.log('LinkedIn Tokens Retrieved:', { access_token: tokens.access_token ? 'RECEIVED' : 'MISSING' });
    
    // Get user profile from LinkedIn
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    let userProfile = {};
    if (profileResponse.ok) {
      userProfile = await profileResponse.json();
      console.log('LinkedIn Profile:', { email: userProfile.email, name: userProfile.name });
    }
    
    // Store LinkedIn connection in KV (expires in 2 months)
    const sessionId = crypto.randomUUID();
    if (env.AUTH_SESSIONS) {
      await env.AUTH_SESSIONS.put(`linkedin_session_${sessionId}`, JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        user: userProfile,
        connected_at: Date.now()
      }), { expirationTtl: 5184000 }); // 2 months
    }
    
    // Create SallyPort JWT with LinkedIn data
    const jwtPayload = {
      sub: userProfile.sub || userProfile.email || sessionId,
      email: userProfile.email,
      name: userProfile.name,
      linkedinConnected: true,
      linkedinSessionId: sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      iss: 'auth.asoos.2100.cool',
      aud: 'asoos.2100.cool'
    };
    
    // Sign JWT (in production, use env.JWT_SECRET)
    const jwtSecret = env.JWT_SECRET || 'development-secret-change-in-production';
    const jwt = await signJWT(jwtPayload, jwtSecret);
    
    // Success page with auto-redirect
    const redirectUrl = stateData?.redirectAfter || '/interface';
    const successPage = `
<!DOCTYPE html>
<html>
<head>
    <title>LinkedIn Connected - ASOOS</title>
    <style>
        body {
            background: #0a0a0a;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
            margin: 0;
        }
        .success-container {
            text-align: center;
            padding: 30px;
            border-radius: 8px;
            background: rgba(26, 26, 26, 0.8);
            border: 1px solid #333;
        }
        .checkmark {
            font-size: 60px;
            color: #0077B5;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="success-container">
        <div class="checkmark">✅</div>
        <h1>LinkedIn Connected Successfully!</h1>
        <p>Welcome, ${userProfile.name || 'LinkedIn User'}!</p>
        <p>Redirecting to dashboard...</p>
    </div>
    <script>
        // Set auth token cookie
        document.cookie = 'AuthToken=${jwt}; path=/; secure; samesite=strict; max-age=1800';
        
        // Store LinkedIn status
        localStorage.setItem('linkedin_connected', 'true');
        localStorage.setItem('linkedin_user', JSON.stringify({
          name: '${userProfile.name || ''}',
          email: '${userProfile.email || ''}',
          connected_at: '${new Date().toISOString()}'
        }));
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = '${redirectUrl}#integrations';
        }, 3000);
    </script>
</body>
</html>`;
    
    return new Response(successPage, {
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': `AuthToken=${jwt}; path=/; secure; samesite=strict; max-age=1800`
      }
    });
    
  } catch (error) {
    console.error('LinkedIn Callback Error:', error);
    return new Response(
      `<html><body><h1>LinkedIn OAuth Error</h1><p>${error.message}</p><p><a href="/interface">Return to Dashboard</a></p></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Check LinkedIn connection status
 */
async function handleLinkedInStatus(request, env) {
  try {
    // Get session ID from JWT or cookie
    const authToken = request.headers.get('Authorization')?.replace('Bearer ', '') ||
                     getCookieValue(request.headers.get('Cookie'), 'AuthToken');
    
    if (!authToken) {
      return new Response(JSON.stringify({ connected: false, message: 'No auth token' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Decode JWT to get LinkedIn session ID (simplified - use proper JWT library in production)
    const jwtPayload = JSON.parse(atob(authToken.split('.')[1]));
    const linkedinSessionId = jwtPayload.linkedinSessionId;
    
    if (!linkedinSessionId) {
      return new Response(JSON.stringify({ connected: false, message: 'No LinkedIn session' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if LinkedIn session exists in KV
    if (env.AUTH_SESSIONS) {
      const sessionData = await env.AUTH_SESSIONS.get(`linkedin_session_${linkedinSessionId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        return new Response(JSON.stringify({ 
          connected: true,
          user: session.user,
          connected_at: session.connected_at
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({ connected: false, message: 'Session not found' }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ connected: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Disconnect LinkedIn
 */
async function handleLinkedInDisconnect(request, env) {
  try {
    // Get session ID from JWT
    const authToken = request.headers.get('Authorization')?.replace('Bearer ', '') ||
                     getCookieValue(request.headers.get('Cookie'), 'AuthToken');
    
    if (authToken) {
      const jwtPayload = JSON.parse(atob(authToken.split('.')[1]));
      const linkedinSessionId = jwtPayload.linkedinSessionId;
      
      if (linkedinSessionId && env.AUTH_SESSIONS) {
        await env.AUTH_SESSIONS.delete(`linkedin_session_${linkedinSessionId}`);
      }
    }
    
    return new Response(JSON.stringify({ disconnected: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Simple JWT signing (use proper library in production)
 */
async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  // Simple HMAC-SHA256 signature (use crypto.subtle in production)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${data}.${encodedSignature}`;
}

/**
 * Extract cookie value from cookie header
 */
function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
