#!/bin/bash

# Vision Space Launch Script
# Deploys the Vision Space interface to Firebase

# Set project ID
PROJECT_ID="api-for-warp-drive"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
firebase login

# Set the Firebase project
firebase use $PROJECT_ID

# Create directory for storing scene images
mkdir -p public/assets/images/fleet
mkdir -p public/assets/images/scenes
mkdir -p public/assets/audio

# Deploy to Firebase
echo "Deploying Vision Space to Firebase..."
firebase deploy --only hosting,storage,firestore

# Note: You may need to deploy functions separately if you've made changes
# firebase deploy --only functions

echo "Vision Space deployment complete!"
echo "Visit https://$PROJECT_ID.web.app to access the Vision Space interface."