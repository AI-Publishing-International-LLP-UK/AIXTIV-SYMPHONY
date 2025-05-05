#!/bin/bash

# Exit on error
set -e

echo "=== Starting Focused Deployment ==="
echo "Timestamp: $(date)"

# Set variables
PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
SERVICE_NAME="asoos-api"

# Ensure we're using the correct project
echo "=== Setting active project ==="
gcloud config set project $PROJECT_ID

# Check basic requirements
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Deployment aborted."
  exit 1
fi

if [ ! -f "server.js" ]; then
  echo "Error: server.js not found. Deployment aborted."
  exit 1
fi

if [ ! -f "Dockerfile" ]; then
  echo "Error: Dockerfile not found. Deployment aborted."
  exit 1
fi

# Create a minimal deployment with just the essential files
echo "=== Creating minimal deployment folder ==="
DEPLOY_DIR=$(mktemp -d)
echo "Deployment directory: $DEPLOY_DIR"

# Copy only essential files
cp package.json $DEPLOY_DIR/
cp server.js $DEPLOY_DIR/
cp Dockerfile $DEPLOY_DIR/
mkdir -p $DEPLOY_DIR/public

# Create a simple index.html if it doesn't exist
if [ ! -f "public/index.html" ]; then
  echo "=== Creating simple index.html ==="
  cat > $DEPLOY_DIR/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASOOS API - Secret Management System</title>
    <style>
        body {
            font-family: -apple-system, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #2c3e50; }
        .api-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>ASOOS API - Secret Management System</h1>
    <p>Welcome to the ASOOS API server for secret management.</p>
    
    <div class="api-box">
        <h2>API Endpoints</h2>
        <ul>
            <li><a href="/api/health">/api/health</a> - Health check</li>
            <li><a href="/api/status">/api/status</a> - Status info</li>
            <li><a href="/docs">/docs</a> - API Documentation</li>
        </ul>
    </div>
</body>
</html>
EOF
else
  cp -r public/* $DEPLOY_DIR/public/
fi

# Deploy directly from the temp directory
echo "=== Deploying to Cloud Run ==="
(cd $DEPLOY_DIR && gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080)

echo "=== Deployment completed ==="
echo "Your application should be available at the URL shown above."
echo "Deployment completed at: $(date)"