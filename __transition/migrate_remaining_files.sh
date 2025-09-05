#!/bin/bash

# Script to move remaining files from deprecated directory to transition directory
# Created: May 28, 2025

# Define source and destination paths
SOURCE_DIR="/Users/as/asoos/aixtiv-symphony-opus1.0.1"
DEST_DIR="/Users/as/asoos/opus/opus1.0.1/__transition"
LOG_FILE="$DEST_DIR/migration_log_$(date +%Y%m%d_%H%M%S).txt"

# Create log file with header
echo "Migration Log - $(date)" > "$LOG_FILE"
echo "Moving files from $SOURCE_DIR to $DEST_DIR" >> "$LOG_FILE"
echo "--------------------------------------------" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Create aixtiv-symphony-opus1.0.1 directory structure in the transition folder
mkdir -p "$DEST_DIR/aixtiv-symphony-opus1.0.1"

# Function to log moved files
log_move() {
  echo "Moved: $1" >> "$LOG_FILE"
}

# Move all files except node_modules, logging each move
cd "$SOURCE_DIR" || { echo "Error: Could not change to source directory"; exit 1; }

echo "Scanning files to move (excluding node_modules)..." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# First list all files/directories that will be moved
find . -type f -o -type d | grep -v "node_modules" | sort >> "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "Beginning file transfer..." >> "$LOG_FILE"

# Create a list of all files/directories to move (excluding node_modules)
find . -not -path "*/node_modules/*" -not -path "./node_modules" -not -path "." | while read -r item; do
  # Create target directory if it's a file's parent directory
  if [ -f "$item" ]; then
    target_dir="$(dirname "$DEST_DIR/aixtiv-symphony-opus1.0.1/$item")"
    mkdir -p "$target_dir"
    mv "$item" "$target_dir/" && log_move "$item"
  elif [ -d "$item" ] && [ "$item" != "./node_modules" ] && [[ "$item" != *"/node_modules"* ]]; then
    # Create directory in destination
    mkdir -p "$DEST_DIR/aixtiv-symphony-opus1.0.1/$item"
    echo "Created directory: $item" >> "$LOG_FILE"
  fi
done

# Handle remaining files in the root directory
for file in .[!.]* *; do
  if [ "$file" != "." ] && [ "$file" != ".." ] && [ "$file" != "node_modules" ]; then
    # Skip if already moved by the find loop
    if [ -e "$file" ]; then
      mv "$file" "$DEST_DIR/aixtiv-symphony-opus1.0.1/" && log_move "$file"
    fi
  fi
done

# Add summary to log
echo "" >> "$LOG_FILE"
echo "Migration completed at $(date)" >> "$LOG_FILE"
echo "Please review files in $DEST_DIR/aixtiv-symphony-opus1.0.1 and integrate or discard as needed" >> "$LOG_FILE"

# Display completion message
echo "Migration completed. See log file at $LOG_FILE for details."

