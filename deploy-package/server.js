const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Latest ASOOS Configuration - Testament Swarm Connected
const ASOOS_CONFIG = {
  version: 'V99',
  title: 'Testament Swarm Connected',
  authority: 'Diamond SAO Command Center',
  features: 'Enhanced V99 Animations + Complete CLI Integration',
  timestamp: '2025-08-31T05:24:00Z'
};

console.log('🌟 ASOOS Owner Interface - Testament Swarm Connected V99');
console.log('💎 Latest Version from August 31st 05:24');
console.log('🚀 Enhanced V99 Animations + Complete CLI Integration');
console.log('');

// Serve static files
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'asoos-owner-interface-latest',
    version: ASOOS_CONFIG.version,
    title: ASOOS_CONFIG.title,
    authority: ASOOS_CONFIG.authority,
    features: ASOOS_CONFIG.features,
    source_timestamp: ASOOS_CONFIG.timestamp,
    deployed_at: new Date().toISOString()
  });
});

// Main route - serve the latest owner interface
app.get('/', (req, res) => {
  const interfaceFile = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(interfaceFile)) {
    console.log('🌟 Serving Latest ASOOS Owner Interface - Testament Swarm Connected V99');
    res.sendFile(interfaceFile);
  } else {
    res.status(404).json({
      error: 'Latest interface not found',
      available_files: fs.readdirSync(__dirname).filter(f => f.endsWith('.html'))
    });
  }
});

// API endpoint for enhanced features
app.post('/api/asoos-cli', express.json(), (req, res) => {
  const { command, parameters } = req.body;
  
  console.log(`🌟 ASOOS Latest CLI API called: ${command}`);
  
  res.json({
    asoos_latest: true,
    version: ASOOS_CONFIG.version,
    authority: ASOOS_CONFIG.authority,
    command: command,
    status: 'received',
    message: 'Latest ASOOS CLI command received - Testament Swarm Connected',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌟 Latest ASOOS Owner Interface running on port ${PORT}`);
  console.log(`🌐 Access: http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🚀 CLI API: http://localhost:${PORT}/api/asoos-cli`);
  console.log('');
  console.log('✅ Latest ASOOS Interface V99 - Testament Swarm Connected Active!');
});
