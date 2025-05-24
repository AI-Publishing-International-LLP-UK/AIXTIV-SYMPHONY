/**
 * Secret Manager Integration for CI/CD CTTT Pipeline
 * 
 * Secure integration between the CI/CD CTTT pipeline and Google Cloud Secret Manager
 * providing safe access to secrets with proper audit logging and rotation.
 */

const functions = require('firebase-functions');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const {Logging} = require('@google-cloud/logging');
const {IAMCredentialsClient} = require('@google-cloud/iam-credentials');
const {KeyManagementServiceClient} = require('@google-cloud/kms');
const admin = require('firebase-admin');

// Initialize additional clients
const iamClient = new IAMCredentialsClient();
const kmsClient = new KeyManagementServiceClient();

// Initialize Secret Manager client
const secretManager = new SecretManagerServiceClient();

// Project configuration
const PROJECT_ID = 'api-for-warp-drive';
const SECRET_PREFIX = 'aixtiv-';

// Secret types
const SECRET_TYPES = {
  API_KEY: 'api-key',
  SERVICE_ACCOUNT: 'sa-key',
  OAUTH: 'oauth',
  AGENT: 'dr',
  INTEGRATION: 'integration'
};

// Default rotation periods (in days)
const ROTATION_PERIODS = {
  [SECRET_TYPES.API_KEY]: 30,
  [SECRET_TYPES.SERVICE_ACCOUNT]: 90,
  [SECRET_TYPES.OAUTH]: 180,
  [SECRET_TYPES.AGENT]: 60,
  [SECRET_TYPES.INTEGRATION]: 90
};

// Memory cache for secrets with expiration
const secretCache = new Map();

/**
 * Formats a secret name according to our naming convention
 * 
 * @param {string} type Secret type from SECRET_TYPES
 * @param {string} provider The service provider (e.g., 'anthropic', 'firebase')
 * @param {string} [subtype] Optional subtype (e.g., 'api-key', 'token')
 * @returns {string} Formatted secret name
 */
function formatSecretName(type, provider, subtype = null) {
  let name = `${SECRET_PREFIX}`;
  
  switch (type) {
    case SECRET_TYPES.API_KEY:
      name += `${provider}-api-key`;
      break;
    case SECRET_TYPES.SERVICE_ACCOUNT:
      name += `sa-key-${provider}`;
      break;
    case SECRET_TYPES.OAUTH:
      name += `oauth-${provider}`;
      break;
    case SECRET_TYPES.AGENT:
      name += `dr-${provider}${subtype ? `-${subtype}` : ''}`;
      break;
    case SECRET_TYPES.INTEGRATION:
      name += `integration-${provider}${subtype ? `-${subtype}` : ''}`;
      break;
    default:
      name += `${provider}${subtype ? `-${subtype}` : ''}`;
  }
  
  return name;
}

/**
 * Retrieves a secret from Secret Manager with caching
 * 
 * @param {string} secretName The name of the secret
 * @param {Object} options Configuration options
 * @returns {Promise<string>} The secret value
 */
async function getSecret(secretName, options = {}) {
  // Default options
  const config = {
    useCache: true,
    cacheTtlMs: 3600000, // 1 hour
    logAccess: true,
    version: 'latest',
    ...options
  };
  
  // Full secret path
  const secretPath = `projects/${PROJECT_ID}/secrets/${secretName}/versions/${config.version}`;
  
  // Check cache first if enabled
  if (config.useCache) {
    const cachedValue = secretCache.get(secretPath);
    if (cachedValue && cachedValue.expiresAt > Date.now()) {
      // Log access if enabled
      if (config.logAccess) {
        await logSecretAccess(secretName, 'cache_hit');
      }
      return cachedValue.value;
    }
  }
  
  try {
    // Access the secret
    const [version] = await secretManager.accessSecretVersion({
      name: secretPath
    });
    
    const secretValue = version.payload.data.toString();
    
    // Cache the secret if enabled
    if (config.useCache) {
      secretCache.set(secretPath, {
        value: secretValue,
        expiresAt: Date.now() + config.cacheTtlMs
      });
    }
    
    // Log access if enabled
    if (config.logAccess) {
      await logSecretAccess(secretName, 'direct_access');
    }
    
    return secretValue;
  } catch (error) {
    functions.logger.error(`Error accessing secret ${secretName}:`, error);
    
    // Log the failed access attempt
    await logSecretAccess(secretName, 'access_failed', {
      error: error.message
    });
    
    throw new Error(`Failed to access secret: ${error.message}`);
  }
}

/**
 * Creates or updates a secret in Secret Manager
 * 
 * @param {string} secretName The name of the secret
 * @param {string} secretValue The value of the secret
 * @param {Object} options Configuration options
 * @returns {Promise<Object>} The result of the operation
 */
async function updateSecret(secretName, secretValue, options = {}) {
  // Default options
  const config = {
    createIfMissing: true,
    updateCache: true,
    logAccess: true,
    labels: {},
    ...options
  };
  
  try {
    // Check if the secret exists
    let secretExists = true;
    try {
      await secretManager.getSecret({
        name: `projects/${PROJECT_ID}/secrets/${secretName}`
      });
    } catch (error) {
      if (error.code === 5) { // NOT_FOUND
        secretExists = false;
      } else {
        throw error;
      }
    }
    
    // Create the secret if it doesn't exist
    if (!secretExists) {
      if (!config.createIfMissing) {
        throw new Error(`Secret ${secretName} does not exist`);
      }
      
      await secretManager.createSecret({
        parent: `projects/${PROJECT_ID}`,
        secretId: secretName,
        secret: {
          labels: config.labels,
          replication: {
            automatic: {}
          }
        }
      });
      
      functions.logger.info(`Created new secret: ${secretName}`);
    }
    
    // Add the new secret version
    const [version] = await secretManager.addSecretVersion({
      parent: `projects/${PROJECT_ID}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(secretValue, 'utf8')
      }
    });
    
    // Update cache if enabled
    if (config.updateCache) {
      const secretPath = `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`;
      secretCache.set(secretPath, {
        value: secretValue,
        expiresAt: Date.now() + 3600000 // 1 hour
      });
    }
    
    // Log access if enabled
    if (config.logAccess) {
      await logSecretAccess(secretName, 'update', {
        versionId: version.name.split('/').pop()
      });
    }
    
    return {
      success: true,
      secretName,
      version: version.name
    };
  } catch (error) {
    functions.logger.error(`Error updating secret ${secretName}:`, error);
    
    // Log the failed update attempt
    await logSecretAccess(secretName, 'update_failed', {
      error: error.message
    });
    
    throw new Error(`Failed to update secret: ${error.message}`);
  }
}

/**
 * Logs secret access to Firestore and Cloud Logging for audit purposes
 *
 * @param {string} secretName The name of the secret
 * @param {string} accessType The type of access (e.g., 'read', 'update')
 * @param {Object} metadata Additional metadata
 * @returns {Promise<void>}
 */
async function logSecretAccess(secretName, accessType, metadata = {}) {
  const timestamp = new Date();
  const userId = metadata.userId || 'system';
  const serviceId = metadata.serviceId || 'ci-cd-cttt';

  try {
    // Log to Firestore
    await admin.firestore().collection('secretAccessLogs').add({
      secretName,
      accessType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      serviceId,
      metadata: {
        ...metadata,
        region: 'us-west1'
      }
    });

    // Log to Cloud Logging with structured data
    const logEntry = {
      timestamp: timestamp.toISOString(),
      secretName,
      accessType,
      userId,
      serviceId,
      source: process.env.FUNCTION_NAME || 'unknown',
      resourceId: process.env.RESOURCE_ID || 'unknown',
      sessionId: global.sessionId || 'unknown',
      ipAddress: global.requestIp || 'unknown',
      serviceAccount: process.env.SERVICE_ACCOUNT || 'unknown',
      region: 'us-west1'
    };

    // Determine severity based on access type
    let severity = 'INFO';
    if (accessType === 'create' || accessType === 'update' || accessType === 'delete') {
      severity = 'NOTICE';
    }
    if (accessType.includes('rotation') || accessType.includes('fail')) {
      severity = 'WARNING';
    }

    // Log to Cloud Logging with appropriate metadata
    const logging = new Logging();
    const log = logging.log('secret-access-audit');

    const metadata = {
      severity,
      resource: {
        type: 'cloud_function',
        labels: {
          function_name: process.env.FUNCTION_NAME || 'unknown',
          region: 'us-west1'
        }
      },
      labels: {
        secret_type: getSecretType(secretName),
        environment: process.env.NODE_ENV || 'development',
        module: 'secret-manager',
        component: 'security'
      }
    };

    const entry = log.entry(metadata, logEntry);
    await log.write(entry);

    // Also record high value secret access to a separate security monitoring log
    if (isHighValueSecret(secretName)) {
      const securityLog = logging.log('high-value-secret-access');
      const securityEntry = log.entry({...metadata, severity: 'WARNING'}, logEntry);
      await securityLog.write(securityEntry);
    }
  } catch (error) {
    // Don't fail if logging fails, just log the error
    functions.logger.error('Error logging secret access:', error);
  }
}

/**
 * Helper to determine if a secret is high value
 *
 * @param {string} secretName The name of the secret
 * @returns {boolean} True if the secret is classified as high value
 */
function isHighValueSecret(secretName) {
  // Classify high value secrets - typically service accounts with elevated permissions
  // or secrets that provide administrative access
  const highValuePatterns = [
    /-admin-/i,
    /-superuser-/i,
    /master-key/i,
    /owner-sa/i,
    /root-cert/i,
    /firebase-admin/i,
    /billing-/i,
    /principal-/i
  ];

  return highValuePatterns.some(pattern => pattern.test(secretName));
}

/**
 * Helper to determine secret type from name
 *
 * @param {string} secretName The name of the secret
 * @returns {string} The type of secret
 */
function getSecretType(secretName) {
  for (const [type, prefix] of Object.entries(SECRET_TYPES)) {
    if (secretName.includes(`-${prefix}-`) || secretName.includes(`${prefix}-`)) {
      return type;
    }
  }
  return 'UNKNOWN';
}

/**
 * Rotates a secret and updates all dependent services
 * 
 * @param {string} secretName The name of the secret to rotate
 * @param {Function} generateNewValue Function to generate the new secret value
 * @param {Function} updateDependencies Function to update dependent services
 * @returns {Promise<Object>} The result of the rotation
 */
async function rotateSecret(secretName, generateNewValue, updateDependencies) {
  try {
    // Start the rotation process
    await logSecretAccess(secretName, 'rotation_started');
    
    // Generate the new secret value
    const newValue = await generateNewValue();
    
    // Update the secret in Secret Manager
    const updateResult = await updateSecret(secretName, newValue, {
      updateCache: true,
      logAccess: true
    });
    
    // Update dependencies with the new secret
    const dependencyResults = await updateDependencies(newValue);
    
    // Log the successful rotation
    await logSecretAccess(secretName, 'rotation_completed', {
      versionId: updateResult.version.split('/').pop(),
      dependenciesUpdated: Object.keys(dependencyResults)
    });
    
    // Clear old version from cache
    const oldVersionPath = `projects/${PROJECT_ID}/secrets/${secretName}/versions/1`;
    secretCache.delete(oldVersionPath);
    
    return {
      success: true,
      secretName,
      version: updateResult.version,
      dependencies: dependencyResults
    };
  } catch (error) {
    functions.logger.error(`Error rotating secret ${secretName}:`, error);
    
    // Log the failed rotation
    await logSecretAccess(secretName, 'rotation_failed', {
      error: error.message
    });
    
    throw new Error(`Failed to rotate secret: ${error.message}`);
  }
}

/**
 * Schedules automatic rotation for a secret
 * 
 * @param {string} secretName The name of the secret
 * @param {string} secretType The type of secret from SECRET_TYPES
 * @param {Function} generateNewValue Function to generate the new secret value
 * @param {Function} updateDependencies Function to update dependent services
 * @returns {functions.CloudFunction<functions.pubsub.Message>} The scheduled function
 */
function scheduleSecretRotation(secretName, secretType, generateNewValue, updateDependencies) {
  // Get the rotation period for this secret type
  const rotationPeriodDays = ROTATION_PERIODS[secretType] || 90;

  // Check if high-value secret requires more frequent rotation
  const adjustedPeriod = isHighValueSecret(secretName) ?
    Math.max(30, Math.floor(rotationPeriodDays / 2)) : // High value secrets rotate at least every 30 days
    rotationPeriodDays;

  // Create a schedule expression in the format: "every X days"
  const schedule = `every ${adjustedPeriod} days`;
  
  // Create and return the scheduled function
  return functions.pubsub.schedule(schedule)
    .onRun(async (context) => {
      try {
        functions.logger.info(`Starting scheduled rotation for ${secretName}`);
        
        // Perform the rotation
        const result = await rotateSecret(secretName, generateNewValue, updateDependencies);
        
        functions.logger.info(`Completed scheduled rotation for ${secretName}`, {
          version: result.version.split('/').pop()
        });
        
        return null;
      } catch (error) {
        functions.logger.error(`Scheduled rotation for ${secretName} failed:`, error);
        
        // Note: This failure would trigger a Cloud Functions error which would
        // be visible in the Cloud Functions logs and could trigger alerts
        throw error;
      }
    });
}

/**
 * Retrieves all secrets with a specific prefix
 * 
 * @param {string} prefix The prefix to filter secrets by
 * @returns {Promise<Array<string>>} Array of secret names
 */
async function listSecrets(prefix = SECRET_PREFIX) {
  try {
    const [secrets] = await secretManager.listSecrets({
      parent: `projects/${PROJECT_ID}`,
      filter: `name:${prefix}*`
    });
    
    return secrets.map(secret => {
      const name = secret.name.split('/').pop();
      return {
        name,
        createTime: secret.createTime,
        labels: secret.labels || {}
      };
    });
  } catch (error) {
    functions.logger.error(`Error listing secrets with prefix ${prefix}:`, error);
    throw new Error(`Failed to list secrets: ${error.message}`);
  }
}

/**
 * Invalidates a secret in the cache
 * 
 * @param {string} secretName The name of the secret to invalidate
 * @param {string} version The version to invalidate, defaults to 'latest'
 */
function invalidateCache(secretName, version = 'latest') {
  const secretPath = `projects/${PROJECT_ID}/secrets/${secretName}/versions/${version}`;
  secretCache.delete(secretPath);
  functions.logger.info(`Invalidated cache for ${secretName}:${version}`);
}

/**
 * Clears the entire secret cache
 */
function clearCache() {
  secretCache.clear();
  functions.logger.info('Cleared entire secret cache');
}

/**
 * Scheduled function to clean up secret access logs
 * Retains logs for 90 days by default
 */
exports.cleanupSecretAccessLogs = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const retentionDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Delete old logs
      const snapshot = await admin.firestore()
        .collection('secretAccessLogs')
        .where('timestamp', '<', cutoffDate)
        .get();
      
      const batch = admin.firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      functions.logger.info(`Cleaned up ${snapshot.size} secret access logs older than ${retentionDays} days`);
      return null;
    } catch (error) {
      functions.logger.error('Error cleaning up secret access logs:', error);
      throw error;
    }
  });

/**
 * Cloud Function to create or update a secret
 */
exports.manageSecret = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated and has admin privileges
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin privileges required to manage secrets'
    );
  }
  
  const { action, secretName, secretValue, options } = data;
  
  switch (action) {
    case 'get':
      try {
        const value = await getSecret(secretName, {
          ...options,
          logAccess: true,
          userId: context.auth.uid
        });
        
        // Mask the actual value in the response
        return {
          success: true,
          secretName,
          hasValue: !!value,
          valueLength: value ? value.length : 0
        };
      } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
      }
      
    case 'update':
      try {
        if (!secretValue) {
          throw new Error('Secret value is required for update action');
        }
        
        const result = await updateSecret(secretName, secretValue, {
          ...options,
          logAccess: true,
          userId: context.auth.uid
        });
        
        return {
          success: true,
          secretName,
          version: result.version.split('/').pop()
        };
      } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
      }
      
    case 'list':
      try {
        const secrets = await listSecrets(options?.prefix || SECRET_PREFIX);
        
        await logSecretAccess('multiple', 'list', {
          userId: context.auth.uid,
          count: secrets.length,
          prefix: options?.prefix || SECRET_PREFIX
        });
        
        return {
          success: true,
          secrets
        };
      } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
      }
      
    case 'invalidateCache':
      try {
        if (secretName) {
          invalidateCache(secretName, options?.version || 'latest');
        } else {
          clearCache();
        }
        
        return {
          success: true,
          action: secretName ? 'invalidated' : 'cleared'
        };
      } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
      }
      
    default:
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Unknown action: ${action}`
      );
  }
});

module.exports = {
  getSecret,
  updateSecret,
  rotateSecret,
  scheduleSecretRotation,
  listSecrets,
  invalidateCache,
  clearCache,
  formatSecretName,
  SECRET_TYPES,
  cleanupSecretAccessLogs: exports.cleanupSecretAccessLogs,
  manageSecret: exports.manageSecret
};