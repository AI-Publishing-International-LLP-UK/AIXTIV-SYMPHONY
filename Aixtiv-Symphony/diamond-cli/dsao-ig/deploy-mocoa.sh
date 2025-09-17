#!/bin/bash

# Fast MOCOA Deployment Script
# Updates the Cloud Run service with latest changes

set -e

echo "🚀 Starting MOCOA deployment..."

# Build and deploy to STAGING (us-west1-b) first
cd mocoa-source

# Deploy to STAGING environment (us-west1-b)
echo "🧪 Deploying to STAGING (us-west1-b)..."
gcloud run deploy mocoa-staging \
  --source=. \
  --platform=managed \
  --region=us-west1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --timeout=300 \
  --concurrency=100 \
  --set-env-vars="ENVIRONMENT=staging,DEPLOYMENT_ZONE=us-west1-b"

echo "✅ MOCOA deployed successfully!"
echo "🔗 Service URL: https://mocoa-yutylytffa-uw.a.run.app"
echo "🔗 MCP URL: https://mcp.aipub.2100.cool"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5
curl -sI https://mocoa-yutylytffa-uw.a.run.app | grep -E "(HTTP|x-)"

echo "✅ Deployment complete!"
