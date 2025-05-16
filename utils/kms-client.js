/**
 * KMS Client for Integration Gateway
 * 
 * This module provides functions for encrypting and decrypting data using Google Cloud KMS.
 * It handles key rotation transparently by keeping track of the key version used for encryption.
 */

const {KeyManagementServiceClient} = require('@google-cloud/kms');
const kms = new KeyManagementServiceClient();

// Default configuration values
const DEFAULT_PROJECT_ID = 'api-for-warp-drive';
const DEFAULT_LOCATION = 'us-west1';
const DEFAULT_KEY_RING = 'integration-gateway-ring';
const DEFAULT_ENCRYPTION_KEY = 'igw-encryption-key';
const DEFAULT_SIGNING_KEY = 'igw-signing-key';

/**
 * Builds the full resource path for a KMS key
 * 
 * @param {string} projectId - GCP project ID
 * @param {string} location - GCP location (e.g., 'us-west1')
 * @param {string} keyRing - KMS key ring name
 * @param {string} keyName - KMS key name
 * @returns {string} Full resource path for the key
 */
function buildKeyPath(projectId, location, keyRing, keyName) {
  return `projects/${projectId}/locations/${location}/keyRings/${keyRing}/cryptoKeys/${keyName}`;
}

/**
 * Encrypts data using Google Cloud KMS
 * 
 * @param {Buffer|string} data - Data to encrypt
 * @param {Object} options - Encryption options
 * @param {string} options.projectId - GCP project ID (default: api-for-warp-drive)
 * @param {string} options.location - GCP location (default: us-west1)
 * @param {string} options.keyRing - KMS key ring name (default: integration-gateway-ring)
 * @param {string} options.keyName - KMS key name (default: igw-encryption-key)
 * @returns {Promise<{ciphertext: string, keyVersion: string}>} Encrypted data and key version
 */
async function encrypt(data, options = {}) {
  const {
    projectId = DEFAULT_PROJECT_ID,
    location = DEFAULT_LOCATION,
    keyRing = DEFAULT_KEY_RING,
    keyName = DEFAULT_ENCRYPTION_KEY
  } = options;

  // Convert string data to Buffer if needed
  const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data);
  
  // Build the key path
  const keyPath = buildKeyPath(projectId, location, keyRing, keyName);

  try {
    // Encrypt the data
    const [encryptResponse] = await kms.encrypt({
      name: keyPath,
      plaintext
    });

    // Extract the key version from the response
    // Format: projects/PROJECT_ID/locations/LOCATION/keyRings/KEY_RING/cryptoKeys/KEY_NAME/cryptoKeyVersions/VERSION
    const keyVersionPath = encryptResponse.name;
    const keyVersion = keyVersionPath.split('/').pop();

    return {
      // Return base64-encoded ciphertext
      ciphertext: encryptResponse.ciphertext.toString('base64'),
      keyVersion
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

/**
 * Decrypts data using Google Cloud KMS
 * 
 * @param {string} ciphertext - Base64-encoded ciphertext to decrypt
 * @param {Object} options - Decryption options
 * @param {string} options.projectId - GCP project ID (default: api-for-warp-drive)
 * @param {string} options.location - GCP location (default: us-west1)
 * @param {string} options.keyRing - KMS key ring name (default: integration-gateway-ring)
 * @param {string} options.keyName - KMS key name (default: igw-encryption-key)
 * @param {string} options.keyVersion - Specific key version to use (optional)
 * @returns {Promise<Buffer>} Decrypted data as Buffer
 */
async function decrypt(ciphertext, options = {}) {
  const {
    projectId = DEFAULT_PROJECT_ID,
    location = DEFAULT_LOCATION,
    keyRing = DEFAULT_KEY_RING,
    keyName = DEFAULT_ENCRYPTION_KEY,
    keyVersion
  } = options;

  // Build the key path
  let keyPath = buildKeyPath(projectId, location, keyRing, keyName);
  
  // Append key version if specified
  if (keyVersion) {
    keyPath += `/cryptoKeyVersions/${keyVersion}`;
  }

  try {
    // Convert base64 ciphertext to Buffer
    const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

    // Decrypt the data
    const [decryptResponse] = await kms.decrypt({
      name: keyPath,
      ciphertext: ciphertextBuffer
    });

    return decryptResponse.plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

/**
 * Signs data using Google Cloud KMS
 * 
 * @param {Buffer|string} data - Data to sign
 * @param {Object} options - Signing options
 * @param {string} options.projectId - GCP project ID (default: api-for-warp-drive)
 * @param {string} options.location - GCP location (default: us-west1)
 * @param {string} options.keyRing - KMS key ring name (default: integration-gateway-ring)
 * @param {string} options.keyName - KMS key name (default: igw-signing-key)
 * @returns {Promise<{signature: string, keyVersion: string}>} Signature and key version
 */
async function sign(data, options = {}) {
  const {
    projectId = DEFAULT_PROJECT_ID,
    location = DEFAULT_LOCATION,
    keyRing = DEFAULT_KEY_RING,
    keyName = DEFAULT_SIGNING_KEY
  } = options;

  // Convert string data to Buffer if needed
  const digest = Buffer.isBuffer(data) ? data : Buffer.from(data);
  
  // Get the current key version
  const keyPath = buildKeyPath(projectId, location, keyRing, keyName);
  const [versions] = await kms.listCryptoKeyVersions({
    parent: keyPath,
    filter: 'state=ENABLED'
  });
  
  // Use the first enabled version
  if (!versions || versions.length === 0) {
    throw new Error('No enabled key versions found');
  }
  
  const currentVersionPath = versions[0].name;
  const keyVersion = currentVersionPath.split('/').pop();

  try {
    // Create a digest object
    const digestObj = {
      sha256: digest
    };
    
    // Sign the digest
    const [signResponse] = await kms.asymmetricSign({
      name: currentVersionPath,
      digest: digestObj
    });

    return {
      // Return base64-encoded signature
      signature: signResponse.signature.toString('base64'),
      keyVersion
    };
  } catch (error) {
    console.error('Signing error:', error);
    throw new Error(`Failed to sign data: ${error.message}`);
  }
}

/**
 * Verifies a signature using Google Cloud KMS
 * 
 * @param {string} signature - Base64-encoded signature to verify
 * @param {Buffer|string} data - Original data that was signed
 * @param {Object} options - Verification options
 * @param {string} options.projectId - GCP project ID (default: api-for-warp-drive)
 * @param {string} options.location - GCP location (default: us-west1)
 * @param {string} options.keyRing - KMS key ring name (default: integration-gateway-ring)
 * @param {string} options.keyName - KMS key name (default: igw-signing-key)
 * @param {string} options.keyVersion - Specific key version to use (required)
 * @returns {Promise<boolean>} True if signature is valid
 */
async function verify(signature, data, options = {}) {
  const {
    projectId = DEFAULT_PROJECT_ID,
    location = DEFAULT_LOCATION,
    keyRing = DEFAULT_KEY_RING,
    keyName = DEFAULT_SIGNING_KEY,
    keyVersion
  } = options;

  if (!keyVersion) {
    throw new Error('Key version is required for signature verification');
  }

  // Convert string data to Buffer if needed
  const digest = Buffer.isBuffer(data) ? data : Buffer.from(data);
  
  // Build the key version path
  const keyVersionPath = `projects/${projectId}/locations/${location}/keyRings/${keyRing}/cryptoKeys/${keyName}/cryptoKeyVersions/${keyVersion}`;

  try {
    // Convert base64 signature to Buffer
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    // Create a digest object
    const digestObj = {
      sha256: digest
    };
    
    // Verify the signature
    const [verifyResponse] = await kms.asymmetricVerify({
      name: keyVersionPath,
      digest: digestObj,
      signature: signatureBuffer
    });

    return verifyResponse.success;
  } catch (error) {
    console.error('Verification error:', error);
    throw new Error(`Failed to verify signature: ${error.message}`);
  }
}

module.exports = {
  encrypt,
  decrypt,
  sign,
  verify,
  buildKeyPath
};