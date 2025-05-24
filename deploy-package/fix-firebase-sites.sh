#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}          FIXING FIREBASE HOSTING SITES                  ${NC}"
echo -e "${BLUE}=========================================================${NC}"

echo -e "${YELLOW}Fixing hosting site issues...${NC}"

# Stop any running processes
pkill -f "node.*app.js" || true

# Step 1: Create sites with generated names
echo -e "${YELLOW}Step 1: Creating hosting sites with generated names...${NC}"

# Create firebase.json with random site IDs
TIMESTAMP=$(date +%Y%m%d%H%M%S)
SYMPHONY_SITE="symphony-asoos-${TIMESTAMP}"
ANTHOLOGY_SITE="anthology-asoos-${TIMESTAMP}"

cat > firebase.json << EOF
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

# Create .firebaserc
cat > .firebaserc << EOF
{
  "projects": {
    "default": "api-for-warp-drive"
  },
  "targets": {
    "api-for-warp-drive": {
      "hosting": {
        "asoos": [
          "asoos-2100-cool"
        ],
        "symphony": [
          "${SYMPHONY_SITE}"
        ],
        "anthology": [
          "${ANTHOLOGY_SITE}"
        ]
      }
    }
  }
}
EOF

# Create hosting sites with unique names
echo -e "${YELLOW}Creating hosting sites with unique names...${NC}"
firebase use api-for-warp-drive

echo -e "${YELLOW}Creating Symphony site: ${SYMPHONY_SITE}${NC}"
firebase hosting:sites:create ${SYMPHONY_SITE} --project api-for-warp-drive || true

echo -e "${YELLOW}Creating Anthology site: ${ANTHOLOGY_SITE}${NC}"
firebase hosting:sites:create ${ANTHOLOGY_SITE} --project api-for-warp-drive || true

echo -e "${YELLOW}Applying hosting targets...${NC}"
firebase target:apply hosting symphony ${SYMPHONY_SITE} --project api-for-warp-drive
firebase target:apply hosting anthology ${ANTHOLOGY_SITE} --project api-for-warp-drive

# Step 2: Deploy Symphony and Anthology
echo -e "${YELLOW}Step 2: Deploying Symphony and Anthology...${NC}"

echo -e "${YELLOW}Deploying Symphony...${NC}"
firebase deploy --only hosting:symphony --project api-for-warp-drive

echo -e "${YELLOW}Deploying Anthology...${NC}"
firebase deploy --only hosting:anthology --project api-for-warp-drive

# Step 3: Update domain connection script
echo -e "${YELLOW}Step 3: Updating domain connection script...${NC}"

cat > connect-domains.js << EOF
#!/usr/bin/env node

/**
 * Connect all subdomains to asoos.2100.cool
 */
const { execSync } = require('child_process');

// Connect subdomains
function connectSubdomains() {
  try {
    console.log('Connecting subdomains to asoos.2100.cool...');
    
    // Add Symphony domain with specific site
    console.log('\\nConnecting symphony subdomain...');
    const symphonyCommand = 'node /Users/as/asoos/2100-cool-subdomain-manager.js --add symphony --site ${SYMPHONY_SITE}';
    console.log('Running:', symphonyCommand);
    const symphonyOutput = execSync(symphonyCommand).toString();
    console.log(symphonyOutput);
    
    // Add Anthology domain with specific site
    console.log('\\nConnecting anthology subdomain...');
    const anthologyCommand = 'node /Users/as/asoos/2100-cool-subdomain-manager.js --add anthology --site ${ANTHOLOGY_SITE}';
    console.log('Running:', anthologyCommand);
    const anthologyOutput = execSync(anthologyCommand).toString();
    console.log(anthologyOutput);
    
    console.log('\\nAll domains connected successfully!');
    console.log('Your sites are now available at:');
    console.log('- https://asoos.2100.cool (already connected)');
    console.log('- https://symphony.asoos.2100.cool');
    console.log('- https://anthology.asoos.2100.cool');
  } catch (error) {
    console.error('Error connecting domains:', error.message);
  }
}

connectSubdomains();
EOF

chmod +x connect-domains.js

echo -e "${GREEN}✓ Firebase hosting configuration fixed!${NC}"
echo -e "${YELLOW}Symphony site ID: ${SYMPHONY_SITE}${NC}"
echo -e "${YELLOW}Anthology site ID: ${ANTHOLOGY_SITE}${NC}"

echo -e "${BLUE}Do you want to connect domains now? (y/n)${NC}"
read -p "" CONNECT_NOW

if [[ $CONNECT_NOW == "y" || $CONNECT_NOW == "Y" ]]; then
    echo -e "${YELLOW}Connecting domains...${NC}"
    node connect-domains.js
fi

echo -e "${BLUE}=========================================================${NC}"
echo -e "${GREEN}Firebase hosting sites fixed!${NC}"
echo -e "${BLUE}=========================================================${NC}"