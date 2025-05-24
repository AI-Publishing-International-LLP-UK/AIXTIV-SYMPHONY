#!/bin/bash

# Script to copy files from Downloads to aixtiv-assets, excluding SQL files
# and choosing the latest version when multiple versions exist

SOURCE_DIR="/Users/as/Downloads"
DEST_DIR="./aixtiv-assets"
LOG_FILE="copy_latest_files.log"

# Initialize log file
echo "$(date): Starting file copy process" > "$LOG_FILE"
echo "Source directory: $SOURCE_DIR" >> "$LOG_FILE"
echo "Destination directory: $DEST_DIR" >> "$LOG_FILE"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"
echo "$(date): Created destination directory $DEST_DIR" >> "$LOG_FILE"

# Temporary file for storing selected files
SELECTED_FILES=$(mktemp)

# Get all files recursively from source directory
find "$SOURCE_DIR" -type f | while read file; do
    # Skip SQL files
    if [[ "$file" == *.sql ]]; then
        echo "$(date): Skipping SQL file: $file" >> "$LOG_FILE"
        continue
    fi
    
    # Skip node_modules directory
    if [[ "$file" == *node_modules* ]]; then
        echo "$(date): Skipping node_modules file: $file" >> "$LOG_FILE"
        continue
    fi
    
    # Get just the filename without the path
    filename=$(basename "$file")
    # Get the directory part (without SOURCE_DIR prefix)
    rel_dir=$(dirname "${file#$SOURCE_DIR/}")
    
    echo "$file" >> "$SELECTED_FILES"
done

echo "$(date): Completed initial file list" >> "$LOG_FILE"

# Process the selected files
cat "$SELECTED_FILES" | sort | while read file; do
    # Get just the filename without the path
    filename=$(basename "$file")
    # Get base name without extension
    base_name="${filename%.*}"
    # Get extension
    extension="${filename##*.}"
    # Get the directory part (without SOURCE_DIR prefix)
    rel_dir=$(dirname "${file#$SOURCE_DIR/}")
    
    # Check if this is a duplicate file that should be skipped
    skip=false
    
    # Check for -fixed version
    fixed_version="$SOURCE_DIR/${rel_dir}/${base_name}-fixed.${extension}"
    if [[ "$file" != *-fixed* ]] && [[ -f "$fixed_version" ]]; then
        echo "$(date): Skipping $file in favor of -fixed version" >> "$LOG_FILE"
        skip=true
    fi
    
    # Check for numbered versions (assuming format like 01-file.ext, 02-file.ext)
    if [[ "$base_name" =~ ^[0-9]+ ]]; then
        prefix_num="${base_name%%[!0-9]*}"
        name_part="${base_name#"$prefix_num"}"
        
        # Look for higher numbered versions
        find "$SOURCE_DIR/${rel_dir}" -type f -name "[0-9]*${name_part}.${extension}" | while read numbered_file; do
            numbered_filename=$(basename "$numbered_file")
            numbered_base="${numbered_filename%.*}"
            numbered_prefix="${numbered_base%%[!0-9]*}"
            
            # If current file has lower number, skip it
            if [[ "$numbered_prefix" -gt "$prefix_num" ]] && [[ "$file" != "$numbered_file" ]]; then
                echo "$(date): Skipping $file in favor of higher numbered version $numbered_file" >> "$LOG_FILE"
                skip=true
                break
            fi
        done
    fi
    
    # Check for .mjs vs .js
    if [[ "$extension" == "js" ]]; then
        mjs_version="${file%.js}.mjs"
        if [[ -f "$mjs_version" ]]; then
            echo "$(date): Skipping $file in favor of .mjs version" >> "$LOG_FILE"
            skip=true
        fi
    fi
    
    # Check for -2 suffix versions
    if [[ "$base_name" != *-2 ]]; then
        v2_version="$SOURCE_DIR/${rel_dir}/${base_name}-2.${extension}"
        if [[ -f "$v2_version" ]]; then
            echo "$(date): Skipping $file in favor of -2 version" >> "$LOG_FILE"
            skip=true
        fi
    fi
    
    # If not skipped, copy the file
    if [[ "$skip" == false ]]; then
        # Create subdirectory structure in destination
        target_dir="$DEST_DIR/${rel_dir}"
        mkdir -p "$target_dir"
        
        # Copy the file
        cp "$file" "$target_dir/"
        echo "$(date): Copied $file to $target_dir/" >> "$LOG_FILE"
    fi
done

# Clean up temporary file
rm "$SELECTED_FILES"

echo "$(date): File copy process completed" >> "$LOG_FILE"
echo "Check $LOG_FILE for details on the copy process."

