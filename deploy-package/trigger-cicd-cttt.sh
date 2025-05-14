#!/bin/bash

# Manual trigger script for CI/CD CTTT
# This script allows manual triggering of the CI/CD pipeline

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     MANUAL TRIGGER FOR CI/CD CTTT PIPELINE              ${NC}"
echo -e "${BLUE}=========================================================${NC}"

echo -e "${YELLOW}Triggering CI/CD CTTT pipeline manually...${NC}"
gcloud builds triggers run asoos-2100-cool-cicd-cttt \
    --branch=main \
    --project=api-for-warp-drive

echo -e "${GREEN}CI/CD CTTT pipeline has been triggered!${NC}"
echo -e "${YELLOW}You can view the build progress in the Google Cloud Console or by running:${NC}"
echo -e "${BLUE}gcloud builds list --project=api-for-warp-drive${NC}"
