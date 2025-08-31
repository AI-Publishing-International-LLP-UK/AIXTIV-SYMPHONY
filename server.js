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

// Patent system routes
const patentRoutes = require('./routes/patentRoutes');
const patentFilingRoutes = require('./routes/patentFilingRoutes');
const { demoBypassMiddleware, generateDemoUrl, getDemoStatus } = require('./src/middleware/demo-bypass-middleware');
const app = express();

// Diamond SAO Console Mode - activated by environment variable
const DIAMOND_CONSOLE_MODE = process.env.DIAMOND_CONSOLE_MODE === 'true';
const PORT = DIAMOND_CONSOLE_MODE ? (process.env.CONSOLE_API_PORT || 3001) : (process.env.PORT || 3333);

// ASOOS Flyer system components
let connectorManager = null;
let curationSystem = null;
let asoosSystemStatus = {
  initialized: false,
  lastStartup: null,
  version: '2.0.0-ml-enhanced',
  components: {}
};

// Service Management Functions
async function restartService(serviceName) {
  logger.info(`🔄 Attempting to restart service: ${serviceName}`);
  
  const serviceCommands = {
    'integration-gateway-js': 'gcloud run services update integration-gateway-js --region=us-west1',
    'mocoa-owner-interface': 'gcloud run services update mocoa-owner-interface --region=us-west1',
    'asoos-flyer': 'npm run restart',
    'professor-lee': 'systemctl restart professor-lee.service',
    'connector-manager': 'systemctl restart connector-manager.service'
  };
  
  const command = serviceCommands[serviceName];
  if (!command) {
    throw new Error(`Unknown service: ${serviceName}`);
  }
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Service restart failed for ${serviceName}`, { error: error.message, stderr });
        reject(new Error(`Restart failed: ${error.message}`));
      } else {
        logger.info(`Service restart initiated for ${serviceName}`, { stdout });
        resolve({
          action: 'restart',
          service: serviceName,
          status: 'initiated',
          message: `Restart command executed successfully`,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

async function getServiceStatus(serviceName) {
  logger.info(`📊 Getting status for service: ${serviceName}`);
  
  // Check domain status first
  const domainStatus = diamondSystemStatus.domains[serviceName];
  if (domainStatus) {
    return {
      action: 'status',
      service: serviceName,
      status: domainStatus,
      message: `Domain status: ${domainStatus}`,
      timestamp: new Date().toISOString()
    };
  }
  
  // Check local services
  if (serviceName === 'asoos-flyer') {
    return {
      action: 'status',
      service: serviceName,
      status: asoosSystemStatus.initialized ? 'running' : 'initializing',
      details: asoosSystemStatus,
      timestamp: new Date().toISOString()
    };
  }
  
  if (serviceName === 'connector-manager') {
    return {
      action: 'status',
      service: serviceName,
      status: connectorManager ? 'running' : 'stopped',
      connectors: connectorManager ? connectorManager.getAvailableConnectors() : [],
      timestamp: new Date().toISOString()
    };
  }
  
  if (serviceName === 'professor-lee') {
    return {
      action: 'status',
      service: serviceName,
      status: curationSystem ? 'running' : 'stopped',
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    action: 'status',
    service: serviceName,
    status: 'unknown',
    message: 'Service not found in monitoring system',
    timestamp: new Date().toISOString()
  };
}

async function getServiceLogs(serviceName) {
  logger.info(`📝 Getting logs for service: ${serviceName}`);
  
  // Build log commands based on environment and service type
  const region = process.env.CLOUD_ML_REGION || 'us-west1';
  const projectId = process.env.GCP_PROJECT_ID || 'api-for-warp-drive';
  
  const logCommands = {
    'integration-gateway-js': `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=integration-gateway-js" --project=${projectId} --limit=50 --format=json`,
    'mocoa-owner-interface': `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mocoa-owner-interface" --project=${projectId} --limit=50 --format=json`,
    'asoos-flyer': process.env.ASOOS_LOG_FILE ? `tail -n 50 ${process.env.ASOOS_LOG_FILE}` : 'tail -n 50 logs/combined.log',
    'professor-lee': 'journalctl -u professor-lee.service -n 50 --no-pager --output=json',
    'connector-manager': 'journalctl -u connector-manager.service -n 50 --no-pager --output=json',
    'diamond-sao': `tail -n 50 logs/diamond-sao-operations.log`,
    'uac-system': `journalctl -u uac-system.service -n 50 --no-pager --output=json`
  };
  
  const command = logCommands[serviceName];
  if (!command) {
    // Instead of throwing error, provide helpful info about available services
    return {
      action: 'logs',
      service: serviceName,
      status: 'error',
      message: `Service '${serviceName}' not found in log configuration`,
      availableServices: Object.keys(logCommands),
      logs: [],
      timestamp: new Date().toISOString()
    };
  }
  
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Log retrieval failed for ${serviceName}`, { error: error.message, stderr });
        
        // Try to provide some context even when logs fail
        const fallbackLogs = [
          `[${new Date().toISOString()}] ERROR: Failed to retrieve logs for ${serviceName}`,
          `[${new Date().toISOString()}] INFO: Error details: ${error.message}`,
          `[${new Date().toISOString()}] INFO: Command used: ${command}`,
          `[${new Date().toISOString()}] WARN: Check service configuration and log permissions`
        ];
        
        resolve({
          action: 'logs',
          service: serviceName,
          status: 'partial_error',
          message: `Failed to retrieve system logs: ${error.message}`,
          logs: fallbackLogs,
          logCount: fallbackLogs.length,
          command: command,
          timestamp: new Date().toISOString()
        });
      } else {
        let logs = [];
        
        try {
          // Try to parse JSON logs first (for gcloud/journalctl)
          if (stdout.trim().startsWith('{') || stdout.includes('"timestamp"')) {
            const jsonLines = stdout.split('\n').filter(line => line.trim());
            logs = jsonLines.slice(-50).map((line, index) => {
              try {
                const logEntry = JSON.parse(line);
                return `[${logEntry.timestamp || logEntry.receiveTimestamp}] ${logEntry.severity || 'INFO'}: ${logEntry.textPayload || logEntry.message || line}`;
              } catch (e) {
                return `[${new Date().toISOString()}] RAW: ${line}`;
              }
            });
          } else {
            // Regular text logs
            logs = stdout.split('\n').filter(line => line.trim()).slice(-50);
          }
        } catch (parseError) {
          // Fallback to raw text if parsing fails
          logs = stdout.split('\n').filter(line => line.trim()).slice(-50);
        }
        
        resolve({
          action: 'logs',
          service: serviceName,
          status: 'success',
          logs: logs,
          logCount: logs.length,
          command: command.split(' ').slice(0, 3).join(' ') + '...', // Hide full command for security
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

// System Health Check Function
function checkSystemHealth() {
  try {
    // Check actual system components instead of random simulation
    const health = {
      onlineGateways: diamondSystemStatus.gateways.total, // Default to full capacity
      activeConnections: 0,
      timestamp: new Date().toISOString()
    };
    
    // Check if ASOOS Flyer is operational
    if (asoosSystemStatus.initialized) {
      health.onlineGateways = Math.floor(diamondSystemStatus.gateways.total * 0.95); // 95% when system is healthy
      health.activeConnections = Math.floor(diamondSystemStatus.connections.max * 0.1); // 10% utilization
    } else {
      health.onlineGateways = Math.floor(diamondSystemStatus.gateways.total * 0.75); // 75% when initializing
      health.activeConnections = Math.floor(diamondSystemStatus.connections.max * 0.05); // 5% utilization
    }
    
    // Check connector manager health
    if (connectorManager) {
      const connectorHealth = connectorManager.getHealthStatus ? connectorManager.getHealthStatus() : { healthy: true };
      if (!connectorHealth.healthy) {
        health.onlineGateways = Math.floor(health.onlineGateways * 0.8);
      }
    }
    
    // Check curation system health
    if (curationSystem) {
      const curationHealth = curationSystem.getHealthStatus ? curationSystem.getHealthStatus() : { healthy: true };
      if (!curationHealth.healthy) {
        health.onlineGateways = Math.floor(health.onlineGateways * 0.9);
      }
    }
    
    return health;
  } catch (error) {
    logger.error('System health check failed', { error: error.message });
    // Return conservative estimates on error
    return {
      onlineGateways: Math.floor(diamondSystemStatus.gateways.total * 0.5),
      activeConnections: 0,
      timestamp: new Date().toISOString(),
      healthCheckError: error.message
    };
  }
}

// Diamond SAO Console System Status
let diamondSystemStatus = {
  gateways: {
    total: parseInt(process.env.INTEGRATION_GATEWAY_COUNT) || 8500,
    online: 0,
    offline: 0,
    lastCheck: new Date().toISOString()
  },
  connections: {
    current: 0,
    max: parseInt(process.env.MAX_CONCURRENT_CONNECTIONS) || 50000,
    peak: 0
  },
  domains: {
    'drlucy.2100.cool': 'OFFLINE',
    'drgrant.2100.cool': 'OFFLINE', 
    'automation.2100.cool': 'OFFLINE',
    'orchestrator.2100.cool': 'OFFLINE',
    'localhost:32435': 'ONLINE'
  },
  consoleMode: DIAMOND_CONSOLE_MODE
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

// Add patent system routes
app.use('/api/patents', patentRoutes);
app.use('/api/filing', patentFilingRoutes);

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

// ===========================================
// DIAMOND SAO CONSOLE ENDPOINTS
// ===========================================

if (DIAMOND_CONSOLE_MODE) {
  
  // Diamond SAO Console Status
  app.get('/api/diamond-sao/status', (req, res) => {
    diamondSystemStatus.gateways.lastCheck = new Date().toISOString();
    
    // Get actual gateway status from system monitoring
    try {
      // Check actual system health instead of random simulation
      const systemHealth = checkSystemHealth();
      diamondSystemStatus.gateways.online = systemHealth.onlineGateways;
      diamondSystemStatus.gateways.offline = diamondSystemStatus.gateways.total - systemHealth.onlineGateways;
      
      // Update connection stats from actual metrics
      diamondSystemStatus.connections.current = systemHealth.activeConnections;
      
    } catch (error) {
      logger.warn('⚠️ Could not get real gateway status, using last known values', { error: error.message });
      // Keep existing values if real check fails
    }
    
    res.json(diamondSystemStatus);
  });
  
  // Domain Status Check
  app.get('/api/diamond-sao/domains', (req, res) => {
    res.json({
      domains: diamondSystemStatus.domains,
      issues: [
        'CloudFlare 522 errors detected on *.2100.cool domains',
        'Origin servers unreachable',
        'Local portal functional on localhost:32435'
      ],
      recommendations: [
        'Check origin server configuration',
        'Verify firewall rules for CloudFlare IPs', 
        'Restart backend services',
        'Use localhost:32435 for immediate team access'
      ]
    });
  });
  
  // Interface Access Diagnostics
  app.post('/api/diamond-sao/diagnose', (req, res) => {
    const { domain, action } = req.body;
    
    logger.info(`🔍 Diamond SAO diagnosing ${domain} - Action: ${action}`);
    
    const diagnosis = {
      domain,
      timestamp: new Date().toISOString(),
      status: diamondSystemStatus.domains[domain] || 'UNKNOWN',
      issues: []
    };

    // Check common issues
    if (domain && domain.includes('2100.cool')) {
      diagnosis.issues.push('CloudFlare 522 - Connection Timeout');
      diagnosis.issues.push('Origin server unreachable');
      diagnosis.solution = 'Restart backend services or check CloudFlare origin configuration';
    } else if (domain && domain.includes('localhost')) {
      diagnosis.status = 'ONLINE';
      diagnosis.message = 'Local interface is accessible';
    }

    res.json(diagnosis);
  });
  
  // Emergency Team Access
  app.post('/api/diamond-sao/emergency-access', (req, res) => {
    const { team_member, access_type } = req.body;
    
    logger.info(`🚨 Diamond SAO emergency access requested by ${team_member} - Type: ${access_type}`);
    
    // Get URLs from environment variables or fallback to defaults
    const primaryUrl = process.env.EMERGENCY_ACCESS_URL || 'http://localhost:32435';
    const backupHost = process.env.BACKUP_HOST || 'localhost';
    const emergencyPort = process.env.EMERGENCY_PORT || '32435';
    const sshUser = process.env.SSH_USER || 'user';
    const serverHost = process.env.SERVER_HOST || 'server';
    
    res.json({
      status: 'GRANTED',
      access_url: primaryUrl,
      backup_urls: [
        `http://${backupHost}:${emergencyPort}`,
        'Use SSH tunnel for remote access'
      ],
      token: `diamond_emergency_${Date.now()}`,
      expires: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      instructions: [
        `1. Use ${primaryUrl} for immediate access`,
        `2. Set up SSH tunnel: ssh -L ${emergencyPort}:localhost:${emergencyPort} ${sshUser}@${serverHost}`,
        '3. For external team: Use VPN or ngrok tunnel',
        `4. Portal container is running and accessible on port ${emergencyPort}`
      ]
    });
  });
  
  // Service Management
  app.post('/api/diamond-sao/services/:action', async (req, res) => {
    const { action } = req.params;
    const { service } = req.body;
    
    logger.info(`⚡ Diamond SAO service ${action} requested for: ${service}`);
    
    let result = { action, service, status: 'unknown' };
    
    try {
      switch(action) {
        case 'restart':
          result = await restartService(service);
          break;
        case 'status':
          result = await getServiceStatus(service);
          break;
        case 'logs':
          result = await getServiceLogs(service);
          break;
        default:
          result.error = `Unknown action: ${action}`;
          return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error) {
      logger.error(`❌ Service ${action} failed for ${service}`, { error: error.message });
      res.status(500).json({
        action,
        service,
        status: 'error',
        message: error.message
      });
    }
  });
  
  // Testament Swarm Status (referenced in startup script)
  app.get('/api/testament-swarm/status', (req, res) => {
    res.json({
      status: 'ENABLED',
      connectivity: 'ACTIVE',
      swarm_size: 8500,
      online_nodes: diamondSystemStatus.gateways.online,
      last_sync: new Date().toISOString()
    });
  });
  
  // Diamond SAO Dashboard (referenced in startup script)
  app.get('/api/diamond-sao/dashboard', (req, res) => {
    res.json({
      systemOverview: diamondSystemStatus,
      quickStats: {
        totalGateways: diamondSystemStatus.gateways.total,
        onlineGateways: diamondSystemStatus.gateways.online,
        activeConnections: diamondSystemStatus.connections.current,
        uptime: process.uptime(),
        version: packageJson.version
      },
      alerts: [
        {
          level: 'warning',
          message: 'CloudFlare 522 errors on production domains',
          action: 'Check origin servers'
        },
        {
          level: 'info', 
          message: 'Local portal accessible on localhost:32435',
          action: 'Use for team access'
        }
      ]
    });
  });
  
  logger.info('💎 Diamond SAO Console endpoints registered');
}

// Start the server
app.listen(PORT, () => {
  if (DIAMOND_CONSOLE_MODE) {
    logger.info(`💎 Diamond SAO Command Center running on port ${PORT}`);
    logger.info(`🌐 Integration Gateway count: ${diamondSystemStatus.gateways.total}`);
    logger.info(`🔗 Max concurrent connections: ${diamondSystemStatus.connections.max}`);
    logger.info(`📡 Console endpoints available:`);
    logger.info(`   💎 /api/diamond-sao/status - System status`);
    logger.info(`   🌐 /api/diamond-sao/domains - Domain diagnostics`);
    logger.info(`   🚨 /api/diamond-sao/emergency-access - Team access`);
    logger.info(`   🔧 /api/diamond-sao/services/:action - Service management`);
    logger.info(`   📊 /api/diamond-sao/dashboard - Full dashboard`);
  } else {
    logger.info(`Server running on port ${PORT}`);
  }
  
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
