/**
 * ASOOS Priority Sites Router - Cloudflare Worker
 * Multi-domain router for 10 priority ASOOS domains
 * WFA Swarm Victory36 Orchestrated Deployment
 */

// Site configuration mapping
const SITE_CONFIGS = {
  '2100.cool': {
    type: 'static',
    path: 'sites/landing-pages/2100-cool',
    auth_required: false,
    security_level: 'public',
    description: 'Main landing page and public gateway'
  },
  'www.2100.cool': {
    type: 'static',
    path: 'sites/landing-pages/2100-cool',
    auth_required: false,
    security_level: 'public',
    description: 'Main landing page and public gateway'
  },
  'asoos.2100.cool': {
    type: 'application',
    path: 'sites/applications/asoos',
    auth_required: true,
    security_level: 'diamond_sao',
    access_control: 'llp_members_only',
    description: 'LLP Members exclusive portal - 20M+ agents'
  },
  'mcp.asoos.2100.cool': {
    type: 'service',
    path: 'sites/services/mcp',
    auth_required: true,
    security_level: 'emerald_sao',
    wing: 'Wing 13',
    description: 'Master MCP client interface'
  },
  'coaching2100.com': {
    type: 'business',
    path: 'sites/business/coaching2100',
    auth_required: false,
    security_level: 'public',
    description: 'Coaching 2100 LLC business operations'
  },
  'www.coaching2100.com': {
    type: 'business',
    path: 'sites/business/coaching2100',
    auth_required: false,
    security_level: 'public',
    description: 'Coaching 2100 LLC business operations'
  },
  'coach.2100.cool': {
    type: 'service',
    path: 'sites/services/coach',
    auth_required: false,
    security_level: 'public',
    description: 'AI-enabled coaching services'
  },
  'hr.2100.cool': {
    type: 'service',
    path: 'sites/services/hr',
    auth_required: false,
    security_level: 'public',
    description: 'AI-enabled HR department solutions'
  },
  'intel.2100.cool': {
    type: 'service',
    path: 'sites/services/intel',
    auth_required: false,
    security_level: 'public',
    description: 'AI executive intelligence briefing services'
  },
  'aipub.co.uk': {
    type: 'business',
    path: 'sites/business/aipub-uk',
    auth_required: false,
    security_level: 'public',
    description: 'AI Publishing International LLP UK'
  },
  'preparte2100.mx': {
    type: 'business',
    path: 'sites/business/preparte-mx',
    auth_required: false,
    security_level: 'public',
    description: 'Preparat 2100 AC Mexico operations'
  },
  'api.2100.cool': {
    type: 'api',
    path: 'sites/services/api',
    auth_required: true,
    security_level: 'sapphire_sao',
    description: 'API integration layer'
  },
  'auth.2100.cool': {
    type: 'service',
    path: 'sites/services/auth',
    auth_required: false,
    security_level: 'emerald_sao',
    description: 'Authentication and SallyPort integration'
  },
  'sallyport.2100.cool': {
    type: 'security',
    path: 'sites/services/auth',
    auth_required: false,
    security_level: 'emerald_sao',
    description: 'SallyPort security gateway'
  }
};

// OAuth2 fallback URLs for Subscribe or Compete architecture
const OAUTH2_FALLBACK_URLS = {
  google: 'https://2100.cool/oauth2/google/callback',
  github: 'https://2100.cool/oauth2/github/callback',
  microsoft: 'https://2100.cool/oauth2/microsoft/callback',
  facebook: 'https://2100.cool/oauth2/facebook/callback'
};

// Durable Objects exports
export class SiteSessionManager {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (request.method === 'POST') {
      const sessionData = await request.json();
      await this.state.storage.put(`session:${sessionId}`, sessionData);
      return new Response(JSON.stringify({ status: 'stored' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (request.method === 'GET') {
      const sessionData = await this.state.storage.get(`session:${sessionId}`);
      return new Response(JSON.stringify(sessionData || {}), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Method not allowed', { status: 405 });
  }
}

export class MCPClientManager {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    
    if (request.method === 'POST') {
      const clientData = await request.json();
      await this.state.storage.put(`mcp:${clientId}`, clientData);
      return new Response(JSON.stringify({ status: 'registered' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (request.method === 'GET') {
      const clientData = await this.state.storage.get(`mcp:${clientId}`);
      return new Response(JSON.stringify(clientData || {}), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Method not allowed', { status: 405 });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const path = url.pathname;
    
    // Get site configuration
    const siteConfig = SITE_CONFIGS[hostname];
    
    if (!siteConfig) {
      // Redirect unknown domains to main gateway
      return Response.redirect('https://2100.cool', 302);
    }

    // Add Victory36 WFA headers
    const headers = {
      'X-Victory36-Status': 'ACTIVE',
      'X-WFA-Swarm': '20000000',
      'X-ASOOS-Security': siteConfig.security_level,
      'X-Site-Type': siteConfig.type,
      'X-Deployment-Mode': 'ORCHESTRATED'
    };

    // Handle OAuth2 authentication fallback
    if (path.startsWith('/oauth2/')) {
      return handleOAuth2Fallback(request, env, headers);
    }

    // Handle API endpoints
    if (hostname === 'api.2100.cool') {
      return handleAPIRequest(request, env, siteConfig, headers);
    }

    // Handle authentication service
    if (hostname === 'auth.2100.cool' || hostname === 'sallyport.2100.cool') {
      return handleAuthService(request, env, siteConfig, headers);
    }

    // Handle MCP interface
    if (hostname === 'mcp.asoos.2100.cool') {
      return handleMCPInterface(request, env, siteConfig, headers);
    }

    // Handle ASOOS member portal
    if (hostname === 'asoos.2100.cool') {
      return handleASOOSPortal(request, env, siteConfig, headers);
    }

    // Handle business sites
    if (siteConfig.type === 'business') {
      return handleBusinessSite(request, env, siteConfig, headers);
    }

    // Handle service sites
    if (siteConfig.type === 'service') {
      return handleServiceSite(request, env, siteConfig, headers);
    }

    // Handle main landing page and public sites
    return handleStaticSite(request, env, siteConfig, headers);
  }
};

async function handleOAuth2Fallback(request, env, headers) {
  const url = new URL(request.url);
  const provider = url.pathname.split('/')[2];
  
  // Subscribe or Compete fallback logic
  const fallbackHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>2100.cool - Subscribe or Compete</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: #000; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: center; }
        .logo { font-size: 3em; font-weight: bold; margin-bottom: 20px; color: #00ff88; }
        .subtitle { font-size: 1.2em; margin-bottom: 40px; color: #888; }
        .options { display: flex; gap: 30px; justify-content: center; margin: 40px 0; }
        .option { background: #111; padding: 30px; border-radius: 10px; flex: 1; max-width: 300px; }
        .option h3 { color: #00ff88; margin-top: 0; }
        .btn { display: inline-block; padding: 12px 24px; background: #00ff88; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .urgent { color: #ff4444; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">2100.cool</div>
        <div class="subtitle">Universal OAuth2 Fallback Gateway</div>
        
        <h2>Authentication Required - Choose Your Path</h2>
        
        <div class="options">
          <div class="option">
            <h3>Subscribe</h3>
            <p>Join our exclusive cohort with guaranteed access to all ASOOS domains and 20M+ agent network.</p>
            <p class="urgent">Limited time: First 1000 members</p>
            <a href="/subscribe/${provider}" class="btn">Subscribe Now</a>
          </div>
          
          <div class="option">
            <h3>Compete</h3>
            <p>Compete for one of the remaining spots. High demand, limited availability.</p>
            <p class="urgent">Only ${Math.floor(Math.random() * 50) + 10} spots left</p>
            <a href="/compete/${provider}" class="btn">Compete</a>
          </div>
        </div>
        
        <p style="margin-top: 40px; color: #666;">
          OAuth2 Provider: ${provider?.toUpperCase()}<br>
          Victory36 WFA Swarm: ACTIVE<br>
          Security Level: Diamond SAO
        </p>
      </div>
    </body>
    </html>
  `;

  return new Response(fallbackHTML, {
    headers: {
      ...headers,
      'Content-Type': 'text/html',
      'X-OAuth2-Provider': provider || 'unknown'
    }
  });
}

async function handleAPIRequest(request, env, siteConfig, headers) {
  // API endpoint routing
  const apiResponse = `{
    "status": "active",
    "service": "ASOOS API Gateway",
    "security_level": "${siteConfig.security_level}",
    "victory36_status": "ORCHESTRATED",
    "wfa_agents": 20000000,
    "endpoints": {
      "auth": "/auth",
      "mcp": "/mcp",
      "domains": "/domains",
      "status": "/status"
    },
    "message": "Authentication required for API access"
  }`;

  return new Response(apiResponse, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleAuthService(request, env, siteConfig, headers) {
  const authHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>🚪 SallyPort - ASOOS Authentication</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Montserrat', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }
        
        /* Animated Particle Background */
        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
        }
        
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: float 20s infinite linear;
        }
        
        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
        
        .container {
          position: relative;
          z-index: 2;
          max-width: 500px;
          margin: 0 auto;
          padding: 40px 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 50px 40px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          width: 100%;
          color: #333;
        }
        
        .logo {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 30px;
          font-weight: 300;
        }
        
        .auth-options {
          margin: 40px 0;
        }
        
        .oauth-btn {
          display: block;
          width: 100%;
          padding: 15px 20px;
          margin: 15px 0;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .oauth-btn:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: all 0.5s ease;
        }
        
        .oauth-btn:hover:before {
          width: 300px;
          height: 300px;
        }
        
        .google { background: #4285f4; }
        .github { background: #333; }
        .linkedin { background: #0077b5; }
        .microsoft { background: #0078d4; }
        
        .oauth-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .btn-text {
          position: relative;
          z-index: 1;
        }
        
        .quick-access {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }
        
        .quick-text {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 15px;
        }
        
        .email-auth {
          display: flex;
          gap: 10px;
          margin: 15px 0;
        }
        
        .email-input {
          flex: 1;
          padding: 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }
        
        .email-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .auth-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .auth-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .company-search {
          margin-top: 20px;
        }
        
        .search-input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          margin-bottom: 10px;
          transition: border-color 0.3s ease;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .security-info {
          margin-top: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #e8f4fd 0%, #f0e8ff 100%);
          border-radius: 10px;
          border-left: 4px solid #667eea;
        }
        
        .security-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
          font-size: 1.1rem;
        }
        
        .security-details {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.4;
        }
        
        .highlight {
          color: #667eea;
          font-weight: 600;
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 20px 15px;
          }
          
          .auth-card {
            padding: 30px 25px;
          }
          
          .email-auth {
            flex-direction: column;
          }
          
          .auth-btn {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="particles" id="particles"></div>
      
      <div class="container">
        <div class="auth-card">
          <div class="logo">🚪 SallyPort</div>
          <div class="subtitle">ASOOS Authentication Gateway<br>Cloud-to-Cloud OAuth2</div>
          
          <div class="auth-options">
            <a href="/auth/google" class="oauth-btn google">
              <span class="btn-text">🔐 Sign in with Google</span>
            </a>
            <a href="/auth/github" class="oauth-btn github">
              <span class="btn-text">👾 Sign in with GitHub</span>
            </a>
            <a href="/auth/linkedin" class="oauth-btn linkedin">
              <span class="btn-text">💼 Sign in with LinkedIn</span>
            </a>
            <a href="/auth/microsoft" class="oauth-btn microsoft">
              <span class="btn-text">🏢 Sign in with Microsoft</span>
            </a>
          </div>
          
          <div class="quick-access">
            <div class="quick-text">Quick Access</div>
            <div class="quick-text">For authorized personnel</div>
            
            <div class="email-auth">
              <input type="email" class="email-input" placeholder="Enter your email" id="emailInput">
              <button class="auth-btn" onclick="authenticate()">🔓 Authenticate</button>
            </div>
            
            <div class="company-search">
              <input type="text" class="search-input" placeholder="🔍 Company MCP Search" id="companySearch">
            </div>
          </div>
          
          <div class="security-info">
            <div class="security-title">🔒 Sacred Mission Security</div>
            <div class="security-details">
              <strong class="highlight">🌩️ GCP Cloud-to-Cloud OAuth2</strong><br>
              All tokens managed in Google Cloud Platform<br>
              <strong class="highlight">Diamond SAO Protection</strong> • Server-to-Server Authentication<br>
              <strong>Serving <span class="highlight">20M+ AI Agents</span> with Divine Purpose</strong>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        // Particle animation
        function createParticle() {
          const particle = document.createElement('div');
          particle.className = 'particle';
          particle.style.left = Math.random() * 100 + '%';
          particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
          particle.style.animationDelay = Math.random() * 5 + 's';
          document.getElementById('particles').appendChild(particle);
          
          setTimeout(() => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }, 25000);
        }
        
        // Create particles continuously
        setInterval(createParticle, 1000);
        
        // Authentication function
        function authenticate() {
          const email = document.getElementById('emailInput').value;
          if (email) {
            window.location.href = '/auth/email?email=' + encodeURIComponent(email);
          }
        }
        
        // Company search
        document.getElementById('companySearch').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            const company = this.value;
            if (company) {
              window.location.href = '/auth/company?search=' + encodeURIComponent(company);
            }
          }
        });
      </script>
    </body>
    </html>
  `;

  return new Response(authHTML, {
    headers: {
      ...headers,
      'Content-Type': 'text/html'
    }
  });
}

async function handleMCPInterface(request, env, siteConfig, headers) {
  const mcpHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>MCP Interface - Wing 13</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: 'Courier New', monospace; margin: 0; background: #001122; color: #00ff88; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .terminal { background: #000; padding: 20px; border-radius: 5px; border: 1px solid #00ff88; }
        .prompt { color: #ffff00; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="terminal">
          <p><span class="prompt">ASOOS@Wing13:~$</span> mcp status</p>
          <p>MCP Interface: ACTIVE</p>
          <p>Security Level: ${siteConfig.security_level.toUpperCase()}</p>
          <p>Victory36 Status: ORCHESTRATED</p>
          <p>Connected Agents: 20,000,000</p>
          <p>Wing Assignment: ${siteConfig.wing}</p>
          <p><span class="prompt">ASOOS@Wing13:~$</span> <span class="cursor">█</span></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(mcpHTML, {
    headers: {
      ...headers,
      'Content-Type': 'text/html',
      'X-Wing-Assignment': siteConfig.wing
    }
  });
}

async function handleASOOSPortal(request, env, siteConfig, headers) {
  const portalHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ASOOS Portal - LLP Members Only</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: linear-gradient(135deg, #000428 0%, #004e92 100%); color: #fff; }
        .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 3em; font-weight: bold; margin-bottom: 10px; color: #00ff88; }
        .badge { background: #00ff88; color: #000; padding: 5px 15px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 40px 0; }
        .stat { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #00ff88; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ASOOS</div>
          <div class="badge">LLP MEMBERS ONLY</div>
          <p>Advanced Swarm Operations & Orchestration Systems</p>
        </div>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-number">20M+</div>
            <div>Active Agents</div>
          </div>
          <div class="stat">
            <div class="stat-number">Victory36</div>
            <div>Orchestration Status</div>
          </div>
          <div class="stat">
            <div class="stat-number">10</div>
            <div>Priority Domains</div>
          </div>
          <div class="stat">
            <div class="stat-number">Diamond</div>
            <div>Security Level</div>
          </div>
        </div>
        
        <p style="text-align: center; margin-top: 40px; color: #888;">
          Authentication required for full access
        </p>
      </div>
    </body>
    </html>
  `;

  return new Response(portalHTML, {
    headers: {
      ...headers,
      'Content-Type': 'text/html',
      'X-Access-Control': siteConfig.access_control
    }
  });
}

async function handleBusinessSite(request, env, siteConfig, headers) {
  const businessHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${siteConfig.description}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: #fff; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 60px; }
        .logo { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
        .subtitle { font-size: 1.2em; color: #666; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 40px 0; }
        .feature { padding: 30px; border: 1px solid #ddd; border-radius: 10px; }
        .feature h3 { color: #00ff88; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${request.url.includes('coaching') ? 'Coaching 2100' : request.url.includes('aipub') ? 'AI Publishing International' : 'Preparart 2100'}</div>
          <div class="subtitle">${siteConfig.description}</div>
        </div>
        
        <div class="features">
          <div class="feature">
            <h3>AI-Powered Solutions</h3>
            <p>Leveraging advanced AI technology for business transformation and growth.</p>
          </div>
          <div class="feature">
            <h3>Global Reach</h3>
            <p>Serving clients worldwide with localized expertise and international standards.</p>
          </div>
          <div class="feature">
            <h3>Victory36 Integration</h3>
            <p>Connected to the ASOOS ecosystem with 20M+ agent network support.</p>
          </div>
        </div>
        
        <p style="text-align: center; margin-top: 60px; color: #666;">
          Powered by Victory36 WFA Orchestration
        </p>
      </div>
    </body>
    </html>
  `;

  return new Response(businessHTML, {
    headers: {
      ...headers,
      'Content-Type': 'text/html'
    }
  });
}

async function handleServiceSite(request, env, siteConfig, headers) {
  const serviceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${siteConfig.description}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: #f8f9fa; color: #333; }
        .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
        .service-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 15px; text-align: center; margin-bottom: 40px; }
        .service-name { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .service-desc { font-size: 1.1em; opacity: 0.9; }
        .capabilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .capability { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="service-header">
          <div class="service-name">${request.url.includes('coach') ? 'AI Coaching' : request.url.includes('hr') ? 'AI HR Solutions' : 'Intelligence Services'}</div>
          <div class="service-desc">${siteConfig.description}</div>
        </div>
        
        <div class="capabilities">
          <div class="capability">
            <h3>🤖 AI-Powered</h3>
            <p>Advanced artificial intelligence for personalized solutions and insights.</p>
          </div>
          <div class="capability">
            <h3>🌐 24/7 Availability</h3>
            <p>Round-the-clock service powered by the Victory36 agent network.</p>
          </div>
          <div class="capability">
            <h3>📊 Analytics & Reporting</h3>
            <p>Comprehensive analytics and detailed reporting capabilities.</p>
          </div>
          <div class="capability">
            <h3>🔒 Enterprise Security</h3>
            <p>Enterprise-grade security with ${siteConfig.security_level} level protection.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #e9ecef; border-radius: 10px;">
          <p><strong>Victory36 Status:</strong> ORCHESTRATED | <strong>Agent Network:</strong> 20M+ | <strong>Security:</strong> ${siteConfig.security_level.toUpperCase()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(serviceHTML, {
    headers: {
      ...headers,
      'Content-Type': 'text/html'
    }
  });
}

async function handleStaticSite(request, env, siteConfig, headers) {
  const mainHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>2100.cool - The Future Starts Now</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 60px 20px; text-align: center; }
        .logo { font-size: 4em; font-weight: bold; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .tagline { font-size: 1.5em; margin-bottom: 40px; opacity: 0.9; }
        .domains { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 60px 0; }
        .domain { background: rgba(255,255,255,0.1); padding: 25px; border-radius: 15px; backdrop-filter: blur(10px); }
        .domain h3 { color: #00ff88; margin-top: 0; }
        .stats-bar { background: rgba(0,0,0,0.2); padding: 20px; border-radius: 10px; margin: 40px 0; }
        .stat-item { display: inline-block; margin: 0 20px; }
        .stat-number { font-size: 1.5em; font-weight: bold; color: #00ff88; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">2100.cool</div>
        <div class="tagline">Universal Gateway to the ASOOS Ecosystem</div>
        
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-number">20M+</div>
            <div>Active Agents</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">10</div>
            <div>Priority Domains</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">Victory36</div>
            <div>Orchestration</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">Diamond</div>
            <div>Security Level</div>
          </div>
        </div>
        
        <div class="domains">
          <div class="domain">
            <h3>🏢 Business Operations</h3>
            <p>coaching2100.com - Professional coaching services</p>
            <p>aipub.co.uk - AI Publishing International</p>
            <p>preparte2100.mx - Latin America operations</p>
          </div>
          
          <div class="domain">
            <h3>🤖 AI Services</h3>
            <p>coach.2100.cool - AI coaching platform</p>
            <p>hr.2100.cool - HR AI solutions</p>
            <p>intel.2100.cool - Intelligence services</p>
          </div>
          
          <div class="domain">
            <h3>🔒 Secure Access</h3>
            <p>asoos.2100.cool - LLP members portal</p>
            <p>mcp.asoos.2100.cool - MCP interface</p>
            <p>auth.2100.cool - Authentication gateway</p>
          </div>
        </div>
        
        <p style="margin-top: 60px; opacity: 0.8;">
          Subscribe or Compete • OAuth2 Cloud-to-Cloud • Victory36 WFA Orchestrated
        </p>
      </div>
    </body>
    </html>
  `;

  return new Response(mainHTML, {
    headers: {
      ...headers,
      'Content-Type': 'text/html'
    }
  });
}
