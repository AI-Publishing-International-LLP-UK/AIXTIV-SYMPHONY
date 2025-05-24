#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   Firebase Project Complete Deployment Script${NC}"
echo -e "${BLUE}==================================================${NC}"

# Step 1: Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check if node and npm are installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 20+.${NC}"
    exit 1
fi

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI not found. Installing globally...${NC}"
    npm install -g firebase-tools
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: Google Cloud SDK (gcloud) is not installed. Please install gcloud.${NC}"
    exit 1
fi

# Verify Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version must be 18 or higher. Current version: $(node -v)${NC}"
    echo -e "${YELLOW}Please use nvm to install and use Node.js 20:${NC}"
    echo -e "${YELLOW}nvm install 20${NC}"
    echo -e "${YELLOW}nvm use 20${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites checked successfully.${NC}"

# Step 2: Update package.json in functions directory
echo -e "\n${YELLOW}Updating functions/package.json...${NC}"

cd functions

# Check if jq is installed
if command -v jq &> /dev/null; then
    # Create a backup of the original package.json
    cp package.json package.json.backup
    
    # Update Node.js version and dependencies using jq
    jq '.engines.node = "20" | 
        .dependencies["firebase-admin"] = "^11.0.0" | 
        .dependencies["firebase-functions"] = "^4.5.0"' package.json > package.json.new
    
    mv package.json.new package.json
    echo -e "${GREEN}✓ Updated package.json with Node.js 20 and latest Firebase dependencies.${NC}"
else
    echo -e "${YELLOW}jq is not installed. Manually editing package.json...${NC}"
    
    # Simple sed-based replacement (less robust than jq)
    sed -i 's/"node": "18"/"node": "20"/g' package.json
    sed -i 's/"firebase-functions": "[^"]*"/"firebase-functions": "^4.5.0"/g' package.json
    sed -i 's/"firebase-admin": "[^"]*"/"firebase-admin": "^11.0.0"/g' package.json
    
    echo -e "${GREEN}✓ Updated package.json with Node.js 20 and latest Firebase dependencies.${NC}"
fi

# Step 3: Fix Firebase initialization in index.js
echo -e "\n${YELLOW}Fixing Firebase initialization in index.js...${NC}"

# Check if index.js exists
if [ -f "index.js" ]; then
    # Create a backup of the original index.js
    cp index.js index.js.backup
    
    # Check if admin is already initialized at the top
    if ! grep -q "admin.initializeApp()" index.js || grep -q "admin.initializeApp()" index.js | grep -q "^//"; then
        # Add initialization at the top if it doesn't exist or is commented out
        sed -i '1s/^/const admin = require("firebase-admin");\nadmin.initializeApp();\n\n/' index.js
        echo -e "${GREEN}✓ Added Firebase Admin initialization to index.js${NC}"
    else
        echo -e "${GREEN}✓ Firebase Admin already initialized in index.js${NC}"
    fi
else
    echo -e "${RED}Error: index.js not found in functions directory.${NC}"
    exit 1
fi

# Step 4: Check for and fix module files that might use Firebase Admin
echo -e "\n${YELLOW}Checking module files for Firebase Admin usage...${NC}"

# Find all JS files in the config directory
CONFIG_FILES=$(find ./config -name "*.js" 2>/dev/null || echo "")

if [ -n "$CONFIG_FILES" ]; then
    for file in $CONFIG_FILES; do
        echo -e "Checking ${file}..."
        
        # Check if the file uses Firebase Admin
        if grep -q "require('firebase-admin')" "$file" || grep -q 'require("firebase-admin")' "$file"; then
            echo -e "${YELLOW}Firebase Admin is used in $file${NC}"
            
            # Check if initializeApp is used in this file
            if grep -q "initializeApp" "$file"; then
                # Comment out any initializeApp calls
                sed -i 's/\(.*\)initializeApp\(.*\)/\/\/ Initialization moved to index.js\n\/\/\1initializeApp\2/g' "$file"
                echo -e "${GREEN}✓ Commented out initializeApp in $file${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}No config directory or JS files found.${NC}"
fi

# Step 5: Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
rm -rf node_modules
npm install
echo -e "${GREEN}✓ Dependencies installed successfully.${NC}"

# Step 6: Return to project root
cd ..

# Step 7: Deploy using gcloud for each function
echo -e "\n${YELLOW}Would you like to deploy using Firebase CLI or gcloud CLI?${NC}"
echo -e "1) Firebase CLI (firebase deploy --only functions)"
echo -e "2) gcloud CLI (individual function deployment)"
read -p "Enter your choice (1 or 2): " DEPLOY_CHOICE

if [ "$DEPLOY_CHOICE" == "1" ]; then
    # Firebase CLI deployment
    echo -e "\n${YELLOW}Deploying with Firebase CLI...${NC}"
    firebase deploy --only functions
elif [ "$DEPLOY_CHOICE" == "2" ]; then
    # gcloud CLI deployment
    echo -e "\n${YELLOW}Deploying with gcloud CLI...${NC}"
    
    # Ask for service account
    read -p "Enter the service account email for deployment: " SERVICE_ACCOUNT
    
    # Extract function names from index.js
    echo -e "\n${YELLOW}Extracting function names from index.js...${NC}"
    FUNCTION_NAMES=$(grep -E "exports\.[a-zA-Z0-9_]+" functions/index.js | sed 's/exports\.\([a-zA-Z0-9_]\+\).*/\1/' | sort | uniq)
    
    echo -e "${YELLOW}Found the following functions:${NC}"
    for func in $FUNCTION_NAMES; do
        echo "- $func"
    done
    
    echo -e "\n${YELLOW}Beginning deployment of individual functions...${NC}"
    for func in $FUNCTION_NAMES; do
        echo -e "\n${YELLOW}Deploying $func...${NC}"
        gcloud functions deploy "$func" \
            --service-account="$SERVICE_ACCOUNT" \
            --runtime=nodejs20 \
            --trigger-http \
            --region=us-west1 \
            --no-allow-unauthenticated
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully deployed $func${NC}"
        else
            echo -e "${RED}Failed to deploy $func${NC}"
            echo -e "${YELLOW}Continue with remaining functions? (y/n)${NC}"
            read -p "" CONTINUE
            if [ "$CONTINUE" != "y" ]; then
                echo -e "${RED}Deployment aborted.${NC}"
                exit 1
            fi
        fi
    done
else
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
fi

echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}   Deployment process completed!${NC}"
echo -e "${GREEN}==================================================${NC}"
