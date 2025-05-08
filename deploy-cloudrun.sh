#!/bin/bash

# ASOOS Direct Cloud Run Deployment Script
echo "==== ASOOS Direct Deployment to api-for-warp-drive (us-west1) ===="

# Set GCP project and region
echo "Setting GCP project and region..."
gcloud config set project api-for-warp-drive
gcloud config set run/region us-west1

# Deploy directly to Cloud Run from source
echo "Deploying directly to Cloud Run from source..."
gcloud run deploy asoos-integration-gateway \
  --source=. \
  --memory=4Gi \
  --cpu=2 \
  --allow-unauthenticated

echo "Deployment completed!"
echo "You can verify the deployment using:"
echo "gcloud run services describe asoos-integration-gateway --region us-west1"
