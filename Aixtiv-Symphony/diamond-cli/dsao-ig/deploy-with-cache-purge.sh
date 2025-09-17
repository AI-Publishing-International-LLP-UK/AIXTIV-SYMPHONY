#!/bin/bash
# MOCOA Deployment with Aggressive Cache Purging
# For rapid iteration with thousands of changes

set -e

echo "🚀 Starting MOCOA deployment with cache purging..."

# 1. Deploy to Cloud Run
echo "📦 Deploying to Cloud Run..."
cd mocoa-source
gcloud run deploy mocoa \
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
  --set-env-vars="CACHE_CONTROL=no-cache"

cd ..

echo "✅ Cloud Run deployment complete"

# 2. Aggressive cache busting
echo "💨 Attempting cache purge methods..."

# Method 1: Multiple requests with different cache-busting parameters
echo "🔄 Cache busting via multiple requests..."
for i in {1..5}; do
  curl -s "https://mcp.aipub.2100.cool?bust=$(date +%s)&method=1&attempt=$i" \
    -H "Cache-Control: no-cache, no-store, must-revalidate" \
    -H "Pragma: no-cache" \
    -H "Expires: 0" \
    -H "User-Agent: CacheBuster-$i" \
    -o /dev/null &
done

# Method 2: Different endpoints
for endpoint in "/" "/index.html" "/?v=latest" "/?nocache=1"; do
  curl -s "https://mcp.aipub.2100.cool$endpoint?purge=$(date +%s)" \
    -H "Cache-Control: no-cache" \
    -o /dev/null &
done

wait

echo "🧪 Testing deployment..."
sleep 10

# Test both direct and proxied URLs
echo "Direct Cloud Run URL test:"
DIRECT_COUNT=$(curl -s "https://mocoa-859242575175.DIRECT_COUNT=$(curl -rep -c "conversationAutoActivated" || echo "0")
echo "conversationAutoActivated found: $DIRECT_COUNT times"

echo "Proxied MCP URL test:"
PROXY_COUNT=$(curl -s "https://mcp.aipub.2100.cool?test=$(date +%s)" | grep -c "conversationAutoActivated" || echo "0")
echo "conversationAutoActivated found: $PROXY_COUNT times"

if [ "$PROXY_COUNT" -eq "2" ]; then
  echo "✅ SUCCESS: Latest version is live on mcp.aipub.2100.cool!"
else
  echo "⚠️  CACHE DELAY: Latest version deployed but cache still updating..."
  echo "💡 Try accessing: https://mcp.aipub.2100.cool?v=$(date +%s)"
fi

echo "✅ Deployment complete!"
echo "🔗 Direct URLecho "🔗 Direct URLecho "🔗 Direct URLecho "🔗 Direct URLecho "🔗 Proxied URL: https://mcp.aipub.2100.cool"
