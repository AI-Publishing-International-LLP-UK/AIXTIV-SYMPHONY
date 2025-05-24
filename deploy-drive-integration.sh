#!/bin/bash
# Deploy Google Drive integration functions

echo "Deploying Google Drive integration functions..."

# First, make sure we're using the right project
firebase use api-for-warp-drive

# Move to functions directory
cd functions

# Install dependencies if needed
npm install

# Deploy only the handleDriveChanges and processDriveFiles functions
firebase deploy --only functions:handleDriveChanges,functions:processDriveFiles --project api-for-warp-drive

echo "Drive integration functions deployed!"