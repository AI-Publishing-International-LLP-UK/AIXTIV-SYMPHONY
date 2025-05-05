#!/bin/zsh

# ----------------------------------------------------------------
# Script to set the ANTHROPIC_API_KEY environment variable
# from Google Cloud Secret Manager
# ----------------------------------------------------------------

# Configuration
PROJECT_ID="api-for-warp-drive"
SECRET_NAME="new-admin-anthropic"
SECRET_VERSION="latest"

# ANSI color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "📦 Retrieving Anthropic API key from Google Cloud Secret Manager..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: Google Cloud SDK (gcloud) is not installed!${NC}"
    echo "Please install it first: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if authenticated with gcloud
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
if [ -z "$ACTIVE_ACCOUNT" ]; then
    echo -e "${RED}Error: Not authenticated with Google Cloud!${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

echo -e "${YELLOW}Using Google Cloud account: ${ACTIVE_ACCOUNT}${NC}"
echo -e "${YELLOW}Project: ${PROJECT_ID}${NC}"

# Get the secret value
API_KEY=$(gcloud secrets versions access $SECRET_VERSION --secret=$SECRET_NAME --project=$PROJECT_ID 2>/dev/null)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Error: Failed to retrieve secret! Check your permissions and secret name.${NC}"
    echo "Make sure you have Secret Manager Accessor role (roles/secretmanager.secretAccessor)"
    exit 1
fi

# Set the environment variable
export ANTHROPIC_API_KEY="$API_KEY"

# Verify that it was set (without revealing the key)
if [[ -n "$ANTHROPIC_API_KEY" ]]; then
    KEY_LENGTH=${#ANTHROPIC_API_KEY}
    FIRST_FOUR=${ANTHROPIC_API_KEY:0:4}
    OBSCURED_PART=$(printf '*%.0s' {1..20})
    
    echo -e "${GREEN}✅ ANTHROPIC_API_KEY has been set successfully!${NC}"
    echo -e "  Key begins with: ${FIRST_FOUR}${OBSCURED_PART} and has ${KEY_LENGTH} characters"
    
    echo ""
    echo -e "${YELLOW}This key will only be available in the current shell session.${NC}"
    echo -e "${YELLOW}To use it in your scripts, run:${NC}"
    echo ""
    echo "  source scripts/set_anthropic_key_from_gcloud.sh"
    echo "  python scripts/claude_embedded_repos.py  # or any other script"
else
    echo -e "${RED}❌ Failed to set ANTHROPIC_API_KEY${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Ready to use Claude API with key from GCP Secret Manager!${NC}"
