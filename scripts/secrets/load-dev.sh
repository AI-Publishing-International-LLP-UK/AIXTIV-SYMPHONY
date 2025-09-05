#!/bin/bash

# ASOOS Development Secrets Loader
# Decrypts SOPS-encrypted secrets and creates Docker secrets for development environment
# 
# Usage: ./scripts/secrets/load-dev.sh
# Prerequisites: SOPS installed, Age key configured, Docker running

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SECRETS_FILE="${PROJECT_ROOT}/thirdparty.dev.enc.yml"
TEMP_DIR=$(mktemp -d)
LOG_FILE="${PROJECT_ROOT}/logs/secrets-dev-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${2:-}$(date '+%Y-%m-%d %H:%M:%S') - $1${NC}" | tee -a "${LOG_FILE}"
}

# Error handling
cleanup() {
    if [[ -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
        log "Cleaned up temporary directory" "${GREEN}"
    fi
}
trap cleanup EXIT

error_exit() {
    log "ERROR: $1" "${RED}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..." "${BLUE}"
    
    # Check if SOPS is installed
    if ! command -v sops &> /dev/null; then
        error_exit "SOPS is not installed. Please install it with: brew install sops"
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error_exit "Docker is not running. Please start Docker Desktop."
    fi
    
    # Check if Age key is configured
    if [[ -z "${SOPS_AGE_KEY_FILE:-}" ]]; then
        error_exit "SOPS_AGE_KEY_FILE environment variable is not set. Please configure your Age key."
    fi
    
    if [[ ! -f "${SOPS_AGE_KEY_FILE}" ]]; then
        error_exit "Age key file not found: ${SOPS_AGE_KEY_FILE}"
    fi
    
    # Check if secrets file exists
    if [[ ! -f "${SECRETS_FILE}" ]]; then
        error_exit "Secrets file not found: ${SECRETS_FILE}"
    fi
    
    log "Prerequisites check passed" "${GREEN}"
}

# Decrypt secrets file
decrypt_secrets() {
    log "Decrypting secrets file..." "${BLUE}"
    
    local decrypted_file="${TEMP_DIR}/decrypted-secrets.yml"
    
    if ! sops -d "${SECRETS_FILE}" > "${decrypted_file}"; then
        error_exit "Failed to decrypt secrets file"
    fi
    
    log "Secrets decrypted successfully" "${GREEN}"
    echo "${decrypted_file}"
}

# Parse YAML and create Docker secrets
create_docker_secrets() {
    local decrypted_file="$1"
    log "Creating Docker secrets from decrypted file..." "${BLUE}"
    
    # List of secrets to create for development environment
    local dev_secrets=(
        # Stripe secrets
        "stripe-dev-secret-key-test"
        "stripe-dev-publishable-key-test" 
        "stripe-dev-webhook-secret-read"
        "stripe-dev-client-id-oauth"
        
        # MongoDB secrets
        "mongodb-dev-connection-string-admin"
        "mongodb-dev-database-name-read"
        "mongodb-dev-atlas-api-key-read"
        
        # GitHub secrets
        "github-dev-pat-write"
        "github-dev-oauth-client-id-read"
        "github-dev-oauth-client-secret-write"
        
        # Docker Hub secrets
        "dockerhub-dev-access-token-push"
        "dockerhub-dev-username-pull"
        "dockerhub-dev-webhook-secret-write"
        
        # Grafana secrets
        "grafana-dev-api-key-admin"
        "grafana-dev-service-token-write"
        "grafana-dev-org-id-read"
        
        # Notion secrets
        "notion-dev-integration-token-write"
        "notion-dev-database-id-read"
        "notion-dev-oauth-client-secret-write"
        
        # Chroma secrets
        "chroma-dev-api-key-admin"
        "chroma-dev-client-id-write"
        "chroma-dev-endpoint-url-read"
        
        # Elasticsearch secrets
        "elasticsearch-dev-api-key-admin"
        "elasticsearch-dev-username-read"
        "elasticsearch-dev-password-read"
        
        # Atlassian secrets
        "atlassian-dev-api-key-admin"
        "atlassian-dev-org-id-read"
        "atlassian-dev-base-url-read"
        
        # CData Connect secrets
        "cdata-dev-connection-token-sync"
        "cdata-dev-oauth-client-secret-write"
        "cdata-dev-refresh-token-sync"
    )
    
    local created_count=0
    local skipped_count=0
    local failed_count=0
    
    for secret_name in "${dev_secrets[@]}"; do
        # Extract secret value using yq (or fallback to grep/awk if yq not available)
        local secret_value
        if command -v yq &> /dev/null; then
            secret_value=$(yq eval ".${secret_name} // empty" "${decrypted_file}")
        else
            # Fallback using grep and sed
            secret_value=$(grep "^${secret_name}:" "${decrypted_file}" | sed 's/^[^:]*:[[:space:]]*//' | sed 's/^["'"'"']//' | sed 's/["'"'"']$//')
        fi
        
        if [[ -z "${secret_value}" || "${secret_value}" == "null" ]]; then
            log "Skipping ${secret_name}: value is empty or contains placeholder" "${YELLOW}"
            ((skipped_count++))
            continue
        fi
        
        # Check if secret already exists
        if docker secret inspect "${secret_name}" &> /dev/null; then
            log "Secret ${secret_name} already exists, removing first..." "${YELLOW}"
            if ! docker secret rm "${secret_name}" 2>/dev/null; then
                log "Warning: Could not remove existing secret ${secret_name}" "${YELLOW}"
            fi
        fi
        
        # Create Docker secret
        if echo "${secret_value}" | docker secret create "${secret_name}" - &> /dev/null; then
            log "Created secret: ${secret_name}" "${GREEN}"
            ((created_count++))
        else
            log "Failed to create secret: ${secret_name}" "${RED}"
            ((failed_count++))
        fi
    done
    
    log "Docker secrets creation completed:" "${BLUE}"
    log "  Created: ${created_count}" "${GREEN}"
    log "  Skipped: ${skipped_count}" "${YELLOW}" 
    log "  Failed: ${failed_count}" "${RED}"
    
    if [[ ${failed_count} -gt 0 ]]; then
        error_exit "Some secrets failed to be created"
    fi
}

# List created secrets
list_secrets() {
    log "Listing created development secrets..." "${BLUE}"
    echo
    docker secret ls --filter name=*-dev- --format "table {{.Name}}\t{{.CreatedAt}}\t{{.UpdatedAt}}"
    echo
}

# Validate secrets are accessible
validate_secrets() {
    log "Validating secrets accessibility..." "${BLUE}"
    
    local test_container="asoos-secrets-test"
    
    # Create a temporary container to test secret mounting
    if docker run --rm --name "${test_container}" \
        --secret="stripe-dev-secret-key-test" \
        --secret="mongodb-dev-connection-string-admin" \
        alpine:latest sh -c "
            echo 'Testing secret file mounting...'
            ls -la /run/secrets/ || echo 'No secrets directory found'
            if [ -f '/run/secrets/stripe-dev-secret-key-test' ]; then
                echo 'Stripe secret file exists and is readable'
                echo 'Length:' \$(wc -c < /run/secrets/stripe-dev-secret-key-test)
            else
                echo 'Stripe secret file not found'
                exit 1
            fi
        " &> /dev/null; then
        log "Secret validation passed" "${GREEN}"
    else
        log "Secret validation failed" "${RED}"
    fi
}

# Main execution
main() {
    log "Starting ASOOS Development Secrets Loading..." "${BLUE}"
    log "Project root: ${PROJECT_ROOT}" "${BLUE}"
    log "Secrets file: ${SECRETS_FILE}" "${BLUE}"
    log "Log file: ${LOG_FILE}" "${BLUE}"
    
    # Ensure logs directory exists
    mkdir -p "$(dirname "${LOG_FILE}")"
    
    # Execute steps
    check_prerequisites
    
    local decrypted_file
    decrypted_file=$(decrypt_secrets)
    
    create_docker_secrets "${decrypted_file}"
    
    list_secrets
    
    validate_secrets
    
    log "Development secrets loading completed successfully!" "${GREEN}"
    log "You can now run: docker-compose -f compose.dev.yml up -d" "${GREEN}"
    
    # Instructions
    echo
    log "Next steps:" "${BLUE}"
    echo "  1. Verify the secrets contain actual values (not placeholders)"
    echo "  2. Start the development environment: docker-compose -f compose.dev.yml up -d"
    echo "  3. Test MCP server: curl http://localhost:8081/health"
    echo "  4. Check logs: docker logs asoos-mcp-server-dev"
    echo
}

# Run main function
main "$@"
