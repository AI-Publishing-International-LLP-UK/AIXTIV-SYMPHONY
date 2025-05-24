#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}      Dr. Claude Orchestrator - Fix Missing Icons         ${NC}"
echo -e "${BLUE}========================================================${NC}"

# Step 1: Create missing avatar images
echo -e "${YELLOW}Step 1: Creating missing avatar images...${NC}"
mkdir -p public/asoos-2100-cool/images
cd public/asoos-2100-cool/images

# Create proper blue hexagon avatars using SVG format saved as PNG
echo "Creating dr-memoria-avatar.png - deep blue (#00008B) hexagon"
cat > dr-memoria-avatar.svg << EOF
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000080;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00008B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <polygon points="32,4 60,20 60,44 32,60 4,44 4,20" fill="url(#grad1)" stroke="#000066" stroke-width="1" />
  <text x="32" y="38" font-family="Arial" font-size="10" text-anchor="middle" fill="white" font-weight="bold">DM</text>
</svg>
EOF

echo "Creating dr-match-avatar.png - teal blue (#008B8B) hexagon"
cat > dr-match-avatar.svg << EOF
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#008080;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#008B8B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <polygon points="32,4 60,20 60,44 32,60 4,44 4,20" fill="url(#grad2)" stroke="#006666" stroke-width="1" />
  <text x="32" y="38" font-family="Arial" font-size="10" text-anchor="middle" fill="white" font-weight="bold">DM</text>
</svg>
EOF

echo "Creating co-pilot-avatar.png - royal blue (#4169E1) hexagon"
cat > co-pilot-avatar.svg << EOF
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3050D0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4169E1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <polygon points="32,4 60,20 60,44 32,60 4,44 4,20" fill="url(#grad3)" stroke="#304080" stroke-width="1" />
  <text x="32" y="38" font-family="Arial" font-size="10" text-anchor="middle" fill="white" font-weight="bold">CP</text>
</svg>
EOF

# Convert SVG to PNG if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Converting SVGs to PNGs using ImageMagick..."
    convert -background none dr-memoria-avatar.svg dr-memoria-avatar.png
    convert -background none dr-match-avatar.svg dr-match-avatar.png
    convert -background none co-pilot-avatar.svg co-pilot-avatar.png
    rm *.svg
else
    echo "ImageMagick not installed. Creating direct PNGs..."
    # If ImageMagick isn't available, use base64 encoded PNGs
    
    # Deep blue hexagon for Dr. Memoria
    echo "Creating fallback dr-memoria-avatar.png"
    curl -s "https://via.placeholder.com/64/00008B/ffffff?text=DM" > dr-memoria-avatar.png
    
    # Teal blue hexagon for Dr. Match
    echo "Creating fallback dr-match-avatar.png"
    curl -s "https://via.placeholder.com/64/008B8B/ffffff?text=DM" > dr-match-avatar.png
    
    # Royal blue hexagon for Co-Pilot
    echo "Creating fallback co-pilot-avatar.png"
    curl -s "https://via.placeholder.com/64/4169E1/ffffff?text=CP" > co-pilot-avatar.png
fi

# Step 2: Add interface.css link if missing
echo -e "${YELLOW}Step 2: Ensuring CSS link for interface.css is present...${NC}"
cd /Users/as/asoos
grep -q "interface.css" public/asoos-2100-cool/index.html || sed -i '' '/<link rel="stylesheet" href="css\/navigation.css">/a\
    <link rel="stylesheet" href="css/interface.css">' public/asoos-2100-cool/index.html

# Step 3: Deploy the updated content
echo -e "${YELLOW}Step 3: Deploying updated content...${NC}"
firebase deploy --only hosting:asoos

# Step 4: Trigger the CI/CD CTTT pipeline
echo -e "${YELLOW}Step 4: Triggering CI/CD CTTT pipeline...${NC}"
if [ -f "/Users/as/asoos/deploy-package/trigger-cicd-cttt.sh" ]; then
    echo "Running CI/CD CTTT pipeline trigger..."
    bash /Users/as/asoos/deploy-package/trigger-cicd-cttt.sh
else
    echo "CI/CD CTTT trigger script not found. Skipping pipeline trigger."
fi

echo -e "${GREEN}==========================================================${NC}"
echo -e "${GREEN}      Icon fixes deployed                                 ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo "The site should now display correctly at https://asoos.2100.cool"
echo "Missing icons have been replaced with blue hexagon avatars"
echo ""
echo "Deployed components:"
echo "- Main ASOOS interface: https://asoos.2100.cool"
echo "- Symphony interface: https://symphony.asoos.2100.cool"
echo "- Anthology interface: https://anthology.asoos.2100.cool"
echo ""
echo "If issues persist, inspect the browser console for JavaScript errors"
