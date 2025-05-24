#!/bin/bash

# Deploy Jira Integration Service Script
# This script deploys the Jira integration service directly

# Stop on errors
set -e

# Configuration
GCP_PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
JIRA_USER="C2100-PCR"
SERVICE_NAME="jira-integration"

echo "=== Deploying Jira Integration Service ==="
echo "GCP Project: $GCP_PROJECT_ID"
echo "Region: $REGION"
echo "Jira User: $JIRA_USER"

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

# Deploy the integration gateway service
echo "Building and deploying Jira integration service..."
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
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars="JIRA_USER=$JIRA_USER,GCP_PROJECT_ID=$GCP_PROJECT_ID"

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
  --allow-unauthenticated \
  --set-env-vars="JIRA_USER=$JIRA_USER,GCP_PROJECT_ID=$GCP_PROJECT_ID"

# Get the function URL
FUNCTION_URL=$(gcloud functions describe jira-webhook-handler --gen2 --region=$REGION --format="value(serviceConfig.uri)" || echo "Function deployment pending...")
echo "Webhook handler deployment initiated. URL will be available shortly."

echo "=== Jira Integration Service Deployment Complete ==="
echo
echo "Integration service: $SERVICE_URL"
echo "Webhook handler: Check Cloud Console for the URL once deployment completes"
echo
echo "To manually run CI/CD triggers:"
echo "gcloud builds triggers run jira-integration-org-manual --region=$REGION"
echo "gcloud builds triggers run jira-integration-personal-manual --region=$REGION"