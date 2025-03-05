/**
 * User Preferences Module
 * Provides functions for storing, retrieving, and updating user preferences in Firestore
 */
const admin = require('firebase-admin');
const db = admin.firestore();

// Collection name for user preferences
const PREFERENCES_COLLECTION = 'userPreferences';

// Supported language codes with region/country designations
const SUPPORTED_LANGUAGES = [
  'en-US',    // English (United States)
  'es-ES',    // Spanish (Spain)
  'fr-FR',    // French (France)
  'de-DE',    // German (Germany)
  'it-IT',    // Italian (Italy)
  'pt-BR',    // Portuguese (Brazil)
  'ru-RU',    // Russian (Russia)
  'zh-CN',    // Chinese (Simplified, China)
  'ja-JP',    // Japanese (Japan)
  'ko-KR',    // Korean (Korea)
  'ar-SA',    // Arabic (Saudi Arabia)
  'hi-IN',    // Hindi (India)
  'bn-IN',    // Bengali (India)
  'ta-IN',    // Tamil (India)
  'te-IN',    // Telugu (India)
  'mr-IN',    // Marathi (India)
  'gu-IN',    // Gujarati (India)
  'kn-IN',    // Kannada (India)
  'ml-IN',    // Malayalam (India)
  'pa-IN',    // Punjabi (India)
  'ur-IN',    // Urdu (India)
  'nl-NL',    // Dutch (Netherlands)
  'pl-PL',    // Polish (Poland)
  'tr-TR',    // Turkish (Turkey)
  'sv-SE',    // Swedish (Sweden)
  'no-NO',    // Norwegian (Norway)
  'fi-FI',    // Finnish (Finland)
  'da-DK',    // Danish (Denmark)
  'cs-CZ',    // Czech (Czech Republic)
  'el-GR',    // Greek (Greece)
  'hu-HU',    // Hungarian (Hungary)
  'ro-RO',    // Romanian (Romania)
  'th-TH',    // Thai (Thailand)
  'vi-VN',    // Vietnamese (Vietnam)
  'id-ID',    // Indonesian (Indonesia)
  'ms-MY',    // Malay (Malaysia)
  'uk-UA',    // Ukrainian (Ukraine)
  'he-IL',    // Hebrew (Israel)
  'fa-IR',    // Persian (Iran)
];

// Default language to use when user preference is not set
const DEFAULT_LANGUAGE = 'en-US';

/**
 * Map legacy language codes (e.g., 'en') to new format (e.g., 'en-US')
 * This provides backward compatibility for existing user preferences
 * 
 * @param {string} languageCode - The language code to normalize
 * @returns {string} - The normalized language code
 */
function normalizeLanguageCode(languageCode) {
  // If already in correct format (contains hyphen), return as is if supported
  if (languageCode.includes('-')) {
    return SUPPORTED_LANGUAGES.includes(languageCode) ? languageCode : DEFAULT_LANGUAGE;
  }
  
  // Map common short codes to their full versions
  const shortCodeMap = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'ar': 'ar-SA',
    'hi': 'hi-IN',
    'bn': 'bn-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'mr': 'mr-IN',
    'gu': 'gu-IN',
    'kn': 'kn-IN',
    'ml': 'ml-IN',
    'pa': 'pa-IN',
    'ur': 'ur-IN',
  };
  
  return shortCodeMap[languageCode] || DEFAULT_LANGUAGE;
}

/**
 * Get all preferences for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Object>} - A promise that resolves to the user's preferences
 */
async function getUserPreferences(userId) {
  try {
    const docRef = db.collection(PREFERENCES_COLLECTION).doc(userId);
    const doc = await docRef.get();

    if (doc.exists) {
      return doc.data();
    } else {
      // Return default preferences if none exist
      // Return default preferences if none exist
      return {
        language: DEFAULT_LANGUAGE,
        theme: 'light',
        notifications: {
          push: true,
          sms: false
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
    }
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
}

/**
 * Set all preferences for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @param {Object} preferences - The preferences object to save
 * @returns {Promise<void>} - A promise that resolves when preferences are saved
 */
async function setUserPreferences(userId, preferences) {
  try {
    const docRef = db.collection(PREFERENCES_COLLECTION).doc(userId);
    
    // Add updatedAt timestamp
    preferences.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await docRef.set(preferences, { merge: true });
    return true;
  } catch (error) {
    console.error('Error setting user preferences:', error);
    throw error;
  }
}

/**
 * Get the language preference for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<string>} - A promise that resolves to the user's language preference
 */
async function getLanguagePreference(userId) {
  try {
    const preferences = await getUserPreferences(userId);
    const userLanguage = preferences.language || DEFAULT_LANGUAGE;
    // Normalize language code to ensure it's in the correct format
    return normalizeLanguageCode(userLanguage);
  } catch (error) {
    console.error('Error getting language preference:', error);
    throw error;
  }
}

/**
 * Set the language preference for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @param {string} language - The language code in format 'language-COUNTRY' (e.g., 'en-US', 'hi-IN')
 * @returns {Promise<boolean>} - A promise that resolves to true if successful
 */
async function setLanguagePreference(userId, language) {
  try {
    // Normalize the language code to ensure it's in the correct format
    const normalizedLanguage = normalizeLanguageCode(language);
    
    const docRef = db.collection(PREFERENCES_COLLECTION).doc(userId);
    await docRef.set({
      language: normalizedLanguage,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error setting language preference:', error);
    throw error;
  }
}

/**
 * Get the theme preference for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<string>} - A promise that resolves to the user's theme preference
 */
async function getThemePreference(userId) {
  try {
    const preferences = await getUserPreferences(userId);
    return preferences.theme || 'light';
  } catch (error) {
    console.error('Error getting theme preference:', error);
    throw error;
  }
}

/**
 * Set the theme preference for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @param {string} theme - The theme name (e.g., 'light', 'dark')
 * @returns {Promise<boolean>} - A promise that resolves to true if successful
 */
async function setThemePreference(userId, theme) {
  try {
    const docRef = db.collection(PREFERENCES_COLLECTION).doc(userId);
    await docRef.set({
      theme,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error setting theme preference:', error);
    throw error;
  }
}

/**
 * Get notification settings for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Object>} - A promise that resolves to the user's notification settings
 */
async function getNotificationSettings(userId) {
  try {
    const preferences = await getUserPreferences(userId);
    return preferences.notifications || {
      email: true,
      push: true,
      sms: false
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
}

/**
 * Update notification settings for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @param {Object} settings - The notification settings object
 * @returns {Promise<boolean>} - A promise that resolves to true if successful
 */
async function updateNotificationSettings(userId, settings) {
  try {
    const docRef = db.collection(PREFERENCES_COLLECTION).doc(userId);
    await docRef.set({
      notifications: settings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}

/**
 * Toggle a specific notification channel for a user
 * 
 * @param {string} userId - The user's unique identifier
 * @param {string} channel - The notification channel (e.g., 'email', 'push', 'sms')
 * @param {boolean} enabled - Whether the channel should be enabled
 * @returns {Promise<boolean>} - A promise that resolves to true if successful
 */
async function toggleNotificationChannel(userId, channel, enabled) {
  try {
    const settings = await getNotificationSettings(userId);
    settings[channel] = enabled;
    
    return await updateNotificationSettings(userId, settings);
  } catch (error) {
    console.error(`Error toggling ${channel} notifications:`, error);
    throw error;
  }
}

module.exports = {
  getUserPreferences,
  setUserPreferences,
  getLanguagePreference,
  setLanguagePreference,
  getThemePreference,
  setThemePreference,
  getNotificationSettings,
  updateNotificationSettings,
  toggleNotificationChannel
};

