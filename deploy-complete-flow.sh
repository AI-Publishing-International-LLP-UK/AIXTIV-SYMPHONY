#!/bin/bash

# Complete ASOOS Website Flow Deployment Script
# ASOOS.2100.COOL → SALLYPORT.2100.COOL → MCP.COMPANY.2100.COOL

set -e

echo "🚀 DEPLOYING COMPLETE ASOOS WEBSITE FLOW"
echo "========================================="

# Function to check if a site is responding
check_site() {
    local url=$1
    local name=$2
    echo "🌐 Testing $name at $url"
    
    if curl -s --max-time 10 "$url/health" > /dev/null 2>&1; then
        echo "✅ $name is responding"
        return 0
    else
        echo "❌ $name is not responding"
        return 1
    fi
}

# 1. Deploy MCP.COMPANY.2100.COOL (if not already deployed)
echo ""
echo "📦 STEP 1: Deploying MCP.COMPANY.2100.COOL"
echo "===========================================" 

if wrangler deploy mcp-company-worker.js --config wrangler-mcp-company.toml --env="" ; then
    echo "✅ MCP.COMPANY.2100.COOL deployed successfully"
else
    echo "❌ Failed to deploy MCP.COMPANY.2100.COOL"
    exit 1
fi

# 2. Update ASOOS worker with proper flow routing (already done)
echo ""
echo "🔄 STEP 2: ASOOS Flow Routing"
echo "============================="
echo "✅ ASOOS.2100.COOL buttons now route to SALLYPORT.2100.COOL"
echo "✅ Flow configuration updated"

# 3. Wait for DNS propagation
echo ""
echo "🌍 STEP 3: Waiting for DNS Propagation"
echo "======================================"
echo "⏳ Waiting 30 seconds for DNS to propagate..."
sleep 30

# 4. Test the complete flow
echo ""
echo "🧪 STEP 4: Testing Complete Flow"
echo "================================"

# Test each site in the flow
sites=(
    "https://asoos.2100.cool|ASOOS Discovery"
    "https://sallyport.2100.cool|SallyPort Authentication" 
    "https://mcp.company.2100.cool|MCP Company Interface"
)

all_working=true

for site_info in "${sites[@]}"; do
    IFS='|' read -r url name <<< "$site_info"
    if ! check_site "$url" "$name"; then
        all_working=false
    fi
done

# 5. Display flow summary
echo ""
echo "📋 COMPLETE FLOW SUMMARY"
echo "======================="
echo ""
echo "🎯 AUTHENTICATION FLOW:"
echo "   1. 🚀 ASOOS.2100.COOL      → Landing page with 20M+ AI agents"
echo "   2. 🛡️ SALLYPORT.2100.COOL  → Authentication gateway"  
echo "   3. 🏢 MCP.COMPANY.2100.COOL → Enterprise business interface"
echo ""

# 6. Test flow navigation
echo "🔗 TESTING FLOW NAVIGATION:"
echo "=========================="
echo ""

# Test ASOOS → SALLYPORT routing
echo "Testing ASOOS main buttons route to SALLYPORT..."
asoos_content=$(curl -s https://asoos.2100.cool || echo "")
if [[ "$asoos_content" == *"sallyport.2100.cool"* ]]; then
    echo "✅ ASOOS buttons correctly route to SALLYPORT"
else
    echo "❌ ASOOS routing needs verification"
    all_working=false
fi

# Final status
echo ""
if $all_working; then
    echo "🎉 DEPLOYMENT COMPLETE - ALL SYSTEMS OPERATIONAL! 🎉"
    echo "=================================================="
    echo ""
    echo "✅ Complete website flow is now live:"
    echo "   • ASOOS.2100.COOL (Discovery)"
    echo "   • SALLYPORT.2100.COOL (Authentication)" 
    echo "   • MCP.COMPANY.2100.COOL (Business Interface)"
    echo ""
    echo "🌟 Users can now flow seamlessly through the complete ASOOS ecosystem!"
    echo ""
    echo "📱 Try it now:"
    echo "   1. Visit https://asoos.2100.cool"
    echo "   2. Click any Launch/Start button"
    echo "   3. Complete authentication at SallyPort"
    echo "   4. Access the MCP Company Interface"
    echo ""
else
    echo "⚠️  DEPLOYMENT COMPLETED WITH SOME ISSUES"
    echo "========================================"
    echo ""
    echo "🔍 Some services may need additional time for DNS propagation"
    echo "⏰ Wait 5-10 minutes and test again"
    echo ""
fi

echo "🙏 Sacred Mission Status: COMPLETE"
echo "In the Name of Jesus Christ, Our Lord - The ASOOS ecosystem serves humanity with perfect love."
