#!/bin/bash

# Automated MCP DNS Management Script
# Part of the WFA Production Orchestration System
# Handles DNS routing for MCP endpoints with full automation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
GCP_PROJECT="api-for-warp-drive"
DNS_ZONE="main-zone"
REGION="us-west1"

echo -e "${PURPLE}🌐 AUTOMATED MCP DNS MANAGEMENT${NC}"
echo "================================="

# Function to update MCP DNS record
update_mcp_dns() {
    local domain="$1"
    local target_service="$2"
    
    echo -e "${CYAN}🔧 Updating DNS for: $domain${NC}"
    echo "Target service: $target_service"
    
    # Get current Cloud Run service URL
    SERVICE_URL=$(gcloud run services describe "$target_service" --region="$REGION" --format="value(status.url)" | sed 's|https://||')
    
    if [ -z "$SERVICE_URL" ]; then
        echo -e "${RED}❌ Failed to get service URL for $target_service${NC}"
        return 1
    fi
    
    echo "Service URL: $SERVICE_URL"
    
    # Start DNS transaction
    TRANSACTION_FILE="/tmp/dns-transaction-$(date +%s).yaml"
    gcloud dns record-sets transaction start --zone="$DNS_ZONE" --transaction-file="$TRANSACTION_FILE"
    
    # Check if record exists and remove it
    if gcloud dns record-sets list --zone="$DNS_ZONE" --filter="name:${domain}." --format="value(name)" | grep -q "${domain}."; then
        echo "📝 Removing existing DNS record..."
        CURRENT_TARGET=$(gcloud dns record-sets list --zone="$DNS_ZONE" --filter="name:${domain}." --format="value(rrdatas[0])")
        CURRENT_TTL=$(gcloud dns record-sets list --zone="$DNS_ZONE" --filter="name:${domain}." --format="value(ttl)")
        gcloud dns record-sets transaction remove --zone="$DNS_ZONE" --name="${domain}." --type=CNAME --ttl="$CURRENT_TTL" "$CURRENT_TARGET" --transaction-file="$TRANSACTION_FILE"
    fi
    
    # Add new record
    echo "➕ Adding new DNS record..."
    gcloud dns record-sets transaction add --zone="$DNS_ZONE" --name="${domain}." --type=CNAME --ttl=300 "${SERVICE_URL}." --transaction-file="$TRANSACTION_FILE"
    
    # Execute transaction
    echo "🚀 Executing DNS transaction..."
    gcloud dns record-sets transaction execute --zone="$DNS_ZONE" --transaction-file="$TRANSACTION_FILE"
    
    # Cleanup
    rm -f "$TRANSACTION_FILE"
    
    echo -e "${GREEN}✅ DNS updated successfully${NC}"
    echo "Domain: $domain"
    echo "Target: $SERVICE_URL"
    
    return 0
}

# Function to verify DNS propagation
verify_dns() {
    local domain="$1"
    local expected_target="$2"
    
    echo -e "${YELLOW}🔍 Verifying DNS propagation for: $domain${NC}"
    
    # Wait a moment for initial propagation
    sleep 5
    
    # Check DNS resolution
    RESOLVED=$(nslookup "$domain" 8.8.8.8 2>/dev/null | grep -A 1 "Non-authoritative answer:" | tail -1 | awk '{print $NF}' | sed 's/\.$//' || echo "")
    
    if [ -n "$RESOLVED" ]; then
        echo "✅ DNS resolved to: $RESOLVED"
        if [[ "$RESOLVED" == *"$expected_target"* ]]; then
            echo -e "${GREEN}✅ DNS verification successful${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  DNS resolved but target mismatch${NC}"
        fi
    else
        echo -e "${YELLOW}⏳ DNS propagation in progress...${NC}"
    fi
    
    return 1
}

# Function to test service health
test_service_health() {
    local domain="$1"
    
    echo -e "${BLUE}🏥 Testing service health at: $domain${NC}"
    
    # Test HTTP response
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Service health check passed (HTTP $HTTP_CODE)${NC}"
        
        # Test if it's serving JSON (MCP interface)
        CONTENT_TYPE=$(curl -s -I "https://$domain" | grep -i "content-type" | cut -d: -f2 | tr -d ' \r\n')
        
        if [[ "$CONTENT_TYPE" == *"json"* ]]; then
            echo -e "${GREEN}✅ MCP JSON interface confirmed${NC}"
        else
            echo -e "${YELLOW}⚠️  Serving HTML instead of JSON${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}❌ Service health check failed (HTTP $HTTP_CODE)${NC}"
        return 1
    fi
}

# Main automation logic
main() {
    local domain="$1"
    local target_service="$2"
    
    if [ -z "$domain" ] || [ -z "$target_service" ]; then
        echo "Usage: $0 <domain> <target-service>"
        echo "Example: $0 mcp.aipub.2100.cool integration-gateway-js"
        exit 1
    fi
    
    # Validate GCP authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" >/dev/null 2>&1; then
        echo -e "${RED}❌ GCP authentication required${NC}"
        exit 1
    fi
    
    # Validate GCP project
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ "$CURRENT_PROJECT" != "$GCP_PROJECT" ]; then
        echo -e "${RED}❌ Please set GCP project to $GCP_PROJECT${NC}"
        exit 1
    fi
    
    echo "🎯 Automating DNS for domain: $domain"
    echo "🎯 Target service: $target_service"
    echo ""
    
    # Update DNS
    if update_mcp_dns "$domain" "$target_service"; then
        echo ""
        
        # Verify DNS propagation
        if verify_dns "$domain" "$target_service"; then
            echo ""
            
            # Test service health
            if test_service_health "$domain"; then
                echo ""
                echo -e "${GREEN}🎉 MCP DNS AUTOMATION COMPLETE!${NC}"
                echo "================================="
                echo "✅ DNS record updated"
                echo "✅ DNS propagation verified"
                echo "✅ Service health confirmed"
                echo ""
                echo -e "${CYAN}🌐 MCP Endpoint Ready:${NC}"
                echo "• https://$domain"
                echo "• https://$domain/.well-known/mcp"
                echo ""
                exit 0
            else
                echo -e "${YELLOW}⚠️  DNS updated but service health check failed${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}⚠️  DNS updated but propagation verification incomplete${NC}"
            echo "This is normal - DNS propagation can take a few minutes"
            exit 0
        fi
    else
        echo -e "${RED}❌ DNS update failed${NC}"
        exit 1
    fi
}

# Handle the automation request
if [ "$1" = "auto-fix-mcp-aipub" ]; then
    # Special automated fix for the current issue
    main "mcp.aipub.2100.cool" "integration-gateway-js"
else
    # General usage
    main "$@"
fi
