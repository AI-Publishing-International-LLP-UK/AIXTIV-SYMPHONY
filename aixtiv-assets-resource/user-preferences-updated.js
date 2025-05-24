// File: functions/config/user-preferences.js
const admin = require('firebase-admin');

// Don't initialize Firebase Admin here, it's done in index.js

// Export handler functions for the new v2 syntax
exports.getUserPreferencesHandler = async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new Error(
      'Unauthenticated. You must be logged in to access user preferences.'
    );
  }

  const uid = context.auth.uid;

  try {
    const userDoc = await admin
      .firestore()
      .collection('userPreferences')
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      // Return default preferences if document doesn't exist
      return { theme: 'light', notifications: true };
    }

    return userDoc.data();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw new Error('Failed to retrieve user preferences');
  }
};

exports.updateUserPreferencesHandler = async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new Error(
      'Unauthenticated. You must be logged in to update user preferences.'
    );
  }

  const uid = context.auth.uid;
  const { preferences } = data;

  if (!preferences || typeof preferences !== 'object') {
    throw new Error(
      'Invalid argument. You must provide valid preferences to update.'
    );
  }

  try {
    await admin
      .firestore()
      .collection('userPreferences')
      .doc(uid)
      .set(preferences, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new Error('Failed to update user preferences');
  }
};
