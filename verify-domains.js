/**
 * Verify Domains Script
 * 
 * This script checks the DNS and HTTP status of domains to verify they're
 * correctly pointing to Firebase hosting and accessible.
 * 
 * Usage:
 *   node verify-domains.js 2100.cool             # Check a specific domain and all its subdomains
 *   node verify-domains.js subdomain.2100.cool   # Check a specific subdomain
 *   node verify-domains.js --from-file domains.txt  # Check domains listed in a file
 */
const axios = require('axios');
const dns = require('dns');
const util = require('util');
const fs = require('fs');
const path = require('path');

// Promisify DNS functions
const dnsResolve4 = util.promisify(dns.resolve4);
const dnsResolveTxt = util.promisify(dns.resolveTxt);

// Configuration
const CONFIG = {
  firebaseIP: '199.36.158.100',
  resultDir: path.join(__dirname, 'verification-results')
};

// Ensure results directory exists
if (!fs.existsSync(CONFIG.resultDir)) {
  fs.mkdirSync(CONFIG.resultDir, { recursive: true });
}

// Check if a domain resolves to the Firebase IP
async function checkDnsResolution(domain) {
  try {
    console.log(`Checking DNS resolution for ${domain}...`);
    
    const addresses = await dnsResolve4(domain);
    
    if (addresses.includes(CONFIG.firebaseIP)) {
      console.log(`✅ ${domain} correctly resolves to Firebase IP ${CONFIG.firebaseIP}`);
      return { success: true, addresses };
    } else {
      console.log(`❌ ${domain} resolves to ${addresses.join(', ')} instead of ${CONFIG.firebaseIP}`);
      return { success: false, addresses };
    }
  } catch (error) {
    console.error(`Error resolving ${domain}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Check TXT records for verification
async function checkTxtRecords(domain) {
  try {
    console.log(`Checking TXT records for ${domain}...`);
    
    const records = await dnsResolveTxt(domain);
    
    // Look for Firebase verification record
    const firebaseRecord = records.find(record => 
      record.some(txt => txt.startsWith('firebase='))
    );
    
    if (firebaseRecord) {
      console.log(`✅ Firebase verification record found for ${domain}: ${firebaseRecord}`);
      return { success: true, records };
    } else {
      console.log(`❌ No Firebase verification record found for ${domain}`);
      return { success: false, records };
    }
  } catch (error) {
    console.error(`Error checking TXT records for ${domain}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Check HTTP status
async function checkHttpStatus(domain) {
  const url = `https://${domain}`;
  
  try {
    console.log(`Checking HTTP status for ${url}...`);
    
    const response = await axios.get(url, {
      timeout: 10000,
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

// Get all subdomains for a domain using DNS zone transfer (if available)
async function getSubdomains(domain) {
  // This is a simplified implementation since DNS zone transfers are usually restricted
  // In a real-world scenario, you might need to use other methods or have a predefined list
  
  // For now, let's use a predefined list of common subdomains for 2100.cool
  if (domain === '2100.cool') {
    return [
      'www.2100.cool',
      'asoos.2100.cool',
      'zena.2100.cool',
      'vision.2100.cool',
      'app.2100.cool',
      'api.2100.cool',
      '2100.2100.cool',
      'angel-jg.2100.cool',
      'architecture.2100.cool',
      'automation.2100.cool',
      'caio.2100.cool',
      'ceo.2100.cool',
      'cfo.2100.cool',
      'chro.2100.cool',
      'cmo.2100.cool',
      'coach.2100.cool',
      'coo.2100.cool',
      'cro.2100.cool',
      'cto.2100.cool',
      'drburby.2100.cool',
      'drclaude.2100.cool',
      'drcypriot.2100.cool',
      'drgrant.2100.cool',
      'drlucy.2100.cool',
      'drmaria.2100.cool',
      'drmatch.2100.cool',
      'drmemoria.2100.cool',
      'drsabina.2100.cool',
      'founder.2100.cool',
      'gitlucy.2100.cool',
      'growth.2100.cool',
      'innovation.2100.cool',
      'legal.2100.cool',
      'mrroark.2100.cool',
      'proactivity.2100.cool',
      'proflee.2100.cool',
      'real-estate.2100.cool',
      'thepoet.2100.cool',
      'venture.2100.cool'
    ];
  }
  
  // For other domains, just return the domain itself for now
  return [domain];
}

// Verify a domain
async function verifyDomain(domain) {
  console.log(`\n=== Verifying domain: ${domain} ===`);
  
  const results = {
    domain,
    timestamp: new Date().toISOString(),
    dns: await checkDnsResolution(domain),
    txt: await checkTxtRecords(domain),
    http: await checkHttpStatus(domain)
  };
  
  // Calculate overall status
  results.status = (results.dns.success && (results.http.success || results.txt.success)) 
    ? 'success' 
    : 'failed';
  
  return results;
}

// Verify a main domain and all its subdomains
async function verifyMainDomainWithSubdomains(domain) {
  console.log(`\n=== Verifying main domain and subdomains for: ${domain} ===`);
  
  // Get subdomains
  const subdomains = await getSubdomains(domain);
  
  // Results
  const results = {
    mainDomain: domain,
    timestamp: new Date().toISOString(),
    domains: []
  };
  
  // Verify main domain first
  results.domains.push(await verifyDomain(domain));
  
  // Verify each subdomain
  for (const subdomain of subdomains) {
    results.domains.push(await verifyDomain(subdomain));
  }
  
  // Calculate statistics
  const stats = {
    total: results.domains.length,
    success: results.domains.filter(d => d.status === 'success').length,
    failed: results.domains.filter(d => d.status !== 'success').length
  };
  
  results.stats = stats;
  
  return results;
}

// Read domains from a file
function readDomainsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')); // Remove empty lines and comments
}

// Save results to file
function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = results.mainDomain 
    ? `${results.mainDomain}-${timestamp}.json` 
    : `verification-${timestamp}.json`;
  
  const filePath = path.join(CONFIG.resultDir, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  
  console.log(`\nResults saved to: ${filePath}`);
  return filePath;
}

// Print summary
function printSummary(results) {
  console.log('\n=== Verification Summary ===');
  
  if (results.mainDomain) {
    // Multiple domains summary
    console.log(`Main domain: ${results.mainDomain}`);
    console.log(`Total domains verified: ${results.stats.total}`);
    console.log(`Successful: ${results.stats.success}`);
    console.log(`Failed: ${results.stats.failed}`);
    
    console.log('\nDetailed results:');
    results.domains.forEach(domain => {
      const status = domain.status === 'success' ? '✅' : '❌';
      console.log(`${status} ${domain.domain}`);
    });
  } else {
    // Single domain summary
    const status = results.status === 'success' ? '✅' : '❌';
    console.log(`Domain: ${results.domain} - ${status}`);
    console.log(`DNS Resolution: ${results.dns.success ? '✅' : '❌'}`);
    console.log(`TXT Verification: ${results.txt.success ? '✅' : '❌'}`);
    console.log(`HTTP Status: ${results.http.success ? '✅' : '❌'}`);
  }
}

// Main function
async function main() {
  console.log(`=== Domain Verification ===`);
  console.log(`Current time: ${new Date().toISOString()}`);
  console.log();
  
  if (process.argv.length < 3) {
    console.log('Usage:');
    console.log('  node verify-domains.js 2100.cool             # Check a specific domain and all its subdomains');
    console.log('  node verify-domains.js subdomain.2100.cool   # Check a specific subdomain');
    console.log('  node verify-domains.js --from-file domains.txt  # Check domains listed in a file');
    return;
  }
  
  let results;
  
  if (process.argv[2] === '--from-file') {
    if (process.argv.length < 4) {
      console.log('Please provide a file path.');
      return;
    }
    
    const filePath = process.argv[3];
    const domains = readDomainsFromFile(filePath);
    
    console.log(`Read ${domains.length} domains from ${filePath}.`);
    
    // For simplicity, just verify each domain individually for now
    // In a real-world scenario, you might want to group subdomains by their main domain
    const allResults = {
      timestamp: new Date().toISOString(),
      domains: []
    };
    
    for (const domain of domains) {
      allResults.domains.push(await verifyDomain(domain));
    }
    
    // Calculate statistics
    allResults.stats = {
      total: allResults.domains.length,
      success: allResults.domains.filter(d => d.status === 'success').length,
      failed: allResults.domains.filter(d => d.status !== 'success').length
    };
    
    results = allResults;
  } else {
    const domain = process.argv[2];
    
    // Determine if this is a main domain or a subdomain
    const parts = domain.split('.');
    
    if (parts.length === 2) {
      // It's a main domain like "example.com"
      results = await verifyMainDomainWithSubdomains(domain);
    } else if (parts.length > 2) {
      // It's a subdomain like "www.example.com"
      results = await verifyDomain(domain);
    } else {
      console.log('Invalid domain format.');
      return;
    }
  }
  
  // Save results
  saveResults(results);
  
  // Print summary
  printSummary(results);
}

// Run the script
main();