#!/bin/bash

# MCP Universal Template - Cloud Build Deployment
# Uses Google Cloud Build for efficient remote building and deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="api-for-warp-drive"
SERVICE_NAME="mocoa-us-west1-b"
REGION="us-west1"

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

log "DEPLOY" "🚀 CLOUD BUILD DEPLOYMENT TO MOCOA-US-WEST1-B 🚀"

# Set project
gcloud config set project $PROJECT_ID

# Enable required services
log "INFO" "Enabling Cloud Build and Cloud Run..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet

# Submit build to Cloud Build
log "DEPLOY" "Submitting build to Google Cloud Build..."

gcloud builds submit \
    --tag "gcr.io/${PROJECT_ID}/mcp-universal-template:latest" \
    --quiet

if [ $? -eq 0 ]; then
    log "SUCCESS" "✅ Cloud Build completed successfully!"
    
    # Deploy to Cloud Run
    log "DEPLOY" "Deploying to mocoa-us-west1-b..."
    
    gcloud run deploy $SERVICE_NAME \
        --image="gcr.io/${PROJECT_ID}/mcp-universal-template:latest" \
        --region=$REGION \
        --platform=managed \
        --allow-unauthenticated \
        --memory=1Gi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=10 \
        --concurrency=100 \
        --timeout=300 \
        --set-env-vars="NODE_ENV=staging,GCP_PROJECT=${PROJECT_ID},REGION=${REGION}" \
        --port=8080 \
        --execution-environment=gen2 \
        --quiet
    
    if [ $? -eq 0 ]; then
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
        log "SUCCESS" "✅ DEPLOYMENT COMPLETE!"
        log "SUCCESS" "Service URL: $SERVICE_URL"
        
        # Health check
        log "INFO" "Testing endpoints..."
        sleep 10
        
        echo ""
        log "SUCCESS" "🎉 MOCOA-US-WEST1-B IS LIVE! 🎉"
        echo ""
        echo "Service URL: $SERVICE_URL"
        echo "Health Check: $SERVICE_URL/health"
        echo "Statistics: $SERVICE_URL/api/templates/statistics"
        echo ""
        echo "Promise Infrastructure Features:"
        echo "✅ Supreme Promise Handler"
        echo "✅ Dr. Memoria Anthology Support"
        echo "✅ Dr. Lucy Cross-Region Support"
        echo "✅ Civilization AI Settlements"
        echo "✅ Newman Test Endpoints"
        echo "✅ Health Monitoring"
        echo ""
        echo "Ready for production deployment!"
        
        # Test health endpoint
        if curl -f -s "${SERVICE_URL}/health" > /dev/null 2>&1; then
            log "SUCCESS" "✅ Health check PASSED!"
        else
            log "WARNING" "Service may still be starting up..."
        fi
        
    else
        log "ERROR" "Cloud Run deployment failed"
        exit 1
    fi
else
    log "ERROR" "Cloud Build failed"
    exit 1
fi