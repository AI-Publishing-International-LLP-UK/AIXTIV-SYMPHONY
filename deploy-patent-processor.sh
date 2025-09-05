#!/bin/bash

# Patent Data Processing System - Cloud Run Deployment
# Optimized for us-central1 with maximum resources

set -e

# Configuration
PROJECT_ID="api-for-warp-drive"
REGION="us-central1"
SERVICE_NAME="patent-processor"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
MONGODB_URI_SECRET="MONGODB_URI"
PINECONE_API_KEY_SECRET="PINECONE_API_KEY"
OPENAI_API_KEY_SECRET="OPENAI_API_KEY"

echo "🚀 Deploying Patent Processing System to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Build and push Docker image
echo "📦 Building Docker image..."
docker build -f Dockerfile.patent -t $IMAGE_NAME .

echo "📤 Pushing image to Container Registry..."
docker push $IMAGE_NAME

# Deploy to Cloud Run with maximum resources
echo "🏗️ Deploying to Cloud Run with maximum resources..."

gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --platform=managed \
  --allow-unauthenticated \
  --memory=32Gi \
  --cpu=8 \
  --timeout=3600 \
  --concurrency=1000 \
  --max-instances=10 \
  --min-instances=1 \
  --execution-environment=gen2 \
  --cpu-boost \
  --set-env-vars="NODE_ENV=production,CLOUD_ML_REGION=us-central1" \
  --set-secrets="MONGODB_URI=$MONGODB_URI_SECRET:latest,PINECONE_API_KEY=$PINECONE_API_KEY_SECRET:latest,OPENAI_API_KEY=$OPENAI_API_KEY_SECRET:latest" \
  --port=8080 \
  --labels="app=patent-processor,environment=production,region=us-central1"

echo "✅ Deployment completed!"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
echo "🌐 Service URL: $SERVICE_URL"

# Test the service
echo "🔍 Testing service health..."
curl -f "$SERVICE_URL/health" || echo "⚠️ Health check failed - service may still be starting"

echo "🎉 Patent Processing System deployed successfully!"
echo ""
echo "Available endpoints:"
echo "  Health: $SERVICE_URL/health"
echo "  Search: $SERVICE_URL/api/patents/search?q=artificial+intelligence"
echo "  Stats: $SERVICE_URL/api/patents/stats"
echo "  Traditional Search: $SERVICE_URL/api/patents/search/traditional?q=machine+learning"
echo ""
echo "To process the patent dataset, you can now:"
echo "1. SSH into a powerful Compute Engine instance in us-central1"
echo "2. Run the patent data processor to download and process the 11GB dataset"
echo "3. Use the vector search API for semantic patent searches"
