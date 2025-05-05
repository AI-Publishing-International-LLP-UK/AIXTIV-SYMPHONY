#!/bin/bash
# monitor-health.sh - Script to monitor system and service health
# Usage: ./monitor-health.sh [--json] [--ci]

set -e

OUTPUT_JSON=false
CI_MODE=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --json)
            OUTPUT_JSON=true
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
    esac
done

# Define services to check based on our environment
SERVICES_TO_CHECK=("node" "firebase" "firestore-emulator")

# Health check functions
check_disk_space() {
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        disk_status="CRITICAL"
    elif [ "$disk_usage" -gt 75 ]; then
        disk_status="WARNING"
    else
        disk_status="OK"
    fi
    echo "$disk_usage|$disk_status"
}

check_memory() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS memory check
        memory_usage=$(vm_stat | grep "Page active" | awk '{print $3}' | sed 's/\.//')
        total_memory=$(sysctl hw.memsize | awk '{print $2}')
        memory_percent=$((memory_usage * 4096 * 100 / total_memory))
    else
        # Linux memory check
        memory_usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
        memory_percent=${memory_usage%.*}
    fi
    
    if [ "$memory_percent" -gt 90 ]; then
        memory_status="CRITICAL"
    elif [ "$memory_percent" -gt 75 ]; then
        memory_status="WARNING"
    else
        memory_status="OK"
    fi
    echo "$memory_percent|$memory_status"
}

check_service() {
    local service=$1
    if pgrep -f "$service" > /dev/null; then
        echo "RUNNING"
    else
        echo "STOPPED"
    fi
}

# Run checks
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
DISK_CHECK=$(check_disk_space)
DISK_USAGE=${DISK_CHECK%|*}
DISK_STATUS=${DISK_CHECK#*|}

MEM_CHECK=$(check_memory)
MEM_USAGE=${MEM_CHECK%|*}
MEM_STATUS=${MEM_CHECK#*|}

# Service checks
declare -A SERVICE_STATUS
for service in "${SERVICES_TO_CHECK[@]}"; do
    SERVICE_STATUS[$service]=$(check_service "$service")
done

# Output results
if [ "$OUTPUT_JSON" = true ]; then
    # JSON output
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"system\": {"
    echo "    \"disk\": { \"usage\": $DISK_USAGE, \"status\": \"$DISK_STATUS\" },"
    echo "    \"memory\": { \"usage\": $MEM_USAGE, \"status\": \"$MEM_STATUS\" }"
    echo "  },"
    echo "  \"services\": {"
    for service in "${!SERVICE_STATUS[@]}"; do
        echo "    \"$service\": \"${SERVICE_STATUS[$service]}\","
    done
    echo "    \"_last\": \"dummy\""
    echo "  }"
    echo "}"
else
    # Human-readable output
    echo "======= System Health Check: $TIMESTAMP ======="
    echo ""
    echo "SYSTEM:"
    echo "  Disk Usage: ${DISK_USAGE}% - $DISK_STATUS"
    echo "  Memory Usage: ${MEM_USAGE}% - $MEM_STATUS"
    echo ""
    echo "SERVICES:"
    for service in "${!SERVICE_STATUS[@]}"; do
        echo "  $service: ${SERVICE_STATUS[$service]}"
    done
fi

# Exit with error if any critical issues
if [[ "$DISK_STATUS" == "CRITICAL" || "$MEM_STATUS" == "CRITICAL" ]]; then
    exit 1
fi

for status in "${SERVICE_STATUS[@]}"; do
    if [[ "$status" == "STOPPED" ]]; then
        exit 2
    fi
done

exit 0

