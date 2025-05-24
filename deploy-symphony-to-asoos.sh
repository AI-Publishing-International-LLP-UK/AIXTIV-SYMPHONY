#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Preparing to deploy Symphony to asoos.2100.cool...${NC}"

# Check if symphony_local directory exists
if [ ! -d "/Users/as/symphony_local" ]; then
    echo -e "${RED}Symphony Local Environment not found at /Users/as/symphony_local${NC}"
    exit 1
fi

# Check if frontend and API are configured
if [ ! -d "/Users/as/symphony_local/frontend" ] || [ ! -d "/Users/as/symphony_local/api" ]; then
    echo -e "${RED}Symphony frontend or API directories not found.${NC}"
    echo -e "${YELLOW}Please ensure the local environment is fully set up first.${NC}"
    exit 1
fi

# Create a deployment package
DEPLOY_DIR="/Users/as/asoos/symphony_deploy_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy the frontend
echo -e "${YELLOW}Preparing frontend for deployment...${NC}"
mkdir -p "$DEPLOY_DIR/public/symphony-frontend"
cp -r /Users/as/symphony_local/frontend/build/* "$DEPLOY_DIR/public/symphony-frontend/" 2>/dev/null || cp -r /Users/as/symphony_local/frontend/dist/* "$DEPLOY_DIR/public/symphony-frontend/" 2>/dev/null || cp -r /Users/as/symphony_local/frontend/* "$DEPLOY_DIR/public/symphony-frontend/" 2>/dev/null

# Copy the API
echo -e "${YELLOW}Preparing API for deployment...${NC}"
mkdir -p "$DEPLOY_DIR/functions/symphony-api"
cp -r /Users/as/symphony_local/api/* "$DEPLOY_DIR/functions/symphony-api/" 2>/dev/null

# Create firebase.json configuration
cat > "$DEPLOY_DIR/firebase.json" << EOF
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "symphonyApi"
      },
      {
        "source": "**",
        "destination": "/symphony-frontend/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
EOF

# Create API wrapper function
mkdir -p "$DEPLOY_DIR/functions"
cat > "$DEPLOY_DIR/functions/index.js" << EOF
const functions = require('firebase-functions');
const symphonyApp = require('./symphony-api/index.js');

// Expose the Symphony API as a Firebase Function
exports.symphonyApi = functions
  .region('us-west1')
  .https.onRequest(symphonyApp);
EOF

# Create a package.json for functions
cat > "$DEPLOY_DIR/functions/package.json" << EOF
{
  "name": "symphony-api-functions",
  "version": "1.0.0",
  "description": "Firebase Functions for Symphony API",
  "main": "index.js",
  "engines": {
    "node": "18"
  },
  "dependencies": {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1"
  },
  "private": true
}
EOF

# Create deployment instructions
cat > "$DEPLOY_DIR/DEPLOY.md" << EOF
# Symphony Deployment to asoos.2100.cool

This package contains the Symphony environment prepared for deployment to asoos.2100.cool.

## Deployment Steps

1. Copy this directory to your Firebase project folder:
   \`\`\`
   cp -r * /path/to/firebase/project/
   \`\`\`

2. Install dependencies:
   \`\`\`
   cd functions
   npm install
   \`\`\`

3. Deploy to Firebase:
   \`\`\`
   firebase use api-for-warp-drive
   firebase deploy --only hosting,functions
   \`\`\`

4. Connect the custom domain:
   \`\`\`
   node /Users/as/asoos/2100-cool-subdomain-manager.js --add symphony
   \`\`\`

5. Access the deployed application at:
   - https://symphony.asoos.2100.cool
EOF

echo -e "${GREEN}Deployment package created at: $DEPLOY_DIR${NC}"
echo -e "${YELLOW}See $DEPLOY_DIR/DEPLOY.md for deployment instructions.${NC}"