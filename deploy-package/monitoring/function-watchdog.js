/**
 * Runtime Function Watchdog
 * 
 * Monitors agent pipeline execution and detects failures mid-prompt.
 * Takes corrective action to maintain service reliability.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { AgentRecoveryService } = require('../services/agent-recovery');

// Initialize services
const recoveryService = new AgentRecoveryService();

// Configuration
const CONFIG = {
  // Maximum time allowed for a function to execute (ms)
  functionTimeouts: {
    default: 30000,         // Default timeout
    // Function-specific timeouts
    'agentProcessPrompt': 60000,
    'generateResponse': 90000,
    'processWithAnthology': 120000
  },
  // Time between health checks (ms)
  healthCheckInterval: 30000,
  // Number of consecutive failures before taking action
  failureThreshold: 3,
  // Recovery options
  recovery: {
    // Whether to attempt automatic recovery
    enableAutoRecovery: true,
    // Maximum number of recovery attempts
    maxRecoveryAttempts: 3,
    // Cooldown period between recovery attempts (ms)
    recoveryAttemptCooldown: 60000
  },
  // Alert thresholds
  alerts: {
    // CPU usage percentage that triggers a warning
    cpuWarningThreshold: 85,
    // Memory usage percentage that triggers a warning
    memoryWarningThreshold: 80,
    // Cold start time threshold (ms)
    coldStartWarningThreshold: 5000
  }
};

// Track function executions and their health
const functionTracker = {
  activeFunctions: new Map(),
  failureCounts: new Map(),
  // Map to track recovery attempts
  recoveryAttempts: new Map(),
  // Last execution times to track cold starts
  lastExecutionTimes: new Map()
};

/**
 * Registers a function execution at its start
 */
exports.registerFunctionStart = functions.handler.https.onRequest(async (req, res) => {
  const { functionId, requestId, agentId } = req.body;
  
  if (!functionId || !requestId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const startTime = Date.now();
  const timeout = CONFIG.functionTimeouts[functionId] || CONFIG.functionTimeouts.default;
  
  // Check if this is a cold start
  const lastExecutionTime = functionTracker.lastExecutionTimes.get(functionId);
  const isColdStart = !lastExecutionTime || (startTime - lastExecutionTime > 60000);
  
  // Store execution details
  functionTracker.activeFunctions.set(requestId, {
    functionId,
    agentId,
    startTime,
    timeout,
    isColdStart
  });
  
  // Update last execution time
  functionTracker.lastExecutionTimes.set(functionId, startTime);
  
  // Log the start of function execution
  functions.logger.info(`Function ${functionId} started`, {
    requestId,
    agentId,
    isColdStart
  });
  
  return res.status(200).json({ success: true, timeout });
});

/**
 * Registers a function execution completion
 */
exports.registerFunctionComplete = functions.handler.https.onRequest(async (req, res) => {
  const { requestId, status, error } = req.body;
  
  if (!requestId) {
    return res.status(400).json({ error: 'Missing required parameter: requestId' });
  }
  
  // Get the function execution details
  const executionDetails = functionTracker.activeFunctions.get(requestId);
  if (!executionDetails) {
    return res.status(404).json({ error: 'No active function found with this requestId' });
  }
  
  const { functionId, agentId, startTime, isColdStart } = executionDetails;
  const executionTime = Date.now() - startTime;
  
  // Track failure counts
  if (status === 'error') {
    const currentFailures = functionTracker.failureCounts.get(functionId) || 0;
    functionTracker.failureCounts.set(functionId, currentFailures + 1);
    
    // Log details about the error
    functions.logger.error(`Function ${functionId} failed`, {
      requestId,
      agentId,
      executionTime,
      error
    });
    
    // Check if we need to take recovery action
    if (currentFailures + 1 >= CONFIG.failureThreshold) {
      await handleFunctionFailure(functionId, agentId, error);
    }
  } else {
    // Reset failure count on success
    functionTracker.failureCounts.set(functionId, 0);
    
    // Log completion
    functions.logger.info(`Function ${functionId} completed`, {
      requestId,
      agentId,
      executionTime,
      status
    });
    
    // Check for cold start warnings
    if (isColdStart && executionTime > CONFIG.alerts.coldStartWarningThreshold) {
      functions.logger.warn(`Cold start for ${functionId} took ${executionTime}ms`, {
        requestId,
        agentId
      });
    }
  }
  
  // Remove the execution from active tracking
  functionTracker.activeFunctions.delete(requestId);
  
  return res.status(200).json({
    success: true,
    executionTime,
    status
  });
});

/**
 * Health check that runs periodically to detect stalled functions
 */
exports.checkFunctionHealth = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = Date.now();
    const stalledFunctions = [];
    
    // Check each active function
    functionTracker.activeFunctions.forEach((details, requestId) => {
      const { functionId, agentId, startTime, timeout } = details;
      const executionTime = now - startTime;
      
      // Check if the function has exceeded its timeout
      if (executionTime > timeout) {
        stalledFunctions.push({
          requestId,
          functionId,
          agentId,
          executionTime,
          timeout
        });
        
        // Log the stalled function
        functions.logger.warn(`Function ${functionId} stalled`, {
          requestId,
          agentId,
          executionTime,
          timeout
        });
        
        // Increment failure count
        const currentFailures = functionTracker.failureCounts.get(functionId) || 0;
        functionTracker.failureCounts.set(functionId, currentFailures + 1);
        
        // Remove from active tracking
        functionTracker.activeFunctions.delete(requestId);
      }
    });
    
    // Handle stalled functions
    for (const stalledFunction of stalledFunctions) {
      const { functionId, agentId } = stalledFunction;
      const failureCount = functionTracker.failureCounts.get(functionId) || 0;
      
      if (failureCount >= CONFIG.failureThreshold) {
        await handleFunctionFailure(functionId, agentId, 'Function timeout exceeded');
      }
    }
    
    // Monitor system resources
    const systemMetrics = await getSystemMetrics();
    checkSystemResourceWarnings(systemMetrics);
    
    return null;
  });

/**
 * Handles failures by triggering the recovery process
 */
async function handleFunctionFailure(functionId, agentId, error) {
  // Check if we've exceeded recovery attempts
  const attempts = functionTracker.recoveryAttempts.get(functionId) || 0;
  
  if (!CONFIG.recovery.enableAutoRecovery || attempts >= CONFIG.recovery.maxRecoveryAttempts) {
    // We've hit the limit, escalate to admin
    await escalateToAdmin(functionId, agentId, error, attempts);
    return;
  }
  
  // Increment recovery attempts
  functionTracker.recoveryAttempts.set(functionId, attempts + 1);
  
  try {
    // Attempt recovery
    await recoveryService.recoverFunction(functionId, agentId, { error });
    
    // Log recovery attempt
    functions.logger.info(`Recovery attempt for ${functionId}`, {
      agentId,
      attemptNumber: attempts + 1,
      maxAttempts: CONFIG.recovery.maxRecoveryAttempts
    });
    
    // Reset failure count after recovery
    functionTracker.failureCounts.set(functionId, 0);
  } catch (recoveryError) {
    // Log recovery failure
    functions.logger.error(`Recovery failed for ${functionId}`, {
      agentId,
      error: recoveryError.message,
      attemptNumber: attempts + 1
    });
    
    // Escalate if recovery fails
    await escalateToAdmin(functionId, agentId, error, attempts + 1, recoveryError);
  }
}

/**
 * Escalates issues to administrators
 */
async function escalateToAdmin(functionId, agentId, error, attempts, recoveryError = null) {
  // Create alert details
  const alertDetails = {
    title: `Function failure: ${functionId}`,
    message: `Function ${functionId} has failed repeatedly.`,
    timestamp: new Date().toISOString(),
    severity: 'CRITICAL',
    metadata: {
      functionId,
      agentId,
      error,
      recoveryAttempts: attempts
    }
  };
  
  if (recoveryError) {
    alertDetails.message += ` Recovery attempt failed: ${recoveryError.message}`;
    alertDetails.metadata.recoveryError = recoveryError.message;
  }
  
  // Send alert
  try {
    await admin.firestore().collection('alerts').add(alertDetails);
    
    // Also log to Cloud Logging
    functions.logger.error(`ESCALATION: ${alertDetails.title}`, alertDetails);
    
    // Send notification via Pub/Sub for alerting systems
    const topic = admin.pubsub().topic('function-failures');
    await topic.publish(Buffer.from(JSON.stringify(alertDetails)));
  } catch (alertError) {
    // Last resort logging if alerting fails
    functions.logger.critical(`CRITICAL: Alert system failure`, {
      alertError: alertError.message,
      originalIssue: alertDetails
    });
  }
}

/**
 * Retrieves system metrics for monitoring
 */
async function getSystemMetrics() {
  // This would normally call to a metrics API
  // Placeholder implementation
  return {
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    activeFunctions: functionTracker.activeFunctions.size,
    timestamp: Date.now()
  };
}

/**
 * Checks system resources for warning conditions
 */
function checkSystemResourceWarnings(metrics) {
  if (metrics.cpu > CONFIG.alerts.cpuWarningThreshold) {
    functions.logger.warn(`High CPU usage: ${metrics.cpu.toFixed(1)}%`);
  }
  
  if (metrics.memory > CONFIG.alerts.memoryWarningThreshold) {
    functions.logger.warn(`High memory usage: ${metrics.memory.toFixed(1)}%`);
  }
}

// Make the functions available
module.exports = {
  registerFunctionStart: exports.registerFunctionStart,
  registerFunctionComplete: exports.registerFunctionComplete,
  checkFunctionHealth: exports.checkFunctionHealth
};