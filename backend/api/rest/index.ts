/**
 * REST API Router
 * Configures all REST API routes with OAuth2 authentication
 */

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Import route modules
import authRoutes from './auth/routes';
import productRoutes from './products/routes';
import videoRoutes from './video/routes';
import speechRoutes from './speech/routes';

// Express application
const app = express();

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for OAuth state and token storage
app.use(session({
  secret: process.env.SESSION_SECRET || 'asoos-api-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  genid: () => uuidv4()
}));

// API Routes
app.use('/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/speech', speechRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'api-for-warp-drive'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'ASOOS API',
    version: '1.0.0',
    description: 'API for ASOOS services with OAuth2 authentication',
    endpoints: {
      auth: [
        { path: '/auth/login', method: 'GET', description: 'Start OAuth2 authentication flow' },
        { path: '/auth/callback', method: 'GET', description: 'OAuth2 callback after authorization' },
        { path: '/auth/refresh', method: 'GET', description: 'Refresh OAuth2 access token' },
        { path: '/auth/logout', method: 'GET', description: 'Log out user and clear session' },
        { path: '/auth/token', method: 'GET', description: 'Get information about current access token' }
      ],
      products: [
        { path: '/api/products', method: 'GET', description: 'Get all products' },
        { path: '/api/products/category/:category', method: 'GET', description: 'Get products by category' },
        { path: '/api/products/search', method: 'GET', description: 'Search products by keyword' },
        { path: '/api/products', method: 'POST', description: 'Add a new product (protected)', scopes: ['api.products.write'] },
        { path: '/api/products/:id', method: 'PUT', description: 'Update a product (protected)', scopes: ['api.products.write'] },
        { path: '/api/products/:id', method: 'DELETE', description: 'Delete a product (protected)', scopes: ['api.products.write'] }
      ],
      video: [
        { path: '/api/video/rooms', method: 'POST', description: 'Create a new video room (protected)', scopes: ['api.video.write'] },
        { path: '/api/video/rooms/:roomId', method: 'GET', description: 'Validate a video room (protected)', scopes: ['api.video.read'] },
        { path: '/api/video/rooms/:roomId', method: 'DELETE', description: 'Delete a video room (protected)', scopes: ['api.video.write'] }
      ],
      speech: [
        { path: '/api/speech/languages', method: 'GET', description: 'Get supported languages' },
        { path: '/api/speech/voices/:languageCode', method: 'GET', description: 'Get voices for a language' },
        { path: '/api/speech/tts', method: 'POST', description: 'Convert text to speech (protected)', scopes: ['api.speech.write'] },
        { path: '/api/speech/tts/base64', method: 'POST', description: 'Convert text to speech with base64 response (protected)', scopes: ['api.speech.write'] },
        { path: '/api/speech/stt/upload', method: 'POST', description: 'Convert speech to text from file upload (protected)', scopes: ['api.speech.write'] },
        { path: '/api/speech/stt/base64', method: 'POST', description: 'Convert speech to text from base64 audio (protected)', scopes: ['api.speech.write'] },
        { path: '/api/speech/detect-language', method: 'POST', description: 'Detect language of text (protected)', scopes: ['api.speech.read'] },
        { path: '/api/speech/translate', method: 'POST', description: 'Translate text (protected)', scopes: ['api.speech.write'] }
      ]
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: {
      message,
      code: err.code || 'server_error',
      status: statusCode
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      code: 'not_found',
      status: 404
    }
  });
});

export default app;