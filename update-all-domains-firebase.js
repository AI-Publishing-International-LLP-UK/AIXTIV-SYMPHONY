/**
 * Comprehensive Domain Update Script for Firebase Hosting
 * 
 * This script updates ALL domains and subdomains in GoDaddy to point to Firebase hosting,
 * except for specifically excluded domains.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  apiUrl: 'https://api.godaddy.com/v1',
  apiKey: 'dKNvtCsmB3PX_VXx1ghzxNeBfdSHH5AaazX', 
  apiSecret: 'NWFaniKptRBwGQ2ChkhpPT',
  firebaseIP: '199.36.158.100',
  
  // List of fully qualified domains to exclude (these will NOT be updated)
  excludedDomains: [
    'philliproark.com',
    'byfabriziodesign.com',
    'kennedypartain.com',
    '2100.group',
    'fabriziosassano.com'
  ],
  
  // List of specific subdomains to exclude from any domain
  excludedSubdomains: [
    'asoos',     // Exclude asoos.* from any domain
    'zena',      // Exclude zena.* from any domain
    'vision',    // Exclude vision.* from any domain
    'app',       // Exclude app.* from any domain
    'api'        // Exclude api.* from any domain
  ],
  
  // Optional: Rate limiting to avoid API throttling
  rateLimit: {
    maxRequests: 10,       // Number of requests
    perPeriod: 60 * 1000   // Time period in milliseconds (60 seconds)
  },
  
  // Optional: paths for logs
  logs: {
    resultsFile: path.join(__dirname, 'domain-update-results.json'),
    errorLogFile: path.join(__dirname, 'domain-update-errors.log')
  }
};

// Create API client
const client = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Authorization': `sso-key ${CONFIG.apiKey}:${CONFIG.apiSecret}`,
    'Content-Type': 'application/json'
  }
});

// Simple rate limiter
class RateLimiter {
  constructor(maxRequests, perPeriod) {
    this.maxRequests = maxRequests;
    this.perPeriod = perPeriod;
    this.tokens = maxRequests;
    this.lastRefill = Date.now();
  }
  
  async getToken() {
    const now = Date.now();
    const elapsedTime = now - this.lastRefill;
    
    // Refill tokens based on elapsed time
    if (elapsedTime > this.perPeriod) {
      this.tokens = this.maxRequests;
      this.lastRefill = now;
    }
    
    // If no tokens, wait for refill
    if (this.tokens <= 0) {
      const waitTime = this.perPeriod - elapsedTime;
      await new Promise(resolve => setTimeout(resolve, waitTime > 0 ? waitTime : 0));
      return this.getToken(); // Try again after waiting
    }
    
    // Use a token
    this.tokens--;
    return true;
  }
}

// Create rate limiter instance
const rateLimiter = new RateLimiter(CONFIG.rateLimit.maxRequests, CONFIG.rateLimit.perPeriod);

// Logger function
function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  
  console.log(formattedMessage);
  
  if (isError) {
    fs.appendFileSync(CONFIG.logs.errorLogFile, formattedMessage + '\n');
  }
}

// Get all domains from GoDaddy account
async function getAllDomains() {
  try {
    await rateLimiter.getToken();
    log('Retrieving all domains from GoDaddy account...');
    
    const response = await client.get('/domains?limit=500&statuses=ACTIVE');
    
    if (response.status === 200 && response.data) {
      const domains = response.data.map(domain => domain.domain);
      log(`Found ${domains.length} domains in GoDaddy account.`);
      return domains;
    }
    
    log('No domains found in GoDaddy account.', true);
    return [];
  } catch (error) {
    log(`Error retrieving domains: ${error.message}`, true);
    
    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }
    
    throw error;
  }
}

// Get all DNS records for a domain
async function getDomainDnsRecords(domain) {
  try {
    await rateLimiter.getToken();
    log(`Retrieving DNS records for ${domain}...`);
    
    const response = await client.get(`/domains/${domain}/records`);
    
    if (response.status === 200 && response.data) {
      // Group records by subdomain
      const recordsBySubdomain = {};
      
      response.data.forEach(record => {
        if (!recordsBySubdomain[record.name]) {
          recordsBySubdomain[record.name] = [];
        }
        recordsBySubdomain[record.name].push(record);
      });
      
      log(`Found ${Object.keys(recordsBySubdomain).length} subdomains for ${domain}.`);
      return recordsBySubdomain;
    }
    
    log(`No DNS records found for ${domain}.`);
    return {};
  } catch (error) {
    log(`Error retrieving DNS records for ${domain}: ${error.message}`, true);
    
    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }
    
    return {};
  }
}

// Update A record for a subdomain
async function updateSubdomainARecord(domain, subdomain) {
  try {
    await rateLimiter.getToken();
    log(`Adding/Updating A record for ${subdomain === '@' ? domain : subdomain + '.' + domain}...`);
    
    const record = [{
      name: subdomain,
      type: 'A',
      data: CONFIG.firebaseIP,
      ttl: 3600
    }];
    
    const response = await client.put(`/domains/${domain}/records/A/${subdomain}`, record);
    
    log(`A record updated successfully for ${subdomain === '@' ? domain : subdomain + '.' + domain}`);
    return true;
  } catch (error) {
    log(`Error updating A record for ${subdomain === '@' ? domain : subdomain + '.' + domain}: ${error.message}`, true);
    
    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }
    
    return false;
  }
}

// Delete CNAME record for a subdomain
async function deleteSubdomainCnameRecord(domain, subdomain) {
  try {
    await rateLimiter.getToken();
    log(`Checking for CNAME record at ${subdomain === '@' ? domain : subdomain + '.' + domain}...`);
    
    const response = await client.get(`/domains/${domain}/records/CNAME/${subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      log(`Found existing CNAME record for ${subdomain === '@' ? domain : subdomain + '.' + domain}. Deleting...`);
      
      await rateLimiter.getToken();
      await client.put(`/domains/${domain}/records/CNAME/${subdomain}`, []);
      
      log(`CNAME record deleted successfully for ${subdomain === '@' ? domain : subdomain + '.' + domain}`);
      return true;
    }
    
    log(`No CNAME record found for ${subdomain === '@' ? domain : subdomain + '.' + domain}`);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      log(`No CNAME record exists for ${subdomain === '@' ? domain : subdomain + '.' + domain}`);
      return false;
    }
    
    log(`Error checking/deleting CNAME record for ${subdomain === '@' ? domain : subdomain + '.' + domain}: ${error.message}`, true);
    return false;
  }
}

// Check if domain should be excluded
function isDomainExcluded(domain) {
  return CONFIG.excludedDomains.includes(domain);
}

// Check if subdomain should be excluded
function isSubdomainExcluded(subdomain) {
  return CONFIG.excludedSubdomains.includes(subdomain);
}

// Process a single domain
async function processDomain(domain) {
  if (isDomainExcluded(domain)) {
    log(`Skipping domain ${domain} (in exclusion list).`);
    return {
      status: 'excluded_domain',
      domain,
      message: 'Domain in exclusion list'
    };
  }
  
  try {
    // Get all DNS records for this domain
    const recordsBySubdomain = await getDomainDnsRecords(domain);
    
    // Track results for this domain
    const domainResults = {
      domain,
      subdomains: {
        excluded: [],
        updated: [],
        failed: [],
        skipped: [] // Not a subdomain or special record
      }
    };
    
    // Process each subdomain
    for (const subdomain of Object.keys(recordsBySubdomain)) {
      // Skip excluded subdomains
      if (isSubdomainExcluded(subdomain)) {
        log(`Skipping ${subdomain === '@' ? domain : subdomain + '.' + domain} (subdomain in exclusion list).`);
        domainResults.subdomains.excluded.push(subdomain);
        continue;
      }
      
      // Skip special records or nameserver records
      if (subdomain.startsWith('_') && !subdomain.startsWith('_acme-challenge')) {
        log(`Skipping ${subdomain === '@' ? domain : subdomain + '.' + domain} (special record).`);
        domainResults.subdomains.skipped.push(subdomain);
        continue;
      }
      
      try {
        // Step 1: Delete any existing CNAME record
        await deleteSubdomainCnameRecord(domain, subdomain);
        
        // Step 2: Update A record
        const success = await updateSubdomainARecord(domain, subdomain);
        
        if (success) {
          domainResults.subdomains.updated.push(subdomain);
        } else {
          domainResults.subdomains.failed.push(subdomain);
        }
      } catch (error) {
        log(`Error processing ${subdomain === '@' ? domain : subdomain + '.' + domain}: ${error.message}`, true);
        domainResults.subdomains.failed.push(subdomain);
      }
    }
    
    return {
      status: 'processed',
      domain,
      results: domainResults
    };
  } catch (error) {
    log(`Error processing domain ${domain}: ${error.message}`, true);
    return {
      status: 'error',
      domain,
      error: error.message
    };
  }
}

// Main function
async function main() {
  log(`=== Comprehensive Domain Update for Firebase Hosting (${new Date().toISOString()}) ===`);
  
  // Initialize error log file
  fs.writeFileSync(CONFIG.logs.errorLogFile, `=== Errors Log (${new Date().toISOString()}) ===\n`);
  
  try {
    // Get all domains from GoDaddy
    const allDomains = await getAllDomains();
    
    if (allDomains.length === 0) {
      log('No domains found to process. Exiting.');
      return;
    }
    
    // Track overall statistics
    const stats = {
      total: allDomains.length,
      excluded: 0,
      processed: 0,
      error: 0,
      updatedSubdomains: 0,
      excludedSubdomains: 0,
      failedSubdomains: 0,
      skippedSubdomains: 0
    };
    
    // Store results for all domains
    const results = [];
    
    // Process each domain
    for (const domain of allDomains) {
      log(`\n### Processing domain: ${domain} ###`);
      
      const result = await processDomain(domain);
      results.push(result);
      
      // Update stats based on result
      if (result.status === 'excluded_domain') {
        stats.excluded++;
      } else if (result.status === 'error') {
        stats.error++;
      } else if (result.status === 'processed') {
        stats.processed++;
        
        // Count subdomains
        if (result.results) {
          stats.updatedSubdomains += result.results.subdomains.updated.length;
          stats.excludedSubdomains += result.results.subdomains.excluded.length;
          stats.failedSubdomains += result.results.subdomains.failed.length;
          stats.skippedSubdomains += result.results.subdomains.skipped.length;
        }
      }
    }
    
    // Summary
    log('\n=== Update Summary ===');
    log(`Total domains found: ${stats.total}`);
    log(`Excluded domains: ${stats.excluded}`);
    log(`Successfully processed domains: ${stats.processed}`);
    log(`Domains with errors: ${stats.error}`);
    log(`Updated subdomains: ${stats.updatedSubdomains}`);
    log(`Excluded subdomains: ${stats.excludedSubdomains}`);
    log(`Failed subdomains: ${stats.failedSubdomains}`);
    log(`Skipped subdomains: ${stats.skippedSubdomains}`);
    
    // Save results to file
    fs.writeFileSync(CONFIG.logs.resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      results
    }, null, 2));
    
    log(`\nResults saved to ${CONFIG.logs.resultsFile}`);
    log(`Errors logged to ${CONFIG.logs.errorLogFile}`);
    
    log('\n=== Process Completed ===');
    
  } catch (error) {
    log(`Unexpected error in main process: ${error.message}`, true);
    log(`Stack trace: ${error.stack}`, true);
    process.exit(1);
  }
}

// Run the script
main();