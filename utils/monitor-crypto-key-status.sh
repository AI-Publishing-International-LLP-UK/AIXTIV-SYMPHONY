#!/bin/bash
# monitor-crypto-key-status.sh
#
# This script monitors the status of the cryptographic keys used by the Integration Gateway.
# It checks the rotation schedule for the encryption key and lists all available signing keys.
#
# Usage:
#   ./monitor-crypto-key-status.sh [project-id]

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
  echo -e "${BOLD}🔐 Integration Gateway Crypto Key Status Monitor 🔐${NC}"
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

# Main function
main() {
  print_header
  
  # Check prerequisites
  check_prerequisites
  
  # Get project ID
  PROJECT_ID=$1
  if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
      print_message "error" "No project ID specified and couldn't determine current one."
      print_message "info" "Usage: ./monitor-crypto-key-status.sh [project-id]"
      exit 1
    fi
    print_message "info" "No project specified. Using current project: $PROJECT_ID"
  fi
  
  # Set region (always us-west1 as required)
  REGION="us-west1"
  KEY_RING="integration-gateway-ring"
  ENCRYPTION_KEY="igw-encryption-key"
  
  print_message "info" "Using region: $REGION"
  
  # Check if the key ring exists
  print_message "info" "Checking if key ring exists..."
  if ! gcloud kms keyrings describe "$KEY_RING" --location="$REGION" &>/dev/null; then
    print_message "error" "Key ring '$KEY_RING' not found in region '$REGION'."
    print_message "info" "Please run setup-crypto-key-rotation.sh first to create the key ring."
    exit 1
  fi
  
  # Print key ring information
  print_message "info" "Key ring information:"
  gcloud kms keyrings describe "$KEY_RING" --location="$REGION" --format="yaml"
  
  # Check encryption key status
  print_message "info" "Checking encryption key status..."
  if gcloud kms keys describe "$ENCRYPTION_KEY" --keyring="$KEY_RING" --location="$REGION" &>/dev/null; then
    # Get key details
    print_message "info" "Encryption key information:"
    KEY_INFO=$(gcloud kms keys describe "$ENCRYPTION_KEY" --keyring="$KEY_RING" --location="$REGION" --format="yaml")
    echo "$KEY_INFO"
    
    # Extract next rotation time
    NEXT_ROTATION=$(echo "$KEY_INFO" | grep "nextRotationTime" | cut -d "'" -f 2)
    if [ -n "$NEXT_ROTATION" ]; then
      print_message "info" "Next rotation scheduled for: $NEXT_ROTATION"
      
      # Calculate days until next rotation
      NOW=$(date -u +"%s")
      NEXT_ROTATION_EPOCH=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$NEXT_ROTATION" +"%s" 2>/dev/null || echo "0")
      
      if [ "$NEXT_ROTATION_EPOCH" != "0" ]; then
        SECONDS_UNTIL_ROTATION=$((NEXT_ROTATION_EPOCH - NOW))
        DAYS_UNTIL_ROTATION=$((SECONDS_UNTIL_ROTATION / 86400))
        
        if [ "$DAYS_UNTIL_ROTATION" -lt 0 ]; then
          print_message "warning" "Rotation is overdue by $((DAYS_UNTIL_ROTATION * -1)) days!"
        else
          print_message "info" "Days until next rotation: $DAYS_UNTIL_ROTATION"
        fi
      else
        print_message "warning" "Could not determine days until next rotation."
      fi
    else
      print_message "warning" "Automatic rotation not configured for encryption key."
    fi
    
    # List key versions
    print_message "info" "Encryption key versions:"
    gcloud kms keys versions list \
      --key="$ENCRYPTION_KEY" \
      --keyring="$KEY_RING" \
      --location="$REGION" \
      --format="table(name.basename():label=VERSION, state:label=STATE, createTime:label=CREATED)"
  else
    print_message "warning" "Encryption key '$ENCRYPTION_KEY' not found."
  fi
  
  # Check for signing key
  print_message "info" "Checking signing key..."
  if gcloud kms keys describe "igw-signing-key" --keyring="$KEY_RING" --location="$REGION" &>/dev/null; then
    print_message "info" "Signing key information:"
    gcloud kms keys describe "igw-signing-key" --keyring="$KEY_RING" --location="$REGION" --format="yaml"
    
    # List key versions
    print_message "info" "Signing key versions:"
    gcloud kms keys versions list \
      --key="igw-signing-key" \
      --keyring="$KEY_RING" \
      --location="$REGION" \
      --format="table(name.basename():label=VERSION, state:label=STATE, createTime:label=CREATED)"
  else
    print_message "warning" "Signing key 'igw-signing-key' not found."
  fi
  
  # Check for versioned signing keys
  print_message "info" "Checking for versioned signing keys..."
  VERSIONED_KEYS=$(gcloud kms keys list \
    --keyring="$KEY_RING" \
    --location="$REGION" \
    --filter="name : igw-signing-key-v*" \
    --format="table(name.basename():label=KEY_NAME, purpose:label=PURPOSE, createTime:label=CREATED)" 2>/dev/null || echo "")
  
  if [ -n "$VERSIONED_KEYS" ]; then
    print_message "info" "Available versioned signing keys:"
    echo "$VERSIONED_KEYS"
  else
    print_message "info" "No versioned signing keys found."
  fi
  
  # Check gateway configuration
  print_message "info" "Checking gateway configuration..."
  CONFIG_FILE="/Users/as/asoos/integration-gateway/gateway-config.yaml"
  
  if [ -f "$CONFIG_FILE" ]; then
    print_message "info" "Gateway configuration file found."
    
    # Extract crypto configuration
    CRYPTO_CONFIG=$(grep -A 10 "crypto:" "$CONFIG_FILE")
    if [ -n "$CRYPTO_CONFIG" ]; then
      print_message "info" "Crypto configuration:"
      echo "$CRYPTO_CONFIG"
      
      # Extract signing key name
      CONFIGURED_SIGNING_KEY=$(grep "signing_key:" "$CONFIG_FILE" | awk '{print $2}' | tr -d '"')
      
      if [ -n "$CONFIGURED_SIGNING_KEY" ]; then
        print_message "info" "Configured signing key: $CONFIGURED_SIGNING_KEY"
        
        # Check if the configured signing key exists
        if gcloud kms keys describe "$CONFIGURED_SIGNING_KEY" --keyring="$KEY_RING" --location="$REGION" &>/dev/null; then
          print_message "success" "Configured signing key exists and is valid."
        else
          print_message "error" "Configured signing key does not exist in KMS. Please check the configuration."
        fi
      else
        print_message "warning" "Could not determine configured signing key from gateway-config.yaml."
      fi
    else
      print_message "warning" "Crypto configuration not found in gateway-config.yaml."
    fi
  else
    print_message "warning" "Gateway configuration file not found at $CONFIG_FILE."
  fi
  
  print_message "success" "Crypto key status check completed."
}

# Run the main function with all arguments
main "$@"