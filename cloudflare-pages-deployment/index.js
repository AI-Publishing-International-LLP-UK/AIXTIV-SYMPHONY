// ASOOS.2100.Cool Worker - Serves Complete 1699-Line Page
// Fetches the full asoos-20m-agents-full.html from GitHub repository

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Handle auth page routing  
    if (url.pathname === '/auth') {
      return Response.redirect('https://asoos.2100.cool/cloudflare-pages-deployment/auth.html', 302);
    }
    
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
        features: '1699-line page with 20M+ AI Agents',
        source: 'GitHub Repository'
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
    
    // Default: Fetch and serve the complete 1699-line ASOOS page from GitHub
    try {
      const response = await fetch('https://raw.githubusercontent.com/AI-Publishing-International-LLP-UK/Aixtiv-Symphony-Opus1.0.1/production/asoos-20m-agents-full.html');
      
      if (!response.ok) {
        throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const htmlContent = await response.text();
      
      // Verify we got the full content (should be around 1699 lines)
      const lineCount = htmlContent.split('\n').length;
      console.log(`Serving ASOOS page: ${lineCount} lines`);
      
      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=1800', // 30 minutes
          'X-Source': 'GitHub-Repository',
          'X-Lines': lineCount.toString(),
          'X-Content-Length': htmlContent.length.toString()
        }
      });
      
    } catch (error) {
      console.error('Error fetching ASOOS content:', error);
      
      // Fallback error page with retry
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>ASOOS.2100.Cool - Loading...</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Montserrat', sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      text-align: center;
      padding: 50px 20px;
      margin: 0;
    }
    .loading {
      max-width: 600px;
      margin: 0 auto;
    }
    .logo {
      font-size: 48px;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #50C878, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }
    .status {
      color: #0bb1bb;
      margin: 20px 0;
    }
    button {
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      border: none;
      color: black;
      padding: 12px 30px;
      border-radius: 25px;
      font-weight: 600;
      cursor: pointer;
      margin: 20px 10px;
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="logo">ASOOS</div>
    <h2>🔄 Loading 20M+ AI Agents Interface...</h2>
    <div class="status">Fetching complete 1699-line interface from repository...</div>
    <p>Error: ${error.message}</p>
    <button onclick="window.location.reload()">🔄 Retry Loading</button>
    <button onclick="window.location.href='/health'">📊 Service Status</button>
  </div>
  
  <script>
    // Auto-retry after 3 seconds
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  </script>
</body>
</html>`, {
        status: 503,
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Retry-After': '3'
        }
      });
    }
  }
};
