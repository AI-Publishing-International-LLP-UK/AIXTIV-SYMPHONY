#!/bin/bash

# Fix for asoos.2100.cool domain using proper hosting targets
# This script addresses the cyclical SSL issues while respecting the hosting group structure

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}      Dr. Claude Orchestrator - Domain Target Fix        ${NC}"
echo -e "${BLUE}========================================================${NC}"
echo -e "Domain: asoos.2100.cool"
echo -e "Project: api-for-warp-drive"
echo ""

# Step 1: Update DNS records to the original expected configuration
echo -e "${YELLOW}Step 1: Updating DNS records to match expected configuration...${NC}"
echo "Running: Update DNS with the correct Firebase IP"

# Use the DNS update script with the correct IP
cd /Users/as/asoos
node update-asoos-dns.js --force --a-record=199.36.158.100

# Step 2: Verify firebase configuration
echo -e "${YELLOW}Step 2: Verifying Firebase configuration...${NC}"
firebase use api-for-warp-drive
firebase target:apply hosting asoos 2100-cool

# Step 3: Deploy to the hosting target
echo -e "${YELLOW}Step 3: Deploying content to hosting target...${NC}"
firebase deploy --only hosting:asoos --project api-for-warp-drive

# Step 4: Clear Firebase DNS cache (helps with domain reconnection)
echo -e "${YELLOW}Step 4: Force Firebase to clear domain cache...${NC}"
echo "Removing the domain verification in Firebase Console will force a refresh"
echo "This needs to be done manually in the Firebase Console"

# Step 5: Connect custom domain again
echo -e "${YELLOW}Step 5: Reconnect custom domain to hosting target...${NC}"
echo "In the Firebase Console:"
echo "1. Go to: https://console.firebase.google.com/project/api-for-warp-drive/hosting/sites/2100-cool"
echo "2. Remove the asoos.2100.cool domain if it exists (to force a refresh)"
echo "3. Click 'Add custom domain'"
echo "4. Enter: asoos.2100.cool"
echo "5. Follow the verification steps"
echo "6. When asked for DNS verification, the TXT record should already be in place"

# Step 6: Generate verification helper (in case manual verification is needed)
echo -e "${YELLOW}Step 6: Generating verification helper...${NC}"
cat > asoos-verification-helper.js << 'EOL'
/**
 * Helper script to add verification TXT record for asoos.2100.cool
 * Run this with the verification code from Firebase
 * Example: node asoos-verification-helper.js firebase-verification-code-123456
 */
const { execSync } = require('child_process');

const verificationCode = process.argv[2];
if (!verificationCode) {
  console.error('Please provide the verification code from Firebase');
  console.error('Usage: node asoos-verification-helper.js [verification-code]');
  process.exit(1);
}

try {
  console.log(`Adding TXT verification record: ${verificationCode}`);
  const command = `node update-asoos-dns.js "${verificationCode}"`;
  const output = execSync(command, { encoding: 'utf-8' });
  console.log(output);
  console.log('Verification TXT record added successfully');
} catch (error) {
  console.error('Error adding verification record:', error.message);
}
EOL

chmod +x asoos-verification-helper.js

echo -e "${GREEN}==========================================================${NC}"
echo -e "${GREEN}      Domain fix initiated - Complete manual steps        ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo "If Firebase requires a new verification code:"
echo "1. Get the verification code from Firebase Console"
echo "2. Run: node asoos-verification-helper.js [verification-code]"
echo ""
echo "The domain will be fully functioning after:"
echo "1. DNS propagation (up to 24 hours)"
echo "2. SSL certificate provisioning (up to 24 hours)"
echo "3. Completing the manual verification in Firebase Console"
echo ""
echo "To check the status, run:"
echo "./check-asoos-deployment.sh"