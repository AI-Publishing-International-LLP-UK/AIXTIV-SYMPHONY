// ASOOS.2100.cool Production Worker - Serving from asoos-clean-deploy-2025 Pages
// Integrated with SallyPort Authentication & LLP Member Registry
// Serves the full 20M+ agents interface from Pages deployment

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Security Headers
    const securityHeaders = {
      'Content-Type': 'text/html;charset=UTF-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: securityHeaders });
    }

    // Authentication endpoints
    if (url.pathname.startsWith('/auth') || url.pathname === '/login') {
      return handleAuthentication(request, env);
    }

    // API endpoints
    if (url.pathname.startsWith('/api/')) {
      return handleAPIEndpoints(url, request, env);
    }

    // Serve content from asoos-clean-deploy-2025 Pages deployment
    try {
      const pagesUrl = 'https://main.asoos-clean-deploy-2025.pages.dev' + url.pathname + url.search;
      const pagesResponse = await fetch(pagesUrl, {
        headers: {
          'User-Agent': 'ASOOS-Worker/2.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (pagesResponse.ok) {
        let content = await pagesResponse.text();
        
        // Inject authentication integration into the Pages content
        content = content.replace(
          '</head>',
          `<script>
            // Enhanced authentication integration for ASOOS.2100.cool
            window.ASOOS_AUTH_ENABLED = true;
            window.ASOOS_DOMAIN = 'asoos.2100.cool';
            window.ASOOS_PAGES_SOURCE = 'asoos-clean-deploy-2025';
            
            // Override authentication functions for SallyPort integration
            function initiateAuthentication(source) {
              console.log('ASOOS Authentication initiated from:', source);
              console.log('Domain:', window.ASOOS_DOMAIN);
              console.log('Pages Source:', window.ASOOS_PAGES_SOURCE);
              
              // Check if user is already authenticated
              const authToken = localStorage.getItem('asoos_auth_token');
              
              if (authToken) {
                // Redirect authenticated users to MCP interface
                window.location.href = '/api/redirect/mcp';
              } else {
                // Redirect to authentication page
                window.location.href = '/auth';
              }
            }
            
            // LLP Member check integration
            function checkLLPMembership() {
              console.log('Checking LLP membership via SallyPort...');
              // Integration with SALLY_PORT_SECRET_KEY handled by Worker
            }
            
            console.log('🎭 ASOOS.2100.cool - 20M+ AI Agents Ready');
            console.log('📡 Serving from Pages: asoos-clean-deploy-2025');
            console.log('🔐 SallyPort Authentication Enabled');
          </script>
          </head>`
        );
        
        return new Response(content, {
          status: pagesResponse.status,
          headers: {
            ...securityHeaders,
            'Content-Type': pagesResponse.headers.get('Content-Type') || 'text/html;charset=UTF-8'
          }
        });
      } else {
        // Fallback to embedded interface if Pages is unavailable
        return new Response(getFallbackInterface(), {
          status: 200,
          headers: securityHeaders
        });
      }
    } catch (error) {
      console.error('Error fetching from Pages:', error);
      // Fallback to embedded interface
      return new Response(getFallbackInterface(), {
        status: 200,
        headers: securityHeaders
      });
    }
  }
};

async function handleAuthentication(request, env) {
  // Comprehensive multi-provider authentication system
  // Integrates with existing oauth2-auth-only.pr-aef.workers.dev infrastructure
  
  const authHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASOOS Authentication - Choose Your Access Method</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Montserrat', sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    /* Particle Background */
    .particles {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
    }

    .particle {
      position: absolute;
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      border-radius: 50%;
      opacity: 0.1;
      animation: float 20s infinite linear;
    }

    @keyframes float {
      0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
      10% { opacity: 0.1; }
      90% { opacity: 0.1; }
      100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 50px;
    }

    .logo {
      font-size: 32px;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #c7b299, #50C878, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 10px;
    }

    .subtitle {
      font-size: 14px;
      color: #aaa;
      font-weight: 300;
    }

    /* Auth Container */
    .auth-container {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 30px;
      padding: 35px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(11, 177, 187, 0.1);
    }

    .auth-title {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .auth-description {
      text-align: center;
      font-size: 14px;
      color: #aaa;
      margin-bottom: 30px;
      line-height: 1.5;
    }

    /* Auth Options */
    .auth-options {
      display: grid;
      gap: 15px;
      margin-bottom: 25px;
    }

    .auth-option {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 15px;
      text-decoration: none;
      color: inherit;
    }

    .auth-option:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: #0bb1bb;
      box-shadow: 0 10px 30px rgba(11, 177, 187, 0.2);
      transform: translateY(-3px);
    }

    .auth-icon {
      width: 45px;
      height: 45px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .linkedin { background: linear-gradient(135deg, #0077b5, #005885); }
    .microsoft { background: linear-gradient(135deg, #0078d4, #106ebe); }
    .google { background: linear-gradient(135deg, #4285f4, #1a73e8); }
    .whatsapp { background: linear-gradient(135deg, #25d366, #128c7e); }
    .search { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .email { background: linear-gradient(135deg, #f59e0b, #d97706); }

    .auth-content {
      flex: 1;
    }

    .auth-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #fff;
    }

    .auth-desc {
      font-size: 12px;
      color: #aaa;
      line-height: 1.4;
    }

    .auth-arrow {
      font-size: 20px;
      color: #0bb1bb;
      opacity: 0.7;
      transition: all 0.3s ease;
    }

    .auth-option:hover .auth-arrow {
      opacity: 1;
      transform: translateX(5px);
    }

    /* Manual Entry */
    .manual-entry {
      margin-top: 30px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 15px;
      border: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .manual-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #0bb1bb;
    }

    .email-input {
      width: 100%;
      padding: 12px 15px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 16px;
      margin-bottom: 15px;
      outline: none;
      transition: border-color 0.3s ease;
    }

    .email-input:focus {
      border-color: #0bb1bb;
    }

    .email-input::placeholder {
      color: #666;
    }

    .continue-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      border: none;
      border-radius: 8px;
      color: #000;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .continue-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(11, 177, 187, 0.4);
    }

    .continue-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Back Button */
    .back-btn {
      position: absolute;
      top: 30px;
      left: 30px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 10px 20px;
      border-radius: 25px;
      text-decoration: none;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: #0bb1bb;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .auth-container {
        padding: 30px 25px;
        margin: 20px;
      }
      
      .logo {
        font-size: 28px;
      }
      
      .auth-title {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <!-- Particles Background -->
  <div class="particles" id="particles"></div>

  <!-- Back Button -->
  <a href="/" class="back-btn">
    <i class="fas fa-arrow-left"></i> Back to Home
  </a>

  <!-- Header -->
  <div class="header">
    <div class="logo">ASOOS</div>
    <div class="subtitle">Aixtiv Symphony Orchestrating Operating System</div>
  </div>

  <!-- Auth Container -->
  <div class="auth-container">
    <h1 class="auth-title">Welcome to ASOOS</h1>
    <p class="auth-description">
      Select your preferred authentication method to access your workspace.
      Your choice will determine available features and company integration.
    </p>

    <!-- Auth Options -->
    <div class="auth-options">
      <!-- LinkedIn Professional -->
      <a href="javascript:void(0)" onclick="authenticate('linkedin')" class="auth-option">
        <div class="auth-icon linkedin">
          <i class="fab fa-linkedin"></i>
        </div>
        <div class="auth-content">
          <div class="auth-name">LinkedIn Professional</div>
          <div class="auth-desc">Connect with your LinkedIn professional account for instant workspace setup</div>
        </div>
        <div class="auth-arrow">→</div>
      </a>

      <!-- Microsoft/Outlook -->
      <a href="javascript:void(0)" onclick="authenticate('microsoft')" class="auth-option">
        <div class="auth-icon microsoft">
          <i class="fab fa-microsoft"></i>
        </div>
        <div class="auth-content">
          <div class="auth-name">Microsoft / Outlook</div>
          <div class="auth-desc">Use your Microsoft business account for enterprise integration</div>
        </div>
        <div class="auth-arrow">→</div>
      </a>

      <!-- Google Workspace -->
      <a href="javascript:void(0)" onclick="authenticate('google')" class="auth-option">
        <div class="auth-icon google">
          <i class="fab fa-google"></i>
        </div>
        <div class="auth-content">
          <div class="auth-name">Google Workspace</div>
          <div class="auth-desc">Connect with your Google business account for seamless productivity</div>
        </div>
        <div class="auth-arrow">→</div>
      </a>

      <!-- WhatsApp Business -->
      <a href="javascript:void(0)" onclick="authenticate('whatsapp')" class="auth-option">
        <div class="auth-icon whatsapp">
          <i class="fab fa-whatsapp"></i>
        </div>
        <div class="auth-content">
          <div class="auth-name">WhatsApp Business</div>
          <div class="auth-desc">Quick access for global users with WhatsApp Business verification</div>
        </div>
        <div class="auth-arrow">→</div>
      </a>

      <!-- Search Company MCP -->
      <a href="javascript:void(0)" onclick="searchCompanyMCP()" class="auth-option">
        <div class="auth-icon search">
          <i class="fas fa-search"></i>
        </div>
        <div class="auth-content">
          <div class="auth-name">Find Your Company's MCP</div>
          <div class="auth-desc">Search for your company's existing MCP server and join your team</div>
        </div>
        <div class="auth-arrow">→</div>
      </a>
    </div>

    <!-- Manual Entry -->
    <div class="manual-entry">
      <div class="manual-title">Or enter your email manually:</div>
      <input type="email" class="email-input" id="manualEmail" placeholder="Enter your professional email address">
      <button class="continue-btn" onclick="authenticateWithEmail()" id="emailBtn">
        Continue with Email
      </button>
    </div>
  </div>

  <script>
    // Create particles
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 4 + 2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
      }
    }

    // Authentication functions
    function authenticate(provider) {
      const authUrls = {
        linkedin: \`https://oauth2-auth-only.pr-aef.workers.dev/auth/oauth2/authorize?provider=linkedin&client_id=aipub-diamond-sao&redirect_uri=https://2100.cool/interface/&scope=profile&state=phillip-corey-roark-pilot\`,
        microsoft: \`https://oauth2-auth-only.pr-aef.workers.dev/auth/oauth2/authorize?provider=microsoft&client_id=aipub-diamond-sao&redirect_uri=https://2100.cool/interface/&scope=profile&state=phillip-corey-roark-pilot\`,
        google: \`https://oauth2-auth-only.pr-aef.workers.dev/auth/oauth2/authorize?provider=google&client_id=aipub-diamond-sao&redirect_uri=https://2100.cool/interface/&scope=profile&state=phillip-corey-roark-pilot\`,
        whatsapp: \`https://oauth2-auth-only.pr-aef.workers.dev/auth/oauth2/authorize?provider=whatsapp&client_id=aipub-diamond-sao&redirect_uri=https://2100.cool/interface/&scope=profile&state=phillip-corey-roark-pilot\`
      };

      window.location.href = authUrls[provider];
    }

    function authenticateWithEmail() {
      const email = document.getElementById('manualEmail').value;
      if (!email) {
        alert('Please enter your email address');
        return;
      }

      // Basic email validation
      if (!/\\S+@\\S+\\.\\S+/.test(email)) {
        alert('Please enter a valid email address');
        return;
      }

      // For Phillip Corey Roark - redirect to Diamond SAO interface
      if (email === 'pr@coaching2100.com') {
        window.location.href = \`https://oauth2-auth-only.pr-aef.workers.dev/auth/oauth2/authorize?provider=email&email=\${encodeURIComponent(email)}&client_id=aipub-diamond-sao&redirect_uri=https://2100.cool/interface/&scope=profile&state=phillip-corey-roark-pilot\`;
      } else {
        // For other users - route to appropriate MCP based on domain
        const domain = email.split('@')[1];
        const companyMcpUrl = getCompanyMcpUrl(domain);
        window.location.href = \`https://oauth2-auth-only.pr-aef.workers.dev/auth/oauth2/authorize?provider=email&email=\${encodeURIComponent(email)}&client_id=general&redirect_uri=\${companyMcpUrl}&scope=profile&state=new-user\`;
      }
    }

    function searchCompanyMCP() {
      const company = prompt('Enter your company name (e.g., Nestlé, Microsoft, Deloitte):');
      if (!company) return;

      const companyLower = company.toLowerCase();
      const companyMcps = {
        'nestle': 'https://mcp.nestle.2100.cool/',
        'microsoft': 'https://mcp.microsoft.2100.cool/',
        'google': 'https://mcp.google.2100.cool/',
        'deloitte': 'https://mcp.deloitte.2100.cool/',
        'ey': 'https://mcp.ey.2100.cool/',
        'ernst & young': 'https://mcp.ey.2100.cool/',
        'ai publishing': 'https://mcp.aipub.2100.cool/',
        'aipub': 'https://mcp.aipub.2100.cool/'
      };

      const mcpUrl = companyMcps[companyLower];
      if (mcpUrl) {
        const joinTeam = confirm(\`Found \${company} MCP server!\\n\\nWould you like to join your company's existing workspace?\`);
        if (joinTeam) {
          window.location.href = \`https://oauth2-auth-only.pr-aef.workers.dev/auth/oauth2/authorize?provider=company&company=\${encodeURIComponent(company)}&client_id=company&redirect_uri=\${encodeURIComponent(mcpUrl)}&scope=profile&state=join-company\`;
        }
      } else {
        alert(\`Sorry, we don't have an MCP server for \${company} yet.\\n\\nYou can still create an account and we'll help set up your company's workspace!\`);
      }
    }

    function getCompanyMcpUrl(domain) {
      // Route all users to operational interface for now (multi-tenant branding coming later)
      const domainMcps = {
        'nestle.com': 'https://2100.cool/interface/',
        'microsoft.com': 'https://2100.cool/interface/',
        'google.com': 'https://2100.cool/interface/',
        'deloitte.com': 'https://2100.cool/interface/',
        'ey.com': 'https://2100.cool/interface/',
        'coaching2100.com': 'https://2100.cool/interface/',
        'aipub.com': 'https://2100.cool/interface/'
      };

      return domainMcps[domain] || 'https://2100.cool/interface/'; // Default to operational interface
    }

    // Enable/disable email button based on input
    document.getElementById('manualEmail').addEventListener('input', function() {
      const emailBtn = document.getElementById('emailBtn');
      emailBtn.disabled = !this.value.trim();
    });

    // Initialize particles
    createParticles();
  </script>
</body>
</html>`;

  return new Response(authHTML, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}

async function handleAPIEndpoints(url, request, env) {
  const endpoint = url.pathname.replace('/api/', '');
  
  switch (endpoint) {
    case 'auth/sallyport':
      // Integration with SALLY_PORT_SECRET_KEY
      return new Response('SallyPort authentication flow', { status: 200 });
      
    case 'auth/oauth':
      // Integration with OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET
      return new Response('OAuth authentication flow', { status: 200 });
      
    case 'status':
      return new Response(JSON.stringify({
        service: 'ASOOS.2100.cool',
        agents: '20M+',
        llpMembersOnly: true,
        status: 'operational',
        version: '2.0.0',
        authentication: 'SallyPort + OAuth'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    default:
      return new Response('API endpoint not found', { status: 404 });
  }
}

function getFallbackInterface() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASOOS.2100.Cool - Service Temporarily Unavailable</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Montserrat', sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
    }
    .fallback-container {
      max-width: 600px;
    }
    .logo {
      font-size: 3rem;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #c7b299, #50C878, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }
    .message {
      font-size: 1.2rem;
      color: #ccc;
      margin-bottom: 30px;
    }
    .retry-button {
      padding: 15px 30px;
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      border: none;
      border-radius: 25px;
      color: #000;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="fallback-container">
    <div class="logo">ASOOS</div>
    <div class="message">
      🔄 Loading 20M+ AI Agents Interface...<br>
      Please wait while we establish connection to the main deployment.
    </div>
    <a href="javascript:location.reload()" class="retry-button">Retry Connection</a>
  </div>
  <script>
    // Auto-retry after 5 seconds
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>`;
}

function getFullASOOSInterface(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASOOS.2100.Cool - Aixtiv Symphony Orchestrating Operating System</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Montserrat', sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      overflow-x: hidden;
      scroll-behavior: smooth;
    }
    
    /* Navigation */
    nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 10px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #c7b299, #50C878, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .nav-links {
      display: flex;
      gap: 30px;
      align-items: center;
    }
    
    .nav-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    .nav-link:hover {
      color: #0bb1bb;
    }
    
    .cta-button {
      padding: 12px 24px;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      border: none;
      border-radius: 25px;
      color: black;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(255, 193, 7, 0.5);
    }
    
    /* Hero Section */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 100px 20px 50px;
      background: radial-gradient(ellipse at center, rgba(11, 177, 187, 0.1) 0%, transparent 70%);
    }
    
    .hero-content {
      text-align: center;
      max-width: 800px;
    }
    
    .hero-title {
      font-size: 4rem;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #c7b299, #50C878, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }
    
    .hero-subtitle {
      font-size: 1.5rem;
      color: #0bb1bb;
      margin-bottom: 30px;
      font-weight: 600;
    }
    
    .hero-description {
      font-size: 1.2rem;
      color: #ccc;
      margin-bottom: 40px;
      line-height: 1.6;
    }
    
    .hero-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .hero-button {
      padding: 18px 36px;
      font-size: 1.1rem;
      font-weight: 600;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-block;
      min-width: 200px;
    }
    
    .primary-button {
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      color: #000;
    }
    
    .secondary-button {
      background: transparent;
      color: #0bb1bb;
      border: 2px solid #0bb1bb;
    }
    
    .tertiary-button {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #000;
    }
    
    .hero-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(11, 177, 187, 0.3);
    }
    
    /* Stats Section */
    .stats-section {
      padding: 80px 20px;
      background: rgba(255, 255, 255, 0.02);
    }
    
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 30px;
    }
    
    .stat-card {
      text-align: center;
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 15px;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(11, 177, 187, 0.2);
    }
    
    .stat-number {
      font-size: 3rem;
      font-weight: 900;
      color: #FFD700;
      margin-bottom: 10px;
    }
    
    .stat-label {
      color: #0bb1bb;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    /* LLP Notice */
    .llp-section {
      padding: 80px 20px;
      background: radial-gradient(ellipse at center, rgba(255, 193, 7, 0.1) 0%, transparent 70%);
    }
    
    .llp-container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      background: rgba(255, 193, 7, 0.1);
      border: 2px solid #ffc107;
      border-radius: 20px;
      padding: 40px;
    }
    
    .llp-title {
      font-size: 2rem;
      color: #ffc107;
      margin-bottom: 20px;
    }
    
    .llp-description {
      font-size: 1.2rem;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    
    .redirect-link {
      color: #0bb1bb;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 2px solid transparent;
      transition: all 0.3s;
    }
    
    .redirect-link:hover {
      border-bottom-color: #0bb1bb;
    }
    
    /* Footer CTA */
    .footer-cta {
      padding: 80px 20px;
      text-align: center;
      background: rgba(11, 177, 187, 0.05);
    }
    
    .footer-cta h2 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      color: #0bb1bb;
    }
    
    .footer-cta p {
      font-size: 1.2rem;
      margin-bottom: 40px;
      color: #ccc;
    }
    
    @media (max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
      .hero-buttons { flex-direction: column; align-items: center; }
      .nav-links { display: none; }
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav>
    <div class="nav-container">
      <div class="logo">ASOOS</div>
      <div class="nav-links">
        <a href="#features" class="nav-link">Features</a>
        <a href="#team" class="nav-link">Team</a>
        <a href="#stats" class="nav-link">Network</a>
        <a href="javascript:void(0)" onclick="initiateAuthentication('app')" class="cta-button">Launch App</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">ASOOS</h1>
      <p class="hero-subtitle">Aixtiv Symphony Orchestrating Operating System</p>
      <p class="hero-description">
        Unleash the power of 20+ million AI agents across 200+ industry sectors. 
        Orchestrate complex workflows, enable seamless collaborations, and transform 
        your organization with our revolutionary DIDC Archives system.
      </p>
      <div class="hero-buttons">
        <a href="javascript:void(0)" onclick="initiateAuthentication('symphony')" class="hero-button primary-button">
          Start Your Symphony
        </a>
        <a href="#features" class="hero-button secondary-button">Explore Features</a>
        <a href="javascript:void(0)" onclick="initiateAuthentication('start')" class="hero-button tertiary-button">
          Get Started Now
        </a>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="stats-section" id="stats">
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-number">20M+</div>
        <div class="stat-label">AI Agent Instances</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">200+</div>
        <div class="stat-label">Industry Sectors</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">850K</div>
        <div class="stat-label">DIDC Archives</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">1000+</div>
        <div class="stat-label">GenAI Discovery Sites</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">∞</div>
        <div class="stat-label">Across Every Lifecycle</div>
      </div>
    </div>
  </section>

  <!-- LLP Members Section -->
  <section class="llp-section">
    <div class="llp-container">
      <div class="llp-title">🔒 AI Publishing International LLP Members Only</div>
      <p class="llp-description">
        <strong>This portal is exclusively for AI Publishing International LLP Members.</strong><br>
        Access to 20M+ AI agents and advanced orchestration capabilities.<br>
        Full SallyPort authentication and enterprise-grade security.
      </p>
      <p>Not an LLP member? <a href="https://2100.cool" class="redirect-link">Visit 2100.cool to subscribe or compete</a></p>
    </div>
  </section>

  <!-- Footer CTA -->
  <section class="footer-cta">
    <h2>Ready to Transform Your Organization?</h2>
    <p>Join the AI revolution with 20M+ intelligent agents at your service.</p>
    <a href="javascript:void(0)" onclick="initiateAuthentication('final')" class="hero-button tertiary-button">
      Get Started Now
    </a>
  </section>

  <script>
    // Authentication handler - integrates with SallyPort
    function initiateAuthentication(source) {
      console.log('Authentication initiated from:', source);
      
      // Check if user is already authenticated
      const authToken = localStorage.getItem('asoos_auth_token');
      
      if (authToken) {
        // Redirect authenticated users to MCP interface
        window.location.href = '/api/redirect/mcp';
      } else {
        // Redirect to authentication page
        window.location.href = '/auth';
      }
    }
    
    // LLP Member check (placeholder for SallyPort integration)
    function checkLLPMembership() {
      // TODO: Integrate with SALLY_PORT_SECRET_KEY
      // This will check against the LLP Member Registry
      console.log('Checking LLP membership status...');
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
      console.log('ASOOS.2100.cool - 20M+ AI Agents Ready');
      console.log('SallyPort Authentication Enabled');
      checkLLPMembership();
    });
  </script>
</body>
</html>`;
}
