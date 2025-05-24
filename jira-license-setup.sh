#!/bin/bash

# Jira License Service Setup Script
# This script sets up the Jira License service and configures CI/CD

# Stop on errors
set -e

echo "=== Setting up Jira License Service ==="

# Create necessary directories if they don't exist
mkdir -p backend/services/jira-license/functions
mkdir -p frontend/opus1/dashboard/src/components/onboarding
mkdir -p frontend/opus1/dashboard/src/components/admin
mkdir -p frontend/opus1/dashboard/src/components/emails
mkdir -p frontend/opus1/dashboard/src/services
mkdir -p .github/workflows

# Check if Google Cloud SDK is installed
if ! command -v gcloud &> /dev/null; then
    echo "Google Cloud SDK not found. Please install it and authenticate."
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Install dependencies for backend functions
echo "Installing backend dependencies..."
cd backend/services/jira-license/functions
npm install
cd ../../../..

# Setup Firebase project
echo "Configuring Firebase..."
firebase use --add

# Set up environment variables
echo "Setting up environment variables..."
cat > backend/services/jira-license/functions/.env << EOL
# Firebase config values
PROJECT_ID=$(gcloud config get-value project)
STORAGE_BUCKET=$(gcloud config get-value project).appspot.com

# SendGrid API key for sending emails
SENDGRID_API_KEY=

# Jira API credentials
JIRA_API_KEY=
JIRA_EMAIL=jira-admin@coaching2100.com
JIRA_BASE_URL=https://coaching2100.atlassian.net
EOL

# Setting up Firestore indices
echo "Setting up Firestore indices..."
cat > backend/services/jira-license/firestore.indexes.json << EOL
{
  "indexes": [
    {
      "collectionGroup": "projectLicenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "licenseType", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "projectLicenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "licenseType", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "projectLicenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "licenseType", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "jiraWorkspaces",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
EOL

# Setting up Cloud Build trigger
echo "Setting up Cloud Build trigger..."
PROJECT_ID=$(gcloud config get-value project)
gcloud builds triggers create github \
  --name="jira-license-service-deploy" \
  --repo="coaching2100/asoos" \
  --branch-pattern="main" \
  --build-config="backend/services/jira-license/cloudbuild.yaml" \
  --included-files="backend/services/jira-license/**" \
  --service-account="projects/$PROJECT_ID/serviceAccounts/$PROJECT_ID@appspot.gserviceaccount.com"

gcloud builds triggers create github \
  --name="jira-license-frontend-deploy" \
  --repo="coaching2100/asoos" \
  --branch-pattern="main" \
  --build-config="frontend/opus1/dashboard/cloudbuild.yaml" \
  --included-files="frontend/opus1/dashboard/src/components/onboarding/ProjectTrackingLicense.tsx,frontend/opus1/dashboard/src/components/admin/JiraLicenseManagement.tsx,frontend/opus1/dashboard/src/services/jiraLicenseService.ts" \
  --service-account="projects/$PROJECT_ID/serviceAccounts/$PROJECT_ID@appspot.gserviceaccount.com"

# Configure SendGrid
echo "Do you want to configure SendGrid now? (y/n)"
read configure_sendgrid

if [ "$configure_sendgrid" = "y" ]; then
  echo "Enter your SendGrid API key:"
  read sendgrid_api_key
  
  # Add SendGrid API key to Firebase config
  firebase functions:config:set sendgrid.key="$sendgrid_api_key"
  
  # Update .env file
  sed -i "s/SENDGRID_API_KEY=/SENDGRID_API_KEY=$sendgrid_api_key/" backend/services/jira-license/functions/.env
fi

# Configure Jira API
echo "Do you want to configure Jira API now? (y/n)"
read configure_jira

if [ "$configure_jira" = "y" ]; then
  echo "Enter your Jira API key:"
  read jira_api_key
  
  # Add Jira API key to Firebase config
  firebase functions:config:set jira.api_key="$jira_api_key"
  
  # Update .env file
  sed -i "s/JIRA_API_KEY=/JIRA_API_KEY=$jira_api_key/" backend/services/jira-license/functions/.env
fi

echo "=== Setup complete! ==="
echo "Next steps:"
echo "1. Complete environment setup in backend/services/jira-license/functions/.env"
echo "2. Deploy the service using 'firebase deploy --only functions,firestore,hosting'"
echo "3. Verify the CI/CD pipelines are working"