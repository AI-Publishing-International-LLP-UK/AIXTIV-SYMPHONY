#!/bin/bash
set -e

# Configuration
PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
SERVICE_NAME="day1-service"
SERVICE_ACCOUNT="drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com"
BUILD_CONFIG="./cloudbuild.yaml"
MIN_INSTANCES=1
MAX_INSTANCES=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log() {
    local level=$1
    shift
    echo -e "${level}[$(date +'%Y-%m-%d %H:%M:%S')] $@${NC}"
}

info() { log "${GREEN}" "$@"; }
warn() { log "${YELLOW}" "$@"; }
error() { log "${RED}" "$@"; }

# Error handling
cleanup() {
    if [ $? -ne 0 ]; then
        error "Deployment failed"
        exit 1
    fi
}

trap cleanup EXIT

# Initialize environment
initialize_environment() {
    info "Initializing deployment environment..."
    
    # Authenticate with service account
    gcloud auth activate-service-account "${SERVICE_ACCOUNT}" \
        --key-file="$(pwd)/service-account-key.json" \
        --project="${PROJECT_ID}" || {
        error "Failed to activate service account"
        return 1
    }
    
    # Set project and region
    gcloud config set project "${PROJECT_ID}"
    gcloud config set run/region "${REGION}"
}

# Setup secrets
setup_secrets() {
    info "Setting up secrets..."
    
    local secrets=("API_KEY" "DB_PASSWORD" "INTEGRATION_TOKEN")
    for secret in "${secrets[@]}"; do
        if ! gcloud secrets describe "${secret}" &>/dev/null; then
            info "Creating secret: ${secret}"
            gcloud secrets create "${secret}" \
                --replication-policy="automatic" || {
                error "Failed to create secret: ${secret}"
                return 1
            }
        fi
    done
}

# Deploy service
deploy_service() {
    info "Deploying service..."
    
    # Submit build
    info "Submitting build to Cloud Build..."
    gcloud builds submit \
        --config="${BUILD_CONFIG}" \
        --substitutions=_REGION="${REGION}" || {
        error "Build submission failed"
        return 1
    }

    # Update service
    info "Updating service configuration..."
    gcloud run services update "${SERVICE_NAME}" \
        --platform=managed \
        --region="${REGION}" \
        --min-instances="${MIN_INSTANCES}" \
        --max-instances="${MAX_INSTANCES}" \
        --set-secrets=API_KEY=API_KEY:latest,DB_PASSWORD=DB_PASSWORD:latest || {
        error "Service update failed"
        return 1
    }
}

# Health check
health_check() {
    info "Performing health check..."
    
    local max_retries=5
    local retry_count=0
    local service_url
    
    service_url=$(gcloud run services describe "${SERVICE_NAME}" \
        --platform=managed \
        --region="${REGION}" \
        --format="get(status.url)") || {
        error "Failed to get service URL"
        return 1
    }

    while [ $retry_count -lt $max_retries ]; do
        if curl -s -o /dev/null -w "%{http_code}" "${service_url}/health" | grep -q "200"; then
            info "Health check passed"
            return 0
        fi
        retry_count=$((retry_count + 1))
        sleep 5
    done
    
    error "Health check failed after ${max_retries} attempts"
    return 1
}

# Main deployment process
main() {
    info "=== Starting deployment to Cloud Run ==="
    
    initialize_environment || exit 1
    setup_secrets || exit 1
    deploy_service || exit 1
    health_check || exit 1
    
    info "=== Deployment completed successfully ==="
}

main "$@"
