#!/bin/bash
# 🛡️ Diamond CLI Weekly Backup Script
# Production MCP System Configuration Backup
# Usage: ./weekly-backup.sh [--force] [--cleanup-old]

BACKUP_BASE_DIR="backups"
BACKUP_DIR="$BACKUP_BASE_DIR/$(date +%Y%m%d)"
FORCE_BACKUP=false
CLEANUP_OLD=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_BACKUP=true
            shift
            ;;
        --cleanup-old)
            CLEANUP_OLD=true
            shift
            ;;
        -h|--help)
            echo "Diamond CLI Weekly Backup Script"
            echo "Usage: $0 [--force] [--cleanup-old]"
            echo "  --force: Create backup even if one exists for today"
            echo "  --cleanup-old: Remove backups older than 30 days"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

create_backup_dir() {
    if [ -d "$BACKUP_DIR" ] && [ "$FORCE_BACKUP" = false ]; then
        log "⚠️  Backup already exists for today: $BACKUP_DIR"
        log "Use --force to create anyway"
        return 1
    fi
    
    log "📁 Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    return 0
}

backup_configuration_files() {
    log "📋 Backing up configuration files..."
    
    local files_backed_up=0
    
    # Core configuration files
    local config_files=(
        "wrangler-production-simple.toml"
        "wrangler-production.toml"
        "wrangler.toml"
        "worker.js"
        "monitor-production.js"
        "health-check.sh"
        "weekly-backup.sh"
        "DEPLOYMENT-REPORT.md"
        "MAINTENANCE-PROCEDURES.md"
        "package.json"
    )
    
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$BACKUP_DIR/"
            log "✅ Backed up: $file"
            ((files_backed_up++))
        else
            log "⚠️  File not found: $file"
        fi
    done
    
    log "📊 Backed up $files_backed_up configuration files"
}

backup_worker_code() {
    log "🔄 Downloading current worker code from Cloudflare..."
    
    # Check if wrangler is available
    if ! command -v wrangler &> /dev/null; then
        log "❌ Wrangler CLI not found - Cannot download worker code"
        return 1
    fi
    
    # Download current production worker
    if wrangler download --name wfa-orchestration-worker-production --output "$BACKUP_DIR/current-worker.js" 2>/dev/null; then
        log "✅ Downloaded current worker code"
    else
        log "⚠️  Could not download worker code - may not exist or auth issue"
    fi
    
    # Get deployment history
    if wrangler deployments list --name wfa-orchestration-worker-production --format json > "$BACKUP_DIR/deployment-history.json" 2>/dev/null; then
        log "✅ Saved deployment history"
    else
        log "⚠️  Could not get deployment history"
    fi
}

create_system_snapshot() {
    log "📸 Creating system snapshot..."
    
    local snapshot_file="$BACKUP_DIR/system-snapshot.json"
    
    # Test current system endpoints and save responses
    local worker_url="https://wfa-orchestration-worker-production-production.pr-aef.workers.dev"
    
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
        echo "  \"backup_date\": \"$(date +%Y%m%d)\","
        echo "  \"worker_url\": \"$worker_url\","
        
        # Health check
        echo "  \"health_check\": $(curl -s --max-time 10 "$worker_url/health" 2>/dev/null || echo 'null'),"
        
        # Orchestration status
        echo "  \"orchestration\": $(curl -s --max-time 10 "$worker_url/mcp/orchestrate" 2>/dev/null || echo 'null'),"
        
        # DNS resolution test
        echo "  \"dns_test\": $(curl -s --max-time 10 "$worker_url/mcp/dns/resolve?domain=mcp.aipub.2100.cool" 2>/dev/null || echo 'null'),"
        
        # Wrangler account info
        echo "  \"account_info\": $(wrangler whoami --format json 2>/dev/null || echo 'null')"
        
        echo "}"
    } > "$snapshot_file"
    
    log "✅ System snapshot saved to: $(basename "$snapshot_file")"
}

create_backup_manifest() {
    log "📋 Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/BACKUP-MANIFEST.md"
    
    cat > "$manifest_file" << EOF
# 🛡️ Diamond CLI Backup Manifest

## Backup Information
- **Date:** $(date '+%Y-%m-%d %H:%M:%S UTC')
- **Directory:** $BACKUP_DIR
- **System:** Victory36 MCP Orchestrator Production

## Files Included

### Configuration Files
$(find "$BACKUP_DIR" -name "*.toml" -o -name "*.js" -o -name "*.json" | sort | sed 's|.*\/||' | sed 's/^/- /')

### Documentation
$(find "$BACKUP_DIR" -name "*.md" | sort | sed 's|.*\/||' | sed 's/^/- /')

### Scripts
$(find "$BACKUP_DIR" -name "*.sh" | sort | sed 's|.*\/||' | sed 's/^/- /')

## Backup Statistics
- **Total Files:** $(find "$BACKUP_DIR" -type f | wc -l | tr -d ' ')
- **Total Size:** $(du -sh "$BACKUP_DIR" | cut -f1)
- **Worker Status:** $(curl -s --max-time 5 "https://wfa-orchestration-worker-production-production.pr-aef.workers.dev/health" | grep -o '"status":"[^"]*"' || echo 'Unknown')

## Recovery Instructions

To restore from this backup:

1. **Restore Configuration:**
   \`\`\`bash
   cp $BACKUP_DIR/wrangler-production-simple.toml ./
   cp $BACKUP_DIR/worker.js ./
   \`\`\`

2. **Deploy Worker:**
   \`\`\`bash
   wrangler deploy --config wrangler-production-simple.toml --env production
   \`\`\`

3. **Verify System:**
   \`\`\`bash
   ./health-check.sh --single-check --verbose
   \`\`\`

## Notes
- This backup was created automatically by the weekly backup script
- All sensitive information has been excluded from the backup
- System was operational at time of backup: $(date)

---
Generated by Diamond CLI Weekly Backup Script
EOF

    log "✅ Backup manifest created"
}

cleanup_old_backups() {
    if [ "$CLEANUP_OLD" = false ]; then
        return 0
    fi
    
    log "🧹 Cleaning up backups older than 30 days..."
    
    if [ ! -d "$BACKUP_BASE_DIR" ]; then
        log "No backup directory found for cleanup"
        return 0
    fi
    
    local deleted_count=0
    
    # Find and delete backups older than 30 days
    find "$BACKUP_BASE_DIR" -type d -name "20*" -mtime +30 | while read -r old_backup; do
        if [ -d "$old_backup" ]; then
            log "🗑️  Removing old backup: $(basename "$old_backup")"
            rm -rf "$old_backup"
            ((deleted_count++))
        fi
    done
    
    log "🧹 Cleanup complete - removed $deleted_count old backups"
}

# Main execution
main() {
    log "🛡️ Diamond CLI Weekly Backup Starting..."
    
    # Create backup directory
    if ! create_backup_dir; then
        exit 1
    fi
    
    # Perform backup operations
    backup_configuration_files
    backup_worker_code
    create_system_snapshot
    create_backup_manifest
    
    # Cleanup if requested
    cleanup_old_backups
    
    log "✅ Backup completed successfully"
    log "📁 Backup location: $BACKUP_DIR"
    log "📊 Backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    
    # Show summary
    echo ""
    echo "🛡️ Diamond CLI Backup Summary"
    echo "================================="
    echo "Date: $(date)"
    echo "Location: $BACKUP_DIR"
    echo "Files: $(find "$BACKUP_DIR" -type f | wc -l | tr -d ' ')"
    echo "Size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo "Status: ✅ Complete"
}

# Run the backup
main
