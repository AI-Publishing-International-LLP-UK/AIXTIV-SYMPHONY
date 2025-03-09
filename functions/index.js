const { onRequest, onCall } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const path = require('path');

// Set global configuration options for all functions
setGlobalOptions({ region: 'us-west1' });

// Import user preferences module
const userPreferences = require('./config/user-preferences');

// Import i18n configuration
const { i18n, __, translate } = require('./config/i18n-config');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Using v1 functions with region specified during deployment

// Language mapping for simplified codes to regional variants
const languageMap = {
  // English variants
  'en': 'en-US',
  'english': 'en-US',
  
  // Indian languages
  'hi': 'hi-IN',
  'hindi': 'hi-IN',
  'bn': 'bn-IN',
  'bengali': 'bn-IN',
  'ta': 'ta-IN',
  'tamil': 'ta-IN',
  'te': 'te-IN',
  'telugu': 'te-IN',
  'mr': 'mr-IN',
  'marathi': 'mr-IN',
  'gu': 'gu-IN',
  'gujarati': 'gu-IN',
  'kn': 'kn-IN',
  'kannada': 'kn-IN',
  'ml': 'ml-IN',
  'malayalam': 'ml-IN',
  'pa': 'pa-IN',
  'punjabi': 'pa-IN',
  'ur': 'ur-IN',
  'urdu': 'ur-IN',
  
  // Spanish variants
  'es': 'es-ES',
  'spanish': 'es-ES',
  
  // French variants
  'fr': 'fr-FR',
  'french': 'fr-FR',
  
  // Other major languages
  'de': 'de-DE',
  'german': 'de-DE',
  'zh': 'zh-CN',
  'chinese': 'zh-CN',
  'ja': 'ja-JP',
  'japanese': 'ja-JP',
  'ru': 'ru-RU',
  'russian': 'ru-RU',
  'ar': 'ar-SA',
  'arabic': 'ar-SA',
  'pt': 'pt-BR',
  'portuguese': 'pt-BR'
};

// Language fallback chain - if specific variant isn't available
const fallbackChain = {
  // English fallbacks
  'en-GB': 'en-US',
  'en-CA': 'en-US',
  'en-AU': 'en-US',
  'en-NZ': 'en-US',
  'en-ZA': 'en-US',
  'en-IE': 'en-US',
  'en-IN': 'en-US',
  
  // Spanish fallbacks
  'es-MX': 'es-ES',
  'es-AR': 'es-ES',
  'es-CO': 'es-ES',
  'es-CL': 'es-ES',
  
  // Indian language fallbacks
  'ta-LK': 'ta-IN',
  'bn-BD': 'bn-IN',
};

/**
 * Maps a user language preference to an appropriate locale code
 * @param {string} userLanguage - The language specified by the user
 * @return {string} - The mapped locale code for i18n
 */
function mapLanguageToLocale(userLanguage) {
  if (!userLanguage) return 'en-US';
  
  // Convert to lowercase for case-insensitive matching
  const lang = userLanguage.toLowerCase();
  
  // If it's already a full locale code like 'en-US', return it
  if (/^[a-z]{2}-[A-Z]{2}$/.test(userLanguage)) {
    return userLanguage;
  }
  
  // Check if we have a mapping for this language
  if (languageMap[lang]) {
    return languageMap[lang];
  }
  
  // Try to extract language part if user provided something like 'en-US'
  const langPart = lang.split('-')[0];
  if (languageMap[langPart]) {
    return languageMap[langPart];
  }
  
  // Default to English if no mapping found
  return 'en-US';
}

/**
 * Get the best locale to use based on user preference and available translations
 * @param {string} userLanguage - The language specified by the user
 * @return {string} - The best locale to use
 */
function getBestLocale(userLanguage) {
  const mappedLocale = mapLanguageToLocale(userLanguage);
  
  // Check if this locale is available
  if (i18n.getLocales().includes(mappedLocale)) {
    return mappedLocale;
  }
  
  // Try fallback if available
  if (fallbackChain[mappedLocale] && 
      i18n.getLocales().includes(fallbackChain[mappedLocale])) {
    return fallbackChain[mappedLocale];
  }
  
  // Extract language part and try to find any variant
  const langPart = mappedLocale.split('-')[0];
  const anyVariant = i18n.getLocales().find(locale => 
    locale.startsWith(`${langPart}-`));
  
  if (anyVariant) {
    return anyVariant;
  }
  
  // Default to English-US if all else fails
  return 'en-US';
}

/**
 * HTTP Cloud Function that requires Firebase Authentication
 * This function verifies the Firebase ID token provided in the Authorization header
 * and returns a personalized response for authenticated users.
 * 
 * To test this function:
 * 1. Get a Firebase ID token from an authenticated user
 *    - In a web app: firebase.auth().currentUser.getIdToken()
 *    - In a mobile app: Use the respective Firebase Auth SDK
 * 
 * 2. Call the function with the token:
    curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
         https://us-west1-api-for-warp-drive.cloudfunctions.net/helloWorld
 */
exports.helloWorld = onRequest(async (request, response) => {
  // Set CORS headers for preflight requests
  response.set('Access-Control-Allow-Origin', '*');
  
  if (request.method === 'OPTIONS') {
    // Handle preflight requests
    response.set('Access-Control-Allow-Methods', 'GET');
    response.set('Access-Control-Allow-Headers', 'Authorization');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
    return;
  }
  
  // Check if the request has an authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    response.status(401).send('Unauthorized: No Firebase ID token was provided');
    return;
  }

  // Extract the token from the Authorization header
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user information from the decoded token
    const uid = decodedToken.uid;
    const email = decodedToken.email || 'user';
    
    // Get user's language preference
    const userPrefs = await userPreferences.getUserPreferences(uid);
    const userLang = userPrefs.language || 'en-US';
    
    // Get the best locale based on user preference
    const bestLocale = getBestLocale(userLang);
    
    // Set the locale based on mapped preference
    i18n.setLocale(bestLocale);
    
    // Return a personalized greeting with the user's information in their preferred language
    const greeting = __('greeting', { email: email, uid: uid });
    response.send(greeting);
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    response.status(401).send(`Unauthorized: ${error.message}`);
  }
});

/**
 * HTTP Cloud Function that requires Firebase Authentication (v1 version)
 * This function verifies the Firebase ID token provided in the Authorization header
 * and returns a personalized response for authenticated users.
 * 
 * To test this function:
 * 1. Get a Firebase ID token from an authenticated user
 *    - In a web app: firebase.auth().currentUser.getIdToken()
 *    - In a mobile app: Use the respective Firebase Auth SDK
 * 
 * 2. Call the function with the token:
   curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
        https://us-west1-api-for-warp-drive.cloudfunctions.net/helloWorldV1
 */
exports.helloWorldV1 = functions.https.onRequest(async (request, response) => {
  // Set CORS headers for preflight requests
  response.set('Access-Control-Allow-Origin', '*');
  
  if (request.method === 'OPTIONS') {
    // Handle preflight requests
    response.set('Access-Control-Allow-Methods', 'GET');
    response.set('Access-Control-Allow-Headers', 'Authorization');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
    return;
  }
  
  // Check if the request has an authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    response.status(401).send('Unauthorized: No Firebase ID token was provided');
    return;
  }

  // Extract the token from the Authorization header
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user information from the decoded token
    const uid = decodedToken.uid;
    const email = decodedToken.email || 'user';
    
    // Get user's language preference
    const userPrefs = await userPreferences.getUserPreferences(uid);
    const userLang = userPrefs.language || 'en-US';
    
    // Get the best locale based on user preference
    const bestLocale = getBestLocale(userLang);
    
    // Set the locale based on mapped preference
    i18n.setLocale(bestLocale);
    
    // Return a personalized greeting with the user's information in their preferred language
    const greeting = __('greeting', { email: email, uid: uid });
    response.send(greeting);
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    response.status(401).send(`Unauthorized: ${error.message}`);
  }
});

/**
 * HTTP Cloud Function that allows users to update their preferences
 * This function requires Firebase Authentication and allows users to update their
 * language preference, theme, and notification settings.
 * 
 * To test this function:
 * curl -X POST -H "Authorization: Bearer YOUR_ID_TOKEN" \
 *      -H "Content-Type: application/json" \
      -d '{"language":"es","theme":"dark","notificationsEnabled":true}' \
      https://us-west1-api-for-warp-drive.cloudfunctions.net/updateUserPreferences
 */
exports.updateUserPreferences = onRequest(async (request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  
  if (request.method === 'OPTIONS') {
    // Handle preflight requests
    response.set('Access-Control-Allow-Methods', 'POST');
    response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
    return;
  }
  
  // Only accept POST requests for updating preferences
  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed: Only POST requests are accepted');
    return;
  }
  
  // Check if the request has an authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    response.status(401).send('Unauthorized: No Firebase ID token was provided');
    return;
  }

  // Extract the token from the Authorization header
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get the preferences data from the request body
    const preferences = request.body;
    
    // Validate preferences data
    if (!preferences || typeof preferences !== 'object') {
      response.status(400).send('Bad Request: Invalid preferences data');
      return;
    }
    
    // Map language preference if provided
    if (preferences.language) {
      preferences.language = mapLanguageToLocale(preferences.language);
    }
    
    // Update user preferences in Firestore
    await userPreferences.setUserPreferences(uid, preferences);
    
    // Get updated user preferences
    const updatedPrefs = await userPreferences.getUserPreferences(uid);
    
    // Map user language preference to appropriate locale
    const bestLocale = getBestLocale(updatedPrefs.language || 'en-US');
    
    // Set locale based on mapped preference
    i18n.setLocale(bestLocale);
    
    // Return success message in the user's preferred language
    response.status(200).send({
      message: __('preferences.updateSuccess'),
      preferences: updatedPrefs
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    response.status(500).send(`Error: ${error.message}`);
  }
});

/**
 * HTTP Cloud Function that allows users to update their preferences (v1 version)
 * This function requires Firebase Authentication and allows users to update their
 * language preference, theme, and notification settings.
 * 
 * To test this function:
 * curl -X POST -H "Authorization: Bearer YOUR_ID_TOKEN" \
 *      -H "Content-Type: application/json" \
 *      -d '{"language":"es","theme":"dark","notificationsEnabled":true}' \
 *      https://us-west1-api-for-warp-drive.cloudfunctions.net/updateUserPreferencesV1
 */
exports.updateUserPreferencesV1 = functions.https.onRequest(async (request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  
  if (request.method === 'OPTIONS') {
    // Handle preflight requests
    response.set('Access-Control-Allow-Methods', 'POST');
    response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
    return;
  }
  
  // Only accept POST requests for updating preferences
  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed: Only POST requests are accepted');
    return;
  }
  
  // Check if the request has an authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    response.status(401).send('Unauthorized: No Firebase ID token was provided');
    return;
  }

  // Extract the token from the Authorization header
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get the preferences data from the request body
    const preferences = request.body;
    
    // Validate preferences data
    if (!preferences || typeof preferences !== 'object') {
      response.status(400).send('Bad Request: Invalid preferences data');
      return;
    }
    
    // Map language preference if provided
    if (preferences.language) {
      preferences.language = mapLanguageToLocale(preferences.language);
    }
    
    // Update user preferences in Firestore
    await userPreferences.setUserPreferences(uid, preferences);
    
    // Get updated user preferences
    const updatedPrefs = await userPreferences.getUserPreferences(uid);
    
    // Map user language preference to appropriate locale
    const bestLocale = getBestLocale(updatedPrefs.language || 'en-US');
    
    // Set locale based on mapped preference
    i18n.setLocale(bestLocale);
    
    // Return success message in the user's preferred language
    response.status(200).send({
      message: __('preferences.updateSuccess'),
      preferences: updatedPrefs
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    response.status(500).send(`Error: ${error.message}`);
  }
});

/**
 * Callable Cloud Function that allows clients to retrieve user preferences
 * This function requires Firebase Authentication and returns the user's preferences.
 * 
 * To call this function:
 * - Web: firebase.functions().httpsCallable('getUserPreferencesCallable')();
 * - Mobile/Web (v9+): httpsCallable(functions, 'getUserPreferencesCallable')();
 */
exports.getUserPreferencesCallable = onCall((data, context) => {
  return userPreferences.getUserPreferencesHandler(data, context);
});

/**
 * Callable Cloud Function that allows clients to update user preferences
 * This function requires Firebase Authentication and allows users to update their preferences.
 * 
 * To call this function:
 * - Web: firebase.functions().httpsCallable('updateUserPreferencesCallable')({preferences: {...}});
 * - Mobile/Web (v9+): httpsCallable(functions, 'updateUserPreferencesCallable')({preferences: {...}});
 *
 * @param {Object} data - The data object containing preferences to update
 * @param {Object} data.preferences - The preferences object with properties to update
 */
exports.updateUserPreferencesCallable = onCall((data, context) => {
  return userPreferences.updateUserPreferencesHandler(data, context);
});

/**
 * Callable Cloud Function that allows clients to retrieve user preferences (v1 version)
 * This function requires Firebase Authentication and returns the user's preferences.
 * 
 * To call this function:
 * - Web: firebase.functions().httpsCallable('getUserPreferencesCallableV1')();
 * - Mobile/Web (v9+): httpsCallable(functions, 'getUserPreferencesCallableV1')();
 */
exports.getUserPreferencesCallableV1 = functions.https.onCall((data, context) => {
  return userPreferences.getUserPreferencesHandler(data, context);
});

/**
 * Callable Cloud Function that allows clients to update user preferences (v1 version)
 * This function requires Firebase Authentication and allows users to update their preferences.
 * 
 * To call this function:
 * - Web: firebase.functions().httpsCallable('updateUserPreferencesCallableV1')({preferences: {...}});
 * - Mobile/Web (v9+): httpsCallable(functions, 'updateUserPreferencesCallableV1')({preferences: {...}});
 *
 * @param {Object} data - The data object containing preferences to update
 * @param {Object} data.preferences - The preferences object with properties to update
 */
exports.updateUserPreferencesCallableV1 = functions.https.onCall((data, context) => {
  return userPreferences.updateUserPreferencesHandler(data, context);
});
