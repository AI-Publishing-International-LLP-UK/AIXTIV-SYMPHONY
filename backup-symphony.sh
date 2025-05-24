#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BACKUP_DIR="/Users/as/asoos/symphony_backup_$(date +%Y%m%d_%H%M%S)"

echo -e "${YELLOW}Creating backup of Symphony Local Environment...${NC}"

# Check if symphony_local directory exists
if [ ! -d "/Users/as/symphony_local" ]; then
    echo -e "${RED}Symphony Local Environment not found at /Users/as/symphony_local${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Copy important files
echo -e "${YELLOW}Copying configuration files...${NC}"
cp -r /Users/as/symphony_local/start.sh "$BACKUP_DIR/"
cp -r /Users/as/symphony_local/*.json "$BACKUP_DIR/" 2>/dev/null
cp -r /Users/as/symphony_local/*.js "$BACKUP_DIR/" 2>/dev/null
cp -r /Users/as/symphony_local/*.md "$BACKUP_DIR/" 2>/dev/null

# Create directory structure
mkdir -p "$BACKUP_DIR/api"
mkdir -p "$BACKUP_DIR/frontend"

# Copy API directory if it exists
if [ -d "/Users/as/symphony_local/api" ]; then
    echo -e "${YELLOW}Backing up API configuration...${NC}"
    cp -r /Users/as/symphony_local/api/* "$BACKUP_DIR/api/" 2>/dev/null
fi

# Copy Frontend directory if it exists
if [ -d "/Users/as/symphony_local/frontend" ]; then
    echo -e "${YELLOW}Backing up Frontend configuration...${NC}"
    cp -r /Users/as/symphony_local/frontend/* "$BACKUP_DIR/frontend/" 2>/dev/null
fi

echo -e "${GREEN}Backup completed at: $BACKUP_DIR${NC}"
echo -e ""
echo -e "${YELLOW}To restore, you can run:${NC}"
echo -e "${GREEN}cp -r $BACKUP_DIR/* /Users/as/symphony_local/${NC}"