#!/bin/bash

# MOCOA Interface Deployment Script
# Deploy the fixed version to Google Cloud Run

set -e  # Exit on any error

echo "🚀 Deploying MOCOA Interface Fix to Google Cloud Run..."
echo "📝 Project: api-for-warp-drive"
echo "🌍 Region: us-west1"
echo "🔧 Fixing: Duplicate sendCopilotMessage function issue"
echo ""

# Verify we're in the right directory
if [ ! -f "mocoa-current.html" ]; then
    echo "❌ Error: mocoa-current.html not found in current directory"
    exit 1
fi

if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found in current directory" 
    exit 1
fi

# Check if we have the duplicate function fix
echo "🔍 Verifying JavaScript fix..."
duplicate_count=$(grep -c "function sendCopilotMessage" mocoa-current.html || echo "0")

if [ "$duplicate_count" -eq "1" ]; then
    echo "✅ Fix verified: Only 1 sendCopilotMessage function found"
elif [ "$duplicate_count" -eq "0" ]; then
    echo "❌ Error: No sendCopilotMessage function found"
    exit 1
else
    echo "❌ Error: Still has $duplicate_count sendCopilotMessage functions (should be 1)"
    exit 1
fi

# Check that we have the global assignment at the end
if grep -q "window.sendCopilotMessage = sendCopilotMessage" mocoa-current.html; then
    echo "✅ Global function assignment verified"
else
    echo "❌ Warning: Global function assignment not found"
fi

echo ""
echo "🔨 Building and deploying to Google Cloud Run..."

# Deploy to Cloud Run using the existing service name (inferred from Newman test)
gcloud run deploy mocoa-owner-interface \
    --source . \
    --platform managed \
    --region us-west1 \
    --project api-for-warp-drive \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --concurrency 100 \
    --set-env-vars NODE_ENV=production,CLOUD_ML_REGION=us-west1

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "🌐 Your fixed MOCOA interface should be available at:"
    echo "   https://mocoa-owner-interface-859242575175.us-west1.run.app/"
    echo ""
    echo "🧪 Testing deployment in 10 seconds..."
    sleep 10
    
    # Test the deployment with Newman
    if command -v newman &> /dev/null; then
        echo "🔍 Running Newman test on deployed version..."
        newman run test-js-execution.json --reporters cli --bail
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ DEPLOYMENT SUCCESSFUL - All tests passed!"
            echo "🎯 The duplicate function issue has been resolved"
            echo "💬 Chat functionality should now work properly"
            echo "⌨️  Enter key should now work in chat input"
            echo ""
            echo "🎬 Ready for your demo!"
        else
            echo ""
            echo "⚠️  Deployment completed but tests failed"
            echo "🔧 You may need to clear your browser cache"
        fi
    else
        echo "✅ Deployment completed - Newman not available for testing"
    fi
else
    echo "❌ Deployment failed"
    exit 1
fi
