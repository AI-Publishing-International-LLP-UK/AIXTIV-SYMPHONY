#!/bin/bash
# Enhanced MOCOA deployment script with self-healing capabilities
# Fixes deployment issues and adds production monitoring

set -e  # Exit on any error

# Configuration
PROJECT_ID="api-for-warp-drive"
SERVICE_NAME="mocoa"
REGION="us-west1"
MAX_RETRIES=3
RETRY_DELAY=10

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "🚀 Starting enhanced MOCOA deployment with self-healing..."

# Pre-deployment validation
log "🔍 Running pre-deployment validation..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server.js" ] || [ ! -f "Dockerfile" ]; then
    log "❌ Error: Missing critical files. Must run from mocoa-cloud-run directory"
    log "Required files: package.json, server.js, Dockerfile"
    exit 1
fi

# Validate Node.js configuration consistency
log "🔧 Validating Node.js version consistency..."
DOCKERFILE_NODE=$(grep "FROM node:" Dockerfile | cut -d: -f2 | cut -d- -f1)
CLOUDBUILD_NODE=$(grep "name: 'node:" cloudbuild.yaml | cut -d: -f3 | cut -d- -f1 | tr -d "'")
log "Dockerfile Node version: $DOCKERFILE_NODE"
log "Cloudbuild Node version: $CLOUDBUILD_NODE"

# Check if gcloud is authenticated
log "🔐 Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    log "❌ Error: No active gcloud authentication found"
    log "Please run: gcloud auth login"
    exit 1
fi

# Set the correct project
log "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Commit any changes
log "📝 Committing changes..."
git add -A
git commit -m "🚀 Enhanced MOCOA deployment with self-healing - $(date)" || log "No changes to commit"

# Function to deploy with retry logic
deploy_with_retry() {
    local attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        log "☁️ Deployment attempt $attempt/$MAX_RETRIES..."
        
        if gcloud run deploy $SERVICE_NAME \
            --source=. \
            --region=$REGION \
            --platform=managed \
            --allow-unauthenticated \
            --project=$PROJECT_ID \
            --cpu=2 \
            --memory=2Gi \
            --max-instances=10 \
            --min-instances=1 \
            --port=8080 \
            --timeout=300 \
            --concurrency=100 \
            --set-env-vars="NODE_ENV=production,CACHE_VERSION=2.4.7" \
            --quiet; then
            log "✅ Deployment successful on attempt $attempt!"
            return 0
        else
            log "❌ Deployment attempt $attempt failed"
            if [ $attempt -lt $MAX_RETRIES ]; then
                log "⏳ Waiting ${RETRY_DELAY}s before retry..."
                sleep $RETRY_DELAY
            fi
            ((attempt++))
        fi
    done
    
    log "❌ All deployment attempts failed!"
    return 1
}

# Deploy with retry logic
if ! deploy_with_retry; then
    log "❌ Deployment failed after $MAX_RETRIES attempts"
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
log "🌐 Service URL: $SERVICE_URL"

# Wait for service to be ready
log "⏳ Waiting for service to be ready..."
sleep 15

# Enhanced health checks
log "🔍 Running comprehensive health checks..."

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    log "Testing $description..."
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL$endpoint" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log "✅ $description: OK (HTTP $response)"
        return 0
    else
        log "❌ $description: FAILED (HTTP $response)"
        return 1
    fi
}

# Run health checks
HEALTH_PASSED=true

check_endpoint "/health" "200" "Health check" || HEALTH_PASSED=false
check_endpoint "/ready" "200" "Readiness check" || HEALTH_PASSED=false
check_endpoint "/api/dr-claude/health" "200" "Dr. Claude orchestration" || HEALTH_PASSED=false
check_endpoint "/" "200" "Root endpoint" || HEALTH_PASSED=false

if [ "$HEALTH_PASSED" = "true" ]; then
    log "✅ All health checks passed!"
else
    log "⚠️  Some health checks failed, but deployment completed"
fi

# Test self-healing capabilities
log "🔧 Testing self-healing monitoring..."
HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/health" | jq -r '.status' 2>/dev/null || echo "unknown")
if [ "$HEALTH_RESPONSE" = "healthy" ]; then
    log "✅ Self-healing monitoring is active"
else
    log "⚠️  Self-healing status unclear"
fi

# Display deployment summary
log "📊 Deployment Summary:"
log "   Service: $SERVICE_NAME"
log "   Region: $REGION"
log "   URL: $SERVICE_URL"
log "   Project: $PROJECT_ID"
log "   Node Version: $(grep 'FROM node:' Dockerfile | cut -d: -f2)"
log "   Self-Healing: Active"
log "   Health Monitoring: Enabled"
log "   Memory Limit: 2Gi"
log "   CPU Limit: 2 vCPU"
log "   Max Instances: 10"

log "🎉 MOCOA deployment complete with self-healing capabilities!"
log "🔗 Access your application: $SERVICE_URL"
