/**
 * Bulk Domain Update for Firebase Hosting
 * 
 * This script automates updating all GoDaddy domains and subdomains to point to Firebase hosting,
 * excluding specified domains.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const dns = require('dns');
const util = require('util');

// Configuration
const CONFIG = {
  // Firebase hosting IPs
  firebaseIPs: [
    '199.36.158.100', // Primary Firebase hosting IP
    '199.36.158.101',
    '199.36.158.102',
    '199.36.158.103'
  ],
  // Domains to exclude from updates
  excludedDomains: [
    'philliproark.com',
    'byfabriziodesign.com',
    'kennedypartain.com',
    '2100.group',
    'fabriziosassano.com'
  ],
  // Credentials file path
  credentialsPath: path.join(__dirname, '.godaddy-credentials.json'),
  // API URLs
  godaddyApiUrl: 'https://api.godaddy.com/v1',
  // Results file path
  resultsPath: path.join(__dirname, 'domain-update-results.json'),
  // Log file path
  logPath: path.join(__dirname, 'domain-update.log')
};

// Logger
const logger = {
  log: function(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(CONFIG.logPath, logMessage + '\n');
  },
  error: function(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    console.error(logMessage);
    fs.appendFileSync(CONFIG.logPath, logMessage + '\n');
  }
};

// Initialize log file
fs.writeFileSync(CONFIG.logPath, `=== Bulk Domain Update for Firebase Hosting (${new Date().toISOString()}) ===\n\n`);

// Get credentials from secure storage
const getCredentials = () => {
  try {
    if (fs.existsSync(CONFIG.credentialsPath)) {
      const creds = JSON.parse(fs.readFileSync(CONFIG.credentialsPath, 'utf8'));
      return {
        key: creds.apiKey,
        secret: creds.apiSecret
      };
    } else {
      throw new Error(`Credentials file not found at ${CONFIG.credentialsPath}`);
    }
  } catch (error) {
    logger.error(`Error loading credentials: ${error.message}`);
    process.exit(1);
  }
};

// Create API client
const createClient = ({ key, secret }) => {
  return axios.create({
    baseURL: CONFIG.godaddyApiUrl,
    headers: {
      'Authorization': `sso-key ${key}:${secret}`,
      'Content-Type': 'application/json'
    }
  });
};

// Get all domains from GoDaddy
const getAllDomains = async (client) => {
  try {
    logger.log('Retrieving all domains from GoDaddy...');
    
    const response = await client.get('/domains?statuses=ACTIVE&limit=100');
    
    if (response.status === 200 && response.data) {
      const domains = response.data.map(domain => domain.domain);
      logger.log(`Found ${domains.length} active domains`);
      return domains;
    }
    
    logger.log('No domains found');
    return [];
  } catch (error) {
    logger.error(`Error retrieving domains: ${error.message}`);
    
    if (error.response) {
      logger.error(`API response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return [];
  }
};

// Get all DNS records for a domain
const getDomainRecords = async (client, domain) => {
  try {
    logger.log(`Retrieving all DNS records for ${domain}...`);
    
    const response = await client.get(`/domains/${domain}/records`);
    
    if (response.status === 200) {
      logger.log(`Found ${response.data.length} DNS records for ${domain}`);
      return response.data;
    }
    
    logger.log(`No DNS records found for ${domain}`);
    return [];
  } catch (error) {
    logger.error(`Error retrieving DNS records for ${domain}: ${error.message}`);
    
    if (error.response) {
      logger.error(`API response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return [];
  }
};

// Update A record for a domain or subdomain
const updateARecord = async (client, domain, subdomain = null) => {
  try {
    const name = subdomain || '@';
    logger.log(`Updating A record for ${name}.${domain} to point to Firebase hosting...`);
    
    // Create Firebase Hosting A records
    const records = [{
      name: name,
      type: 'A',
      data: CONFIG.firebaseIPs[0],
      ttl: 3600
    }];
    
    await client.put(`/domains/${domain}/records/A/${name}`, records);
    
    logger.log(`A record for ${name}.${domain} updated successfully`);
    return true;
  } catch (error) {
    logger.error(`Error updating A record for ${subdomain || '@'}.${domain}: ${error.message}`);
    
    if (error.response) {
      logger.error(`API response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return false;
  }
};

// Get all subdomains for a domain
const getSubdomains = async (client, domain) => {
  try {
    const records = await getDomainRecords(client, domain);
    
    // Filter for A and CNAME records to find subdomains
    const subdomains = records
      .filter(record => (record.type === 'A' || record.type === 'CNAME') && record.name !== '@' && record.name !== 'www')
      .map(record => record.name);
    
    // Remove duplicates
    const uniqueSubdomains = [...new Set(subdomains)];
    
    logger.log(`Found ${uniqueSubdomains.length} subdomains for ${domain}`);
    return uniqueSubdomains;
  } catch (error) {
    logger.error(`Error finding subdomains for ${domain}: ${error.message}`);
    return [];
  }
};

// Check if domain is in the excluded list
const isExcluded = (domain) => {
  return CONFIG.excludedDomains.includes(domain);
};

// Update domain and all its subdomains
const updateDomainAndSubdomains = async (client, domain) => {
  // Skip excluded domains
  if (isExcluded(domain)) {
    logger.log(`Skipping excluded domain: ${domain}`);
    return {
      domain,
      excluded: true,
      rootUpdated: false,
      subdomainsUpdated: []
    };
  }
  
  const result = {
    domain,
    excluded: false,
    rootUpdated: false,
    subdomainsUpdated: [],
    subdomainsFailed: []
  };
  
  // Update root domain
  result.rootUpdated = await updateARecord(client, domain);
  
  // Update www subdomain
  await updateARecord(client, domain, 'www');
  
  // Get all subdomains
  const subdomains = await getSubdomains(client, domain);
  
  // Update each subdomain
  for (const subdomain of subdomains) {
    const updated = await updateARecord(client, domain, subdomain);
    
    if (updated) {
      result.subdomainsUpdated.push(subdomain);
    } else {
      result.subdomainsFailed.push(subdomain);
    }
  }
  
  return result;
};

// Main function
const main = async () => {
  logger.log(`=== Bulk Domain Update for Firebase Hosting ===`);
  logger.log(`Excluded domains: ${CONFIG.excludedDomains.join(', ')}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    updated: [],
    failed: [],
    excluded: [],
    summary: {}
  };
  
  try {
    // Get credentials and create client
    const credentials = getCredentials();
    const client = createClient(credentials);
    
    // Get all domains
    const domains = await getAllDomains(client);
    
    logger.log(`Processing ${domains.length} domains...`);
    
    // Update each domain and its subdomains
    for (const domain of domains) {
      logger.log(`\nProcessing domain: ${domain}`);
      
      const result = await updateDomainAndSubdomains(client, domain);
      
      if (result.excluded) {
        results.excluded.push(domain);
      } else if (result.rootUpdated) {
        results.updated.push({
          domain,
          subdomainsUpdated: result.subdomainsUpdated,
          subdomainsFailed: result.subdomainsFailed
        });
      } else {
        results.failed.push(domain);
      }
    }
    
    // Generate summary
    results.summary = {
      totalDomains: domains.length,
      updatedDomains: results.updated.length,
      failedDomains: results.failed.length,
      excludedDomains: results.excluded.length,
      totalSubdomainsUpdated: results.updated.reduce((total, item) => total + item.subdomainsUpdated.length, 0),
      totalSubdomainsFailed: results.updated.reduce((total, item) => total + item.subdomainsFailed.length, 0)
    };
    
    // Save results to file
    fs.writeFileSync(CONFIG.resultsPath, JSON.stringify(results, null, 2));
    
    logger.log(`\n=== Summary ===`);
    logger.log(`Total domains processed: ${results.summary.totalDomains}`);
    logger.log(`Domains updated: ${results.summary.updatedDomains}`);
    logger.log(`Domains failed: ${results.summary.failedDomains}`);
    logger.log(`Domains excluded: ${results.summary.excludedDomains}`);
    logger.log(`Subdomains updated: ${results.summary.totalSubdomainsUpdated}`);
    logger.log(`Subdomains failed: ${results.summary.totalSubdomainsFailed}`);
    logger.log(`Results saved to ${CONFIG.resultsPath}`);
    
  } catch (error) {
    logger.error(`Unexpected error: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Verify DNS records after update
const verifyDomains = async () => {
  try {
    const lookupAsync = util.promisify(dns.lookup);
    
    // Load results
    if (!fs.existsSync(CONFIG.resultsPath)) {
      throw new Error(`Results file not found at ${CONFIG.resultsPath}`);
    }
    
    const results = JSON.parse(fs.readFileSync(CONFIG.resultsPath, 'utf8'));
    
    logger.log(`\n=== Verifying DNS records ===`);
    
    const verificationResults = {
      verified: [],
      failed: [],
      pending: []
    };
    
    // Verify each updated domain
    for (const item of results.updated) {
      const domain = item.domain;
      
      try {
        logger.log(`Verifying ${domain}...`);
        const {address} = await lookupAsync(domain);
        
        if (CONFIG.firebaseIPs.includes(address)) {
          logger.log(`✅ ${domain} is correctly pointing to Firebase hosting (${address})`);
          verificationResults.verified.push(domain);
        } else {
          logger.log(`❌ ${domain} is pointing to ${address}, not Firebase hosting`);
          verificationResults.failed.push(domain);
        }
      } catch (error) {
        logger.log(`⏳ ${domain} - DNS lookup failed, may still be propagating: ${error.message}`);
        verificationResults.pending.push(domain);
      }
      
      // Check subdomains
      for (const subdomain of item.subdomainsUpdated) {
        const fullDomain = `${subdomain}.${domain}`;
        
        try {
          logger.log(`Verifying ${fullDomain}...`);
          const {address} = await lookupAsync(fullDomain);
          
          if (CONFIG.firebaseIPs.includes(address)) {
            logger.log(`✅ ${fullDomain} is correctly pointing to Firebase hosting (${address})`);
          } else {
            logger.log(`❌ ${fullDomain} is pointing to ${address}, not Firebase hosting`);
          }
        } catch (error) {
          logger.log(`⏳ ${fullDomain} - DNS lookup failed, may still be propagating: ${error.message}`);
        }
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    logger.log(`\n=== Verification Summary ===`);
    logger.log(`Domains verified: ${verificationResults.verified.length}`);
    logger.log(`Domains failed: ${verificationResults.failed.length}`);
    logger.log(`Domains pending: ${verificationResults.pending.length}`);
    
    return verificationResults;
  } catch (error) {
    logger.error(`Verification error: ${error.message}`);
    return null;
  }
};

// Run main function or verification depending on command line argument
if (process.argv.includes('--verify')) {
  verifyDomains();
} else {
  main();
}