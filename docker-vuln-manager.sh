#!/bin/bash

# Docker Vulnerability Management Script
# This script audits, reports, and remediates Docker image vulnerabilities

set -euo pipefail

# Configuration
SCOUT_ENABLED=${SCOUT_ENABLED:-true}
CRITICAL_THRESHOLD=${CRITICAL_THRESHOLD:-1}
HIGH_THRESHOLD=${HIGH_THRESHOLD:-5}
BACKUP_IMAGES=${BACKUP_IMAGES:-true}
DRY_RUN=${DRY_RUN:-false}
LOG_FILE="docker-vuln-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${2:-}$(date '+%Y-%m-%d %H:%M:%S') - $1${NC}" | tee -a "$LOG_FILE"
}

# Check if Docker Scout is available
check_scout() {
    if command -v docker &> /dev/null && docker scout version &> /dev/null; then
        log "Docker Scout detected and available" "$GREEN"
        return 0
    else
        log "Docker Scout not available - installing..." "$YELLOW"
        # Install Docker Scout plugin
        curl -sSfL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | sh -s --
        return $?
    fi
}

# Get all Docker images
get_all_images() {
    docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>" | sort -u
}

# Scan single image for vulnerabilities
scan_image() {
    local image="$1"
    local output_file="scan-$(echo "$image" | sed 's/[^a-zA-Z0-9]/_/g').json"
    
    log "Scanning image: $image" "$BLUE"
    
    if [[ "$SCOUT_ENABLED" == "true" ]]; then
        # Use Docker Scout if available
        if docker scout cves "$image" --format json > "$output_file" 2>/dev/null; then
            # Parse Scout results
            local critical=$(jq -r '.vulnerabilities[] | select(.severity == "critical") | .id' "$output_file" 2>/dev/null | wc -l || echo "0")
            local high=$(jq -r '.vulnerabilities[] | select(.severity == "high") | .id' "$output_file" 2>/dev/null | wc -l || echo "0")
            local medium=$(jq -r '.vulnerabilities[] | select(.severity == "medium") | .id' "$output_file" 2>/dev/null | wc -l || echo "0")
            local low=$(jq -r '.vulnerabilities[] | select(.severity == "low") | .id' "$output_file" 2>/dev/null | wc -l || echo "0")
            
            echo "$image,$critical,$high,$medium,$low"
        else
            log "Failed to scan $image with Docker Scout" "$RED"
            echo "$image,ERROR,ERROR,ERROR,ERROR"
        fi
    else
        # Fallback to basic image inspection
        echo "$image,UNKNOWN,UNKNOWN,UNKNOWN,UNKNOWN"
    fi
}

# Generate vulnerability report
generate_report() {
    local report_file="vulnerability-report-$(date +%Y%m%d-%H%M%S).csv"
    local images
    
    log "Generating vulnerability report..." "$BLUE"
    
    echo "Image,Critical,High,Medium,Low" > "$report_file"
    
    images=$(get_all_images)
    local total_images=$(echo "$images" | wc -l)
    local current=0
    
    while IFS= read -r image; do
        ((current++))
        log "Progress: $current/$total_images - $image" "$BLUE"
        scan_image "$image" >> "$report_file"
    done <<< "$images"
    
    log "Vulnerability report saved to: $report_file" "$GREEN"
    echo "$report_file"
}

# Find images that need immediate attention
find_critical_images() {
    local report_file="$1"
    local critical_images=()
    
    log "Identifying critical images..." "$YELLOW"
    
    while IFS=',' read -r image critical high medium low; do
        if [[ "$image" != "Image" ]] && [[ "$critical" =~ ^[0-9]+$ ]] && [[ "$high" =~ ^[0-9]+$ ]]; then
            if [[ $critical -ge $CRITICAL_THRESHOLD ]] || [[ $high -ge $HIGH_THRESHOLD ]]; then
                critical_images+=("$image")
                log "CRITICAL: $image - Critical: $critical, High: $high" "$RED"
            fi
        fi
    done < "$report_file"
    
    printf '%s\n' "${critical_images[@]}"
}

# Backup image before remediation
backup_image() {
    local image="$1"
    local backup_tag="${image}-backup-$(date +%Y%m%d-%H%M%S)"
    
    if [[ "$BACKUP_IMAGES" == "true" ]] && [[ "$DRY_RUN" == "false" ]]; then
        log "Backing up $image as $backup_tag" "$YELLOW"
        docker tag "$image" "$backup_tag"
    fi
}

# Auto-remediate known issues
auto_remediate() {
    local image="$1"
    local remediation_applied=false
    
    log "Attempting auto-remediation for: $image" "$BLUE"
    
    # Check if image uses outdated Ubuntu base
    if docker run --rm "$image" cat /etc/os-release 2>/dev/null | grep -q "Ubuntu"; then
        local ubuntu_version=$(docker run --rm "$image" cat /etc/os-release 2>/dev/null | grep "VERSION_ID" | cut -d'"' -f2)
        
        if [[ "$ubuntu_version" == "22.04" ]] || [[ "$ubuntu_version" == "20.04" ]] || [[ "$ubuntu_version" == "18.04" ]]; then
            log "Found outdated Ubuntu $ubuntu_version in $image" "$YELLOW"
            
            # Generate updated Dockerfile suggestion
            cat > "Dockerfile.${image//[^a-zA-Z0-9]/_}.updated" << EOF
# Auto-generated updated Dockerfile for $image
# Original base: Ubuntu $ubuntu_version
# Updated base: Ubuntu 24.04 (recommended)

FROM ubuntu:24.04

# Copy your application files here
# COPY . /app
# WORKDIR /app

# Install your dependencies
# RUN apt-get update && apt-get install -y \\
#     your-packages \\
#     && rm -rf /var/lib/apt/lists/*

# Add your application commands
# CMD ["your-command"]
EOF
            
            log "Generated updated Dockerfile: Dockerfile.${image//[^a-zA-Z0-9]/_}.updated" "$GREEN"
            remediation_applied=true
        fi
    fi
    
    return $([ "$remediation_applied" = true ] && echo 0 || echo 1)
}

# Update base images where possible
update_base_images() {
    local critical_images="$1"
    
    log "Updating base images for critical vulnerabilities..." "$BLUE"
    
    while IFS= read -r image; do
        if [[ -n "$image" ]]; then
            backup_image "$image"
            
            if auto_remediate "$image"; then
                log "Remediation suggestions generated for: $image" "$GREEN"
            else
                log "No automatic remediation available for: $image" "$YELLOW"
            fi
        fi
    done <<< "$critical_images"
}

# Clean up old/unused images
cleanup_images() {
    log "Cleaning up unused images..." "$BLUE"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Remove dangling images
        docker image prune -f
        
        # Remove images older than 30 days that aren't being used
        docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        awk '$2 ~ /weeks?|months?/ {print $1}' | \
        while read -r old_image; do
            if [[ -n "$old_image" ]] && ! docker ps -a --format "{{.Image}}" | grep -q "$old_image"; then
                log "Removing old unused image: $old_image" "$YELLOW"
                docker rmi "$old_image" 2>/dev/null || true
            fi
        done
    else
        log "DRY RUN: Would clean up unused and old images" "$YELLOW"
    fi
}

# Setup continuous monitoring
setup_monitoring() {
    local cron_script="/usr/local/bin/docker-vuln-monitor.sh"
    
    log "Setting up continuous vulnerability monitoring..." "$BLUE"
    
    # Create monitoring script
    cat > "$cron_script" << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

# Run vulnerability scan
./docker-vuln-manager.sh --scan-only --quiet

# Check for critical issues and alert
CRITICAL_COUNT=$(tail -n +2 vulnerability-report-*.csv | awk -F',' '$2 > 0 || $3 >= 5' | wc -l)

if [[ $CRITICAL_COUNT -gt 0 ]]; then
    echo "ALERT: $CRITICAL_COUNT Docker images have critical vulnerabilities"
    # Add your alerting mechanism here (email, Slack, etc.)
fi
EOF
    
    chmod +x "$cron_script"
    
    # Add to crontab (run daily at 2 AM)
    if ! crontab -l 2>/dev/null | grep -q "docker-vuln-monitor"; then
        (crontab -l 2>/dev/null; echo "0 2 * * * $cron_script") | crontab -
        log "Added daily vulnerability monitoring to crontab" "$GREEN"
    fi
}

# Main execution function
main() {
    local scan_only=false
    local quiet=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --scan-only)
                scan_only=true
                shift
                ;;
            --quiet)
                quiet=true
                shift
                ;;
            --no-scout)
                SCOUT_ENABLED=false
                shift
                ;;
            --help)
                cat << EOF
Docker Vulnerability Manager

Usage: $0 [options]

Options:
    --dry-run       Show what would be done without making changes
    --scan-only     Only perform vulnerability scanning
    --quiet         Minimal output
    --no-scout      Skip Docker Scout (use basic scanning)
    --help          Show this help message

Environment Variables:
    CRITICAL_THRESHOLD=1    Number of critical vulns to trigger action
    HIGH_THRESHOLD=5        Number of high vulns to trigger action
    BACKUP_IMAGES=true      Backup images before remediation
    DRY_RUN=false          Enable dry run mode
EOF
                exit 0
                ;;
            *)
                log "Unknown option: $1" "$RED"
                exit 1
                ;;
        esac
    done
    
    [[ "$quiet" == "true" ]] || log "Starting Docker Vulnerability Management" "$GREEN"
    
    # Check prerequisites
    if ! command -v docker &> /dev/null; then
        log "Docker is not installed or not in PATH" "$RED"
        exit 1
    fi
    
    if [[ "$SCOUT_ENABLED" == "true" ]]; then
        check_scout || log "Continuing without Docker Scout" "$YELLOW"
    fi
    
    # Generate vulnerability report
    local report_file
    report_file=$(generate_report)
    
    if [[ "$scan_only" == "true" ]]; then
        log "Scan complete. Report saved to: $report_file" "$GREEN"
        exit 0
    fi
    
    # Find and remediate critical issues
    local critical_images
    critical_images=$(find_critical_images "$report_file")
    
    if [[ -n "$critical_images" ]]; then
        log "Found $(echo "$critical_images" | wc -l) images with critical vulnerabilities" "$RED"
        update_base_images "$critical_images"
    else
        log "No critical vulnerabilities found" "$GREEN"
    fi
    
    # Clean up old images
    cleanup_images
    
    # Setup monitoring if not scan-only
    setup_monitoring
    
    log "Docker vulnerability management complete!" "$GREEN"
    log "Report: $report_file"
    log "Log: $LOG_FILE"
}

# Run main function with all arguments
main "$@"
