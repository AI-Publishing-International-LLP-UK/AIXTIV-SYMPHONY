#!/bin/bash
# setup-integration-gateway.sh - Configure the Integration Gateway with required secrets
# Path: /Users/as/asoos/integration-gateway/setup-integration-gateway.sh

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

PROJECT_ID="859242575175"
GCP_REGION="us-west1"
GCP_ZONE="us-west1-b"
GATEWAY_DIR="/Users/as/asoos/integration-gateway"
CONFIG_FILE="${GATEWAY_DIR}/gateway-config.json"

echo -e "${MAGENTA}======================================================${NC}"
echo -e "${MAGENTA}   AIXTIV SYMPHONY - INTEGRATION GATEWAY SETUP${NC}"
echo -e "${MAGENTA}======================================================${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${GCP_REGION}, Zone: ${GCP_ZONE}${NC}"
echo -e "${BLUE}Gateway directory: ${GATEWAY_DIR}${NC}"

# Make sure we're in the gateway directory
cd "$GATEWAY_DIR" || { 
    echo -e "${RED}Error: Failed to change to gateway directory${NC}"
    exit 1
}

# Check if fetch-all-secrets.sh exists
if [ ! -f "${GATEWAY_DIR}/fetch-all-secrets.sh" ]; then
    echo -e "${RED}Error: fetch-all-secrets.sh not found${NC}"
    echo "Please ensure the script exists in ${GATEWAY_DIR}"
    exit 1
fi

# Function to fetch critical secrets for the integration gateway
fetch_critical_secrets() {
    echo -e "\n${BLUE}Fetching critical secrets for Integration Gateway...${NC}"
    
    # Create an array of critical secrets for the gateway
    critical_secrets=(
        "anthropic-admin"
        "lucy-claude-01"
        "pineconeconnect"
        "new-admin-anthropic"
        "oauth-credentials"
        "github-oauth-warp-drive"
        "dr-lucy"
        "dr-claude"
        "API_KEY"
    )
    
    # Create gateway config directory if it doesn't exist
    mkdir -p "${GATEWAY_DIR}/config"
    
    # Initialize gateway config file
    cat > "$CONFIG_FILE" << GWCONFIG
{
    "gateway": {
        "name": "Aixtiv Symphony Integration Gateway",
        "region": "${GCP_REGION}",
        "zone": "${GCP_ZONE}",
        "project_id": "${PROJECT_ID}",
        "configured_on": "$(date)",
        "endpoints": {
            "sallyport": "https://us-west1-aixtiv-symphony.cloudfunctions.net/sallyport",
            "dr_claude": "https://us-west1-aixtiv-symphony.cloudfunctions.net/dr-claude",
            "dr_lucy": "https://us-west1-aixtiv-symphony.cloudfunctions.net/dr-lucy",
            "anthropic_api": "https://api.anthropic.com/v1"
        },
        "secrets": {
GWCONFIG
    
    # Process critical secrets first
    total=${#critical_secrets[@]}
    for i in "${!critical_secrets[@]}"; do
        secret=${critical_secrets[$i]}
        env_var=$(echo "$secret" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        
        echo -e "Fetching critical secret: ${CYAN}${secret}${NC}..."
        
        if value=$(gcloud secrets versions access latest --secret="${secret}" --project=${PROJECT_ID} 2>/dev/null); then
            # Successfully retrieved the secret
            export "${env_var}=${value}"
            echo -e "${GREEN}✅ Set ${env_var} (${#value} characters)${NC}"
            
            # Save to gateway config
            echo "            \"${secret}\": {" >> "$CONFIG_FILE"
            echo "                \"env_var\": \"${env_var}\"," >> "$CONFIG_FILE"
            echo "                \"status\": \"active\"," >> "$CONFIG_FILE"
            echo "                \"length\": ${#value}" >> "$CONFIG_FILE"
            
            # If not the last one, add a comma
            if [ $((i+1)) -lt $total ]; then
                echo "            }," >> "$CONFIG_FILE"
            else
                echo "            }" >> "$CONFIG_FILE"
            fi
            
            # Save to individual env file for this secret
            echo "export ${env_var}=\"${value}\"" > "${GATEWAY_DIR}/config/${secret}.env"
            chmod 600 "${GATEWAY_DIR}/config/${secret}.env"
        else
            # Failed to retrieve the secret
            echo -e "${RED}❌ Failed to access critical secret: ${secret}${NC}"
            echo -e "${YELLOW}⚠️ Integration Gateway may not function properly${NC}"
            
            # Add failed status to gateway config
            echo "            \"${secret}\": {" >> "$CONFIG_FILE"
            echo "                \"env_var\": \"${env_var}\"," >> "$CONFIG_FILE"
            echo "                \"status\": \"error\"," >> "$CONFIG_FILE"
            echo "                \"error\": \"Failed to access secret\"" >> "$CONFIG_FILE"
            
            # If not the last one, add a comma
            if [ $((i+1)) -lt $total ]; then
                echo "            }," >> "$CONFIG_FILE"
            else
                echo "            }" >> "$CONFIG_FILE"
            fi
        fi
    done
    
    # Close the secrets object and configuration
    echo "        }" >> "$CONFIG_FILE"
    echo "    }" >> "$CONFIG_FILE"
    echo "}" >> "$CONFIG_FILE"
}

# Function to setup environment variables for the gateway
setup_gateway_env() {
    echo -e "\n${BLUE}Setting up environment variables for Integration Gateway...${NC}"
    
    # Create .env file for the gateway
    cat > "${GATEWAY_DIR}/.env" << GWENV
# Aixtiv Symphony Integration Gateway Environment
# Generated: $(date)
# Project: ${PROJECT_ID}
# Region: ${GCP_REGION}

# Core API endpoints
export CLAUDE_API_ENDPOINT="https://us-west1-aixtiv-symphony.cloudfunctions.net"
export DR_CLAUDE_API="https://us-west1-aixtiv-symphony.cloudfunctions.net"
export SALLYPORT_ENDPOINT="https://us-west1-aixtiv-symphony.cloudfunctions.net/sallyport"

# GCP Configuration
export GCP_PROJECT_ID="${PROJECT_ID}"
export GCP_REGION="${GCP_REGION}"
export GCP_ZONE="${GCP_ZONE}"

# Include critical API keys
GWENV
    
    # Add the main API keys to the .env file
    echo "export ANTHROPIC_API_KEY=\"${NEW_ADMIN_ANTHROPIC}\"" >> "${GATEWAY_DIR}/.env"
    echo "export DR_CLAUDE_API_KEY=\"${ANTHROPIC_ADMIN}\"" >> "${GATEWAY_DIR}/.env"
    echo "export PINECONE_API_KEY=\"${PINECONECONNECT}\"" >> "${GATEWAY_DIR}/.env"
    echo "export LUCY_API_KEY=\"${LUCY_CLAUDE_01}\"" >> "${GATEWAY_DIR}/.env"
    
    # Set proper permissions
    chmod 600 "${GATEWAY_DIR}/.env"
    
    echo -e "${GREEN}✅ Created .env file for Integration Gateway${NC}"
}

# Function to create Docker configuration
create_docker_config() {
    echo -e "\n${BLUE}Creating Docker configuration for Integration Gateway...${NC}"
    
    mkdir -p "${GATEWAY_DIR}/docker"
    
    # Create docker-compose.yml
    cat > "${GATEWAY_DIR}/docker/docker-compose.yml" << DOCKERCOMPOSE
version: '3.8'

services:
  integration-gateway:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: aixtiv-integration-gateway
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - GCP_PROJECT_ID=${PROJECT_ID}
      - GCP_REGION=${GCP_REGION}
      - CLAUDE_API_ENDPOINT=https://us-west1-aixtiv-symphony.cloudfunctions.net
      - NODE_ENV=production
    volumes:
      - ../config:/app/config
      - ../logs:/app/logs
    networks:
      - aixtiv-network

networks:
  aixtiv-network:
    driver: bridge
DOCKERCOMPOSE
    
    # Create Dockerfile
    cat > "${GATEWAY_DIR}/docker/Dockerfile" << DOCKERFILE
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs config

# Set environment variables
ENV NODE_ENV=production
ENV GCP_PROJECT_ID=${PROJECT_ID}
ENV GCP_REGION=${GCP_REGION}
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the gateway service
CMD ["node", "server.js"]
DOCKERFILE
    
    echo -e "${GREEN}✅ Created Docker configuration${NC}"
}

# Function to create placeholder files
create_placeholder_files() {
    echo -e "\n${BLUE}Creating placeholder files...${NC}"
    
    # Create server.js placeholder
    cat > "${GATEWAY_DIR}/server.js" << SERVERJS
/**
 * Aixtiv Symphony Integration Gateway
 * The Integration Gateway middleware for auth, routing, and role validation.
 * 
 * Part of the ASOOS (Aixtiv Symphony Orchestrating Operating System)
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Load environment variables
require('dotenv').config();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'integration-gateway' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).send({
    service: 'Aixtiv Symphony Integration Gateway',
    version: '1.0.0',
    status: 'operational',
    region: process.env.GCP_REGION || 'us-west1'
  });
});

// Start the server
app.listen(port, () => {
  console.log(\`Integration Gateway started on port \${port}\`);
});
SERVERJS
    
    # Create package.json
    cat > "${GATEWAY_DIR}/package.json" << PACKAGEJSON
{
  "name": "aixtiv-integration-gateway",
  "version": "1.0.0",
  "description": "Integration Gateway for Aixtiv Symphony - The security, routing, and token control middleware",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "dotenv": "^16.0.3",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "nodemon": "^2.0.22"
  }
}
PACKAGEJSON
    
    # Create README.md
    cat > "${GATEWAY_DIR}/README.md" << README
# Aixtiv Symphony Integration Gateway

The Integration Gateway serves as the central security, routing, and token control middleware for the Aixtiv Symphony Orchestrating Operating System (ASOOS).

## Overview

This component is responsible for enforcing trust and entitlement boundaries across all ASOOS subsystems by validating authentication tokens, user roles, and request permissions.

## Setup

1. Run the \`setup-integration-gateway.sh\` script to configure environment variables and secrets
2. Install dependencies: \`npm install\`
3. Start the service: \`npm start\`

## Docker Deployment

1. Navigate to the docker directory: \`cd docker\`
2. Build and start the container: \`docker-compose up -d\`

## Configuration

All configuration is loaded from environment variables or secret files in the \`config\` directory.

## Endpoints

- \`/health\`: Health check endpoint
- \`/auth/verify\`: Verify authentication tokens
- \`/routes\`: Get available routes for the current user
- \`/token/validate\`: Validate token permissions

## Environment Variables

Required environment variables are documented in the \`.env\` file.
README
    
    echo -e "${GREEN}✅ Created placeholder files${NC}"
}

# Main execution
echo -e "\n${MAGENTA}Setting up Aixtiv Symphony Integration Gateway...${NC}"

# Create required directories
mkdir -p "${GATEWAY_DIR}/config" "${GATEWAY_DIR}/logs"

# Fetch critical secrets
fetch_critical_secrets

# Setup environment variables
setup_gateway_env

# Create Docker config
create_docker_config

# Create placeholder files
create_placeholder_files

echo -e "\n${MAGENTA}Integration Gateway Setup Complete!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Review the configuration in ${CYAN}${CONFIG_FILE}${NC}"
echo -e "2. Source the environment variables: ${CYAN}source ${GATEWAY_DIR}/.env${NC}"
echo -e "3. Install dependencies: ${CYAN}cd ${GATEWAY_DIR} && npm install${NC}"
echo -e "4. Start the gateway: ${CYAN}npm start${NC} or ${CYAN}cd docker && docker-compose up -d${NC}"
echo -e "${MAGENTA}======================================================${NC}"
