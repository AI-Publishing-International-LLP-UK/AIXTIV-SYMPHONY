#!/bin/bash

# ASOOS Source-Based Deployment Script
echo "==== ASOOS Source-Based Deployment to api-for-warp-drive (us-west1) ===="

# Set GCP project and region
echo "Setting GCP project and region..."
gcloud config set project api-for-warp-drive
gcloud config set run/region us-west1

# Deploy to Cloud Run directly from source code using buildpacks
echo "Deploying using Cloud Run buildpacks..."
gcloud run deploy asoos-integration-gateway \
  --source . \
  --allow-unauthenticated \
  --memory=4Gi \
  --cpu=2 \
  --timeout=600s \
  --set-env-vars="NODE_ENV=production,JWT_SECRET=temp-jwt-secret-for-demo"

echo "Deployment initiated!"
echo "This will build a container from source and deploy it to Cloud Run."
echo "Check deployment status with:"
echo "gcloud run services describe asoos-integration-gateway --region us-west1"
