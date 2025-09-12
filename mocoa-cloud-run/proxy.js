// Universal MCP Proxy - Connects to both ASOOS Master MCP and Universal Orchestrator
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// MCP Configuration
const MCP_CONFIG = {
  ASOOS_MASTER_MCP: 'https://asoos-master-mcp-mocoa-west-859242575175.us-west1.run.app',
  UNIVERSAL_ORCHESTRATOR: 'https://universal-gateway-859242575175.us-west1.run.app',
  MCP_AIPUB: 'https://mcp-aipub-proxy-859242575175.us-west1.run.app'
};

// MCP Routes - Forward to appropriate MCP
app.use('/api/orchestrator', createProxyMiddleware({
  target: MCP_CONFIG.ASOOS_MASTER_MCP,
  changeOrigin: true,
  pathRewrite: {'^/api/orchestrator' : '/api/orchestrate'},
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('X-MCP-Service', 'mocoa-interface');
    proxyReq.setHeader('X-Universal-Orchestrator', 'true');
  }
}));

// Universal Orchestrator Routes
app.use('/api/universal', createProxyMiddleware({
  target: MCP_CONFIG.UNIVERSAL_ORCHESTRATOR,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('X-Service-Source', 'mocoa-interface');
  }
}));

// AIPUB MCP Routes
app.use('/api/aipub', createProxyMiddleware({
  target: MCP_CONFIG.MCP_AIPUB,
  changeOrigin: true,
  pathRewrite: {'^/api/aipub' : '/api'},
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('X-Interface', 'MOCOA-AIPUB');
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mocoa-interface' });
});

app.listen(PORT, () => {
  console.log(`MOCOA Interface running on port ${PORT}`);
  console.log(`Connected to ASOOS Master MCP: ${MCP_CONFIG.ASOOS_MASTER_MCP}`);
  console.log(`Connected to Universal Orchestrator: ${MCP_CONFIG.UNIVERSAL_ORCHESTRATOR}`);
  console.log(`Connected to AIPUB MCP: ${MCP_CONFIG.MCP_AIPUB}`);
});
