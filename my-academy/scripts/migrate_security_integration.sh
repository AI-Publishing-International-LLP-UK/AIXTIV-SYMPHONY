#!/bin/bash

echo "Migrating security components..."
# Move security files to academy
for file in $(find /Users/as/asoos/integration-gateway -name "*security*" -o -name "*auth*" | grep -v "node_modules" | grep -v ".git"); do
  if [ -f "$file" ]; then
    echo "Processing $file"
    if [[ "$file" == *"auth"* ]]; then
      target_dir="/Users/as/asoos/academy/backend/security/authentication"
    else
      target_dir="/Users/as/asoos/academy/backend/security/authorization"
    fi
    mkdir -p "$target_dir"
    cp -v "$file" "$target_dir/"
  fi
done

echo "Migrating SallyPort components..."
# Move SallyPort files to academy
for file in $(find /Users/as/asoos -name "*sally*" -o -name "*port*" | grep -v "node_modules" | grep -v ".git"); do
  if [ -f "$file" ]; then
    echo "Processing $file"
    target_dir="/Users/as/asoos/academy/backend/security/authentication"
    mkdir -p "$target_dir"
    cp -v "$file" "$target_dir/"
  fi
done

echo "Security and integration migration completed."
