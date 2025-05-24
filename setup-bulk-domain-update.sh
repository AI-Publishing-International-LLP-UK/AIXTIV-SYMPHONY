#!/bin/bash
# Setup script for bulk domain update functionality

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
FIREBASE_PROJECT="api-for-warp-drive"
EXCLUDED_DOMAINS="philliproark.com,byfabriziodesign.com,kennedypartain.com,2100.group,fabriziosassano.com"

# Print header
echo -e "${BOLD}=== Setting up bulk domain update for Firebase hosting ===${NC}"
echo "$(date)"
echo

# Check if required tools are installed
echo -e "${BLUE}Checking required tools...${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js is installed${NC}"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm is installed${NC}"

# Check for firebase CLI
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️ Firebase CLI is not installed, attempting to install...${NC}"
    npm install -g firebase-tools
    
    if ! command -v firebase &> /dev/null; then
        echo -e "${RED}❌ Failed to install Firebase CLI. Please install it manually and try again.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Firebase CLI is installed${NC}"

# Check for gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install the Google Cloud SDK and try again.${NC}"
    echo -e "${YELLOW}Visit: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi
echo -e "${GREEN}✓ gcloud CLI is installed${NC}"

# Check if required Node.js packages are installed
echo
echo -e "${BLUE}Installing required Node.js packages...${NC}"
npm install axios dns fs-extra path util

# Authenticate with Google Cloud if needed
echo
echo -e "${BLUE}Authenticating with Google Cloud...${NC}"
if ! gcloud auth list 2>&1 | grep -q "ACTIVE"; then
    echo -e "${YELLOW}Not logged in to gcloud, initiating login...${NC}"
    gcloud auth login
else
    echo -e "${GREEN}✓ Already authenticated with Google Cloud${NC}"
fi

# Set Google Cloud project
echo
echo -e "${BLUE}Setting Google Cloud project to ${FIREBASE_PROJECT}...${NC}"
gcloud config set project ${FIREBASE_PROJECT}

# Initialize Firebase project if needed
echo
echo -e "${BLUE}Initializing Firebase project...${NC}"
if [ ! -f ".firebaserc" ]; then
    echo -e "${YELLOW}No .firebaserc found, initializing Firebase project...${NC}"
    firebase init hosting
else
    echo -e "${GREEN}✓ Firebase project already initialized${NC}"
fi

# Update the Firebase project
echo
echo -e "${BLUE}Setting Firebase project to ${FIREBASE_PROJECT}...${NC}"
firebase use ${FIREBASE_PROJECT}

# Check if GoDaddy credentials exist
echo
echo -e "${BLUE}Checking GoDaddy API credentials...${NC}"
if [ ! -f ".godaddy-credentials.json" ]; then
    echo -e "${YELLOW}⚠️ GoDaddy credentials not found at .godaddy-credentials.json${NC}"
    
    # Check if credentials exist in domain-management/.env
    if [ -f "domain-management/.env" ]; then
        echo -e "${YELLOW}Found domain-management/.env, extracting credentials...${NC}"
        
        API_KEY=$(grep -o 'GODADDY_API_KEY=[^ ]*' domain-management/.env | cut -d'=' -f2)
        API_SECRET=$(grep -o 'GODADDY_API_SECRET=[^ ]*' domain-management/.env | cut -d'=' -f2)
        
        if [ -n "$API_KEY" ] && [ -n "$API_SECRET" ]; then
            echo -e "Creating .godaddy-credentials.json with extracted credentials..."
            cat > .godaddy-credentials.json << EOF
{
  "apiKey": "${API_KEY}",
  "apiSecret": "${API_SECRET}"
}
EOF
            echo -e "${GREEN}✓ GoDaddy credentials created successfully${NC}"
        else
            echo -e "${RED}❌ Could not extract GoDaddy API credentials from domain-management/.env${NC}"
            echo -e "${YELLOW}Please create .godaddy-credentials.json manually with your GoDaddy API credentials:${NC}"
            echo -e '{
  "apiKey": "YOUR_API_KEY",
  "apiSecret": "YOUR_API_SECRET"
}'
            exit 1
        fi
    else
        echo -e "${RED}❌ GoDaddy credentials not found and domain-management/.env does not exist${NC}"
        echo -e "${YELLOW}Please create .godaddy-credentials.json manually with your GoDaddy API credentials:${NC}"
        echo -e '{
  "apiKey": "YOUR_API_KEY",
  "apiSecret": "YOUR_API_SECRET"
}'
        exit 1
    fi
else
    echo -e "${GREEN}✓ GoDaddy credentials found at .godaddy-credentials.json${NC}"
fi

# Update the Aixtiv CLI for domain management
echo
echo -e "${BLUE}Updating Aixtiv CLI for domain management...${NC}"
node update-aixtiv-cli.js

# Run the bulk update script for testing
echo
echo -e "${BLUE}Running bulk update script in test mode (no changes will be made)...${NC}"
node bulk-update-domains.js --test

echo
echo -e "${BOLD}=== Setup completed successfully ===${NC}"
echo
echo -e "${BOLD}Next steps:${NC}"
echo -e "1. Run bulk domain update for all domains (excluding the specified domains):"
echo -e "   ${YELLOW}node bulk-update-domains.js${NC}"
echo
echo -e "2. Verify DNS propagation (after running the update):"
echo -e "   ${YELLOW}node bulk-update-domains.js --verify${NC}"
echo
echo -e "3. Use the Aixtiv CLI for domain management:"
echo -e "   ${YELLOW}aixtiv domain update-firebase --exclude=${EXCLUDED_DOMAINS}${NC}"
echo -e "   ${YELLOW}aixtiv domain connect-firebase example.com${NC}"
echo -e "   ${YELLOW}aixtiv domain verify example.com VERIFICATION_CODE${NC}"
echo -e "   ${YELLOW}aixtiv domain status example.com${NC}"
echo
echo -e "${BOLD}For more information, see the documentation:${NC}"
echo -e "- Bulk domain update script: bulk-update-domains.js"
echo -e "- Aixtiv CLI update script: update-aixtiv-cli.js"
echo -e "- Domain management commands: aixtiv-cli/commands/domain.js"
echo
echo -e "${GREEN}Happy domain management!${NC}"