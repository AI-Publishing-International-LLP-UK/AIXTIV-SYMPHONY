#!/bin/bash

# Dr. Claude Interface Deployment Script
# This script builds and deploys the Dr. Claude interface to Firebase hosting

# Color definitions for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="api-for-warp-drive"
TARGET="dr-claude-interface"
REGION="us-west1"

# Error handling function
handle_error() {
  local exit_code=$1
  local error_msg=$2
  
  if [ $exit_code -ne 0 ]; then
    echo -e "${RED}[ERROR] $error_msg (Exit Code: $exit_code)${NC}"
    echo -e "${RED}[ABORT] Deployment aborted due to errors${NC}"
    exit $exit_code
  fi
}

# Function to check if required tools are installed
check_dependencies() {
  echo -e "${BLUE}Checking dependencies...${NC}"
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed. Please install it first.${NC}"
    exit 1
  fi
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed. Please install it first.${NC}"
    exit 1
  fi
  
  # Check Firebase CLI
  if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}[WARNING] Firebase CLI is not installed. Installing it now...${NC}"
    npm install -g firebase-tools
    handle_error $? "Failed to install Firebase CLI"
  fi
  
  echo -e "${GREEN}All dependencies are installed.${NC}"
}

# Function to build the React application
build_app() {
  echo -e "${BLUE}Building the React application...${NC}"
  
  # Install dependencies
  npm install
  handle_error $? "Failed to install dependencies"
  
  # Create public directory if it doesn't exist
  mkdir -p public
  handle_error $? "Failed to create public directory"
  
  # Build the application
  npm run build
  handle_error $? "Failed to build the application"
  
  echo -e "${GREEN}Application built successfully.${NC}"
}

# Function to configure Firebase hosting
configure_firebase() {
  echo -e "${BLUE}Configuring Firebase hosting...${NC}"
  
  # Initialize Firebase if .firebaserc doesn't exist
  if [ ! -f ".firebaserc" ]; then
    echo -e "${YELLOW}Initializing Firebase project...${NC}"
    firebase use --add $PROJECT_ID
    handle_error $? "Failed to initialize Firebase project"
  fi
  
  # Check if the target is already configured
  if ! firebase target:apply hosting $TARGET $TARGET &> /dev/null; then
    echo -e "${YELLOW}Configuring Firebase target...${NC}"
    firebase target:apply hosting $TARGET $TARGET
    handle_error $? "Failed to configure Firebase target"
  fi
  
  echo -e "${GREEN}Firebase hosting configured successfully.${NC}"
}

# Function to deploy the application
deploy_app() {
  echo -e "${BLUE}Deploying the application to Firebase...${NC}"
  
  # Deploy to Firebase hosting
  firebase deploy --only hosting:$TARGET
  handle_error $? "Failed to deploy the application"
  
  echo -e "${GREEN}Application deployed successfully.${NC}"
}

# Main function
main() {
  echo -e "${GREEN}========== Dr. Claude Interface Deployment ===========${NC}"
  echo -e "${BLUE}Project ID:${NC} $PROJECT_ID"
  echo -e "${BLUE}Target:${NC} $TARGET"
  echo -e "${BLUE}Region:${NC} $REGION"
  echo -e "${GREEN}======================================================${NC}"
  
  # Check dependencies
  check_dependencies
  
  # Change to the interface directory
  cd "$(dirname "$0")"
  
  # Build the application
  build_app
  
  # Configure Firebase hosting
  configure_firebase
  
  # Deploy the application
  deploy_app
  
  echo -e "${GREEN}Deployment completed!${NC}"
  echo -e "${BLUE}You can access the Dr. Claude Interface at: ${YELLOW}https://$TARGET-$PROJECT_ID.web.app${NC}"
}

# Run the main function
main

