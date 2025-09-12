#!/bin/bash

# MOCOA PRODUCTION Deployment Script (us-west1-a)
# Only run this after staging approval

set -e

echo "🚀 Starting PRODUCTION MOCOA deployment..."
echo "⚠️  This will deploy to PRODUCTION (us-west1-a)"
read -p "Are you sure you want to deploy to PRODUCTION? (yes/NO): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Production deployment cancelled"
    exit 1
fi

# Build and deploy to PRODUCTION (us-west1-a)
cd mocoa-source

# Deploy to PRODUCTION environment (us-west1-a)
echo "🏭 Deploying to PRODUCTION (us-west1-a)..."
gcloud run deploy mocoa-production \
  --source=. \
  --platform=managed \
  --region=us-west1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=2 \
  --max-instances=50 \
  --timeout=300 \
  --concurrency=100 \
  --set-env-vars="ENVIRONMENT=production,DEPLOYMENT_ZONE=us-west1-a"

echo "✅ PRODUCTION MOCOA deployed successfully!"
echo "🔗 Production Service URL: [Your production URL here]"
echo "🔗 MCP URL: https://mcp.aipub.2100.cool"

# Test the deployment
echo "🧪 Testing PRODUCTION deployment..."
sleep 5
# Add your production URL test here
# curl -sI [PRODUCTION_URL] | grep -E "(HTTP|x-)"

echo "✅ PRODUCTION Deployment complete!"
echo "🎉 Your beautiful ASOOS Testament Swarm design is now LIVE in PRODUCTION!"
