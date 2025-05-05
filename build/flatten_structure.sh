#!/bin/bash

# Script to flatten directory structure by moving all files to the root directory
# with appropriate prefixes to avoid name conflicts

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status messages
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Create a backup directory
BACKUP_DIR="./flattening_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
log "Created backup directory: $BACKUP_DIR"

# Track moved files
moved_files=()
skipped_files=()
overwritten_files=()

# Find all files except those in the backup directory or hidden files
log "Finding all files to be moved..."
FILES=$(find . -type f -not -path "$BACKUP_DIR/*" -not -path "*/\.*" -not -path "./node_modules/*" -not -path "./flatten_structure.sh")

# Total number of files
total_files=$(echo "$FILES" | wc -l)
log "Found $total_files files to process"

# Process each file
for file in $FILES; do
  # Skip if file is in root directory
  if [[ $(dirname "$file") == "." ]]; then
    skipped_files+=("$file (already in root)")
    continue
  fi
  
  # Generate new filename
  # Remove leading ./ 
  clean_path=${file#./}
  # Replace / with -
  new_name=$(echo "$clean_path" | tr '/' '-')
  
  log "Processing: $file -> $new_name"
  
  # Check if destination file already exists
  if [[ -f "./$new_name" ]]; then
    warn "Target file already exists: ./$new_name"
    # Create backup of existing file
    cp "./$new_name" "$BACKUP_DIR/"
    overwritten_files+=("$new_name (original backed up)")
  fi
  
  # Move the file
  mv "$file" "./$new_name"
  moved_files+=("$file -> $new_name")
done

# Print summary
echo ""
log "==== Summary ===="
log "Total files processed: $total_files"
log "Files moved: ${#moved_files[@]}"
log "Files skipped (already in root): ${#skipped_files[@]}"
log "Files that overwrote existing files: ${#overwritten_files[@]}"
log "Backup directory: $BACKUP_DIR"

# Print lists of files if there are any in the category
if [[ ${#moved_files[@]} -gt 0 ]]; then
  echo ""
  log "==== Moved Files ===="
  for file in "${moved_files[@]}"; do
    echo "  $file"
  done
fi

if [[ ${#overwritten_files[@]} -gt 0 ]]; then
  echo ""
  warn "==== Overwritten Files (Backups Created) ===="
  for file in "${overwritten_files[@]}"; do
    echo "  $file"
  done
fi

# Cleanup empty directories (optional)
find . -type d -empty -not -path "$BACKUP_DIR" -not -path "." -delete
log "Removed empty directories"

echo ""
log "Flattening complete! All files are now in the root directory."
log "You can restore any files from the backup directory: $BACKUP_DIR"

# Make the script executable
chmod +x flatten_structure.sh

