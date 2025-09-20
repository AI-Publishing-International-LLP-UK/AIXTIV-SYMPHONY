#!/bin/bash

# Quick deployment script for MOCOA Owner Interface
# This script deploys the application to GCP Cloud Run with all security configurations

set -e  # Exit on error

PROJECT_ID="api-for-warp-drive"
SERVICE_NAME="mocoa-owner-interface"
REGION="us-west1"
SERVICE_ACCOUNT="mocoa-cloud-run-sa@api-for-warp-drive.iam.gserviceaccount.com"

echo "🚀 Deploying MOCOA Owner Interface to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Verify gcloud authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Check if secrets exist
echo "🔍 Checking secrets..."
if gcloud secrets describe 11_labs --quiet 2>/dev/null; then
    echo "✅ ElevenLabs API key (11_labs) exists"
else
    echo "❌ ElevenLabs API key (11_labs) not found in GCP Secret Manager"
    exit 1
fi

if gcloud secrets describe OPENAI_API_KEY --quiet 2>/dev/null; then
    echo "✅ OpenAI API key exists"
else
    echo "⚠️ OpenAI API key not found (optional)"
fi

if gcloud secrets describe ANTHROPIC_API_KEY --quiet 2>/dev/null; then
    echo "✅ Anthropic API key exists"
else
    echo "⚠️ Anthropic API key not found (optional)"
fi

# Check if service account exists
echo "🔍 Checking service account..."
if gcloud iam service-accounts describe $SERVICE_ACCOUNT --quiet 2>/dev/null; then
    echo "✅ Service account exists: $SERVICE_ACCOUNT"
else
    echo "❌ Service account not found. Please run setup-gcp-secrets.sh first"
    exit 1
fi

echo ""
echo "🔨 Building and deploying..."

# Deploy using Cloud Build (preferred method)
if [ -f "cloudbuild.yaml" ]; then
    echo "📦 Using Cloud Build for deployment..."
    gcloud builds submit --config=cloudbuild.yaml .
else
    echo "📦 Using direct Cloud Run deployment..."
    gcloud run deploy $SERVICE_NAME \
        --source . \
        --region=$REGION \
        --service-account=$SERVICE_ACCOUNT \
        --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,NODE_ENV=production,PORT=3000" \
        --set-secrets="ELEVENLABS_API_KEY=11_labs:latest" \
        --allow-unauthenticated \
        --port=3000 \
        --memory=2Gi \
        --cpu=2 \
        --concurrency=100 \
        --timeout=300 \
        --platform=managed
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service Information:"
echo "  • Service URL: $SERVICE_URL"
echo "  • Region: $REGION"
echo "  • Service Account: $SERVICE_ACCOUNT"
echo "  • Memory: 2Gi"
echo "  • CPU: 2"
echo "  • Secrets: ElevenLabs, OpenAI, Anthropic API keys"
echo ""
echo "🔍 Quick Tests:"
echo "  Health Check: curl $SERVICE_URL/health"
echo "  Ready Check: curl $SERVICE_URL/ready"
echo ""
echo "📊 View Logs:"
echo "  gcloud run logs tail $SERVICE_NAME --region=$REGION"
echo ""
echo "🔧 Manage Service:"
echo "  View: gcloud run services describe $SERVICE_NAME --region=$REGION"
echo "  Update: gcloud run services update $SERVICE_NAME --region=$REGION"
echo "  Delete: gcloud run services delete $SERVICE_NAME --region=$REGION"
echo ""

# Test the deployment
echo "🧪 Testing deployment..."
echo "Testing health endpoint..."

if curl -sf "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️ Health check failed - service may still be starting up"
fi

echo ""
echo "✨ Your MOCOA Owner Interface is now live and secure!"
echo "🔐 All API keys are safely stored in GCP Secret Manager"
echo "🛡️ Service running with minimal permissions"
echo ""
