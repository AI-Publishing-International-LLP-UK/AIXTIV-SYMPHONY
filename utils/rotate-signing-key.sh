#!/bin/bash
# rotate-signing-key.sh
#
# This script manually rotates the signing key for the Integration Gateway.
# Since asymmetric signing keys don't support automatic rotation, this script
# creates a new version of the signing key.
#
# Usage:
#   ./rotate-signing-key.sh [project-id] [--yes]

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
  echo -e "${BOLD}==================================================${NC}"
  echo -e "${BOLD}🔐 Integration Gateway Signing Key Rotation Tool 🔐${NC}"
  echo -e "${BOLD}==================================================${NC}"
  echo ""
}

# Check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

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

  print_message "success" "All prerequisites met."
}

# Show usage
usage() {
  echo "Usage: $0 [project-id] [--yes]"
  echo ""
  echo "Options:"
  echo "  --yes    Skip confirmation prompt (useful for automation)"
  echo ""
  exit 1
}

# Main function
main() {
  print_header
  
  # Check prerequisites
  check_prerequisites
  
  # Parse arguments
  PROJECT_ID=""
  SKIP_CONFIRM=false
  
  for arg in "$@"; do
    case $arg in
      --yes)
        SKIP_CONFIRM=true
        ;;
      --help)
        usage
        ;;
      *)
        if [ -z "$PROJECT_ID" ]; then
          PROJECT_ID="$arg"
        fi
        ;;
    esac
  done
  
  # Get project ID if not provided
  if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
      print_message "error" "No project ID specified and couldn't determine current one."
      usage
    fi
    print_message "info" "No project specified. Using current project: $PROJECT_ID"
  fi
  
  # Set region (always us-west1 as required)
  REGION="us-west1"
  KEY_RING="integration-gateway-ring"
  SIGNING_KEY="igw-signing-key"
  
  print_message "info" "Using region: $REGION"
  
  # Check if the signing key exists
  print_message "info" "Checking if signing key exists..."
  if ! gcloud kms keys describe "$SIGNING_KEY" --keyring="$KEY_RING" --location="$REGION" &>/dev/null; then
    print_message "error" "Signing key '$SIGNING_KEY' not found in key ring '$KEY_RING'."
    print_message "info" "Please run setup-crypto-key-rotation.sh first to create the signing key."
    exit 1
  fi
  
  # Get current key versions
  print_message "info" "Getting current key versions..."
  VERSIONS=$(gcloud kms keys versions list \
    --key="$SIGNING_KEY" \
    --keyring="$KEY_RING" \
    --location="$REGION" \
    --format="table(name.basename():label=VERSION, state:label=STATE, createTime:label=CREATED)")
  
  echo "$VERSIONS"
  
  # For asymmetric signing keys, we need to create a whole new key
  # since they don't support multiple versions or primary version concept
  print_message "info" "Note: Asymmetric signing keys don't support multiple versions."
  print_message "info" "To 'rotate' a signing key, you would need to:"
  print_message "info" "1. Create a new key with a different name (e.g., igw-signing-key-v2)"
  print_message "info" "2. Update the application to use the new key"
  print_message "info" "3. Properly handle verification with both old and new keys during transition"
  
  # Ask for confirmation if not skipped
  if [ "$SKIP_CONFIRM" = false ]; then
    read -p "Do you want to create a new signing key with an incremented name? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_message "info" "Operation cancelled by user."
      exit 0
    fi
  else
    print_message "info" "Confirmation skipped with --yes flag."
  fi
  
  # Find the highest version number in existing keys
  print_message "info" "Finding existing signing keys..."
  EXISTING_KEYS=$(gcloud kms keys list \
    --keyring="$KEY_RING" \
    --location="$REGION" \
    --filter="name : igw-signing-key-v*" \
    --format="value(name.basename())")
  
  # Get the highest version number
  VERSION=1
  for KEY in $EXISTING_KEYS; do
    if [[ $KEY =~ igw-signing-key-v([0-9]+)$ ]]; then
      KEY_VERSION="${BASH_REMATCH[1]}"
      if (( KEY_VERSION >= VERSION )); then
        VERSION=$((KEY_VERSION + 1))
      fi
    fi
  done
  
  # If only the original key exists (without a -vX suffix), start with v2
  if [ "$VERSION" -eq 1 ] && [[ "$EXISTING_KEYS" == *"igw-signing-key"* ]]; then
    VERSION=2
  fi
  
  # Create the new key name
  NEW_KEY_NAME="igw-signing-key-v$VERSION"
  
  print_message "info" "Creating a new signing key: $NEW_KEY_NAME..."
  if ! gcloud kms keys create "$NEW_KEY_NAME" \
       --location="$REGION" \
       --keyring="$KEY_RING" \
       --purpose=asymmetric-signing \
       --default-algorithm=rsa-sign-pkcs1-2048-sha256 \
       --protection-level=software; then
    print_message "error" "Failed to create new signing key '$NEW_KEY_NAME'."
    exit 1
  fi
  
  print_message "success" "Created new signing key: $NEW_KEY_NAME"
  
  # Grant permissions to the service account
  SERVICE_ACCOUNT="drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com"
  print_message "info" "Granting permissions to service account: $SERVICE_ACCOUNT..."
  
  if ! gcloud kms keys add-iam-policy-binding "$NEW_KEY_NAME" \
       --location="$REGION" \
       --keyring="$KEY_RING" \
       --member="serviceAccount:$SERVICE_ACCOUNT" \
       --role="roles/cloudkms.signerVerifier"; then
    print_message "warning" "Failed to grant permissions. You may need to do this manually."
  else
    print_message "success" "Granted signer/verifier permissions to service account."
  fi
  
  # List all signing keys
  print_message "info" "Available signing keys:"
  gcloud kms keys list \
    --keyring="$KEY_RING" \
    --location="$REGION" \
    --filter="name : igw-signing-key*" \
    --format="table(name.basename():label=KEY_NAME, purpose:label=PURPOSE, createTime:label=CREATED)"
  
  print_message "success" "Key rotation completed successfully!"
  print_message "info" "==================================================================="
  print_message "info" "IMPORTANT: You need to update the gateway-config.yaml file to use the new key:"
  echo
  echo "crypto:"
  echo "  kms:"
  echo "    signing_key: \"$NEW_KEY_NAME\"  # Update this line"
  echo
  print_message "info" "==================================================================="
  print_message "info" "The crypto service will use the new key for signing new data."
  print_message "info" "All previously signed data can still be verified using the old key."
}

# Run the main function with all arguments
main "$@"