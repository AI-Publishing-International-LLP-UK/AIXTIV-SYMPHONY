#!/bin/bash

# migrate-paths.sh
# This script finds and updates all references to old directory paths in the codebase
# with the new directory structure.

set -euo pipefail

# Color definitions
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory mappings (old path -> new path)
# Using simple arrays for keys and values instead of associative arrays
DIR_KEYS=(
  "deployments/k8s"
  "deployments/integration-gateway"
  "tests/postman"
  "config/cloud"
  "config/integrations/voice-integration"
  "config/integrations/super-claude-1"
)
DIR_VALUES=(
  "/Users/as/build/deployment/deployments/k8s"
  "/Users/as/build/deployment/deployments/integration-gateway"
  "/Users/as/build/deployment/tests/postman"
  "/Users/as/build/deployment/config/cloud"
  "/Users/as/build/deployment/config/integrations/voice-integration"
  "/Users/as/build/deployment/config/integrations/super-claude-1"
)

# File prefix mappings for files that were renamed
# Using simple arrays for keys and values instead of associative arrays
FILE_KEYS=(
  "api-tests.postman_collection.json"
  "api-environment.postman_environment.json"
)
FILE_VALUES=(
  "api-tests.postman_collection.json"
  "api-environment.postman_environment.json"
)

# File types to scan
FILE_PATTERNS=(
  "*.js"
  "*.json"
  "*.yml"
  "*.yaml"
  "*.sh"
  "*.md"
  "*.ts"
  "*.html"
  "*.css"
  "Dockerfile*"
)

# Directories to exclude
EXCLUDE_DIRS=(
  "node_modules"
  ".git"
  "flattening_backup_*"
)

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup of file before modifying
backup_file() {
  local file="$1"
  local backup="${file}.bak"
  cp "$file" "$backup"
  log_info "Created backup: $backup"
}

# Build the find command with exclusions
build_find_command() {
  local find_cmd="find . -type f"
  
  # Add exclusion directories
  for dir in "${EXCLUDE_DIRS[@]}"; do
    find_cmd+=" -not -path './$dir/*'"
  done
  
  # Add file patterns
  local pattern_args=""
  for pattern in "${FILE_PATTERNS[@]}"; do
    if [ -z "$pattern_args" ]; then
      pattern_args+=" -name '$pattern'"
    else
      pattern_args+=" -o -name '$pattern'"
    fi
  done
  
  find_cmd+=" \\( $pattern_args \\)"
  
  echo "$find_cmd"
}

# Main function to update paths in files
update_paths() {
  log_info "Starting path migration..."
  
  # Create list of files to scan
  local find_cmd=$(build_find_command)
  local files=$(eval $find_cmd)
  
  local modified_files=0
  local scanned_files=0
  
  for file in $files; do
    ((scanned_files++))
    
    # Skip the script itself to avoid self-modification issues
    if [[ "$file" == "$(basename $0)" || "$file" == "./$0" || "$file" == "$0" ]]; then
      log_info "Skipping self-modification of $file"
      continue
    fi
    local file_modified=false
    local file_content=$(cat "$file")
    local new_content="$file_content"
    
    # Update directory paths
    for i in $(seq 0 $((${#DIR_KEYS[@]} - 1))); do
      local old_path="${DIR_KEYS[$i]}"
      local new_path="${DIR_VALUES[$i]}"
      if grep -q "$old_path" <<<"$new_content"; then
        new_content=$(sed "s|$old_path|$new_path|g" <<<"$new_content")
        file_modified=true
        log_info "Found reference to '$old_path' in $file, updating to '$new_path'"
      fi
    done
    
    # Update file names
    for i in $(seq 0 $((${#FILE_KEYS[@]} - 1))); do
      local old_file="${FILE_KEYS[$i]}"
      local new_file="${FILE_VALUES[$i]}"
      if grep -q "$old_file" <<<"$new_content"; then
        new_content=$(sed "s|$old_file|$new_file|g" <<<"$new_content")
        file_modified=true
        log_info "Found reference to '$old_file' in $file, updating to '$new_file'"
      fi
    done
    
    # Update file if modified
    if [ "$file_modified" = true ]; then
      backup_file "$file"
      echo "$new_content" > "$file"
      ((modified_files++))
      log_success "Updated $file"
    fi
  done
  
  log_info "Path migration complete!"
  log_info "Scanned $scanned_files files"
  log_success "Modified $modified_files files"
  
  if [ $modified_files -eq 0 ]; then
    log_warning "No files were modified. Check if the mappings match the actual directory changes."
  fi
}

# Function to verify paths after update
verify_paths() {
  log_info "Verifying path updates..."
  
  local errors_found=0
  
  for i in $(seq 0 $((${#DIR_KEYS[@]} - 1))); do
    local old_path="${DIR_KEYS[$i]}"
    local find_cmd="grep -r \"$old_path\" --include=\"{$(echo ${FILE_PATTERNS[@]} | tr ' ' ',')}\" . 2>/dev/null | grep -v migrate-paths.sh"
    local references=$(eval $find_cmd)
    
    if [ -n "$references" ]; then
      log_error "Found references to old path '$old_path' in:"
      echo "$references"
      ((errors_found++))
    fi
  done
  
  if [ $errors_found -eq 0 ]; then
    log_success "All path updates verified. No references to old paths found."
  else
    log_error "Found $errors_found old path references still in the codebase. Please check the logs above."
  fi
}

# Main execution
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Directory Path Migration Tool${NC}"
echo -e "${BLUE}================================================${NC}"
echo 
echo -e "This script will update references to old directory paths"
echo -e "with the new directory structure across the codebase."
echo
echo
echo -e "The following path mappings will be applied (relative -> absolute):"
for i in $(seq 0 $((${#DIR_KEYS[@]} - 1))); do
  old_path="${DIR_KEYS[$i]}"
  new_path="${DIR_VALUES[$i]}"
  echo -e "  ${YELLOW}$old_path${NC} -> ${GREEN}$new_path${NC}"
done
echo

# Check for command-line argument or use auto-confirm
if [ "${1:-}" = "--no-confirm" ] || [ "${AUTO_CONFIRM:-}" = "true" ]; then
  confirm="y"
  log_info "Auto-confirming migration (non-interactive mode)"
else
  # Ask for confirmation
  read -p "Do you want to proceed with path migration? (y/n): " confirm
  if [ "$confirm" != "y" ]; then
    log_warning "Path migration aborted."
    exit 0
  fi
fi

# Run the migration
update_paths

# Verify after update
verify_paths

echo
log_success "Migration completed successfully!"
echo -e "Note: Backup files (.bak) were created and can be removed if everything works correctly."
