#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     DEPLOYING DR. MEMORIA'S ANTHOLOGY TO FIREBASE        ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install --prefix functions

# Step 2: Create Firebase hosting site if it doesn't exist
echo -e "${YELLOW}Step 2: Ensuring Firebase hosting site exists...${NC}"
firebase hosting:sites:create drmemoria-live --project api-for-warp-drive || true

# Step 3: Deploy to Firebase
echo -e "${YELLOW}Step 3: Deploying to Firebase...${NC}"
firebase deploy --only hosting:anthology --project api-for-warp-drive

# Step 4: Output results
echo -e "${GREEN}✅ Dr. Memoria's Anthology has been deployed!${NC}"
echo -e "${YELLOW}Your site is now available at:${NC}"
echo -e "  - https://drmemoria-live.web.app"
echo -e "  - https://drmemoria-live.firebaseapp.com"

echo -e "${BLUE}=========================================================${NC}"
