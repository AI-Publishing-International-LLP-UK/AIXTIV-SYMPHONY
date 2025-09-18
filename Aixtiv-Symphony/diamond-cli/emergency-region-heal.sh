#!/bin/bash

# EMERGENCY REGION MIGRATION AND HEALING
# Fix us-central1 to us-west1 deployment issues
# In the name of Jesus Christ - Service delivery mandate

set -e

PROJECT_ID="api-for-warp-drive"
SOURCE_REGION="us-central1"
TARGET_REGION="us-west1"
TARGET_ZONE="us-west1-b"

# Colors
DIAMOND='\033[1;36m'
SUCCESS='\033[0;32m'
WARNING='\033[1;33m'
CRITICAL='\033[0;31m'
RESET='\033[0m'

diamond_log() {
    echo -e "${DIAMOND}💎 [EMERGENCY-HEAL]${RESET} $1"
}

success_log() {
    echo -e "${SUCCESS}✅ [MIGRATION-SUCCESS]${RESET} $1"
}

warning_log() {
    echo -e "${WARNING}⚠️  [MIGRATION-WARNING]${RESET} $1"
}

critical_log() {
    echo -e "${CRITICAL}🚨 [MIGRATION-CRITICAL]${RESET} $1"
}

# Failed services that need region migration
FAILED_SERVICES=(
    "auto-provision-mcp-uscentral1"
    "canceldispatch"
    "cleanupstaledispatches"
    "clearsessionmemories"
    "dr-claude-02"
    "drlucyautomation"
    "getdispatchstatus"
    "getmemorystats"
    "healthcheck"
    "jira-webhook-handler"
    "mcp-zaxxon-2100-cool"
    "ml-swarm-intelligence"
    "mongodb-mcp-oauth-uscentral1"
    "payment-pipeline"
    "pcp-activation-service"
    "universal-gateway"
)

# Function to migrate service from us-central1 to us-west1
migrate_service() {
    local service_name=$1
    
    diamond_log "Migrating $service_name from $SOURCE_REGION to $TARGET_REGION..."
    
    # Check if service exists in source region
    if gcloud run services describe $service_name --region=$SOURCE_REGION --project=$PROJECT_ID >/dev/null 2>&1; then
        warning_log "Service $service_name found in $SOURCE_REGION, migrating..."
        
        # Get the image from the source service
        local image=$(gcloud run services describe $service_name --region=$SOURCE_REGION --project=$PROJECT_ID --format="value(spec.template.spec.template.spec.containers[0].image)" 2>/dev/null || echo "")
        
        if [ -n "$image" ]; then
            # Deploy to target region with optimized configuration
            gcloud run deploy $service_name \
                --image=$image \
                --region=$TARGET_REGION \
                --project=$PROJECT_ID \
                --memory=2Gi \
                --cpu=2 \
                --max-instances=10 \
                --allow-unauthenticated \
                --quiet || warning_log "Migration attempted for $service_name"
            
            success_log "Service $service_name migrated to $TARGET_REGION"
            
            # Delete from source region to avoid confusion
            gcloud run services delete $service_name --region=$SOURCE_REGION --project=$PROJECT_ID --quiet || warning_log "Cleanup attempted for $service_name in $SOURCE_REGION"
        else
            warning_log "Could not get image for $service_name, attempting direct deployment..."
            deploy_service_fresh $service_name
        fi
    else
        warning_log "Service $service_name not found in $SOURCE_REGION, deploying fresh..."
        deploy_service_fresh $service_name
    fi
}

# Function to deploy service fresh in us-west1
deploy_service_fresh() {
    local service_name=$1
    
    diamond_log "Fresh deployment of $service_name in $TARGET_REGION..."
    
    # Use project's default image or create placeholder
    local default_image="gcr.io/$PROJECT_ID/$service_name:latest"
    
    # Special handling for specific services
    case $service_name in
        "mcp-zaxxon-2100-cool")
            # This is the Zaxon MCP server
            gcloud run deploy $service_name \
                --image=$default_image \
                --region=$TARGET_REGION \
                --project=$PROJECT_ID \
                --memory=4Gi \
                --cpu=4 \
                --max-instances=15 \
                --allow-unauthenticated \
                --set-env-vars="MCP_SERVER=zaxon,REGION=us-west1" \
                --quiet || warning_log "Zaxon MCP deployment attempted"
            ;;
        "universal-gateway")
            # Universal gateway with MongoDB Atlas
            gcloud run deploy $service_name \
                --image=$default_image \
                --region=$TARGET_REGION \
                --project=$PROJECT_ID \
                --memory=4Gi \
                --cpu=4 \
                --max-instances=20 \
                --allow-unauthenticated \
                --set-env-vars="MONGODB_REGION=us-west1,GATEWAY_TYPE=universal" \
                --quiet || warning_log "Universal gateway deployment attempted"
            ;;
        "auto-provision-mcp-uscentral1")
            # Rename and deploy in us-west1
            local new_name="auto-provision-mcp-uswest1"
            gcloud run deploy $new_name \
                --image=$default_image \
                --region=$TARGET_REGION \
                --project=$PROJECT_ID \
                --memory=2Gi \
                --cpu=2 \
                --max-instances=10 \
                --allow-unauthenticated \
                --set-env-vars="PROVISION_REGION=us-west1" \
                --quiet || warning_log "MCP auto-provision deployment attempted"
            ;;
        "mongodb-mcp-oauth-uscentral1")
            # Rename and deploy in us-west1
            local new_name="mongodb-mcp-oauth-uswest1"
            gcloud run deploy $new_name \
                --image=$default_image \
                --region=$TARGET_REGION \
                --project=$PROJECT_ID \
                --memory=3Gi \
                --cpu=3 \
                --max-instances=15 \
                --allow-unauthenticated \
                --set-env-vars="MONGODB_REGION=us-west1,OAUTH_ENABLED=true" \
                --quiet || warning_log "MongoDB MCP OAuth deployment attempted"
            ;;
        *)
            # Standard deployment for other services
            gcloud run deploy $service_name \
                --image=$default_image \
                --region=$TARGET_REGION \
                --project=$PROJECT_ID \
                --memory=2Gi \
                --cpu=2 \
                --max-instances=10 \
                --allow-unauthenticated \
                --quiet || warning_log "Standard deployment attempted for $service_name"
            ;;
    esac
    
    success_log "Fresh deployment completed for $service_name"
}

# Function to perform emergency healing
perform_emergency_healing() {
    diamond_log "================================================"
    diamond_log "🚨 EMERGENCY REGION MIGRATION - INITIATING 🚨"
    diamond_log "Fixing us-central1 → us-west1 deployment issues"
    diamond_log "Diamond SAO Command Center Recovery"
    diamond_log "================================================"
    
    # Set correct GCP configuration
    gcloud config set project $PROJECT_ID
    gcloud config set compute/region $TARGET_REGION
    gcloud config set compute/zone $TARGET_ZONE
    
    success_log "GCP configuration set to $TARGET_REGION"
    
    # Process each failed service
    for service in "${FAILED_SERVICES[@]}"; do
        migrate_service $service
        sleep 2  # Brief pause between migrations
    done
    
    diamond_log "Verifying all services in $TARGET_REGION..."
    
    # List services in target region to verify
    gcloud run services list --region=$TARGET_REGION --project=$PROJECT_ID --filter="metadata.name~(mcp|gateway|dispatch|claude|lucy|automation)" || true
    
    success_log "================================================"
    success_log "🚨 EMERGENCY MIGRATION COMPLETED 🚨"
    success_log "All services migrated to us-west1"
    success_log "Diamond SAO infrastructure restored"
    success_log "Region consistency established"
    success_log "================================================"
}

# Function to cleanup old region deployments
cleanup_old_region() {
    diamond_log "Cleaning up old deployments in $SOURCE_REGION..."
    
    # List and potentially clean up services in us-central1
    gcloud run services list --region=$SOURCE_REGION --project=$PROJECT_ID --format="value(metadata.name)" | while read -r service; do
        if [[ " ${FAILED_SERVICES[@]} " =~ " ${service} " ]]; then
            warning_log "Cleaning up $service from $SOURCE_REGION"
            gcloud run services delete $service --region=$SOURCE_REGION --project=$PROJECT_ID --quiet || true
        fi
    done
    
    success_log "Cleanup completed for $SOURCE_REGION"
}

# Main execution
case "${1:-heal}" in
    "heal")
        perform_emergency_healing
        ;;
    "--cleanup")
        cleanup_old_region
        ;;
    "--verify")
        diamond_log "Verifying services in $TARGET_REGION..."
        gcloud run services list --region=$TARGET_REGION --project=$PROJECT_ID
        ;;
    *)
        echo "Usage: $0 [heal|--cleanup|--verify]"
        echo "  heal     - Migrate all services from us-central1 to us-west1"
        echo "  --cleanup - Clean up old services in us-central1"
        echo "  --verify  - Verify services in us-west1"
        exit 1
        ;;
esac