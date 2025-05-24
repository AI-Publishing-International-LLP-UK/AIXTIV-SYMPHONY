#!/bin/bash

# ASOOS Deployment Script
echo "==== ASOOS Deployment to api-for-warp-drive (us-west1b) ===="

# Set GCP project and zone
echo "Setting GCP project and zone..."
gcloud config set project api-for-warp-drive
gcloud config set compute/zone us-west1-b

# Build and tag the Docker image
echo "Building Docker image..."
gcloud builds submit --tag gcr.io/api-for-warp-drive/asoos-integration-gateway:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy asoos-integration-gateway \
  --image gcr.io/api-for-warp-drive/asoos-integration-gateway:latest \
  --region us-west1 \
  --platform managed \
  --memory 4Gi \
  --cpu 2 \
  --allow-unauthenticated

echo "Deployment completed!"
echo "You can verify the deployment using:"
echo "gcloud run services describe asoos-integration-gateway --region us-west1"
