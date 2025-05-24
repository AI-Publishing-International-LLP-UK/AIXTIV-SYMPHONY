#!/bin/bash
# Function migration script - us-central1 to us-west1

echo "Starting function migration from us-central1 to us-west1..."

# Step 1: Delete all us-central1 functions
echo "Deleting us-central1 functions..."

# Delete each function in us-central1
FUNCTIONS_TO_DELETE=(
  "authorizeAgentResource"
  "claudeCodeGenerate"
  "cleanupPRAccess"
  "contextStorage"
  "fixPRAccess"
  "modelMetrics"
  "processNlpCommand"
  "sallyPortVerify"
  "syncPilotDataToPinecone"
  "validateLinkedInProfile"
)

for func in "${FUNCTIONS_TO_DELETE[@]}"; do
  echo "Deleting function: $func"
  firebase functions:delete "$func" --region=us-central1 --force
done

# Step 2: Deploy the new functions in us-west1
echo "Deploying functions to us-west1..."
cd functions
npm install

# Deploy all functions
firebase deploy --only functions

echo "Migration complete! All functions have been moved to us-west1."