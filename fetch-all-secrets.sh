#!/bin/bash
# fetch-all-secrets.sh - Comprehensive script to fetch all GCP secrets for the Aixtiv Symphony platform
# Path: /Users/as/asoos/integration-gateway/fetch-all-secrets.sh

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

PROJECT_ID="859242575175"
OUTPUT_DIR="$PWD/secrets_output"
ENV_FILE="$PWD/.env.secrets"
SECRETS_JSON="$PWD/secrets.json"

echo -e "${MAGENTA}======================================================${NC}"
echo -e "${MAGENTA}   AIXTIV SYMPHONY INTEGRATION GATEWAY - SECRET MANAGER${NC}"
echo -e "${MAGENTA}======================================================${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Current directory: $(pwd)${NC}"
echo -e "${BLUE}Output directory: ${OUTPUT_DIR}${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed or not in PATH${NC}"
    echo "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check gcloud auth
echo -e "\n${BLUE}Checking GCP authentication...${NC}"
GCP_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -z "$GCP_ACCOUNT" ]; then
    echo -e "${RED}Error: Not authenticated with GCP${NC}"
    echo "Please run: gcloud auth login"
    exit 1
else
    echo -e "${GREEN}✅ Authenticated as: ${GCP_ACCOUNT}${NC}"
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"
echo "# Aixtiv Symphony Secrets - Generated on $(date)" > "$ENV_FILE"
echo "{" > "$SECRETS_JSON"
echo "  \"generated_on\": \"$(date)\"," >> "$SECRETS_JSON"
echo "  \"project_id\": \"${PROJECT_ID}\"," >> "$SECRETS_JSON"
echo "  \"secrets\": {" >> "$SECRETS_JSON"

# Function to safely access a secret and export it as an environment variable
fetch_secret() {
    local secret_name=$1
    local env_var_name=$2
    local last=$3
    
    echo -e "Fetching secret: ${CYAN}${secret_name}${NC}..."
    
    if value=$(gcloud secrets versions access latest --secret=${secret_name} --project=${PROJECT_ID} 2>/dev/null); then
        # Successfully retrieved the secret
        export "${env_var_name}=${value}"
        
        # Add to .env file
        echo "# Secret: ${secret_name}" >> "$ENV_FILE"
        echo "export ${env_var_name}=\"${value}\"" >> "$ENV_FILE"
        echo "" >> "$ENV_FILE"
        
        # Add to secrets.json
        echo "    \"${secret_name}\": {" >> "$SECRETS_JSON"
        echo "      \"env_var\": \"${env_var_name}\"," >> "$SECRETS_JSON"
        echo "      \"length\": ${#value}," >> "$SECRETS_JSON"
        echo "      \"fetched\": true" >> "$SECRETS_JSON"
        if [ "$last" = "true" ]; then
            echo "    }" >> "$SECRETS_JSON"
        else
            echo "    }," >> "$SECRETS_JSON"
        fi
        
        # Save to individual file
        echo "${value}" > "${OUTPUT_DIR}/${secret_name}.secret"
        
        echo -e "${GREEN}✅ Successfully accessed ${secret_name} and stored as ${env_var_name} (${#value} characters)${NC}"
    else
        # Failed to retrieve the secret
        echo -e "${RED}❌ Failed to access secret: ${secret_name}${NC}"
        
        # Add to secrets.json as failed
        echo "    \"${secret_name}\": {" >> "$SECRETS_JSON"
        echo "      \"env_var\": \"${env_var_name}\"," >> "$SECRETS_JSON"
        echo "      \"length\": 0," >> "$SECRETS_JSON"
        echo "      \"fetched\": false," >> "$SECRETS_JSON"
        echo "      \"error\": \"Failed to access secret\"" >> "$SECRETS_JSON"
        if [ "$last" = "true" ]; then
            echo "    }" >> "$SECRETS_JSON"
        else
            echo "    }," >> "$SECRETS_JSON"
        fi
        
        return 1
    fi
}

# Generate an appropriate environment variable name from a secret name
normalize_env_var_name() {
    local name=$1
    # Convert to uppercase, replace hyphens and periods with underscores
    name=$(echo "$name" | tr '[:lower:]' '[:upper:]' | tr '-' '_' | tr '.' '_')
    echo "$name"
}

echo -e "\n${BLUE}Fetching list of all secrets in project ${PROJECT_ID}...${NC}"
secrets=($(gcloud secrets list --project=${PROJECT_ID} --format="value(name)" | sort))
echo -e "${GREEN}Found ${#secrets[@]} secrets${NC}"

# Process all secrets
total_secrets=${#secrets[@]}
for i in "${!secrets[@]}"; do
    secret_name=${secrets[$i]}
    env_var_name=$(normalize_env_var_name "$secret_name")
    
    # Check if this is the last secret for JSON formatting
    if [ $((i+1)) -eq $total_secrets ]; then
        fetch_secret "$secret_name" "$env_var_name" "true"
    else
        fetch_secret "$secret_name" "$env_var_name" "false"
    fi
done

# Finalize JSON
echo "  }" >> "$SECRETS_JSON"
echo "}" >> "$SECRETS_JSON"

echo -e "\n${MAGENTA}======================================================${NC}"
echo -e "${GREEN}✅ Secret processing complete!${NC}"
echo -e "${MAGENTA}======================================================${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "- ${CYAN}${total_secrets}${NC} secrets processed from project ${PROJECT_ID}"
echo -e "- Environment variables saved to: ${CYAN}${ENV_FILE}${NC}"
echo -e "- Secret values saved individually to: ${CYAN}${OUTPUT_DIR}/${NC}"
echo -e "- JSON metadata saved to: ${CYAN}${SECRETS_JSON}${NC}"
echo -e "\n${YELLOW}Usage instructions:${NC}"
echo -e "1. To load all secrets as environment variables:"
echo -e "   ${CYAN}source ${ENV_FILE}${NC}"
echo -e "2. To use a specific secret in your application:"
echo -e "   ${CYAN}MY_API_KEY=\$(cat ${OUTPUT_DIR}/api-key.secret)${NC}"
echo -e "3. For Aixtiv Symphony integration:"
echo -e "   - Copy ${ENV_FILE} to /Users/as/asoos/integration-gateway/.env"
echo -e "   - Use the secrets.json file for the integration gateway configuration"
echo -e "${MAGENTA}======================================================${NC}"
