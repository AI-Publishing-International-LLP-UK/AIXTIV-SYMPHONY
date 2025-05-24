/**
 * Verify Subdomain DNS Records for 2100.cool
 * 
 * This script checks all subdomains of 2100.cool to verify they're 
 * correctly pointing to Firebase hosting IP address.
 */
const axios = require('axios');
const dns = require('dns');
const util = require('util');
const fs = require('fs');
const path = require('path');

// Promisify DNS functions
const dnsResolve4 = util.promisify(dns.resolve4);

// Configuration
const CONFIG = {
  domain: '2100.cool',
  apiUrl: 'https://api.godaddy.com/v1',
  apiKey: 'dKNvtCsmB3PX_VXx1ghzxNeBfdSHH5AaazX',
  apiSecret: 'NWFaniKptRBwGQ2ChkhpPT',
  firebaseIP: '199.36.158.100',
  
  // List of subdomains to exclude (these have custom configurations)
  excludedSubdomains: [
    'asoos',     // Separate configuration
    'zena',      // Separate configuration
    'vision',    // Separate configuration
    'app',       // Separate configuration
    'api'        // Separate configuration
  ]
};

// Create API client
const client = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Authorization': `sso-key ${CONFIG.apiKey}:${CONFIG.apiSecret}`,
    'Content-Type': 'application/json'
  }
});

// Get all DNS records for the domain
async function getAllDnsRecords() {
  try {
    console.log(`Retrieving all DNS records for ${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records`);
    
    if (response.status === 200 && response.data) {
      // Group records by subdomain
      const recordsBySubdomain = {};
      
      response.data.forEach(record => {
        if (!recordsBySubdomain[record.name]) {
          recordsBySubdomain[record.name] = [];
        }
        recordsBySubdomain[record.name].push(record);
      });
      
      return recordsBySubdomain;
    }
    
    console.log('No DNS records found');
    return {};
  } catch (error) {
    console.error('Error retrieving DNS records:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    throw error;
  }
}

// Check if subdomain resolves to correct IP
async function checkSubdomainResolution(subdomain) {
  try {
    const fulldomain = `${subdomain}.${CONFIG.domain}`;
    console.log(`Checking DNS resolution for ${fulldomain}...`);
    
    const addresses = await dnsResolve4(fulldomain);
    
    if (addresses.includes(CONFIG.firebaseIP)) {
      console.log(`✅ ${fulldomain} correctly resolves to Firebase IP ${CONFIG.firebaseIP}`);
      return { success: true, addresses };
    } else {
      console.log(`❌ ${fulldomain} resolves to ${addresses.join(', ')} instead of ${CONFIG.firebaseIP}`);
      return { success: false, addresses };
    }
  } catch (error) {
    console.error(`Error resolving ${subdomain}.${CONFIG.domain}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Check subdomain HTTP status
async function checkSubdomainHTTP(subdomain) {
  const url = `https://${subdomain}.${CONFIG.domain}`;
  
  try {
    console.log(`Checking HTTP status for ${url}...`);
    
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log(`HTTP status for ${url}: ${response.status}`);
    
    return {
      success: response.status >= 200 && response.status < 400,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error(`Timeout connecting to ${url}`);
      return { success: false, error: 'Timeout' };
    }
    
    console.error(`Error connecting to ${url}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Check if subdomain should be excluded
function isExcluded(subdomain) {
  return CONFIG.excludedSubdomains.includes(subdomain);
}

// Main function
async function main() {
  console.log(`=== Subdomain Verification for ${CONFIG.domain} ===`);
  
  try {
    // Get all DNS records
    const recordsBySubdomain = await getAllDnsRecords();
    
    console.log(`Found ${Object.keys(recordsBySubdomain).length} subdomains in total.`);
    
    // Track statistics
    const stats = {
      total: Object.keys(recordsBySubdomain).length,
      excluded: 0,
      verified: 0,
      incorrect: 0,
      unreachable: 0,
      skipped: 0 // Not a subdomain (e.g., @ or www)
    };
    
    // Create results log
    const results = {
      excluded: [],
      verified: [],
      incorrect: [],
      unreachable: [],
      skipped: []
    };
    
    // Process each subdomain
    for (const subdomain of Object.keys(recordsBySubdomain)) {
      // Skip non-subdomain records (@ or www)
      if (subdomain === '@' || subdomain === 'www') {
        console.log(`Skipping ${subdomain} (not a subdomain).`);
        stats.skipped++;
        results.skipped.push(subdomain);
        continue;
      }
      
      const isExcludedSubdomain = isExcluded(subdomain);
      
      console.log(`\nVerifying subdomain: ${subdomain}${isExcludedSubdomain ? ' (EXCLUDED)' : ''}`);
      
      if (isExcludedSubdomain) {
        stats.excluded++;
        results.excluded.push(subdomain);
        
        // For excluded subdomains, still check resolution but don't count in stats
        const resolveResult = await checkSubdomainResolution(subdomain);
        console.log(`Note: This is an excluded subdomain, actual resolution is: ${resolveResult.addresses ? resolveResult.addresses.join(', ') : 'Not resolvable'}`);
        
        continue;
      }
      
      try {
        // Check DNS resolution
        const resolveResult = await checkSubdomainResolution(subdomain);
        
        if (resolveResult.success) {
          // Check HTTP status
          const httpResult = await checkSubdomainHTTP(subdomain);
          
          if (httpResult.success) {
            stats.verified++;
            results.verified.push({
              subdomain,
              ip: resolveResult.addresses[0],
              status: httpResult.status
            });
          } else {
            stats.unreachable++;
            results.unreachable.push({
              subdomain,
              ip: resolveResult.addresses[0],
              error: httpResult.error || `HTTP status: ${httpResult.status}`
            });
          }
        } else {
          stats.incorrect++;
          results.incorrect.push({
            subdomain,
            ip: resolveResult.addresses || [],
            error: resolveResult.error
          });
        }
      } catch (error) {
        console.error(`Error verifying ${subdomain}:`, error.message);
        stats.incorrect++;
        results.incorrect.push({
          subdomain,
          error: error.message
        });
      }
    }
    
    // Summary
    console.log('\n=== Verification Summary ===');
    console.log(`Total subdomains found: ${stats.total}`);
    console.log(`Excluded (special configuration): ${stats.excluded}`);
    console.log(`Verified (correct DNS and reachable): ${stats.verified}`);
    console.log(`Incorrect DNS: ${stats.incorrect}`);
    console.log(`Correct DNS but unreachable: ${stats.unreachable}`);
    console.log(`Skipped: ${stats.skipped}`);
    
    // Detailed results
    console.log('\n=== Detailed Results ===');
    
    console.log('\nExcluded subdomains:');
    results.excluded.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    console.log('\nVerified subdomains:');
    results.verified.forEach(item => console.log(`  - ${item.subdomain} (${item.ip}, HTTP ${item.status})`));
    
    console.log('\nIncorrect DNS:');
    results.incorrect.forEach(item => console.log(`  - ${item.subdomain} (${item.ip.join(', ') || 'Not resolvable'})`));
    
    console.log('\nUnreachable subdomains:');
    results.unreachable.forEach(item => console.log(`  - ${item.subdomain} (${item.ip}, Error: ${item.error})`));
    
    console.log('\nSkipped (not subdomains):');
    results.skipped.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    // Save results to file
    const resultsFile = path.join(__dirname, 'verification-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      results
    }, null, 2));
    
    console.log(`\nResults saved to ${resultsFile}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main();