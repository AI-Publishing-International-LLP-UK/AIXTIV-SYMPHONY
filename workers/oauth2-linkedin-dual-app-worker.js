/**
 * ASOOS Dual LinkedIn Apps Worker
 * Handles both Dr. Memoria and MCP LinkedIn Applications
 * Diamond SAO Security Level
 */

// LinkedIn App Configurations
const LINKEDIN_APPS = {
  DR_MEMORIA: {
    name: 'Dr. Memoria ASOOS',
    clientId: 'LINKEDIN_DR_MEMORIA_CLIENT_ID',
    clientSecret: 'LINKEDIN_DR_MEMORIA_CLIENT_SECRET',
    redirectUri: 'https://memoria.asoos.2100.cool/auth/callback',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
    purpose: 'content_publishing_thought_leadership'
  },
  MCP_LINKEDIN: {
    name: 'ASOOS MCP LinkedIn',
    clientId: 'MCP_OAUTH_CLIENT_ID',
    clientSecret: 'MCP_OAUTH_CLIENT_SECRET', 
    redirectUri: 'https://mcp.asoos.2100.cool/auth/callback',
    scopes: ['openid', 'profile', 'email'],
    purpose: 'enterprise_client_authentication'
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const hostname = url.hostname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Acce      'Acce      'Acce      'ontent-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route based on subdomain/hostname
      if (hostname.includes('memoria.asoos.2100.cool')) {
        return await handleDrMemoriaApp(request, env, pathname);
      } else if (hostname.includes('mcp.asoos.2100.cool')) {
        return await handleMcpLinkedInApp(request, env, pathname);
      } else if (pathname.startsWith('/linkedin/')) {
        // Generic LinkedIn auth endpoints
        return await handleGenericLinkedInAuth(request, env, pathname);
      }

      // Default landing page showing both apps
      return new Response(generateDualAppLanding(), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });

    } catch (error) {
      console.error('LinkedIn Dual App Error:', error);
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: corsHeaders 
      });
    }
  }
};

// Dr. Memoria App Handler
async function handleDrMemoriaApp(request, env, pathname) {
  const app = LINKEDIN_APPS.DR_MEMORIA;
  
  if (pathname === '/auth/login') {
    return generateLinkedInAuth(app, env, 'memoria');
  } else if (pathname === '/auth/callback') {
    return handleLinkedInCallback(request, env, app, 'memoria');
  } else if (pathname === '/') {
    return new Response(generateMemoriaLanding(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Dr. Memoria LinkedIn App - Route not found', { status: 404 });
}

// MCP LinkedIn App Handler
async function handleMcpLinkedInApp(request, env, pathname) {
  const app = LINKEDIN_APPS.MCP_LINKEDIN;
  
  if (pathname === '/auth/login') {
                                                                athname === '/auth/callback') {
    return handleLinkedInCallback(request, env, app, 'mcp');
  } else if (pathname === '/') {
    return new Response(generateMcpLanding(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('MCP LinkedIn App - Route not found', { status: 404 });
}

// Generic LinkedIn Auth Handler
async function handleGenericLinkedInAuth(request, env, pathname) {
  const url = new URL(request.url);
  const appType = url.searchParams.get('app') || 'memoria';
  const app = appType === 'mcp' ? LINKEDIN_APPS.MCP_LINKEDIN : LINKEDIN_APPS.DR_MEMORIA;
  
  if (pathname === '/linkedin/auth') {
    return generateLinkedInAuth(app, env, appType);
  }
  }
return generateLinkedInAuth(app, env, appType);
LINKEDIN : LINKEDIN_APPS.DR_MEMO;
}

// Generate LinkedIn OAuth URL
function generateLinkedInAuth(app, env, appType) {
  const state = crypto.randomUUID();
  const scopes = app.scopes.join(' ');
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${env[app.clientId]}&` +
    `redirect_uri=${encodeURIComponent(app.redirectUri)}&` +
    `state=${state}&` +
    `scope=${encodeURIComponent(scopes)}`;

  // Store state for validation (in production, use KV or D1)
  
  return Response.redirect(authUrl, 302);
}

// Handle LinkedIn OAuth Callback
async function handleLinkedInCallback(request, env, app, appType) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code) {
    return new Response('Authorization code missing', { status: 400 });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: app.redirectUri,
        client_id: env[app.clientId],
        client_secret: env[app.clientSecret]
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
    }
    
    // Get user profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'LinkedIn-Version': '202405'
      }
    });
    
    const profile = await profileResponse.json();
    
    // Generate success page
    return new Response(generateSuccessPage(profile, app, appType), {
      headers: {       headers: {       headers: {       headers: {       headers: {       headers: {   dIn Callback Error:', error);
    return     return     return     return     return     retur`, { status: 500 });
  }
}

// Generate landing pages
function generateDualAppLanding() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>ASOOS LinkedIn Integration</title>
    <style>
        body { background: #0a0a0a; color: #0bb1bb; font-family: Arial; padding: 40px; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        h1 { font-size: 48px; margin-bottom: 20px; }
        .app-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
        .app-card { background: rgba(11,177,187,0.1); padding: 40px; border-radius: 15px; border: 2px solid #0bb1bb; }
        .app-btn { background: #0077B5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 ASOOS LinkedIn Integration</h1>
        <p>Choose your LinkedIn application:</p>
        
        <div class="app-grid">
            <div class="app-card">
                <h2>🧠 Dr. Memoria</h2>
                <p>Content Publishing & Thought Leadership</p>
                <a href="https://memoria.asoos.2100.cool/" class="app-btn">Access Dr. Memoria</a>
            </div>
            
            <div class="app-card">
                <h2>🔗 MCP LinkedIn</h2>
                <p>Enterprise Client Authentication</p>
                <a href="https://mcp.asoos.2100.cool/" class="app-btn">Access MCP Auth</a>
            </div>
        </div>
        
        <p style="margin-top: 40px; color: #666;">Diamond SAO Security • Victory 33 Protected</p>
    </div>
</body>
</html>`;
}
}
html>`;

style="margin-top: 40px; color: #666;">Diamond SAO Security • Victory 33 Protected</p>
- LinkedIn Content Hub</title>
    <style>
        body { background: #0a0a0a; color: #0bb1bb; font-family: Arial; padding: 40px; text-align: center; }
        h1 { font-size: 48px; margin-bottom: 20px; }
        .login-btn         .login-btn         .l white; padding: 20px 40px; font-size        .login-btn    n: none; border-radi        .login-btn         .login-btn         .l white; paddiyle>
</head>
<body>
    <h1>🧠 Dr. Memoria</h1>
    <p>Content Publishing & Thought Leadership Platform</p>
    <p>Connect your LinkedIn to start creating and publis    <p>Connect your Lia href="/auth/login" class="login-btn">Connect LinkedIn</a>
</body>
</html>`;</html>`;</html>`;</html>`;</html>`;</html>`;</html>`;</html>`;</html>`;</html>`;</html>`P LinkedIn Authentication</title>
    <style>    <style>    <style>    <style>    <style>    <style>    <style>    <s padding: 40px; text-align: center; }
        h1 { font-size: 48px; margin-bottom: 20px; }
        .login-btn { background: #0077B5; color: white; padding: 20px 40px; font-size: 18px; text-decoration: none; border-radius: 30px; display: inline-block; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>🔗 MCP LinkedIn</h1>
    <p>Enterprise Client Authentication Portal</p>
    <p>Authenticate with LinkedIn for MCP access</p>
    <a href="/auth/login" class="login-btn">Authenticate</a>
</body>
</html>`;
}

function generateSuccessPage(profile, app, appType) {
                              l>
<head>
    <title>Authentication Successful</title>
    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    <st    bb; }
        .profile { background: rgba(11,177,187,0.1); padding: 30px; border-radius: 15px; margin: 30px auto; max-width: 500px; }
    </st    </st    </st    </st    </st    </st    </st    </st    </st    </st    </st    </st    </st    </st    </st    </scome, ${profile.name}!</h2>
        <p><strong>Email:</        <p><strong>Email:</        <p><strong>Email:</        <p><strong>Email:</        <p><strong>Email:</        <p><strong>Email:</        <p><strong>Email:</        <p><stroYou are now connected and ready to use the platform!</p>
</body>
</html>`;
}
