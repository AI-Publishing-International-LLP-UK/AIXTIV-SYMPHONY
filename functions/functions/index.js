const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * This function is protected by Firebase Authentication
 * It verifies the Firebase ID token before allowing access
 * 
 * HOW TO TEST THIS FUNCTION:
 * 
 * 1. Create a Firebase Authentication user:
 *    - Go to Firebase console > Authentication > Users > Add user
 *    - Or use Firebase Auth SDK to create a user programmatically
 * 
 * 2. Get an ID token:
 *    - Using Firebase Client SDK (Web, Android, iOS):
 *      ```javascript
 *      // Web example
 *      firebase.auth().signInWithEmailAndPassword(email, password)
 *        .then((userCredential) => {
 *          return userCredential.user.getIdToken();
 *        })
 *        .then((token) => {
 *          console.log('ID Token:', token);
 *        });
 *      ```
 * 
 * 3. Call the function with the token in the Authorization header:
 *    ```bash
 *    curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
 *      https://us-central1-api-for-warp-drive.cloudfunctions.net/helloWorld
 *    ```
 * 
 * 4. For testing with Postman:
 *    - Add a header with key "Authorization" and value "Bearer YOUR_ID_TOKEN"
 * 
 * 5. Without a valid token, you'll receive a 403 Forbidden error
 */
exports.helloWorld = functions.https.onRequest({
  region: "us-central1",
}, async (req, res) => {
  try {
    // Check if the Authorization header is provided
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      console.error('No Firebase ID token was provided');
      res.status(403).send('Unauthorized - Missing token');
      return;
    }

    // Extract the token from the Authorization header
    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
      
      // If we get here, the token is valid
      res.send(`Hello, authenticated user ${decodedToken.email || decodedToken.uid}!`);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      res.status(403).send('Unauthorized - Invalid token');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});
