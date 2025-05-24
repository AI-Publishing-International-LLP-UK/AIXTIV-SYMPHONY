#!/bin/bash

# ASOOS Simplified Deployment Script
echo "==================================================="
echo "   ASOOS Deployment Preparation"
echo "   Project: api-for-warp-drive"
echo "   Region: us-west1"
echo "   Zone: us-west1-b"
echo "==================================================="

# Create deployment directory
DEPLOY_DIR="deployment-ready"
mkdir -p "$DEPLOY_DIR"

# Extract deployment bundle
echo "Extracting deployment bundle..."
unzip -q asoos-deployment-bundle.zip -d "$DEPLOY_DIR"

# Create a basic Dockerfile
echo "Creating Dockerfile..."
cat > "$DEPLOY_DIR/Dockerfile" << 'DOCKEREOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production --legacy-peer-deps

# Copy application files
COPY . .

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
DOCKEREOF

# Create deployment instructions
echo "Creating deployment instructions..."
cat > "$DEPLOY_DIR/DEPLOY.md" << 'MDEOF'
# ASOOS Deployment Instructions

This directory contains all files needed to deploy the ASOOS application with SallyPort verification.

## Cloud Run Deployment

To deploy to Cloud Run:

```bash
# Set project and region
gcloud config set project api-for-warp-drive
gcloud config set compute/zone us-west1-b

# Build and deploy
gcloud builds submit --tag gcr.io/api-for-warp-drive/asoos-integration-gateway:latest
gcloud run deploy asoos-integration-gateway \
  --image gcr.io/api-for-warp-drive/asoos-integration-gateway:latest \
  --region us-west1 \
  --platform managed \
  --memory 4Gi \
  --cpu 2 \
  --allow-unauthenticated
```

## VM Deployment

To deploy to a VM:

```bash
# SSH to the VM
gcloud compute ssh mcp-server --zone=us-west1-b

# On the VM:
mkdir -p /opt/asoos
# Copy all files to /opt/asoos

# Install dependencies
cd /opt/asoos
npm install --legacy-peer-deps

# Start the server
node server.js
```

## Note on CI/CD

The `.github/workflows/asoos-pipeline.yml` file should be placed in your repository for automatic CI/CD.
MDEOF

echo "==================================================="
echo "Deployment preparation complete!"
echo "Deployment files are in the '$DEPLOY_DIR' directory"
echo "Follow the instructions in '$DEPLOY_DIR/DEPLOY.md' to complete deployment"
echo "==================================================="
