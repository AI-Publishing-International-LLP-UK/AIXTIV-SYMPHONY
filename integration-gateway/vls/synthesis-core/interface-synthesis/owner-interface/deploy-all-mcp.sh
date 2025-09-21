#!/bin/bash

# Deploy Owner Interface to All 3 MCP Domains
# mcp.zena.2100.cool (client), mcp.aipub.2100.cool (members), mcp.asoos.2100.cool (template)

set -e

echo "🚀 Deploying ASOOS Owner Interface to 3 MCP domains..."

# Build the interface container
echo "📦 Building owner interface container..."
docker buildx build --platform linux/amd64 -t gcr.io/api-for-warp-drive/owner-interface:latest --push . -f - <<EOF
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/
COPY *.css /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Deploy to Cloud Run for each domain
echo "🌍 Deploying to mcp.zena.2100.cool (Zaxon client)..."
gcloud run deploy mcp-zena \
  --image=gcr.io/api-for-warp-drive/owner-interface:latest \
  --platform=managed \
  --region=us-west1 \
  --project=api-for-warp-drive \
  --memory=256Mi \
  --cpu=1 \
  --port=80 \
  --allow-unauthenticated

echo "🏢 Deploying to mcp.aipub.2100.cool (AI Publishing members)..."
gcloud run deploy mcp-aipub \
  --image=gcr.io/api-for-warp-drive/owner-interface:latest \
  --platform=managed \
  --region=us-west1 \
  --project=api-for-warp-drive \
  --memory=256Mi \
  --cpu=1 \
  --port=80 \
  --allow-unauthenticated

echo "🔧 Deploying to mcp.asoos.2100.cool (Universal template)..."
gcloud run deploy mcp-asoos \
  --image=gcr.io/api-for-warp-drive/owner-interface:latest \
  --platform=managed \
  --region=us-west1 \
  --project=api-for-warp-drive \
  --memory=256Mi \
  --cpu=1 \
  --port=80 \
  --allow-unauthenticated

echo "✅ All 3 MCP interfaces deployed!"
echo "📋 URLs:"
echo "   🎯 Client: https://mcp-zena-859242575175.us-west1.run.app"
echo "   🏢 Members: https://mcp-aipub-859242575175.us-west1.run.app" 
echo "   🔧 Template: https://mcp-asoos-859242575175.us-west1.run.app"