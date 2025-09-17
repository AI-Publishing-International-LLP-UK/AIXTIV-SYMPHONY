/**
 * MCP AIpub Proxy Service
 * Routes mcp.aipub.2100.cool to the working owner interface
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 8080;

// Target owner interface
const OWNER_INTERFACE_URL = 'https://mocoa-owner-interface-859242575175.us-west1.run.app';

console.log('🔗 MCP AIpub Proxy Service starting...');
console.log(`🎯 Target: ${OWNER_INTERFACE_URL}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mcp-aipub-proxy',
    target: OWNER_INTERFACE_URL,
    timestamp: new Date().toISOString()
  });
});

// Authentication callback handler - bypasses Sally Port intermediate page
app.get('/', (req, res, next) => {
  // Check if this is an authentication callback
  const { code, state, provider, company, email } = req.query;
    
  if (code || state || provider || company || email) {
    console.log('🔐 Authentication callback detected:', {
      code: code ? '***' : undefined,
      state: state,
      provider: provider,
      company: company,
      email: email
    });
        
    // Log successful authentication and proceed to proxy
    console.log('✅ Authentication successful, redirecting to owner interface');
  }
    
  // Continue to proxy middleware
  next();
});

// Proxy middleware configuration
const proxyOptions = {
  target: OWNER_INTERFACE_URL,
  changeOrigin: true,
  followRedirects: true,
  secure: true,
  headers: {
    'X-Forwarded-Host': 'mcp.aipub.2100.cool',
    'X-Forwarded-Proto': 'https'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`📡 Proxying: ${req.method} ${req.url} -> ${OWNER_INTERFACE_URL}${req.url}`);
        
    // Set proper headers for the target service
    proxyReq.setHeader('Host', 'mocoa-owner-interface-859242575175.us-west1.run.app');
    proxyReq.setHeader('Origin', OWNER_INTERFACE_URL);
    proxyReq.setHeader('Referer', OWNER_INTERFACE_URL);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Response: ${proxyRes.statusCode} for ${req.url}`);
        
    // Handle CORS if needed
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With';
        
    // Update any absolute URLs in HTML responses to use the proxy domain
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      delete proxyRes.headers['content-length'];
    }
  },
  onError: (err, req, res) => {
    console.error(`❌ Proxy error for ${req.url}:`, err.message);
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      target: OWNER_INTERFACE_URL,
      timestamp: new Date().toISOString()
    });
  }
};

// Apply proxy middleware to all routes except health check
app.use('/', createProxyMiddleware(proxyOptions));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Application error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 MCP AIpub Proxy Service running on port ${PORT}`);
  console.log(`🌐 Proxying all requests to: ${OWNER_INTERFACE_URL}`);
  console.log('💎 Ready to handle mcp.aipub.2100.cool traffic');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully');
  process.exit(0);
});
