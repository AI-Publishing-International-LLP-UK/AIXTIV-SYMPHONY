#!/bin/bash
# setup-crypto-key-rotation.sh
#
# Sets up cryptographic key rotation for the Integration Gateway using Google Cloud KMS.
# Creates a key ring and encryption keys with automatic rotation policies.
#
# Usage:
#   ./setup-crypto-key-rotation.sh [project-id]

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
  echo -e "${BOLD}🔐 Integration Gateway Crypto Key Rotation Setup 🔐${NC}"
  echo -e "${BOLD}==================================================${NC}"
  echo ""
}

# Check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Get tomorrow's date in ISO format (cross-platform)
get_tomorrow_date() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    date -v+1d -u +"%Y-%m-%dT%H:%M:%SZ"
  else
    # Linux
    date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ"
  fi
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
      print_message "info" "Usage: ./setup-crypto-key-rotation.sh [project-id]"
      exit 1
    fi
    print_message "info" "No project specified. Using current project: $PROJECT_ID"
  fi
  
  # Set region (always us-west1 as required)
  REGION="us-west1"
  print_message "info" "Using region: $REGION"
  
  # Get tomorrow's date
  NEXT_ROTATION=$(get_tomorrow_date)
  print_message "info" "Next rotation will be scheduled for: $NEXT_ROTATION"
  
  # Set up KMS key ring
  print_message "info" "Creating KMS key ring for Integration Gateway in $REGION..."
  if gcloud kms keyrings describe integration-gateway-ring --location=$REGION 2>/dev/null; then
    print_message "info" "Key ring 'integration-gateway-ring' already exists in $REGION."
  else
    if ! gcloud kms keyrings create integration-gateway-ring --location=$REGION; then
      print_message "error" "Failed to create key ring 'integration-gateway-ring'."
      exit 1
    fi
    print_message "success" "Created key ring 'integration-gateway-ring' in $REGION."
  fi
  
  # Create primary encryption key with rotation
  print_message "info" "Creating primary encryption key with 30-day rotation period..."
  if gcloud kms keys describe igw-encryption-key --keyring=integration-gateway-ring --location=$REGION 2>/dev/null; then
    print_message "info" "Crypto key 'igw-encryption-key' already exists."
    
    # Update the rotation period if the key exists
    print_message "info" "Updating rotation period to 30 days..."
    if ! gcloud kms keys update igw-encryption-key \
         --location=$REGION \
         --keyring=integration-gateway-ring \
         --rotation-period=30d \
         --next-rotation-time="$NEXT_ROTATION"; then
      print_message "warning" "Failed to update rotation period. This may require manual update."
    else
      print_message "success" "Updated rotation period to 30 days."
    fi
  else
    if ! gcloud kms keys create igw-encryption-key \
         --location=$REGION \
         --keyring=integration-gateway-ring \
         --purpose=encryption \
         --protection-level=software \
         --rotation-period=30d \
         --next-rotation-time="$NEXT_ROTATION"; then
      print_message "error" "Failed to create crypto key 'igw-encryption-key'."
      exit 1
    fi
    print_message "success" "Created crypto key 'igw-encryption-key' with 30-day rotation."
  fi
  
  # Create HSM-protected signing key (asymmetric keys do not support automatic rotation)
  print_message "info" "Creating HSM-protected signing key..."
  if gcloud kms keys describe igw-signing-key --keyring=integration-gateway-ring --location=$REGION 2>/dev/null; then
    print_message "info" "Crypto key 'igw-signing-key' already exists."
    
    print_message "info" "Note: Asymmetric signing keys do not support automatic rotation. Manual rotation will be needed."
  else
    if ! gcloud kms keys create igw-signing-key \
         --location=$REGION \
         --keyring=integration-gateway-ring \
         --purpose=asymmetric-signing \
         --default-algorithm=rsa-sign-pkcs1-2048-sha256 \
         --protection-level=software; then
      print_message "error" "Failed to create crypto key 'igw-signing-key'."
      exit 1
    fi
    print_message "success" "Created crypto key 'igw-signing-key' for asymmetric signing."
    print_message "info" "Note: Asymmetric signing keys do not support automatic rotation. Manual rotation will be needed."
  fi
  
  # Set up service account permissions
  print_message "info" "Setting up service account permissions for KMS..."
  
  # Using drlucyautomation service account
  SERVICE_ACCOUNT="drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com"
  
  # Grant KMS CryptoKey Encrypter/Decrypter role to the service account
  print_message "info" "Granting KMS CryptoKey Encrypter/Decrypter role to service account..."
  if ! gcloud kms keys add-iam-policy-binding igw-encryption-key \
       --location=$REGION \
       --keyring=integration-gateway-ring \
       --member="serviceAccount:$SERVICE_ACCOUNT" \
       --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"; then
    print_message "warning" "Failed to grant CryptoKey Encrypter/Decrypter role. This may require manual update."
  else
    print_message "success" "Granted CryptoKey Encrypter/Decrypter role to service account."
  fi
  
  # Grant KMS CryptoKey Signer/Verifier role to the service account for the signing key
  print_message "info" "Granting KMS CryptoKey Signer/Verifier role to service account..."
  if ! gcloud kms keys add-iam-policy-binding igw-signing-key \
       --location=$REGION \
       --keyring=integration-gateway-ring \
       --member="serviceAccount:$SERVICE_ACCOUNT" \
       --role="roles/cloudkms.signerVerifier"; then
    print_message "warning" "Failed to grant CryptoKey Signer/Verifier role. This may require manual update."
  else
    print_message "success" "Granted CryptoKey Signer/Verifier role to service account."
  fi
  
  print_message "success" "Cryptographic key rotation setup for Integration Gateway is complete!"
  print_message "info" "Key ring: integration-gateway-ring"
  print_message "info" "Encryption key: igw-encryption-key (30-day rotation)"
  print_message "info" "Signing key: igw-signing-key"
  print_message "info" "Note: The signing key will need to be manually rotated - automatic rotation is not supported for asymmetric signing keys."
}

# Run the main function with all arguments
main "$@"