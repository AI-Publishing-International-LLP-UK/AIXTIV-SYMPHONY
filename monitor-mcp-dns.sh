#!/bin/bash

# MCP DNS Health Monitoring Script
# Ensures MCP endpoints are always properly routed
# Part of the automated production orchestration system

set -e

# Configuration
DOMAINS=("mcp.aipub.2100.cool")
EXPECTED_SERVICE="integration-gateway-js"
SLACK_WEBHOOK_SECRET="wfa-slack-webhook"
MONITOR_INTERVAL=300  # 5 minutes

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 MCP DNS HEALTH MONITOR STARTED${NC}"
echo "=================================="

# Function to check DNS health
check_dns_health() {
    local domain="$1"
    local expected_service="$2"
    
    echo -e "${BLUE}Checking: $domain${NC}"
    
    # Check DNS resolution
    RESOLVED=$(nslookup "$domain" 8.8.8.8 2>/dev/null | grep -A 1 "Non-authoritative answer:" | tail -1 | awk '{print $NF}' | sed 's/\.$//' || echo "FAILED")
    
    if [[ "$RESOLVED" == *"$expected_service"* ]]; then
        echo -e "${GREEN}✅ DNS: $domain → $RESOLVED${NC}"
        
        # Check service health
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" --connect-timeout 10 || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            # Check if it's serving JSON (MCP interface)
            CONTENT_TYPE=$(curl -s -I "https://$domain" --connect-timeout 10 | grep -i "content-type" | cut -d: -f2 | tr -d ' \r\n' || echo "")
            
            if [[ "$CONTENT_TYPE" == *"json"* ]]; then
                echo -e "${GREEN}✅ Service: HTTP $HTTP_CODE, Content: JSON${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠️  Service: HTTP $HTTP_CODE, Content: HTML (incorrect interface)${NC}"
                return 2  # Wrong content type
            fi
        else
            echo -e "${RED}❌ Service: HTTP $HTTP_CODE (service down)${NC}"
            return 3  # Service down
        fi
    else
        echo -e "${RED}❌ DNS: $domain → $RESOLVED (incorrect routing)${NC}"
        return 1  # DNS misconfiguration
    fi
}

# Function to auto-repair DNS issues
auto_repair_dns() {
    local domain="$1"
    local expected_service="$2"
    
    echo -e "${YELLOW}🔧 Auto-repairing DNS for: $domain${NC}"
    
    # Check if automation script exists
    if [ -f "/Users/as/asoos/asoos-2100-cool-landing/automate-mcp-dns.sh" ]; then
        if /Users/as/asoos/asoos-2100-cool-landing/automate-mcp-dns.sh "$domain" "$expected_service"; then
            echo -e "${GREEN}✅ Auto-repair completed successfully${NC}"
            return 0
        else
            echo -e "${RED}❌ Auto-repair failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Auto-repair script not found${NC}"
        return 1
    fi
}

# Function to send alert (Slack webhook)
send_alert() {
    local message="$1"
    local severity="$2"  # info, warning, critical
    
    # Try to get Slack webhook from GCP Secret Manager
    SLACK_WEBHOOK=$(gcloud secrets versions access latest --secret="$SLACK_WEBHOOK_SECRET" 2>/dev/null || echo "")
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color="#36a64f"  # green
        case $severity in
            warning) color="#ff9500" ;;  # orange
            critical) color="#ff0000" ;; # red
        esac
        
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"MCP DNS Monitor Alert\",
                    \"text\": \"$message\",
                    \"footer\": \"ASOOS Production System\",
                    \"ts\": $(date +%s)
                }]
            }" >/dev/null || true
    fi
    
    echo "Alert sent: $message"
}

# Function to run health checks
run_health_checks() {
    local issues_found=0
    
    for domain in "${DOMAINS[@]}"; do
        if ! check_dns_health "$domain" "$EXPECTED_SERVICE"; then
            local exit_code=$?
            issues_found=1
            
            case $exit_code in
                1)
                    echo -e "${YELLOW}🔧 Attempting auto-repair for DNS misconfiguration...${NC}"
                    if auto_repair_dns "$domain" "$EXPECTED_SERVICE"; then
                        send_alert "✅ Auto-repaired DNS for $domain" "info"
                    else
                        send_alert "❌ Failed to auto-repair DNS for $domain - manual intervention needed" "critical"
                    fi
                    ;;
                2)
                    echo -e "${YELLOW}⚠️  Wrong content type detected, checking if service needs restart...${NC}"
                    send_alert "⚠️  $domain serving HTML instead of JSON - possible service configuration issue" "warning"
                    ;;
                3)
                    echo -e "${RED}🚨 Service is down, checking Cloud Run status...${NC}"
                    if gcloud run services describe "$EXPECTED_SERVICE" --region=us-west1 --format="value(status.conditions[0].status)" 2>/dev/null | grep -q "True"; then
                        send_alert "🚨 $domain DNS points to healthy service but HTTP requests failing - possible network issue" "critical"
                    else
                        send_alert "🚨 $domain service is down in Cloud Run - requires immediate attention" "critical"
                    fi
                    ;;
            esac
        fi
        echo ""
    done
    
    if [ $issues_found -eq 0 ]; then
        echo -e "${GREEN}🎉 All MCP DNS endpoints are healthy!${NC}"
    fi
    
    return $issues_found
}

# Function to run in daemon mode
run_daemon() {
    echo "Starting MCP DNS health monitoring daemon..."
    echo "Monitoring interval: ${MONITOR_INTERVAL}s"
    echo "Domains: ${DOMAINS[*]}"
    echo ""
    
    while true; do
        echo "$(date): Running health checks..."
        run_health_checks
        echo "$(date): Next check in ${MONITOR_INTERVAL}s"
        echo "----------------------------------------"
        sleep $MONITOR_INTERVAL
    done
}

# Function to run once and exit
run_once() {
    echo "Running one-time health check..."
    run_health_checks
    exit $?
}

# Main function
main() {
    case "${1:-once}" in
        "daemon")
            run_daemon
            ;;
        "once")
            run_once
            ;;
        "check")
            # Check specific domain
            if [ -n "$2" ]; then
                check_dns_health "$2" "$EXPECTED_SERVICE"
            else
                run_once
            fi
            ;;
        "repair")
            # Repair specific domain
            if [ -n "$2" ]; then
                auto_repair_dns "$2" "$EXPECTED_SERVICE"
            else
                echo "Usage: $0 repair <domain>"
                exit 1
            fi
            ;;
        *)
            echo "Usage: $0 [once|daemon|check <domain>|repair <domain>]"
            echo ""
            echo "Commands:"
            echo "  once     - Run health check once and exit (default)"
            echo "  daemon   - Run continuous monitoring"
            echo "  check    - Check specific domain or all domains"
            echo "  repair   - Repair specific domain DNS"
            exit 1
            ;;
    esac
}

# Run main function with arguments
main "$@"
