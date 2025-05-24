#!/bin/bash

# Multi-Repository Jira Integration Setup Script for Coaching 2100
# This script sets up the Jira integration with both personal and organization repositories

# Stop on errors
set -e

# Configuration
GCP_PROJECT_ID="api-for-warp-drive"
ORG_REPO_OWNER="coaching2100"
ORG_REPO_NAME="asoos"
PERSONAL_REPO_NAME="C2100-PCR" # Update this to your personal repo name if different
JIRA_USER="C2100-PCR"
REGION="us-west1"

echo "=== Setting up Jira Integration for Multiple Repositories ==="
echo "GCP Project: $GCP_PROJECT_ID"
echo "Org Repository: $ORG_REPO_OWNER/$ORG_REPO_NAME"
echo "Personal Repository: $PERSONAL_REPO_NAME"
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

# Create secrets for Jira integration
echo "Setting up secrets for Jira integration..."

# Check if secrets already exist
JIRA_TOKEN_EXISTS=$(gcloud secrets list --filter="name:jira-api-token" --format="value(name)" || echo "")
WEBHOOK_SECRET_EXISTS=$(gcloud secrets list --filter="name:jira-webhook-secret" --format="value(name)" || echo "")

# Check for Jira API token secret
if [ -z "$JIRA_TOKEN_EXISTS" ]; then
    echo "No Jira API token secret found."
    echo "Using existing token from GCP..."

    # Use existing token without creating a new secret
    echo "Skipping token creation since it's already in GCP."
else
    echo "Jira API token secret already exists in GCP."
fi

# Create webhook secret if it doesn't exist
if [ -z "$WEBHOOK_SECRET_EXISTS" ]; then
    echo "Creating Jira webhook secret..."
    WEBHOOK_SECRET=$(openssl rand -base64 32)
    
    echo "$WEBHOOK_SECRET" | gcloud secrets create jira-webhook-secret \
        --replication-policy="automatic" \
        --data-file=-
    
    echo "Jira webhook secret created: $WEBHOOK_SECRET"
    echo "Please use this secret when setting up webhooks in Jira."
else
    echo "Jira webhook secret already exists."
fi

# Set up IAM permissions for the function to access secrets
echo "Setting up IAM permissions..."
SERVICE_ACCOUNT="$GCP_PROJECT_ID@appspot.gserviceaccount.com"

gcloud secrets add-iam-policy-binding jira-api-token \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jira-webhook-secret \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

echo "IAM permissions set up."

# Deploy Cloud Run service
echo "Deploying Jira Integration service to Cloud Run..."
cd /Users/as/asoos/integration-gateway

# Build Docker image
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/jira-integration

# Deploy to Cloud Run
gcloud run deploy jira-integration \
  --image gcr.io/$GCP_PROJECT_ID/jira-integration \
  --platform managed \
  --region $REGION \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --allow-unauthenticated

# Get the Cloud Run URL
SERVICE_URL=$(gcloud run services describe jira-integration --platform managed --region $REGION --format="value(status.url)")
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
FUNCTION_URL=$(gcloud functions describe jira-webhook-handler --gen2 --region=$REGION --format="value(serviceConfig.uri)")
echo "Webhook handler deployed to: $FUNCTION_URL"

# Set up scheduler for monthly billing
echo "Setting up scheduler for monthly billing..."
SCHEDULER_EXISTS=$(gcloud scheduler jobs list --format="value(name)" --filter="name=jira-license-billing" || echo "")

if [ -z "$SCHEDULER_EXISTS" ]; then
  gcloud scheduler jobs create http jira-license-billing \
    --schedule="0 0 1 * *" \
    --time-zone="America/New_York" \
    --uri="https://$REGION-$GCP_PROJECT_ID.cloudfunctions.net/processBilling" \
    --http-method=POST \
    --oidc-service-account="$SERVICE_ACCOUNT" \
    --oidc-token-audience="https://$REGION-$GCP_PROJECT_ID.cloudfunctions.net/processBilling"
  echo "Scheduler job created"
else
  echo "Scheduler job already exists"
fi

echo "=== Jira Integration Setup Complete ==="
echo
echo "Integration service: $SERVICE_URL"
echo "Webhook handler: $FUNCTION_URL"
echo
echo "Webhook endpoints to configure in Jira:"
echo "- Issue Created: $FUNCTION_URL/issueCreated"
echo "- Issue Updated: $FUNCTION_URL/issueUpdated"
echo "- Comment Added: $FUNCTION_URL/commentAdded"
echo
echo "Next steps:"
echo "1. Configure these webhook endpoints in Jira Administration > System > Webhooks"
echo "2. Use the webhook secret from Secret Manager as the signing secret"
echo "3. Test the integration by creating a new project in the dashboard"