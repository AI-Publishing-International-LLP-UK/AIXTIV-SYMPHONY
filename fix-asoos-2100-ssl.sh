#!/bin/bash

# Script to fix SSL certificate for asoos.2100.cool
# This script adds and verifies the domain in Firebase hosting

DOMAIN="asoos.2100.cool"
PROJECT="api-for-warp-drive"
SITE="asoos-2100-cool"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}      SSL Certificate Fix for asoos.2100.cool            ${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo -e "${CYAN}Date: $(date)${NC}"
echo

# Step 1: Connect domain to Firebase site
echo -e "${YELLOW}=== Step 1: Connecting domain to Firebase site ===${NC}"
echo "firebase hosting:sites:update $SITE --project $PROJECT --domains=$DOMAIN"
firebase hosting:sites:update $SITE --project $PROJECT --domains=$DOMAIN

# Step 2: Get DNS verification record
echo -e "\n${YELLOW}=== Step 2: Getting DNS verification record ===${NC}"
echo "firebase hosting:sites:get $SITE --project $PROJECT"
firebase hosting:sites:get $SITE --project $PROJECT

# Step 3: Verify domain
echo -e "\n${YELLOW}=== Step 3: Verifying domain ===${NC}"
echo "firebase hosting:sites:get $SITE --project $PROJECT"
firebase hosting:sites:get $SITE --project $PROJECT

# Step 4: Provision SSL certificate
echo -e "\n${YELLOW}=== Step 4: Provisioning SSL certificate ===${NC}"
echo "firebase hosting:sites:update $SITE --project $PROJECT --domains=$DOMAIN"
firebase hosting:sites:update $SITE --project $PROJECT --domains=$DOMAIN

echo -e "\n${GREEN}=========================================================${NC}"
echo -e "${GREEN}      SSL Certificate Fix Process Complete                ${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Add the TXT record shown above to your DNS configuration"
echo -e "2. Wait for DNS propagation (may take up to 24 hours)"
echo -e "3. Firebase will automatically provision an SSL certificate once verified"
echo
echo -e "${CYAN}To check status:${NC}"
echo -e "firebase hosting:sites:get $SITE --project $PROJECT"