// MCP Configuration Check Script
// This script verifies the MCP server's configuration with Google Cloud Platform
// Service Account: drlucyautomation@api-for-warp-drive.iam.gservicecloud.com

const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

console.log('MCP Configuration Check');
console.log('======================');

// Check environment variables
console.log('\nChecking environment variables:');
const requiredVars = ['FIREBASE_PROJECT_ID', 'GOOGLE_APPLICATION_CREDENTIALS'];

const optionalVars = [
  'GCP_REGION',
  'GCP_SERVICE_ACCOUNT',
  'BLOCKCHAIN_RPC',
  'S2DO_CONTRACT_ADDRESS',
  'FMS_CONTRACT_ADDRESS',
];

let missingVars = false;
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    missingVars = true;
  } else {
    console.log(
      `✅ ${varName}: ${varName.includes('CREDENTIALS') ? 'Set' : process.env[varName]}`
    );
  }
});

console.log('\nOptional environment variables:');
optionalVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`⚠️ Optional variable not set: ${varName}`);
  } else {
    console.log(`✅ ${varName}: ${process.env[varName]}`);
  }
});

if (missingVars) {
  console.error(
    '\n❌ Missing required environment variables. Please set them before continuing.'
  );
  process.exit(1);
}

// Check service account file
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log(`\nChecking service account credentials: ${credentialsPath}`);

if (!fs.existsSync(credentialsPath)) {
  console.error(`❌ Service account file not found: ${credentialsPath}`);
  process.exit(1);
}

try {
  const serviceAccount = require(credentialsPath);
  console.log(`✅ Service account file loaded successfully`);
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
} catch (error) {
  console.error(`❌ Error loading service account:`, error.message);
  process.exit(1);
}

// Test Firebase connection
console.log('\nTesting Firebase connection:');
try {
  // Initialize Firebase
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  console.log('✅ Firebase app initialized successfully');

  // Test Firestore
  testFirestore()
    .then(() => testStorage())
    .then(() => {
      console.log('\n✅ All checks completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error during checks:', err);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

async function testFirestore() {
  console.log('Testing Firestore:');
  try {
    const firestore = admin.firestore();
    const timestamp = new Date().toISOString();

    // Create a test collection for MCP checks
    const docRef = firestore
      .collection('mcp_config_checks')
      .doc(`check_${timestamp}`);
    await docRef.set({
      timestamp,
      success: true,
      environment: process.env.NODE_ENV || 'development',
    });

    console.log('✅ Successfully wrote to Firestore');

    // Read the document back
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('✅ Successfully read from Firestore');

      // Clean up
      await docRef.delete();
      console.log('✅ Successfully deleted test document');
    } else {
      throw new Error('Document not found after writing');
    }
  } catch (error) {
    console.error('❌ Firestore test failed:', error.message);
    throw error;
  }
}

async function testStorage() {
  console.log('\nTesting GCP Storage:');
  try {
    const storage = new Storage();
    const buckets = await storage.getBuckets();

    console.log(`✅ Successfully connected to GCP Storage`);
    console.log(`   Available buckets: ${buckets[0].length}`);

    // Look for default Firebase storage bucket
    const defaultBucket = buckets[0].find(b =>
      b.name.startsWith(`${process.env.FIREBASE_PROJECT_ID}.appspot.com`)
    );

    if (defaultBucket) {
      console.log(
        `✅ Found default Firebase Storage bucket: ${defaultBucket.name}`
      );
    } else {
      console.log(`⚠️ Default Firebase Storage bucket not found`);
    }
  } catch (error) {
    console.error('❌ GCP Storage test failed:', error.message);
    throw error;
  }
}
