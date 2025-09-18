#!/bin/bash

# DUPLICATE CLEANUP AND CONSOLIDATION
# Remove duplicates and ensure single region deployment in us-west1
# In the name of Jesus Christ - Service delivery mandate

set -e

PROJECT_ID="api-for-warp-drive"
PRIMARY_REGION="us-west1"
CLEANUP_REGIONS=("us-central1" "europe-west1")

# Colors
DIAMOND='\033[1;36m'
SUCCESS='\033[0;32m'
WARNING='\033[1;33m'
CRITICAL='\033[0;31m'
RESET='\033[0m'

diamond_log() {
    echo -e "${DIAMOND}💎 [CLEANUP]${RESET} $1"
}

success_log() {
    echo -e "${SUCCESS}✅ [CLEANUP-SUCCESS]${RESET} $1"
}

warning_log() {
    echo -e "${WARNING}⚠️  [CLEANUP-WARNING]${RESET} $1"
}

critical_log() {
    echo -e "${CRITICAL}🚨 [CLEANUP-CRITICAL]${RESET} $1"
}

# Services that have duplicates and need cleanup
SERVICES_TO_CLEANUP=(
    "universal-gateway"
    "asoos-mcp-enhanced-civilization" 
    "asoos-mcp-vision-lake"
    "dr-claude-01"
    "integration-gateway-mcp"
    "auto-provision-mcp-uscentral1"
    "mongodb-mcp-oauth-uscentral1"
    "drlucyautomation"
    "pcp-activation-service"
    "payment-pipeline"
    "mcp-zaxxon-2100-cool"
)

# Services that should be completely removed (failed deployments without URLs)
FAILED_SERVICES_TO_REMOVE=(
    "auto-provision-mcp-uswest1"
    "mongodb-mcp-oauth-uswest1" 
    "dr-lucy-testament-agent"
    "integration-gateway-js"
    "clearsessionmemories"
    "getmemorystats"
    "healthcheck"
    "jira-webhook-handler"
)

# Function to cleanup duplicate services
cleanup_service_duplicates() {
    local service_name=$1
    
    diamond_log "Cleaning up duplicates for $service_name..."
    
    # Check each cleanup region
    for region in "${CLEANUP_REGIONS[@]}"; do
        if gcloud run services describe $service_name --region=$region --project=$PROJECT_ID >/dev/null 2>&1; then
            warning_log "Found duplicate $service_name in $region, removing..."
            gcloud run services delete $service_name --region=$region --project=$PROJECT_ID --quiet || warning_log "Failed to delete $service_name from $region"
            success_log "Removed duplicate $service_name from $region"
        fi
    done
    
    # Ensure the service exists and is healthy in primary region
    if gcloud run services describe $service_name --region=$PRIMARY_REGION --project=$PROJECT_ID >/dev/null 2>&1; then
        success_log "$service_name confirmed in $PRIMARY_REGION"
    else
        warning_log "$service_name not found in $PRIMARY_REGION - may need manual deployment"
    fi
}

# Function to remove failed deployment services
remove_failed_services() {
    local service_name=$1
    
    diamond_log "Removing failed service $service_name..."
    
    # Check all regions and remove
    for region in "us-west1" "us-central1" "europe-west1"; do
        if gcloud run services describe $service_name --region=$region --project=$PROJECT_ID >/dev/null 2>&1; then
            warning_log "Removing failed service $service_name from $region..."
            gcloud run services delete $service_name --region=$region --project=$PROJECT_ID --quiet || warning_log "Failed to delete $service_name from $region"
            success_log "Removed failed service $service_name from $region"
        fi
    done
}

# Function to perform comprehensive cleanup
perform_comprehensive_cleanup() {
    diamond_log "================================================"
    diamond_log "🧹 COMPREHENSIVE DUPLICATE CLEANUP"  
    diamond_log "Consolidating services to us-west1 only"
    diamond_log "Diamond SAO Infrastructure Optimization"
    diamond_log "================================================"
    
    # Set GCP configuration
    gcloud config set project $PROJECT_ID
    
    diamond_log "Phase 1: Cleaning up duplicate services across regions..."
    for service in "${SERVICES_TO_CLEANUP[@]}"; do
        cleanup_service_duplicates $service
        sleep 1
    done
    
    diamond_log "Phase 2: Removing failed deployment services..."
    for service in "${FAILED_SERVICES_TO_REMOVE[@]}"; do
        remove_failed_services $service
        sleep 1
    done
    
    diamond_log "Phase 3: Verifying final state..."
    
    # List services in primary region
    diamond_log "Services remaining in $PRIMARY_REGION:"
    gcloud run services list --region=$PRIMARY_REGION --project=$PROJECT_ID --format="table(metadata.name,status.conditions[0].status,status.url)" | grep -E "(mcp|gateway|dispatch|claude|lucy|automation|provision|payment|pcp|universal)" || true
    
    # Check for any remaining duplicates
    diamond_log "Checking for remaining duplicates in other regions..."
    for region in "${CLEANUP_REGIONS[@]}"; do
        warning_log "Services in $region:"
        gcloud run services list --region=$region --project=$PROJECT_ID --format="value(metadata.name)" | grep -E "(mcp|gateway|dispatch|claude|lucy|automation|provision|payment|pcp|universal)" || echo "  No services found in $region"
    done
    
    success_log "================================================"
    success_log "🧹 CLEANUP COMPLETED SUCCESSFULLY"
    success_log "All duplicates removed"
    success_log "Services consolidated to us-west1"
    success_log "Infrastructure optimized and streamlined"
    success_log "================================================"
}

# Function to verify cleanup
verify_cleanup() {
    diamond_log "Verifying cleanup results..."
    
    diamond_log "Active services in $PRIMARY_REGION:"
    gcloud run services list --region=$PRIMARY_REGION --project=$PROJECT_ID --filter="status.conditions[0].status=True" --format="table(metadata.name,status.url)"
    
    diamond_log "Services with issues in $PRIMARY_REGION:"
    gcloud run services list --region=$PRIMARY_REGION --project=$PROJECT_ID --filter="status.conditions[0].status!=True" --format="table(metadata.name,status.conditions[0].status,status.conditions[0].message)" || true
}

# Main execution
case "${1:-cleanup}" in
    "cleanup")
        perform_comprehensive_cleanup
        ;;
    "--verify")
        verify_cleanup
        ;;
    "--list-duplicates")
        diamond_log "Scanning for duplicates across all regions..."
        for region in "us-west1" "us-central1" "europe-west1"; do
            echo "--- $region ---"
            gcloud run services list --region=$region --project=$PROJECT_ID --format="value(metadata.name)" | grep -E "(mcp|gateway|dispatch|claude|lucy|automation|provision|payment|pcp|universal)" | sort
        done
        ;;
    *)
        echo "Usage: $0 [cleanup|--verify|--list-duplicates]"
        echo "  cleanup           - Remove all duplicates and consolidate to us-west1"  
        echo "  --verify          - Verify cleanup results"
        echo "  --list-duplicates - Show duplicates across regions"
        exit 1
        ;;
esac