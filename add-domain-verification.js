/**
 * Add Firebase Domain Verification
 * 
 * This script adds the TXT verification record for Firebase hosting
 * to your domain's DNS configuration in GoDaddy.
 * 
 * Usage:
 * node add-domain-verification.js yourdomain.com VERIFICATION_CODE
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  apiUrl: 'https://api.godaddy.com/v1',
  configPath: path.join(__dirname, '.godaddy-credentials.json'),
  logFile: path.join(__dirname, 'verification-results.json')
};

// Process command line arguments
const getDomainInfo = () => {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Error: Missing required arguments');
    console.error('Usage: node add-domain-verification.js yourdomain.com VERIFICATION_CODE');
    process.exit(1);
  }
  
  let domain = args[0];
  const verificationCode = args[1];
  
  // Parse domain to get base domain and subdomain
  let baseDomain, subdomain;
  
  if (domain.split('.').length > 2) {
    // It's a subdomain
    subdomain = domain.split('.')[0];
    baseDomain = domain.split('.').slice(1).join('.');
  } else {
    // It's a main domain
    baseDomain = domain;
    subdomain = '@';
    domain = baseDomain;
  }
  
  return { baseDomain, subdomain, domain, verificationCode };
};

// Get GoDaddy credentials
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

// Add TXT record for domain verification
const addVerificationTXTRecord = async (client, baseDomain, subdomain, verificationCode) => {
  try {
    console.log(`Adding TXT record for ${subdomain === '@' ? baseDomain : subdomain + '.' + baseDomain}...`);
    
    // Create verification record
    const records = [{
      name: subdomain,
      type: 'TXT',
      data: `firebase=${verificationCode}`,
      ttl: 3600
    }];
    
    await client.put(`/domains/${baseDomain}/records/TXT/${subdomain}`, records);
    
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
  console.log('=== Add Firebase Domain Verification ===');
  
  try {
    // Get domain information
    const { baseDomain, subdomain, domain, verificationCode } = getDomainInfo();
    
    console.log(`Domain: ${domain}`);
    console.log(`Base Domain: ${baseDomain}`);
    console.log(`Subdomain: ${subdomain === '@' ? '(root)' : subdomain}`);
    console.log(`Verification Code: ${verificationCode}`);
    
    // Get credentials and create client
    const credentials = getCredentials();
    const client = createClient(credentials);
    
    // Add verification record
    const success = await addVerificationTXTRecord(client, baseDomain, subdomain, verificationCode);
    
    if (success) {
      console.log(`\n✅ Verification record added for ${domain}`);
      console.log('DNS propagation may take up to 24-48 hours.');
      console.log('After verification completes, your site will be available at:');
      console.log(`https://${domain}`);
      
      // Update verification log
      try {
        let verificationResults = {};
        if (fs.existsSync(CONFIG.logFile)) {
          verificationResults = JSON.parse(fs.readFileSync(CONFIG.logFile, 'utf8'));
        }
        
        verificationResults[domain] = {
          domain,
          verificationCode,
          addedAt: new Date().toISOString(),
          status: 'pending'
        };
        
        fs.writeFileSync(CONFIG.logFile, JSON.stringify(verificationResults, null, 2));
      } catch (error) {
        console.error('Error updating verification log:', error.message);
      }
      
    } else {
      console.error('\n❌ Failed to add verification record');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error in verification process:', error.message);
    process.exit(1);
  }
};

// Run the script
main();