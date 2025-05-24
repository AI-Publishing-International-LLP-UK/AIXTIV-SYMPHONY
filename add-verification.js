/**
 * Script to add Firebase verification TXT record for domain ownership
 * 
 * Usage: node add-verification.js VERIFICATION_CODE
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Get verification code from command line
const verificationCode = process.argv[2];

if (!verificationCode) {
  console.error('Error: Verification code is required');
  console.error('Usage: node add-verification.js VERIFICATION_CODE');
  process.exit(1);
}

// Configuration
const CONFIG = {
  domain: '2100.cool',
  subdomain: 'asoos',
  apiUrl: 'https://api.godaddy.com/v1',
  configPath: path.join(__dirname, '.godaddy-credentials.json')
};

// Get credentials
const getCredentials = () => {
  try {
    if (fs.existsSync(CONFIG.configPath)) {
      const creds = JSON.parse(fs.readFileSync(CONFIG.configPath, 'utf8'));
      return {
        key: creds.apiKey,
        secret: creds.apiSecret
      };
    } else {
      throw new Error(`Credentials file not found at ${CONFIG.configPath}`);
    }
  } catch (error) {
    console.error('Error loading credentials:', error.message);
    process.exit(1);
  }
};

// Create API client
const createClient = ({ key, secret }) => {
  return axios.create({
    baseURL: CONFIG.apiUrl,
    headers: {
      'Authorization': `sso-key ${key}:${secret}`,
      'Content-Type': 'application/json'
    }
  });
};

// Add verification TXT record
const addVerificationRecord = async (client, code) => {
  try {
    console.log(`Adding TXT verification record for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const records = [{
      name: CONFIG.subdomain,
      type: 'TXT',
      data: `firebase=${code}`,
      ttl: 3600
    }];
    
    await client.put(`/domains/${CONFIG.domain}/records/TXT/${CONFIG.subdomain}`, records);
    
    console.log('TXT verification record added successfully');
    return true;
  } catch (error) {
    console.error('Error adding TXT verification record:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
};

// Check if record already exists
const checkExistingRecord = async (client) => {
  try {
    console.log(`Checking if verification record already exists for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/TXT/${CONFIG.subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('Existing TXT records:', JSON.stringify(response.data, null, 2));
      return response.data;
    }
    
    console.log('No existing TXT records found');
    return [];
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('No TXT records exist yet');
      return [];
    }
    
    console.error('Error checking existing TXT records:', error.message);
    return [];
  }
};

// Main function
const main = async () => {
  console.log(`=== Adding Firebase Verification Record for ${CONFIG.subdomain}.${CONFIG.domain} ===`);
  
  try {
    const credentials = getCredentials();
    const client = createClient(credentials);
    
    // Check if verification record already exists
    const existingRecords = await checkExistingRecord(client);
    
    const firebaseRecord = existingRecords.find(record => 
      record.data.startsWith('firebase=')
    );
    
    if (firebaseRecord) {
      console.log(`Firebase verification record already exists: ${firebaseRecord.data}`);
      console.log(`Updating to new verification code: firebase=${verificationCode}`);
    }
    
    // Add verification record
    const added = await addVerificationRecord(client, verificationCode);
    
    if (added) {
      console.log(`\nVerification record has been added successfully for ${CONFIG.subdomain}.${CONFIG.domain}`);
      console.log(`Firebase verification TXT record: firebase=${verificationCode}`);
      console.log('\nNext steps:');
      console.log('1. Wait for DNS propagation (can take up to 24-48 hours)');
      console.log('2. Continue the verification process in Firebase Console');
      console.log('3. Once verified, your site will be accessible at:');
      console.log(`   https://${CONFIG.subdomain}.${CONFIG.domain}`);
    } else {
      console.error('\nFailed to add verification record');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error in verification process:', error.message);
    process.exit(1);
  }
};

// Run the script
main();