#!/bin/bash

echo "🔐 Starting ASOOS Integration Gateway with OAuth2 configuration..."

# Set OAuth2 environment variables
export USE_OAUTH2=true
export OAUTH_MODE=true
export NODE_ENV=production
export PORT=8080

# Validate OAuth secrets are available
echo "✅ OAuth2 mode enabled"
echo "✅ Node.js version: $(node --version)"
echo "✅ Working directory: $(pwd)"

# Check if secrets are mounted (in Cloud Run, they'll be available as env vars)
if [ -n "$OAUTH_CLIENT_ID" ]; then
    echo "✅ OAuth Client ID available"
else
    echo "⚠️ OAuth Client ID not found"
fi

if [ -n "$OAUTH_CLIENT_SECRET" ]; then
    echo "✅ OAuth Client Secret available"
else
    echo "⚠️ OAuth Client Secret not found"
fi

# Start the application with error handling
echo "🚀 Starting server with OAuth2 authentication..."
node server.js
