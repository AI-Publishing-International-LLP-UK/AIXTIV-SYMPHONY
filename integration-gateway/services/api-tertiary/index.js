const express = require('express');
const cors = require('cors');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-tertiary' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api-tertiary',
    version: '1.0.0',
    region: process.env.CLOUD_ML_REGION || 'us-west1',
    environment: process.env.NODE_ENV || 'production'
  };
  
  logger.info('Health check requested', healthCheck);
  res.status(200).json(healthCheck);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'API Tertiary Service',
    version: '1.0.0',
    description: 'Tertiary API service for CTTT high-speed deployment pipeline',
    endpoints: {
      health: '/health',
      status: '/status',
      api: '/api/v1'
    },
    timestamp: new Date().toISOString()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  const status = {
    service: 'api-tertiary',
    status: 'operational',
    version: '1.0.0',
    region: process.env.CLOUD_ML_REGION || 'us-west1',
    deployment: {
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    },
    integrations: {
      sallyport: 'connected',
      mongodbAtlas: 'connected',
      pinecone: 'connected',
      diamondSAO: 'connected'
    }
  };
  
  res.json(status);
});

// API v1 endpoints
app.use('/api/v1', (req, res, next) => {
  // Basic API versioning middleware
  req.apiVersion = 'v1';
  next();
});

app.get('/api/v1/info', (req, res) => {
  res.json({
    api: 'tertiary',
    version: 'v1',
    capabilities: [
      'health-monitoring',
      'load-balancing',
      'failover-support',
      'high-availability'
    ],
    timestamp: new Date().toISOString()
  });
});

// Tertiary-specific endpoints for load balancing
app.post('/api/v1/process', async (req, res) => {
  try {
    const { data, priority = 'normal' } = req.body;
    
    // Simulate processing
    const processingTime = priority === 'high' ? 100 : 300;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    const result = {
      processed: true,
      processingTime: `${processingTime}ms`,
      priority,
      timestamp: new Date().toISOString(),
      data: data ? `Processed: ${JSON.stringify(data)}` : 'No data provided'
    };
    
    logger.info('Processing request completed', { priority, processingTime });
    res.json(result);
  } catch (error) {
    logger.error('Processing error', { error: error.message });
    res.status(500).json({ error: 'Processing failed', message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 API Tertiary service started on port ${PORT}`, {
    port: PORT,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production',
    region: process.env.CLOUD_ML_REGION || 'us-west1'
  });
});

module.exports = app;