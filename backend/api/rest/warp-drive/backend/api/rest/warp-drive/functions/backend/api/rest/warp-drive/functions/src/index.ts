import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express
const app = express();

// Add CORS middleware
app.use(cors({ origin: true }));

// Define routes
app.get('/hello', (req, res) => {
  res.status(200).json({
    message: 'Hello from Warp Drive API!',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
  });
});

app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  }
);

// Export the Express API as a Firebase Function
// Uses Node.js 18 runtime via package.json config
export const api = functions.https.onRequest(app);

// Additional standalone function example
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send('Hello from Firebase Warp Drive Functions!');
});
