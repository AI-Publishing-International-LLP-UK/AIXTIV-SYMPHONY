/**
 * GoDaddy DNS Update Script
 * 
 * This script updates DNS records for a domain in GoDaddy using their API
 * It can be integrated with your existing data pipes
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration (would be loaded from your secure environment)
const CONFIG = {
  domain: '2100.cool',
  subdomain: 'asoos',
  apiUrl: 'https://api.godaddy.com/v1',
  configPath: path.join(__dirname, '.godaddy-credentials.json')
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

// Check if DNS record exists
const checkDnsRecord = async (client) => {
  try {
    console.log(`Checking if ${CONFIG.subdomain}.${CONFIG.domain} CNAME record exists...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/CNAME/${CONFIG.subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('CNAME record exists:', response.data);
      return true;
    }
    
    console.log('CNAME record not found');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('CNAME record does not exist yet');
      return false;
    }
    
    console.error('Error checking DNS record:', error.message);
    return false;
  }
};

// Add DNS record
const addDnsRecord = async (client) => {
  try {
    console.log(`Adding CNAME record for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const record = [{
      name: CONFIG.subdomain,
      type: 'CNAME',
      data: 'c.storage.googleapis.com',
      ttl: 3600
    }];
    
    await client.put(`/domains/${CONFIG.domain}/records/CNAME/${CONFIG.subdomain}`, record);
    
    console.log('CNAME record created successfully');
    return true;
  } catch (error) {
    console.error('Error creating DNS record:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
};

// Main function
const main = async () => {
  console.log(`=== GoDaddy DNS Update for ${CONFIG.subdomain}.${CONFIG.domain} ===`);
  
  try {
    const credentials = getCredentials();
    const client = createClient(credentials);
    
    const exists = await checkDnsRecord(client);
    
    if (!exists) {
      const added = await addDnsRecord(client);
      
      if (added) {
        console.log('DNS update completed successfully');
      } else {
        console.error('Failed to update DNS record');
        process.exit(1);
      }
    } else {
      console.log('DNS record already exists, no update needed');
    }
    
  } catch (error) {
    console.error('Error in DNS update process:', error.message);
    process.exit(1);
  }
};

// Run the script
main();