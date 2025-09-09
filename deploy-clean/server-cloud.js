const express = require('express');
const path = require('path');
require('dotenv').config();
const winston = require('winston');
const packageJson = require('./package.json');

// ASOOS Flyer - Dr. Lucy ML + Professor Lee Integration
const { ConnectorManager } = require('./connectors');
const { ProfessorLeeCurationSystem } = require('./lib/professor-lee-curation');
const app = express();

const PORT = process.env.PORT || 8080;

// ASOOS Flyer system components
let connectorManager = null;
let curationSystem = null;
let asoosSystemStatus = {
  initialized: false,
  lastStartup: null,
  version: '2.0.0-ml-enhanced',
  components: {}
};

// Configure winston logger for cloud
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    })
  ]
});

// Add JSON and URL-encoded form support
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { 
    ip: req.ip, 
    userAgent: req.get('user-agent') 
  });
  next();
});

// Initialize ASOOS Flyer system components
async function initializeASOOSFlyer() {
  try {
    logger.info('🚀 Initializing ASOOS Flyer ML system...');
    
    // Initialize Connector Manager with all connectors
    connectorManager = new ConnectorManager();
    const connectorStatus = await connectorManager.initializeAllConnectors();
    asoosSystemStatus.components.connectors = connectorStatus;
    
    // Initialize Professor Lee Curation System
    curationSystem = new ProfessorLeeCurationSystem();
    await curationSystem.initialize();
    asoosSystemStatus.components.curation = 'initialized';
    
    asoosSystemStatus.initialized = true;
    asoosSystemStatus.lastStartup = new Date().toISOString();
    
    logger.info('✅ ASOOS Flyer ML system fully operational');
    logger.info('🤖 Available connectors:', connectorManager.getAvailableConnectors());
    logger.info('👨‍🏫 Professor Lee curation system ready');
    logger.info('🧠 AI-Human feedback loop active');
    
  } catch (error) {
    logger.error('❌ ASOOS Flyer initialization failed:', error);
    asoosSystemStatus.initialized = false;
    asoosSystemStatus.error = error.message;
  }
}

// Initialize ASOOS Flyer on startup
initializeASOOSFlyer();

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Express error', { error: err.message, stack: err.stack });
  res.status(500).json({ 
    status: 'error', 
    message: 'An internal server error occurred',
    requestId: req.id
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    asoosFlyerML: {
      status: asoosSystemStatus.initialized ? 'operational' : 'initializing',
      components: asoosSystemStatus.components,
      lastStartup: asoosSystemStatus.lastStartup
    }
  };
  
  res.status(200).json(healthStatus);
});

// Root path with API documentation
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ASOOS Flyer ML API - Cloud Operational',
    version: packageJson.version,
    system: 'Dr. Lucy ML + Professor Lee AI-Human Feedback Loop',
    endpoints: [
      {
        path: '/health',
        method: 'GET',
        description: 'Health check endpoint for monitoring'
      },
      {
        path: '/api/asoos/status',
        method: 'GET',
        description: '📊 ASOOS Flyer System Status'
      },
      {
        path: '/api/asoos/process',
        method: 'POST', 
        description: '🧠 ASOOS Flyer ML Processing - Dr. Lucy + Professor Lee',
        body: { organizations: 'array', connectors: 'array (optional)', options: 'object (optional)' }
      },
      {
        path: '/api/asoos/curate',
        method: 'POST',
        description: '👨‍🏫 Professor Lee Manual Curation',
        body: { organizations: 'array', options: 'object (optional)' }
      },
      {
        path: '/api/asoos/feedback',
        method: 'POST',
        description: '🔄 ML Feedback Loop',
        body: { organizationId: 'string', feedback: 'object' }
      },
      {
        path: '/api/asoos/test',
        method: 'POST',
        description: '🧪 Development testing endpoint',
        body: { testType: 'string (optional)' }
      }
    ]
  });
});

// ===========================================
// ASOOS FLYER ML API ENDPOINTS
// ===========================================

// ASOOS Flyer Status Endpoint
app.get('/api/asoos/status', (req, res) => {
  logger.info('ASOOS Flyer status request');
  
  const detailedStatus = {
    status: asoosSystemStatus.initialized ? 'operational' : 'initializing',
    version: asoosSystemStatus.version,
    lastStartup: asoosSystemStatus.lastStartup,
    initialized: asoosSystemStatus.initialized,
    components: {
      ...asoosSystemStatus.components,
      connectorManager: connectorManager ? 'ready' : 'not_initialized',
      professorLeeCuration: curationSystem ? 'ready' : 'not_initialized'
    },
    availableConnectors: connectorManager ? connectorManager.getAvailableConnectors() : [],
    timestamp: new Date().toISOString()
  };
  
  if (asoosSystemStatus.error) {
    detailedStatus.error = asoosSystemStatus.error;
  }
  
  res.json(detailedStatus);
});

// ASOOS Flyer ML Processing Endpoint
app.post('/api/asoos/process', async (req, res) => {
  if (!asoosSystemStatus.initialized) {
    return res.status(503).json({
      status: 'error',
      message: 'ASOOS Flyer system not yet initialized. Please try again in a moment.',
      systemStatus: asoosSystemStatus
    });
  }
  
  const { organizations, connectors, options = {} } = req.body;
  
  if (!organizations || !Array.isArray(organizations)) {
    return res.status(400).json({
      status: 'error',
      message: 'organizations array is required'
    });
  }
  
  const requestId = `asoos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('🧠 ASOOS Flyer ML processing request', {
    requestId,
    organizationCount: organizations.length,
    connectors: connectors || 'all',
    options
  });
  
  try {
    // Process organizations through ML pipeline
    const processingOptions = {
      useMLPipeline: true,
      enableFeedbackLoop: true,
      connectors: connectors || connectorManager.getAvailableConnectors(),
      ...options
    };
    
    const results = await connectorManager.processOrganizations(
      organizations,
      processingOptions
    );
    
    logger.info('✅ ASOOS Flyer ML processing completed', {
      requestId,
      processedCount: results.length,
      successCount: results.filter(r => r.status === 'success').length
    });
    
    res.json({
      status: 'success',
      requestId,
      processedCount: results.length,
      results,
      processingMetadata: {
        mlEnhanced: true,
        feedbackLoopActive: true,
        connectors: processingOptions.connectors,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('❌ ASOOS Flyer ML processing failed', {
      requestId,
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      requestId,
      message: 'ML processing failed',
      error: error.message
    });
  }
});

// Professor Lee Manual Curation Endpoint
app.post('/api/asoos/curate', async (req, res) => {
  if (!asoosSystemStatus.initialized || !curationSystem) {
    return res.status(503).json({
      status: 'error',
      message: 'Professor Lee curation system not available'
    });
  }
  
  const { organizations, options = {} } = req.body;
  
  if (!organizations || !Array.isArray(organizations)) {
    return res.status(400).json({
      status: 'error',
      message: 'organizations array is required'
    });
  }
  
  const requestId = `curation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('👨‍🏫 Professor Lee manual curation request', {
    requestId,
    organizationCount: organizations.length,
    options
  });
  
  try {
    const curationResults = await curationSystem.curateOrganizations(
      organizations,
      options
    );
    
    logger.info('✅ Professor Lee curation completed', {
      requestId,
      curatedCount: curationResults.length
    });
    
    res.json({
      status: 'success',
      requestId,
      curatedCount: curationResults.length,
      results: curationResults,
      curationMetadata: {
        professorLeeEnabled: true,
        humanReview: true,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('❌ Professor Lee curation failed', {
      requestId,
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      requestId,
      message: 'Manual curation failed',
      error: error.message
    });
  }
});

// ML Feedback Loop Endpoint
app.post('/api/asoos/feedback', async (req, res) => {
  if (!asoosSystemStatus.initialized || !curationSystem) {
    return res.status(503).json({
      status: 'error',
      message: 'ML feedback system not available'
    });
  }
  
  const { organizationId, feedback } = req.body;
  
  if (!organizationId || !feedback) {
    return res.status(400).json({
      status: 'error',
      message: 'organizationId and feedback are required'
    });
  }
  
  const requestId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('🔄 ML feedback loop submission', {
    requestId,
    organizationId,
    feedbackType: feedback.type || 'unknown'
  });
  
  try {
    const result = await curationSystem.submitFeedback(organizationId, feedback);
    
    logger.info('✅ ML feedback processed', {
      requestId,
      organizationId,
      result: result.status
    });
    
    res.json({
      status: 'success',
      requestId,
      result,
      feedbackMetadata: {
        organizationId,
        feedbackLoop: 'active',
        processed: true,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('❌ ML feedback processing failed', {
      requestId,
      organizationId,
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      requestId,
      message: 'Feedback processing failed',
      error: error.message
    });
  }
});

// ASOOS Flyer Test Endpoint
app.post('/api/asoos/test', async (req, res) => {
  if (!asoosSystemStatus.initialized) {
    return res.status(503).json({
      status: 'error',
      message: 'ASOOS Flyer system not initialized'
    });
  }
  
  const { testType = 'basic' } = req.body;
  
  logger.info('🧪 ASOOS Flyer test request', { testType });
  
  try {
    let testResult;
    
    switch (testType) {
    case 'connectors':
      testResult = {
        available: connectorManager.getAvailableConnectors(),
        status: await connectorManager.testAllConnectors()
      };
      break;
        
    case 'curation':
      testResult = await curationSystem.performHealthCheck();
      break;
        
    case 'ml_pipeline':
      const sampleOrg = {
        name: 'Test Organization',
        domain: 'test.com',
        metadata: { test: true }
      };
      testResult = await connectorManager.processOrganizations([sampleOrg], { test: true });
      break;
        
    default:
      testResult = {
        systemStatus: asoosSystemStatus,
        timestamp: new Date().toISOString(),
        message: 'Basic system test completed - ASOOS Flyer operational',
        cloudDeployment: true,
        mlSystemActive: true
      };
    }
    
    res.json({
      status: 'success',
      testType,
      result: testResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ ASOOS Flyer test failed', {
      testType,
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      testType,
      message: 'Test execution failed',
      error: error.message
    });
  }
});

// Graceful shutdown for ASOOS Flyer system
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  logger.info(`🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    if (connectorManager) {
      logger.info('🔌 Shutting down connectors...');
      await connectorManager.shutdown();
    }
    
    if (curationSystem) {
      logger.info('👨‍🏫 Shutting down Professor Lee system...');
      await curationSystem.shutdown();
    }
    
    logger.info('✅ ASOOS Flyer shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the server
app.listen(PORT, () => {
  logger.info(`🚀 ASOOS Flyer ML Server running on port ${PORT}`);
  logger.info('🌐 Cloud deployment operational');
  logger.info('📊 Health check: /health');
  logger.info('🧠 Dr. Lucy ML + Professor Lee AI-Human Feedback Loop ready');
});
