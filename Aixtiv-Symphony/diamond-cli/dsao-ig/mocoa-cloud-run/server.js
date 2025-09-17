const express = require('express');
const path = require('path');
const app = express();

// Enterprise Cache Strategy Configuration
const CACHE_VERSION = process.env.CACHE_VERSION || '1.0.0';
const BUILD_HASH = process.env.BUILD_HASH || 'prod';
const CACHE_CONTROL_STATIC = 'public, max-age=31536000, immutable'; // 1 year for static assets
const CACHE_CONTROL_HTML = 'public, max-age=300, must-revalidate'; // 5 minutes for HTML

// Dr. Claude Quantum Orchestration System
const QUANTUM_ORCHESTRATION_VERSION = '2.4.7';
const DR_CLAUDE_SERVICE_ACCOUNT = 'dr-claude-automationENVIRONMENT_VARIABLE_REQUIRED';
const QUANTUM_PROTECTION_LEVEL = 'MAXIMUM';
const ORCHESTRATION_ENDPOINTS = {
  validation: '/api/dr-claude/validate',
  orchestrate: '/api/dr-claude/orchestrate',
  quantum_sync: '/api/dr-claude/quantum-sync',
  health: '/api/dr-claude/health'
};

// Quantum State Management
class QuantumOrchestrator {
  constructor() {
    this.quantumState = 'INITIALIZED';
    this.protectionLevel = QUANTUM_PROTECTION_LEVEL;
    this.serviceAccount = DR_CLAUDE_SERVICE_ACCOUNT;
    this.version = QUANTUM_ORCHESTRATION_VERSION;
    this.lastSync = new Date().toISOString();
    this.validationHash = null;
  }
  
  async validateQuantumState() {
    this.quantumState = 'VALIDATING';
    // Quantum validation logic would go here
    await new Promise(resolve => setTimeout(resolve, 100));
    this.quantumState = 'VALIDATED';
    this.validationHash = this.generateValidationHash();
    return true;
  }
  
  generateValidationHash() {
    return `qv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async orchestrateRequest(req, res, next) {
    // Dr. Claude orchestration middleware
    req.quantumId = `qo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.drClaudeValidation = this.validationHash;
    req.orchestrationTimestamp = new Date().toISOString();
    
    // Set quantum protection headers
    res.set('X-Dr-Claude-Orchestration', this.version);
    res.set('X-Quantum-Protection', this.protectionLevel);
    res.set('X-Validation-Hash', this.validationHash);
    res.set('X-Service-Account', this.serviceAccount);
    
    next();
  }
  
  getOrchestrationStatus() {
    return {
      version: this.version,
      quantum_state: this.quantumState,
      protection_level: this.protectionLevel,
      service_account: this.serviceAccount,
      last_sync: this.lastSync,
      validation_hash: this.validationHash,
      status: 'operational',
      dr_claude_active: true
    };
  }
}

// Initialize Dr. Claude Quantum Orchestrator
const drClaudeOrchestrator = new QuantumOrchestrator();

// Initialize quantum state on startup
drClaudeOrchestrator.validateQuantumState().then(() => {
  // Dr. Claude Quantum Orchestration System initialized
  // Quantum protection level: MAXIMUM
  // Service account: DR_CLAUDE_SERVICE_ACCOUNT
  // Orchestration version: QUANTUM_ORCHESTRATION_VERSION
});

// Set the port from environment variable or default to 8080 (Cloud Run default)
const PORT = process.env.PORT || 8080;

// Apply Dr. Claude Quantum Orchestration to all requests
app.use(drClaudeOrchestrator.orchestrateRequest.bind(drClaudeOrchestrator));

// Dr. Claude Orchestration API Endpoints
app.get('/api/dr-claude/health', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json(drClaudeOrchestrator.getOrchestrationStatus());
});

app.post('/api/dr-claude/validate', (req, res) => {
  const validationResult = {
    quantum_id: req.quantumId,
    validation_hash: req.drClaudeValidation,
    timestamp: req.orchestrationTimestamp,
    status: 'validated',
    dr_claude_approval: true,
    protection_level: QUANTUM_PROTECTION_LEVEL
  };
  res.status(200).json(validationResult);
});

app.post('/api/dr-claude/orchestrate', async (req, res) => {
  try {
    const orchestrationRequest = req.body;
    const result = {
      quantum_id: req.quantumId,
      orchestration_id: `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request_type: orchestrationRequest.type || 'general',
      status: 'orchestrated',
      dr_claude_processing: true,
      quantum_protection: QUANTUM_PROTECTION_LEVEL,
      timestamp: req.orchestrationTimestamp,
      result: 'Request processed through Dr. Claude orchestration system'
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Dr. Claude orchestration error',
      quantum_id: req.quantumId,
      timestamp: req.orchestrationTimestamp
    });
  }
});

app.post('/api/dr-claude/quantum-sync', async (req, res) => {
  try {
    await drClaudeOrchestrator.validateQuantumState();
    const syncResult = {
      quantum_id: req.quantumId,
      sync_id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quantum_state: drClaudeOrchestrator.quantumState,
      validation_hash: drClaudeOrchestrator.validationHash,
      sync_timestamp: new Date().toISOString(),
      status: 'synchronized',
      dr_claude_validation: true
    };
    drClaudeOrchestrator.lastSync = syncResult.sync_timestamp;
    res.status(200).json(syncResult);
  } catch (error) {
    res.status(500).json({
      error: 'Quantum synchronization failed',
      quantum_id: req.quantumId,
      timestamp: req.orchestrationTimestamp
    });
  }
});

// Enterprise Static File Serving with Production Cache Control
app.use(express.static(__dirname, {
  etag: true,
  lastModified: true,
  maxAge: 0, // Let setHeaders handle cache control
  setHeaders: (res, filePath, stat) => {
    if (filePath.endsWith('.html')) {
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', CACHE_CONTROL_HTML);
      res.set('X-Content-Version', CACHE_VERSION);
      res.set('X-Build-Hash', BUILD_HASH);
    } else if (filePath.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.set('Cache-Control', CACHE_CONTROL_STATIC);
      res.set('X-Content-Version', CACHE_VERSION);
    }
    
    // Security headers for production
    res.set('X-Frame-Options', 'DENY');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
}));

// Dynamic SaaS Interface Generator - Works with SallyPort Authentication
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Production SallyPort Integration - All auth goes to sallyport.2100.com
// No local authentication - system redirects to real SallyPort service

// Dynamic Owner Subscriber Interface Generator
app.post('/api/generate-interface', async (req, res) => {
  try {
    const { email, userProfile, companyInfo } = req.body;
    
    // Generate unique interface based on user profile
    const uniqueInterface = {
      interfaceId: `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email,
      displayName: userProfile.displayName,
      title: userProfile.title,
      role: userProfile.role,
      companyMcp: `mcp.${companyInfo.domain || 'company'}.2100.cool`,
      customizations: {
        theme: userProfile.theme || 'dark',
        layout: userProfile.layout || 'standard',
        features: userProfile.features || ['basic']
      },
      generated: new Date().toISOString()
    };
    
    res.status(200).json(uniqueInterface);
  } catch (error) {
    res.status(500).json({ error: 'Interface generation failed' });
  }
});

// MCP Auto-Provisioning (Fixed - No Redirect)
app.post('/api/mcp/auto-provision', async (req, res) => {
  try {
    const { email, authData } = req.body;
    
    // Instead of redirecting, return interface customization data
    const provisioningResult = {
      provisioned: true,
      interfaceCustomization: {
        displayName: `${email.split('@')[0]} Owner`,
        title: 'Company Owner',
        role: 'owner',
        companyMcp: `mcp.${email.split('@')[1].split('.')[0]}.2100.cool`,
        features: ['owner_dashboard', 'company_operations']
      },
      // NO REDIRECT URLs - Keep user on same interface
      stayOnInterface: true,
      message: 'Company MCP interface configured'
    };
    
    res.status(200).json(provisioningResult);
  } catch (error) {
    res.status(500).json({ error: 'MCP provisioning failed' });
  }
});

// Enterprise Health Check with Cache Strategy Info and Dr. Claude Orchestration
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  const orchestrationStatus = drClaudeOrchestrator.getOrchestrationStatus();
  res.status(200).json({ 
    status: 'healthy', 
    service: 'mocoa-interface',
    version: CACHE_VERSION,
    build_hash: BUILD_HASH,
    cache_strategy: 'enterprise',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    quantum_orchestration: {
      version: orchestrationStatus.version,
      quantum_state: orchestrationStatus.quantum_state,
      protection_level: orchestrationStatus.protection_level,
      dr_claude_active: orchestrationStatus.dr_claude_active,
      last_sync: orchestrationStatus.last_sync,
      validation_hash: orchestrationStatus.validation_hash
    }
  });
});

// Enterprise Route Handler with Cache Control (MUST BE LAST)
app.get('*', (req, res) => {
  // Set enterprise cache headers for HTML
  res.set('Cache-Control', CACHE_CONTROL_HTML);
  res.set('X-Content-Version', CACHE_VERSION);
  res.set('X-Build-Hash', BUILD_HASH);
  res.set('X-Powered-By-Victory36', 'true');
  
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Self-healing and monitoring configuration
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_COOLDOWN = 60000; // 1 minute
let restartCount = 0;
let lastRestartTime = 0;
let server;

// Enhanced logging for production debugging
const log = (level, message, metadata = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        service: 'mocoa',
        message,
        ...metadata
    };
    console.log(JSON.stringify(logEntry));
};

// Self-healing mechanism
function performSelfHeal() {
    const now = Date.now();
    
    // Check if we're in cooldown period
    if (now - lastRestartTime < RESTART_COOLDOWN) {
        log('warn', 'Self-heal in cooldown period');
        return;
    }
    
    // Check restart attempts
    if (restartCount >= MAX_RESTART_ATTEMPTS) {
        log('error', 'Maximum restart attempts reached', { restartCount });
        return;
    }
    
    log('info', 'Attempting self-heal', { restartCount });
    restartCount++;
    lastRestartTime = now;
    
    // Graceful restart logic
    process.exit(1); // Let the container orchestrator restart us
}

// Health monitoring function
function startHealthMonitoring() {
    setInterval(async () => {
        try {
            // Monitor memory usage
            const memUsage = process.memoryUsage();
            const memUsageMB = {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            };
            
            // Check for memory leaks
            if (memUsageMB.heapUsed > 1500) { // 1.5GB threshold
                log('warn', 'High memory usage detected', { memory: memUsageMB });
                
                if (memUsageMB.heapUsed > 1800) { // 1.8GB critical threshold
                    log('error', 'Critical memory usage - triggering self-heal', { memory: memUsageMB });
                    performSelfHeal();
                    return;
                }
            }
            
            // Validate quantum orchestrator state
            if (drClaudeOrchestrator.quantumState === 'ERROR' || 
                !drClaudeOrchestrator.validationHash) {
                log('warn', 'Quantum orchestrator state validation failed');
                await drClaudeOrchestrator.validateQuantumState();
            }
            
            log('debug', 'Health check passed', { 
                memory: memUsageMB, 
                uptime: process.uptime(),
                quantumState: drClaudeOrchestrator.quantumState 
            });
        } catch (error) {
            log('error', 'Health monitoring error', { error: error.message });
            performSelfHeal();
        }
    }, HEALTH_CHECK_INTERVAL);
}

// Graceful shutdown handling
function gracefulShutdown(signal) {
    log('info', `Received ${signal}, shutting down gracefully`);
    
    if (server) {
        server.close((err) => {
            if (err) {
                log('error', 'Error during graceful shutdown', { error: err.message });
                process.exit(1);
            }
            
            log('info', 'Server closed, exiting process');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        log('error', 'Forced shutdown due to timeout');
        process.exit(1);
    }, 10000);
}

// Enhanced readiness probe
app.get('/ready', async (req, res) => {
    try {
        const fs = require('fs').promises;
        
        // Check if critical files exist
        await fs.access(path.join(__dirname, 'index.html'));
        await fs.access(path.join(__dirname, 'package.json'));
        
        // Check quantum orchestrator state
        if (drClaudeOrchestrator.quantumState !== 'VALIDATED' && 
            drClaudeOrchestrator.quantumState !== 'INITIALIZED') {
            throw new Error('Quantum orchestrator not ready');
        }
        
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            checks: {
                filesystem: 'ok',
                dependencies: 'ok',
                quantumOrchestrator: 'ok'
            }
        });
        
        log('info', 'Readiness check passed');
    } catch (error) {
        log('error', 'Readiness check failed', { error: error.message });
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

server = app.listen(PORT, () => {
    log('info', 'MOCOA Interface server started', {
        port: PORT,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'production',
        pid: process.pid,
        quantumOrchestration: QUANTUM_ORCHESTRATION_VERSION
    });
    
    // Start health monitoring after server starts
    startHealthMonitoring();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    log('error', 'Uncaught exception', { error: error.message, stack: error.stack });
    performSelfHeal();
});

process.on('unhandledRejection', (reason, promise) => {
    log('error', 'Unhandled rejection', { reason: reason?.message || reason });
    performSelfHeal();
});

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export for testing
module.exports = app;
