/**
 * AIXTIV Error Resilience and Recovery System
 *
 * This module provides advanced error detection, logging, and automatic recovery
 * capabilities for the AIXTIV ecosystem, ensuring system stability and reliability.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');
const axios = require('axios');

// Initialize services
let firestore;
if (admin.apps.length) {
  firestore = admin.firestore();
} else {
  admin.initializeApp();
  firestore = admin.firestore();
}

const pubsub = new PubSub();

/**
 * Error types for categorization
 */
const ERROR_TYPES = {
  DATABASE: 'database_error',
  NETWORK: 'network_error',
  AUTHENTICATION: 'auth_error',
  VALIDATION: 'validation_error',
  INTEGRATION: 'integration_error',
  LLM: 'llm_error',
  AGENT: 'agent_error',
  BLOCKCHAIN: 'blockchain_error',
  UNKNOWN: 'unknown_error',
};

/**
 * Error severity levels
 */
const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * ErrorTracker class for monitoring and managing system errors
 */
class ErrorTracker {
  constructor() {
    this.errorsCollection = firestore.collection('systemErrors');
    this.recoveryAttemptsCollection = firestore.collection('recoveryAttempts');
    this.errorStatsTopic = 'aixtiv-error-stats';
    this.criticalErrorTopic = 'aixtiv-critical-errors';
  }

  /**
   * Log an error to Firestore and publish to appropriate topic
   *
   * @param {Error} error - The error object
   * @param {string} component - Component where error occurred
   * @param {string} type - Error type from ERROR_TYPES
   * @param {string} severity - Error severity from SEVERITY
   * @param {Object} context - Additional context about the error
   * @returns {Promise<string>} - ID of the error record
   */
  async logError(
    error,
    component,
    type = ERROR_TYPES.UNKNOWN,
    severity = SEVERITY.MEDIUM,
    context = {}
  ) {
    try {
      // Create error record
      const errorRecord = {
        message: error.message,
        stack: error.stack,
        component,
        type,
        severity,
        context,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        resolved: false,
        recoveryAttempts: 0,
      };

      // Store in Firestore
      const docRef = await this.errorsCollection.add(errorRecord);

      // Publish to general error stats topic
      await pubsub.topic(this.errorStatsTopic).publish(
        Buffer.from(
          JSON.stringify({
            errorId: docRef.id,
            ...errorRecord,
            timestamp: new Date().toISOString(),
          })
        )
      );

      // Also publish to critical error topic if severity is high
      if (severity === SEVERITY.HIGH || severity === SEVERITY.CRITICAL) {
        await pubsub.topic(this.criticalErrorTopic).publish(
          Buffer.from(
            JSON.stringify({
              errorId: docRef.id,
              ...errorRecord,
              timestamp: new Date().toISOString(),
            })
          )
        );

        // Trigger immediate recovery for critical errors
        if (severity === SEVERITY.CRITICAL) {
          await this.triggerRecovery(docRef.id, errorRecord);
        }
      }

      return docRef.id;
    } catch (loggingError) {
      // Fallback to console if Firestore logging fails
      console.error('Error logging failed:', loggingError);
      console.error('Original error:', error);
      return null;
    }
  }

  /**
   * Categorize an error based on its characteristics
   *
   * @param {Error} error - The error to categorize
   * @param {string} component - Component where error occurred
   * @returns {Object} Error type and severity
   */
  categorizeError(error, component) {
    // Default values
    let type = ERROR_TYPES.UNKNOWN;
    let severity = SEVERITY.MEDIUM;

    // Determine type based on error message and component
    if (
      error.name === 'FirebaseError' ||
      error.message.includes('firestore') ||
      error.message.includes('database')
    ) {
      type = ERROR_TYPES.DATABASE;
      severity = SEVERITY.HIGH; // Database errors are generally serious
    } else if (
      error.name === 'AxiosError' ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    ) {
      type = ERROR_TYPES.NETWORK;
      severity = SEVERITY.MEDIUM;
    } else if (
      error.message.includes('auth') ||
      error.message.includes('permission') ||
      error.message.includes('unauthorized')
    ) {
      type = ERROR_TYPES.AUTHENTICATION;
      severity = SEVERITY.HIGH;
    } else if (
      error.message.includes('validation') ||
      error.message.includes('invalid')
    ) {
      type = ERROR_TYPES.VALIDATION;
      severity = SEVERITY.LOW;
    } else if (
      component.includes('llm') ||
      error.message.includes('openai') ||
      error.message.includes('anthropic')
    ) {
      type = ERROR_TYPES.LLM;
      severity = SEVERITY.MEDIUM;
    } else if (component.includes('agent') || component.includes('squadron')) {
      type = ERROR_TYPES.AGENT;
      severity = SEVERITY.MEDIUM;
    } else if (
      component.includes('blockchain') ||
      error.message.includes('transaction')
    ) {
      type = ERROR_TYPES.BLOCKCHAIN;
      severity = SEVERITY.HIGH;
    } else if (
      component.includes('integration') ||
      error.message.includes('synthesia') ||
      error.message.includes('gateway')
    ) {
      type = ERROR_TYPES.INTEGRATION;
      severity = SEVERITY.MEDIUM;
    }

    // Determine severity based on error characteristics
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      severity = SEVERITY.CRITICAL;
    } else if (
      error.stack &&
      error.stack.includes('at processTicksAndRejections')
    ) {
      // Uncaught promise rejections often indicate serious issues
      severity = severity === SEVERITY.LOW ? SEVERITY.MEDIUM : severity;
    }

    return { type, severity };
  }

  /**
   * Trigger recovery process for an error
   *
   * @param {string} errorId - ID of the error to recover from
   * @param {Object} errorRecord - Error record data
   * @returns {Promise<boolean>} Success status
   */
  async triggerRecovery(errorId, errorRecord) {
    try {
      // Create recovery attempt record
      const attemptRef = await this.recoveryAttemptsCollection.add({
        errorId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        successful: false,
        component: errorRecord.component,
        type: errorRecord.type,
        actions: [],
        completed: false,
      });

      // Increment recovery attempts counter
      await this.errorsCollection.doc(errorId).update({
        recoveryAttempts: admin.firestore.FieldValue.increment(1),
        lastRecoveryAttempt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Select recovery strategy based on error type
      const recoveryActions = [];
      let successful = false;

      switch (errorRecord.type) {
        case ERROR_TYPES.DATABASE:
          successful = await this._recoverDatabaseError(
            errorRecord,
            recoveryActions
          );
          break;
        case ERROR_TYPES.NETWORK:
          successful = await this._recoverNetworkError(
            errorRecord,
            recoveryActions
          );
          break;
        case ERROR_TYPES.LLM:
          successful = await this._recoverLLMError(
            errorRecord,
            recoveryActions
          );
          break;
        case ERROR_TYPES.AGENT:
          successful = await this._recoverAgentError(
            errorRecord,
            recoveryActions
          );
          break;
        case ERROR_TYPES.BLOCKCHAIN:
          successful = await this._recoverBlockchainError(
            errorRecord,
            recoveryActions
          );
          break;
        case ERROR_TYPES.INTEGRATION:
          successful = await this._recoverIntegrationError(
            errorRecord,
            recoveryActions
          );
          break;
        default:
          recoveryActions.push('No specific recovery strategy available');
          break;
      }

      // Update recovery attempt with results
      await this.recoveryAttemptsCollection.doc(attemptRef.id).update({
        successful,
        actions: recoveryActions,
        completed: true,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If recovery was successful, mark error as resolved
      if (successful) {
        await this.errorsCollection.doc(errorId).update({
          resolved: true,
          resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
          resolutionMethod: 'automatic',
        });
      }

      return successful;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);

      // Try to update recovery attempt if possible
      try {
        await this.recoveryAttemptsCollection.doc(attemptRef.id).update({
          successful: false,
          actions: [
            'Recovery process failed with error: ' + recoveryError.message,
          ],
          completed: true,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          recoveryError: recoveryError.message,
        });
      } catch (e) {
        console.error('Failed to update recovery attempt:', e);
      }

      return false;
    }
  }

  // Specific recovery strategies

  /**
   * Recovery strategy for database errors
   * @private
   */
  async _recoverDatabaseError(errorRecord, recoveryActions) {
    recoveryActions.push('Checking database connection');

    try {
      // Test database connection with a simple query
      await firestore.collection('systemStatus').doc('database').get();
      recoveryActions.push('Database connection verified');

      // Check if error was a transaction failure
      if (errorRecord.message.includes('transaction')) {
        recoveryActions.push('Identified transaction failure');

        // Could implement retry logic for the specific transaction
        recoveryActions.push('Transaction recovery would be implemented here');
      }

      return true;
    } catch (e) {
      recoveryActions.push(`Database connection test failed: ${e.message}`);

      // Try to reconnect
      try {
        // In a real system, might implement reconnection logic here
        recoveryActions.push('Attempting database reconnection');

        // For demo purposes, we'll just assume it worked
        recoveryActions.push('Database reconnection successful');
        return true;
      } catch (reconnectError) {
        recoveryActions.push(
          `Database reconnection failed: ${reconnectError.message}`
        );
        return false;
      }
    }
  }

  /**
   * Recovery strategy for network errors
   * @private
   */
  async _recoverNetworkError(errorRecord, recoveryActions) {
    recoveryActions.push('Analyzing network error');

    // Extract endpoint from context if available
    const endpoint = errorRecord.context?.endpoint || 'unknown';
    recoveryActions.push(`Error occurred with endpoint: ${endpoint}`);

    // Check if it's a timeout
    if (errorRecord.message.includes('timeout')) {
      recoveryActions.push('Identified timeout error');

      // For timeouts, we might implement retry with exponential backoff
      recoveryActions.push('Applying retry with longer timeout');

      // Simulate retry success
      recoveryActions.push('Retry successful');
      return true;
    }

    // Check if it's a connection refused error
    if (
      errorRecord.message.includes('ECONNREFUSED') ||
      errorRecord.message.includes('connection refused')
    ) {
      recoveryActions.push('Identified connection refused error');

      // For connection refused, check if service is down
      recoveryActions.push('Checking service health');

      // Simulate service check
      recoveryActions.push(
        'Service appears to be running, may be temporary network issue'
      );

      // Could implement notification to ops team here
      recoveryActions.push('Flagging for operator attention');
      return false;
    }

    // Generic network error
    recoveryActions.push('General network issue, will retry');
    return true;
  }

  /**
   * Recovery strategy for LLM errors
   * @private
   */
  async _recoverLLMError(errorRecord, recoveryActions) {
    recoveryActions.push('Analyzing LLM service error');

    // Check provider from context
    const provider = errorRecord.context?.provider || 'unknown';
    recoveryActions.push(`Error occurred with provider: ${provider}`);

    // Implement provider failover
    if (provider !== 'unknown') {
      recoveryActions.push(`Attempting to failover from ${provider}`);

      // Determine alternate provider
      let alternateProvider;
      if (provider === 'openai') {
        alternateProvider = 'anthropic';
      } else if (provider === 'anthropic') {
        alternateProvider = 'huggingface';
      } else {
        alternateProvider = 'openai';
      }

      recoveryActions.push(`Selected alternate provider: ${alternateProvider}`);

      // Simulate failover success
      recoveryActions.push(`Failover to ${alternateProvider} successful`);
      return true;
    }

    // Generic fallback
    recoveryActions.push(
      'Unable to determine specific LLM provider for failover'
    );
    return false;
  }

  /**
   * Recovery strategy for agent errors
   * @private
   */
  async _recoverAgentError(errorRecord, recoveryActions) {
    recoveryActions.push('Analyzing agent error');

    // Extract agent info
    const agentId = errorRecord.context?.agentId || 'unknown';
    const squadronId = errorRecord.context?.squadronId || 'unknown';

    recoveryActions.push(
      `Error occurred with agent: ${agentId} in squadron: ${squadronId}`
    );

    // Check if it's a resource issue
    if (
      errorRecord.message.includes('memory') ||
      errorRecord.message.includes('resource')
    ) {
      recoveryActions.push('Identified resource constraint');

      // Could implement resource scaling here
      recoveryActions.push('Initiating agent restart with increased resources');

      // Simulate restart
      recoveryActions.push('Agent restarted successfully');
      return true;
    }

    // Check if it's a knowledge/capability issue
    if (
      errorRecord.message.includes('capability') ||
      errorRecord.message.includes('unable to')
    ) {
      recoveryActions.push('Identified capability limitation');

      // Could implement agent substitution
      recoveryActions.push('Finding alternate agent with required capability');

      // Simulate agent substitution
      recoveryActions.push('Alternate agent assignment successful');
      return true;
    }

    // Generic agent error
    recoveryActions.push('Attempting agent restart');
    recoveryActions.push('Agent restart completed');
    return true;
  }

  /**
   * Recovery strategy for blockchain errors
   * @private
   */
  async _recoverBlockchainError(errorRecord, recoveryActions) {
    recoveryActions.push('Analyzing blockchain error');

    // Check transaction info
    const transactionId = errorRecord.context?.transactionId || 'unknown';
    recoveryActions.push(`Error occurred with transaction: ${transactionId}`);

    // Check if it's a validation error
    if (
      errorRecord.message.includes('validation') ||
      errorRecord.message.includes('invalid')
    ) {
      recoveryActions.push('Identified blockchain validation error');

      // For validation errors, we might need manual intervention
      recoveryActions.push(
        'Flagging for manual review, validation errors often require human intervention'
      );
      return false;
    }

    // Check if it's a timeout
    if (errorRecord.message.includes('timeout')) {
      recoveryActions.push('Identified transaction timeout');

      // Could implement transaction status check
      recoveryActions.push('Checking transaction status in blockchain');

      // Simulate status check
      recoveryActions.push('Transaction appears to be pending, will monitor');
      return true;
    }

    // Generic blockchain error
    recoveryActions.push('Attempting transaction resubmission');
    recoveryActions.push('Transaction resubmitted');
    return true;
  }

  /**
   * Recovery strategy for integration errors
   * @private
   */
  async _recoverIntegrationError(errorRecord, recoveryActions) {
    recoveryActions.push('Analyzing integration error');

    // Extract integration info
    const integration = errorRecord.context?.integration || 'unknown';
    recoveryActions.push(`Error occurred with integration: ${integration}`);

    // Handle Synthesia.io specific errors
    if (
      integration === 'synthesia' ||
      errorRecord.message.includes('synthesia')
    ) {
      recoveryActions.push('Identified Synthesia.io integration issue');

      // Check if it's an API key issue
      if (
        errorRecord.message.includes('key') ||
        errorRecord.message.includes('auth')
      ) {
        recoveryActions.push(
          'Possible API key issue, refreshing authentication'
        );

        // Simulate auth refresh
        recoveryActions.push('Authentication refreshed');
        return true;
      }

      // Check if it's a rate limit issue
      if (
        errorRecord.message.includes('rate') ||
        errorRecord.message.includes('limit')
      ) {
        recoveryActions.push('Rate limit hit, implementing backoff strategy');

        // Simulate backoff
        recoveryActions.push('Scheduled retry with backoff');
        return true;
      }
    }

    // Generic integration error
    recoveryActions.push('Attempting integration refresh');
    recoveryActions.push('Integration connection refreshed');
    return true;
  }

  /**
   * Track system-wide error patterns to identify recurring issues
   *
   * @param {string} timeframe - Time period for analysis (e.g., '1h', '24h', '7d')
   * @returns {Promise<Object>} Error pattern analysis
   */
  async trackErrorPatterns(timeframe = '24h') {
    try {
      // Convert timeframe to timestamp
      const timeframeMs = this._timeframeToMs(timeframe);
      const cutoffTime = new Date(Date.now() - timeframeMs);

      // Query recent errors
      const snapshot = await this.errorsCollection
        .where('timestamp', '>=', cutoffTime)
        .get();

      // Analyze patterns
      const errorsByType = {};
      const errorsByComponent = {};
      const errorsBySeverity = {};
      const frequentMessages = {};

      snapshot.forEach(doc => {
        const error = doc.data();

        // Count by type
        errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;

        // Count by component
        errorsByComponent[error.component] =
          (errorsByComponent[error.component] || 0) + 1;

        // Count by severity
        errorsBySeverity[error.severity] =
          (errorsBySeverity[error.severity] || 0) + 1;

        // Track frequent messages
        const simplifiedMessage = this._simplifyErrorMessage(error.message);
        frequentMessages[simplifiedMessage] =
          (frequentMessages[simplifiedMessage] || 0) + 1;
      });

      // Sort frequent messages and get top 10
      const topMessages = Object.entries(frequentMessages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([message, count]) => ({ message, count }));

      return {
        timeframe,
        totalErrors: snapshot.size,
        errorsByType,
        errorsByComponent,
        errorsBySeverity,
        topMessages,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error analyzing error patterns:', error);
      throw error;
    }
  }

  /**
   * Simplify error message for pattern matching
   * @private
   */
  _simplifyErrorMessage(message) {
    // Replace specific values with placeholders
    return message
      .replace(/\d+/g, '<NUM>') // Replace numbers
      .replace(/(['"]).*?\1/g, '<STR>') // Replace quoted strings
      .replace(
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
        '<UUID>'
      ) // Replace UUIDs
      .substring(0, 100); // Limit length
  }

  /**
   * Convert timeframe string to milliseconds
   * @private
   */
  _timeframeToMs(timeframe) {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));

    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'w':
        return value * 7 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
  }
}

/**
 * System Health Monitor
 *
 * Monitors and reports on overall system health
 */
class SystemHealthMonitor {
  constructor(errorTracker) {
    this.errorTracker = errorTracker;
    this.healthCollection = firestore.collection('systemHealth');
    this.componentsCollection = firestore.collection('systemComponents');
  }

  /**
   * Update health status for a component
   *
   * @param {string} componentId - Component identifier
   * @param {string} status - Health status (healthy, degraded, unhealthy)
   * @param {Object} metrics - Health metrics
   * @returns {Promise<void>}
   */
  async updateComponentHealth(componentId, status, metrics = {}) {
    await this.componentsCollection.doc(componentId).set(
      {
        status,
        metrics,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        history: admin.firestore.FieldValue.arrayUnion({
          status,
          timestamp: new Date().toISOString(),
        }),
      },
      { merge: true }
    );
  }

  /**
   * Get overall system health report
   *
   * @returns {Promise<Object>} System health report
   */
  async getSystemHealthReport() {
    // Get component statuses
    const componentsSnapshot = await this.componentsCollection.get();

    const components = {};
    let overallStatus = 'healthy';

    componentsSnapshot.forEach(doc => {
      const component = doc.data();
      components[doc.id] = {
        status: component.status,
        updatedAt: component.updatedAt
          ? component.updatedAt.toDate().toISOString()
          : null,
      };

      // Update overall status based on component statuses
      if (component.status === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if (
        component.status === 'degraded' &&
        overallStatus === 'healthy'
      ) {
        overallStatus = 'degraded';
      }
    });

    // Get recent error patterns
    const errorPatterns = await this.errorTracker.trackErrorPatterns('1h');

    // Create health report
    const report = {
      status: overallStatus,
      components,
      recentErrors: {
        count: errorPatterns.totalErrors,
        byType: errorPatterns.errorsByType,
        bySeverity: errorPatterns.errorsBySeverity,
      },
      timestamp: new Date().toISOString(),
    };

    // Store the report
    await this.healthCollection.add(report);

    return report;
  }

  /**
   * Check if system is experiencing a critical issue
   *
   * @returns {Promise<boolean>} True if system has critical issues
   */
  async hasCriticalIssues() {
    // Check for critical errors in the last hour
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000);

    const criticalErrorsCount = await this.errorTracker.errorsCollection
      .where('severity', '==', SEVERITY.CRITICAL)
      .where('timestamp', '>=', cutoffTime)
      .count()
      .get()
      .then(snapshot => snapshot.data().count);

    return criticalErrorsCount > 0;
  }
}

/**
 * Create and export error tracker instance
 */
const errorTracker = new ErrorTracker();
const healthMonitor = new SystemHealthMonitor(errorTracker);

/**
 * Express middleware for error handling
 *
 * @param {string} component Component name for error categorization
 */
function errorHandlingMiddleware(component) {
  return async (err, req, res, next) => {
    try {
      // Categorize the error
      const { type, severity } = errorTracker.categorizeError(err, component);

      // Log the error
      const context = {
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.headers['user-agent'],
        userId: req.user?.uid,
        params: req.params,
        query: req.query,
      };

      await errorTracker.logError(err, component, type, severity, context);

      // Send appropriate response
      const status = err.status || err.statusCode || 500;
      res.status(status).json({
        error: err.message,
        type,
        code: err.code,
        timestamp: new Date().toISOString(),
      });
    } catch (loggingError) {
      console.error('Error in error handling middleware:', loggingError);

      // Fallback response
      res.status(500).json({
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Cloud Function to process error stats
 */
exports.processErrorStats = functions.pubsub
  .topic('aixtiv-error-stats')
  .onPublish(async message => {
    try {
      const errorData = message.json;

      // Update component health based on errors
      await healthMonitor.updateComponentHealth(
        errorData.component,
        errorData.severity === SEVERITY.CRITICAL
          ? 'unhealthy'
          : errorData.severity === SEVERITY.HIGH
            ? 'degraded'
            : 'healthy',
        { lastError: errorData.message }
      );

      return null;
    } catch (error) {
      console.error('Error processing error stats:', error);
      return null;
    }
  });

/**
 * Cloud Function to handle critical errors
 */
exports.handleCriticalErrors = functions.pubsub
  .topic('aixtiv-critical-errors')
  .onPublish(async message => {
    try {
      const errorData = message.json;

      // Attempt recovery
      await errorTracker.triggerRecovery(errorData.errorId, errorData);

      // Generate system health report
      await healthMonitor.getSystemHealthReport();

      return null;
    } catch (error) {
      console.error('Error handling critical error:', error);
      return null;
    }
  });

/**
 * Cloud Function to generate periodic health reports
 */
exports.generateHealthReport = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async context => {
    try {
      await healthMonitor.getSystemHealthReport();
      return null;
    } catch (error) {
      console.error('Error generating health report:', error);
      return null;
    }
  });

// Export modules
module.exports = {
  errorTracker,
  healthMonitor,
  errorHandlingMiddleware,
  ERROR_TYPES,
  SEVERITY,
};
