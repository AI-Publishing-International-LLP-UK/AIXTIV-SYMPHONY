#!/bin/bash

# Production Jira Integration Deployment Script
# This script deploys the Jira integration to production

# Stop on errors
set -e

# Configuration - PRODUCTION SETTINGS
GCP_PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
JIRA_USER="C2100-PCR"
SERVICE_NAME="jira-integration"

echo "===== PRODUCTION DEPLOYMENT: Jira Integration Service ====="
echo "GCP Project: $GCP_PROJECT_ID"
echo "Region: $REGION"
echo "Jira User: $JIRA_USER"
echo "Service Name: $SERVICE_NAME"
echo

# Check if gcloud is installed and properly authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "ERROR: Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Ensure correct project is set
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$GCP_PROJECT_ID" ]; then
    echo "Setting GCP project to $GCP_PROJECT_ID..."
    gcloud config set project $GCP_PROJECT_ID
fi

# Check if we're in the correct directory
if [ ! -d "/Users/as/asoos/integration-gateway" ]; then
    echo "ERROR: integration-gateway directory not found at /Users/as/asoos/integration-gateway"
    exit 1
fi

# Navigate to the integration gateway directory
cd /Users/as/asoos/integration-gateway

# Stage 1: Create and verify Jira configuration
echo "===== Stage 1: Creating/Verifying Jira Configuration ====="

# Create directory if it doesn't exist
mkdir -p integrations/jira

# Verify if the Jira integration files exist, create if they don't
if [ ! -f "integrations/jira/jira-config.ts" ]; then
    echo "Creating jira-config.ts..."
    cp /Users/as/asoos/integration-gateway/integrations/jira/jira-config.ts integrations/jira/jira-config.ts || echo "Using existing jira-config.ts file"
fi

if [ ! -f "integrations/jira/jira-service.ts" ]; then
    echo "Creating jira-service.ts..."
    cp /Users/as/asoos/integration-gateway/integrations/jira/jira-service.ts integrations/jira/jira-service.ts || echo "Using existing jira-service.ts file"
fi

if [ ! -f "api/jira-webhooks.ts" ]; then
    echo "Creating jira-webhooks.ts..."
    mkdir -p api
    cp /Users/as/asoos/integration-gateway/api/jira-webhooks.ts api/jira-webhooks.ts || echo "Using existing jira-webhooks.ts file"
fi

# Stage 2: Deploy to Cloud Run
echo
echo "===== Stage 2: Building and Deploying Service to Cloud Run ====="
echo "This will build and deploy the service to Cloud Run in $REGION..."

# Build the image with Cloud Build
echo "Building Docker image with Cloud Build..."
gcloud builds submit \
  --tag gcr.io/$GCP_PROJECT_ID/$SERVICE_NAME \
  --timeout=30m \
  --machine-type=e2-highcpu-8 \
  .

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$GCP_PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --min-instances 1 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars="JIRA_USER=$JIRA_USER,GCP_PROJECT_ID=$GCP_PROJECT_ID" \
  --service-account="$GCP_PROJECT_ID@appspot.gserviceaccount.com" \
  --timeout=20m

# Get the Cloud Run URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format="value(status.url)")
echo "Service deployed successfully to: $SERVICE_URL"

# Stage 3: Deploy Webhook Handler Cloud Function
echo
echo "===== Stage 3: Deploying Webhook Handler Cloud Function ====="
echo "This will deploy the webhook handler as a Cloud Function in $REGION..."

gcloud functions deploy jira-webhook-handler \
  --gen2 \
  --runtime=nodejs18 \
  --region=$REGION \
  --source=. \
  --entry-point=handleJiraWebhook \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256Mi \
  --timeout=60s \
  --min-instances=1 \
  --max-instances=10 \
  --service-account="$GCP_PROJECT_ID@appspot.gserviceaccount.com" \
  --set-env-vars="JIRA_USER=$JIRA_USER,GCP_PROJECT_ID=$GCP_PROJECT_ID"

# Get the function URL
FUNCTION_URL=$(gcloud functions describe jira-webhook-handler --gen2 --region=$REGION --format="value(serviceConfig.uri)" 2>/dev/null || echo "Function deployment in progress, URL not available yet")

# Stage 4: Set up monthly billing scheduler
echo
echo "===== Stage 4: Setting up Monthly Billing Scheduler ====="

SCHEDULER_EXISTS=$(gcloud scheduler jobs list --format="value(name)" --filter="name=jira-license-billing" 2>/dev/null || echo "")

if [ -z "$SCHEDULER_EXISTS" ]; then
  echo "Creating billing scheduler job..."
  
  # Generate a unique ID for the webhook URL
  WEBHOOK_ID=$(date +%s | sha256sum | base64 | head -c 16)
  
  gcloud scheduler jobs create http jira-license-billing \
    --schedule="0 0 1 * *" \
    --time-zone="America/New_York" \
    --uri="$SERVICE_URL/api/billing/process?token=$WEBHOOK_ID" \
    --http-method=POST \
    --oidc-service-account="$GCP_PROJECT_ID@appspot.gserviceaccount.com" \
    --oidc-token-audience="$SERVICE_URL/api/billing/process"
    
  echo "Scheduler job created with token: $WEBHOOK_ID"
  echo "Save this token for verification in your billing handler"
else
  echo "Scheduler job already exists. Skipping creation."
fi

echo
echo "===== PRODUCTION DEPLOYMENT COMPLETE ====="
echo
echo "Service URL: $SERVICE_URL"
echo "Webhook Function URL: ${FUNCTION_URL:-Check GCP Console for webhook URL}"
echo
echo "Webhook Endpoints to Configure in Jira:"
echo "- Issue Created: ${FUNCTION_URL:-[URL Pending]}/issueCreated"
echo "- Issue Updated: ${FUNCTION_URL:-[URL Pending]}/issueUpdated"
echo "- Comment Added: ${FUNCTION_URL:-[URL Pending]}/commentAdded"
echo
echo "Next Steps:"
echo "1. Configure the webhook endpoints in Jira Administration"
echo "2. Verify service health at $SERVICE_URL/health"
echo "3. Test the integration by creating a project with Jira licensing enabled"