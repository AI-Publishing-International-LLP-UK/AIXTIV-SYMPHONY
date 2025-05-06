/**
 * server.js - A simple Express server to route requests to Firebase functions
 *
 * This file creates an Express server that receives HTTP requests and
 * forwards them to the appropriate Firebase Cloud Functions.
 */

const express = require('express');
const cors = require('cors');
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('./logger');

// Import Firebase functions
let functions;
try {
  functions = require('./index.js');
} catch (error) {
  logger.error(`Failed to import functions: ${error.message}`);
  process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dynamically create routes for each Firebase function
Object.entries(functions).forEach(([functionName, firebaseFunction]) => {
  const path = `/${functionName}`;
  logger.info(`Registering route: ${path}`);

  app.all(path, (req, res) => {
    try {
      // Extract the handler function from the Firebase function
      const handler =
        firebaseFunction._onRequestWithOptions ||
        firebaseFunction._onRequest ||
        firebaseFunction;

      // Call the handler directly with the Express request and response
      return handler(req, res);
    } catch (error) {
      logger.error(
        `Error executing function ${functionName}: ${error.message}`
      );
      res.status(500).send({ error: 'Internal server error' });
    }
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  logger.info('Press Ctrl+C to quit');
});

// Error handling for uncaught exceptions
process.on('uncaughtException', error => {
  logger.error(`Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
});
