const i18n = require('i18n');
const path = require('path');

// Configure internationalization
i18n.configure({
  // Path to locale files
  directory: path.join(__dirname, 'locales'),

  // List of supported locales
  // Major world languages
  locales: [
    // English variants
    'en-US',
    'en-GB',
    'en-AU',
    'en-CA',
    'en-NZ',
    'en-ZA',

    // Spanish variants
    'es-ES',
    'es-MX',
    'es-AR',
    'es-CO',
    'es-CL',

    // Indian languages
    'hi-IN', // Hindi
    'bn-IN', // Bengali
    'te-IN', // Telugu
    'ta-IN', // Tamil
    'mr-IN', // Marathi
    'gu-IN', // Gujarati
    'kn-IN', // Kannada
    'ml-IN', // Malayalam
    'pa-IN', // Punjabi
    'or-IN', // Odia
    'as-IN', // Assamese
    'ur-IN', // Urdu

    // Other major world languages
    'zh-CN', // Chinese (Simplified)
    'zh-TW', // Chinese (Traditional)
    'fr-FR', // French
    'de-DE', // German
    'pt-BR', // Portuguese (Brazil)
    'pt-PT', // Portuguese (Portugal)
    'ru-RU', // Russian
    'ja-JP', // Japanese
    'ko-KR', // Korean
    'ar-SA', // Arabic
    'tr-TR', // Turkish
    'it-IT', // Italian
    'nl-NL', // Dutch
    'pl-PL', // Polish
    'th-TH', // Thai
    'vi-VN', // Vietnamese
  ],

  // Default locale (fallback)
  defaultLocale: 'en-US',

  // Cookie name for storing user's preferred locale
  cookie: 'locale',

  // Auto-reload locale files if changed
  autoReload: true,

  // Update files with missing translations
  updateFiles: false,

  // Sync locale information across all files
  syncFiles: false,

  // Mark missing translations
  missingKeyFn: function (locale, value) {
    return `[MISSING TRANSLATION: ${locale}][${value}]`;
  },

  // Use . notation for nested objects
  objectNotation: true,

  // Use JSON file format
  extension: '.json',

  // Log debug information about missing translations
  logDebugFn: function (msg) {
    console.log('i18n::debug:', msg);
  },

  // Log warnings about missing translations
  logWarnFn: function (msg) {
    console.log('i18n::warn:', msg);
  },

  // Log errors
  logErrorFn: function (msg) {
    console.log('i18n::error:', msg);
  },
});

/**
 * Helper function to get language from user preferences or fallback to browser
 * @param {Object} userPrefs - User preferences object
 * @param {string} browserLang - Browser language string
 * @returns {string} - The best matching locale
 */
function determineLocale(userPrefs, browserLang = 'en-US') {
  // If user has explicit language preference, use it
  if (userPrefs && userPrefs.language) {
    // Check if user preference is directly supported
    if (i18n.getLocales().includes(userPrefs.language)) {
      return userPrefs.language;
    }

    // Check if we support a variant of the language
    const langPrefix = userPrefs.language.split('-')[0];
    const matchedLocale = i18n
      .getLocales()
      .find(locale => locale.startsWith(langPrefix + '-'));

    if (matchedLocale) {
      return matchedLocale;
    }
  }

  // Fallback to browser language if supported
  if (browserLang && i18n.getLocales().includes(browserLang)) {
    return browserLang;
  }

  const browserLangPrefix = browserLang ? browserLang.split('-')[0] : 'en';
  const matchedBrowserLocale = i18n
    .getLocales()
    .find(locale => locale.startsWith(browserLangPrefix + '-'));

  if (matchedBrowserLocale) {
    return matchedBrowserLocale;
  }

  // Ultimate fallback
  return i18n.getLocale();
}

/**
 * Translates text based on user preferences
 * @param {string} phrase - The phrase to translate
 * @param {Object} options - Translation options and variables
 * @param {Object} userPrefs - User preference object
 * @param {string} browserLang - Browser language
 * @returns {string} - Translated text
 */
function translate(
  phrase,
  options = {},
  userPrefs = null,
  browserLang = 'en-US'
) {
  const locale = determineLocale(userPrefs, browserLang);
  return i18n.__({ phrase, locale, ...options });
}

// Export the configured i18n instance and helper functions
module.exports = {
  i18n,
  determineLocale,
  translate,
  // Allow direct access to i18n methods
  __: i18n.__,
  __n: i18n.__n,
  getLocale: i18n.getLocale,
  getLocales: i18n.getLocales,
  setLocale: i18n.setLocale,
};
