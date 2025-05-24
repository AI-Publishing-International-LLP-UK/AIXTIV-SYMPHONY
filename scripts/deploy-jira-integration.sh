#!/bin/bash

# Jira Integration Deployment Script
# This script deploys the Jira integration to Cloud Run and Firebase

# Stop on errors
set -e

# Configuration
GCP_PROJECT_ID="api-for-warp-drive"
SERVICE_NAME="jira-integration"
REGION="us-west1"
MEMORY="512Mi"
CPU="1"
MIN_INSTANCES=1
MAX_INSTANCES=10

echo "=== Deploying Jira Integration for Coaching 2100 ==="
echo "GCP Project: $GCP_PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"

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

# Build and deploy the integration gateway
echo "Building and deploying integration gateway..."
cd /Users/as/asoos/integration-gateway

# Install dependencies
echo "Installing dependencies..."
npm install

# Building Docker image
echo "Building Docker image..."
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$GCP_PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --memory $MEMORY \
  --cpu $CPU \
  --min-instances $MIN_INSTANCES \
  --max-instances $MAX_INSTANCES \
  --allow-unauthenticated

# Get the Cloud Run URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format="value(status.url)")
echo "Service deployed to: $SERVICE_URL"

# Deploy Cloud Functions for webhooks
echo "Deploying webhook handler function..."
gcloud functions deploy jira-webhook-handler \
  --gen2 \
  --runtime=nodejs18 \
  --region=$REGION \
  --source=. \
  --entry-point=handleJiraWebhook \
  --trigger-http \
  --allow-unauthenticated

# Get the function URL
FUNCTION_URL=$(gcloud functions describe jira-webhook-handler --gen2 --region=$REGION --format="value(serviceConfig.uri)")
echo "Webhook handler deployed to: $FUNCTION_URL"

# Deploy the frontend components
echo "Deploying frontend components..."
cd /Users/as/asoos
firebase deploy --only hosting:dashboard --project $GCP_PROJECT_ID

# Set up Cloud Scheduler for billing
echo "Setting up Cloud Scheduler for billing..."
SCHEDULER_EXISTS=$(gcloud scheduler jobs list --format="value(name)" --filter="name=jira-license-billing" || echo "")

if [ -z "$SCHEDULER_EXISTS" ]; then
  gcloud scheduler jobs create http jira-license-billing \
    --schedule="0 0 1 * *" \
    --time-zone="America/New_York" \
    --uri="https://us-west1-$GCP_PROJECT_ID.cloudfunctions.net/processBilling" \
    --http-method=POST \
    --oidc-service-account="$GCP_PROJECT_ID@appspot.gserviceaccount.com" \
    --oidc-token-audience="https://us-west1-$GCP_PROJECT_ID.cloudfunctions.net/processBilling"
  echo "Scheduler job created"
else
  echo "Scheduler job already exists"
fi

echo "=== Jira Integration Deployment Complete ==="
echo
echo "Integration Gateway: $SERVICE_URL"
echo "Webhook Handler: $FUNCTION_URL"
echo
echo "Next steps:"
echo "1. Configure Jira webhooks to point to: $FUNCTION_URL"
echo "2. Update your Jira API token if needed using the setup-jira-integration.sh script"
echo "3. Test the integration by creating a new project in the dashboard"