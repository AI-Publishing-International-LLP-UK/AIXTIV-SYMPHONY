const express = require('express');
const path = require('path');

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Quantum-Protection,X-Request-Type,X-Service-Account');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve static files
app.use(express.static('.'));
app.use(express.json());

// Serve the main interface (FIXED VERSION)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mocoa-current.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mocoa-owner-interface',
    version: 'fixed',
    javascript_fix: 'duplicate_function_resolved'
  });
});

// Mock API endpoints that the interface expects
app.post('/api/gcp/token', (req, res) => {
  res.json({ access_token: 'mock-token-' + Date.now() });
});

app.get('/api/dr-claude/health', (req, res) => {
  res.json({
    quantum_state: 'STABLE',
    validation_hash: 'valid-' + Date.now().toString(36),
    last_sync: new Date().toISOString(),
    dr_claude_active: true
  });
});

app.post('/api/dr-claude/validate', (req, res) => {
  res.json({
    quantum_id: 'q_' + Math.random().toString(36).slice(2, 10),
    validation_hash: 'vh_' + Math.random().toString(36).slice(2, 10),
    dr_claude_approval: true
  });
});

app.post('/api/dream-commander/pcp-request', (req, res) => {
  const { query } = req.body || {};
  const rixType = req.headers['x-rix-type'] || 'QB';
  
  // Simple Testament Swarm response
  let response = `I'm ${rixType} RIX from the Testament Swarm. I received your query: "${query}". All systems are operational with 505,001 agents ready to assist.`;
  
  res.json({
    requires_s2do_approval: false,
    response: response,
    testament_swarm_status: { status: 'operational', active_agents: 505001 },
    message: 'Processed via Testament Swarm'
  });
});

// Simple dashboard endpoints
app.get('/api/dashboard', (req, res) => {
  res.json({ projects_in_progress: 5, notifications: 2 });
});

app.get('/api/user/metrics', (req, res) => {
  res.json({ objectives_complete_pct: 85, pending_scan_to_do: 5 });
});

app.get('/api/system/status', (req, res) => {
  res.json({ status: 'operational', latency_ms: 42 });
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`🚀 MOCOA Fixed Interface running on port ${port}`);
  console.log(`🔧 JavaScript duplicate function issue RESOLVED`);
  console.log(`✅ Ready for demo!`);
});
