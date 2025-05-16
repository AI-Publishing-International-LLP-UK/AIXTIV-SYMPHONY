/**
 * KMS Crypto Service for Integration Gateway
 * 
 * This service provides cryptographic operations for the Integration Gateway,
 * using Google Cloud KMS for key management and rotation.
 */

const {KeyManagementServiceClient} = require('@google-cloud/kms');
const crypto = require('crypto');
const logger = require('../common/logger');

// KMS client instance
const kmsClient = new KeyManagementServiceClient();

// Default configuration values - using us-west1 as required
const DEFAULT_CONFIG = {
  projectId: 'api-for-warp-drive',
  location: 'us-west1',
  keyRing: 'integration-gateway-ring',
  encryptionKey: 'igw-encryption-key',
  signingKey: 'igw-signing-key'
};

/**
 * Initialize KMS Crypto Service with configuration
 * 
 * @param {Object} config - KMS configuration options
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.location - GCP location (always us-west1)
 * @param {string} config.keyRing - KMS key ring name
 * @param {string} config.encryptionKey - KMS encryption key name
 * @param {string} config.signingKey - KMS signing key name
 * @returns {Object} - Configured crypto service instance
 */
function init(config = {}) {
  const kmsConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  /**
   * Builds the full resource path for a KMS key
   * 
   * @param {string} keyName - Name of the key
   * @returns {string} - Full resource path
   */
  function getKeyPath(keyName) {
    return `projects/${kmsConfig.projectId}/locations/${kmsConfig.location}/keyRings/${kmsConfig.keyRing}/cryptoKeys/${keyName}`;
  }

  /**
   * Creates a SHA-256 hash of data
   * 
   * @param {string|Buffer} data - Data to hash 
   * @returns {Buffer} - SHA-256 hash
   */
  function sha256(data) {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return crypto.createHash('sha256').update(dataBuffer).digest();
  }

  /**
   * Encrypts data using KMS
   * 
   * @param {string|Buffer} data - Data to encrypt
   * @returns {Promise<{ciphertext: string, keyVersion: string}>} - Encrypted data and key version
   */
  async function encrypt(data) {
    try {
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const encryptionKeyPath = getKeyPath(kmsConfig.encryptionKey);
      
      logger.debug(`Encrypting data using key: ${encryptionKeyPath}`);
      
      const [encryptResponse] = await kmsClient.encrypt({
        name: encryptionKeyPath,
        plaintext: dataBuffer
      });

      // Extract key version from name
      // Format: projects/.../cryptoKeys/keyName/cryptoKeyVersions/1
      const keyVersionPath = encryptResponse.name;
      const keyVersion = keyVersionPath.split('/').pop();
      
      return {
        ciphertext: encryptResponse.ciphertext.toString('base64'),
        keyVersion: keyVersion
      };
    } catch (err) {
      logger.error('Encryption error:', err);
      throw new Error(`Failed to encrypt data: ${err.message}`);
    }
  }

  /**
   * Decrypts ciphertext using KMS
   * 
   * @param {string} ciphertext - Base64 encoded ciphertext
   * @param {string} keyVersion - Version of the key used for encryption
   * @returns {Promise<Buffer>} - Decrypted data
   */
  async function decrypt(ciphertext, keyVersion) {
    try {
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
      const encryptionKeyPath = getKeyPath(kmsConfig.encryptionKey);
      
      // If keyVersion is provided, use it
      const keyPath = keyVersion 
        ? `${encryptionKeyPath}/cryptoKeyVersions/${keyVersion}`
        : encryptionKeyPath;
      
      logger.debug(`Decrypting data using key: ${keyPath}`);
      
      const [decryptResponse] = await kmsClient.decrypt({
        name: keyPath,
        ciphertext: ciphertextBuffer
      });
      
      return decryptResponse.plaintext;
    } catch (err) {
      logger.error('Decryption error:', err);
      throw new Error(`Failed to decrypt data: ${err.message}`);
    }
  }

  /**
   * Signs data using KMS
   * 
   * @param {string|Buffer} data - Data to sign
   * @returns {Promise<{signature: string, keyVersion: string}>} - Signature and key version
   */
  async function sign(data) {
    try {
      // Create digest of the data
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const digest = sha256(dataBuffer);
      
      // Get the latest version of the signing key
      const signingKeyPath = getKeyPath(kmsConfig.signingKey);
      
      // List key versions to get the latest active one
      const [versions] = await kmsClient.listCryptoKeyVersions({
        parent: signingKeyPath,
        filter: 'state=ENABLED'
      });
      
      if (!versions || versions.length === 0) {
        throw new Error('No enabled key versions found for signing key');
      }
      
      // Use the first enabled version
      const version = versions[0];
      const keyVersion = version.name.split('/').pop();
      
      logger.debug(`Signing data using key version: ${version.name}`);
      
      // Create a digest object for asymmetric signing
      const digestObj = {
        sha256: digest
      };
      
      const [signResponse] = await kmsClient.asymmetricSign({
        name: version.name,
        digest: digestObj
      });
      
      return {
        signature: signResponse.signature.toString('base64'),
        keyVersion: keyVersion
      };
    } catch (err) {
      logger.error('Signing error:', err);
      throw new Error(`Failed to sign data: ${err.message}`);
    }
  }

  /**
   * Verifies a signature using KMS
   * 
   * @param {string} signature - Base64 encoded signature
   * @param {string|Buffer} data - Original data that was signed
   * @param {string} keyVersion - Version of the key that was used for signing
   * @returns {Promise<boolean>} - True if signature is valid
   */
  async function verify(signature, data, keyVersion) {
    try {
      if (!keyVersion) {
        throw new Error('Key version is required for signature verification');
      }
      
      // Create digest of the data
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const digest = sha256(dataBuffer);
      
      // Get the specific version of the signing key
      const signingKeyPath = getKeyPath(kmsConfig.signingKey);
      const versionPath = `${signingKeyPath}/cryptoKeyVersions/${keyVersion}`;
      
      logger.debug(`Verifying signature using key version: ${versionPath}`);
      
      // Create a digest object for asymmetric verification
      const digestObj = {
        sha256: digest
      };
      
      const signatureBuffer = Buffer.from(signature, 'base64');
      
      const [verifyResponse] = await kmsClient.asymmetricVerify({
        name: versionPath,
        digest: digestObj,
        signature: signatureBuffer
      });
      
      return verifyResponse.success === true;
    } catch (err) {
      logger.error('Signature verification error:', err);
      throw new Error(`Failed to verify signature: ${err.message}`);
    }
  }

  /**
   * Encrypts and signs data in a single operation
   * 
   * @param {string|Object|Buffer} data - Data to protect
   * @returns {Promise<{ciphertext: string, signature: string, encKeyVersion: string, signKeyVersion: string}>}
   */
  async function encryptAndSign(data) {
    // Convert object to JSON string if needed
    const dataToEncrypt = (typeof data === 'object' && !Buffer.isBuffer(data))
      ? JSON.stringify(data)
      : data;
    
    // First encrypt the data
    const { ciphertext, keyVersion: encKeyVersion } = await encrypt(dataToEncrypt);
    
    // Then sign the encrypted data
    const { signature, keyVersion: signKeyVersion } = await sign(ciphertext);
    
    return {
      ciphertext,
      signature,
      encKeyVersion,
      signKeyVersion
    };
  }

  /**
   * Verifies signature and decrypts data
   * 
   * @param {Object} protectedData - Protected data object
   * @param {string} protectedData.ciphertext - Base64 encoded encrypted data
   * @param {string} protectedData.signature - Base64 encoded signature
   * @param {string} protectedData.encKeyVersion - Encryption key version
   * @param {string} protectedData.signKeyVersion - Signing key version
   * @param {boolean} parseJson - Whether to parse the result as JSON
   * @returns {Promise<Buffer|Object|string>} - Decrypted data
   */
  async function verifyAndDecrypt(protectedData, parseJson = false) {
    const { ciphertext, signature, encKeyVersion, signKeyVersion } = protectedData;
    
    // First verify the signature on the encrypted data
    const isValid = await verify(signature, ciphertext, signKeyVersion);
    if (!isValid) {
      throw new Error('Invalid signature - data integrity cannot be verified');
    }
    
    // Then decrypt the data
    const decrypted = await decrypt(ciphertext, encKeyVersion);
    
    // Parse as JSON if requested
    if (parseJson) {
      try {
        return JSON.parse(decrypted.toString());
      } catch (err) {
        logger.error('Failed to parse decrypted data as JSON:', err);
        throw new Error('Failed to parse decrypted data as JSON');
      }
    }
    
    return decrypted;
  }

  /**
   * Rotates a key by forcing an immediate rotation
   * 
   * @param {string} keyName - Name of the key to rotate
   * @returns {Promise<string>} - New key version
   */
  async function rotateKey(keyName) {
    try {
      const keyPath = getKeyPath(keyName);
      
      logger.info(`Manually rotating key: ${keyPath}`);
      
      // Trigger immediate rotation
      await kmsClient.cryptoKeysRotate({
        name: keyPath
      });
      
      // Get the new primary version
      const [key] = await kmsClient.getCryptoKey({
        name: keyPath
      });
      
      logger.info(`Key rotated successfully: ${keyPath}`);
      
      return key.primary.name.split('/').pop();
    } catch (err) {
      logger.error(`Failed to rotate key ${keyName}:`, err);
      throw new Error(`Failed to rotate key ${keyName}: ${err.message}`);
    }
  }

  return {
    encrypt,
    decrypt,
    sign,
    verify,
    encryptAndSign,
    verifyAndDecrypt,
    rotateKey
  };
}

// Export the initialization function
module.exports = init;