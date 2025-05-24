/**
 * Connect All Domains to Firebase Hosting
 * 
 * This script uses the Firebase CLI to connect all domains to Firebase hosting,
 * and adds necessary verification records to GoDaddy.
 */
const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  apiUrl: 'https://api.godaddy.com/v1',
  apiKey: 'dKNvtCsmB3PX_VXx1ghzxNeBfdSHH5AaazX', 
  apiSecret: 'NWFaniKptRBwGQ2ChkhpPT',
  firebaseProject: 'api-for-warp-drive',
  firebaseSite: '2100-cool', // Default site ID
  
  // List of fully qualified domains to exclude (these will NOT be connected)
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
    maxRequests: 5,        // Number of requests
    perPeriod: 60 * 1000   // Time period in milliseconds (60 seconds)
  },
  
  // Optional: paths for logs
  logs: {
    resultsFile: path.join(__dirname, 'domain-connection-results.json'),
    errorLogFile: path.join(__dirname, 'domain-connection-errors.log'),
    verificationCodesFile: path.join(__dirname, 'verification-codes.json')
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

// Get all domains from previously saved results file
function getAllDomains() {
  try {
    // First check if a domain update results file exists
    if (fs.existsSync(CONFIG.logs.resultsFile.replace('connection', 'update'))) {
      const results = JSON.parse(fs.readFileSync(CONFIG.logs.resultsFile.replace('connection', 'update'), 'utf8'));
      
      if (results.results) {
        // Filter domains that were successfully processed
        const domains = results.results
          .filter(result => result.status === 'processed')
          .map(result => result.domain);
        
        log(`Found ${domains.length} previously processed domains in results file.`);
        return domains;
      }
    }
    
    // If no results file or no domains found, try to get domains from GoDaddy
    log('No domain update results found. Retrieving all domains from GoDaddy account...');
    
    const response = execSync('curl -s -X GET "https://api.godaddy.com/v1/domains?limit=500&statuses=ACTIVE" ' + 
      `-H "Authorization: sso-key ${CONFIG.apiKey}:${CONFIG.apiSecret}" ` +
      '-H "Content-Type: application/json"');
    
    const data = JSON.parse(response.toString());
    const domains = data.map(domain => domain.domain);
    
    log(`Found ${domains.length} domains in GoDaddy account.`);
    return domains;
  } catch (error) {
    log(`Error retrieving domains: ${error.message}`, true);
    
    if (error.stdout) {
      log(`API response: ${error.stdout.toString()}`, true);
    }
    
    return [];
  }
}

// Check if domain should be excluded
function isDomainExcluded(domain) {
  return CONFIG.excludedDomains.includes(domain);
}

// Connect a domain to Firebase hosting
async function connectDomainToFirebase(domain) {
  try {
    await rateLimiter.getToken();
    log(`Connecting ${domain} to Firebase hosting...`);
    
    // Execute Firebase CLI command to connect domain
    const command = `firebase --project=${CONFIG.firebaseProject} hosting:sites:create ${domain.replace(/\./g, '-')}`;
    execSync(command, { stdio: 'pipe' });
    
    // Connect the domain to the site
    const connectCommand = `firebase --project=${CONFIG.firebaseProject} hosting:channel:deploy production --site=${domain.replace(/\./g, '-')}`;
    execSync(connectCommand, { stdio: 'pipe' });
    
    // Get verification details
    const verificationCommand = `firebase --project=${CONFIG.firebaseProject} hosting:sites:get ${domain.replace(/\./g, '-')} --json`;
    const verificationOutput = execSync(verificationCommand, { stdio: 'pipe' }).toString();
    const verificationData = JSON.parse(verificationOutput);
    
    // Extract verification record
    const verificationCode = verificationData.verification?.token;
    
    if (verificationCode) {
      // Save verification code to file
      const verificationCodes = fs.existsSync(CONFIG.logs.verificationCodesFile) 
        ? JSON.parse(fs.readFileSync(CONFIG.logs.verificationCodesFile, 'utf8')) 
        : {};
      
      verificationCodes[domain] = verificationCode;
      fs.writeFileSync(CONFIG.logs.verificationCodesFile, JSON.stringify(verificationCodes, null, 2));
      
      return {
        success: true,
        domain,
        verificationCode
      };
    }
    
    return {
      success: true,
      domain,
      message: 'Domain connected, but no verification code found'
    };
  } catch (error) {
    log(`Error connecting ${domain} to Firebase: ${error.message}`, true);
    
    if (error.stdout) {
      log(`Command output: ${error.stdout.toString()}`, true);
    }
    
    if (error.stderr) {
      log(`Error output: ${error.stderr.toString()}`, true);
    }
    
    return {
      success: false,
      domain,
      error: error.message
    };
  }
}

// Add verification TXT record to GoDaddy
async function addVerificationRecord(domain, verificationCode) {
  try {
    await rateLimiter.getToken();
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

// Process a single domain
async function processDomain(domain) {
  if (isDomainExcluded(domain)) {
    log(`Skipping domain ${domain} (in exclusion list).`);
    return {
      status: 'excluded',
      domain,
      message: 'Domain in exclusion list'
    };
  }
  
  try {
    // Step 1: Connect domain to Firebase
    const connectionResult = await connectDomainToFirebase(domain);
    
    if (!connectionResult.success) {
      return {
        status: 'connection_failed',
        domain,
        error: connectionResult.error
      };
    }
    
    // Step 2: Add verification record if we have a verification code
    if (connectionResult.verificationCode) {
      const verificationResult = await addVerificationRecord(domain, connectionResult.verificationCode);
      
      if (!verificationResult.success) {
        return {
          status: 'verification_failed',
          domain,
          connectionResult,
          error: verificationResult.error
        };
      }
      
      return {
        status: 'success',
        domain,
        verificationCode: connectionResult.verificationCode
      };
    }
    
    return {
      status: 'partial_success',
      domain,
      message: 'Domain connected but no verification code found'
    };
  } catch (error) {
    log(`Unexpected error processing ${domain}: ${error.message}`, true);
    return {
      status: 'error',
      domain,
      error: error.message
    };
  }
}

// Main function
async function main() {
  log(`=== Connect All Domains to Firebase Hosting (${new Date().toISOString()}) ===`);
  
  // Initialize error log file
  fs.writeFileSync(CONFIG.logs.errorLogFile, `=== Errors Log (${new Date().toISOString()}) ===\n`);
  
  try {
    // Get all domains
    const allDomains = getAllDomains();
    
    if (allDomains.length === 0) {
      log('No domains found to process. Exiting.');
      return;
    }
    
    // Track statistics
    const stats = {
      total: allDomains.length,
      excluded: 0,
      success: 0,
      partial_success: 0,
      connection_failed: 0,
      verification_failed: 0,
      error: 0
    };
    
    // Store results
    const results = [];
    
    // Process each domain
    for (const domain of allDomains) {
      log(`\n### Processing domain: ${domain} ###`);
      
      const result = await processDomain(domain);
      results.push(result);
      
      // Update stats
      stats[result.status]++;
    }
    
    // Summary
    log('\n=== Connection Summary ===');
    log(`Total domains found: ${stats.total}`);
    log(`Excluded domains: ${stats.excluded}`);
    log(`Successfully connected and verified: ${stats.success}`);
    log(`Connected but not verified: ${stats.partial_success}`);
    log(`Connection failed: ${stats.connection_failed}`);
    log(`Verification failed: ${stats.verification_failed}`);
    log(`Unexpected errors: ${stats.error}`);
    
    // Save results to file
    fs.writeFileSync(CONFIG.logs.resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      results
    }, null, 2));
    
    log(`\nResults saved to ${CONFIG.logs.resultsFile}`);
    log(`Errors logged to ${CONFIG.logs.errorLogFile}`);
    log(`Verification codes saved to ${CONFIG.logs.verificationCodesFile}`);
    
    log('\n=== Process Completed ===');
    
  } catch (error) {
    log(`Unexpected error in main process: ${error.message}`, true);
    log(`Stack trace: ${error.stack}`, true);
    process.exit(1);
  }
}

// Run the script
main();