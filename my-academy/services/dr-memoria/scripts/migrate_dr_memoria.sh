#!/bin/bash

echo "Migrating Dr. Memoria and Anthology components..."
# Move Dr. Memoria files to academy
for file in $(find /Users/as/asoos -name "*memoria*" -o -name "*anthology*" | grep -v "node_modules" | grep -v ".git"); do
  echo "Processing $file"
  target_dir="/Users/as/asoos/academy/services/dr-memoria/$(basename $(dirname $file))"
  mkdir -p "$target_dir"
  cp -v "$file" "$target_dir/"
done

echo "Dr. Memoria migration completed."
