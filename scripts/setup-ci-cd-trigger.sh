#!/bin/bash

# CI/CD Trigger Setup Script for Jira Integration
# This script sets up the Cloud Build trigger for the Jira integration

# Stop on errors
set -e

# Configuration
GCP_PROJECT_ID="api-for-warp-drive"
REPO_OWNER="coaching2100"
REPO_NAME="asoos"

echo "=== Setting up CI/CD Trigger for Jira Integration ==="
echo "GCP Project: $GCP_PROJECT_ID"
echo "Repository: $REPO_OWNER/$REPO_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if the user is logged in to gcloud
gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q . || {
    echo "Error: You are not logged in to gcloud. Please run 'gcloud auth login' first."
    exit 1
}

# Check if the correct project is set
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$GCP_PROJECT_ID" ]; then
    echo "Setting GCP project to $GCP_PROJECT_ID..."
    gcloud config set project $GCP_PROJECT_ID
fi

# Check if the repository is connected
echo "Checking repository connection..."
REPO_CONNECTED=$(gcloud builds repositories list --format="value(name)" | grep -c "$REPO_NAME" || true)

if [ "$REPO_CONNECTED" -eq 0 ]; then
    echo
    echo "===> Repository not connected to Cloud Build <==="
    echo
    echo "Please connect your GitHub repository to Cloud Build by visiting this URL:"
    echo "https://console.cloud.google.com/cloud-build/triggers;region=global/connect?project=$GCP_PROJECT_ID"
    echo
    echo "Follow these steps:"
    echo "1. Click 'Continue' to connect a repository"
    echo "2. Select 'GitHub (Cloud Build GitHub App)'"
    echo "3. Authenticate with GitHub if prompted"
    echo "4. Select the repository '$REPO_OWNER/$REPO_NAME'"
    echo "5. Click 'Connect'"
    echo "6. Return to this terminal and press Enter to continue"
    echo
    read -p "Press Enter after connecting the repository... " -r

    # Verify connection again
    REPO_CONNECTED=$(gcloud builds repositories list --format="value(name)" | grep -c "$REPO_NAME" || true)
    if [ "$REPO_CONNECTED" -eq 0 ]; then
        echo "Repository still not connected. Please try again."
        exit 1
    fi

    echo "Repository successfully connected!"
fi

# Create the manual trigger
echo "Creating Cloud Build trigger for Jira integration..."

# Check if the trigger already exists
TRIGGER_EXISTS=$(gcloud builds triggers list --format="value(name)" | grep -c "jira-integration-deploy" || true)

if [ "$TRIGGER_EXISTS" -gt 0 ]; then
    echo "Trigger already exists. Updating..."
    gcloud builds triggers delete jira-integration-deploy --quiet
fi

# Create the trigger
gcloud builds triggers create github \
  --name="jira-integration-deploy" \
  --repo="https://github.com/$REPO_OWNER/$REPO_NAME" \
  --branch="main" \
  --build-config="integration-gateway/cloudbuild.yaml" \
  --include-files="integration-gateway/integrations/jira/**,integration-gateway/api/jira-webhooks.ts,integration-gateway/cloudbuild.yaml" \
  --description="Deploy Jira integration on changes to integration code" \
  --substitutions="_REGION=us-west1,_SERVICE_NAME=jira-integration,_MIN_INSTANCES=1,_MAX_INSTANCES=10"

echo "=== CI/CD Trigger Setup Complete ==="
echo
echo "The Jira integration will now be automatically deployed when changes are made to:"
echo "- integration-gateway/integrations/jira/**"
echo "- integration-gateway/api/jira-webhooks.ts"
echo "- integration-gateway/cloudbuild.yaml"
echo
echo "You can also manually trigger a build using:"
echo "gcloud builds triggers run jira-integration-deploy --branch=main"