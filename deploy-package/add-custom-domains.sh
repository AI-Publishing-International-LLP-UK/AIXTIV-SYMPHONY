#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}      ADDING CUSTOM DOMAINS TO FIREBASE HOSTING          ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Read site IDs from .firebaserc
SYMPHONY_SITE=$(grep -o '"symphony": \[\s*"[^"]*"' .firebaserc | sed 's/"symphony": \[\s*"\([^"]*\)"/\1/')
ANTHOLOGY_SITE=$(grep -o '"anthology": \[\s*"[^"]*"' .firebaserc | sed 's/"anthology": \[\s*"\([^"]*\)"/\1/')

echo -e "${YELLOW}Symphony site ID: ${SYMPHONY_SITE}${NC}"
echo -e "${YELLOW}Anthology site ID: ${ANTHOLOGY_SITE}${NC}"

# Connect Symphony domain
echo -e "${YELLOW}\nConnecting Symphony domain...${NC}"
firebase hosting:sites:update ${SYMPHONY_SITE}
firebase hosting:sites:update ${SYMPHONY_SITE} --set-domain symphony.asoos.2100.cool

# Connect Anthology domain
echo -e "${YELLOW}\nConnecting Anthology domain...${NC}"
firebase hosting:sites:update ${ANTHOLOGY_SITE}
firebase hosting:sites:update ${ANTHOLOGY_SITE} --set-domain anthology.asoos.2100.cool

echo -e "${GREEN}\nCustom domains added successfully!${NC}"
echo -e "${YELLOW}Note: SSL provisioning may take several hours to complete.${NC}"
echo -e "${YELLOW}Domain connections:${NC}"
echo -e "${YELLOW}- https://asoos.2100.cool (main site, already connected)${NC}"
echo -e "${YELLOW}- https://symphony.asoos.2100.cool${NC}"
echo -e "${YELLOW}- https://anthology.asoos.2100.cool${NC}"

echo -e "${BLUE}=========================================================${NC}"