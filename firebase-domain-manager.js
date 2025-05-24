/**
 * Domain Manager for Firebase Hosting
 *
 * This script manages DNS records for domains and subdomains,
 * pointing them to Firebase hosting with specific exclusions.
 *
 * Originally created for 2100.cool subdomains, now expanded to handle all domains.
 * Can batch update all domains to point to Firebase hosting, with exclusions.
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
  firebaseProject: 'api-for-warp-drive',
  firebaseSite: '2100-cool', // Default site ID
  
  // List of subdomains to exclude (these will NOT be updated)
  excludedSubdomains: [
    'asoos',     // Exclude asoos from updates
    'zena',      // Exclude zena from updates
    'vision',    // Exclude vision from updates
    'app',       // Exclude app from updates
    'api'        // Exclude api from updates
  ],

  // List of domains to exclude completely (these will NOT be updated)
  excludedDomains: [
    'philliproark.com',
    'byfabriziodesign.com',
    'kennedypartain.com',
    '2100.group',
    'fabriziosassano.com'
  ],
  
  // Log file paths
  logFile: path.join(__dirname, 'domain-update.log'),
  resultsFile: path.join(__dirname, 'domain-update-results.json')
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

// Get all DNS records for the domain
async function getAllDnsRecords() {
  try {
    log(`Retrieving all DNS records for ${CONFIG.domain}...`);

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

    log('No DNS records found');
    return {};
  } catch (error) {
    log(`Error retrieving DNS records: ${error.message}`, true);

    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }

    return {};
  }
}

// Get all DNS records for a specific domain
async function getDomainDnsRecords(domain) {
  try {
    log(`Retrieving all DNS records for ${domain}...`);

    const response = await client.get(`/domains/${domain}/records`);

    if (response.status === 200 && response.data) {
      // Check if the domain has A records for @ and www
      const hasRootARecord = response.data.some(record =>
        record.type === 'A' && record.name === '@' && record.data === CONFIG.firebaseIP);

      const hasWwwARecord = response.data.some(record =>
        record.type === 'A' && record.name === 'www' && record.data === CONFIG.firebaseIP);

      return {
        hasRootARecord,
        hasWwwARecord,
        records: response.data
      };
    }

    log(`No DNS records found for ${domain}`);
    return {
      hasRootARecord: false,
      hasWwwARecord: false,
      records: []
    };
  } catch (error) {
    log(`Error retrieving DNS records for ${domain}: ${error.message}`, true);

    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }

    return {
      hasRootARecord: false,
      hasWwwARecord: false,
      records: [],
      error: error.message
    };
  }
}

// Update A record for a subdomain
async function updateSubdomainARecord(subdomain) {
  try {
    log(`Adding/Updating A record for ${subdomain}.${CONFIG.domain}...`);

    const record = [{
      name: subdomain,
      type: 'A',
      data: CONFIG.firebaseIP,
      ttl: 3600
    }];

    const response = await client.put(`/domains/${CONFIG.domain}/records/A/${subdomain}`, record);

    log(`A record updated successfully for ${subdomain}.${CONFIG.domain}`);
    return true;
  } catch (error) {
    log(`Error updating A record for ${subdomain}.${CONFIG.domain}: ${error.message}`, true);

    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }

    return false;
  }
}

// Update A record for a domain's root (@) record
async function updateDomainRootARecord(domain) {
  try {
    log(`Adding/Updating A record for @ (root) of ${domain}...`);

    const record = [{
      name: '@',
      type: 'A',
      data: CONFIG.firebaseIP,
      ttl: 3600
    }];

    const response = await client.put(`/domains/${domain}/records/A/@`, record);

    log(`A record updated successfully for @ (root) of ${domain}`);
    return true;
  } catch (error) {
    log(`Error updating A record for @ (root) of ${domain}: ${error.message}`, true);

    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }

    return false;
  }
}

// Update A record for a domain's www record
async function updateDomainWwwARecord(domain) {
  try {
    log(`Adding/Updating A record for www.${domain}...`);

    const record = [{
      name: 'www',
      type: 'A',
      data: CONFIG.firebaseIP,
      ttl: 3600
    }];

    const response = await client.put(`/domains/${domain}/records/A/www`, record);

    log(`A record updated successfully for www.${domain}`);
    return true;
  } catch (error) {
    log(`Error updating A record for www.${domain}: ${error.message}`, true);

    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data)}`, true);
    }

    return false;
  }
}

// Delete CNAME record for a subdomain
async function deleteSubdomainCnameRecord(subdomain) {
  try {
    log(`Checking for CNAME record at ${subdomain}.${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/CNAME/${subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      log(`Found existing CNAME record for ${subdomain}.${CONFIG.domain}. Deleting...`);
      
      await client.put(`/domains/${CONFIG.domain}/records/CNAME/${subdomain}`, []);
      
      log(`CNAME record deleted successfully for ${subdomain}.${CONFIG.domain}`);
      return true;
    }
    
    log(`No CNAME record found for ${subdomain}.${CONFIG.domain}`);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      log(`No CNAME record exists for ${subdomain}.${CONFIG.domain}`);
      return false;
    }
    
    log(`Error checking/deleting CNAME record for ${subdomain}.${CONFIG.domain}: ${error.message}`, true);
    return false;
  }
}

// Check if subdomain should be excluded
function isExcluded(subdomain) {
  return CONFIG.excludedSubdomains.includes(subdomain);
}

// Check if domain should be excluded
function isDomainExcluded(domain) {
  return CONFIG.excludedDomains.includes(domain);
}

// Get all domains from GoDaddy
async function getAllDomains() {
  try {
    log(`Retrieving all domains from GoDaddy...`);

    const response = await client.get('/domains?statuses=ACTIVE&limit=100');

    if (response.status === 200 && response.data) {
      const domains = response.data.map(domain => domain.domain);
      log(`Found ${domains.length} active domains`);
      return domains;
    }

    log('No domains found');
    return [];
  } catch (error) {
    log(`Error retrieving domains: ${error.message}`, true);

    if (error.response) {
      log(`API response: ${JSON.stringify(error.response.data, null, 2)}`, true);
    }

    return [];
  }
}

// Generate a report of updates to be applied (dry run)
async function generateUpdateReport() {
  try {
    // Get all DNS records
    const recordsBySubdomain = await getAllDnsRecords();
    
    console.log(`Found ${Object.keys(recordsBySubdomain).length} subdomains in total.`);
    
    // Track statistics
    const stats = {
      total: Object.keys(recordsBySubdomain).length,
      excluded: 0,
      toUpdate: 0,
      skipped: 0 // Not a subdomain (e.g., @ or www)
    };
    
    // Create results log
    const results = {
      excluded: [],
      toUpdate: [],
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
      
      stats.toUpdate++;
      results.toUpdate.push(subdomain);
    }
    
    // Summary
    console.log('\n=== Update Plan ===');
    console.log(`Total subdomains found: ${stats.total}`);
    console.log(`Excluded: ${stats.excluded}`);
    console.log(`To be updated: ${stats.toUpdate}`);
    console.log(`Skipped: ${stats.skipped}`);
    
    // Detailed results
    console.log('\n=== Detailed Plan ===');
    
    console.log('\nExcluded subdomains:');
    results.excluded.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    console.log('\nSubdomains to update:');
    results.toUpdate.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    console.log('\nSkipped (not subdomains):');
    results.skipped.forEach(subdomain => console.log(`  - ${subdomain}`));
    
    return {
      stats,
      results
    };
  } catch (error) {
    console.error('Error generating update report:', error.message);
    return null;
  }
}

// Apply updates
async function applyUpdates() {
  log(`=== Applying Updates for ${CONFIG.domain} Subdomains ===`);
  
  try {
    // Get all DNS records
    const recordsBySubdomain = await getAllDnsRecords();
    
    log(`Found ${Object.keys(recordsBySubdomain).length} subdomains in total.`);
    
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
        log(`Skipping ${subdomain} (not a subdomain).`);
        stats.skipped++;
        results.skipped.push(subdomain);
        continue;
      }
      
      if (isExcluded(subdomain)) {
        log(`Skipping ${subdomain} (in exclusion list).`);
        stats.excluded++;
        results.excluded.push(subdomain);
        continue;
      }
      
      log(`\nProcessing subdomain: ${subdomain}`);
      
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
        log(`Error processing ${subdomain}:`, error.message);
        stats.failed++;
        results.failed.push(`${subdomain} (${error.message})`);
      }
    }
    
    // Summary
    log('\n=== Update Summary ===');
    log(`Total subdomains found: ${stats.total}`);
    log(`Excluded: ${stats.excluded}`);
    log(`Updated: ${stats.updated}`);
    log(`Failed: ${stats.failed}`);
    log(`Skipped: ${stats.skipped}`);
    
    // Save results to file
    fs.writeFileSync(CONFIG.resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      results
    }, null, 2));
    
    log(`\nResults saved to ${CONFIG.resultsFile}`);
    
    return {
      stats,
      results
    };
  } catch (error) {
    log(`Unexpected error: ${error.message}`, true);
    return null;
  }
}

// Process all domains (generate report)
async function generateAllDomainsUpdateReport() {
  try {
    // Get all domains
    const domains = await getAllDomains();

    console.log(`Found ${domains.length} domains in total.`);

    // Track statistics
    const stats = {
      total: domains.length,
      excluded: 0,
      toUpdate: 0,
      alreadyConfigured: 0,
      error: 0
    };

    // Create results log
    const results = {
      excluded: [],
      toUpdate: [],
      alreadyConfigured: [],
      errors: []
    };

    // Process each domain
    for (const domain of domains) {
      // Skip excluded domains
      if (isDomainExcluded(domain)) {
        console.log(`Skipping ${domain} (in exclusion list).`);
        stats.excluded++;
        results.excluded.push(domain);
        continue;
      }

      try {
        // Get domain DNS records
        const dnsInfo = await getDomainDnsRecords(domain);

        if (dnsInfo.error) {
          console.log(`Error checking ${domain}: ${dnsInfo.error}`);
          stats.error++;
          results.errors.push(`${domain} (${dnsInfo.error})`);
          continue;
        }

        // Check if already configured
        if (dnsInfo.hasRootARecord && dnsInfo.hasWwwARecord) {
          console.log(`${domain} is already configured for Firebase hosting.`);
          stats.alreadyConfigured++;
          results.alreadyConfigured.push(domain);
        } else {
          console.log(`${domain} needs to be updated for Firebase hosting.`);
          stats.toUpdate++;
          results.toUpdate.push(domain);
        }
      } catch (error) {
        console.log(`Error processing ${domain}: ${error.message}`);
        stats.error++;
        results.errors.push(`${domain} (${error.message})`);
      }
    }

    // Summary
    console.log('\n=== Update Plan for All Domains ===');
    console.log(`Total domains found: ${stats.total}`);
    console.log(`Excluded: ${stats.excluded}`);
    console.log(`Already configured: ${stats.alreadyConfigured}`);
    console.log(`To be updated: ${stats.toUpdate}`);
    console.log(`Errors: ${stats.error}`);

    // Detailed results
    console.log('\n=== Detailed Plan ===');

    console.log('\nExcluded domains:');
    results.excluded.forEach(domain => console.log(`  - ${domain}`));

    console.log('\nAlready configured domains:');
    results.alreadyConfigured.forEach(domain => console.log(`  - ${domain}`));

    console.log('\nDomains to update:');
    results.toUpdate.forEach(domain => console.log(`  - ${domain}`));

    console.log('\nDomains with errors:');
    results.errors.forEach(domain => console.log(`  - ${domain}`));

    return {
      stats,
      results
    };
  } catch (error) {
    console.error('Error generating all domains update report:', error.message);
    return null;
  }
}

// Process all domains (apply updates)
async function applyAllDomainsUpdates() {
  log(`=== Applying Updates for All Domains ===`);

  try {
    // Get all domains
    const domains = await getAllDomains();

    log(`Found ${domains.length} domains in total.`);

    // Track statistics
    const stats = {
      total: domains.length,
      excluded: 0,
      updated: 0,
      alreadyConfigured: 0,
      failed: 0
    };

    // Create results log
    const results = {
      excluded: [],
      updated: [],
      alreadyConfigured: [],
      failed: []
    };

    // Process each domain
    for (const domain of domains) {
      // Skip excluded domains
      if (isDomainExcluded(domain)) {
        log(`Skipping ${domain} (in exclusion list).`);
        stats.excluded++;
        results.excluded.push(domain);
        continue;
      }

      log(`\nProcessing domain: ${domain}`);

      try {
        // Get domain DNS records
        const dnsInfo = await getDomainDnsRecords(domain);

        // Check if already configured
        if (dnsInfo.hasRootARecord && dnsInfo.hasWwwARecord) {
          log(`${domain} is already configured for Firebase hosting.`);
          stats.alreadyConfigured++;
          results.alreadyConfigured.push(domain);
          continue;
        }

        let updateSuccess = true;

        // Update root A record if needed
        if (!dnsInfo.hasRootARecord) {
          const rootSuccess = await updateDomainRootARecord(domain);
          if (!rootSuccess) {
            updateSuccess = false;
            log(`Failed to update root A record for ${domain}.`);
          }
        }

        // Update www A record if needed
        if (!dnsInfo.hasWwwARecord) {
          const wwwSuccess = await updateDomainWwwARecord(domain);
          if (!wwwSuccess) {
            updateSuccess = false;
            log(`Failed to update www A record for ${domain}.`);
          }
        }

        if (updateSuccess) {
          stats.updated++;
          results.updated.push(domain);
          log(`Successfully updated ${domain} for Firebase hosting.`);
        } else {
          stats.failed++;
          results.failed.push(domain);
          log(`Failed to update ${domain} for Firebase hosting.`);
        }
      } catch (error) {
        log(`Error processing ${domain}: ${error.message}`);
        stats.failed++;
        results.failed.push(`${domain} (${error.message})`);
      }
    }

    // Summary
    log('\n=== Update Summary for All Domains ===');
    log(`Total domains found: ${stats.total}`);
    log(`Excluded: ${stats.excluded}`);
    log(`Already configured: ${stats.alreadyConfigured}`);
    log(`Updated: ${stats.updated}`);
    log(`Failed: ${stats.failed}`);

    // Save results to file
    fs.writeFileSync(CONFIG.resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      results
    }, null, 2));

    log(`\nResults saved to ${CONFIG.resultsFile}`);

    return {
      stats,
      results
    };
  } catch (error) {
    log(`Unexpected error: ${error.message}`, true);
    return null;
  }
}

// Main function
async function main() {
  console.log(`=== Domain Manager for Firebase Hosting ===`);
  console.log(`Current time: ${new Date().toISOString()}`);
  console.log();

  if (process.argv.includes('--help')) {
    console.log('Usage:');
    console.log('  node firebase-domain-manager.js                     # Generate update report for 2100.cool subdomains (dry run)');
    console.log('  node firebase-domain-manager.js --apply             # Apply updates to 2100.cool subdomains');
    console.log('  node firebase-domain-manager.js --all               # Generate update report for all domains (dry run)');
    console.log('  node firebase-domain-manager.js --all --apply       # Apply updates to all domains');
    console.log('  node firebase-domain-manager.js --help              # Show this help');
    return;
  }

  const shouldApply = process.argv.includes('--apply');
  const processAllDomains = process.argv.includes('--all');

  // Initialize log file with appropriate title
  let logTitle = processAllDomains ? 'All Domains' : '2100.cool Subdomains';
  fs.writeFileSync(CONFIG.logFile, `=== ${logTitle} Update Log (${new Date().toISOString()}) ===\n`);

  if (processAllDomains) {
    // Process all domains
    if (shouldApply) {
      // Apply updates to all domains
      console.log('Applying updates to all domains...');
      const result = await applyAllDomainsUpdates();

      if (result) {
        console.log('\nUpdates applied successfully to all eligible domains.');
      } else {
        console.error('\nFailed to apply updates to all domains.');
      }
    } else {
      // Generate report only for all domains (dry run)
      console.log('Generating update report for all domains (dry run)...');
      await generateAllDomainsUpdateReport();
      console.log('\nThis was a dry run. No changes were made.');
      console.log('To apply these changes, run: node firebase-domain-manager.js --all --apply');
    }
  } else {
    // Process only 2100.cool subdomains (original functionality)
    if (shouldApply) {
      // Apply updates
      console.log('Applying updates to 2100.cool subdomains...');
      const result = await applyUpdates();

      if (result) {
        console.log('\nUpdates applied successfully to 2100.cool subdomains.');
      } else {
        console.error('\nFailed to apply updates to 2100.cool subdomains.');
      }
    } else {
      // Generate report only (dry run)
      console.log('Generating update report for 2100.cool subdomains (dry run)...');
      await generateUpdateReport();
      console.log('\nThis was a dry run. No changes were made.');
      console.log('To apply these changes, run: node firebase-domain-manager.js --apply');
    }
  }
}

// Run the script
main();