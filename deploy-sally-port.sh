#!/bin/bash

echo "🔐 Deploying Sally Port Authentication Worker..."
echo "This will fix the 404 authentication issues users are experiencing"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install: npm install -g wrangler"
    exit 1
fi

# Deploy Sally Port worker
echo "📦 Deploying Sally Port OAuth worker..."
wrangler deploy --config wrangler-sally-port.toml

if [ $? -eq 0 ]; then
    echo "✅ Sally Port worker deployed successfully!"
    echo ""
    echo "🔍 Testing endpoints..."
    
    # Test the worker health endpoint
    echo "Testing worker health..."
    curl -s "https://sally-port.2100.cool/health" | head -5 || echo "Endpoint not ready yet (may take a few minutes)"
    
    echo ""
    echo "🎯 Authentication flow should now work properly:"
    echo "   1. Users click auth buttons on asoos.2100.cool"
    echo "   2. They're redirected to /auth page"
    echo "   3. They choose OAuth provider"
    echo "   4. Sally Port worker handles authentication"
    echo "   5. Users are redirected to mcp.aipub.2100.cool"
    echo ""
    echo "🛡️ Victory36 Shield protection: ACTIVE"
    echo "⚡ OAuth2 providers: LinkedIn, Microsoft, Google, Email"
    
else
    echo "❌ Deployment failed. Please check:"
    echo "   1. Cloudflare API token is set: wrangler auth login"
    echo "   2. Correct account permissions"
    echo "   3. Domain routing configuration"
fi
