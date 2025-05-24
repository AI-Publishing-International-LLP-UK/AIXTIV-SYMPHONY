#!/bin/bash

# AIXTIV Symphony Opus Project - Final Migration Script
# Enterprise-grade file migration with automated verification and reporting
# This script handles the complete migration process with no user intervention

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Setup Logging
# ---------------------------------------------------------------------------

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="/Users/as/asoos/migration_logs"
MAIN_LOG="${LOG_DIR}/migration_${TIMESTAMP}.log"
MANIFEST_LOG="${LOG_DIR}/manifest_${TIMESTAMP}.log"
CHECKSUMS_LOG="${LOG_DIR}/checksums_${TIMESTAMP}.log"
VERIFICATION_LOG="${LOG_DIR}/verification_${TIMESTAMP}.log"
FINAL_REPORT="${LOG_DIR}/final_report_${TIMESTAMP}.md"

# Create log directory
mkdir -p "${LOG_DIR}"

# Log functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1" | tee -a "${MAIN_LOG}"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "${MAIN_LOG}"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "${MAIN_LOG}"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $1" | tee -a "${MAIN_LOG}"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${MAIN_LOG}"; }
log_manifest() { echo "$1" >> "${MANIFEST_LOG}"; }
log_checksum() { echo "$1" >> "${CHECKSUMS_LOG}"; }
log_verify() { echo "$1" >> "${VERIFICATION_LOG}"; }

# Banner function
print_banner() {
    local text="$1"
    local width=80
    local padding=$(( (width - ${#text}) / 2 ))
    
    echo -e "\n${CYAN}"
    printf '%*s' $width '' | tr ' ' '='
    echo -e "\n"
    printf '%*s' $padding ''
    echo -n "$text"
    echo -e "\n"
    printf '%*s' $width '' | tr ' ' '='
    echo -e "${NC}\n"
}

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Source and destination directories
SRC_ROOT="/Users/as/aixtiv-symphony-opus1.0.1"
ASOOS_ROOT="/Users/as/asoos"
OPUS_ROOT="${ASOOS_ROOT}/opus"
ASO_ROOT="${OPUS_ROOT}/aso1.0.1"

# Component directories
COMPONENTS=(
    "backend"
    "frontend"
    "vls"
    "wing"
    "blockchain"
    "data"
    "e-commerce"
    "academy"
    "core-protocols"
    "internationalization"
)

# Required directories that should exist in final structure
REQUIRED_DIRS=(
    "${ASOOS_ROOT}/backend"
    "${ASOOS_ROOT}/frontend"
    "${ASOOS_ROOT}/vls"
    "${ASOOS_ROOT}/wing"
    "${ASOOS_ROOT}/blockchain"
    "${ASOOS_ROOT}/data"
    "${ASOOS_ROOT}/e-commerce"
    "${ASOOS_ROOT}/academy"
    "${ASOOS_ROOT}/core-protocols"
    "${ASOOS_ROOT}/internationalization"
    "${OPUS_ROOT}/aso1.0.1"
)

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

# Create all required directories
ensure_directories() {
    log_info "Ensuring all required directories exist"
    
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_info "Creating directory: $dir"
            mkdir -p "$dir"
        else
            log_debug "Directory already exists: $dir"
        fi
    done
}

# Calculate checksum for a file
calculate_checksum() {
    local file="$1"
    if [[ -f "$file" ]]; then
        shasum -a 256 "$file" | cut -d ' ' -f 1
    else
        echo "FILE_NOT_FOUND"
    fi
}

# Generate checksums for all files in a directory
generate_checksums() {
    local dir="$1"
    local prefix="$2"
    
    if [[ ! -d "$dir" ]]; then
        log_warn "Directory not found: $dir"
        return
    fi
    
    log_info "Generating checksums for $dir"
    
    find "$dir" -type f -not -path "*/\.*" | while read file; do
        local rel_path="${file#$dir/}"
        local checksum=$(calculate_checksum "$file")
        log_checksum "${prefix}:${rel_path}:${checksum}"
    done
}

# Verify checksum for a single file
verify_checksum() {
    local src_file="$1"
    local dst_file="$2"
    
    if [[ ! -f "$src_file" ]]; then
        log_verify "MISSING_SOURCE:$src_file"
        return 1
    fi
    
    if [[ ! -f "$dst_file" ]]; then
        log_verify "MISSING_DESTINATION:$dst_file"
        return 1
    fi
    
    local src_checksum=$(calculate_checksum "$src_file")
    local dst_checksum=$(calculate_checksum "$dst_file")
    
    if [[ "$src_checksum" == "$dst_checksum" ]]; then
        log_verify "MATCH:$src_file:$dst_file"
        return 0
    else
        log_verify "MISMATCH:$src_file:$dst_file:$src_checksum:$dst_checksum"
        return 1
    fi
}

# Copy a file with verification
copy_with_verification() {
    local src_file="$1"
    local dst_file="$2"
    
    # Create destination directory if it doesn't exist
    local dst_dir=$(dirname "$dst_file")
    if [[ ! -d "$dst_dir" ]]; then
        mkdir -p "$dst_dir"
    fi
    
    # Copy the file
    cp -p "$src_file" "$dst_file"
    
    # Verify the copy
    if verify_checksum "$src_file" "$dst_file"; then
        log_manifest "COPIED:$src_file:$dst_file"
        return 0
    else
        log_manifest "FAILED:$src_file:$dst_file"
        return 1
    fi
}

# Process a component directory
process_component() {
    local component="$1"
    local src_dir="${SRC_ROOT}/${component}"
    local dst_dir="${ASOOS_ROOT}/${component}"
    
    if [[ ! -d "$src_dir" ]]; then
        log_debug "Source component directory not found: $src_dir"
        return
    fi
    
    log_info "Processing component: $component"
    
    # Generate checksums for source
    generate_checksums "$src_dir" "SRC_${component}"
    
    # Copy files
    find "$src_dir" -type f -not -path "*/\.*" | while read src_file; do
        local rel_path="${src_file#$src_dir/}"
        local dst_file="${dst_dir}/${rel_path}"
        
        copy_with_verification "$src_file" "$dst_file"
    done
    
    # Generate checksums for destination
    generate_checksums "$dst_dir" "DST_${component}"
    
    log_success "Component $component processed successfully"
}

# Process remaining files to ASO root
process_remaining_files() {
    log_info "Processing remaining files in source root"
    
    # Find all files in source root that are not in component directories
    find "$SRC_ROOT" -maxdepth 1 -type f -not -path "*/\.*" | while read src_file; do
        local filename=$(basename "$src_file")
        local dst_file="${ASO_ROOT}/${filename}"
        
        copy_with_verification "$src_file" "$dst_file"
    done
    
    log_success "Remaining files processed successfully"
}

# Verify final structure
verify_final_structure() {
    log_info "Verifying final directory structure"
    
    local missing_dirs=0
    
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "Required directory missing: $dir"
            missing_dirs=$((missing_dirs + 1))
        fi
    done
    
    if [[ $missing_dirs -eq 0 ]]; then
        log_success "All required directories are present"
        return 0
    else
        log_error "$missing_dirs required directories are missing"
        return 1
    fi
}

# Count files in directory
count_files() {
    local dir="$1"
    if [[ -d "$dir" ]]; then
        find "$dir" -type f -not -path "*/\.*" | wc -l | tr -d ' '
    else
        echo "0"
    fi
}
# Calculate total verification stats
calculate_verification_stats() {
    # Use a safer approach to avoid newline issues
    if [ ! -f "$VERIFICATION_LOG" ]; then
        # Return zeros if log file doesn't exist
        echo "0:0:0:0"
        return
    fi
    
    # Count occurrences safely, ensuring we get proper numbers
    local total_files=0
    local mismatched_files=0
    local missing_src=0
    local missing_dst=0
    
    # Use wc -l instead of grep -c to avoid potential issues
    if grep -q "^MATCH:" "$VERIFICATION_LOG"; then
        total_files=$(grep "^MATCH:" "$VERIFICATION_LOG" | wc -l | tr -d ' ')
    fi
    
    if grep -q "^MISMATCH:" "$VERIFICATION_LOG"; then
        mismatched_files=$(grep "^MISMATCH:" "$VERIFICATION_LOG" | wc -l | tr -d ' ')
    fi
    
    if grep -q "^MISSING_SOURCE:" "$VERIFICATION_LOG"; then
        missing_src=$(grep "^MISSING_SOURCE:" "$VERIFICATION_LOG" | wc -l | tr -d ' ')
    fi
    
    if grep -q "^MISSING_DESTINATION:" "$VERIFICATION_LOG"; then
        missing_dst=$(grep "^MISSING_DESTINATION:" "$VERIFICATION_LOG" | wc -l | tr -d ' ')
    fi
    
    # Return the values as a colon-separated string
    printf "%d:%d:%d:%d" "$total_files" "$mismatched_files" "$missing_src" "$missing_dst"
}

# Generate final report
generate_final_report() {
    local stats=$(calculate_verification_stats)
    local matched_files=$(echo "$stats" | cut -d ':' -f 1)
    local mismatched_files=$(echo "$stats" | cut -d ':' -f 2)
    local missing_src=$(echo "$stats" | cut -d ':' -f 3)
    local missing_dst=$(echo "$stats" | cut -d ':' -f 4)
    local total_issues=$((mismatched_files + missing_src + missing_dst))
    
    # Create report header
    {
        echo "# AIXTIV Symphony Opus Project - Migration Report"
        echo "**Generated:** $(date)"
        echo
        echo "## Summary"
        
        if [[ $total_issues -eq 0 ]]; then
            echo "**Status: SUCCESS** - All files migrated and verified successfully"
        else
            echo "**Status: ISSUES DETECTED** - $total_issues issues found during migration"
        fi
        
        echo
        echo "| Metric | Count |"
        echo "|--------|-------|"
        echo "| Files successfully migrated | $matched_files |"
        echo "| Files with mismatched checksums | $mismatched_files |"
        echo "| Missing source files | $missing_src |"
        echo "| Missing destination files | $missing_dst |"
        echo
        
        echo "## Directory Structure"
        echo
        for dir in "${REQUIRED_DIRS[@]}"; do
            if [[ -d "$dir" ]]; then
                local file_count=$(count_files "$dir")
                echo "- ✅ \`$dir\` - $file_count files"
            else
                echo "- ❌ \`$dir\` - MISSING"
            fi
        done
        echo
        
        echo "## Component Details"
        echo
        for component in "${COMPONENTS[@]}"; do
            local src_dir="${SRC_ROOT}/${component}"
            local dst_dir="${ASOOS_ROOT}/${component}"
            local src_count=$(count_files "$src_dir")
            local dst_count=$(count_files "$dst_dir")
            
            echo "### $component"
            echo "| Location | File Count |"
            echo "|----------|------------|"
            echo "| Source | $src_count |"
            echo "| Destination | $dst_count |"
            echo
        done
        
        echo "## Logs"
        echo
        echo "Detailed logs are available at:"
        echo "- Migration log: \`$MAIN_LOG\`"
        echo "- File manifest: \`$MANIFEST_LOG\`"
        echo "- Checksums: \`$CHECKSUMS_LOG\`"
        echo "- Verification: \`$VERIFICATION_LOG\`"
        
    } > "$FINAL_REPORT"
    
    log_info "Final report generated: $FINAL_REPORT"
}

# ---------------------------------------------------------------------------
# Main Migration Process
# ---------------------------------------------------------------------------

main() {
    print_banner "AIXTIV Symphony Opus - Migration Process"
    
    log_info "Starting migration process at $(date)"
    log_info "Source: $SRC_ROOT"
    log_info "Destination: $ASOOS_ROOT"
    log_info "Logs directory: $LOG_DIR"
    
    # Step 1: Ensure directories exist
    ensure_directories
    
    # Step 2: Process each component
    for component in "${COMPONENTS[@]}"; do
        process_component "$component"
    done
    
    # Step 3: Process remaining files
    process_remaining_files
    
    # Step 4: Verify final structure
    verify_final_structure
    
    # Step 5: Generate final report
    generate_final_report
    
    log_info "Migration process completed at $(date)"
    
    print_banner "Migration Completed"
    
    echo -e "${GREEN}Migration process completed.${NC}"
    echo -e "Final report: ${CYAN}$FINAL_REPORT${NC}"
}

# Execute the main process
main

