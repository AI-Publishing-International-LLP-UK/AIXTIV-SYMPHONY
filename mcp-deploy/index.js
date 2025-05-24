const functions = require('firebase-functions');
const WebSocket = require('ws');
const http = require('http');
const mcpServer = require('./mcp-test-server');
const oauth2 = require('./oauth2-config');

// Initialize OAuth2 configuration
oauth2.initialize().catch(error => {
  console.error('OAuth2 initialization failed:', error);
});

// Firebase Cloud Function that serves the WebSocket server
exports.mcpServer = functions.https.onRequest((request, response) => {
  // For Upgrade requests (WebSocket protocol)
  if (request.headers.upgrade === 'websocket') {
    response.status(426).send('Upgrade Required');
    return;
  }

  // Health check endpoint
  if (request.path === '/health') {
    response.status(200).send({
      status: 'ok',
      message: 'MCP Server is running',
      version: '1.0.0',
    });
    return;
  }

  // OAuth2 callback endpoint
  if (request.path === '/oauth2/callback') {
    // Handle OAuth2 callback logic here
    response.status(200).send('OAuth2 callback received');
    return;
  }

  // Default response for other HTTP requests
  response
    .status(200)
    .send(
      'MCP Server is running. This endpoint supports WebSocket connections with the MCP protocol.'
    );
});

// Start the MCP server when this module is required
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Attach WebSocket event handlers
mcpServer.attachToServer(wss);

// Start server on local port for testing
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
