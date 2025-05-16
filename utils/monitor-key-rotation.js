/**
 * Cryptographic Key Rotation Monitor for Integration Gateway
 * 
 * This script monitors the KMS keys used by the Integration Gateway and:
 * 1. Verifies that key rotation is properly configured
 * 2. Checks when the next rotation is scheduled
 * 3. Validates that keys are being rotated according to schedule
 * 4. Alerts if there are any issues with key rotation
 * 
 * Usage:
 *   node monitor-key-rotation.js
 */

const {KeyManagementServiceClient} = require('@google-cloud/kms');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Constants
const CONFIG_PATH = path.resolve(__dirname, '../gateway-config.yaml');
const DEFAULT_CONFIG = {
  projectId: 'api-for-warp-drive',
  location: 'us-west1',
  keyRing: 'integration-gateway-ring',
  encryptionKey: 'igw-encryption-key',
  signingKey: 'igw-signing-key'
};

// Initialize KMS client
const kmsClient = new KeyManagementServiceClient();

/**
 * Load configuration from gateway-config.yaml
 * 
 * @returns {Object} KMS configuration
 */
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.warn(`Warning: Gateway config file not found at: ${CONFIG_PATH}`);
      return DEFAULT_CONFIG;
    }

    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = yaml.load(configContent);

    // Extract crypto config
    if (config?.spec?.crypto?.kms) {
      return {
        projectId: config.spec.crypto.kms.project_id || DEFAULT_CONFIG.projectId,
        location: config.spec.crypto.kms.location || DEFAULT_CONFIG.location,
        keyRing: config.spec.crypto.kms.key_ring || DEFAULT_CONFIG.keyRing,
        encryptionKey: config.spec.crypto.kms.encryption_key || DEFAULT_CONFIG.encryptionKey,
        signingKey: config.spec.crypto.kms.signing_key || DEFAULT_CONFIG.signingKey
      };
    }

    console.warn('Warning: No crypto configuration found in gateway-config.yaml');
    return DEFAULT_CONFIG;
  } catch (err) {
    console.error('Error loading configuration:', err);
    return DEFAULT_CONFIG;
  }
}

/**
 * Get key path for a KMS key
 * 
 * @param {Object} config - KMS configuration
 * @param {string} keyName - Name of the key
 * @returns {string} Full resource path
 */
function getKeyPath(config, keyName) {
  return `projects/${config.projectId}/locations/${config.location}/keyRings/${config.keyRing}/cryptoKeys/${keyName}`;
}

/**
 * Check key rotation status
 * 
 * @param {string} keyName - Name of the key to check
 * @returns {Promise<Object>} Key rotation status
 */
async function checkKeyRotation(keyName) {
  const config = loadConfig();
  const keyPath = getKeyPath(config, keyName);
  
  try {
    console.log(`Checking rotation for key: ${keyPath}`);
    
    // Get the key
    const [key] = await kmsClient.getCryptoKey({
      name: keyPath
    });
    
    // Check if rotation is enabled
    const rotationEnabled = !!key.rotationPeriod;
    
    if (!rotationEnabled) {
      return {
        name: keyName,
        status: 'WARNING',
        rotationEnabled: false,
        message: 'Key rotation is not enabled for this key'
      };
    }
    
    // Calculate rotation period in days
    const rotationPeriod = key.rotationPeriod;
    const rotationDays = parseInt(rotationPeriod.seconds) / (24 * 60 * 60);
    
    // Check when the next rotation is scheduled
    const nextRotationTime = key.nextRotationTime;
    const nextRotationDate = new Date(parseInt(nextRotationTime.seconds) * 1000);
    const daysUntilRotation = Math.floor((nextRotationDate - new Date()) / (24 * 60 * 60 * 1000));
    
    // Get all versions of the key
    const [versions] = await kmsClient.listCryptoKeyVersions({
      parent: keyPath,
      filter: 'state=ENABLED'
    });
    
    // Check the primary version
    const primaryVersion = key.primary;
    const primaryVersionId = primaryVersion.name.split('/').pop();
    
    // Check if the key has been rotated recently
    const primaryCreateTime = new Date(parseInt(primaryVersion.createTime.seconds) * 1000);
    const daysSinceCreation = Math.floor((new Date() - primaryCreateTime) / (24 * 60 * 60 * 1000));
    
    return {
      name: keyName,
      path: keyPath,
      status: 'OK',
      rotationEnabled: true,
      rotationPeriodDays: rotationDays,
      nextRotation: nextRotationDate.toISOString(),
      daysUntilRotation: daysUntilRotation,
      primaryVersion: primaryVersionId,
      primaryVersionCreated: primaryCreateTime.toISOString(),
      daysSinceCreation: daysSinceCreation,
      totalVersions: versions.length,
      message: 'Key rotation is properly configured'
    };
  } catch (err) {
    console.error(`Error checking key rotation for ${keyName}:`, err);
    return {
      name: keyName,
      status: 'ERROR',
      message: `Failed to check key rotation: ${err.message}`
    };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const config = loadConfig();
    console.log('Using configuration:', config);
    
    // Check rotation for encryption key
    const encryptionKeyStatus = await checkKeyRotation(config.encryptionKey);
    console.log('\nEncryption Key Status:');
    console.log(JSON.stringify(encryptionKeyStatus, null, 2));
    
    // Check rotation for signing key
    const signingKeyStatus = await checkKeyRotation(config.signingKey);
    console.log('\nSigning Key Status:');
    console.log(JSON.stringify(signingKeyStatus, null, 2));
    
    // Overall status
    let overallStatus = 'OK';
    let issues = [];
    
    if (encryptionKeyStatus.status !== 'OK') {
      overallStatus = encryptionKeyStatus.status;
      issues.push(`Encryption key issue: ${encryptionKeyStatus.message}`);
    }
    
    if (signingKeyStatus.status !== 'OK') {
      overallStatus = signingKeyStatus.status === 'ERROR' ? 'ERROR' : overallStatus;
      issues.push(`Signing key issue: ${signingKeyStatus.message}`);
    }
    
    // Check if rotation is too far in the future
    if (encryptionKeyStatus.daysUntilRotation > 35) {
      issues.push(`Encryption key rotation is scheduled too far in the future (${encryptionKeyStatus.daysUntilRotation} days)`);
    }
    
    if (signingKeyStatus.daysUntilRotation > 95) {
      issues.push(`Signing key rotation is scheduled too far in the future (${signingKeyStatus.daysUntilRotation} days)`);
    }
    
    // Check if primary version is too old
    if (encryptionKeyStatus.daysSinceCreation > 40) {
      issues.push(`Encryption key primary version is too old (${encryptionKeyStatus.daysSinceCreation} days)`);
    }
    
    if (signingKeyStatus.daysSinceCreation > 100) {
      issues.push(`Signing key primary version is too old (${signingKeyStatus.daysSinceCreation} days)`);
    }
    
    console.log('\nOverall Key Rotation Status:', overallStatus);
    
    if (issues.length > 0) {
      console.log('\nIssues Found:');
      issues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log('\nNo issues found. Key rotation is properly configured.');
    }
    
    console.log('\nNext Steps:');
    console.log(`- Encryption key will rotate in ${encryptionKeyStatus.daysUntilRotation} days`);
    console.log(`- Signing key will rotate in ${signingKeyStatus.daysUntilRotation} days`);
    
  } catch (err) {
    console.error('Error monitoring key rotation:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = { checkKeyRotation, main };