/**
 * Automated Firebase Error Logger
 * 
 * Provides real-time detection, reporting and self-healing of Firebase deployment issues.
 * Integrates with Cloud Logging and Error Correction Service to maintain deployment health.
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { ErrorCorrectionService } = require('../services/error-correction');

// Initialize services
const errorService = new ErrorCorrectionService();

// Known error patterns and their correction strategies
const ERROR_PATTERNS = {
  'QUOTA_EXCEEDED': {
    detection: /quota exceeded|resource exhausted/i,
    severity: 'CRITICAL',
    autoCorrect: true,
    correctionStrategy: 'SCALE_DOWN_THEN_RETRY'
  },
  'PERMISSION_DENIED': {
    detection: /permission denied|unauthorized|not authorized/i,
    severity: 'CRITICAL',
    autoCorrect: false,
    correctionStrategy: 'ALERT_ADMIN'
  },
  'FUNCTION_TIMEOUT': {
    detection: /function execution took \d+ ms, finished with status: 'timeout'/i,
    severity: 'WARNING',
    autoCorrect: true,
    correctionStrategy: 'INCREASE_TIMEOUT_THEN_RETRY'
  },
  'HOSTING_DEPLOY_FAILED': {
    detection: /Error: Hosting deployment failed|Failed to deploy hosting/i,
    severity: 'CRITICAL',
    autoCorrect: true,
    correctionStrategy: 'CLEAN_CACHE_THEN_RETRY'
  },
  'DNS_CONFIGURATION': {
    detection: /DNS record not found|DNS verification failed/i,
    severity: 'WARNING',
    autoCorrect: true,
    correctionStrategy: 'RETRY_DNS_VERIFICATION'
  },
  'SSL_CERTIFICATION': {
    detection: /SSL certification failed|unable to provision SSL certificate/i,
    severity: 'WARNING',
    autoCorrect: true,
    correctionStrategy: 'RESTART_SSL_PROVISIONING'
  },
  'DEPLOYMENT_CONFLICT': {
    detection: /deployment already in progress|another deployment is in progress/i,
    severity: 'WARNING',
    autoCorrect: true,
    correctionStrategy: 'WAIT_THEN_RETRY'
  },
  'FUNCTION_CRASH': {
    detection: /function crashed|unexpected error in function execution/i,
    severity: 'CRITICAL',
    autoCorrect: false,
    correctionStrategy: 'ALERT_ADMIN_WITH_LOGS'
  }
};

/**
 * Monitors Firebase logs for deployment errors and takes corrective action
 */
const monitorDeploymentErrors = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      // Query recent logs for errors
      const logs = await admin.logging().getEntries({
        filter: 'resource.type="cloud_function" severity>=WARNING',
        pageSize: 50,
        orderBy: 'timestamp desc'
      });

      // Process logs for known error patterns
      const errors = processLogsForErrors(logs[0]);
      
      // Take corrective action for detected errors
      if (errors.length > 0) {
        await handleErrors(errors);
      }

      // Log healthy status if no critical errors
      if (!errors.some(e => e.severity === 'CRITICAL')) {
        functions.logger.info('Deployment health check passed, no critical errors detected');
      }

      return null;
    } catch (error) {
      functions.logger.error('Error in deployment monitoring:', error);
      throw error;
    }
  });

/**
 * Processes logs to identify known error patterns
 */
function processLogsForErrors(logs) {
  const errors = [];
  
  logs.forEach(log => {
    const message = log.data.message || '';
    const timestamp = log.timestamp;
    const resource = log.resource.labels || {};
    
    // Check each error pattern
    for (const [errorType, pattern] of Object.entries(ERROR_PATTERNS)) {
      if (pattern.detection.test(message)) {
        errors.push({
          type: errorType,
          message,
          timestamp,
          resource,
          severity: pattern.severity,
          autoCorrect: pattern.autoCorrect,
          correctionStrategy: pattern.correctionStrategy
        });
        break; // Stop after first match for each log
      }
    }
  });
  
  return errors;
}

/**
 * Handle detected errors with appropriate strategies
 */
async function handleErrors(errors) {
  for (const error of errors) {
    // Log the error
    functions.logger.error(`Deployment error detected: ${error.type}`, {
      details: error.message,
      resource: error.resource,
      severity: error.severity
    });
    
    // Take corrective action if auto-correction is enabled
    if (error.autoCorrect) {
      try {
        await errorService.applyCorrection(error.type, error.correctionStrategy, {
          error: error.message,
          resource: error.resource
        });
        
        functions.logger.info(`Applied ${error.correctionStrategy} to correct ${error.type}`);
      } catch (correctionError) {
        functions.logger.error(`Failed to auto-correct ${error.type}:`, correctionError);
        
        // Escalate to admin notification if auto-correction fails
        await errorService.alertAdmin({
          title: `Failed to auto-correct ${error.type}`,
          error: error.message,
          correctionError: correctionError.message,
          resource: error.resource,
          severity: 'CRITICAL'
        });
      }
    } else {
      // Alert administrators for errors that require manual intervention
      await errorService.alertAdmin({
        title: `${error.severity}: ${error.type} requires attention`,
        error: error.message,
        resource: error.resource,
        severity: error.severity
      });
    }
  }
}

/**
 * Cloud Function to manually trigger error detection and correction
 */
const manualErrorCheck = functions.https.onCall(async (data, context) => {
  // Verify the caller has permission
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can manually trigger error checks'
    );
  }
  
  try {
    // Query recent logs for errors
    const logs = await admin.logging().getEntries({
      filter: 'resource.type="cloud_function" severity>=WARNING',
      pageSize: 50,
      orderBy: 'timestamp desc'
    });

    // Process logs for known error patterns
    const errors = processLogsForErrors(logs[0]);
    
    // Take corrective action for detected errors
    if (errors.length > 0) {
      await handleErrors(errors);
      return { success: true, errors: errors.map(e => ({ type: e.type, severity: e.severity })) };
    }
    
    return { success: true, errors: [] };
  } catch (error) {
    functions.logger.error('Error in manual error check:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = {
  monitorDeploymentErrors,
  manualErrorCheck
};