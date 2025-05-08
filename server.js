const http = require('http');
const url = require('url');
const sallyPort = require('./auth/sallyport');

const PORT = process.env.PORT || 8080;
console.log(`Starting server on port ${PORT}`);

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Root path handler
  if (path === '/' || path === '') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'ASOOS Integration Gateway',
      version: '1.0.0',
      endpoints: [
        { path: '/', description: 'Service information' },
        { path: '/health', description: 'Health check endpoint' },
        { path: '/token', description: 'Generate test token' },
        { path: '/protected', description: 'Protected endpoint (requires auth)' }
      ],
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Health check
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  
  // Generate token
  if (path === '/token') {
    const token = sallyPort.generateToken();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token }));
    return;
  }
  
  // Protected endpoint
  if (path === '/protected') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    
    const token = authHeader.substring(7);
    const result = await sallyPort.verifyToken(token);
    
    if (!result.valid) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Authenticated successfully',
      user: {
        id: result.userId,
        roles: result.roles
      }
    }));
    return;
  }
  
  // Default route
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `Endpoint ${path} not found`,
    availableEndpoints: ['/', '/health', '/token', '/protected']
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log('Available endpoints:');
  console.log('- / : Service information');
  console.log('- /health : Health check');
  console.log('- /token : Generate test token');
  console.log('- /protected : Protected endpoint (requires auth)');
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
