/**
 * Update DNS for asoos.2100.cool to point to Firebase hosting
 * And optionally add verification TXT record
 */
const axios = require('axios');

// Configuration
const CONFIG = {
  domain: '2100.cool',
  subdomain: 'asoos',
  apiUrl: 'https://api.godaddy.com/v1',
  apiKey: 'dKNvtCsmB3PX_VXx1ghzxNeBfdSHH5AaazX',
  apiSecret: 'NWFaniKptRBwGQ2ChkhpPT',
  firebaseIP: '199.36.158.100'
};

// Get verification code from command line (optional)
const verificationCode = process.argv[2];

// Create API client
const client = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Authorization': `sso-key ${CONFIG.apiKey}:${CONFIG.apiSecret}`,
    'Content-Type': 'application/json'
  }
});

// Check current DNS records
async function checkDnsRecords() {
  try {
    console.log(`Checking DNS records for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records`);
    
    if (response.status === 200 && response.data) {
      // Filter for our subdomain
      const subdomainRecords = response.data.filter(record => 
        record.name === CONFIG.subdomain
      );
      
      console.log(`Current DNS records for ${CONFIG.subdomain}.${CONFIG.domain}:`);
      console.log(JSON.stringify(subdomainRecords, null, 2));
      
      return subdomainRecords;
    }
    
    console.log('No DNS records found');
    return [];
  } catch (error) {
    console.error('Error checking DNS records:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return [];
  }
}

// Update A record for Firebase hosting
async function updateDnsARecord() {
  try {
    console.log(`Adding/Updating A record for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const record = [{
      name: CONFIG.subdomain,
      type: 'A',
      data: CONFIG.firebaseIP,
      ttl: 3600
    }];
    
    const response = await client.put(`/domains/${CONFIG.domain}/records/A/${CONFIG.subdomain}`, record);
    
    console.log('A record updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating A record:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
}

// Delete any existing CNAME record
async function deleteCnameRecord() {
  try {
    console.log(`Checking for CNAME record at ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/CNAME/${CONFIG.subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('Found existing CNAME record. Deleting...');
      
      await client.put(`/domains/${CONFIG.domain}/records/CNAME/${CONFIG.subdomain}`, []);
      
      console.log('CNAME record deleted successfully');
      return true;
    }
    
    console.log('No CNAME record found');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('No CNAME record to delete');
      return false;
    }
    
    console.error('Error deleting CNAME record:', error.message);
    return false;
  }
}

// Add verification TXT record
async function addVerificationRecord(code) {
  try {
    console.log(`Adding TXT verification record for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const record = [{
      name: CONFIG.subdomain,
      type: 'TXT',
      data: `firebase=${code}`,
      ttl: 3600
    }];
    
    await client.put(`/domains/${CONFIG.domain}/records/TXT/${CONFIG.subdomain}`, record);
    
    console.log('TXT verification record added successfully');
    return true;
  } catch (error) {
    console.error('Error adding TXT verification record:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
}

// Check existing TXT records
async function checkTxtRecords() {
  try {
    console.log(`Checking TXT records for ${CONFIG.subdomain}.${CONFIG.domain}...`);
    
    const response = await client.get(`/domains/${CONFIG.domain}/records/TXT/${CONFIG.subdomain}`);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('TXT records:', JSON.stringify(response.data, null, 2));
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
}

// Main function
async function main() {
  console.log(`=== DNS Update for ${CONFIG.subdomain}.${CONFIG.domain} ===`);
  
  try {
    // Check current records
    await checkDnsRecords();
    
    // Delete any CNAME record that might conflict with A record
    await deleteCnameRecord();
    
    // Update A record to point to Firebase hosting
    const aRecordUpdated = await updateDnsARecord();
    
    if (aRecordUpdated) {
      console.log(`\nDNS A record for ${CONFIG.subdomain}.${CONFIG.domain} updated to point to Firebase Hosting (${CONFIG.firebaseIP})`);
      
      if (verificationCode) {
        await addVerificationRecord(verificationCode);
        console.log(`\nTXT verification record has been added with code: firebase=${verificationCode}`);
      } else {
        console.log('\nNo verification code provided. To add a verification record:');
        console.log('1. Go to Firebase Console > Hosting > Connect custom domain');
        console.log('2. Add asoos.2100.cool as your custom domain');
        console.log('3. Get the verification code from Firebase');
        console.log(`4. Run this script again with the verification code as an argument:`);
        console.log(`   node update-firebase-dns.js VERIFICATION_CODE`);
      }
      
      // Check all current records after updates
      await checkTxtRecords();
    }
    
    console.log('\nDNS propagation may take up to 24-48 hours.');
    console.log(`After propagation, your site will be available at: https://${CONFIG.subdomain}.${CONFIG.domain}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main();