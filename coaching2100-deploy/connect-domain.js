/**
 * Domain Connection Script for coaching2100.com
 *
 * This script helps connect the coaching2100.com domain to Firebase hosting.
 * It's designed to be minimally invasive to your existing setup.
 */
const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const DOMAIN = 'coaching2100.com';
const SITE_ID = 'coaching2100';
const PROJECT_ID = 'api-for-warp-drive';

// Main function
async function connectDomain() {
  try {
    console.log(`Starting domain connection process for ${DOMAIN}...`);

    // Initialize Firebase Admin using service account
    const serviceAccountPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      path.join(__dirname, '../service-account-key.json');

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Service account key not found at: ${serviceAccountPath}`
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
      projectId: PROJECT_ID,
    });

    // Get access token
    console.log('Getting access token...');
    const token = await getAccessToken();

    // Check if domain is already connected
    console.log('Checking if domain is already connected...');
    const existingDomains = await listDomains(SITE_ID, token);

    if (existingDomains.some(d => d.domainName === DOMAIN)) {
      console.log(`Domain ${DOMAIN} is already connected to site ${SITE_ID}`);

      // Verify domain
      console.log('Verifying domain...');
      await verifyDomain(DOMAIN, SITE_ID, token);

      console.log('Domain verification process initiated.');
      return;
    }

    // Connect domain
    console.log(`Connecting domain ${DOMAIN} to site ${SITE_ID}...`);
    const result = await connectDomainToSite(DOMAIN, SITE_ID, token);

    console.log('Domain connection result:', result);
    console.log('\nDNS Records to configure:');

    if (result.dnsRecords) {
      result.dnsRecords.forEach(record => {
        console.log(
          `Type: ${record.type}, Name: ${record.name}, Value: ${record.value}`
        );
      });
    }

    console.log('\nNext steps:');
    console.log(
      '1. Configure DNS records as shown above at your domain provider'
    );
    console.log('2. Wait for DNS propagation (can take 24-48 hours)');
    console.log('3. Verify domain ownership in Firebase Console');
    console.log(
      '4. Your site will be available at https://coaching2100.com once verification completes'
    );
  } catch (error) {
    console.error('Error connecting domain:', error.message);
    console.error(error.stack);
  }
}

// Helper functions
async function getAccessToken() {
  try {
    const token = await admin.app().options.credential.getAccessToken();
    return token.access_token;
  } catch (error) {
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

async function listDomains(siteId, token) {
  try {
    const url = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/domains`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.domains || [];
  } catch (error) {
    console.warn('Failed to list domains, assuming none exist:', error.message);
    return [];
  }
}

async function connectDomainToSite(domain, siteId, token) {
  const url = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/domains`;

  const payload = {
    domainName: domain,
    type: 'USER_OWNED',
    site: `sites/${siteId}`,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    throw new Error(
      `Failed to add domain to Firebase: ${JSON.stringify(errorDetails)}`
    );
  }
}

async function verifyDomain(domain, siteId, token) {
  const url = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/domains/${domain}:verifyDomain`;

  try {
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to verify domain: ${error.message}`);
  }
}

// Run the script
connectDomain();
