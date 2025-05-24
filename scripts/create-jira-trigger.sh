#!/bin/bash

# Simplified CI/CD Trigger Setup Script for Jira Integration
# This script creates the Cloud Build trigger for the Jira integration

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

# Create the CI/CD trigger directly
echo "Creating Cloud Build trigger for Jira integration..."

# Check if the trigger already exists and delete it if it does
TRIGGER_EXISTS=$(gcloud builds triggers list --format="value(name)" | grep -c "jira-integration-deploy" || true)
if [ "$TRIGGER_EXISTS" -gt 0 ]; then
    echo "Trigger already exists. Updating..."
    gcloud builds triggers delete jira-integration-deploy --quiet || true
fi

# Create the new trigger using a YAML config file
echo "Creating trigger from configuration file..."
gcloud builds triggers import --source=/Users/as/asoos/jira-trigger.yaml

RESULT=$?
if [ $RESULT -eq 0 ]; then
    echo "=== CI/CD Trigger Setup Complete ==="
    echo
    echo "The Jira integration will now be automatically deployed when changes are made to:"
    echo "- integration-gateway/integrations/jira/**"
    echo "- integration-gateway/api/jira-webhooks.ts"
    echo "- integration-gateway/cloudbuild.yaml"
    echo
    echo "You can also manually trigger a build using:"
    echo "gcloud builds triggers run jira-integration-deploy --branch=main"
else
    echo "=== CI/CD Trigger Setup Failed with error code $RESULT ==="
    echo
    echo "There was a problem creating the trigger. Please ensure that:"
    echo "1. The GitHub repository is properly connected to Cloud Build"
    echo "2. You have the necessary permissions on the GCP project"
    echo "3. The repository and branch names are correct"
    echo
    echo "For manual setup, visit:"
    echo "https://console.cloud.google.com/cloud-build/triggers/create?project=$GCP_PROJECT_ID"
    echo
    echo "To connect your repository first, visit:"
    echo "https://console.cloud.google.com/cloud-build/triggers;region=global/connect?project=$GCP_PROJECT_ID"
fi