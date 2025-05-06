const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');

// Path to your service account key file
// This should be a Firebase Admin SDK service account key
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const SERVICE_ACCOUNT_KEY_PATH =
  process.env.SERVICE_ACCOUNT_KEY_PATH || './key.json';

// Initialize the Firebase Admin SDK
try {
  if (fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
    const serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // If key file doesn't exist, try to use application default credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Function to generate a custom token
async function generateCustomToken(uid) {
  try {
    const customToken = await admin.auth().createCustomToken(uid);
    console.log('Custom token generated successfully.');
    return customToken;
  } catch (error) {
    console.error('Error generating custom token:', error);
    throw error;
  }
}

// Function to exchange a custom token for an ID token
async function exchangeCustomTokenForIdToken(customToken) {
  if (!FIREBASE_API_KEY) {
    console.error('Error: FIREBASE_API_KEY environment variable is not set.');
    console.error(
      'You need to set this to exchange the custom token for an ID token.'
    );
    process.exit(1);
  }

  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true,
      }
    );

    console.log('ID token fetched successfully.');
    return response.data.idToken;
  } catch (error) {
    console.error(
      'Error exchanging custom token for ID token:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Use a test user ID
    const uid = 'test-user-' + Date.now();

    // Generate a custom token
    const customToken = await generateCustomToken(uid);
    console.log('Custom Token:', customToken);

    // Exchange the custom token for an ID token if API key is provided
    if (FIREBASE_API_KEY) {
      const idToken = await exchangeCustomTokenForIdToken(customToken);
      console.log('\nID Token (use this for API calls):\n' + idToken);

      // Show example curl command
      console.log('\nExample curl command:');
      console.log(`curl -X POST \\
  -H "Authorization: Bearer ${idToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "I really enjoyed this product, it works great!"}' \\
  https://us-west1-api-for-warp-drive.cloudfunctions.net/analyzeSentiment`);
    } else {
      console.log(
        '\nSkipping ID token exchange. Set FIREBASE_API_KEY environment variable to complete this step.'
      );
    }
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main();
