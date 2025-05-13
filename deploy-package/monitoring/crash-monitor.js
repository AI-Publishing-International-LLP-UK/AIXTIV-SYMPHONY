/**
 * Live Copilot Crash Monitor
 * 
 * Detects stalled copilot instances and automatically reroutes to backup agents
 * with session persistence to maintain continuity.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { SessionManager } = require('../session/session-manager');
const { AgentFailoverSystem } = require('../services/agent-failover');

// Initialize services
const sessionManager = new SessionManager();
const failoverSystem = new AgentFailoverSystem();

// Configuration
const CONFIG = {
  // Heartbeat interval in milliseconds
  heartbeatInterval: 10000,
  // Timeout for copilot response in milliseconds
  responseTimeout: 30000,
  // Maximum time a copilot can be unresponsive before triggering failover
  maxUnresponsiveTime: 45000,
  // Frequency of health checks in milliseconds
  healthCheckFrequency: 15000,
  // Maximum number of automatic recovery attempts
  maxRecoveryAttempts: 3,
  // Time to wait between recovery attempts in milliseconds
  recoveryAttemptDelay: 5000,
  // Time window for tracking crash frequency
  crashWindowTime: 3600000, // 1 hour
  // Threshold for frequent crashes within window to trigger admin alert
  frequentCrashThreshold: 5,
  // Enable/disable agent failover
  enableFailover: true
};

// Track active copilot sessions
const activeSessions = new Map();

// Track crash statistics
const crashStats = {
  copilotCrashes: new Map(), // Map of copilot ID to crash timestamps
  userSessionCrashes: new Map(), // Map of user ID to crash counts
  totalCrashes: 0,
  successfulFailovers: 0,
  failedFailovers: 0
};

/**
 * Registers a copilot heartbeat
 */
exports.registerHeartbeat = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to register heartbeats'
    );
  }
  
  const { copilotId, sessionId } = data;
  if (!copilotId || !sessionId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameters: copilotId or sessionId'
    );
  }
  
  const userId = context.auth.uid;
  const now = Date.now();
  
  // Update or create session record
  const sessionKey = `${userId}:${sessionId}`;
  const sessionRecord = activeSessions.get(sessionKey) || {
    userId,
    copilotId,
    sessionId,
    sessionContext: data.sessionContext || {},
    activePrompts: data.activePrompts || [],
    createdAt: now,
    lastHeartbeat: now,
    lastActivity: now,
    recoveryAttempts: 0
  };
  
  // Update session with latest heartbeat
  sessionRecord.lastHeartbeat = now;
  if (data.activePrompts) {
    sessionRecord.activePrompts = data.activePrompts;
  }
  if (data.sessionContext) {
    sessionRecord.sessionContext = {
      ...sessionRecord.sessionContext,
      ...data.sessionContext
    };
  }
  
  activeSessions.set(sessionKey, sessionRecord);
  
  // Log heartbeat
  functions.logger.debug(`Copilot heartbeat received`, {
    userId,
    copilotId,
    sessionId
  });
  
  return { success: true, timestamp: now };
});

/**
 * Reports a copilot crash
 */
exports.reportCopilotCrash = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to report crashes'
    );
  }
  
  const { copilotId, sessionId, errorDetails } = data;
  if (!copilotId || !sessionId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameters: copilotId or sessionId'
    );
  }
  
  const userId = context.auth.uid;
  const now = Date.now();
  
  // Record crash details
  const sessionKey = `${userId}:${sessionId}`;
  const sessionRecord = activeSessions.get(sessionKey);
  
  // Update crash statistics
  crashStats.totalCrashes++;
  
  // Track crashes by copilot
  if (!crashStats.copilotCrashes.has(copilotId)) {
    crashStats.copilotCrashes.set(copilotId, []);
  }
  crashStats.copilotCrashes.get(copilotId).push(now);
  
  // Track crashes by user
  if (!crashStats.userSessionCrashes.has(userId)) {
    crashStats.userSessionCrashes.set(userId, 0);
  }
  crashStats.userSessionCrashes.set(
    userId, 
    crashStats.userSessionCrashes.get(userId) + 1
  );
  
  // Store crash details in Firestore for analysis
  await admin.firestore().collection('copilotCrashes').add({
    userId,
    copilotId,
    sessionId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    errorDetails: errorDetails || {},
    sessionContext: sessionRecord?.sessionContext || {},
    userAgent: context.rawRequest?.headers?.['user-agent'] || 'Unknown',
    hadActiveSession: !!sessionRecord
  });
  
  // Check for frequent crashes
  checkForFrequentCrashes(copilotId, userId);
  
  // Attempt recovery if enabled
  let recoveryResult = null;
  if (CONFIG.enableFailover && sessionRecord) {
    recoveryResult = await attemptCopilotRecovery(sessionRecord, errorDetails);
  }
  
  return {
    success: true,
    timestamp: now,
    recoveryAttempted: !!recoveryResult,
    recoverySuccessful: recoveryResult?.success || false,
    backupCopilotId: recoveryResult?.backupCopilotId || null
  };
});

/**
 * Health check to detect stalled copilot sessions
 */
exports.checkCopilotHealth = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = Date.now();
    const stalledSessions = [];
    
    // Check each active session
    activeSessions.forEach((session, key) => {
      const timeSinceHeartbeat = now - session.lastHeartbeat;
      
      // Check if session has expired heartbeat
      if (timeSinceHeartbeat > CONFIG.maxUnresponsiveTime) {
        stalledSessions.push({
          ...session,
          timeSinceHeartbeat
        });
        
        // Log stalled session
        functions.logger.warn(`Copilot session stalled`, {
          userId: session.userId,
          copilotId: session.copilotId,
          sessionId: session.sessionId,
          timeSinceHeartbeat
        });
      }
    });
    
    // Handle stalled sessions
    for (const session of stalledSessions) {
      if (CONFIG.enableFailover) {
        // Attempt recovery
        const recoveryResult = await attemptCopilotRecovery(
          session, 
          { reason: 'heartbeat_timeout' }
        );
        
        // Remove stalled session if recovery was successful or too many attempts
        if (recoveryResult.success || session.recoveryAttempts >= CONFIG.maxRecoveryAttempts) {
          activeSessions.delete(`${session.userId}:${session.sessionId}`);
        }
      } else {
        // Just remove the session if failover is disabled
        activeSessions.delete(`${session.userId}:${session.sessionId}`);
      }
    }
    
    // Update crash statistics in Firestore once per hour
    if (now % 3600000 < 60000) {
      await updateCrashStatistics();
    }
    
    return null;
  });

/**
 * Attempts to recover a crashed copilot session
 */
async function attemptCopilotRecovery(session, errorDetails) {
  try {
    // Increment recovery attempts counter
    session.recoveryAttempts += 1;
    
    // Check if we've exceeded max attempts
    if (session.recoveryAttempts > CONFIG.maxRecoveryAttempts) {
      // Log failure
      functions.logger.error(`Max recovery attempts exceeded for session`, {
        userId: session.userId,
        copilotId: session.copilotId,
        sessionId: session.sessionId,
        attempts: session.recoveryAttempts
      });
      
      // Record failed failover
      crashStats.failedFailovers += 1;
      
      return {
        success: false,
        reason: 'max_attempts_exceeded'
      };
    }
    
    // Perform session failover to backup copilot
    const failoverResult = await failoverSystem.performFailover(
      session.copilotId,
      session.userId,
      session.sessionId,
      {
        sessionContext: session.sessionContext,
        activePrompts: session.activePrompts,
        errorDetails
      }
    );
    
    if (failoverResult.success) {
      // Update session record with new copilot ID
      session.previousCopilotId = session.copilotId;
      session.copilotId = failoverResult.backupCopilotId;
      session.lastHeartbeat = Date.now();
      session.sessionContext = {
        ...session.sessionContext,
        ...failoverResult.updatedContext,
        recoveryCount: (session.sessionContext.recoveryCount || 0) + 1
      };
      
      // Record successful failover
      crashStats.successfulFailovers += 1;
      
      // Log success
      functions.logger.info(`Successfully failed over copilot session`, {
        userId: session.userId,
        originalCopilotId: session.previousCopilotId,
        newCopilotId: session.copilotId,
        sessionId: session.sessionId
      });
      
      return {
        success: true,
        backupCopilotId: failoverResult.backupCopilotId
      };
    } else {
      // Record failed failover
      crashStats.failedFailovers += 1;
      
      // Log failure
      functions.logger.error(`Failed to failover copilot session`, {
        userId: session.userId,
        copilotId: session.copilotId,
        sessionId: session.sessionId,
        error: failoverResult.error
      });
      
      return {
        success: false,
        reason: failoverResult.error
      };
    }
  } catch (error) {
    // Record failed failover
    crashStats.failedFailovers += 1;
    
    // Log unexpected error
    functions.logger.error(`Error during copilot recovery`, {
      userId: session.userId,
      copilotId: session.copilotId,
      sessionId: session.sessionId,
      error: error.message
    });
    
    return {
      success: false,
      reason: 'unexpected_error',
      error: error.message
    };
  }
}

/**
 * Checks for frequent crashes of the same copilot
 */
function checkForFrequentCrashes(copilotId, userId) {
  const now = Date.now();
  const crashes = crashStats.copilotCrashes.get(copilotId) || [];
  
  // Filter to crashes within the time window
  const recentCrashes = crashes.filter(
    timestamp => now - timestamp < CONFIG.crashWindowTime
  );
  
  // If frequent crashes detected, alert admin
  if (recentCrashes.length >= CONFIG.frequentCrashThreshold) {
    const alertDetails = {
      title: `Frequent crashes for copilot ${copilotId}`,
      message: `Copilot has crashed ${recentCrashes.length} times in the last hour`,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      metadata: {
        copilotId,
        userId,
        crashCount: recentCrashes.length,
        crashWindow: CONFIG.crashWindowTime,
        threshold: CONFIG.frequentCrashThreshold
      }
    };
    
    // Log alert
    functions.logger.error(`ALERT: ${alertDetails.title}`, alertDetails);
    
    // Store alert in Firestore
    admin.firestore().collection('alerts').add(alertDetails)
      .catch(error => {
        functions.logger.error('Error storing alert', error);
      });
  }
}

/**
 * Updates crash statistics in Firestore
 */
async function updateCrashStatistics() {
  try {
    // Calculate statistics
    const now = Date.now();
    const copilotStats = {};
    
    crashStats.copilotCrashes.forEach((crashes, copilotId) => {
      const recentCrashes = crashes.filter(
        timestamp => now - timestamp < CONFIG.crashWindowTime
      );
      copilotStats[copilotId] = {
        totalCrashes: crashes.length,
        recentCrashes: recentCrashes.length
      };
    });
    
    // Store statistics
    await admin.firestore().collection('system').doc('crashStats').set({
      totalCrashes: crashStats.totalCrashes,
      successfulFailovers: crashStats.successfulFailovers,
      failedFailovers: crashStats.failedFailovers,
      activeSessions: activeSessions.size,
      copilotStats,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    functions.logger.error('Error updating crash statistics', error);
  }
}

/**
 * Manually clear a stalled session
 */
exports.clearStalledSession = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated and is admin or the session owner
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to clear sessions'
    );
  }
  
  const { userId, sessionId } = data;
  if (!userId || !sessionId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameters: userId or sessionId'
    );
  }
  
  // Check if user has permission
  const hasPermission = context.auth.token.admin || context.auth.uid === userId;
  if (!hasPermission) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User does not have permission to clear this session'
    );
  }
  
  // Clear the session
  const sessionKey = `${userId}:${sessionId}`;
  const wasRemoved = activeSessions.delete(sessionKey);
  
  // Log action
  functions.logger.info(`Session manually cleared`, {
    userId,
    sessionId,
    clearedBy: context.auth.uid,
    wasActive: wasRemoved
  });
  
  return {
    success: true,
    wasActive: wasRemoved
  };
});

// Export modules for testing and reuse
module.exports = {
  registerHeartbeat: exports.registerHeartbeat,
  reportCopilotCrash: exports.reportCopilotCrash,
  checkCopilotHealth: exports.checkCopilotHealth,
  clearStalledSession: exports.clearStalledSession
};