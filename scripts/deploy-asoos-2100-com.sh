#!/bin/bash
#
# deploy-asoos-2100-com.sh
# Deployment script for ASOOS 2100 site
#
# This script automates the deployment process for the ASOOS 2100 site,
# including both hosting and functions components.
#
# Created: May 26, 2025

# Set strict mode
set -e

# Text formatting
BOLD="\033[1m"
RESET="\033[0m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
BLUE="\033[34m"

# Log message function
log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${RESET} $1"
}

# Success message function
success() {
  echo -e "${GREEN}${BOLD}[SUCCESS]${RESET} $1"
}

# Warning message function
warning() {
  echo -e "${YELLOW}${BOLD}[WARNING]${RESET} $1"
}

# Error message function
error() {
  echo -e "${RED}${BOLD}[ERROR]${RESET} $1"
}

# Function to check if we're in the correct directory
check_directory() {
  log "Checking current directory..."
  
  # Get current directory
  CURRENT_DIR=$(pwd)
  
  # Check if we're in the ASOOS project directory
  if [[ "$CURRENT_DIR" != *"/asoos" ]]; then
    error "Not in the ASOOS project directory. Please run this script from /Users/as/asoos"
    exit 1
  fi
  
  success "Current directory is correct: $CURRENT_DIR"
}

# Function to validate Firebase configuration
validate_firebase_config() {
  log "Validating Firebase configuration..."
  
  # Check if firebase.json exists
  if [ ! -f "./firebase.json" ]; then
    error "firebase.json not found!"
    exit 1
  fi
  
  # Check if .firebaserc exists
  if [ ! -f "./.firebaserc" ]; then
    error ".firebaserc not found!"
    exit 1
  fi
  
  # Check if public/asoos-2100-com directory exists
  if [ ! -d "./public/asoos-2100-com" ]; then
    error "public/asoos-2100-com directory not found!"
    exit 1
  fi
  
  # Validate Firebase project
  FIREBASE_PROJECT=$(grep -o '"default": "[^"]*' .firebaserc | cut -d'"' -f4)
  if [ -z "$FIREBASE_PROJECT" ]; then
    error "Could not determine Firebase project from .firebaserc"
    exit 1
  fi
  
  success "Firebase configuration validated. Using project: $FIREBASE_PROJECT"
}

# Function to deploy functions
deploy_functions() {
  log "Deploying Firebase functions..."
  
  # Check if --functions flag was passed
  if [ "$DEPLOY_FUNCTIONS" = true ]; then
    firebase deploy --only functions:asoosApi || {
      error "Failed to deploy functions!"
      exit 1
    }
    success "Functions deployed successfully!"
  else
    warning "Skipping functions deployment. Use --functions flag to deploy functions."
  fi
}

# Function to deploy hosting
deploy_hosting() {
  log "Deploying hosting for asoos-2100-com..."
  
  # Clear target if it's linked to multiple sites
  firebase target:clear hosting asoos || {
    warning "Could not clear hosting target. It might already be clear."
  }
  
  # Apply target to 2100-cool site
  firebase target:apply hosting asoos 2100-cool || {
    error "Failed to apply hosting target!"
    exit 1
  }
  
  # Deploy hosting
  firebase deploy --only hosting:asoos || {
    error "Failed to deploy hosting!"
    exit 1
  }
  
  success "Hosting deployed successfully to https://2100-cool.web.app"
}

# Function to show help
show_help() {
  echo "Usage: ./deploy-asoos-2100-com.sh [OPTIONS]"
  echo ""
  echo "Deployment script for ASOOS 2100 site"
  echo ""
  echo "Options:"
  echo "  --functions    Deploy functions as well as hosting"
  echo "  --help         Show this help message"
  echo ""
  exit 0
}

# Main script execution
main() {
  log "Starting ASOOS 2100 deployment process..."
  
  # Parse command line arguments
  DEPLOY_FUNCTIONS=false
  
  for arg in "$@"; do
    case $arg in
      --functions)
        DEPLOY_FUNCTIONS=true
        shift
        ;;
      --help)
        show_help
        ;;
    esac
  done
  
  # Run the deployment steps
  check_directory
  validate_firebase_config
  deploy_functions
  deploy_hosting
  
  log "Deployment process completed"
  success "ASOOS 2100 site deployed successfully!"
  echo ""
  echo -e "${BOLD}Site URL:${RESET} https://2100-cool.web.app"
  echo -e "${BOLD}API Endpoint:${RESET} https://us-west1-api-for-warp-drive.cloudfunctions.net/asoosApi"
  echo ""
}

# Execute main function with all arguments
main "$@"

