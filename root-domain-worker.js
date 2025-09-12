// Root Domain Worker for 2100.cool
// Proxies requests to the main 2100-cool-primary Pages deployment

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Handle health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: '2100.Cool Root Domain Proxy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        target: '2100-cool-primary.pages.dev',
        features: '100M AI Agents, First Cohort Registration'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Proxy all requests to the main Pages deployment
    const targetUrl = `https://2100-cool-primary.pages.dev${url.pathname}${url.search}`;
    
    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
      });
      
      // Create new response with updated headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          'X-Proxy-Source': '2100-cool-primary.pages.dev',
          'X-Root-Domain': '2100.cool'
        }
      });
      
      return newResponse;
      
    } catch (error) {
      console.error('Proxy error:', error);
      
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>2100.Cool - Loading...</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 50px 20px;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 600px;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #FFD700, #FFA500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .status {
      font-size: 1.2rem;
      margin: 20px 0;
    }
    button {
      background: linear-gradient(45deg, #FFD700, #FFA500);
      border: none;
      color: black;
      padding: 15px 30px;
      border-radius: 25px;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
      margin: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>2100.Cool</h1>
    <div class="status">🔄 Loading AI Revolution Platform...</div>
    <p>Connecting to 100M+ AI Agents deployment...</p>
    <button onclick="window.location.reload()">🔄 Retry</button>
    <button onclick="window.location.href='https://asoos.2100.cool'">🚀 Visit ASOOS</button>
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
