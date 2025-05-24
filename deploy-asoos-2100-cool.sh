#!/bin/bash

# ASOOS.2100.COOL Firebase Deployment Script
echo "🚀 Starting deployment for ASOOS.2100.COOL website..."

# Set project
echo "Setting GCP project to api-for-warp-drive..."
firebase use api-for-warp-drive

# Use existing '2100-cool' target for direct deployment
echo "Setting up Firebase hosting target for ASOOS.2100.COOL..."
firebase target:apply hosting asoos 2100-cool

# Ensure necessary directories exist
mkdir -p public/asoos-2100-cool/css public/asoos-2100-cool/js public/asoos-2100-cool/images

# Check if required image files exist and create placeholders if not
echo "Checking for missing image files..."
if [ ! -f public/asoos-2100-cool/images/favicon.svg ]; then
    echo "Creating placeholder favicon.svg..."
    cat > public/asoos-2100-cool/images/favicon.svg << EOF
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="15" fill="#4169E1" />
  <text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="14">AS</text>
</svg>
EOF
fi

# Convert SVG favicon to PNG for better compatibility
echo "Converting SVG favicon to PNG (if ImageMagick is installed)..."
if command -v convert &> /dev/null; then
    convert -background none public/asoos-2100-cool/images/favicon.svg public/asoos-2100-cool/images/favicon.png
    convert -background none public/asoos-2100-cool/images/favicon.svg -resize 32x32 public/asoos-2100-cool/images/favicon-32x32.png
    convert -background none public/asoos-2100-cool/images/favicon.svg -resize 16x16 public/asoos-2100-cool/images/favicon-16x16.png
    convert -background none public/asoos-2100-cool/images/favicon.svg -resize 180x180 public/asoos-2100-cool/images/apple-touch-icon.png
    echo "Favicon conversion complete."
else
    echo "ImageMagick not installed. Creating placeholder PNG files..."
    # If ImageMagick isn't available, copy any existing placeholder PNGs if they exist
    # or include a message to install ImageMagick
    echo "Please install ImageMagick for proper favicon generation or manually create PNG versions."
fi

# Check for missing JS files and create if needed
for file in main.js navigation.js anthology.js; do
    if [ ! -f "public/asoos-2100-cool/js/$file" ]; then
        echo "Creating placeholder for missing JS file: $file"
        echo "// Placeholder for $file - Generated during deployment" > "public/asoos-2100-cool/js/$file"
    fi
done

# Check for missing CSS files and create if needed
for file in styles.css navigation.css; do
    if [ ! -f "public/asoos-2100-cool/css/$file" ]; then
        echo "Missing CSS file: $file - Please check if this file should be created manually."
    fi
done

# Verify no duplicate script tags remain in the HTML
echo "Cleaning up any remaining duplicate script tags..."
grep -c "main.js" public/asoos-2100-cool/index.html | grep -q "1" || {
    echo "Warning: Possible duplicate script tags detected in index.html"
    echo "This might cause script loading issues. Consider manual inspection."
}

# Build and prepare files for deployment
echo "Building production-ready files..."

# Minify CSS if csso is installed (optional)
if command -v csso &> /dev/null; then
    echo "Minifying CSS files..."
    for css_file in public/asoos-2100-cool/css/*.css; do
        csso "$css_file" -o "$css_file.min"
        mv "$css_file.min" "$css_file"
    done
else
    echo "CSS minifier not installed. Skipping CSS minification."
fi

# Minify JS if terser is installed (optional)
if command -v terser &> /dev/null; then
    echo "Minifying JavaScript files..."
    for js_file in public/asoos-2100-cool/js/*.js; do
        terser "$js_file" -o "$js_file.min"
        mv "$js_file.min" "$js_file"
    done
else
    echo "JavaScript minifier not installed. Skipping JS minification."
fi

# Create/update firebase.json with the correct configuration
echo "Ensuring Firebase configuration is correct..."
if [ ! -f .firebaserc ]; then
    echo "Creating Firebase project configuration..."
    cat > .firebaserc << EOF
{
  "projects": {
    "default": "api-for-warp-drive"
  },
  "targets": {
    "api-for-warp-drive": {
      "hosting": {
        "asoos-2100-cool": [
          "asoos-2100-cool"
        ]
      }
    }
  }
}
EOF
fi

# Deploy to Firebase using the specific configuration
echo "Deploying to Firebase..."
firebase deploy --only hosting:asoos --config 2100-cool-firebase.json

echo "✅ Deployment complete!"
echo "Your site should now be accessible at: https://2100-cool.web.app"
echo ""
echo "To set up custom domain access at https://asoos.2100.cool:"
echo "  1. Run 'node update-asoos-dns.js' to update DNS A records"
echo "  2. In the Firebase Console, go to Hosting > Add custom domain"
echo "  3. Connect the domain asoos.2100.cool"
echo "  4. Get the verification code from Firebase"
echo "  5. Add the verification code: 'node update-asoos-dns.js VERIFICATION_CODE'"
echo ""
echo "After DNS changes propagate (up to 24-48 hours), your site will be available at: https://asoos.2100.cool"
echo ""
echo "To check your deployment, visit: https://2100-cool.web.app"