#!/bin/bash

# Cleanup Script for AIXTIV Symphony Opus Project Reorganization
# This script safely removes source directories after verifying files were copied correctly

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Log functions
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[DEBUG]${NC} $1"; }

# Create log file
LOG_FILE="/Users/as/asoos/cleanup_log_$(date +%Y%m%d_%H%M%S).txt"
touch "$LOG_FILE"

# Function to log to both console and file
log_both() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to verify files were copied correctly
verify_copy() {
    local src="$1"
    local dst="$2"
    
    log_both "[VERIFY] Checking that files from $src were copied to $dst"
    
    # Check if source exists
    if [ ! -d "$src" ]; then
        log_both "[VERIFY] Source directory does not exist: $src"
        return 1
    fi
    
    # Check if destination exists
    if [ ! -d "$dst" ]; then
        log_both "[VERIFY] Destination directory does not exist: $dst"
        return 1
    fi
    
    # Count files in source and destination
    local src_count=$(find "$src" -type f | wc -l | tr -d ' ')
    local dst_count=$(find "$dst" -type f | wc -l | tr -d ' ')
    
    log_both "[VERIFY] Source contains $src_count files"
    log_both "[VERIFY] Destination contains $dst_count files"
    
    # Check if destination has at least as many files as source
    if [ "$dst_count" -lt "$src_count" ]; then
        log_both "[VERIFY] Destination has fewer files than source! Not safe to remove."
        return 1
    fi
    
    # Sample a few files to verify existence in destination
    log_both "[VERIFY] Checking sample files..."
    local missing_files=0
    
    # Find a few representative files from source
    local sample_files=$(find "$src" -type f -name "*.js" -o -name "*.ts" -o -name "*.md" -o -name "*.json" | head -n 10)
    
    if [ -z "$sample_files" ]; then
        # If no JS/TS/MD/JSON files, try any files
        sample_files=$(find "$src" -type f | head -n 10)
    fi
    
    # Check if each sample file exists in destination
    for file in $sample_files; do
        local rel_path=${file#$src/}
        local dst_file="$dst/$rel_path"
        
        if [ ! -f "$dst_file" ]; then
            log_both "[VERIFY] Missing file in destination: $rel_path"
            missing_files=$((missing_files + 1))
        else 
            # Compare file sizes
            local src_size=$(stat -f%z "$file")
            local dst_size=$(stat -f%z "$dst_file")
            
            if [ "$src_size" -ne "$dst_size" ]; then
                log_both "[VERIFY] File size mismatch for $rel_path: $src_size vs $dst_size"
                missing_files=$((missing_files + 1))
            fi
        fi
    done
    
    if [ "$missing_files" -gt 0 ]; then
        log_both "[VERIFY] Found $missing_files missing or mismatched files. Not safe to remove."
        return 1
    fi
    
    log_both "[VERIFY] All verification checks passed for $src -> $dst"
    return 0
}

# Function to safely remove a directory
safe_remove() {
    local dir="$1"
    
    if [ ! -d "$dir" ]; then
        log_both "[REMOVE] Directory does not exist: $dir"
        return 0
    fi
    
    log_both "[REMOVE] Removing directory: $dir"
    
    # Create a backup of the directory listing before removal
    find "$dir" -type f > "${LOG_FILE}.${dir//\//_}_files.txt"
    log_both "[REMOVE] File listing saved to ${LOG_FILE}.${dir//\//_}_files.txt"
    
    # Remove the directory
    rm -rf "$dir"
    
    if [ ! -d "$dir" ]; then
        log_both "[REMOVE] Successfully removed $dir"
        return 0
    else
        log_both "[REMOVE] Failed to remove $dir"
        return 1
    fi
}

# Main cleanup logic
log_both "========================================================"
log_both "Starting cleanup process at $(date)"
log_both "========================================================"

# 1. Verify and remove component-specific directories in aixtiv-symphony-opus1.0.1
for component in \
    "backend" \
    "frontend" \
    "vls" \
    "wing" \
    "blockchain" \
    "data" \
    "e-commerce" \
    "core-protocols" \
    "internationalization"
do
    if [ -d "/Users/as/aixtiv-symphony-opus1.0.1/$component" ] && [ -d "/Users/as/asoos/$component" ]; then
        log_both "Checking component: $component"
        
        if verify_copy "/Users/as/aixtiv-symphony-opus1.0.1/$component" "/Users/as/asoos/$component"; then
            safe_remove "/Users/as/aixtiv-symphony-opus1.0.1/$component"
        else
            warn "Skipping removal of /Users/as/aixtiv-symphony-opus1.0.1/$component due to verification failure"
        fi
    fi
done

# 2. Verify and remove /Users/as/asoos/opus/academy
if [ -d "/Users/as/asoos/opus/academy" ] && [ -d "/Users/as/asoos/academy" ]; then
    log_both "Checking academy directory"
    
    if verify_copy "/Users/as/asoos/opus/academy" "/Users/as/asoos/academy"; then
        safe_remove "/Users/as/asoos/opus/academy"
    else
        warn "Skipping removal of /Users/as/asoos/opus/academy due to verification failure"
    fi
else
    log_both "Academy directory not found in source or destination"
fi

# 3. Verify and remove remaining aixtiv-symphony-opus1.0.1 content
if [ -d "/Users/as/aixtiv-symphony-opus1.0.1" ] && [ -d "/Users/as/asoos/opus/aso1.0.1" ]; then
    log_both "Checking remaining content"
    
    # Since some directories have already been moved to component directories,
    # just verify what's left without comparing counts
    log_both "[MANUAL CHECK] The following files are left in /Users/as/aixtiv-symphony-opus1.0.1:"
    find "/Users/as/aixtiv-symphony-opus1.0.1" -type f -maxdepth 1 | tee -a "$LOG_FILE"
    
    read -p "Have you verified these files are copied to /Users/as/asoos/opus/aso1.0.1? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_both "User confirmed files are copied. Proceeding with removal."
        safe_remove "/Users/as/aixtiv-symphony-opus1.0.1"
    else
        warn "Skipping removal of /Users/as/aixtiv-symphony-opus1.0.1 due to user verification"
    fi
else
    log_both "Main directory not found in source or destination"
fi

log_both "========================================================"
log_both "Cleanup process completed at $(date)"
log_both "========================================================"
log_both "Cleanup log saved to $LOG_FILE"

