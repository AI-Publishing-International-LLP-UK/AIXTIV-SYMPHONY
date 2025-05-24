#!/bin/bash

echo "Creating backup directory..."
BACKUP_DIR="/Users/as/asoos/academy/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Migrating pilots lounge components..."
# Move pilot files from opus to academy
for file in $(find /Users/as/asoos/opus -name "*pilot*" -o -name "*lounge*" | grep -v "node_modules" | grep -v ".git"); do
  echo "Processing $file"
  # Create target directory structure
  target_dir="/Users/as/asoos/academy/frontend/pilots-lounge/$(basename $(dirname $file))"
  mkdir -p "$target_dir"
  # Copy file to maintain original as backup
  cp -v "$file" "$target_dir/"
done

echo "Pilots lounge migration completed."
