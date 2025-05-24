#!/bin/bash

# Project Reorganization Script
# This script reorganizes the project structure according to the required architecture

# Exit immediately if a command fails
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log functions
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        log "Creating directory: $1"
        mkdir -p "$1" || error "Failed to create directory: $1"
    fi
}

# Move directory contents with validation
move_contents() {
    local src="$1"
    local dst="$2"
    
    if [ ! -d "$src" ]; then
        warn "Source directory does not exist: $src - Skipping"
        return 1
    fi
    
    if [ ! -d "$dst" ]; then
        create_dir "$dst"
    fi
    
    # Count files before moving
    local files_count=$(find "$src" -type f | wc -l)
    log "Moving $files_count files from $src to $dst"
    
    # Move the contents
    rsync -a "$src/" "$dst/" || error "Failed to move contents from $src to $dst"
    
    # Verify the move
    local moved_count=$(find "$dst" -type f | wc -l)
    log "Moved $moved_count files to $dst"
    
    # Remove source if empty
    if [ -z "$(ls -A "$src")" ]; then
        log "Removing empty directory: $src"
        rmdir "$src" || warn "Could not remove directory: $src"
    else
        warn "Source directory not empty after move: $src"
    fi
    
    return 0
}

# Main script

log "Starting project reorganization..."

# Create backup timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/Users/as/asoos/backups/reorganization_backup_${TIMESTAMP}"

# Backup critical directories
log "Creating backup at $BACKUP_DIR"
create_dir "$BACKUP_DIR"

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1" ]; then
    log "Backing up /Users/as/aixtiv-symphony-opus1.0.1"
    rsync -a "/Users/as/aixtiv-symphony-opus1.0.1/" "$BACKUP_DIR/aixtiv-symphony-opus1.0.1/"
fi

if [ -d "/Users/as/asoos/opus/academy" ]; then
    log "Backing up /Users/as/asoos/opus/academy"
    rsync -a "/Users/as/asoos/opus/academy/" "$BACKUP_DIR/opus_academy/"
fi

# Create base directories
create_dir "/Users/as/asoos"
create_dir "/Users/as/asoos/opus/aso1.0.1"
create_dir "/Users/as/asoos/academy"
create_dir "/Users/as/asoos/frontend"
create_dir "/Users/as/asoos/backend"
create_dir "/Users/as/asoos/vls"
create_dir "/Users/as/asoos/wing"
create_dir "/Users/as/asoos/blockchain"
create_dir "/Users/as/asoos/data"
create_dir "/Users/as/asoos/e-commerce"
create_dir "/Users/as/asoos/core-protocols"
create_dir "/Users/as/asoos/internationalization"

# Step 1: Move component-specific directories to their proper locations
log "Moving component directories to their proper locations"

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/backend" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/backend" "/Users/as/asoos/backend"
fi

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/frontend" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/frontend" "/Users/as/asoos/frontend"
fi

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/vls" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/vls" "/Users/as/asoos/vls"
fi

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/wing" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/wing" "/Users/as/asoos/wing"
fi

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/blockchain" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/blockchain" "/Users/as/asoos/blockchain"
fi

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/data" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/data" "/Users/as/asoos/data"
fi

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/e-commerce" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/e-commerce" "/Users/as/asoos/e-commerce"
fi

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/core-protocols" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/core-protocols" "/Users/as/asoos/core-protocols"
fi

if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/internationalization" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1/internationalization" "/Users/as/asoos/internationalization"
fi

# Step 2: Move academy directory from opus to asoos root
log "Moving academy directory from opus to asoos root"
if [ -d "/Users/as/asoos/opus/academy" ]; then
    move_contents "/Users/as/asoos/opus/academy" "/Users/as/asoos/academy"
fi

# Step 3: Move any remaining content from aixtiv-symphony-opus1.0.1 to opus/aso1.0.1
log "Moving remaining content to aso1.0.1"
if [ -d "/Users/as/aixtiv-symphony-opus1.0.1" ]; then
    move_contents "/Users/as/aixtiv-symphony-opus1.0.1" "/Users/as/asoos/opus/aso1.0.1"
fi

# Step 4: Remove any empty directories
log "Cleaning up empty directories"
for dir in "/Users/as/aixtiv-symphony-opus1.0.1" "/Users/as/asoos/opus/academy"; do
    if [ -d "$dir" ] && [ -z "$(ls -A "$dir")" ]; then
        log "Removing empty directory: $dir"
        rmdir "$dir" || warn "Could not remove directory: $dir"
    elif [ -d "$dir" ]; then
        warn "Directory not empty, manual review needed: $dir"
    fi
done

# Step 5: Validate the final structure
log "Validating directory structure"

validation_failed=false
for dir in \
    "/Users/as/asoos/opus/aso1.0.1" \
    "/Users/as/asoos/academy" \
    "/Users/as/asoos/frontend" \
    "/Users/as/asoos/backend" \
    "/Users/as/asoos/vls" \
    "/Users/as/asoos/wing" \
    "/Users/as/asoos/blockchain" \
    "/Users/as/asoos/data" \
    "/Users/as/asoos/e-commerce" \
    "/Users/as/asoos/core-protocols" \
    "/Users/as/asoos/internationalization"
do
    if [ ! -d "$dir" ]; then
        warn "Required directory does not exist: $dir"
        validation_failed=true
    fi
done

if [ "$validation_failed" = true ]; then
    warn "Some required directories are missing - please check the logs"
else
    log "Directory structure validation passed"
fi

log "Reorganization complete. Backup available at: $BACKUP_DIR"
log "Please verify the structure manually to ensure all files were properly moved."

