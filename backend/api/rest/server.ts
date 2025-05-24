/**
 * REST API Server
 * Starts the REST API server with OAuth2 authentication
 */

import dotenv from 'dotenv';
import http from 'http';
import app from './index';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`ASOOS REST API Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`OAuth2 configured for client: ${process.env.OAUTH_CLIENT_ID || 'api-for-warp-drive'}`);
  console.log(`Available at: http://localhost:${PORT}/api/docs`);
});

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default server;