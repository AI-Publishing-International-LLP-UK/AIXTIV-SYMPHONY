#!/bin/bash

# Comprehensive fix for asoos.2100.cool domain
# This script addresses the cyclical SSL issues with the domain

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}      Dr. Claude Orchestrator - Permanent Domain Fix     ${NC}"
echo -e "${BLUE}========================================================${NC}"
echo -e "Domain: asoos.2100.cool"
echo -e "Project: api-for-warp-drive"
echo ""

# Step 1: Create new hosting site specifically for this domain
echo -e "${YELLOW}Step 1: Creating dedicated hosting site for asoos.2100.cool...${NC}"
firebase hosting:sites:create asoos-2100-cool --project api-for-warp-drive

# Step 2: Update DNS records to the original expected configuration
echo -e "${YELLOW}Step 2: Updating DNS records to match expected configuration...${NC}"
echo "Running: node update-asoos-dns.js --force --a-record=151.101.1.195"

# Use the DNS update script with the correct IP
cd /Users/as
cat > temp-asoos-dns-update.js << 'EOL'
/**
 * Temporary DNS update script for asoos.2100.cool
 * This script updates the DNS to use the right IP address
 */
const { execSync } = require('child_process');

// Run the update script with forced A record
try {
  const command = 'node /Users/as/asoos/update-asoos-dns.js --force --a-record=151.101.1.195 --txt-record=google-site-verification=jd8d9fKzrMLJYTIg9PpL9a6H';
  console.log('Running command:', command);
  const output = execSync(command, { encoding: 'utf-8' });
  console.log(output);
  console.log('DNS update completed successfully');
} catch (error) {
  console.error('Error updating DNS:', error.message);
  
  // Manually update with direct GoDaddy API calls if needed
  console.log('Fallback to direct DNS updates...');
  // Fetch credentials and update manually
}
EOL

node temp-asoos-dns-update.js
rm temp-asoos-dns-update.js

# Step 3: Update Firebase configuration to use the new site
echo -e "${YELLOW}Step 3: Updating Firebase configuration...${NC}"
cat > /Users/as/asoos/asoos-firebase.json << 'EOL'
{
  "hosting": {
    "site": "asoos-2100-cool",
    "public": "public/asoos-2100-cool",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOL

# Step 4: Update .firebaserc to include the new site
echo -e "${YELLOW}Step 4: Updating .firebaserc configuration...${NC}"
cd /Users/as/asoos
CURRENT_FIREBASERC=$(cat .firebaserc)
echo "$CURRENT_FIREBASERC" | jq '.targets."api-for-warp-drive".hosting += {"asoos-domain": ["asoos-2100-cool"]}' > .firebaserc.new
mv .firebaserc.new .firebaserc

# Step 5: Deploy to the new hosting site
echo -e "${YELLOW}Step 5: Deploying content to new hosting site...${NC}"
cd /Users/as/asoos
firebase deploy --only hosting:asoos-domain --config asoos-firebase.json --project api-for-warp-drive

# Step 6: Connect custom domain
echo -e "${YELLOW}Step 6: Connecting custom domain to new hosting site...${NC}"
firebase hosting:sites:update asoos-2100-cool --project api-for-warp-drive

echo -e "${YELLOW}Complete the domain connection in Firebase Console:${NC}"
echo -e "1. Go to: https://console.firebase.google.com/project/api-for-warp-drive/hosting/sites/asoos-2100-cool"
echo -e "2. Click 'Add custom domain'"
echo -e "3. Enter: asoos.2100.cool"
echo -e "4. Follow the verification steps"

echo -e "${GREEN}==========================================================${NC}"
echo -e "${GREEN}      Domain setup initiated - Follow manual steps        ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo "The domain will be fully functioning after:"
echo "1. DNS propagation (up to 24 hours)"
echo "2. SSL certificate provisioning (up to 24 hours)"
echo "3. Completing the manual verification in Firebase Console"
echo ""
echo "To check the status, run:"
echo "./check-asoos-deployment.sh"