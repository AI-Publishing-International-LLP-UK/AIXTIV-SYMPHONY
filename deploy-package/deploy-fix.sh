#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}          ASOOS DEPLOYMENT SCRIPT - FIXED VERSION        ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Step 1: Fix Firebase credentials
echo -e "${YELLOW}Step 1: Fixing Firebase credentials...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not found. Please install Google Cloud SDK.${NC}"
    exit 1
fi

# Ensure user is logged in
echo -e "${YELLOW}Checking gcloud authentication...${NC}"
gcloud auth list --filter=status:ACTIVE --format="value(account)" || {
    echo -e "${YELLOW}Please login to gcloud:${NC}"
    gcloud auth login
}

# Set the correct project
echo -e "${YELLOW}Setting project to api-for-warp-drive...${NC}"
gcloud config set project api-for-warp-drive

# Get application default credentials
echo -e "${YELLOW}Setting application default credentials...${NC}"
gcloud auth application-default login --no-launch-browser

# Step 2: Fix deployment package
echo -e "${YELLOW}Step 2: Fixing deployment package...${NC}"

# Fix firebase.json if needed
DEPLOY_DIR="/Users/as/asoos/deploy-package"

# Update firebase.json to ensure it's correct
cat > "$DEPLOY_DIR/firebase.json" << EOF
{
  "hosting": [
    {
      "target": "asoos",
      "public": "public/asoos-2100-cool",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ]
    },
    {
      "target": "symphony",
      "public": "public/symphony",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ]
    },
    {
      "target": "anthology",
      "public": "public/anthology",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ]
    }
  ],
  "functions": {
    "source": "functions",
    "region": "us-west1"
  }
}
EOF

# Update the deploy script
cat > "$DEPLOY_DIR/deploy.sh" << EOF
#!/bin/bash

echo "Deploying ASOOS components to Firebase..."

# Install dependencies
cd functions
npm install
cd ..

# Login to Firebase
firebase login --no-localhost

# Create hosting targets if they don't exist
echo "Creating hosting targets..."
firebase use api-for-warp-drive
firebase hosting:sites:create asoos-2100-cool --project api-for-warp-drive || true
firebase hosting:sites:create symphony-asoos-2100 --project api-for-warp-drive || true
firebase hosting:sites:create anthology-asoos-2100 --project api-for-warp-drive || true

firebase target:apply hosting asoos asoos-2100-cool --project api-for-warp-drive
firebase target:apply hosting symphony symphony-asoos-2100 --project api-for-warp-drive
firebase target:apply hosting anthology anthology-asoos-2100 --project api-for-warp-drive

# Deploy to Firebase one component at a time
echo "Deploying functions..."
firebase deploy --only functions --project api-for-warp-drive

echo "Deploying ASOOS main site..."
firebase deploy --only hosting:asoos --project api-for-warp-drive

echo "Deploying Symphony..."
firebase deploy --only hosting:symphony --project api-for-warp-drive

echo "Deploying Anthology..."
firebase deploy --only hosting:anthology --project api-for-warp-drive

echo "All components deployed successfully!"
echo "Access at:"
echo "- Main site: https://asoos-2100-cool.web.app"
echo "- Symphony: https://symphony-asoos-2100.web.app"
echo "- Anthology: https://anthology-asoos-2100.web.app"
EOF

chmod +x "$DEPLOY_DIR/deploy.sh"

# Create domain connection script
cat > "$DEPLOY_DIR/connect-domains.js" << EOF
#!/usr/bin/env node

/**
 * Connect all subdomains to asoos.2100.cool
 */
const { execSync } = require('child_process');

// Connect subdomains
function connectSubdomains() {
  try {
    console.log('Connecting subdomains to asoos.2100.cool...');
    
    // Add ASOOS main domain
    console.log('\\nConnecting main domain...');
    const mainOutput = execSync('node /Users/as/asoos/2100-cool-subdomain-manager.js --add main').toString();
    console.log(mainOutput);
    
    // Add Symphony subdomain
    console.log('\\nConnecting symphony subdomain...');
    const symphonyOutput = execSync('node /Users/as/asoos/2100-cool-subdomain-manager.js --add symphony').toString();
    console.log(symphonyOutput);
    
    // Add Anthology subdomain
    console.log('\\nConnecting anthology subdomain...');
    const anthologyOutput = execSync('node /Users/as/asoos/2100-cool-subdomain-manager.js --add anthology').toString();
    console.log(anthologyOutput);
    
    console.log('\\nAll domains connected successfully!');
    console.log('Your sites are now available at:');
    console.log('- https://asoos.2100.cool');
    console.log('- https://symphony.asoos.2100.cool');
    console.log('- https://anthology.asoos.2100.cool');
  } catch (error) {
    console.error('Error connecting domains:', error.message);
  }
}

connectSubdomains();
EOF

chmod +x "$DEPLOY_DIR/connect-domains.js"

echo -e "${GREEN}✓ Deployment package fixed${NC}"

# Step 3: Deploy
echo -e "${BLUE}Do you want to deploy now? (y/n)${NC}"
read -p "" DEPLOY_NOW

if [[ $DEPLOY_NOW == "y" || $DEPLOY_NOW == "Y" ]]; then
    echo -e "${YELLOW}Starting deployment...${NC}"
    cd "$DEPLOY_DIR" && ./deploy.sh
    
    echo -e "${BLUE}Do you want to connect domains now? (y/n)${NC}"
    read -p "" CONNECT_NOW
    
    if [[ $CONNECT_NOW == "y" || $CONNECT_NOW == "Y" ]]; then
        echo -e "${YELLOW}Connecting domains...${NC}"
        node "$DEPLOY_DIR/connect-domains.js"
    fi
fi

echo -e "${BLUE}=========================================================${NC}"
echo -e "${GREEN}ASOOS deployment fix completed!${NC}"
echo -e "${BLUE}=========================================================${NC}">