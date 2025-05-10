#!/bin/bash

# 2100.cool Firebase Deployment Script
echo "🚀 Starting deployment for 2100.cool website..."

# Set project
echo "Setting GCP project to api-for-warp-drive..."
firebase use api-for-warp-drive

# Create or update target
echo "Setting up Firebase hosting target for 2100.cool..."
firebase target:apply hosting 2100-cool 2100-cool

# Ensure necessary directories exist
mkdir -p public/2100-cool/css public/2100-cool/js public/2100-cool/images

# Convert SVG favicon to PNG for better compatibility
echo "Converting SVG favicon to PNG (if ImageMagick is installed)..."
if command -v convert &> /dev/null; then
    convert -background none public/2100-cool/images/favicon.svg public/2100-cool/images/favicon.png
    convert -background none public/2100-cool/images/favicon.svg -resize 32x32 public/2100-cool/images/favicon-32x32.png
    convert -background none public/2100-cool/images/favicon.svg -resize 16x16 public/2100-cool/images/favicon-16x16.png
    convert -background none public/2100-cool/images/favicon.svg -resize 180x180 public/2100-cool/images/apple-touch-icon.png
    echo "Favicon conversion complete."
else
    echo "ImageMagick not installed. Skipping favicon conversion."
fi

# Update HTML to include both SVG and PNG favicons
sed -i '' 's/<link rel="icon" type="image\/png" href="images\/favicon.png">/<link rel="icon" type="image\/svg+xml" href="images\/favicon.svg">\n    <link rel="icon" type="image\/png" href="images\/favicon.png">\n    <link rel="icon" type="image\/png" sizes="32x32" href="images\/favicon-32x32.png">\n    <link rel="icon" type="image\/png" sizes="16x16" href="images\/favicon-16x16.png">\n    <link rel="apple-touch-icon" sizes="180x180" href="images\/apple-touch-icon.png">/' public/2100-cool/index.html

# Link JavaScript file
sed -i '' 's/<\/body>/<script src="js\/main.js"><\/script>\n<\/body>/' public/2100-cool/index.html

# Deploy to Firebase using the specific configuration
echo "Deploying to Firebase..."
firebase deploy --only hosting:2100-cool --config 2100-cool-firebase.json

echo "✅ Deployment complete!"
echo "Your site is now available at: https://2100.cool"
echo "Note: DNS propagation may take up to 24 hours to complete if this is the first deployment."
echo ""
echo "To verify the deployment, run: firebase hosting:channel:open 2100-cool"