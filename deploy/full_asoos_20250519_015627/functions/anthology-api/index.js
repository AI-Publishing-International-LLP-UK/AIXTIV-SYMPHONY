/**
 * Dr. Memoria Anthology Integration Gateway
 * Main entry point for the application
 */

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import gateway implementations (to be created)
// const gateways = require('./gateways');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'anthology-integration-gateway' });
});

// Setup routes (to be expanded)
app.post('/api/integrate', (req, res) => {
  // Placeholder for integration logic
  res.status(200).json({ message: 'Integration request received', data: req.body });
});

// Start the server
app.listen(port, () => {
  console.log(`Integration Gateway running on port ${port}`);
});

module.exports = app; // Export for testing

