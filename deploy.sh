#!/bin/bash

echo "Deploying SallyPort-enabled service..."

gcloud config set project api-for-warp-drive
gcloud config set run/region us-west1

gcloud run deploy asoos-integration-gateway \
  --source . \
  --allow-unauthenticated \
  --timeout=300s \
  --cpu=1 \
  --memory=512Mi \
  --set-env-vars="NODE_ENV=production,JWT_SECRET=sallport-jwt-secret-2025"

echo "Deployment complete!"
echo "Test with:"
echo "1. Get token: curl https://asoos-integration-gateway-859242575175.us-west1.run.app/token"
echo "2. Access protected: curl -H 'Authorization: Bearer YOUR_TOKEN' https://asoos-integration-gateway-859242575175.us-west1.run.app/protected"
