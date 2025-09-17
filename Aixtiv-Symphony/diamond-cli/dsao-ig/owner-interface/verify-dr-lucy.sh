#!/bin/bash

# Quick verification script for Dr. Lucy GCP access
echo "🔍 Verifying Dr. Lucy's GCP conversation access..."
echo "=============================================="

PROJECT_ID="api-for-warp-drive"

# Check if Node.js verification script exists and run it
if [ -f "verify-dr-lucy-gcp-access.js" ]; then
    echo "📋 Running comprehensive verification..."
    node verify-dr-lucy-gcp-access.js
else
    echo "⚡ Running quick GCP secret verification..."
    
    # Check each Dr. Lucy secret
    secrets=(
        "dr-lucy-conversation-history"
        "dr-lucy-knowledge-base"
        "dr-lucy-flight-memory"
        "claude-ai-conversation-history"
        "chatgpt-conversation-vectors"
        "openai-conversation-history"
        "dr-lucy-credentials"
        "openai-api-key"
        "elevenlabs-api-key"
        "anthropic-api-key"
    )
    
    accessible_count=0
    total_count=${#secrets[@]}
    
    for secret in "${secrets[@]}"; do
        if gcloud secrets describe "$secret" --quiet 2>/dev/null; then
            echo "✅ $secret: Accessible"
            ((accessible_count++))
        else
            echo "❌ $secret: Not found or inaccessible"
        fi
    done
    
    echo ""
    echo "📊 Summary: $accessible_count/$total_count secrets accessible"
    
    percentage=$((accessible_count * 100 / total_count))
    
    if [ $percentage -ge 80 ]; then
        echo "🎉 EXCELLENT: Dr. Lucy has full access to conversations and knowledge from GCP"
    elif [ $percentage -ge 60 ]; then
        echo "✅ GOOD: Most Dr. Lucy data is accessible"
    elif [ $percentage -ge 40 ]; then
        echo "⚠️  LIMITED: Dr. Lucy has partial access - some features may not work"
    else
        echo "❌ FAILED: Dr. Lucy access is severely limited"
    fi
fi

echo ""
echo "🚀 To run full verification: node verify-dr-lucy-gcp-access.js"
echo "🔧 To set up secrets: ./setup-gcp-secrets.sh"
echo "=============================================="
