#!/bin/bash

# Create Cloud Build Triggers for Jira Integration
# This script creates triggers without requiring repository connection

# Stop on errors
set -e

# Configuration
GCP_PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
JIRA_USER="C2100-PCR"

echo "=== Setting up Cloud Build Triggers for Jira Integration ==="
echo "GCP Project: $GCP_PROJECT_ID"

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

# Copy the build configuration files to Cloud Storage
echo "Copying build configuration files to Cloud Storage..."
gsutil cp /Users/as/asoos/cloudbuild-jira-org.yaml gs://${GCP_PROJECT_ID}-triggers/
gsutil cp /Users/as/asoos/cloudbuild-jira-personal.yaml gs://${GCP_PROJECT_ID}-triggers/

# Create the Cloud Build triggers
echo "Creating Cloud Build triggers..."

# Create organization repo trigger using gcloud builds triggers create manual
echo "Creating trigger for organization repository..."
gcloud builds triggers create manual \
  --name="jira-integration-org-manual" \
  --description="Manual trigger for Jira integration from organization repo" \
  --region="$REGION" \
  --build-config="gs://${GCP_PROJECT_ID}-triggers/cloudbuild-jira-org.yaml" \
  --substitutions="_REGION=$REGION,_SERVICE_NAME=jira-integration,_MIN_INSTANCES=1,_MAX_INSTANCES=10,_JIRA_USER=$JIRA_USER"

# Create personal repo trigger using gcloud builds triggers create manual
echo "Creating trigger for personal repository..."
gcloud builds triggers create manual \
  --name="jira-integration-personal-manual" \
  --description="Manual trigger for Jira integration from personal repo" \
  --region="$REGION" \
  --build-config="gs://${GCP_PROJECT_ID}-triggers/cloudbuild-jira-personal.yaml" \
  --substitutions="_REGION=$REGION,_SERVICE_NAME=jira-integration,_MIN_INSTANCES=1,_MAX_INSTANCES=5,_JIRA_USER=$JIRA_USER"

echo "=== Cloud Build Triggers Created ==="
echo
echo "You can now manually trigger builds using:"
echo "gcloud builds triggers run jira-integration-org-manual --region=$REGION"
echo "gcloud builds triggers run jira-integration-personal-manual --region=$REGION"
echo
echo "For GitHub-connected triggers, please visit the Cloud Console:"
echo "https://console.cloud.google.com/cloud-build/triggers?project=$GCP_PROJECT_ID"