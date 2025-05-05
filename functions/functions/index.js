const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ttsService = require('./services/tts-service');
const sentimentService = require('./services/sentiment-service');

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
  region: "us-west1",
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

/**
 * Text-to-Speech API endpoint
 * 
 * This function converts text to speech using Google Cloud TTS API and Firebase Storage.
 * It is protected by Firebase Authentication and requires a valid ID token.
 * 
 * HOW TO USE THIS FUNCTION:
 * 
 * 1. Authenticate with Firebase Authentication to get an ID token
 * 
 * 2. Call the function with the token in the Authorization header:
 *    ```bash
 *    curl -X POST -H "Authorization: Bearer YOUR_ID_TOKEN" \
 *         -H "Content-Type: application/json" \
 *         -d '{"text": "Hello world", "voice": {"languageCode": "en-US", "ssmlGender": "FEMALE"}}' \
 *         https://us-central1-api-for-warp-drive.cloudfunctions.net/convertTextToSpeech
 *    ```
 * 
 * 3. The function returns a JSON response with the URL of the generated audio file:
 *    ```json
 *    {
 *      "success": true,
 *      "audioUrl": "https://storage.googleapis.com/bucket-name/tts/tts-1234567890.mp3",
 *      "fileName": "tts-1234567890.mp3",
 *      "filePath": "tts/tts-1234567890.mp3"
 *    }
 *    ```
 * 
 * Request Body Parameters:
 * - text: (string, required) The text to convert to speech
 * - voice: (object, optional) Voice configuration
 *   - languageCode: (string) Language code (e.g., 'en-US', 'fr-FR')
 *   - ssmlGender: (string) Voice gender ('MALE', 'FEMALE', 'NEUTRAL')
 *   - name: (string) Specific voice name (e.g., 'en-US-Neural2-F')
 * - audioConfig: (object, optional) Audio configuration
 *   - audioEncoding: (string) Output format ('MP3', 'WAV', 'OGG_OPUS')
 *   - pitch: (number) Voice pitch (-20.0 to 20.0)
 *   - speakingRate: (number) Speaking rate (0.25 to 4.0)
 * - storagePath: (string, optional) Custom storage path for the audio file
 */
exports.convertTextToSpeech = functions.https.onRequest({
  region: "us-west1",
}, async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Check if the Authorization header is provided
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      console.error('No Firebase ID token was provided');
      res.status(403).send({ error: 'Unauthorized - Missing token' });
      return;
    }

    // Extract the token from the Authorization header
    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
      
      // Check if text is provided in the request body
      const { text, voice, audioConfig, storagePath } = req.body;
      
      if (!text) {
        res.status(400).send({ error: 'Missing required parameter: text' });
        return;
      }
      
      // Call the TTS service
      const result = await ttsService.textToSpeech(text, { voice, audioConfig, storagePath });
      
      if (!result.success) {
        console.error('TTS conversion failed:', result.error);
        res.status(500).send({ error: 'Text-to-speech conversion failed', details: result.error });
        return;
      }
      
      // Return the successful result
      res.status(200).send(result);
      
    } catch (error) {
      console.error('Error verifying ID token:', error);
      res.status(403).send({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

/**
 * SSML-to-Speech API endpoint
 * 
 * This function converts SSML markup to speech using Google Cloud TTS API and Firebase Storage.
 * It is protected by Firebase Authentication and requires a valid ID token.
 * 
 * HOW TO USE THIS FUNCTION:
 * 
 * 1. Authenticate with Firebase Authentication to get an ID token
 * 
 * 2. Call the function with the token in the Authorization header:
 *    ```bash
 *    curl -X POST -H "Authorization: Bearer YOUR_ID_TOKEN" \
 *         -H "Content-Type: application/json" \
 *         -d '{"ssml": "<speak>Hello <emphasis level=\"strong\">world</emphasis></speak>"}' \
 *         https://us-central1-api-for-warp-drive.cloudfunctions.net/convertSsmlToSpeech
 *    ```
 * 
 * Request Body Parameters:
 * - ssml: (string, required) The SSML markup to convert to speech
 * - voice: (object, optional) Voice configuration
 * - audioConfig: (object, optional) Audio configuration
 * - storagePath: (string, optional) Custom storage path for the audio file
 */
exports.convertSsmlToSpeech = functions.https.onRequest({
  region: "us-west1",
}, async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Check if the Authorization header is provided
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      console.error('No Firebase ID token was provided');
      res.status(403).send({ error: 'Unauthorized - Missing token' });
      return;
    }

    // Extract the token from the Authorization header
    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
      
      // Check if ssml is provided in the request body
      const { ssml, voice, audioConfig, storagePath } = req.body;
      
      if (!ssml) {
        res.status(400).send({ error: 'Missing required parameter: ssml' });
        return;
      }
      
      // Call the TTS service
      const result = await ttsService.ssmlToSpeech(ssml, { voice, audioConfig, storagePath });
      
      if (!result.success) {
        console.error('SSML conversion failed:', result.error);
        res.status(500).send({ error: 'SSML-to-speech conversion failed', details: result.error });
        return;
      }
      
      // Return the successful result
      res.status(200).send(result);
      
    } catch (error) {
      console.error('Error verifying ID token:', error);
      res.status(403).send({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

/**
 * List Available TTS Voices API endpoint
 * 
 * This function returns a list of available voices for Text-to-Speech conversion.
 * This is a public API endpoint that does not require authentication.
 * 
 * HOW TO USE THIS FUNCTION:
 * 
 * Call the function directly:
 *    ```bash
 *    curl -X GET https://us-central1-api-for-warp-drive.cloudfunctions.net/listTtsVoices?languageCode=en-US
 *    ```
 * 
 * 3. The function returns a JSON response with the list of available voices:
 *    ```json
 *    {
 *      "success": true,
 *      "voices": [
 *        {
 *          "name": "en-US-Neural2-F",
 *          "ssmlGender": "FEMALE",
 *          "languageCodes": ["en-US"],
 *          "naturalSampleRateHertz": 24000
 *        },
 *        ...
 *      ]
 *    }
 *    ```
 * 
 * Query Parameters:
 * - languageCode: (string, optional) Filter voices by language code (default: 'en-US')
 */
exports.listTtsVoices = functions.https.onRequest({
  region: "us-west1",
}, async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }
  try {
    // Get language code from query parameters (default to 'en-US')
    const languageCode = req.query.languageCode || 'en-US';
    
    // Call the TTS service
    const result = await ttsService.listVoices(languageCode);
    
    if (!result.success) {
      console.error('List voices failed:', result.error);
      res.status(500).send({ error: 'Failed to list TTS voices', details: result.error });
      return;
    }
    
    // Return the successful result
    res.status(200).send(result);
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

/**
 * Sentiment Analysis API endpoint
 * 
 * This function analyzes the sentiment of the provided text using Google Cloud Natural Language API.
 * It is protected by Firebase Authentication and requires a valid ID token.
 * 
 * HOW TO USE THIS FUNCTION:
 * 
 * 1. Authenticate with Firebase Authentication to get an ID token
 * 
 * 2. Call the function with the token in the Authorization header:
 *    ```bash
 *    curl -X POST -H "Authorization: Bearer YOUR_ID_TOKEN" \
 *         -H "Content-Type: application/json" \
 *         -d '{"text": "I really enjoyed this product, it works great!"}' \
 *         https://us-west1-api-for-warp-drive.cloudfunctions.net/analyzeSentiment
 *    ```
 * 
 * 3. The function returns a JSON response with sentiment analysis results:
 *    ```json
 *    {
 *      "score": 0.8,
 *      "magnitude": 0.9,
 *      "sentences": [
 *        {
 *          "text": "I really enjoyed this product, it works great!",
 *          "score": 0.8,
 *          "magnitude": 0.9
 *        }
 *      ]
 *    }
 *    ```
 * 
 * Request Body Parameters:
 * - text: (string, required) The text to analyze for sentiment
 */
exports.analyzeSentiment = functions.https.onRequest({
  region: "us-west1",
}, async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Check if the Authorization header is provided
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      console.error('No Firebase ID token was provided');
      res.status(403).send({ error: 'Unauthorized - Missing token' });
      return;
    }

    // Extract the token from the Authorization header
    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
      
      // Check if text is provided in the request body
      const { text } = req.body;
      
      if (!text) {
        res.status(400).send({ error: 'Missing required parameter: text' });
        return;
      }
      
      // Call the sentiment analysis service
      const result = await sentimentService.analyzeSentiment(text);
      
      // Return the successful result
      res.status(200).send(result);
      
    } catch (error) {
      console.error('Error verifying ID token or analyzing sentiment:', error);
      res.status(error.code === 'auth/argument-error' ? 403 : 500).send({ 
        error: error.code === 'auth/argument-error' ? 'Unauthorized - Invalid token' : 'Sentiment analysis failed',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

/**
 * Entity Analysis API endpoint
 * 
 * This function analyzes entities in the provided text using Google Cloud Natural Language API.
 * It is protected by Firebase Authentication and requires a valid ID token.
 * 
 * HOW TO USE THIS FUNCTION:
 * 
 * 1. Authenticate with Firebase Authentication to get an ID token
 * 
 * 2. Call the function with the token in the Authorization header:
 *    ```bash
 *    curl -X POST -H "Authorization: Bearer YOUR_ID_TOKEN" \
 *         -H "Content-Type: application/json" \
 *         -d '{"text": "Google has its headquarters in Mountain View, California."}' \
 *         https://us-west1-api-for-warp-drive.cloudfunctions.net/analyzeEntities
 *    ```
 * 
 * 3. The function returns a JSON response with entity analysis results
 * 
 * Request Body Parameters:
 * - text: (string, required) The text to analyze for entities
 */
exports.analyzeEntities = functions.https.onRequest({
  region: "us-west1",
}, async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Check if the Authorization header is provided
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      console.error('No Firebase ID token was provided');
      res.status(403).send({ error: 'Unauthorized - Missing token' });
      return;
    }

    // Extract the token from the Authorization header
    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
      
      // Check if text is provided in the request body
      const { text } = req.body;
      
      if (!text) {
        res.status(400).send({ error: 'Missing required parameter: text' });
        return;
      }
      
      // Call the entity analysis service
      const result = await sentimentService.analyzeEntities(text);
      
      // Return the successful result
      res.status(200).send(result);
      
    } catch (error) {
      console.error('Error verifying ID token or analyzing entities:', error);
      res.status(error.code === 'auth/argument-error' ? 403 : 500).send({ 
        error: error.code === 'auth/argument-error' ? 'Unauthorized - Invalid token' : 'Entity analysis failed',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

/**
 * Comprehensive Text Analysis API endpoint
 * 
 * This function performs comprehensive text analysis (sentiment, entities, content classification)
 * using Google Cloud Natural Language API.
 * It is protected by Firebase Authentication and requires a valid ID token.
 * 
 * HOW TO USE THIS FUNCTION:
 * 
 * 1. Authenticate with Firebase Authentication to get an ID token
 * 
 * 2. Call the function with the token in the Authorization header:
 *    ```bash
 *    curl -X POST -H "Authorization: Bearer YOUR_ID_TOKEN" \
 *         -H "Content-Type: application/json" \
 *         -d '{"text": "Google is an amazing technology company with headquarters in Mountain View."}' \
 *         https://us-west1-api-for-warp-drive.cloudfunctions.net/analyzeText
 *    ```
 * 
 * 3. The function returns a JSON response with comprehensive analysis results
 * 
 * Request Body Parameters:
 * - text: (string, required) The text to analyze
 */
exports.analyzeText = functions.https.onRequest({
  region: "us-west1",
}, async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Check if the Authorization header is provided
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      console.error('No Firebase ID token was provided');
      res.status(403).send({ error: 'Unauthorized - Missing token' });
      return;
    }

    // Extract the token from the Authorization header
    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
      
      // Check if text is provided in the request body
      const { text } = req.body;
      
      if (!text) {
        res.status(400).send({ error: 'Missing required parameter: text' });
        return;
      }
      
      // Call the comprehensive text analysis service
      const result = await sentimentService.analyzeText(text);
      
      // Return the successful result
      res.status(200).send(result);
      
    } catch (error) {
      console.error('Error verifying ID token or analyzing text:', error);
      res.status(error.code === 'auth/argument-error' ? 403 : 500).send({ 
        error: error.code === 'auth/argument-error' ? 'Unauthorized - Invalid token' : 'Text analysis failed',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});
