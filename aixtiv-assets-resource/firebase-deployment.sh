#!/bin/bash
# Quick Firebase Deployment Script for AIXTIV SYMPHONY

echo "=== AIXTIV SYMPHONY Firebase Deployment ==="
echo "Setting up Firebase deployment for your multi-component system"

# Create project directory if it doesn't exist
mkdir -p aixtiv-project
cd aixtiv-project

# Initialize Firebase if not already done
if [ ! -f "firebase.json" ]; then
  echo "Initializing Firebase..."
  firebase login
  firebase init
  
  # Select these options during initialization:
  # - Firestore
  # - Functions 
  # - Hosting
  # - Storage
  # - Emulators
fi

# Create firebase.json for multi-site hosting if it doesn't exist
if [ ! -f "firebase.json" ] || ! grep -q "\"hosting\":" "firebase.json"; then
  echo "Creating multi-site hosting configuration..."
  cat > firebase.json << 'EOL'
{
  "hosting": [
    {
      "target": "anthology",
      "public": "anthology/build",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "orchestrate",
      "public": "orchestrate/build",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "academy",
      "public": "academy/build",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "visualization",
      "public": "visualization/build",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
EOL
fi

# Create basic Firestore rules
if [ ! -f "firestore.rules" ]; then
  echo "Creating Firestore security rules..."
  cat > firestore.rules << 'EOL'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated access to user profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated access to campaigns
    match /campaigns/{campaignId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated access to domain content
    match /domainContent/{documentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow public read access to domain structure
    match /domainStructure/{documentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // More collection rules can be added here
  }
}
EOL
fi

# Create storage rules
if [ ! -f "storage.rules" ]; then
  echo "Creating Storage security rules..."
  cat > storage.rules << 'EOL'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
EOL
fi

# Create target directories if they don't exist
mkdir -p anthology/build orchestrate/build academy/build visualization/build

# Create placeholder index files if they don't exist
for dir in anthology orchestrate academy visualization; do
  if [ ! -f "$dir/build/index.html" ]; then
    echo "Creating placeholder for $dir..."
    mkdir -p $dir/build
    
    cat > $dir/build/index.html << EOL
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>AIXTIV SYMPHONY - ${dir^}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #1a202c;
        color: #e2e8f0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
      }
      .container {
        text-align: center;
        padding: 2rem;
        border-radius: 0.5rem;
        background-color: #2d3748;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        max-width: 80%;
      }
      h1 {
        color: #38b2ac;
        margin-bottom: 1rem;
      }
      p {
        margin-bottom: 2rem;
      }
      .logo {
        margin-bottom: 2rem;
        font-size: 2rem;
        color: #4fd1c5;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">AIXTIV SYMPHONY</div>
      <h1>${dir^} Platform</h1>
      <p>This is a placeholder for the ${dir^} component of AIXTIV SYMPHONY.</p>
      <p>Build version: 2.0</p>
    </div>
  </body>
</html>
EOL
  fi
done

# Configure hosting targets
echo "Configuring Firebase hosting targets..."
firebase target:apply hosting anthology anthology-aixtiv
firebase target:apply hosting orchestrate orchestrate-aixtiv
firebase target:apply hosting academy academy-aixtiv
firebase target:apply hosting visualization visualization-aixtiv

# Create basic functions directory if it doesn't exist
if [ ! -d "functions" ]; then
  echo "Setting up Firebase Functions..."
  mkdir -p functions
  cd functions
  
  # Initialize functions
  npm init -y
  npm install firebase-admin firebase-functions axios
  
  # Create basic index.js
  cat > index.js << 'EOL'
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Hello world function to test deployment
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from AIXTIV SYMPHONY Functions!");
});

// Cloud Function to sync data between systems
exports.syncPlatformData = functions.firestore
  .document('campaigns/{campaignId}')
  .onUpdate((change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const campaignId = context.params.campaignId;
    
    console.log(`Campaign ${campaignId} updated`);
    // Add your sync logic here
    
    return null;
  });

// Scheduled function to run publishing tasks
exports.scheduledPublishing = functions.pubsub
  .schedule('every 30 minutes')
  .onRun((context) => {
    console.log('Running scheduled publishing task');
    // Add your publishing logic here
    
    return null;
  });
EOL
  
  cd ..
fi

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Your AIXTIV SYMPHONY system is now live on Firebase!"
echo ""
echo "Next steps:"
echo "1. Connect your custom domains in Firebase Hosting"
echo "2. Upload your actual front-end builds to each component directory"
echo "3. Configure your environment variables in the Firebase console"
echo ""
echo "To view your deployments:"
echo "- Visit the Firebase console: https://console.firebase.google.com"
echo "- Select your project"
echo "- Go to Hosting to see all your deployed sites"
