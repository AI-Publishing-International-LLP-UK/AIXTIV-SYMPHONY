/**
 * Integration Gateway Crypto Service
 * 
 * This service provides encryption, decryption, signing, and verification operations
 * with automatic key rotation via Google Cloud KMS.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require('./common/logger');
const kmsServiceInit = require('./crypto/kms-crypto-service');

// Load config from gateway-config.yaml
function loadConfig() {
  try {
    const configPath = path.resolve(__dirname, '../gateway-config.yaml');
    if (!fs.existsSync(configPath)) {
      logger.warn(`Gateway config file not found at: ${configPath}`);
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent);

    // Extract crypto config
    if (config && config.spec && config.spec.crypto && config.spec.crypto.kms) {
      return {
        projectId: config.spec.crypto.kms.project_id,
        location: config.spec.crypto.kms.location,
        keyRing: config.spec.crypto.kms.key_ring,
        encryptionKey: config.spec.crypto.kms.encryption_key,
        signingKey: config.spec.crypto.kms.signing_key
      };
    }

    logger.warn('No crypto configuration found in gateway-config.yaml');
    return null;
  } catch (err) {
    logger.error('Failed to load KMS configuration:', err);
    return null;
  }
}

// Initialize KMS service with config from YAML
const kmsConfig = loadConfig();
const kmsService = kmsServiceInit(kmsConfig);

/**
 * Encrypts sensitive data
 * 
 * @param {string|Buffer|Object} data - Data to encrypt
 * @returns {Promise<{ciphertext: string, keyVersion: string}>} - Encrypted data and key version
 */
async function encrypt(data) {
  try {
    return await kmsService.encrypt(data);
  } catch (err) {
    logger.error('Encryption error:', err);
    throw err;
  }
}

/**
 * Decrypts ciphertext
 * 
 * @param {string} ciphertext - Base64-encoded ciphertext
 * @param {string} keyVersion - Version of the key used for encryption
 * @returns {Promise<Buffer>} - Decrypted data
 */
async function decrypt(ciphertext, keyVersion) {
  try {
    return await kmsService.decrypt(ciphertext, keyVersion);
  } catch (err) {
    logger.error('Decryption error:', err);
    throw err;
  }
}

/**
 * Signs data
 * 
 * @param {string|Buffer|Object} data - Data to sign
 * @returns {Promise<{signature: string, keyVersion: string}>} - Signature and key version
 */
async function signData(data) {
  try {
    return await kmsService.sign(data);
  } catch (err) {
    logger.error('Signing error:', err);
    throw err;
  }
}

/**
 * Verifies a signature
 * 
 * @param {string} signature - Base64-encoded signature
 * @param {string|Buffer|Object} data - Original data that was signed
 * @param {string} keyVersion - Version of the key used for signing
 * @returns {Promise<boolean>} - True if signature is valid
 */
async function verifySignature(signature, data, keyVersion) {
  try {
    return await kmsService.verify(signature, data, keyVersion);
  } catch (err) {
    logger.error('Signature verification error:', err);
    throw err;
  }
}

/**
 * Encrypts and signs data in a single operation
 * 
 * @param {string|Buffer|Object} data - Data to protect
 * @returns {Promise<{ciphertext: string, signature: string, encKeyVersion: string, signKeyVersion: string}>}
 */
async function encryptAndSign(data) {
  try {
    return await kmsService.encryptAndSign(data);
  } catch (err) {
    logger.error('Encrypt and sign error:', err);
    throw err;
  }
}

/**
 * Verifies signature and decrypts data
 * 
 * @param {Object} protectedData - Protected data object
 * @param {string} protectedData.ciphertext - Base64-encoded encrypted data
 * @param {string} protectedData.signature - Base64-encoded signature
 * @param {string} protectedData.encKeyVersion - Encryption key version
 * @param {string} protectedData.signKeyVersion - Signing key version
 * @param {boolean} parseJson - Whether to parse the result as JSON
 * @returns {Promise<Buffer|Object|string>} - Decrypted data
 */
async function verifyAndDecrypt(protectedData, parseJson = false) {
  try {
    return await kmsService.verifyAndDecrypt(protectedData, parseJson);
  } catch (err) {
    logger.error('Verify and decrypt error:', err);
    throw err;
  }
}

/**
 * Rotates keys manually (for testing or emergency rotation)
 * 
 * @param {string} keyType - Type of key to rotate ('encryption' or 'signing')
 * @returns {Promise<string>} - New key version
 */
async function rotateKey(keyType) {
  try {
    const keyName = keyType === 'signing' 
      ? kmsConfig.signingKey 
      : kmsConfig.encryptionKey;
    
    return await kmsService.rotateKey(keyName);
  } catch (err) {
    logger.error(`Failed to rotate ${keyType} key:`, err);
    throw err;
  }
}

module.exports = {
  encrypt,
  decrypt,
  signData,
  verifySignature,
  encryptAndSign,
  verifyAndDecrypt,
  rotateKey
};