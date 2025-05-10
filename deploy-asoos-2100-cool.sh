#!/bin/bash

# ASOOS.2100.COOL Firebase Deployment Script
echo "🚀 Starting deployment for ASOOS.2100.COOL website..."

# Set project
echo "Setting GCP project to api-for-warp-drive..."
firebase use api-for-warp-drive

# Create or update target
echo "Setting up Firebase hosting target for ASOOS.2100.COOL..."
firebase target:apply hosting asoos-2100-cool asoos-2100-cool

# Ensure necessary directories exist
mkdir -p public/asoos-2100-cool/css public/asoos-2100-cool/js public/asoos-2100-cool/images

# Convert SVG favicon to PNG for better compatibility
echo "Converting SVG favicon to PNG (if ImageMagick is installed)..."
if command -v convert &> /dev/null; then
    convert -background none public/asoos-2100-cool/images/favicon.svg public/asoos-2100-cool/images/favicon.png
    convert -background none public/asoos-2100-cool/images/favicon.svg -resize 32x32 public/asoos-2100-cool/images/favicon-32x32.png
    convert -background none public/asoos-2100-cool/images/favicon.svg -resize 16x16 public/asoos-2100-cool/images/favicon-16x16.png
    convert -background none public/asoos-2100-cool/images/favicon.svg -resize 180x180 public/asoos-2100-cool/images/apple-touch-icon.png
    echo "Favicon conversion complete."
else
    echo "ImageMagick not installed. Skipping favicon conversion."
fi

# Link JavaScript file
sed -i '' 's/<\/body>/<script src="js\/main.js"><\/script>\n<\/body>/' public/asoos-2100-cool/index.html 2>/dev/null || true

# Deploy to Firebase using the specific configuration
echo "Deploying to Firebase..."
firebase deploy --only hosting:asoos-2100-cool --config 2100-cool-firebase.json

echo "✅ Deployment complete!"
echo "Your site is now available at: https://asoos.2100.cool"
echo "Note: DNS propagation may take up to 24 hours to complete if this is the first deployment."
echo ""
echo "To verify the deployment, run: firebase hosting:channel:open asoos-2100-cool"