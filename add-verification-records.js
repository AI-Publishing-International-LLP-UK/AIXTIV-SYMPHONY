/**
 * Add Verification Records for Firebase Hosting
 * 
 * This script adds TXT verification records for domains to verify ownership in Firebase.
 * It can be used in two ways:
 * 1. To add a single verification record: node add-verification-records.js domain.com VERIFICATION_CODE
 * 2. To add multiple verification records from a JSON file: node add-verification-records.js --from-file verifications.json
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  apiUrl: 'https://api.godaddy.com/v1',
  apiKey: 'dKNvtCsmB3PX_VXx1ghzxNeBfdSHH5AaazX', 
  apiSecret: 'NWFaniKptRBwGQ2ChkhpPT',
  logFile: path.join(__dirname, 'verification-records.log')
};

// Logger function
function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  
  console.log(formattedMessage);
  fs.appendFileSync(CONFIG.logFile, formattedMessage + '\n');
}

// Create API client
const client = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Authorization': `sso-key ${CONFIG.apiKey}:${CONFIG.apiSecret}`,
    'Content-Type': 'application/json'
  }
});

// Add verification TXT record for a domain
async function addVerificationRecord(domain, verificationCode) {
  try {
    log(`Adding TXT verification record for ${domain}...`);
    
    const record = [{
      name: '@',
      type: 'TXT',
      data: `firebase=${verificationCode}`,
      ttl: 3600
    }];
    
    const response = await client.put(`/domains/${domain}/records/TXT/@`, record);
    
    log(`TXT verification record added successfully for ${domain}`);
    return {
      success: true,
      domain,
      verificationCode
    };
  } catch (error) {
    log(`Error adding TXT verification record for ${domain}: ${error.message}`, true);
    
    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }
    
    return {
      success: false,
      domain,
      error: error.message
    };
  }
}

// Add verification for a subdomain
async function addSubdomainVerificationRecord(domain, subdomain, verificationCode) {
  try {
    log(`Adding TXT verification record for ${subdomain}.${domain}...`);
    
    const record = [{
      name: subdomain,
      type: 'TXT',
      data: `firebase=${verificationCode}`,
      ttl: 3600
    }];
    
    const response = await client.put(`/domains/${domain}/records/TXT/${subdomain}`, record);
    
    log(`TXT verification record added successfully for ${subdomain}.${domain}`);
    return {
      success: true,
      domain: `${subdomain}.${domain}`,
      verificationCode
    };
  } catch (error) {
    log(`Error adding TXT verification record for ${subdomain}.${domain}: ${error.message}`, true);
    
    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }
    
    return {
      success: false,
      domain: `${subdomain}.${domain}`,
      error: error.message
    };
  }
}

// Add verifications from a file
async function addVerificationsFromFile(filePath) {
  try {
    log(`Adding verification records from file: ${filePath}`);
    
    // Read file
    const verifications = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Track statistics
    const stats = {
      total: Object.keys(verifications).length,
      success: 0,
      failed: 0
    };
    
    // Results
    const results = {
      success: [],
      failed: []
    };
    
    // Process each verification
    for (const [domain, code] of Object.entries(verifications)) {
      log(`Processing domain: ${domain}`);
      
      let result;
      
      // Check if it's a subdomain
      if (domain.includes('.')) {
        const parts = domain.split('.');
        if (parts.length === 3) {
          // It's a subdomain like "asoos.2100.cool"
          const subdomain = parts[0];
          const mainDomain = `${parts[1]}.${parts[2]}`;
          result = await addSubdomainVerificationRecord(mainDomain, subdomain, code);
        } else {
          // It's a domain like "example.com"
          result = await addVerificationRecord(domain, code);
        }
      } else {
        // It's a domain without dots (shouldn't happen, but just in case)
        result = await addVerificationRecord(domain, code);
      }
      
      if (result.success) {
        stats.success++;
        results.success.push(domain);
      } else {
        stats.failed++;
        results.failed.push({
          domain,
          error: result.error
        });
      }
    }
    
    // Summary
    log('\n=== Summary ===');
    log(`Total verification records: ${stats.total}`);
    log(`Successfully added: ${stats.success}`);
    log(`Failed: ${stats.failed}`);
    
    // Detailed results
    log('\n=== Successful Verifications ===');
    results.success.forEach(domain => log(`  - ${domain}`));
    
    log('\n=== Failed Verifications ===');
    results.failed.forEach(item => log(`  - ${item.domain}: ${item.error}`));
    
    return {
      stats,
      results
    };
  } catch (error) {
    log(`Error processing verification file: ${error.message}`, true);
    return null;
  }
}

// Main function
async function main() {
  console.log(`=== Add Verification Records for Firebase Hosting ===`);
  console.log(`Current time: ${new Date().toISOString()}`);
  console.log();
  
  // Initialize log file
  fs.writeFileSync(CONFIG.logFile, `=== Verification Records Log (${new Date().toISOString()}) ===\n`);
  
  if (process.argv.includes('--help')) {
    console.log('Usage:');
    console.log('  node add-verification-records.js domain.com VERIFICATION_CODE');
    console.log('  node add-verification-records.js --from-file verifications.json');
    console.log('  node add-verification-records.js --help');
    return;
  }
  
  const fromFile = process.argv.indexOf('--from-file');
  
  if (fromFile !== -1 && process.argv.length > fromFile + 1) {
    // Add verifications from file
    const filePath = process.argv[fromFile + 1];
    await addVerificationsFromFile(filePath);
  } else if (process.argv.length >= 4) {
    // Add single verification
    const domain = process.argv[2];
    const code = process.argv[3];
    
    log(`Adding verification for ${domain} with code: ${code}`);
    
    let result;
    if (domain.includes('.')) {
      const parts = domain.split('.');
      if (parts.length === 3) {
        // It's a subdomain like "asoos.2100.cool"
        const subdomain = parts[0];
        const mainDomain = `${parts[1]}.${parts[2]}`;
        result = await addSubdomainVerificationRecord(mainDomain, subdomain, code);
      } else {
        // It's a domain like "example.com"
        result = await addVerificationRecord(domain, code);
      }
    } else {
      // It's a domain without dots (shouldn't happen, but just in case)
      result = await addVerificationRecord(domain, code);
    }
    
    if (result.success) {
      log(`Verification record added successfully for ${domain}.`);
    } else {
      log(`Failed to add verification record for ${domain}.`);
    }
  } else {
    console.log('Invalid arguments.');
    console.log('Usage:');
    console.log('  node add-verification-records.js domain.com VERIFICATION_CODE');
    console.log('  node add-verification-records.js --from-file verifications.json');
  }
}

// Run the script
main();