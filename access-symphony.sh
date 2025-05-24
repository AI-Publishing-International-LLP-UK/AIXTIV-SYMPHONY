#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Attempting to access Symphony Local Environment...${NC}"

# Check if symphony_local directory exists
if [ ! -d "/Users/as/symphony_local" ]; then
    echo -e "${RED}Symphony Local Environment not found at /Users/as/symphony_local${NC}"
    exit 1
fi

# Check if start.sh exists in symphony_local
if [ ! -f "/Users/as/symphony_local/start.sh" ]; then
    echo -e "${RED}start.sh not found in Symphony Local Environment${NC}"
    exit 1
fi

echo -e "${GREEN}Symphony Local Environment found!${NC}"
echo -e "${YELLOW}Here are the commands you need to run:${NC}"
echo -e ""
echo -e "${GREEN}cd /Users/as/symphony_local${NC}"
echo -e "${GREEN}./start.sh${NC}"
echo -e ""
echo -e "${YELLOW}Then visit:${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}API: http://localhost:3030${NC}"
echo -e ""
echo -e "${YELLOW}Login with any username (try 'roark')${NC}"
echo -e "${YELLOW}Press Shift+Ctrl+9 to access the Developer Panel${NC}"