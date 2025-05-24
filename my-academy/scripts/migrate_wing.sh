#!/bin/bash

echo "Migrating wing components..."
# Move wing files from wing/academy to academy
for file in $(find /Users/as/asoos/wing/academy -type f | grep -v "node_modules" | grep -v ".git"); do
  echo "Processing $file"
  # Determine target directory based on file path
  if [[ "$file" == *"/integration/gateway/"* ]]; then
    target_dir="/Users/as/asoos/academy/backend/integration"
  elif [[ "$file" == *"/docs/"* ]]; then
    target_dir="/Users/as/asoos/academy/docs/development"
  else
    # Default target directory
    target_dir="/Users/as/asoos/academy/backend/integration"
  fi
  mkdir -p "$target_dir"
  cp -v "$file" "$target_dir/"
done

echo "Wing components migration completed."
