/**
 * Firebase Domain Configuration Script
 * 
 * This script manages the configuration for all domains in the ecosystem,
 * connecting them to Firebase hosting and ensuring proper SSL setup.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  apiUrl: 'https://api.godaddy.com/v1',
  configPath: path.join(__dirname, '.godaddy-credentials.json'),
  // Firebase hosting requires an A record for the subdomain, pointing to Firebase IPs
  firebaseIPs: [
    '199.36.158.100',  // Primary Firebase hosting IP
  ],
  // Default Firebase project
  defaultFirebaseProject: 'api-for-warp-drive',
  // Output paths
  outputDir: path.join(__dirname, 'domains'),
  verificationLogPath: path.join(__dirname, 'domains', 'verification-status.json'),
  
  // Domains to configure
  domains: [
    {
      domain: '2100.cool',
      subdomains: [
        { name: 'asoos', firebaseSite: '2100-cool' },
        { name: 'vision', firebaseSite: '2100-cool' },
        // Add more subdomains as needed
      ]
    },
    {
      domain: 'coaching2100.com',
      // For apex domain, use '@' as the subdomain name
      subdomains: [
        { name: '@', firebaseSite: 'coaching2100-com' },
        { name: 'www', firebaseSite: 'coaching2100-com' },
        // Add more subdomains as needed
      ]
    },
    // Add more domains as needed
  ]
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Load GoDaddy credentials
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

// Check if DNS A record exists
const checkDnsARecord = async (client, domain, subdomain) => {
  try {
    console.log(`Checking if ${subdomain === '@' ? domain : subdomain + '.' + domain} A record exists...`);
    
    const response = await client.get(`/domains/${domain}/records/A/${subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('A record exists:', response.data);
      return response.data;
    }
    
    console.log('A record not found');
    return null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('A record does not exist yet');
      return null;
    }
    
    console.error('Error checking DNS A record:', error.message);
    return null;
  }
};

// Add or update DNS A record
const updateDnsARecord = async (client, domain, subdomain) => {
  try {
    console.log(`Adding/Updating A record for ${subdomain === '@' ? domain : subdomain + '.' + domain}...`);
    
    // Create Firebase Hosting A records
    const records = [{
      name: subdomain,
      type: 'A',
      data: CONFIG.firebaseIPs[0],
      ttl: 3600
    }];
    
    await client.put(`/domains/${domain}/records/A/${subdomain}`, records);
    
    console.log('A record created/updated successfully');
    return true;
  } catch (error) {
    console.error('Error creating/updating DNS A record:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
};

// Delete existing CNAME record if it exists
const deleteCnameRecord = async (client, domain, subdomain) => {
  try {
    console.log(`Checking if ${subdomain === '@' ? domain : subdomain + '.' + domain} CNAME record exists...`);
    
    const response = await client.get(`/domains/${domain}/records/CNAME/${subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('CNAME record exists and will be removed');
      
      // GoDaddy API requires putting an empty array to delete records
      await client.put(`/domains/${domain}/records/CNAME/${subdomain}`, []);
      
      console.log('CNAME record deleted successfully');
      return true;
    }
    
    console.log('No CNAME record to delete');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('CNAME record does not exist');
      return false;
    }
    
    console.error('Error handling CNAME record:', error.message);
    return false;
  }
};

// Add TXT record for domain verification
const addVerificationTXTRecord = async (client, domain, subdomain, verificationCode) => {
  try {
    console.log(`Adding TXT record for domain verification...`);
    
    // Create verification record
    const records = [{
      name: subdomain,
      type: 'TXT',
      data: `firebase=${verificationCode}`,
      ttl: 3600
    }];
    
    await client.put(`/domains/${domain}/records/TXT/${subdomain}`, records);
    
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

// Check existing TXT records
const checkTxtRecords = async (client, domain, subdomain) => {
  try {
    console.log(`Checking TXT records for ${subdomain === '@' ? domain : subdomain + '.' + domain}...`);
    
    const response = await client.get(`/domains/${domain}/records/TXT/${subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('TXT records exist:', response.data);
      return response.data;
    }
    
    console.log('No TXT records found');
    return [];
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('No TXT records exist yet');
      return [];
    }
    
    console.error('Error checking TXT records:', error.message);
    return [];
  }
};

// Connect domain to Firebase site
const connectToFirebase = (project, site, domain) => {
  try {
    console.log(`Connecting ${domain} to Firebase site ${site} in project ${project}...`);
    
    // This needs to be done in the Firebase Console or with Firebase CLI
    // Firebase CLI doesn't currently support direct custom domain connection via command line
    
    // Generate instructions
    const instructions = `
# Firebase Custom Domain Connection
# ${domain} -> ${site}

To connect this domain in Firebase:

1. Go to Firebase Console: https://console.firebase.google.com/project/${project}/hosting/sites/${site}
2. Click "Add custom domain"
3. Enter: ${domain}
4. Follow the verification process
5. Get the verification code and add it using:
   node add-verification.js ${domain} VERIFICATION_CODE
6. Wait for DNS propagation and verification

Status: Pending manual connection
`;
    
    // Write instructions to file
    const instructionsPath = path.join(CONFIG.outputDir, `${domain.replace(/\./g, '-')}-firebase-connect.md`);
    fs.writeFileSync(instructionsPath, instructions);
    
    console.log(`Instructions written to ${instructionsPath}`);
    return true;
  } catch (error) {
    console.error('Error generating Firebase connection instructions:', error.message);
    return false;
  }
};

// Main function to process all domains
const processAllDomains = async () => {
  console.log('=== Domain Configuration for Firebase Hosting ===');
  console.log(`Processing ${CONFIG.domains.length} domains with their subdomains`);
  
  try {
    const credentials = getCredentials();
    const client = createClient(credentials);
    
    // Load existing verification status
    let verificationStatus = {};
    if (fs.existsSync(CONFIG.verificationLogPath)) {
      verificationStatus = JSON.parse(fs.readFileSync(CONFIG.verificationLogPath, 'utf8'));
    }
    
    // Process each domain
    for (const domainConfig of CONFIG.domains) {
      const { domain, subdomains } = domainConfig;
      
      console.log(`\n===== Processing domain: ${domain} =====`);
      
      // Process each subdomain
      for (const subdomainConfig of subdomains) {
        const { name: subdomain, firebaseSite } = subdomainConfig;
        const fullDomain = subdomain === '@' ? domain : `${subdomain}.${domain}`;
        
        console.log(`\n--- Processing: ${fullDomain} ---`);
        
        // Initialize domain in verification status
        if (!verificationStatus[fullDomain]) {
          verificationStatus[fullDomain] = {
            domain: fullDomain,
            aRecordConfigured: false,
            txtRecordConfigured: false,
            firebaseSite,
            firebaseProject: CONFIG.defaultFirebaseProject,
            lastUpdated: new Date().toISOString(),
            verificationCode: null
          };
        }
        
        // Step 1: Remove any existing CNAME record that might conflict with A record
        await deleteCnameRecord(client, domain, subdomain);
        
        // Step 2: Create or update the A record
        const updated = await updateDnsARecord(client, domain, subdomain);
        
        if (updated) {
          verificationStatus[fullDomain].aRecordConfigured = true;
          verificationStatus[fullDomain].lastUpdated = new Date().toISOString();
          
          console.log(`DNS A record for ${fullDomain} updated successfully to point to Firebase Hosting`);
          
          // Step 3: Check for existing TXT records
          const txtRecords = await checkTxtRecords(client, domain, subdomain);
          
          // Check if Firebase verification record exists
          const firebaseVerificationRecord = txtRecords.find(
            record => record.data && record.data.startsWith('firebase=')
          );
          
          if (firebaseVerificationRecord) {
            console.log(`Firebase verification record already exists: ${firebaseVerificationRecord.data}`);
            verificationStatus[fullDomain].txtRecordConfigured = true;
            verificationStatus[fullDomain].verificationCode = 
              firebaseVerificationRecord.data.replace('firebase=', '');
          } else {
            console.log(`No Firebase verification record found. You need to connect the domain in Firebase Console.`);
            
            // Generate Firebase connection instructions
            connectToFirebase(
              verificationStatus[fullDomain].firebaseProject,
              firebaseSite,
              fullDomain
            );
          }
        } else {
          console.error(`Failed to update DNS record for ${fullDomain}`);
        }
      }
    }
    
    // Save verification status
    fs.writeFileSync(CONFIG.verificationLogPath, JSON.stringify(verificationStatus, null, 2));
    console.log(`\nVerification status saved to ${CONFIG.verificationLogPath}`);
    
    console.log('\n=== Domain Configuration Complete ===');
    console.log('Remember to check the domains directory for connection instructions.');
    
  } catch (error) {
    console.error('Error in domain configuration process:', error.message);
    process.exit(1);
  }
};

// Function to add verification code for a specific domain
const addVerificationForDomain = async (domainToVerify, verificationCode) => {
  console.log(`=== Adding verification for ${domainToVerify} ===`);
  
  if (!verificationCode) {
    console.error('Error: Verification code is required');
    console.error('Usage: node configure-all-domains.js verify domain.com VERIFICATION_CODE');
    process.exit(1);
  }
  
  try {
    const credentials = getCredentials();
    const client = createClient(credentials);
    
    // Load verification status
    let verificationStatus = {};
    if (fs.existsSync(CONFIG.verificationLogPath)) {
      verificationStatus = JSON.parse(fs.readFileSync(CONFIG.verificationLogPath, 'utf8'));
    }
    
    // Find the domain in our configuration
    let foundDomain = false;
    let baseDomain, subdomain;
    
    for (const domainConfig of CONFIG.domains) {
      // Check if it's the main domain
      if (domainConfig.domain === domainToVerify) {
        baseDomain = domainConfig.domain;
        subdomain = '@';
        foundDomain = true;
        break;
      }
      
      // Check if it's a subdomain
      for (const subConfig of domainConfig.subdomains) {
        const fullDomain = subConfig.name === '@' 
          ? domainConfig.domain 
          : `${subConfig.name}.${domainConfig.domain}`;
        
        if (fullDomain === domainToVerify) {
          baseDomain = domainConfig.domain;
          subdomain = subConfig.name;
          foundDomain = true;
          break;
        }
      }
      
      if (foundDomain) break;
    }
    
    if (!foundDomain) {
      // Try to parse the domain ourselves
      const parts = domainToVerify.split('.');
      if (parts.length >= 2) {
        // If it's a subdomain
        if (parts.length > 2) {
          subdomain = parts[0];
          baseDomain = parts.slice(1).join('.');
        } else {
          // If it's a main domain
          baseDomain = domainToVerify;
          subdomain = '@';
        }
      } else {
        console.error(`Error: Invalid domain ${domainToVerify}`);
        process.exit(1);
      }
    }
    
    console.log(`Adding verification for ${subdomain === '@' ? baseDomain : domainToVerify}...`);
    
    // Add verification TXT record
    const success = await addVerificationTXTRecord(client, baseDomain, subdomain, verificationCode);
    
    if (success) {
      console.log(`TXT verification record added for ${domainToVerify}`);
      
      // Update verification status
      if (!verificationStatus[domainToVerify]) {
        verificationStatus[domainToVerify] = {
          domain: domainToVerify,
          aRecordConfigured: true,
          txtRecordConfigured: true,
          firebaseSite: null, // Will need to be updated manually
          firebaseProject: CONFIG.defaultFirebaseProject,
          lastUpdated: new Date().toISOString(),
          verificationCode
        };
      } else {
        verificationStatus[domainToVerify].txtRecordConfigured = true;
        verificationStatus[domainToVerify].verificationCode = verificationCode;
        verificationStatus[domainToVerify].lastUpdated = new Date().toISOString();
      }
      
      // Save verification status
      fs.writeFileSync(CONFIG.verificationLogPath, JSON.stringify(verificationStatus, null, 2));
      console.log(`Verification status updated in ${CONFIG.verificationLogPath}`);
      
      console.log(`DNS propagation may take up to 24-48 hours. After verification completes,`);
      console.log(`your site will be available at https://${domainToVerify}`);
      
      return true;
    } else {
      console.error(`Failed to add TXT verification record for ${domainToVerify}`);
      return false;
    }
  } catch (error) {
    console.error('Error adding verification:', error.message);
    return false;
  }
};

// Check verification status of all domains
const checkAllDomains = async () => {
  console.log('=== Checking all domains status ===');
  
  try {
    // Load verification status
    let verificationStatus = {};
    if (fs.existsSync(CONFIG.verificationLogPath)) {
      verificationStatus = JSON.parse(fs.readFileSync(CONFIG.verificationLogPath, 'utf8'));
    } else {
      console.log('No verification status file found. Run the script first to configure domains.');
      return;
    }
    
    console.log('Domain Status:');
    console.log('=============');
    
    // Process each domain in the verification status
    for (const [domain, status] of Object.entries(verificationStatus)) {
      console.log(`\n${domain}:`);
      console.log(`  A Record: ${status.aRecordConfigured ? '✓' : '✗'}`);
      console.log(`  TXT Record: ${status.txtRecordConfigured ? '✓' : '✗'}`);
      console.log(`  Firebase Site: ${status.firebaseSite || 'Not set'}`);
      console.log(`  Last Updated: ${new Date(status.lastUpdated).toLocaleString()}`);
      
      try {
        // Check HTTPS access
        console.log(`  Checking HTTPS access...`);
        const result = execSync(`curl -s -o /dev/null -w "%{http_code}" https://${domain}`, { stdio: 'pipe' });
        const statusCode = result.toString().trim();
        
        if (statusCode.startsWith('2') || statusCode === '404') {
          console.log(`  HTTPS Status: ✓ (${statusCode})`);
          
          // If 404, site is connected but has no content
          if (statusCode === '404') {
            console.log(`  Note: Site returns 404 - Firebase connected but no content deployed`);
          }
        } else {
          console.log(`  HTTPS Status: ✗ (${statusCode})`);
        }
      } catch (error) {
        console.log(`  HTTPS Status: ✗ (Connection failed)`);
      }
    }
    
    console.log('\nFinished checking all domains.');
  } catch (error) {
    console.error('Error checking domains:', error.message);
  }
};

// Process command line arguments
const processArgs = () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // No arguments, run the main function
    processAllDomains();
  } else if (args[0] === 'verify' && args.length >= 3) {
    // Verify a specific domain
    const domain = args[1];
    const verificationCode = args[2];
    addVerificationForDomain(domain, verificationCode);
  } else if (args[0] === 'check') {
    // Check all domains
    checkAllDomains();
  } else {
    console.log('Usage:');
    console.log('  node configure-all-domains.js                # Configure all domains');
    console.log('  node configure-all-domains.js verify domain.com CODE  # Add verification for a domain');
    console.log('  node configure-all-domains.js check          # Check status of all domains');
  }
};

// Run the script
processArgs();