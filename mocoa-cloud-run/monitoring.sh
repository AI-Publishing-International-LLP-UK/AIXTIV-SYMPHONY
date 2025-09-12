#!/bin/bash
# MOCOA Self-Healing Monitoring Script
# Continuously monitors service health and triggers recovery actions

set -e

# Configuration
PROJECT_ID="api-for-warp-drive"
SERVICE_NAME="mocoa"
REGION="us-west1"
CHECK_INTERVAL=30
MAX_FAILURES=3
FAILURE_COUNT=0
LAST_SUCCESS=$(date +%s)

# Logging with structured format
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date -Iseconds)
    echo "{\"timestamp\":\"$timestamp\",\"level\":\"$level\",\"service\":\"$SERVICE_NAME\",\"message\":\"$message\"}" | tee -a monitoring.log
}

# Get service URL
get_service_url() {
    gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)" 2>/dev/null || echo ""
}

# Comprehensive health check
perform_health_check() {
    local service_url=$1
    local endpoints=("/health" "/ready" "/api/dr-claude/health")
    local failed_endpoints=()
    
    log "info" "Starting comprehensive health check for $service_url"
    
    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$service_url$endpoint" 2>/dev/null || echo "000")
        
        if [ "$response" != "200" ]; then
            failed_endpoints+=("$endpoint:$response")
            log "warn" "Health check failed for $endpoint - HTTP $response"
        else
            log "debug" "Health check passed for $endpoint - HTTP $response"
        fi
    done
    
    if [ ${#failed_endpoints[@]} -eq 0 ]; then
        log "info" "All health checks passed"
        return 0
    else
        log "error" "Health checks failed for endpoints: ${failed_endpoints[*]}"
        return 1
    fi
}

# Check memory and CPU usage
check_resource_usage() {
    local service_url=$1
    
    # Get health endpoint with resource information
    local health_data=$(curl -s --max-time 10 "$service_url/health" 2>/dev/null || echo "{}")
    
    # Extract uptime and basic metrics
    local uptime=$(echo "$health_data" | jq -r '.uptime // "unknown"' 2>/dev/null)
    local quantum_state=$(echo "$health_data" | jq -r '.quantum_orchestration.quantum_state // "unknown"' 2>/dev/null)
    
    if [ "$uptime" != "unknown" ] && [ "$uptime" != "null" ]; then
        log "info" "Service uptime: ${uptime}s, Quantum state: $quantum_state"
        
        # Check if uptime is very low (indicating recent restart)
        if [ "$(echo "$uptime < 120" | bc -l 2>/dev/null || echo 0)" = "1" ]; then
            log "warn" "Service uptime is low ($uptime seconds) - possible recent restart"
        fi
    else
        log "warn" "Could not retrieve service health metrics"
    fi
}

# Self-healing action
trigger_self_heal() {
    log "error" "Triggering self-healing action"
    
    # Get current revision
    local current_revision=$(gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(status.latestReadyRevisionName)" 2>/dev/null || echo "unknown")
    
    log "info" "Current revision: $current_revision"
    
    # Force a new deployment with updated timestamp
    log "info" "Deploying new revision with updated configuration..."
    
    if gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --update-env-vars="LAST_HEAL=$(date +%s)" \
        --quiet 2>/dev/null; then
        log "info" "Self-healing deployment triggered successfully"
        
        # Wait for new revision to be ready
        log "info" "Waiting for new revision to be ready..."
        sleep 30
        
        return 0
    else
        log "error" "Self-healing deployment failed"
        return 1
    fi
}

# Send alert (placeholder - can be extended to use real alerting)
send_alert() {
    local severity=$1
    local message=$2
    
    log "$severity" "ALERT: $message"
    
    # In production, this could send to:
    # - Google Cloud Monitoring
    # - Slack webhook
    # - Email notification
    # - PagerDuty
    echo "ALERT [$severity]: $message" >> alerts.log
}

# Main monitoring loop
main_monitor() {
    log "info" "Starting MOCOA self-healing monitor"
    log "info" "Configuration: PROJECT=$PROJECT_ID, SERVICE=$SERVICE_NAME, REGION=$REGION"
    
    while true; do
        local service_url=$(get_service_url)
        
        if [ -z "$service_url" ]; then
            log "error" "Could not get service URL - service may not be deployed"
            send_alert "critical" "Service URL not found"
            sleep $CHECK_INTERVAL
            continue
        fi
        
        log "debug" "Checking service at $service_url"
        
        # Perform health checks
        if perform_health_check "$service_url"; then
            # Health check passed
            FAILURE_COUNT=0
            LAST_SUCCESS=$(date +%s)
            
            # Check resource usage
            check_resource_usage "$service_url"
            
            log "info" "Service health: OK"
        else
            # Health check failed
            ((FAILURE_COUNT++))
            log "warn" "Health check failure count: $FAILURE_COUNT/$MAX_FAILURES"
            
            if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
                log "error" "Maximum failures reached - triggering self-heal"
                send_alert "critical" "Service health check failed $FAILURE_COUNT times - triggering self-heal"
                
                if trigger_self_heal; then
                    FAILURE_COUNT=0
                    send_alert "warning" "Self-healing completed successfully"
                    log "info" "Self-healing completed - resetting failure count"
                else
                    send_alert "critical" "Self-healing failed - manual intervention required"
                    log "error" "Self-healing failed - continuing monitoring"
                fi
            else
                send_alert "warning" "Service health check failed ($FAILURE_COUNT/$MAX_FAILURES)"
            fi
        fi
        
        # Check if service has been unhealthy for too long
        local current_time=$(date +%s)
        local time_since_success=$((current_time - LAST_SUCCESS))
        
        if [ $time_since_success -gt 300 ]; then  # 5 minutes
            log "warn" "Service has been unhealthy for $time_since_success seconds"
            if [ $time_since_success -gt 600 ]; then  # 10 minutes
                send_alert "critical" "Service has been unhealthy for over 10 minutes"
            fi
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Handle script termination
cleanup() {
    log "info" "Monitoring script terminated"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Check if running in daemon mode
if [ "$1" = "--daemon" ]; then
    log "info" "Starting in daemon mode"
    main_monitor &
    echo $! > monitoring.pid
    log "info" "Monitor started with PID $(cat monitoring.pid)"
elif [ "$1" = "--stop" ]; then
    if [ -f monitoring.pid ]; then
        local pid=$(cat monitoring.pid)
        kill $pid 2>/dev/null || true
        rm -f monitoring.pid
        log "info" "Monitor stopped (PID: $pid)"
    else
        log "warn" "No monitoring PID file found"
    fi
elif [ "$1" = "--status" ]; then
    if [ -f monitoring.pid ]; then
        local pid=$(cat monitoring.pid)
        if kill -0 $pid 2>/dev/null; then
            log "info" "Monitor is running (PID: $pid)"
            exit 0
        else
            log "warn" "Monitor PID file exists but process not running"
            rm -f monitoring.pid
            exit 1
        fi
    else
        log "info" "Monitor is not running"
        exit 1
    fi
elif [ "$1" = "--test" ]; then
    log "info" "Running single health check test"
    service_url=$(get_service_url)
    if [ -n "$service_url" ]; then
        perform_health_check "$service_url"
        check_resource_usage "$service_url"
    else
        log "error" "Could not get service URL"
        exit 1
    fi
else
    log "info" "Usage: $0 [--daemon|--stop|--status|--test]"
    log "info" "  --daemon  : Start monitoring in background"
    log "info" "  --stop    : Stop background monitoring"
    log "info" "  --status  : Check monitoring status"
    log "info" "  --test    : Run single health check"
    log "info" "  (no args): Run monitoring in foreground"
    echo
    
    if [ $# -eq 0 ]; then
        main_monitor
    fi
fi
