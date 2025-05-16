/**
 * Example demonstrating cryptographic key rotation in Integration Gateway
 * 
 * This example shows how to use the crypto-service to:
 * 1. Encrypt and sign sensitive data
 * 2. Store encrypted data with key versions
 * 3. Retrieve and decrypt data even after key rotation
 * 4. Manually trigger key rotation
 */

const cryptoService = require('../services/crypto-service');
const logger = require('../services/common/logger');

// Example database record (in-memory for this example)
const database = {
  records: {},
  
  // Store a record
  async storeRecord(userId, data) {
    try {
      // Encrypt and sign the data
      const protected = await cryptoService.encryptAndSign(data);
      
      // Store the encrypted data with key versions
      this.records[userId] = {
        ciphertext: protected.ciphertext,
        signature: protected.signature,
        encKeyVersion: protected.encKeyVersion,
        signKeyVersion: protected.signKeyVersion,
        createdAt: new Date().toISOString()
      };
      
      logger.info(`Stored encrypted record for user ${userId} using encryption key version ${protected.encKeyVersion} and signing key version ${protected.signKeyVersion}`);
      
      return { success: true, userId };
    } catch (err) {
      logger.error(`Failed to store record for user ${userId}:`, err);
      throw err;
    }
  },
  
  // Retrieve a record
  async getRecord(userId) {
    try {
      const record = this.records[userId];
      if (!record) {
        throw new Error(`Record not found for user ${userId}`);
      }
      
      // Verify and decrypt the data
      const data = await cryptoService.verifyAndDecrypt({
        ciphertext: record.ciphertext,
        signature: record.signature,
        encKeyVersion: record.encKeyVersion,
        signKeyVersion: record.signKeyVersion
      }, true); // Parse as JSON
      
      logger.info(`Retrieved and decrypted record for user ${userId}`);
      
      return { success: true, data, createdAt: record.createdAt };
    } catch (err) {
      logger.error(`Failed to retrieve record for user ${userId}:`, err);
      throw err;
    }
  },
  
  // List all records (encrypted)
  listRecords() {
    return Object.entries(this.records).map(([userId, record]) => ({
      userId,
      createdAt: record.createdAt,
      encKeyVersion: record.encKeyVersion,
      signKeyVersion: record.signKeyVersion
    }));
  }
};

/**
 * Run the example
 */
async function runExample() {
  try {
    logger.info('Starting cryptographic key rotation example...');
    
    // 1. Store encrypted user profiles
    await database.storeRecord('user123', {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      apiKey: 'secret-api-key-123'
    });
    
    await database.storeRecord('user456', {
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor',
      apiKey: 'secret-api-key-456'
    });
    
    logger.info('Stored user profiles with encryption and signatures');
    logger.info('Current records:', database.listRecords());
    
    // 2. Retrieve and decrypt a user profile
    const user123Data = await database.getRecord('user123');
    logger.info('Retrieved user123 data:', user123Data);
    
    // 3. Simulate key rotation
    logger.info('Simulating key rotation...');
    try {
      // In production, this happens automatically based on rotation schedule
      // This is just for demonstration purposes
      const newEncKeyVersion = await cryptoService.rotateKey('encryption');
      logger.info(`Rotated encryption key, new version: ${newEncKeyVersion}`);
    } catch (err) {
      logger.warn('Skipping manual key rotation (requires KMS admin permissions):', err.message);
    }
    
    // 4. Store a new record after key rotation
    await database.storeRecord('user789', {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'viewer',
      apiKey: 'secret-api-key-789'
    });
    
    logger.info('Stored new user profile after key rotation');
    logger.info('Updated records:', database.listRecords());
    
    // 5. Verify we can still decrypt old records
    const user456Data = await database.getRecord('user456');
    logger.info('Retrieved user456 data (encrypted before key rotation):', user456Data);
    
    // 6. Retrieve the new record
    const user789Data = await database.getRecord('user789');
    logger.info('Retrieved user789 data (encrypted after key rotation):', user789Data);
    
    logger.info('Example completed successfully!');
  } catch (err) {
    logger.error('Example failed:', err);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample()
    .then(() => {
      logger.info('Example execution completed');
    })
    .catch(err => {
      logger.error('Unhandled error in example:', err);
      process.exit(1);
    });
}

module.exports = { runExample, database };