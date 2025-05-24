#!/usr/bin/env node

/**
 * Quick Connect - A faster version that just adds the domains without checking all existing ones
 * Connect subdomains directly to specific site names
 */
const { execSync } = require('child_process');
const axios = require('axios');

// Configuration
const CONFIG = {
  domain: '2100.cool',
  apiUrl: 'https://api.godaddy.com/v1',
  apiKey: 'dKNvtCsmB3PX_VXx1ghzxNeBfdSHH5AaazX',
  apiSecret: 'NWFaniKptRBwGQ2ChkhpPT',
  firebaseIP: '199.36.158.100'
};

// Create API client
const client = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Authorization': `sso-key ${CONFIG.apiKey}:${CONFIG.apiSecret}`,
    'Content-Type': 'application/json'
  }
});

// Update A record for a subdomain (direct update)
async function updateSubdomainRecord(subdomain) {
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
      console.error(`API response:`, error.response.data);
    }
    return false;
  }
}

// Connect specific subdomains
async function connectSpecificSubdomains() {
  try {
    console.log('Quick-connecting specific subdomains to asoos.2100.cool...');
    
    // Connect Symphony subdomain
    console.log('\nConnecting symphony subdomain...');
    const symphonySuccess = await updateSubdomainRecord('symphony');
    
    if (symphonySuccess) {
      console.log('Successfully added symphony.asoos.2100.cool A record');
    } else {
      console.error('Failed to add symphony.asoos.2100.cool A record');
    }
    
    // Connect Anthology subdomain
    console.log('\nConnecting anthology subdomain...');
    const anthologySuccess = await updateSubdomainRecord('anthology');
    
    if (anthologySuccess) {
      console.log('Successfully added anthology.asoos.2100.cool A record');
    } else {
      console.error('Failed to add anthology.asoos.2100.cool A record');
    }
    
    console.log('\nDomain connections applied:');
    console.log('- https://asoos.2100.cool (already connected)');
    if (symphonySuccess) console.log('- https://symphony.asoos.2100.cool');
    if (anthologySuccess) console.log('- https://anthology.asoos.2100.cool');
    console.log('\nNote: DNS propagation may take up to 24-48 hours.');
  } catch (error) {
    console.error('Error connecting domains:', error.message);
  }
}

// Run the script
connectSpecificSubdomains();