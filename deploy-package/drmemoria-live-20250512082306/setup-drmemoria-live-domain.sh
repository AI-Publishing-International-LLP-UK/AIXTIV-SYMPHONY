#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     CONNECTING DR.MEMORIA.LIVE DOMAIN TO FIREBASE        ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Step 1: Connect custom domain to Firebase hosting
echo -e "${YELLOW}Step 1: Connecting drmemoria.live to Firebase hosting...${NC}"
firebase hosting:sites:update drmemoria-live --project api-for-warp-drive
firebase hosting:sites:update drmemoria-live --set-domain drmemoria.live --project api-for-warp-drive

# Step 2: Output results and next steps
echo -e "${GREEN}✅ Domain connection initiated!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Configure DNS records for drmemoria.live as shown above"
echo -e "2. Wait for DNS propagation (may take 24-48 hours)"
echo -e "3. Firebase will automatically provision SSL certificates"
echo -e "4. Once complete, your site will be available at https://drmemoria.live"

echo -e "${BLUE}=========================================================${NC}"
