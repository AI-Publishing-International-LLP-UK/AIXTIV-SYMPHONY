#!/bin/bash

echo "Migrating visualization components..."
# Move visualization files from vls to academy
for file in $(find /Users/as/asoos/vls -name "*visual*" -o -name "*vision*" | grep -v "node_modules" | grep -v ".git"); do
  echo "Processing $file"
  target_dir="/Users/as/asoos/academy/frontend/visualization-center/$(basename $(dirname $file))"
  mkdir -p "$target_dir"
  cp -v "$file" "$target_dir/"
done

echo "Migrating gift shop components..."
# Move gift shop files to academy
for file in $(find /Users/as/asoos -name "*gift*" -o -name "*shop*" | grep -v "node_modules" | grep -v ".git"); do
  if [[ "$file" == *"giftshop"* || "$file" == *"gift-shop"* ]]; then
    echo "Processing $file"
    target_dir="/Users/as/asoos/academy/services/gift-shop/$(basename $(dirname $file))"
    mkdir -p "$target_dir"
    cp -v "$file" "$target_dir/"
  fi
done

echo "Visualization and gift shop migration completed."
