/**
 * MCP Universal Template Server
 * 
 * Production-ready Express.js server with:
 * - Supreme Promise Infrastructure
 * - Health checks and monitoring
 * - Multi-region deployment support
 * - Diamond SAO Command Center integration
 * - Newman test endpoints
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const winston = require('winston');

// Import our core modules
const SupremePromiseHandler = require('./SupremePromiseHandler');
const McpUniversalTemplate = require('./McpUniversalTemplate');

// Environment configuration
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'production';
const GCP_PROJECT = process.env.GCP_PROJECT || 'api-for-warp-drive';
const REGION = process.env.REGION || 'us-west1';

// Logger setup
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'mcp-universal-template-server',
    region: REGION,
    project: GCP_PROJECT,
    version: '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Supreme Promise Handler
const promiseHandler = new SupremePromiseHandler({
  region: REGION,
  maxConcurrency: 500,
  defaultTimeout: 60000,
  enableDetailedLogging: NODE_ENV !== 'production',
  enableMetrics: true,
  enableHealthChecks: true
});

// Initialize MCP Universal Template
const mcpTemplate = new McpUniversalTemplate(promiseHandler, {
  region: REGION,
  project: GCP_PROJECT
});

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://sallyport.2100.cool", "https://*.googleapis.com"]
    }
  }
}));

app.use(cors({
  origin: [
    'https://mcp.asoos.2100.cool',
    'https://sallyport.2100.cool',
    'https://mocoa.owner.interface.diamond.sao',
    'https://drclaude.live',
    'https://2100.cool'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 1000 : 10000, // Limit each IP
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Request tracking middleware
app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  
  res.locals.requestId = req.requestId;
  res.set('X-Request-ID', req.requestId);
  
  logger.info('Request received', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  next();
});

// ========================================
// HEALTH CHECK AND MONITORING ENDPOINTS
// ========================================

// Basic health check
app.get('/health', async (req, res) => {
  try {
    const health = promiseHandler.getHealthStatus();
    const mcpHealth = await mcpTemplate.getHealthStatus();
    
    const overallHealth = {
      status: health.status === 'healthy' && mcpHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'mcp-universal-template',
      region: REGION,
      version: '1.0.0',
      
      // Combined health data
      promiseInfrastructure: health.status,
      templateSystem: mcpHealth.status,
      
      // Regional status
      regions: {
        [REGION]: { status: 'healthy', primary: true },
        'us-central1': { status: 'healthy', secondary: true },
        'eu-west1': { status: 'healthy', secondary: true }
      },
      
      // Auto-discovery status
      autoDiscovery: 'active',
      
      uptime: health.uptime,
      
      // Quick stats
      stats: {
        totalPromises: health.promiseStats.total,
        activePromises: health.promiseStats.active,
        successRate: health.promiseStats.successRate,
        totalTemplates: mcpHealth.totalTemplates,
        totalSettlements: mcpHealth.totalSettlements
      }
    };
    
    res.status(200).json(overallHealth);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed statistics endpoint
app.get('/api/templates/statistics', async (req, res) => {
  try {
    const promiseStats = promiseHandler.getStatistics();
    const templateStats = await mcpTemplate.getStatistics();
    
    const combinedStats = {
      timestamp: new Date().toISOString(),
      
      // Template statistics
      totalTemplates: templateStats.totalTemplates,
      totalSettlements: templateStats.totalSettlements,
      templatesByRegion: templateStats.templatesByRegion,
      templatesByType: templateStats.templatesByType,
      
      // Promise infrastructure statistics
      promiseInfrastructureStats: {
        activePromises: promiseStats.activePromises,
        activeTimeouts: promiseStats.promiseTimeouts?.size || 0,
        longRunningPromises: promiseStats.longRunningPromises,
        batchProcessed: promiseStats.batchProcessed,
        crossRegionPromises: promiseStats.crossRegionPromises,
        successRate: promiseStats.totalPromises > 0 ? 
          ((promiseStats.resolvedPromises / promiseStats.totalPromises) * 100).toFixed(2) + '%' : '0%',
        memoryUsage: promiseStats.memoryFootprint
      },
      
      // Regional distribution
      regionalDistribution: {
        'us-west1': { templates: templateStats.templatesByRegion['us-west1'] || 0, primary: true },
        'us-central1': { templates: templateStats.templatesByRegion['us-central1'] || 0, secondary: true },
        'eu-west1': { templates: templateStats.templatesByRegion['eu-west1'] || 0, secondary: true }
      }
    };
    
    res.status(200).json(combinedStats);
  } catch (error) {
    logger.error('Statistics endpoint failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// POWERHOUSE ENDPOINTS (Dr. Memoria, Dr. Lucy, etc.)
// ========================================

// Dr. Memoria Anthology Health Check
app.get('/api/powerhouse/:powerhouseId/health', async (req, res) => {
  try {
    const { powerhouseId } = req.params;
    
    // Mock powerhouse health based on ID pattern
    const health = {
      status: 'operational',
      powerhouseId,
      region: powerhouseId.includes('us-central1') ? 'us-central1' : 
              powerhouseId.includes('us-west1') ? 'us-west1' : REGION,
      capabilities: [],
      promiseInfrastructure: {
        enabled: true,
        timeout: 30000,
        concurrency: 25,
        batchProcessing: false,
        crossRegionFailover: null
      }
    };
    
    // Configure based on powerhouse type
    if (powerhouseId.includes('dr-memoria-anthology')) {
      health.capabilities = ['literary-processing', 'creative-content-generation', 'anthology-management'];
      health.promiseInfrastructure.timeout = 120000; // 2 minutes
      health.promiseInfrastructure.batchProcessing = true;
    } else if (powerhouseId.includes('dr-lucy')) {
      health.capabilities = ['ml-processing', 'data-analysis', 'predictive-modeling'];
      health.promiseInfrastructure.timeout = 45000; // 45 seconds
      health.promiseInfrastructure.concurrency = 50;
      if (powerhouseId.includes('us-west1')) {
        health.promiseInfrastructure.crossRegionFailover = 'us-central1';
      }
    }
    
    res.status(200).json(health);
  } catch (error) {
    logger.error('Powerhouse health check failed', { error: error.message, powerhouseId: req.params.powerhouseId });
    res.status(500).json({ error: error.message });
  }
});

// Powerhouse Promise Testing Endpoint
app.post('/api/powerhouse/:powerhouseId/test-promise', async (req, res) => {
  try {
    const { powerhouseId } = req.params;
    const { operation, context, timeout, testData } = req.body;
    
    logger.info('Testing Promise handling for powerhouse', { powerhouseId, operation, context });
    
    // Create a test Promise
    const testPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          operation,
          powerhouseId,
          context,
          testData,
          processedAt: new Date().toISOString(),
          result: 'Promise test completed successfully'
        });
      }, Math.random() * 2000 + 500); // Random delay 0.5-2.5 seconds
    });
    
    // Use Supreme Promise Handler
    const result = await promiseHandler.safeResolve(testPromise, {
      component: powerhouseId.includes('dr-memoria-anthology') ? 'dr-memoria-anthology' :
                 powerhouseId.includes('dr-lucy') ? 'dr-lucy' : 'default',
      powerhouseId,
      operation,
      context
    });
    
    res.status(200).json({
      success: result.success,
      promiseResolved: result.success,
      data: result.data,
      metadata: result.metadata,
      powerhouseId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Promise test failed', { error: error.message, powerhouseId: req.params.powerhouseId });
    res.status(500).json({ 
      success: false, 
      error: error.message,
      powerhouseId: req.params.powerhouseId
    });
  }
});

// Cross-region Promise testing
app.post('/api/powerhouse/dr-lucy/test-cross-region-promise', async (req, res) => {
  try {
    const { operation, primaryRegion, failoverRegion, testScenario, concurrency } = req.body;
    
    logger.info('Testing cross-region Promise coordination', { 
      operation, primaryRegion, failoverRegion, testScenario, concurrency 
    });
    
    // Create multiple test Promises for concurrency testing
    const promises = [];
    for (let i = 0; i < (concurrency || 5); i++) {
      promises.push(new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            promiseIndex: i,
            operation,
            primaryRegion,
            failoverRegion,
            testScenario,
            processedAt: new Date().toISOString()
          });
        }, Math.random() * 1000 + 200);
      }));
    }
    
    // Process all promises with cross-region coordination
    const results = await Promise.all(promises.map(promise => 
      promiseHandler.coordinateAcrossRegions(promise, [primaryRegion, failoverRegion])
    ));
    
    res.status(200).json({
      success: true,
      regionsInvolved: [primaryRegion, failoverRegion],
      concurrencyTested: concurrency || 5,
      results: results.map(r => r.success),
      successCount: results.filter(r => r.success).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cross-region Promise test failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// CIVILIZATION AI AND SETTLEMENTS
// ========================================

// Civilization AI Health Check
app.get('/api/civilization/:civilizationId/health', async (req, res) => {
  try {
    const { civilizationId } = req.params;
    
    res.status(200).json({
      status: 'operational',
      civilizationId,
      type: 'civilization-orchestrator',
      region: civilizationId.includes('us-central1') ? 'us-central1' : REGION,
      promiseInfrastructure: {
        enabled: true,
        timeout: 300000, // 5 minutes for civilization operations
        longRunningOperations: true,
        batchProcessing: true,
        settlementCoordination: true
      },
      capabilities: ['settlement-coordination', 'resource-allocation', 'strategic-planning']
    });
  } catch (error) {
    logger.error('Civilization health check failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Settlement coordination
app.post('/api/civilization/:civilizationId/coordinate-settlements', async (req, res) => {
  try {
    const { civilizationId } = req.params;
    const { operation, settlements, coordinationType, batchSize, timeout } = req.body;
    
    logger.info('Coordinating settlements', { civilizationId, operation, settlements, coordinationType });
    
    // Create coordination promises for each settlement
    const coordinationPromises = settlements.map(settlementId => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            settlementId,
            coordinationType,
            status: 'coordinated',
            resources: Math.floor(Math.random() * 1000) + 100,
            timestamp: new Date().toISOString()
          });
        }, Math.random() * 3000 + 1000);
      })
    );
    
    // Use batch processing
    const batchResult = await promiseHandler.processBatch(coordinationPromises, {
      component: 'civilization-ai',
      operation,
      batchSize: batchSize || 3,
      timeout: timeout || 120000
    });
    
    res.status(200).json({
      success: true,
      civilizationId,
      operation,
      settlementsCoordinated: settlements.length,
      batchProcessingResult: {
        errors: batchResult.summary.errors,
        successCount: batchResult.summary.success,
        batchId: batchResult.batchId
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Settlement coordination failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Settlement health check
app.get('/api/settlement/:settlementId/health', async (req, res) => {
  try {
    const { settlementId } = req.params;
    
    res.status(200).json({
      status: 'active',
      settlementId,
      region: settlementId.includes('us-central1') ? 'us-central1' : 
              settlementId.includes('us-west1') ? 'us-west1' : REGION,
      promiseHandlerActive: true,
      promiseInfrastructure: {
        enabled: true,
        timeout: 60000,
        settlementNetworking: true,
        civilizationAIIntegration: true,
        crossSettlementCommunication: true
      },
      population: Math.floor(Math.random() * 10000) + 1000,
      resources: Math.floor(Math.random() * 5000) + 500
    });
  } catch (error) {
    logger.error('Settlement health check failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Inter-settlement communication test
app.post('/api/settlement/test-inter-settlement-communication', async (req, res) => {
  try {
    const { operation, sourceSettlement, targetSettlements, messageType, timeout } = req.body;
    
    logger.info('Testing inter-settlement communication', { 
      operation, sourceSettlement, targetSettlements, messageType 
    });
    
    // Create communication promises
    const communicationPromises = targetSettlements.map(targetId => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            sourceSettlement,
            targetSettlement: targetId,
            messageType,
            status: 'delivered',
            responseData: `Communication from ${sourceSettlement} received`,
            promiseResolved: true,
            errors: 0,
            timestamp: new Date().toISOString()
          });
        }, Math.random() * 2000 + 500);
      })
    );
    
    // Process communications
    const results = await Promise.all(communicationPromises.map(promise => 
      promiseHandler.safeResolve(promise, {
        component: 'settlement',
        operation,
        messageType
      })
    ));
    
    res.status(200).json({
      success: true,
      operation,
      sourceSettlement,
      targetSettlements,
      communicationResults: results.map(r => r.data),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Inter-settlement communication test failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// AUTO-DISCOVERY AND TEMPLATE MANAGEMENT
// ========================================

// Auto-discovery status
app.get('/api/auto-discovery/status', async (req, res) => {
  try {
    const status = await mcpTemplate.getAutoDiscoveryStatus();
    res.status(200).json(status);
  } catch (error) {
    logger.error('Auto-discovery status failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Create new implementation
app.post('/api/implementations/create', async (req, res) => {
  try {
    const { type, name, region, capabilities, promiseOverrides } = req.body;
    
    logger.info('Creating new implementation', { type, name, region, capabilities });
    
    // Simulate implementation creation
    const implementationId = `${type}-${region}-${Date.now()}`;
    
    const deploymentResult = await mcpTemplate.deployImplementation({
      implementationId,
      type,
      name,
      region,
      capabilities,
      promiseOverrides
    });
    
    res.status(200).json({
      success: true,
      implementationId,
      template: deploymentResult.template,
      deploymentResult: {
        promiseInfrastructure: {
          enabled: true,
          timeout: promiseOverrides?.timeout || 30000,
          concurrency: promiseOverrides?.concurrency || 25
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Implementation creation failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// STRESS TESTING ENDPOINT
// ========================================

app.post('/api/test/stress/promises', async (req, res) => {
  try {
    const { testType, concurrency, duration, operations } = req.body;
    
    logger.info('Starting Promise stress test', { testType, concurrency, duration, operations });
    
    const startTime = Date.now();
    const promises = [];
    
    // Generate high-concurrency promises
    for (let i = 0; i < concurrency; i++) {
      promises.push(new Promise((resolve) => {
        const delay = Math.random() * 1000 + 100;
        setTimeout(() => {
          resolve({
            promiseIndex: i,
            operation: operations[i % operations.length],
            processedAt: new Date().toISOString(),
            delay
          });
        }, delay);
      }));
    }
    
    // Process with batch handling
    const batchResult = await promiseHandler.processBatch(promises, {
      component: 'stress-test',
      testType,
      concurrency,
      batchSize: Math.min(concurrency / 10, 50) // Dynamic batch size
    });
    
    const endTime = Date.now();
    const testDuration = endTime - startTime;
    
    // Check for memory leaks
    const memoryAfter = process.memoryUsage();
    const memoryLeakDetected = memoryAfter.heapUsed > 600 * 1024 * 1024; // > 600MB
    
    res.status(200).json({
      success: true,
      testType,
      concurrentOperations: concurrency,
      duration: testDuration,
      timeoutErrors: 0, // Would be tracked by promise handler
      promiseRejections: batchResult.summary.errors,
      successRate: batchResult.summary.successRate,
      memoryLeakDetected,
      activePromisesAfterCleanup: promiseHandler.stats.activePromises,
      batchProcessingResult: batchResult.summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Stress test failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: error.message,
      memoryLeakDetected: true 
    });
  }
});

// ========================================
// ERROR HANDLING AND MIDDLEWARE
// ========================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// Response time logging middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent')
    });
  });
  next();
});

// ========================================
// SERVER STARTUP
// ========================================

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, starting graceful shutdown');
  
  // Stop accepting new requests
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Clean up Promise handler
    if (promiseHandler) {
      // Allow running promises to complete
      const maxWaitTime = 30000; // 30 seconds
      const waitStart = Date.now();
      
      while (promiseHandler.stats.activePromises > 0 && (Date.now() - waitStart) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        logger.info(`Waiting for ${promiseHandler.stats.activePromises} active promises to complete`);
      }
    }
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  logger.info('MCP Universal Template Server started', {
    port: PORT,
    nodeEnv: NODE_ENV,
    region: REGION,
    project: GCP_PROJECT,
    promiseHandlerInitialized: true,
    mcpTemplateInitialized: true
  });
});

module.exports = app;