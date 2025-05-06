/**
 * Server.js - Entry point for Cloud Run
 *
 * This file imports Firebase functions from index.js and sets them up as Express routes
 * to be served directly from Cloud Run without requiring the Firebase Functions runtime.
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Import Firebase Admin SDK
const admin = require('firebase-admin');
admin.initializeApp();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import function handlers from index.js
const index = require('./index');

// Root route for health checks
app.get('/', (req, res) => {
  res.status(200).send('Server is running');
});

// Map each Firebase function to an Express route
// Note: We can't call .run() on these functions as they're already Express handlers
// Instead, we extract the actual handler function and use it directly

// Extract the handler function from each Firebase function
const extractHandler = firebaseFunction => {
  return firebaseFunction._handler || firebaseFunction.__trigger.func;
};

// Set up routes for each function
app.all('/helloWorld', (req, res) => {
  // Pass the request and response objects to the handler
  index.helloWorld(req, res);
});

app.all('/convertTextToSpeech', (req, res) => {
  index.convertTextToSpeech(req, res);
});

app.all('/convertSsmlToSpeech', (req, res) => {
  index.convertSsmlToSpeech(req, res);
});

app.all('/listTtsVoices', (req, res) => {
  index.listTtsVoices(req, res);
});

app.all('/analyzeSentiment', (req, res) => {
  index.analyzeSentiment(req, res);
});

app.all('/analyzeEntities', (req, res) => {
  index.analyzeEntities(req, res);
});

app.all('/analyzeText', (req, res) => {
  index.analyzeText(req, res);
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
