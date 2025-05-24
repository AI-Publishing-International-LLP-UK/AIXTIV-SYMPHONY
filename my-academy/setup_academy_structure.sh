#!/bin/bash

# Academy Structure Setup Script
# This script creates the directory structure for the Academy project
# Last updated: Mar 23, 2025

# Display header with information about the script
echo "=============================================================="
echo "           Academy Directory Structure Setup Script"
echo "=============================================================="
echo "This script will create the directory structure for the Academy"
echo "project according to the AIXTIV SYMPHONY master structure."
echo "=============================================================="
echo ""

# Set the base directory for the Academy project
BASE_DIR="/Users/as/asoos/academy"
echo "Setting up directory structure in: $BASE_DIR"
echo ""

# Create the main directory if it doesn't exist
if [ ! -d "$BASE_DIR" ]; then
  echo "Creating base directory: $BASE_DIR"
  mkdir -p "$BASE_DIR"
fi

# Create frontend section and its subdirectories
echo "Creating frontend directory structure..."
mkdir -p "$BASE_DIR/frontend/components"
mkdir -p "$BASE_DIR/frontend/pages"
mkdir -p "$BASE_DIR/frontend/daily-integration"
# Create pilots-lounge section and its subdirectories
mkdir -p "$BASE_DIR/frontend/pilots-lounge/dashboard"
mkdir -p "$BASE_DIR/frontend/pilots-lounge/profile-management"
mkdir -p "$BASE_DIR/frontend/pilots-lounge/mission-control"
# Create visualization-center section and its subdirectories
mkdir -p "$BASE_DIR/frontend/visualization-center/renderers"
mkdir -p "$BASE_DIR/frontend/visualization-center/interactive-displays"

# Create backend section and its subdirectories
echo "Creating backend directory structure..."
mkdir -p "$BASE_DIR/backend/session-management"
mkdir -p "$BASE_DIR/backend/daily-api"
mkdir -p "$BASE_DIR/backend/analytics"
mkdir -p "$BASE_DIR/backend/integration"
# Create admin section and its subdirectories
mkdir -p "$BASE_DIR/backend/admin/diamond-sao"
mkdir -p "$BASE_DIR/backend/admin/multi-tenant"
mkdir -p "$BASE_DIR/backend/admin/package-manager"
# Create security section and its subdirectories
mkdir -p "$BASE_DIR/backend/security/authentication"
mkdir -p "$BASE_DIR/backend/security/authorization"

# Create courses section and its subdirectories
echo "Creating courses directory structure..."
mkdir -p "$BASE_DIR/courses/curriculum"
mkdir -p "$BASE_DIR/courses/content"
mkdir -p "$BASE_DIR/courses/assessments"

# Create services section and its subdirectories
echo "Creating services directory structure..."
# Create gift-shop section and its subdirectories
mkdir -p "$BASE_DIR/services/gift-shop/products"
mkdir -p "$BASE_DIR/services/gift-shop/checkout"
mkdir -p "$BASE_DIR/services/gift-shop/inventory"
# Create dr-memoria section and its subdirectories
mkdir -p "$BASE_DIR/services/dr-memoria/publications"
mkdir -p "$BASE_DIR/services/dr-memoria/knowledge-management"

# Create docs section and its subdirectories
echo "Creating docs directory structure..."
mkdir -p "$BASE_DIR/docs/api"
mkdir -p "$BASE_DIR/docs/development"
mkdir -p "$BASE_DIR/docs/user-guides"

# Display confirmation message
echo ""
echo "=============================================================="
echo "Academy directory structure has been created successfully."
echo "=============================================================="

# Display directory tree summary using find command
echo ""
echo "Directory structure created:"
find "$BASE_DIR" -type d | sort | sed 's/[^/]*\//│   /g' | sed 's/│   /├── /'

# Set permissions if needed
echo ""
echo "Setting appropriate permissions..."
chmod -R 755 "$BASE_DIR"

echo ""
echo "Setup complete!"

