#!/bin/bash
# initialize-key-rotation.sh
#
# This script initializes the cryptographic key rotation for the Integration Gateway.
# It creates the key ring and keys in KMS, grants the necessary permissions, and
# tests the rotation functionality.
#
# Usage:
#   ./initialize-key-rotation.sh [project-id]

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
  echo -e "${BOLD}🔐 Integration Gateway Key Rotation Initializer 🔐${NC}"
  echo -e "${BOLD}==================================================${NC}"
  echo ""
}

# Check prerequisites
check_prerequisites() {
  print_message "info" "Checking prerequisites..."

  if ! command -v gcloud &> /dev/null; then
    print_message "error" "gcloud CLI is required but not found in PATH."
    print_message "info" "Please install the Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi

  if ! command -v node &> /dev/null; then
    print_message "error" "NodeJS is required but not found in PATH."
    print_message "info" "Please install NodeJS from: https://nodejs.org/"
    exit 1
  fi

  if ! command -v npm &> /dev/null; then
    print_message "error" "NPM is required but not found in PATH."
    print_message "info" "Please install NPM from: https://www.npmjs.com/get-npm"
    exit 1
  fi

  if ! gcloud auth list --format="value(account)" 2>/dev/null | grep -q "@"; then
    print_message "error" "Not logged in to gcloud. Please run 'gcloud auth login' first."
    exit 1
  fi

  print_message "success" "All prerequisites met."
}

# Initialize key rotation
initialize_key_rotation() {
  local project_id=$1
  local region="us-west1"  # Always use us-west1
  
  print_message "info" "Initializing key rotation in project '$project_id', region '$region'..."
  
  # Ensure the script exists
  local setup_script="${0%/*}/setup-crypto-key-rotation.sh"
  if [ ! -f "$setup_script" ]; then
    print_message "error" "Could not find setup-crypto-key-rotation.sh script."
    exit 1
  fi
  
  # Make it executable
  chmod +x "$setup_script"
  
  # Run the setup script
  print_message "info" "Running setup-crypto-key-rotation.sh..."
  "$setup_script" "$project_id"
  
  print_message "success" "Key rotation initialized."
}

# Test key rotation
test_key_rotation() {
  print_message "info" "Testing key rotation functionality..."
  
  # Check if the key rotation monitor script exists
  local monitor_script="${0%/*}/monitor-key-rotation.js"
  if [ ! -f "$monitor_script" ]; then
    print_message "error" "Could not find monitor-key-rotation.js script."
    exit 1
  }
  
  # Install dependencies if needed
  if [ ! -d "${0%/*}/../node_modules/@google-cloud/kms" ]; then
    print_message "info" "Installing required dependencies..."
    (cd "${0%/*}/.." && npm install --no-save @google-cloud/kms js-yaml)
  fi
  
  # Run the monitor script
  print_message "info" "Running key rotation monitor..."
  node "$monitor_script"
  
  print_message "success" "Key rotation testing completed."
}

# Update gateway config
update_gateway_config() {
  local project_id=$1
  local region="us-west1"  # Always use us-west1
  
  print_message "info" "Updating gateway configuration..."
  
  # Check if the gateway config exists
  local config_file="${0%/*}/../gateway-config.yaml"
  if [ ! -f "$config_file" ]; then
    print_message "warning" "Could not find gateway-config.yaml. Creating a new one..."
    
    # Create a basic config file
    mkdir -p "$(dirname "$config_file")"
    cat > "$config_file" <<EOF
# Integration Gateway Configuration
apiVersion: v1
kind: Gateway
metadata:
  name: integration-gateway
spec:
  # Basic gateway settings
  displayName: "Integration Gateway Service"
  description: "API Gateway for service integration and orchestration"
  
  # Service configuration
  serviceAccount: drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com
  region: us-west1
  
  # Cryptographic key rotation configuration
  crypto:
    kms:
      project_id: "${project_id}"
      location: "${region}"
      key_ring: "integration-gateway-ring"
      encryption_key: "igw-encryption-key"
      signing_key: "igw-signing-key"
      rotation:
        encryption_key_period: "30d"
        signing_key_period: "90d"
    secret_manager:
      enabled: true
      project_id: "${project_id}"
      region: "${region}"
EOF
    
    print_message "success" "Created new gateway-config.yaml with key rotation configuration."
  else
    # Check if the crypto section already exists
    if grep -q "crypto:" "$config_file"; then
      print_message "info" "Crypto configuration already exists in gateway-config.yaml."
    else
      # Add the crypto section
      print_message "info" "Adding crypto configuration to gateway-config.yaml..."
      
      # Create a temporary file
      local temp_file=$(mktemp)
      
      # Copy the content and add the crypto section before the last line
      head -n -1 "$config_file" > "$temp_file"
      
      cat >> "$temp_file" <<EOF
  
  # Cryptographic key rotation configuration
  crypto:
    kms:
      project_id: "${project_id}"
      location: "${region}"
      key_ring: "integration-gateway-ring"
      encryption_key: "igw-encryption-key"
      signing_key: "igw-signing-key"
      rotation:
        encryption_key_period: "30d"
        signing_key_period: "90d"
    secret_manager:
      enabled: true
      project_id: "${project_id}"
      region: "${region}"
EOF
      
      # Add the last line back
      tail -n 1 "$config_file" >> "$temp_file"
      
      # Replace the original file
      mv "$temp_file" "$config_file"
      
      print_message "success" "Added crypto configuration to gateway-config.yaml."
    fi
  fi
}

# Display next steps
display_next_steps() {
  echo ""
  echo -e "${BOLD}Next Steps:${NC}"
  echo -e "1. Review the key rotation configuration in ${BOLD}gateway-config.yaml${NC}"
  echo -e "2. Monitor key rotation using ${BOLD}node monitor-key-rotation.js${NC}"
  echo -e "3. Use the crypto service in your code: ${BOLD}const cryptoService = require('./services/crypto-service');${NC}"
  echo -e "4. See examples in ${BOLD}examples/crypto-rotation-example.js${NC}"
  echo ""
  echo -e "${BOLD}Documentation:${NC}"
  echo -e "- Full documentation is available in ${BOLD}docs/CRYPTOGRAPHIC_KEY_ROTATION.md${NC}"
  echo ""
  echo -e "${BOLD}Security Recommendations:${NC}"
  echo -e "- Store key versions alongside encrypted data"
  echo -e "- Rotate keys regularly (30 days for encryption, 90 days for signing)"
  echo -e "- Monitor key rotation to ensure it's working correctly"
  echo -e "- Use HSM protection for signing keys"
  echo ""
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
      print_message "info" "Usage: ./initialize-key-rotation.sh [project-id]"
      exit 1
    fi
    print_message "info" "No project specified. Using current project: $PROJECT_ID"
  fi
  
  # Update gateway config
  update_gateway_config "$PROJECT_ID"
  
  # Initialize key rotation
  initialize_key_rotation "$PROJECT_ID"
  
  # Test key rotation
  test_key_rotation
  
  # Display next steps
  display_next_steps
  
  print_message "success" "Key rotation initialization completed successfully!"
}

# Run the main function with all arguments
main "$@"