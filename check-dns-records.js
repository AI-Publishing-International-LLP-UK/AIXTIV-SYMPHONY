/**
 * Script to check DNS records for a domain in GoDaddy
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

// Check all records
const checkAllRecords = async (client) => {
  try {
    console.log(`Checking all DNS records for ${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records`);
    
    if (response.status === 200 && response.data) {
      console.log('All DNS Records:');
      
      // Filter for the subdomain
      const subdomainRecords = response.data.filter(record => 
        record.name === CONFIG.subdomain
      );
      
      if (subdomainRecords.length > 0) {
        console.log(`\nRecords for ${CONFIG.subdomain}.${CONFIG.domain}:`);
        console.log(JSON.stringify(subdomainRecords, null, 2));
      } else {
        console.log(`\nNo records found for ${CONFIG.subdomain}.${CONFIG.domain}`);
      }
      
      return response.data;
    }
    
    console.log('No DNS records found');
    return [];
  } catch (error) {
    console.error('Error checking DNS records:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return [];
  }
};

// Check specific record type
const checkRecordType = async (client, type) => {
  try {
    console.log(`Checking ${type} records for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/${type}/${CONFIG.subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log(`${type} records:`, JSON.stringify(response.data, null, 2));
      return response.data;
    }
    
    console.log(`No ${type} records found`);
    return [];
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`No ${type} records exist for ${CONFIG.subdomain}.${CONFIG.domain}`);
      return [];
    }
    
    console.error(`Error checking ${type} records:`, error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return [];
  }
};

// Main function
const main = async () => {
  console.log(`=== GoDaddy DNS Check for ${CONFIG.subdomain}.${CONFIG.domain} ===`);
  
  try {
    const credentials = getCredentials();
    const client = createClient(credentials);
    
    // Check all record types
    await checkRecordType(client, 'A');
    await checkRecordType(client, 'CNAME');
    await checkRecordType(client, 'TXT');
    
    // Check all records 
    await checkAllRecords(client);
    
  } catch (error) {
    console.error('Error in DNS check process:', error.message);
    process.exit(1);
  }
};

// Run the script
main();