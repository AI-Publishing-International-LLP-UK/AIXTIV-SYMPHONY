#!/bin/bash

# ======================================================
# ASOOS Symphony Opus 1.0.1 Deployment Script
# ======================================================
#
# This script builds and deploys the ASOOS Symphony application
# to Firebase hosting with proper environment configuration.
#
# Usage:
#   ./deploy.sh [environment]
#
# Arguments:
#   environment: Optional. Either 'staging' or 'production'
#                Default is 'staging'
#
# Examples:
#   ./deploy.sh                # Deploy to staging
#   ./deploy.sh staging        # Deploy to staging
#   ./deploy.sh production     # Deploy to production
#
# Prerequisites:
#   - Node.js and npm
#   - Firebase CLI
#   - Firebase project configured
#
# ======================================================

# Exit on any error
set -e

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set default values
ENVIRONMENT=${1:-"staging"}
LOG_FILE="deployment_$(date +%Y%m%d_%H%M%S).log"
PROJECT_ROOT="/Users/as/asoos/aixtiv-symphony-opus1.0.1"
DEPLOY_DIR="$PROJECT_ROOT/deploy"
BUILD_DIR="$PROJECT_ROOT/build"
FIREBASE_TARGET=""
REGION="us-west1"

# Create logs directory if it doesn't exist
mkdir -p "$DEPLOY_DIR/logs"
LOG_PATH="$DEPLOY_DIR/logs/$LOG_FILE"

# Log function with timestamp
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO")
      echo -e "${BLUE}[INFO]${NC} $timestamp - $message"
      ;;
    "SUCCESS")
      echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message"
      ;;
    "WARNING")
      echo -e "${YELLOW}[WARNING]${NC} $timestamp - $message"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} $timestamp - $message"
      ;;
    *)
      echo -e "$timestamp - $message"
      ;;
  esac
  
  echo "[$level] $timestamp - $message" >> "$LOG_PATH"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Display script header
display_header() {
  echo -e "${BLUE}=================================================${NC}"
  echo -e "${BLUE}    ASOOS Symphony Opus 1.0.1 Deployment Tool    ${NC}"
  echo -e "${BLUE}=================================================${NC}"
  echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
  echo -e "Log file: ${YELLOW}$LOG_PATH${NC}"
  echo -e "${BLUE}=================================================${NC}"
  echo ""
}

# Check prerequisites
check_prerequisites() {
  log "INFO" "Checking prerequisites..."
  
  # Check for Node.js and npm
  if ! command_exists node; then
    log "ERROR" "Node.js is required but not installed."
    exit 1
  fi
  
  if ! command_exists npm; then
    log "ERROR" "npm is required but not installed."
    exit 1
  fi
  
  # Check for Firebase CLI
  if ! command_exists firebase; then
    log "ERROR" "Firebase CLI is required but not installed. Install with: npm install -g firebase-tools"
    exit 1
  fi
  
  # Check Node.js version
  node_version=$(node -v | cut -d 'v' -f 2)
  required_node_version="18.0.0"
  
  if ! command_exists node; then
    log "ERROR" "Node.js is required but not installed."
    exit 1
  elif [[ "$(printf '%s\n' "$required_node_version" "$node_version" | sort -V | head -n1)" != "$required_node_version" ]]; then
    log "ERROR" "Node.js v$required_node_version or higher is required. Current version: $node_version"
    exit 1
  fi
  
  log "SUCCESS" "All prerequisites are met."
}

# Set deployment configuration
set_configuration() {
  log "INFO" "Setting up deployment configuration for $ENVIRONMENT environment..."
  
  # Set Firebase target based on environment
  case "$ENVIRONMENT" in
    "production")
      FIREBASE_TARGET="asoos-primary"
      ;;
    "staging")
      FIREBASE_TARGET="asoos-staging"
      ;;
    *)
      log "ERROR" "Invalid environment: $ENVIRONMENT. Valid options are 'staging' or 'production'"
      exit 1
      ;;
  esac
  
  # Ensure we're in the project root
  cd "$PROJECT_ROOT" || {
    log "ERROR" "Failed to change directory to $PROJECT_ROOT"
    exit 1
  }
  
  # Create or update .env file based on environment
  if [ "$ENVIRONMENT" == "production" ]; then
    cp "$PROJECT_ROOT/deploy/env.production" "$PROJECT_ROOT/.env" || {
      log "WARNING" "Could not find production environment file. Using default."
      echo "REACT_APP_ENV=production" > "$PROJECT_ROOT/.env"
      echo "REACT_APP_FIREBASE_REGION=$REGION" >> "$PROJECT_ROOT/.env"
    }
  else
    cp "$PROJECT_ROOT/deploy/env.staging" "$PROJECT_ROOT/.env" || {
      log "WARNING" "Could not find staging environment file. Using default."
      echo "REACT_APP_ENV=staging" > "$PROJECT_ROOT/.env"
      echo "REACT_APP_FIREBASE_REGION=$REGION" >> "$PROJECT_ROOT/.env"
    }
  fi
  
  log "SUCCESS" "Deployment configuration set for $ENVIRONMENT environment."
}

# Build the application
build_application() {
  log "INFO" "Building the application for $ENVIRONMENT environment..."
  
  # Clean previous build
  if [ -d "$BUILD_DIR" ]; then
    log "INFO" "Removing previous build..."
    rm -rf "$BUILD_DIR"
  fi
  
  # Install dependencies
  log "INFO" "Installing dependencies..."
  npm ci || {
    log "ERROR" "Failed to install dependencies."
    exit 1
  }
  
  # Build the application
  log "INFO" "Running build process..."
  npm run build || {
    log "ERROR" "Build process failed."
    exit 1
  }
  
  log "SUCCESS" "Application built successfully."
}

# Deploy to Firebase
deploy_to_firebase() {
  log "INFO" "Deploying to Firebase ($FIREBASE_TARGET)..."
  
  # Check for firebase.json
  if [ ! -f "$PROJECT_ROOT/firebase.json" ]; then
    log "ERROR" "firebase.json not found. Make sure Firebase is configured correctly."
    exit 1
  fi
  
  # Deploy to Firebase
  firebase deploy --only hosting:"$FIREBASE_TARGET" --non-interactive || {
    log "ERROR" "Failed to deploy to Firebase."
    exit 1
  }
  
  log "SUCCESS" "Deployment to Firebase completed successfully."
}

# Run post-deployment tasks
post_deployment() {
  log "INFO" "Running post-deployment tasks..."
  
  # Copy the deployment log to the project root for easy access
  cp "$LOG_PATH" "$PROJECT_ROOT/last_deployment.log"
  
  # Update deployment history
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $ENVIRONMENT" >> "$DEPLOY_DIR/deployment_history.txt"
  
  log "SUCCESS" "Post-deployment tasks completed."
}

# Main function
main() {
  # Start logging
  log "INFO" "Starting deployment process for $ENVIRONMENT environment..."
  
  # Display header
  display_header
  
  # Run deployment steps
  check_prerequisites
  set_configuration
  build_application
  deploy_to_firebase
  post_deployment
  
  # Deployment complete
  log "SUCCESS" "Deployment completed successfully! Application is now live at:"
  if [ "$ENVIRONMENT" == "production" ]; then
    log "INFO" "https://asoos-2100-com.web.app"
  else
    log "INFO" "https://asoos-staging.web.app"
  fi
}

# Execute main function
main

exit 0

