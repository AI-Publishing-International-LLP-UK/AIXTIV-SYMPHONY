/**
 * GoDaddy DNS Update Script for Firebase Hosting
 * 
 * This script updates DNS records for asoos.2100.cool to point to Firebase hosting
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  domain: '2100.cool',
  subdomain: 'asoos',
  apiUrl: 'https://api.godaddy.com/v1',
  configPath: path.join(__dirname, '.godaddy-credentials.json'),
  // Firebase hosting requires an A record for the subdomain, pointing to Firebase IPs
  firebaseIPs: [
    '199.36.158.100',  // Primary Firebase hosting IP
    '199.36.158.101',
    '199.36.158.102',
    '199.36.158.103'
  ]
};

// Get credentials from secure storage
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
    console.error('Please create a .godaddy-credentials.json file with:');
    console.error(JSON.stringify({ apiKey: "YOUR_API_KEY", apiSecret: "YOUR_API_SECRET" }, null, 2));
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

// Check if DNS A record exists
const checkDnsARecord = async (client) => {
  try {
    console.log(`Checking if ${CONFIG.subdomain}.${CONFIG.domain} A record exists...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/A/${CONFIG.subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('A record exists:', response.data);
      return response.data;
    }
    
    console.log('A record not found');
    return null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('A record does not exist yet');
      return null;
    }
    
    console.error('Error checking DNS A record:', error.message);
    return null;
  }
};

// Add or update DNS A record
const updateDnsARecord = async (client) => {
  try {
    console.log(`Adding/Updating A record for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    // Create Firebase Hosting A records (typically it's a single A record)
    // Using only the primary IP for simplicity
    const records = [{
      name: CONFIG.subdomain,
      type: 'A',
      data: CONFIG.firebaseIPs[0],
      ttl: 3600
    }];
    
    await client.put(`/domains/${CONFIG.domain}/records/A/${CONFIG.subdomain}`, records);
    
    console.log('A record created/updated successfully');
    return true;
  } catch (error) {
    console.error('Error creating/updating DNS A record:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
};

// Delete existing CNAME record if it exists
const deleteCnameRecord = async (client) => {
  try {
    console.log(`Checking if ${CONFIG.subdomain}.${CONFIG.domain} CNAME record exists...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/CNAME/${CONFIG.subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('CNAME record exists and will be removed');
      
      // GoDaddy API requires putting an empty array to delete records
      await client.put(`/domains/${CONFIG.domain}/records/CNAME/${CONFIG.subdomain}`, []);
      
      console.log('CNAME record deleted successfully');
      return true;
    }
    
    console.log('No CNAME record to delete');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('CNAME record does not exist');
      return false;
    }
    
    console.error('Error handling CNAME record:', error.message);
    return false;
  }
};

// Add TXT record for domain verification
const addVerificationTXTRecord = async (client, verificationCode) => {
  try {
    console.log(`Adding TXT record for domain verification...`);
    
    // Create verification record
    const records = [{
      name: CONFIG.subdomain,
      type: 'TXT',
      data: `firebase=${verificationCode}`,
      ttl: 3600
    }];
    
    await client.put(`/domains/${CONFIG.domain}/records/TXT/${CONFIG.subdomain}`, records);
    
    console.log('TXT verification record created successfully');
    return true;
  } catch (error) {
    console.error('Error creating TXT verification record:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
};

// Main function
const main = async () => {
  console.log(`=== GoDaddy DNS Update for ${CONFIG.subdomain}.${CONFIG.domain} to Firebase Hosting ===`);
  
  try {
    const credentials = getCredentials();
    const client = createClient(credentials);
    
    // Step 1: Remove any existing CNAME record that might conflict with A record
    await deleteCnameRecord(client);
    
    // Step 2: Create or update the A record
    const updated = await updateDnsARecord(client);
    
    if (updated) {
      console.log(`DNS A record for ${CONFIG.subdomain}.${CONFIG.domain} updated successfully to point to Firebase Hosting`);
      console.log(`Now you need to connect your domain in Firebase Hosting console and verify ownership.`);
      console.log(`After getting a verification code from Firebase, run this script with the verification code as an argument.`);
      
      // Check if a verification code was provided as command line argument
      if (process.argv.length > 2) {
        const verificationCode = process.argv[2];
        await addVerificationTXTRecord(client, verificationCode);
        console.log(`TXT verification record has been added with code: ${verificationCode}`);
        console.log(`DNS propagation may take up to 24-48 hours. After verification completes, your site will be available at https://${CONFIG.subdomain}.${CONFIG.domain}`);
      }
    } else {
      console.error('Failed to update DNS record');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error in DNS update process:', error.message);
    process.exit(1);
  }
};

// Run the script
main();