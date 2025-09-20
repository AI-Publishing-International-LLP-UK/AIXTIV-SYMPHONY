#!/bin/bash

# Quick MCP Universal Template Staging Deployment to mocoa-us-west1-b
# High-speed deployment for immediate testing and validation

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="api-for-warp-drive"
STAGING_SERVICE_NAME="mocoa-us-west1-b"
IMAGE_NAME="gcr.io/${PROJECT_ID}/mcp-universal-template"
REGION="us-west1"
ZONE="b"

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%H:%M:%S')
    
    case $level in
        "INFO") echo -e "${BLUE}[$timestamp]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[$timestamp]${NC} $message" ;;
        "DEPLOY") echo -e "${PURPLE}[$timestamp]${NC} $message" ;;
        "WARNING") echo -e "${YELLOW}[$timestamp]${NC} $message" ;;
        "ERROR") echo -e "${RED}[$timestamp]${NC} $message" ;;
    esac
}

log "DEPLOY" "🚀 HIGH-SPEED STAGING DEPLOYMENT TO MOCOA-US-WEST1-B 🚀"

# Check prerequisites
log "INFO" "Checking prerequisites..."
if ! command -v gcloud &> /dev/null; then
    log "ERROR" "gcloud CLI not found"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    log "ERROR" "Docker not found" 
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Quick build and push
log "DEPLOY" "Building Docker image..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TAG="staging-${TIMESTAMP}"

docker build -t "${IMAGE_NAME}:${TAG}" . --quiet
gcloud auth configure-docker --quiet
docker push "${IMAGE_NAME}:${TAG}" --quiet

log "SUCCESS" "Image pushed: ${IMAGE_NAME}:${TAG}"

# Deploy to staging
log "DEPLOY" "Deploying to mocoa-us-west1-b..."

gcloud run deploy $STAGING_SERVICE_NAME \
    --image="${IMAGE_NAME}:${TAG}" \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=100 \
    --timeout=300 \
    --set-env-vars="NODE_ENV=staging,GCP_PROJECT=${PROJECT_ID},REGION=${REGION},STAGING_ZONE=${ZONE}" \
    --port=8080 \
    --execution-environment=gen2 \
    --quiet

if [ $? -eq 0 ]; then
    SERVICE_URL=$(gcloud run services describe $STAGING_SERVICE_NAME --region=$REGION --format="value(status.url)")
    log "SUCCESS" "✅ STAGING DEPLOYMENT COMPLETE!"
    log "SUCCESS" "Service URL: $SERVICE_URL"
    
    # Quick health check
    log "INFO" "Testing health endpoint..."
    sleep 5
    
    if curl -f -s "${SERVICE_URL}/health" > /dev/null 2>&1; then
        log "SUCCESS" "✅ Health check PASSED - mocoa-us-west1-b is LIVE!"
        
        # Test Promise infrastructure
        if curl -f -s "${SERVICE_URL}/api/templates/statistics" > /dev/null 2>&1; then
            log "SUCCESS" "✅ Promise infrastructure is OPERATIONAL!"
        fi
        
        echo ""
        log "SUCCESS" "🎉 MOCOA-US-WEST1-B STAGING IS READY FOR TESTING! 🎉"
        echo ""
        echo "Staging URL: $SERVICE_URL"
        echo "Health Check: $SERVICE_URL/health"
        echo "Statistics: $SERVICE_URL/api/templates/statistics"
        echo ""
        echo "Ready for Newman tests and full production deployment!"
        
    else
        log "WARNING" "Health check failed - service may still be starting up"
        log "INFO" "Service URL: $SERVICE_URL"
    fi
    
else
    log "ERROR" "Staging deployment failed"
    exit 1
fi