const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const HOST = '127.0.0.1';

// Simple HTTP server using only Node.js built-in modules
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Route: Serve main HTML file
  if (pathname === '/' || pathname === '/index.html') {
    const filePath = path.join(__dirname, 'mocoa-current.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }
  
  // Route: Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'simple-server' }));
    return;
  }
  
  // Route: Mock GCP token
  if (pathname === '/api/gcp/token' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ access_token: 'mock-token-' + Date.now() }));
    return;
  }
  
  // Route: Dr. Claude health
  if (pathname === '/api/dr-claude/health') {
    const response = {
      quantum_state: 'STABLE',
      validation_hash: 'mock-hash-' + Date.now().toString(36),
      last_sync: new Date().toISOString(),
      dr_claude_active: true
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return;
  }
  
  // Route: Dr. Claude validate
  if (pathname === '/api/dr-claude/validate' && req.method === 'POST') {
    const response = {
      quantum_id: 'mock-q-' + Math.random().toString(36).slice(2, 10),
      validation_hash: 'mock-vh-' + Math.random().toString(36).slice(2, 10),
      dr_claude_approval: true
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return;
  }
  
  // Route: Mock ElevenLabs API key
  if (pathname.startsWith('/api/gcp/secrets/')) {
    const secretName = pathname.split('/').pop();
    if (secretName === 'elevenlabs-api-key') {
      const response = {
        name: `projects/api-for-warp-drive/secrets/${secretName}/versions/latest`,
        payload: { data: 'mock-api-key-for-testing' },
        state: 'ENABLED',
        source: 'mock-server'
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Secret not found' }));
    }
    return;
  }
  
  // Route: Mock TTS endpoint
  if (pathname === '/api/elevenlabs/tts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.text || !data.voice_id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'text and voice_id required' }));
          return;
        }
        
        const response = {
          success: true,
          message: 'Mock TTS - voice would be generated here',
          text: data.text,
          voice_id: data.voice_id,
          mock: true
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Route: Test TOO functionality
  if (pathname === '/api/test/too-functions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'TOO functions test endpoint',
      available_functions: [
        'toggleScanToApprove',
        'activateRIX',
        'activateSRIX', 
        'activateVICTORY36',
        'toggleCopilotMode',
        'sendCopilotMessage',
        'toggleConversationMode'
      ],
      status: 'Functions should be globally available in HTML'
    }));
    return;
  }
  
  // Route: Mock OAuth2 endpoints for voice
  if (pathname === '/auth/login') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Mock OAuth2 login',
      auth_url: 'http://127.0.0.1:8080/mock-auth',
      mock: true
    }));
    return;
  }
  
  if (pathname === '/auth/callback') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      access_token: 'mock-oauth-token-' + Date.now(),
      token_type: 'Bearer',
      mock: true
    }));
    return;
  }
  
  // Serve static files (CSS, JS, etc.)
  if (pathname.startsWith('/')) {
    const filePath = path.join(__dirname, pathname.slice(1));
    const ext = path.extname(filePath);
    
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }
  
  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Simple HTTP server running at http://${HOST}:${PORT}`);
  console.log(`📄 Serving mocoa-current.html`);
  console.log(`⚠️  This is a SIMPLE LOCAL SERVER - NO Promise issues, NO Cloudflare`);
  console.log(`🎤 Mock voice endpoints available for testing`);
  console.log(`\nPress Ctrl+C to stop`);
});
