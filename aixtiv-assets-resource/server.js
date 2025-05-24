const express = require('express');
const { QuantumMCP } = require('./quantum-mcp');
const config = require('./config');
const app = express();

app.use(express.json());

const quantumMCP = new QuantumMCP(config);

app.get('/mcp/status', (req, res) => {
  res.json({
    status: 'operational',
    config: config.core,
    state: config.state,
    coherence: {
      primary: quantumMCP.getPrimaryCoherence(),
      secondary: quantumMCP.getSecondaryCoherence(),
    },
  });
});

app.post('/mcp/sync', async (req, res) => {
  try {
    const syncResult = await quantumMCP.synchronize();
    res.json(syncResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/verify', async (req, res) => {
  try {
    const verificationResult = await quantumMCP.verify();
    res.json(verificationResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/transform', async (req, res) => {
  try {
    const transformResult = await quantumMCP.transform(req.body);
    res.json(transformResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res, next) => {
  quantumMCP.monitorState();
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Quantum MCP Server running on port ${PORT}`);
  console.log(
    'Configuration loaded from:',
    process.env.HOME + '/claude_desktop_config.json'
  );
  console.log('Primary state coherence:', quantumMCP.getPrimaryCoherence());
  console.log('Secondary state coherence:', quantumMCP.getSecondaryCoherence());
});

module.exports = app;
