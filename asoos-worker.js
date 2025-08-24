// ASOOS.2100.cool Worker - AI Publishing International LLP Members Only
// Serves 20M+ agents interface with LLP Member authentication logic

import htmlContent from './asoos-content.html';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Security Headers for all responses
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;",
      'Cache-Control': 'public, max-age=300'
    };

    // CORS headers for API endpoints
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: { ...securityHeaders, ...corsHeaders }
      });
    }

    // LLP Member Authentication Check
    const authHeader = request.headers.get('Authorization');
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    
    // Extract potential user identifier from various sources
    const forwardedFor = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
    const cfRay = request.headers.get('CF-Ray') || '';
    
    // LLP Member Registry - Known AI Publishing International LLP Members
    const LLP_MEMBERS = [
      'pr@coaching2100.com',    // Mr. Phillip Corey Roark - Diamond SAO
      'mo@coaching2100.com',    // Morgan O'Brien - Emerald EAO  
      'av@coaching2100.com',    // Alexander Oliveros - Emerald Member
      'et@coaching2100.com',    // Eduardo Testa - Emerald Member
      'jg@coaching2100.com',    // Joshua Galbreath - Emerald Member
      'uk@coaching2100.com',    // UK Administrator - Emerald UK
    ];

    // TODO: Implement proper LLP Member authentication
    // For now, we'll serve the interface but add authentication logic placeholder
    
    // Check if this is an API endpoint
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(url, request, env);
    }

    // Serve main ASOOS interface
    return new Response(getASOOSContent(), {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        ...securityHeaders,
        ...corsHeaders
      }
    });
  }
};

// API Handler for future endpoints
async function handleAPI(url, request, env) {
  const endpoint = url.pathname.replace('/api/', '');
  
  switch (endpoint) {
    case 'auth':
      return new Response(JSON.stringify({ 
        message: 'LLP Member authentication required',
        redirectUrl: 'https://2100.cool' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    
    case 'status':
      return new Response(JSON.stringify({
        service: 'ASOOS.2100.cool',
        agents: '20M+',
        llpMembersOnly: true,
        status: 'operational'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response('API endpoint not found', { status: 404 });
  }
}

// Get ASOOS Content - 20M+ agents interface
function getASOOSContent() {
  // This will be replaced with the actual HTML content
  // For now, return a placeholder that references the actual file
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASOOS - AI Publishing International LLP Members</title>
  <style>
    body {
      font-family: 'Montserrat', sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      text-align: center;
      padding: 50px;
    }
    .loading {
      font-size: 24px;
      margin-bottom: 20px;
    }
    .redirect-notice {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid #ffc107;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="loading">🔄 ASOOS Worker Active</div>
  <h1>AI Publishing International LLP Members Portal</h1>
  <p>20M+ AI Agents Interface</p>
  
  <div class="redirect-notice">
    <p><strong>⚠️ LLP Member Authentication Required</strong></p>
    <p>This portal is exclusively for AI Publishing International LLP Members.</p>
    <p>Non-members will be redirected to <a href="https://2100.cool" style="color: #ffc107;">2100.cool</a></p>
  </div>

  <script>
    // Placeholder for authentication logic
    console.log('ASOOS.2100.cool - LLP Members Only');
    console.log('Worker deployed successfully');
    
    // TODO: Implement LLP Member check
    // If not LLP Member: window.location.href = 'https://2100.cool';
  </script>
</body>
</html>`;
}
