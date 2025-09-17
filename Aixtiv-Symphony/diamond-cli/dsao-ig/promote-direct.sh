#!/bin/bash

# Direct Cloudflare API promotion script
# Promotes deployment 554e2c69-47c4-4fdb-9406-0be9c4ff4096 to production

ACCOUNT_ID="aef30d920913c188b9b6048cc7f42951"
PROJECT_NAME="2100-cool-primary"
DEPLOYMENT_ID="554e2c69-47c4-4fdb-9406-0be9c4ff4096"

echo "🚀 Direct API promotion of deployment $DEPLOYMENT_ID"
echo "📡 Using OAuth authentication from wrangler session..."

# Try to use wrangler's internal authentication
# Method 1: Use wrangler to make the API call
echo "🔑 Attempting wrangler-based API call..."

# The API endpoint for promoting a deployment
API_URL="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments/$DEPLOYMENT_ID"

# Try using curl with wrangler's authentication context
# This approach leverages the fact that wrangler is already authenticated
echo "📞 Making direct API call to promote deployment..."

# Method: Direct API call with manual token (you'd need to provide this)
echo "⚠️  Manual API token required for direct promotion."
echo "💡 To get your API token:"
echo "   1. Go to https://dash.cloudflare.com/profile/api-tokens"
echo "   2. Create token with 'Cloudflare Pages:Edit' permissions"
echo "   3. Run: export CLOUDFLARE_API_TOKEN='your-token'"
echo "   4. Then run this script again"

if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    echo "🔑 Found API token, attempting promotion..."
    
    RESPONSE=$(curl -s -X PATCH "$API_URL" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"deployment_trigger":{"type":"production_promotion"}}')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "🎉 SUCCESS! Deployment promoted to production!"
        echo "🌐 https://2100.cool should now serve deployment $DEPLOYMENT_ID"
        echo "🔓 Next: Remove Cloudflare Access protection"
    else
        echo "❌ API call failed:"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    fi
else
    echo "❌ No API token found in environment"
    echo "💡 Alternative: Manual promotion via Cloudflare Dashboard"
    echo "   https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME/$DEPLOYMENT_ID"
fi
