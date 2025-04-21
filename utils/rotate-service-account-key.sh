#!/bin/bash

# rotate-service-account-key.sh
#
# This script fully automates the process of rotating Google Cloud service account keys.
# It generates a new key, downloads it, updates the system, and cleans up securely.
#
# Usage:
#   ./rotate-service-account-key.sh [service-account-email] [project-id]
#
# If no service account email is provided, it will use the one currently in use.
# If no project ID is provided, it will use the currently active project.

set -e  # Exit immediately if a command exits with a non-zero status

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print a formatted message
print_message() {
  local type=$1
  local message=$2
  local prefix=""
  
  case $type in
    "info")
      prefix="${BLUE}[INFO]${NC}"
      ;;
    "success")
      prefix="${GREEN}[SUCCESS]${NC}"
      ;;
    "warning")
      prefix="${YELLOW}[WARNING]${NC}"
      ;;
    "error")
      prefix="${RED}[ERROR]${NC}"
      ;;
    *)
      prefix="${BLUE}[INFO]${NC}"
      ;;
  esac
  
  echo -e "${prefix} ${message}"
}

# Print script header
print_header() {
  echo -e "${BOLD}========================================${NC}"
  echo -e "${BOLD}🔑 Service Account Key Rotation Tool 🔑${NC}"
  echo -e "${BOLD}========================================${NC}"
  echo ""
}

# Check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Clean up temporary files on exit
cleanup() {
  if [ -n "$TEMP_KEY_FILE" ] && [ -f "$TEMP_KEY_FILE" ]; then
    print_message "info" "Cleaning up temporary files..."
    rm -f "$TEMP_KEY_FILE"
    print_message "success" "Temporary key file removed."
  fi
}

# Set up trap to ensure cleanup on exit, including unexpected exits
trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
  print_message "info" "Checking prerequisites..."

  if ! command_exists gcloud; then
    print_message "error" "gcloud CLI is not installed or not in PATH."
    print_message "info" "Please install the Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi

  if ! gcloud auth list --format="value(account)" 2>/dev/null | grep -q "@"; then
    print_message "error" "Not logged in to gcloud. Please run 'gcloud auth login' first."
    exit 1
  fi

  # Check if update-gcp-key alias or script exists
  if ! command_exists update-gcp-key; then
    if [ ! -f "$HOME/asoos/integration-gateway/utils/update-service-account-key.sh" ]; then
      print_message "error" "update-gcp-key script not found. Please ensure it's properly installed."
      exit 1
    else
      # Create alias for this session
      alias update-gcp-key="$HOME/asoos/integration-gateway/utils/update-service-account-key.sh"
    fi
  fi

  print_message "success" "All prerequisites met."
}

# Get current service account info
get_current_service_account() {
  if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    local client_email=$(grep -o '"client_email": "[^"]*' "$GOOGLE_APPLICATION_CREDENTIALS" | cut -d'"' -f4)
    if [ -n "$client_email" ]; then
      echo "$client_email"
      return 0
    fi
  fi
  echo ""
  return 1
}

# Main function
main() {
  print_header
  
  # Check prerequisites
  check_prerequisites
  
  # Get service account email
  SERVICE_ACCOUNT_EMAIL=$1
  if [ -z "$SERVICE_ACCOUNT_EMAIL" ]; then
    CURRENT_SA=$(get_current_service_account)
    if [ -n "$CURRENT_SA" ]; then
      print_message "info" "No service account specified. Using current: $CURRENT_SA"
      SERVICE_ACCOUNT_EMAIL=$CURRENT_SA
    else
      print_message "error" "No service account specified and couldn't determine current one."
      print_message "info" "Usage: ./rotate-service-account-key.sh [service-account-email] [project-id]"
      exit 1
    fi
  fi
  
  # Get project ID
  PROJECT_ID=$2
  if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
      print_message "error" "No project ID specified and couldn't determine current one."
      print_message "info" "Usage: ./rotate-service-account-key.sh [service-account-email] [project-id]"
      exit 1
    fi
    print_message "info" "No project specified. Using current project: $PROJECT_ID"
  fi
  
  # Create a temp directory with secure permissions
  TEMP_DIR=$(mktemp -d)
  chmod 700 "$TEMP_DIR"
  TEMP_KEY_FILE="${TEMP_DIR}/temp-service-account-key.json"
  
  print_message "info" "Rotating key for service account: $SERVICE_ACCOUNT_EMAIL"
  print_message "info" "Project ID: $PROJECT_ID"
  
  # Create new key
  print_message "info" "Creating new service account key..."
  if ! gcloud iam service-accounts keys create "$TEMP_KEY_FILE" \
       --iam-account="$SERVICE_ACCOUNT_EMAIL" \
       --project="$PROJECT_ID"; then
    print_message "error" "Failed to create new service account key."
    exit 1
  fi
  print_message "success" "New service account key created."
  
  # Set secure permissions on the key file
  chmod 600 "$TEMP_KEY_FILE"
  
  # Update the key in the system using our existing script
  print_message "info" "Updating service account key in the system..."
  if ! update-gcp-key "$TEMP_KEY_FILE"; then
    print_message "error" "Failed to update service account key in the system."
    exit 1
  fi
  
  # List old keys
  print_message "info" "Listing existing service account keys (including the new one):"
  gcloud iam service-accounts keys list \
      --iam-account="$SERVICE_ACCOUNT_EMAIL" \
      --project="$PROJECT_ID" \
      --format="table(name.basename():label=KEY_ID,validity.state:label=STATE,valid_after_time:label=CREATED,valid_before_time:label=EXPIRES)"
  
  print_message "success" "Service account key rotation completed successfully!"
  print_message "info" "You may want to delete old keys from the Google Cloud Console or using:"
  print_message "info" "gcloud iam service-accounts keys delete KEY_ID --iam-account=$SERVICE_ACCOUNT_EMAIL"
}

# Run the main function with all arguments
main "$@"
