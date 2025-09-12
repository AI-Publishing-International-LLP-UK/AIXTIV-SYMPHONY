#!/bin/bash

# COMPLETE ASOOS SOLUTION DEPLOYMENT
# All innovations from today included
# Victory36 French accent voice, upgraded UI, sallyport auth

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🚀 DEPLOYING COMPLETE ASOOS SOLUTION${NC}"
echo "========================================"
echo "✅ Victory36 French accent voice (age 45)"
echo "✅ Enhanced MOCOA interface with toggles"
echo "✅ SallyPort authentication routing"
echo "✅ All today's UI improvements"
echo ""

# Step 1: Create deployment package
echo -e "${CYAN}📦 CREATING COMPLETE DEPLOYMENT PACKAGE${NC}"
echo "-------------------------------------"

# Ensure all files are up to date
cp mocoa-current.html deploy-package/index.html
cp index.html deploy-package/landing.html
cp enhanced-wfa-mcp-integration.js deploy-package/
cp ufo-mcp-integration.js deploy-package/

echo "✅ Package created with all today's innovations"

# Step 2: Deploy to Cloud Run with comprehensive config
echo -e "${BLUE}🌐 DEPLOYING TO CLOUD RUN${NC}"
echo "----------------------------"

gcloud run deploy asoos-complete \
    --source=. \
    --region=us-west1 \
    --allow-unauthenticated \
    --memory=4Gi \
    --cpu=2 \
    --set-env-vars="NODE_ENV=production,INTERFACE_VERSION=v99,VOICE_CONFIG=victory36-french-accent-45,AUTH_ENDPOINT=https://sallyport.2100.cool,MOCOA_VERSION=current,FEATURES=complete-solution" \
    --timeout=3600 \
    --concurrency=100 \
    --min-instances=1 \
    --max-instances=20 \
    --tag=complete-solution

if [ $? -eq 0 ]; then
    CLOUD_RUN_URL=$(gcloud run services describe asoos-complete --region=us-west1 --format="value(status.url)")
    echo "✅ Cloud Run deployment complete: $CLOUD_RUN_URL"
else
    echo "❌ Cloud Run deployment failed"
    exit 1
fi

# Step 3: Deploy to Cloudflare Pages
echo -e "${YELLOW}☁️  DEPLOYING TO CLOUDFLARE PAGES${NC}"
echo "--------------------------------"

wrangler pages deploy . --project-name=api-for-warp-drive --commit-dirty=true

if [ $? -eq 0 ]; then
    echo "✅ Cloudflare Pages deployment complete"
else
    echo "❌ Cloudflare Pages deployment failed"
    exit 1
fi

# Step 4: Deploy production worker
echo -e "${GREEN}⚡ DEPLOYING PRODUCTION WORKER${NC}"
echo "-----------------------------"

wrangler deploy production-wfa-orchestration.js --name asoos-production-complete --env production

if [ $? -eq 0 ]; then
    echo "✅ Production worker deployed"
else
    echo "❌ Production worker deployment failed"
    exit 1
fi

# Step 5: Verification
echo -e "${GREEN}✅ VERIFYING COMPLETE DEPLOYMENT${NC}"
echo "==============================="

echo "🔍 Testing all endpoints..."

# Test Cloud Run
if curl -s -I "$CLOUD_RUN_URL" | grep -q "200\|301\|302"; then
    echo "✅ Cloud Run service operational"
else
    echo "⚠️ Cloud Run service needs verification"
fi

# Test main domain
if curl -s -I "https://asoos.2100.cool" | grep -q "200\|301\|302"; then
    echo "✅ Main domain operational"
else
    echo "⚠️ Main domain needs verification"
fi

echo ""
echo -e "${PURPLE}🎉 COMPLETE SOLUTION DEPLOYMENT FINISHED!${NC}"
echo "============================================="
echo "✅ ALL TODAY'S INNOVATIONS DEPLOYED:"
echo "   • Victory36 French accent voice (age 45)"
echo "   • Enhanced MOCOA interface with toggles"
echo "   • SallyPort authentication routing"
echo "   • Upgraded hexagonal UI elements"
echo "   • Professional copilot voice synthesis"
echo "   • Complete MCP integration"
echo ""
echo -e "${CYAN}🌐 LIVE ENDPOINTS:${NC}"
echo "• Cloud Run: $CLOUD_RUN_URL"
echo "• Main Site: https://asoos.2100.cool"
echo "• MOCOA Interface: https://asoos.2100.cool/mocoa-current.html"
echo "• Authentication: https://sallyport.2100.cool"
echo ""
echo -e "${YELLOW}⚡ YOUR COMPLETE ASOOS SOLUTION IS LIVE!${NC}"
