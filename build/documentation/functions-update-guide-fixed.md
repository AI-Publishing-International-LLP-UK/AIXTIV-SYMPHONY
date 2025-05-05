# Firebase Functions v2 Migration Guide

## The Error Explained
The error `TypeError: functions.region is not a function` occurs because you're using Firebase Functions v4+ with code that was written for an older version of the SDK. The Firebase Functions v2 API (in the newer packages) has a different syntax for regional functions and HTTP triggers.

## How to Fix It

### Step 1: Update package.json
Make sure your package.json has:
```json
"engines": {
  "node": "20"
},
"dependencies": {
  "firebase-admin": "^11.0.0",
  "firebase-functions": "^4.0.0"
  // other dependencies...
}
```

### Step 2: Update your index.js
Replace your current index.js with the updated version in the artifact. Key changes:
- Import from \'firebase-functions/v2/https\' instead of \'firebase-functions\'
- Use `onCall` instead of `functions.https.onCall`
- Use `setGlobalOptions` for region settings

### Step 3: Update user-preferences.js
Update your user-preferences.js to export handler functions that work with v2 syntax.

### Step 4: Additional Updates

If you're using other Firebase Functions features, you'll need to update those imports too:

**Old (v1) syntax:**
```javascript
const functions = require('firebase-functions');
exports.myFunction = functions.region(\'us-central1\').https.onCall((data, context) => {...});
```

**New (v2) syntax:**
```javascript
const { onCall } = require('firebase-functions/v2/https');
exports.myFunction = onCall({region: \'us-central1\'}, (data, context) => {...});
```

Or with global options:
```javascript
const { onCall } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

setGlobalOptions({region: \'us-central1\'});
exports.myFunction = onCall((data, context) => {...});
```

## Common v2 Imports

- HTTP functions: `require('firebase-functions/v2/https')`
- Firestore triggers: `require('firebase-functions/v2/firestore')`
- Auth triggers: `require('firebase-functions/v2/auth')`
- Storage triggers: `require('firebase-functions/v2/storage')`
- Pub/Sub triggers: `require('firebase-functions/v2/pubsub')`
- Scheduled functions: `require('firebase-functions/v2/scheduler')`

## Error Handling
In v2, you throw regular Error objects instead of the specialized HttpsError:

**Old (v1):**
```javascript
throw new functions.https.HttpsError(\'invalid-argument\', \'Message\');
```

**New (v2):**
```javascript
throw new Error(\'Message\'); // Error code is determined from the type of error
```

## Learn More
For complete documentation on Firebase Functions v2, see:
https://firebase.google.com/docs/functions/beta/get-started

