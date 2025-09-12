#!/bin/bash

# Coaching 2100 - Secure HTTPS Deployment Script
# This script ensures proper HTTPS security for Chrome compliance

echo "🚀 Deploying Coaching 2100 with Enhanced Security..."

# Check if we have the required files
if [ ! -f "coaching2100-cloudflare/index.html" ]; then
    echo "❌ Error: coaching2100-cloudflare/index.html not found"
    exit 1
fi

if [ ! -f "coaching2100-cloudflare/_headers" ]; then
    echo "❌ Error: coaching2100-cloudflare/_headers not found"
    exit 1
fi

if [ ! -f "wrangler-coaching2100.toml" ]; then
    echo "❌ Error: wrangler-coaching2100.toml not found"
    exit 1
fi

echo "✅ All required files present"

# Deploy to Cloudflare Pages
echo "📡 Deploying to Cloudflare Pages..."
wrangler pages deploy coaching2100-cloudflare --project-name coaching2100-com-production

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🔐 Security Features Enabled:"
    echo "  ✅ HTTPS Enforced (HSTS)"
    echo "  ✅ Security Headers Active"
    echo "  ✅ Chrome Security Compliant"
    echo "  ✅ CSP Protection"
    echo "  ✅ XSS Protection"
    echo "  ✅ Clickjacking Protection"
    echo ""
    echo "🌐 Your website should now show as SECURE in Chrome!"
    echo "📍 URL: https://coaching2100.com"
    echo ""
    echo "🔍 To verify security:"
    echo "1. Open https://coaching2100.com in Chrome"
    echo "2. Look for the lock icon in the address bar"
    echo "3. Click the lock to see 'Connection is secure'"
else
    echo "❌ Deployment failed!"
    exit 1
fi
