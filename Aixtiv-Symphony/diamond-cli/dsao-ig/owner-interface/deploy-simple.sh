#!/bin/bash

# Simple deployment script for MOCOA Owner Interface
# Uses existing GCP secrets and service account

set -e

PROJECT_ID="api-for-warp-drive"
SERVICE_NAME="mocoa-owner-interface"
REGION="us-central1"

echo "🚀 Deploying MOCOA Owner Interface"
echo "Using existing ElevenLabs API key from GCP Secret Manager (11_labs)"
echo ""

# Verify we can access the secret
echo "🔍 Verifying ElevenLabs API key access..."
if gcloud secrets versions access latest --secret="11_labs" >/dev/null 2>&1; then
    echo "✅ ElevenLabs API key (11_labs) is accessible"
else
    echo "❌ Cannot access ElevenLabs API key. Check permissions."
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

echo ""
echo "🔨 Deploying to Cloud Run..."

# Deploy using the existing configuration
gcloud builds submit --config=cloudbuild.yaml .

echo ""
echo "🎉 Deployment complete!"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null || echo "")

if [ -n "$SERVICE_URL" ]; then
    echo "🌐 Service URL: $SERVICE_URL"
    echo "🧪 Testing: curl $SERVICE_URL/health"
else
    echo "⚠️ Could not get service URL. Check deployment logs."
fi
