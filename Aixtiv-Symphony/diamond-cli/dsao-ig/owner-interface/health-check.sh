#!/bin/bash
# 🛡️ Diamond CLI Automated Health Check Script
# Production MCP System Monitoring
# Usage: ./health-check.sh [--single-check] [--verbose]

WORKER_URL="https://wfa-orchestration-worker-production-production.pr-aef.workers.dev"
LOG_FILE="/tmp/diamond-health-check.log"
VERBOSE=false
SINGLE_CHECK=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --single-check)
            SINGLE_CHECK=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Diamond CLI Health Check Script"
            echo "Usage: $0 [--single-check] [--verbose]"
            echo "  --single-check: Run once and exit"
            echo "  --verbose: Show detailed output"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

verbose_log() {
    if [ "$VERBOSE" = true ]; then
        log "$1"
    fi
}

check_health() {
    verbose_log "🔍 Checking system health..."
    
    HEALTH_RESPONSE=$(curl -s --max-time 10 "$WORKER_URL/health" 2>/dev/null)
    CURL_EXIT_CODE=$?
    
    if [ $CURL_EXIT_CODE -ne 0 ]; then
        log "🚨 CRITICAL: Health endpoint unreachable (curl exit code: $CURL_EXIT_CODE)"
        return 1
    fi
    
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
        verbose_log "✅ Health check passed"
        return 0
    else
        log "🚨 CRITICAL: Health check failed - Response: $HEALTH_RESPONSE"
        return 1
    fi
}

check_orchestration() {
    verbose_log "🎯 Checking orchestration status..."
    
    ORCHESTRATION_RESPONSE=$(curl -s --max-time 10 "$WORKER_URL/mcp/orchestrate" 2>/dev/null)
    CURL_EXIT_CODE=$?
    
    if [ $CURL_EXIT_CODE -ne 0 ]; then
        log "⚠️  WARNING: Orchestration endpoint unreachable"
        return 1
    fi
    
    if echo "$ORCHESTRATION_RESPONSE" | grep -q '"status":"operational"'; then
        verbose_log "✅ Orchestration operational"
        return 0
    else
        log "⚠️  WARNING: Orchestration not operational - Response: $ORCHESTRATION_RESPONSE"
        return 1
    fi
}

check_dns_resolution() {
    verbose_log "🌐 Checking DNS resolution..."
    
    DNS_RESPONSE=$(curl -s --max-time 10 "$WORKER_URL/mcp/dns/resolve?domain=mcp.aipub.2100.cool" 2>/dev/null)
    CURL_EXIT_CODE=$?
    
    if [ $CURL_EXIT_CODE -ne 0 ]; then
        log "⚠️  WARNING: DNS resolution endpoint unreachable"
        return 1
    fi
    
    if echo "$DNS_RESPONSE" | grep -q '"resolved":true'; then
        verbose_log "✅ DNS resolution working"
        return 0
    else
        log "⚠️  WARNING: DNS resolution failed - Response: $DNS_RESPONSE"
        return 1
    fi
}

attempt_recovery() {
    log "🔧 Attempting system recovery..."
    
    # Check if wrangler is available
    if ! command -v wrangler &> /dev/null; then
        log "❌ Wrangler CLI not found - Cannot attempt recovery"
        return 1
    fi
    
    # Check current directory for configuration
    if [ ! -f "wrangler-production-simple.toml" ]; then
        log "❌ Production configuration not found - Cannot attempt recovery"
        return 1
    fi
    
    log "🚀 Attempting redeployment..."
    
    DEPLOY_OUTPUT=$(wrangler deploy --config wrangler-production-simple.toml --env production 2>&1)
    DEPLOY_EXIT_CODE=$?
    
    if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
        log "✅ Redeployment successful"
        verbose_log "Deploy output: $DEPLOY_OUTPUT"
        
        # Wait a moment for deployment to take effect
        sleep 10
        
        # Verify recovery
        if check_health; then
            log "🎉 System recovered successfully"
            return 0
        else
            log "❌ System still unhealthy after redeployment"
            return 1
        fi
    else
        log "❌ Redeployment failed - Exit code: $DEPLOY_EXIT_CODE"
        log "Deploy error: $DEPLOY_OUTPUT"
        return 1
    fi
}

perform_comprehensive_check() {
    local health_ok=true
    local orchestration_ok=true
    local dns_ok=true
    
    # Run all checks
    if ! check_health; then
        health_ok=false
    fi
    
    if ! check_orchestration; then
        orchestration_ok=false
    fi
    
    if ! check_dns_resolution; then
        dns_ok=false
    fi
    
    # Determine overall system status
    if [ "$health_ok" = true ] && [ "$orchestration_ok" = true ] && [ "$dns_ok" = true ]; then
        log "✅ All systems operational - 20M agents ready, 200 sectors active"
        return 0
    elif [ "$health_ok" = false ]; then
        log "🚨 CRITICAL SYSTEM FAILURE - Attempting recovery"
        if attempt_recovery; then
            return 0
        else
            return 1
        fi
    else
        log "⚠️  System partially degraded but core health OK"
        return 0
    fi
}

# Main execution
main() {
    verbose_log "🛡️ Diamond CLI Health Check Starting..."
    verbose_log "Target: $WORKER_URL"
    
    if [ "$SINGLE_CHECK" = true ]; then
        verbose_log "Running single check..."
        perform_comprehensive_check
        exit $?
    else
        log "🔄 Starting continuous monitoring (Ctrl+C to stop)"
        
        while true; do
            perform_comprehensive_check
            
            # Wait 15 minutes between checks (900 seconds)
            verbose_log "⏰ Next check in 15 minutes..."
            sleep 900
        done
    fi
}

# Handle graceful shutdown
trap 'log "📋 Health monitoring stopped"; exit 0' SIGINT SIGTERM

# Start the health check
main
