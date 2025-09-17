#!/bin/bash
# Quick update script for route fixes

echo "🔧 Quick-updating MOCOA with route fix..."

# Deploy with minimal validation
gcloud run deploy mocoa \
  --source=. \
  --region=us-west1 \
  --platform=managed \
  --allow-unauthenticated \
  --project=api-for-warp-drive \
  --quiet

echo "✅ Route fix deployed. Testing health endpoint..."

# Wait a moment for deployment
sleep 10

# Test the health endpoint
echo "🔍 Testing health endpoint..."
curl -s https://mocoa-859242575175.us-west1.run.app/health | jq '.'
