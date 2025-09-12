// ASOOS.2100.Cool Landing Page Worker - Clean Version
// Serves the complete 20M+ AI Agents page with proper auth routing

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // NO /auth route needed - all CTAs go directly to sallyport.2100.cool
    // This matches the design: 10,000+ websites → sallyport.2100.cool → mcp.company.2100.cool
    
    // Handle owner interface redirect
    if (url.pathname === '/owner' || url.pathname === '/dashboard') {
      return Response.redirect('https://owner.2100.cool', 302);
    }
    
    // Handle health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'ASOOS.2100.Cool Landing Page',
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        agents: '20M+',
        features: 'Victory36 Protected Auth'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle robots.txt
    if (url.pathname === '/robots.txt') {
      return new Response(`User-agent: *\nDisallow: /cdn-cgi/\nAllow: /\n\nSitemap: https://asoos.2100.cool/sitemap.xml`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Default: Serve the main ASOOS landing page with 20M+ agents
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASOOS.2100.Cool - Aixtiv Symphony Orchestrating Operating System</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Montserrat', sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      margin: 0;
      padding: 50px 20px;
      text-align: center;
    }
    .logo {
      font-size: 48px;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #50C878, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }
    .subtitle {
      color: #aaa;
      font-size: 18px;
      margin-bottom: 40px;
    }
    .description {
      color: #ccc;
      font-size: 20px;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto 40px;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin: 40px 0;
      flex-wrap: wrap;
    }
    .stat {
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid rgba(11, 177, 187, 0.3);
    }
    .stat-number {
      font-size: 36px;
      font-weight: 900;
      color: #0bb1bb;
      margin-bottom: 10px;
    }
    .stat-label {
      color: #aaa;
      font-size: 14px;
    }
    .buttons {
      margin: 40px 0;
    }
    .btn {
      display: inline-block;
      padding: 15px 30px;
      margin: 10px;
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      color: black;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      transition: all 0.3s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(11, 177, 187, 0.3);
    }
    .btn-secondary {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="logo">ASOOS</div>
  <div class="subtitle">Aixtiv Symphony Orchestrating Operating System</div>
  <div class="description">
    Unleash the power of 20+ million AI agents across 200+ industry sectors. 
    Orchestrate complex workflows, enable seamless collaborations, and transform 
    your organization with our revolutionary DIDC Archives system.
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-number">20M+</div>
      <div class="stat-label">AI Agent Instances</div>
    </div>
    <div class="stat">
      <div class="stat-number">200+</div>
      <div class="stat-label">Industry Sectors</div>
    </div>
    <div class="stat">
      <div class="stat-number">850K</div>
      <div class="stat-label">DIDC Archives</div>
    </div>
    <div class="stat">
      <div class="stat-number">1.6M</div>
      <div class="stat-label">Workflows</div>
    </div>
  </div>
  
  <div class="buttons">
    <a href="https://sallyport.2100.cool" class="btn">🚀 Launch ASOOS</a>
    <a href="https://sallyport.2100.cool" class="btn">🎼 Start Your Symphony</a>
    <a href="https://sallyport.2100.cool" class="btn">✨ Get Started</a>
    <a href="/owner" class="btn btn-secondary">💎 Owner Portal</a>
  </div>
  
  <script>
    // All auth buttons route to /auth which redirects to proper auth page
    console.log('🔥 ASOOS.2100.Cool - 20M+ AI Agents Ready');
    console.log('🛡️ Victory36 Auth Protection: ACTIVE');
  </script>
</body>
</html>`;
    
    return new Response(html, {
      headers: { 
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
};
