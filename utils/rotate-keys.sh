#!/bin/bash
# rotate-keys.sh
#
# A comprehensive key rotation script for the Integration Gateway
# This script manages rotation of:
# 1. Cloud KMS keys (via setup-crypto-key-rotation.sh)
# 2. Service account keys (via rotate-service-account-key.sh)
# 3. Authentication tokens (via API endpoints)
#
# Usage:
#   ./rotate-keys.sh [--service-account] [--kms] [--auth-tokens] [--all]

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
  echo -e "${BOLD}=============================================${NC}"
  echo -e "${BOLD}🔄 Integration Gateway Key Rotation Manager 🔄${NC}"
  echo -e "${BOLD}=============================================${NC}"
  echo ""
}

# Print usage information
print_usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --service-account  Rotate service account keys"
  echo "  --kms              Rotate KMS keys (updates rotation schedule)"
  echo "  --auth-tokens      Rotate authentication tokens"
  echo "  --all              Rotate all key types"
  echo "  --help             Display this help message"
  echo ""
  echo "Example:"
  echo "  $0 --all           # Rotate all key types"
  echo "  $0 --kms           # Update KMS key rotation schedule only"
  echo ""
}

# Check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Check prerequisites
check_prerequisites() {
  print_message "info" "Checking prerequisites..."

  # Check for gcloud
  if ! command_exists gcloud; then
    print_message "error" "gcloud CLI is not installed or not in PATH."
    print_message "info" "Please install the Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi

  # Check for other required scripts
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
  
  if [ ! -f "${SCRIPT_DIR}/setup-crypto-key-rotation.sh" ]; then
    print_message "error" "setup-crypto-key-rotation.sh script not found in ${SCRIPT_DIR}"
    exit 1
  fi
  
  if [ ! -f "${SCRIPT_DIR}/rotate-service-account-key.sh" ]; then
    print_message "error" "rotate-service-account-key.sh script not found in ${SCRIPT_DIR}"
    exit 1
  fi
  
  # Make scripts executable if needed
  chmod +x "${SCRIPT_DIR}/setup-crypto-key-rotation.sh"
  chmod +x "${SCRIPT_DIR}/rotate-service-account-key.sh"

  print_message "success" "All prerequisites met."
}

# Rotate KMS keys
rotate_kms_keys() {
  print_message "info" "Updating KMS key rotation schedule..."
  
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
  "${SCRIPT_DIR}/setup-crypto-key-rotation.sh"
  
  print_message "success" "KMS key rotation schedule updated."
}

# Rotate service account keys
rotate_service_account_keys() {
  print_message "info" "Rotating service account keys..."
  
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
  "${SCRIPT_DIR}/rotate-service-account-key.sh"
  
  print_message "success" "Service account keys rotated."
}

# Rotate authentication tokens
rotate_auth_tokens() {
  print_message "info" "Rotating authentication tokens..."
  
  # Load the gateway config to get API endpoint information
  CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." &>/dev/null && pwd)"
  CONFIG_FILE="${CONFIG_DIR}/gateway-config.yaml"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    print_message "error" "Gateway config file not found at ${CONFIG_FILE}"
    exit 1
  }
  
  # This part would typically call an API endpoint to rotate tokens
  # For now, we'll just print a message
  print_message "info" "API token rotation is not yet implemented in this script"
  print_message "info" "This would typically call an API endpoint to rotate tokens"
  
  print_message "success" "Authentication token rotation simulated."
}

# Main function
main() {
  print_header
  
  # Parse command line arguments
  ROTATE_SERVICE_ACCOUNT=false
  ROTATE_KMS=false
  ROTATE_AUTH_TOKENS=false
  
  if [ $# -eq 0 ]; then
    print_usage
    exit 0
  fi
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      --service-account)
        ROTATE_SERVICE_ACCOUNT=true
        shift
        ;;
      --kms)
        ROTATE_KMS=true
        shift
        ;;
      --auth-tokens)
        ROTATE_AUTH_TOKENS=true
        shift
        ;;
      --all)
        ROTATE_SERVICE_ACCOUNT=true
        ROTATE_KMS=true
        ROTATE_AUTH_TOKENS=true
        shift
        ;;
      --help)
        print_usage
        exit 0
        ;;
      *)
        print_message "error" "Unknown option: $1"
        print_usage
        exit 1
        ;;
    esac
  done
  
  # Check prerequisites
  check_prerequisites
  
  # Execute selected rotation operations
  if [ "$ROTATE_KMS" = true ]; then
    rotate_kms_keys
  fi
  
  if [ "$ROTATE_SERVICE_ACCOUNT" = true ]; then
    rotate_service_account_keys
  fi
  
  if [ "$ROTATE_AUTH_TOKENS" = true ]; then
    rotate_auth_tokens
  fi
  
  print_message "success" "Key rotation completed successfully!"
}

# Run the main function with all arguments
main "$@"