#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# AIXTIV SYMPHONY Repository Cleanup Script
# Runs weekly to maintain repository health
# Created: 2025-03-27
# Updated: For GitHub Actions compatibility

# Use repository-local directories instead of home directory
LOG_DIR="./logs"
ARCHIVE_DIR="./large_files_archive"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $LOG_DIR
mkdir -p $ARCHIVE_DIR

# Create log file with timestamp for better tracking in CI
LOG_FILE="$LOG_DIR/weekly_cleanup_${TIMESTAMP}.log"
echo "==== AIXTIV SYMPHONY Weekly Cleanup ====" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "Running in directory: $(pwd)" | tee -a "$LOG_FILE"

# Repository root is the current directory in GitHub Actions
# Clean up large binary files
echo "Scanning for large binary files..." | tee -a "$LOG_FILE"
find . -type f -not -path "*/\.*" -size +10M -name "*.dmg" -o -name "*.zip" -o -name "*.dylib" | while read file; do
    file_size=$(du -h "$file" | cut -f1)
    echo "Found large file: $file ($file_size)" | tee -a "$LOG_FILE"
    # Archive instead of deleting
    mv "$file" "$ARCHIVE_DIR/" || echo "Failed to archive $file" | tee -a "$LOG_FILE"
done

# Clean temporary files
echo "Cleaning temporary files..." | tee -a "$LOG_FILE"
find . -type f -name "*.tmp" -o -name "*.bak" -delete

# Optimize git repository
echo "Optimizing git repository..." | tee -a "$LOG_FILE"
git gc --aggressive | tee -a "$LOG_FILE"

# Verify repository integrity
echo "Verifying repository integrity..." | tee -a "$LOG_FILE"
git fsck --full | tee -a "$LOG_FILE" 2>&1

echo "Completed: $(date)" | tee -a "$LOG_FILE"
echo "====================================" | tee -a "$LOG_FILE"

# For GitHub Actions, output summary to console
echo "Cleanup completed successfully. Log saved to $LOG_FILE"

# Create a summary of actions taken
echo "Summary of actions:" | tee -a "$LOG_FILE"
echo "- Temporary files cleaned" | tee -a "$LOG_FILE"
echo "- Git repository optimized" | tee -a "$LOG_FILE"
echo "- Repository integrity verified" | tee -a "$LOG_FILE"
if [ -d "$ARCHIVE_DIR" ] && [ "$(ls -A "$ARCHIVE_DIR")" ]; then
    echo "- Large files moved to $ARCHIVE_DIR" | tee -a "$LOG_FILE"
fi

exit 0
