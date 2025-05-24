/**
 * Bulk Update Script for 2100.cool Subdomains
 * 
 * This script updates all 2100.cool subdomains to point to Firebase hosting
 * with the same DNS configuration, except for 5 excluded domains.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  domain: '2100.cool',
  apiUrl: 'https://api.godaddy.com/v1',
  apiKey: 'dKNvtCsmB3PX_VXx1ghzxNeBfdSHH5AaazX', 
  apiSecret: 'NWFaniKptRBwGQ2ChkhpPT',
  firebaseIP: '199.36.158.100',
  
  // List of subdomains to exclude (these will NOT be updated)
  excludedSubdomains: [
    'asoos',     // Already correctly configured
    'zena',      // Keep as is
    'vision',    // Keep as is
    'app',       // Keep as is
    'api'        // Keep as is
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

// Update A record for a subdomain
async function updateSubdomainARecord(subdomain) {
  try {
    console.log(`Adding/Updating A record for ${subdomain}.${CONFIG.domain}...`);
    
    const record = [{
      name: subdomain,
      type: 'A',
      data: CONFIG.firebaseIP,
      ttl: 3600
    }];
    
    const response = await client.put(`/domains/${CONFIG.domain}/records/A/${subdomain}`, record);
    
    console.log(`A record updated successfully for ${subdomain}.${CONFIG.domain}`);
    return true;
  } catch (error) {
    console.error(`Error updating A record for ${subdomain}.${CONFIG.domain}:`, error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
}

// Delete CNAME record for a subdomain
async function deleteSubdomainCnameRecord(subdomain) {
  try {
    console.log(`Checking for CNAME record at ${subdomain}.${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/CNAME/${subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log(`Found existing CNAME record for ${subdomain}.${CONFIG.domain}. Deleting...`);
      
      await client.put(`/domains/${CONFIG.domain}/records/CNAME/${subdomain}`, []);
      
      console.log(`CNAME record deleted successfully for ${subdomain}.${CONFIG.domain}`);
      return true;
    }
    
    console.log(`No CNAME record found for ${subdomain}.${CONFIG.domain}`);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`No CNAME record exists for ${subdomain}.${CONFIG.domain}`);
      return false;
    }
    
    console.error(`Error checking/deleting CNAME record for ${subdomain}.${CONFIG.domain}:`, error.message);
    return false;
  }
}

// Check if subdomain should be excluded
function isExcluded(subdomain) {
  return CONFIG.excludedSubdomains.includes(subdomain);
}

// Main function
async function main() {
  console.log(`=== Bulk DNS Update for ${CONFIG.domain} Subdomains ===`);
  
  try {
    // Get all DNS records
    const recordsBySubdomain = await getAllDnsRecords();
    
    console.log(`Found ${Object.keys(recordsBySubdomain).length} subdomains in total.`);
    
    // Track statistics
    const stats = {
      total: Object.keys(recordsBySubdomain).length,
      excluded: 0,
      updated: 0,
      failed: 0,
      skipped: 0 // Not a subdomain (e.g., @ or www)
    };
    
    // Create results log
    const results = {
      excluded: [],
      updated: [],
      failed: [],
      skipped: []
    };
    
    // Process each subdomain
    for (const subdomain of Object.keys(recordsBySubdomain)) {
      // Skip non-subdomain records (@ or www) or excluded subdomains
      if (subdomain === '@' || subdomain === 'www') {
        console.log(`Skipping ${subdomain} (not a subdomain).`);
        stats.skipped++;
        results.skipped.push(subdomain);
        continue;
      }
      
      if (isExcluded(subdomain)) {
        console.log(`Skipping ${subdomain} (in exclusion list).`);
        stats.excluded++;
        results.excluded.push(subdomain);
        continue;
      }
      
      console.log(`\nProcessing subdomain: ${subdomain}`);
      
      try {
        // Step 1: Delete any existing CNAME record
        await deleteSubdomainCnameRecord(subdomain);
        
        // Step 2: Update A record
        const success = await updateSubdomainARecord(subdomain);
        
        if (success) {
          stats.updated++;
          results.updated.push(subdomain);
        } else {
          stats.failed++;
          results.failed.push(subdomain);
        }
      } catch (error) {
        console.error(`Error processing ${subdomain}:`, error.message);
        stats.failed++;
        results.failed.push(`${subdomain} (${error.message})`);
      }
    }
    
    // Summary
    console.log('\n=== Summary ===');
    console.log(`Total subdomains found: ${stats.total}`);
    console.log(`Excluded: ${stats.excluded}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Skipped: ${stats.skipped}`);
    
    // Detailed results
    console.log('\n=== Detailed Results ===');
    
    console.log('\nExcluded subdomains:');
    results.excluded.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    console.log('\nUpdated subdomains:');
    results.updated.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    console.log('\nFailed subdomains:');
    results.failed.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    console.log('\nSkipped (not subdomains):');
    results.skipped.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    // Save results to file
    const resultsFile = path.join(__dirname, 'bulk-update-results.json');
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