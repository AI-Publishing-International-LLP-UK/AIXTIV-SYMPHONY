const express = require('express');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();
const winston = require('winston');
const packageJson = require('./package.json');

// ASOOS Flyer - Dr. Lucy ML + Professor Lee Integration
const { ConnectorManager } = require('./connectors');
const { ProfessorLeeCurationSystem } = require('./lib/professor-lee-curation');
// const agentAuthRoutes = require('./src/examples/agent-auth-routes');
const { cloudflareAuthentication } = require('./middleware/cloudflare-auth');
const sallyportAuthentication = require('./middleware/sallyport-auth');
const { requestLogger, apiRateLimiter, sensitiveApiRateLimiter } = require('./middleware/rate-limiter');
const { demoBypassMiddleware, generateDemoUrl, getDemoStatus } = require('./src/middleware/demo-bypass-middleware');
const app = express();

const PORT = process.env.PORT || 3333;

// ASOOS Flyer system components
let connectorManager = null;
let curationSystem = null;
let asoosSystemStatus = {
  initialized: false,
  lastStartup: null,
  version: '2.0.0-ml-enhanced',
  components: {}
};

// Configure winston logger
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
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Validate required environment variables
const requiredEnvVars = ['PROJECT_ID', 'SERVICE_ACCOUNT', 'DR_CLAUDE_API'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.warn(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Add JSON and URL-encoded form support
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add security middleware
app.use(requestLogger);
// Add demo bypass middleware BEFORE authentication
app.use(demoBypassMiddleware);
app.use(cloudflareAuthentication);

// Import adaptive rate limiter
const { adaptiveRateLimiter } = require('./middleware/adaptive-rate-limiter');

// Apply rate limiting with preference for adaptive over basic
app.use('/api', adaptiveRateLimiter);
app.use('/agents', adaptiveRateLimiter);
app.use(apiRateLimiter); // Fallback for other routes

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

// Graceful error handling
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  // Give time for logs to be written before potential restart
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : 'No stack trace available'
  });
});

// Execute CLI command helper function
function executeCliCommand(command, args = {}, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const cliPath = path.join(__dirname, 'bin', 'aixtiv.js');
    
    // Convert args object to CLI arguments string
    const argsString = Object.entries(args)
      .map(([key, value]) => `--${key}=${value}`)
      .join(' ');
    
    const fullCommand = `node ${cliPath} ${command} ${argsString}`;
    logger.debug(`Executing CLI command: ${fullCommand}`);

    const childProcess = exec(fullCommand, { timeout }, (error, stdout, stderr) => {
      if (error) {
        logger.error(`CLI execution error`, { command, error: error.message, stderr });
        return reject(error);
      }

      try {
        // Try to parse as JSON if possible
        try {
          const jsonOutput = JSON.parse(stdout);
          return resolve(jsonOutput);
        } catch (e) {
          // If not JSON, return as text
          return resolve({ output: stdout.trim() });
        }
      } catch (parseError) {
        logger.error(`CLI output parse error`, { command, error: parseError.message });
        reject(parseError);
      }
    });
  });
}

// Health check endpoint for Cloud Run
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
    message: 'AIXTIV CLI API running',
    version: packageJson.version,
    endpoints: [
      {
        path: '/health',
        method: 'GET',
        description: 'Health check endpoint for monitoring'
      },
      {
        path: '/claude-code-generate',
        method: 'POST',
        description: 'Generate code using Claude AI',
        body: { task: 'string', language: 'string' }
      },
      {
        path: '/api/agent/grant',
        method: 'POST',
        description: 'Grant agent access to a resource',
        body: { email: 'string', agent: 'string', resource: 'string', type: 'string (optional)' }
      },
      {
        path: '/api/agent/revoke',
        method: 'POST',
        description: 'Revoke agent access to a resource',
        body: { email: 'string', agent: 'string', resource: 'string' }
      },
      {
        path: '/api/auth/verify',
        method: 'POST',
        description: 'Verify authentication with SallyPort',
        body: { email: 'string (optional)', agent: 'string (optional)' }
      },
      {
        path: '/api/copilot/list',
        method: 'GET',
        description: 'List co-pilots linked to a principal',
        query: { email: 'string (optional)', status: 'string (optional)' }
      },
      {
        path: '/api/claude/project/list',
        method: 'GET',
        description: 'List Claude projects',
        query: { status: 'string (optional)', tags: 'string (optional)', priority: 'string (optional)', limit: 'number (optional)' }
      },
      {
        path: '/api/github/files',
        method: 'POST',
        description: 'Access GitHub repository files with agent authentication',
        headers: { 'X-Agent-ID': 'string (required)', 'X-Agent-Type': 'string (optional)', 'X-Agent-Organization': 'string (optional)' },
        body: { action: 'string (list|get|search)', repositories: 'array of repository objects' }
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
        path: '/api/asoos/status',
        method: 'GET',
        description: '📊 ASOOS Flyer System Status'
      }
    ]
  });
});

// Keep the existing Claude code generation endpoint
app.post('/claude-code-generate', (req, res) => {
  const { task, language } = req.body;

  logger.info(`Received code generation request`, { task, language });

  // Call the actual CLI command instead of mock response
  executeCliCommand('claude:code:generate', { 
    task, 
    language: language || 'javascript' 
  })
  .then(result => {
    res.json(result);
  })
  .catch(error => {
    logger.error('Code generation failed', { error: error.message });
    res.status(500).json({ 
      status: 'error', 
      message: 'Code generation failed', 
      error: error.message 
    });
  });
});

// Add API endpoint for agent:grant command
app.post('/api/agent/grant', (req, res) => {
  const { email, agent, resource, type = 'full' } = req.body;
  
  if (!email || !agent || !resource) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Missing required parameters: email, agent, and resource are required' 
    });
  }

  executeCliCommand('agent:grant', { email, agent, resource, type })
    .then(result => {
      res.json({ status: 'success', result });
    })
    .catch(error => {
      logger.error('Agent grant failed', { error: error.message });
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to grant agent access', 
        error: error.message 
      });
    });
});

// Add API endpoint for agent:revoke command
app.post('/api/agent/revoke', (req, res) => {
  const { email, agent, resource } = req.body;
  
  if (!email || !agent || !resource) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Missing required parameters: email, agent, and resource are required' 
    });
  }

  executeCliCommand('agent:revoke', { email, agent, resource })
    .then(result => {
      res.json({ status: 'success', result });
    })
    .catch(error => {
      logger.error('Agent revoke failed', { error: error.message });
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to revoke agent access', 
        error: error.message 
      });
    });
});

// Add SallyPort authentication endpoint
app.post('/api/auth/sallyport', (req, res) => {
  const { uuid, name, role } = req.body;
  
  if (!uuid || !name || !role) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Missing required parameters: uuid, name, and role are required' 
    });
  }

  logger.info('SallyPort authentication request', { uuid, name, role });

  // Mock SallyPort authentication for now - replace with actual SallyPort integration
  const mockToken = `sallyport_token_${Date.now()}_${uuid}`;
  
  res.json({
    status: 'success',
    token: mockToken,
    user: {
      uuid,
      name,
      role,
      authenticated: true,
      timestamp: new Date().toISOString()
    }
  });
});

// Add API endpoint for auth:verify command
app.post('/api/auth/verify', (req, res) => {
  const { email, agent } = req.body;
  
  if (!email && !agent) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'At least one of email or agent is required' 
    });
  }

  logger.info('Auth verification request', { email, agent });

  // Mock successful verification for SallyPort integration
  res.json({
    valid: true,
    user: {
      email: email || 'pr@coaching2100.com',
      agent: agent || '001',
      role: 'authenticated',
      permissions: ['read', 'write']
    },
    timestamp: new Date().toISOString()
  });
});

// Add API endpoint for copilot:list command
app.get('/api/copilot/list', (req, res) => {
  const { email, status = 'active' } = req.query;
  
  const args = { status };
  if (email) args.email = email;

  executeCliCommand('copilot:list', args)
    .then(result => {
      res.json({ status: 'success', result });
    })
    .catch(error => {
      logger.error('Copilot list failed', { error: error.message });
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to list copilots', 
        error: error.message 
      });
    });
});

// Add API endpoint for rate limit status check
app.get('/api/rate-limit/status', (req, res) => {
  const userType = req.headers['x-user-type'] || 'anonymous';
  const agentType = req.headers['x-agent-type'];
  const userIdentifier = req.headers['x-user-id'] || req.headers['x-agent-id'] || req.ip;
  
  // Determine the current rate limit for this request
  let limit, description;
  if (agentType) {
    switch (agentType) {
      case 'rix':
        limit = 5000;
        description = 'RIX Agent';
        break;
      case 'crx':
        limit = 10000;
        description = 'CRX Agent';
        break;
      case 'qrix':
        limit = 20000;
        description = 'QRIX Agent';
        break;
      default:
        limit = 500;
        description = 'Unknown Agent';
    }
  } else {
    switch (userType) {
      case 'authenticated':
        limit = 2000;
        description = 'Authenticated User';
        break;
      case 'anonymous':
      default:
        limit = 200;
        description = 'Anonymous User';
    }
  }
  
  res.json({
    status: 'success',
    rateLimitInfo: {
      userIdentifier: userIdentifier.substring(0, 10) + '...', // Partially hide for privacy
      userType,
      agentType: agentType || null,
      description,
      requestsPerMinute: limit,
      windowMs: 60000
    }
  });
});

// Add API endpoint for claude:project:list command
app.get('/api/claude/project/list', (req, res) => {
  const { status = 'active', tags, priority, limit = '20' } = req.query;
  
  const args = { status, limit };
  if (tags) args.tags = tags;
  if (priority) args.priority = priority;

  executeCliCommand('claude:project:list', args)
    .then(result => {
      res.json({ status: 'success', result });
    })
    .catch(error => {
      logger.error('Claude project list failed', { error: error.message });
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to list Claude projects', 
        error: error.message 
      });
    });
});

// Add new agent authentication routes
// app.use(agentAuthRoutes);

// Add Symphony status endpoint
app.get('/api/symphony/status', (req, res) => {
  logger.info('Symphony status request');
  
  res.json({
    status: 'active',
    components: {
      auth: 'operational',
      gateway: 'operational',
      sallyport: 'operational'
    },
    timestamp: new Date().toISOString(),
    version: packageJson.version
  });
});

// Add Agents status endpoint
app.get('/api/agents/status', (req, res) => {
  logger.info('Agents status request');
  
  res.json({
    status: 'active',
    agents: {
      rix: 'operational',
      crx: 'operational',
      qrix: 'operational'
    },
    timestamp: new Date().toISOString(),
    version: packageJson.version
  });
});

// Add demo mode endpoints
app.get('/demo', (req, res) => {
  logger.info('Demo access request');
  res.json({
    status: 'demo_active',
    message: 'Welcome to AIXTIV Demo Mode',
    access_level: 'read-only',
    features: [
      'Dashboard viewing',
      'Analytics access',
      'Basic system functions',
      'API exploration'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/demo/status', (req, res) => {
  const demoStatus = getDemoStatus();
  res.json({
    status: 'success',
    demo: demoStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/demo/generate-url', (req, res) => {
  const { path = '/demo', baseUrl = `http://localhost:${PORT}` } = req.query;
  const demoUrl = generateDemoUrl(baseUrl, path);
  
  res.json({
    status: 'success',
    demoUrl,
    instructions: 'Share this URL with investors for instant demo access',
    timestamp: new Date().toISOString()
  });
});

app.get('/investor', (req, res) => {
  logger.info('Investor access request');
  res.json({
    status: 'investor_access',
    message: 'Welcome to AIXTIV Investor Portal',
    access_level: 'presentation-mode',
    features: [
      'System overview',
      'Performance metrics',
      'Integration capabilities',
      'Live demonstrations'
    ],
    timestamp: new Date().toISOString()
  });
});

// Add voice API routes
const voiceApiRoutes = require('./routes/voice-api');
app.use('/api/voice', voiceApiRoutes);

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
app.post('/api/asoos/process', sensitiveApiRateLimiter, async (req, res) => {
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
app.post('/api/asoos/curate', sensitiveApiRateLimiter, async (req, res) => {
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

// ASOOS Flyer Test Endpoint for Development
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
          message: 'Basic system test completed'
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

// ===========================================
// END ASOOS FLYER ML API ENDPOINTS
// ===========================================

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
app.listen(PORT, '*******', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API documentation available at http://localhost:${PORT}/`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  
  // ASOOS Flyer startup confirmation
  if (asoosSystemStatus.initialized) {
    logger.info('🚀 ASOOS Flyer ML system integrated and operational');
    logger.info('🔗 Available endpoints:');
    logger.info('   📊 /api/asoos/status - System status');
    logger.info('   🧠 /api/asoos/process - ML processing');
    logger.info('   👨‍🏫 /api/asoos/curate - Manual curation');
    logger.info('   🔄 /api/asoos/feedback - Feedback loop');
    logger.info('   🧪 /api/asoos/test - Development testing');
  } else {
    logger.warn('⚠️ ASOOS Flyer system still initializing...');
  }
});
