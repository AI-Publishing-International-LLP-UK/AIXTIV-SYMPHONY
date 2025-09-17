#!/bin/bash

# Quick Docker Vulnerability Fix Script
# Immediate remediation for common security issues

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${2:-}$(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

show_help() {
    cat << EOF
Quick Docker Vulnerability Fix Script

USAGE:
    $0 [OPTIONS] COMMAND [ARGS...]

COMMANDS:
    scan-critical          Quickly identify images with critical vulnerabilities
    update-bases          Update base images to secure versions
    rebuild-production    Rebuild production images with security fixes
    cleanup-old           Remove old vulnerable images
    bulk-update           Update all images with known fixes
    generate-dockerfiles  Create updated Dockerfiles for your images

OPTIONS:
    --dry-run            Show what would be done without making changes
    --force              Force actions without confirmation
    --backup             Create backups before making changes
    --quiet              Minimal output

EXAMPLES:
    $0 scan-critical
    $0 --dry-run update-bases
    $0 --backup rebuild-production
    $0 bulk-update

For comprehensive scanning, use: ./docker-vuln-manager.sh
EOF
}

# Quick scan for critical vulnerabilities
scan_critical() {
    log "🔍 Quick scan for critical vulnerabilities..." "$BLUE"
    
    # Get images with likely vulnerabilities based on age and base
    local critical_images=()
    
    # Images using old Ubuntu versions
    log "Checking for outdated base images..." "$YELLOW"
    while IFS= read -r image; do
        if [[ -n "$image" ]]; then
            # Check if image uses old Ubuntu
            if docker run --rm --entrypoint="" "$image" cat /etc/os-release 2>/dev/null | grep -E "(18\.04|20\.04|22\.04)" >/dev/null 2>&1; then
                local version=$(docker run --rm --entrypoint="" "$image" grep "VERSION_ID" /etc/os-release 2>/dev/null | cut -d'"' -f2 || echo "unknown")
                log "🔴 CRITICAL: $image uses Ubuntu $version" "$RED"
                critical_images+=("$image")
            fi
        fi
    done <<< "$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>" | head -20)"
    
    # Images using old Node.js (common vulnerability source)
    log "Checking for outdated Node.js versions..." "$YELLOW"
    while IFS= read -r image; do
        if [[ -n "$image" ]]; then
            if docker run --rm --entrypoint="" "$image" node --version 2>/dev/null | grep -E "v1[0-7]\." >/dev/null 2>&1; then
                local version=$(docker run --rm --entrypoint="" "$image" node --version 2>/dev/null || echo "unknown")
                log "🔴 CRITICAL: $image uses Node.js $version (deprecated)" "$RED"
                critical_images+=("$image")
            fi
        fi
    done <<< "$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>" | head -20)"
    
    # Very old images (over 6 months)
    log "Checking for very old images..." "$YELLOW"
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
    awk '$2 ~ /months?/ && ($2 ~ /[6-9]|[1-9][0-9]/) {print $1}' | \
    while read -r old_image; do
        if [[ -n "$old_image" && "$old_image" != "REPOSITORY:TAG" ]]; then
            log "⚠️  OLD: $old_image (6+ months old, likely vulnerable)" "$YELLOW"
            critical_images+=("$old_image")
        fi
    done
    
    if [[ ${#critical_images[@]} -gt 0 ]]; then
        log "🚨 Found ${#critical_images[@]} images with likely critical vulnerabilities" "$RED"
        printf '%s\n' "${critical_images[@]}" > critical-images.txt
        log "Critical images saved to: critical-images.txt" "$GREEN"
        return 0
    else
        log "✅ No obvious critical vulnerabilities found in quick scan" "$GREEN"
        return 1
    fi
}

# Update base images to secure versions
update_bases() {
    local dry_run=${1:-false}
    log "🔄 Updating base images to secure versions..." "$BLUE"
    
    # Common base image updates
    declare -A base_updates=(
        ["ubuntu:18.04"]="ubuntu:24.04"
        ["ubuntu:20.04"]="ubuntu:24.04"
        ["ubuntu:22.04"]="ubuntu:24.04"
        ["node:14"]="node:22-alpine"
        ["node:16"]="node:22-alpine"
        ["node:18"]="node:22-alpine"
        ["python:3.8"]="python:3.12-slim"
        ["python:3.9"]="python:3.12-slim"
    )
    
    for old_base in "${!base_updates[@]}"; do
        local new_base="${base_updates[$old_base]}"
        
        # Find Dockerfiles using this base
        if find . -name "Dockerfile*" -exec grep -l "FROM $old_base" {} \; 2>/dev/null | head -5; then
            log "Found Dockerfiles using $old_base" "$YELLOW"
            
            if [[ "$dry_run" == "true" ]]; then
                log "DRY RUN: Would update FROM $old_base to FROM $new_base" "$BLUE"
            else
                log "Updating FROM $old_base to FROM $new_base" "$GREEN"
                find . -name "Dockerfile*" -exec sed -i.bak "s|FROM $old_base|FROM $new_base|g" {} \;
            fi
        fi
    done
}

# Rebuild production images with security fixes
rebuild_production() {
    local backup=${1:-false}
    log "🔨 Rebuilding production images with security fixes..." "$BLUE"
    
    # Get production images from GCR
    local prod_images=(
        "gcr.io/api-for-warp-drive/aixtiv-symphony:production-quantum-amd64"
        "gcr.io/api-for-warp-drive/mcp-registry:latest"
    )
    
    for image in "${prod_images[@]}"; do
        if docker images | grep -q "${image%:*}"; then
            if [[ "$backup" == "true" ]]; then
                local backup_tag="${image}-backup-$(date +%Y%m%d-%H%M%S)"
                log "Backing up $image as $backup_tag" "$YELLOW"
                docker tag "$image" "$backup_tag"
            fi
            
            log "Rebuilding $image with latest security patches..." "$BLUE"
            # Note: This would need actual Dockerfile in production
            log "ℹ️  Manual rebuild required - check for updated Dockerfile" "$YELLOW"
        fi
    done
}

# Clean up old vulnerable images
cleanup_old() {
    local dry_run=${1:-false}
    log "🧹 Cleaning up old vulnerable images..." "$BLUE"
    
    # Remove dangling images
    if [[ "$dry_run" == "true" ]]; then
        log "DRY RUN: Would remove dangling images" "$BLUE"
        docker images -f "dangling=true" -q | head -5
    else
        log "Removing dangling images..." "$GREEN"
        docker image prune -f
    fi
    
    # Remove very old images not in use
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.ID}}" | \
    awk '$2 ~ /months?/ && ($2 ~ /[6-9]|[1-9][0-9]/) {print $3}' | \
    while read -r old_id; do
        if [[ -n "$old_id" ]]; then
            if ! docker ps -a --format "{{.ImageID}}" | grep -q "$old_id"; then
                if [[ "$dry_run" == "true" ]]; then
                    log "DRY RUN: Would remove old image: $old_id" "$BLUE"
                else
                    log "Removing old unused image: $old_id" "$YELLOW"
                    docker rmi "$old_id" 2>/dev/null || log "Failed to remove $old_id (may be in use)" "$YELLOW"
                fi
            fi
        fi
    done
}

# Bulk update all images with known fixes
bulk_update() {
    local dry_run=${1:-false}
    log "⚡ Bulk updating images with known security fixes..." "$BLUE"
    
    # Pull latest versions of commonly used images
    local safe_images=(
        "ubuntu:24.04"
        "node:22-alpine"
        "python:3.12-slim"
        "nginx:alpine"
        "redis:alpine"
        "postgres:16-alpine"
    )
    
    for image in "${safe_images[@]}"; do
        if [[ "$dry_run" == "true" ]]; then
            log "DRY RUN: Would pull latest $image" "$BLUE"
        else
            log "Pulling latest $image..." "$GREEN"
            docker pull "$image" || log "Failed to pull $image" "$YELLOW"
        fi
    done
    
    # Update base images in Dockerfiles
    update_bases "$dry_run"
}

# Generate updated Dockerfiles
generate_dockerfiles() {
    log "📝 Generating updated Dockerfiles with security improvements..." "$BLUE"
    
    # Create template for secure Dockerfile
    cat > Dockerfile.secure-template << 'EOF'
# Secure Dockerfile Template
# Use specific, updated base image
ARG BASE_IMAGE=ubuntu:24.04
FROM ${BASE_IMAGE}

# Set labels for better maintainability
LABEL maintainer="your-email@company.com"
LABEL version="1.0"
LABEL security.scan="enabled"

# Create non-root user early
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Update packages and install only what's needed
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        # Add your specific packages here
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set secure working directory
WORKDIR /app
RUN chown appuser:appuser /app

# Copy application files with proper ownership
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Use specific port (not privileged)
EXPOSE 8080

# Health check for monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Secure startup command
CMD ["your-secure-command"]
EOF
    
    # Create Node.js specific secure template
    cat > Dockerfile.nodejs-secure << 'EOF'
# Secure Node.js Dockerfile
FROM node:22-alpine

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
RUN chown nodejs:nodejs /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
EOF
    
    log "✅ Generated secure Dockerfile templates:" "$GREEN"
    log "  - Dockerfile.secure-template (general purpose)" "$GREEN"
    log "  - Dockerfile.nodejs-secure (Node.js applications)" "$GREEN"
    
    # Check for existing Dockerfiles and suggest improvements
    if find . -name "Dockerfile*" -not -name "*.secure*" -not -name "*.template" | head -5; then
        log "📋 Found existing Dockerfiles. Consider these security improvements:" "$YELLOW"
        echo "1. Use specific version tags instead of 'latest'"
        echo "2. Create and use non-root user"
        echo "3. Multi-stage builds to reduce attack surface"
        echo "4. Remove package caches and temporary files"
        echo "5. Add health checks for monitoring"
        echo "6. Use .dockerignore to exclude sensitive files"
    fi
}

# Main execution
main() {
    local command=""
    local dry_run=false
    local force=false
    local backup=false
    local quiet=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                dry_run=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --backup)
                backup=true
                shift
                ;;
            --quiet)
                quiet=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            scan-critical|update-bases|rebuild-production|cleanup-old|bulk-update|generate-dockerfiles)
                command=$1
                shift
                ;;
            *)
                log "Unknown option: $1" "$RED"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [[ -z "$command" ]]; then
        log "No command specified" "$RED"
        show_help
        exit 1
    fi
    
    [[ "$quiet" == "true" ]] || log "🚀 Quick Docker Security Fix - Command: $command" "$GREEN"
    
    # Execute command
    case $command in
        scan-critical)
            scan_critical
            ;;
        update-bases)
            update_bases "$dry_run"
            ;;
        rebuild-production)
            rebuild_production "$backup"
            ;;
        cleanup-old)
            cleanup_old "$dry_run"
            ;;
        bulk-update)
            bulk_update "$dry_run"
            ;;
        generate-dockerfiles)
            generate_dockerfiles
            ;;
    esac
    
    [[ "$quiet" == "true" ]] || log "✅ Command completed: $command" "$GREEN"
}

main "$@"
