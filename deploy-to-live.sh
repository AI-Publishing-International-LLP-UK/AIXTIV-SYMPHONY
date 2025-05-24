#!/bin/bash

# ASOOS Deployment Script
echo "Deploying ASOOS to live environment (api-for-warp-drive, us-west1b)..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
  echo "Error: gcloud is not installed. Please install Google Cloud SDK first."
  exit 1
fi

# Confirm deployment
echo "This will deploy to the LIVE environment in GCP project: api-for-warp-drive, zone: us-west1b"
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Set project and zone
gcloud config set project api-for-warp-drive
gcloud config set compute/zone us-west1-b

# Deploy the application
echo "Deploying application..."

# Option 1: Using Compute Engine
# gcloud compute scp asoos-deployment-bundle.zip mcp-server:/home/
# gcloud compute ssh mcp-server --command="cd /home && unzip -o asoos-deployment-bundle.zip && ./build.sh && cd /home/api-for-warp-drive && npm start"

# Option 2: Using Cloud Run
# Step 1: Build container
echo "Building container image..."
gcloud builds submit --tag gcr.io/api-for-warp-drive/asoos-integration-gateway:latest

# Step 2: Deploy to Cloud Run
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
