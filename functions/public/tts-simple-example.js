// Import Firebase modules
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Your Firebase configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');

/**
 * Authenticates a user with Firebase Authentication
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<object>} - User object if authentication is successful
 */
// Export the function for use in other modules
export function authenticateUser(email, password) {
  return new Promise((resolve, reject) => {
    // Check if user is already signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('User already authenticated:', currentUser.uid);
      resolve(currentUser);
      return;
    }

    // Sign in with email and password
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        console.log('Authentication successful:', userCredential.user.uid);
        resolve(userCredential.user);
      })
      .catch(error => {
        console.error('Authentication failed:', error.message);
        reject(error);
      });
  });
}

/**
 * Gets available TTS voices from Firebase function
 * @param {string} languageCode - Optional language code to filter voices
 * @returns {Promise<Array>} - Array of available voices
 */
// Export the function for use in other modules
export function getAvailableVoices(languageCode = null) {
  const getTtsVoices = httpsCallable(functions, 'getTtsVoices');

  // Prepare parameters
  const params = {};
  if (languageCode) {
    params.languageCode = languageCode;
  }

  return getTtsVoices(params)
    .then(result => {
      const voices = result.data.voices;
      console.log(`Retrieved ${voices.length} voices`);
      return voices;
    })
    .catch(error => {
      console.error('Error getting voices:', error);
      throw error;
    });
}

/**
 * Converts text to speech using Firebase function
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (must be a valid voice name)
 * @param {string} languageCode - Optional language code
 * @returns {Promise<string>} - Base64 encoded audio data
 */
// Export the function for use in other modules
export function convertTextToSpeech(text, voice, languageCode = 'en-US') {
  const textToSpeech = httpsCallable(functions, 'textToSpeech');

  return textToSpeech({
    text: text,
    voice: voice,
    languageCode: languageCode,
  })
    .then(result => {
      console.log('Text-to-speech conversion successful');
      return result.data.audioContent;
    })
    .catch(error => {
      console.error('Text-to-speech conversion failed:', error);
      throw error;
    });
}

/**
 * Plays audio from base64 encoded string
 * @param {string} base64Audio - Base64 encoded audio data
 * @returns {Promise<void>} - Resolves when audio playback starts
 */
// Export the function for use in other modules
export function playAudio(base64Audio) {
  return new Promise((resolve, reject) => {
    try {
      // Convert base64 to binary
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create audio blob and audio element
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Add event listeners
      audio.addEventListener('play', () => {
        console.log('Audio playback started');
        resolve();
      });

      audio.addEventListener('ended', () => {
        console.log('Audio playback completed');
        URL.revokeObjectURL(audioUrl); // Clean up
      });

      audio.addEventListener('error', error => {
        console.error('Audio playback error:', error);
        URL.revokeObjectURL(audioUrl); // Clean up
        reject(error);
      });

      // Start playback
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      reject(error);
    }
  });
}

// Usage example - commented out so it doesn't run automatically when imported
/*
// First authenticate a user
authenticateUser("user@example.com", "password")
  .then(user => {
    // Get available voices
    return getAvailableVoices("en-US");
  })
  .then(voices => {
    console.log("Available voices:", voices);
    
    // Convert text to speech using a selected voice
    return convertTextToSpeech(
      "Hello, this is a test of the Firebase Text-to-Speech service.", 
      "en-US-Wavenet-F"
    );
  })
  .then(audioContent => {
    // Play the audio
    return playAudio(audioContent);
  })
  .catch(error => {
    console.error("Error:", error);
  });
*/

// Alternative: Listen for auth state changes
// Auth state listener - commented out so it doesn't run automatically when imported
/*
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.uid);
    // You can start TTS operations here if needed
  } else {
    console.log("User is signed out");
  }
});
*/
