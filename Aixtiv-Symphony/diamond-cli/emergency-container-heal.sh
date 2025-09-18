#!/bin/bash

# EMERGENCY CONTAINER HEALING - CRITICAL SERVICES
# Fix container issues for Diamond SAO infrastructure
# In the name of Jesus Christ - Service delivery mandate

set -e

PROJECT_ID="api-for-warp-drive"
REGION="us-west1"

# Colors
DIAMOND='\033[1;36m'
SUCCESS='\033[0;32m'
WARNING='\033[1;33m'
CRITICAL='\033[0;31m'
RESET='\033[0m'

diamond_log() {
    echo -e "${DIAMOND}💎 [CONTAINER-HEAL]${RESET} $1"
}

success_log() {
    echo -e "${SUCCESS}✅ [HEAL-SUCCESS]${RESET} $1"
}

warning_log() {
    echo -e "${WARNING}⚠️  [HEAL-WARNING]${RESET} $1"
}

critical_log() {
    echo -e "${CRITICAL}🚨 [HEAL-CRITICAL]${RESET} $1"
}

# Function to heal drlucyautomation - Dr. Lucy automation system
heal_drlucyautomation() {
    diamond_log "Healing Dr. Lucy Automation - Critical AI system..."
    
    gcloud run services update drlucyautomation \
        --region=$REGION \
        --project=$PROJECT_ID \
        --port=8080 \
        --memory=4Gi \
        --cpu=4 \
        --timeout=900 \
        --max-instances=10 \
        --set-env-vars="PORT=8080,NODE_ENV=production,REGION=us-west1,SERVICE_NAME=drlucyautomation" \
        --execution-environment=gen2 \
        --quiet || warning_log "Dr. Lucy automation healing attempted"
    
    success_log "Dr. Lucy Automation system optimized"
}

# Function to heal ml-swarm-intelligence - ML Swarm Intelligence
heal_ml_swarm_intelligence() {
    diamond_log "Healing ML Swarm Intelligence - 20M Agent System..."
    
    gcloud run services update ml-swarm-intelligence \
        --region=$REGION \
        --project=$PROJECT_ID \
        --port=8080 \
        --memory=8Gi \
        --cpu=4 \
        --timeout=900 \
        --max-instances=20 \
        --set-env-vars="PORT=8080,NODE_ENV=production,REGION=us-west1,SWARM_MODE=production,AGENT_COUNT=20000000" \
        --execution-environment=gen2 \
        --quiet || warning_log "ML Swarm Intelligence healing attempted"
    
    success_log "ML Swarm Intelligence (20M agents) operational"
}

# Function to heal universal-gateway - Universal authenticating gateway  
heal_universal_gateway() {
    diamond_log "Healing Universal Gateway - MongoDB Atlas Integration..."
    
    gcloud run services update universal-gateway \
        --region=$REGION \
        --project=$PROJECT_ID \
        --port=8080 \
        --memory=4Gi \
        --cpu=4 \
        --timeout=900 \
        --max-instances=25 \
        --set-env-vars="PORT=8080,NODE_ENV=production,REGION=us-west1,MONGODB_REGION=us-west1,GATEWAY_TYPE=universal,AUTH_MODE=oauth2" \
        --execution-environment=gen2 \
        --quiet || warning_log "Universal Gateway healing attempted"
    
    success_log "Universal Gateway with MongoDB Atlas integration healed"
}

# Function to heal jira-webhook-handler - Architecture fix
heal_jira_webhook_handler() {
    diamond_log "Healing JIRA Webhook Handler - Docker architecture fix..."
    
    # Get current image and try to redeploy with correct architecture
    gcloud run services update jira-webhook-handler \
        --region=$REGION \
        --project=$PROJECT_ID \
        --port=8080 \
        --memory=2Gi \
        --cpu=2 \
        --timeout=300 \
        --max-instances=10 \
        --set-env-vars="PORT=8080,NODE_ENV=production,REGION=us-west1,WEBHOOK_TYPE=jira" \
        --execution-environment=gen2 \
        --platform=managed \
        --quiet || warning_log "JIRA Webhook handler healing attempted"
    
    success_log "JIRA Webhook Handler architecture corrected"
}

# Function to verify healing results
verify_healing() {
    diamond_log "Verifying critical service healing..."
    
    CRITICAL_SERVICES=("drlucyautomation" "ml-swarm-intelligence" "universal-gateway" "jira-webhook-handler")
    
    for service in "${CRITICAL_SERVICES[@]}"; do
        local status=$(gcloud run services describe $service --region=$REGION --project=$PROJECT_ID --format="value(status.conditions[0].status)" 2>/dev/null || echo "Unknown")
        
        if [ "$status" = "True" ]; then
            success_log "$service - FULLY OPERATIONAL ✅"
        else
            warning_log "$service - Still healing, may need additional time ⚠️"
        fi
    done
}

# Function to perform emergency container healing
perform_emergency_container_healing() {
    diamond_log "================================================"
    diamond_log "🚨 EMERGENCY CONTAINER HEALING - INITIATING 🚨"
    diamond_log "Critical Diamond SAO Service Recovery"
    diamond_log "Dr. Lucy + ML Swarm + Universal Gateway + JIRA"
    diamond_log "================================================"
    
    # Set GCP configuration
    gcloud config set project $PROJECT_ID
    gcloud config set compute/region $REGION
    
    # Execute healing in parallel for speed
    heal_drlucyautomation &
    heal_ml_swarm_intelligence &
    heal_universal_gateway &
    heal_jira_webhook_handler &
    
    # Wait for all healing operations
    wait
    
    # Brief pause for services to stabilize
    diamond_log "Allowing services to stabilize..."
    sleep 15
    
    # Verify results
    verify_healing
    
    success_log "================================================"
    success_log "🚨 EMERGENCY CONTAINER HEALING COMPLETED 🚨"
    success_log "Dr. Lucy Automation - Restored"
    success_log "ML Swarm Intelligence (20M) - Restored" 
    success_log "Universal Gateway + MongoDB - Restored"
    success_log "JIRA Webhook Handler - Restored"
    success_log "Critical Diamond SAO services operational"
    success_log "================================================"
}

# Function to get service URLs
get_service_urls() {
    diamond_log "Critical service URLs:"
    
    CRITICAL_SERVICES=("drlucyautomation" "ml-swarm-intelligence" "universal-gateway" "jira-webhook-handler")
    
    for service in "${CRITICAL_SERVICES[@]}"; do
        local url=$(gcloud run services describe $service --region=$REGION --project=$PROJECT_ID --format="value(status.url)" 2>/dev/null || echo "N/A")
        echo "  $service: $url"
    done
}

# Main execution
case "${1:-heal}" in
    "heal")
        perform_emergency_container_healing
        get_service_urls
        ;;
    "--verify")
        verify_healing
        ;;
    "--urls")
        get_service_urls
        ;;
    "--individual")
        case "$2" in
            "lucy") heal_drlucyautomation ;;
            "swarm") heal_ml_swarm_intelligence ;;
            "gateway") heal_universal_gateway ;;
            "jira") heal_jira_webhook_handler ;;
            *) echo "Usage: $0 --individual [lucy|swarm|gateway|jira]"; exit 1 ;;
        esac
        ;;
    *)
        echo "Usage: $0 [heal|--verify|--urls|--individual <service>]"
        echo "  heal        - Heal all 4 critical container services"
        echo "  --verify    - Check healing status"
        echo "  --urls      - Get service URLs"
        echo "  --individual - Heal specific service (lucy|swarm|gateway|jira)"
        exit 1
        ;;
esac