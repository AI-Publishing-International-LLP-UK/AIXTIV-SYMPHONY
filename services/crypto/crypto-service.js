/**
 * Crypto Service for Integration Gateway
 * 
 * This service provides cryptographic operations for the Integration Gateway,
 * using Google Cloud KMS for key management and rotation.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const kmsClient = require('../../utils/kms-client');
const logger = require('../../services/common/logger');

// Default configuration (will be overridden by gateway-config.yaml)
const DEFAULT_CONFIG = {
  kms: {
    project_id: 'api-for-warp-drive',
    location: 'us-west1',
    key_ring: 'integration-gateway-ring',
    encryption_key: 'igw-encryption-key',
    signing_key: 'igw-signing-key'
  }
};

// Cache for configuration to avoid repeated file reads
let configCache = null;

/**
 * Loads the KMS configuration from the gateway-config.yaml file
 * 
 * @returns {Object} KMS configuration
 */
function loadConfig() {
  if (configCache) {
    return configCache;
  }

  try {
    const configPath = path.resolve(__dirname, '../../gateway-config.yaml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Simple YAML parsing (for production, use a proper YAML library)
    const kmsConfig = {};
    
    // Extract KMS configuration using regex
    const projectIdMatch = configContent.match(/crypto:\s+kms:\s+project_id:\s+"([^"]+)"/);
    if (projectIdMatch) {
      kmsConfig.project_id = projectIdMatch[1];
    }
    
    const locationMatch = configContent.match(/kms:\s+project_id:[^]*?location:\s+"([^"]+)"/);
    if (locationMatch) {
      kmsConfig.location = locationMatch[1];
    }
    
    const keyRingMatch = configContent.match(/location:[^]*?key_ring:\s+"([^"]+)"/);
    if (keyRingMatch) {
      kmsConfig.key_ring = keyRingMatch[1];
    }
    
    const encryptionKeyMatch = configContent.match(/key_ring:[^]*?encryption_key:\s+"([^"]+)"/);
    if (encryptionKeyMatch) {
      kmsConfig.encryption_key = encryptionKeyMatch[1];
    }
    
    const signingKeyMatch = configContent.match(/encryption_key:[^]*?signing_key:\s+"([^"]+)"/);
    if (signingKeyMatch) {
      kmsConfig.signing_key = signingKeyMatch[1];
    }
    
    // Merge with defaults
    configCache = {
      kms: {
        ...DEFAULT_CONFIG.kms,
        ...kmsConfig
      }
    };
    
    return configCache;
  } catch (error) {
    logger.error('Failed to load KMS configuration:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Creates a SHA-256 hash of the provided data
 * 
 * @param {Buffer|string} data - Data to hash
 * @returns {Buffer} SHA-256 hash as a Buffer
 */
function createSha256Hash(data) {
  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return crypto.createHash('sha256').update(dataBuffer).digest();
}

/**
 * Encrypts sensitive data using Google Cloud KMS
 * 
 * @param {string|Buffer} data - Data to encrypt
 * @returns {Promise<{ciphertext: string, keyVersion: string}>} Encrypted data and key version
 */
async function encryptData(data) {
  const config = loadConfig();
  
  try {
    const result = await kmsClient.encrypt(data, {
      projectId: config.kms.project_id,
      location: config.kms.location,
      keyRing: config.kms.key_ring,
      keyName: config.kms.encryption_key
    });
    
    return result;
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

/**
 * Decrypts data that was encrypted with Google Cloud KMS
 * 
 * @param {string} ciphertext - Base64-encoded ciphertext
 * @param {string} keyVersion - Version of the key used for encryption
 * @returns {Promise<Buffer>} Decrypted data
 */
async function decryptData(ciphertext, keyVersion) {
  const config = loadConfig();
  
  try {
    const plaintext = await kmsClient.decrypt(ciphertext, {
      projectId: config.kms.project_id,
      location: config.kms.location,
      keyRing: config.kms.key_ring,
      keyName: config.kms.encryption_key,
      keyVersion
    });
    
    return plaintext;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

/**
 * Signs data using Google Cloud KMS
 * 
 * @param {string|Buffer} data - Data to sign
 * @returns {Promise<{signature: string, keyVersion: string}>} Signature and key version
 */
async function signData(data) {
  const config = loadConfig();
  
  // Create a SHA-256 hash of the data for signing
  const dataHash = createSha256Hash(data);
  
  try {
    const result = await kmsClient.sign(dataHash, {
      projectId: config.kms.project_id,
      location: config.kms.location,
      keyRing: config.kms.key_ring,
      keyName: config.kms.signing_key
    });
    
    return result;
  } catch (error) {
    logger.error('Signing error:', error);
    throw new Error(`Failed to sign data: ${error.message}`);
  }
}

/**
 * Verifies a signature using Google Cloud KMS
 * 
 * @param {string} signature - Base64-encoded signature
 * @param {string|Buffer} data - Original data that was signed
 * @param {string} keyVersion - Version of the key used for signing
 * @returns {Promise<boolean>} True if signature is valid
 */
async function verifySignature(signature, data, keyVersion) {
  const config = loadConfig();
  
  // Create a SHA-256 hash of the data for verification
  const dataHash = createSha256Hash(data);
  
  try {
    const isValid = await kmsClient.verify(signature, dataHash, {
      projectId: config.kms.project_id,
      location: config.kms.location,
      keyRing: config.kms.key_ring,
      keyName: config.kms.signing_key,
      keyVersion
    });
    
    return isValid;
  } catch (error) {
    logger.error('Signature verification error:', error);
    throw new Error(`Failed to verify signature: ${error.message}`);
  }
}

/**
 * Securely encrypts and signs data
 * 
 * @param {Object|string|Buffer} data - Data to protect
 * @returns {Promise<{ciphertext: string, signature: string, encKeyVersion: string, signKeyVersion: string}>}
 */
async function encryptAndSign(data) {
  // Convert to string if object
  const dataToProtect = typeof data === 'object' && !Buffer.isBuffer(data) 
    ? JSON.stringify(data) 
    : data;
  
  // First encrypt the data
  const { ciphertext, keyVersion: encKeyVersion } = await encryptData(dataToProtect);
  
  // Then sign the ciphertext
  const { signature, keyVersion: signKeyVersion } = await signData(ciphertext);
  
  return {
    ciphertext,
    signature,
    encKeyVersion,
    signKeyVersion
  };
}

/**
 * Verifies and decrypts data that was previously protected with encryptAndSign
 * 
 * @param {Object} protectedData - Protected data object
 * @param {string} protectedData.ciphertext - Base64-encoded ciphertext
 * @param {string} protectedData.signature - Base64-encoded signature
 * @param {string} protectedData.encKeyVersion - Encryption key version
 * @param {string} protectedData.signKeyVersion - Signing key version
 * @param {boolean} asJson - Whether to parse the result as JSON
 * @returns {Promise<Object|string|Buffer>} Decrypted data
 */
async function verifyAndDecrypt(protectedData, asJson = false) {
  const { ciphertext, signature, encKeyVersion, signKeyVersion } = protectedData;
  
  // First verify the signature
  const isValid = await verifySignature(signature, ciphertext, signKeyVersion);
  if (!isValid) {
    throw new Error('Invalid signature - data may have been tampered with');
  }
  
  // Then decrypt the data
  const decryptedData = await decryptData(ciphertext, encKeyVersion);
  
  // Parse as JSON if requested
  if (asJson) {
    try {
      return JSON.parse(decryptedData.toString());
    } catch (error) {
      logger.error('Failed to parse decrypted data as JSON:', error);
      throw new Error('Failed to parse decrypted data as JSON');
    }
  }
  
  return decryptedData;
}

module.exports = {
  encryptData,
  decryptData,
  signData,
  verifySignature,
  encryptAndSign,
  verifyAndDecrypt
};