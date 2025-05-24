#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     DEPLOYING DR. MEMORIA'S ANTHOLOGY TO FIREBASE        ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Create placeholder images
echo -e "${YELLOW}Creating placeholder images for deployment...${NC}"
IMAGES_DIR="./public/images"
mkdir -p "$IMAGES_DIR"

# Create a simple Dr. Memoria logo
echo -e "${YELLOW}Creating logo image...${NC}"
cat > "$IMAGES_DIR/dr-memoria-logo.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <rect width="200" height="60" fill="#1a2a52" rx="5" ry="5"/>
  <text x="100" y="40" font-family="Arial" font-size="22" fill="white" text-anchor="middle">Dr. Memoria's Anthology</text>
</svg>
EOF

cat > "$IMAGES_DIR/dr-memoria-logo-small.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
  <rect width="120" height="40" fill="#1a2a52" rx="5" ry="5"/>
  <text x="60" y="25" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Dr. Memoria</text>
</svg>
EOF

cat > "$IMAGES_DIR/dr-memoria-logo.png" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <rect width="200" height="60" fill="#1a2a52" rx="5" ry="5"/>
  <text x="100" y="40" font-family="Arial" font-size="22" fill="white" text-anchor="middle">Dr. Memoria's Anthology</text>
</svg>
EOF

cat > "$IMAGES_DIR/favicon.png" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1a2a52" rx="3" ry="3"/>
  <text x="16" y="22" font-family="Arial" font-size="20" fill="white" text-anchor="middle">M</text>
</svg>
EOF

# Create placeholder images for the product grid
for img in anthology-book memory-crystal creative-passport anthology-subscription; do
  cat > "$IMAGES_DIR/${img}.jpg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" fill="#5d65e0" rx="5" ry="5"/>
  <text x="150" y="100" font-family="Arial" font-size="20" fill="white" text-anchor="middle">${img}</text>
</svg>
EOF
done

# Create placeholder background images
cat > "$IMAGES_DIR/stars.png" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="#050a1f"/>
  <!-- Stars -->
  <circle cx="50" cy="50" r="1" fill="white" opacity="0.8"/>
  <circle cx="150" cy="80" r="1" fill="white" opacity="0.6"/>
  <circle cx="250" cy="150" r="1" fill="white" opacity="0.7"/>
  <circle cx="350" cy="90" r="1" fill="white" opacity="0.8"/>
  <circle cx="450" cy="190" r="1" fill="white" opacity="0.9"/>
</svg>
EOF

cat > "$IMAGES_DIR/twinkling.png" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="transparent"/>
  <!-- Twinkling stars -->
  <circle cx="80" cy="120" r="1.2" fill="white" opacity="0.5"/>
  <circle cx="180" cy="220" r="1.2" fill="white" opacity="0.4"/>
  <circle cx="280" cy="120" r="1.2" fill="white" opacity="0.6"/>
  <circle cx="380" cy="320" r="1.2" fill="white" opacity="0.5"/>
  <circle cx="480" cy="420" r="1.2" fill="white" opacity="0.4"/>
</svg>
EOF

cat > "$IMAGES_DIR/clouds.png" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="transparent"/>
  <!-- Nebula clouds -->
  <ellipse cx="100" cy="100" rx="50" ry="30" fill="#5d65e0" opacity="0.05"/>
  <ellipse cx="250" cy="300" rx="80" ry="40" fill="#9b59b6" opacity="0.05"/>
  <ellipse cx="400" cy="200" rx="60" ry="50" fill="#3498db" opacity="0.05"/>
</svg>
EOF

cat > "$IMAGES_DIR/anthology-visualization.jpg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#1a2a52" rx="5" ry="5"/>
  <text x="200" y="150" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Anthology Visualization</text>
</svg>
EOF

# Create a package.json file at the root
echo -e "${YELLOW}Creating package.json file...${NC}"
cat > "./package.json" << EOF
{
  "name": "dr-memoria-anthology",
  "version": "1.0.0",
  "description": "Dr. Memoria's Anthology - Website and API",
  "scripts": {
    "deploy": "firebase deploy",
    "serve": "firebase serve"
  },
  "dependencies": {
    "firebase-tools": "^11.0.0"
  },
  "private": true
}
EOF

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install --prefix functions

# Step 2: Deploy to Firebase
echo -e "${YELLOW}Step 2: Deploying to Firebase...${NC}"
firebase deploy --only hosting:anthology --project api-for-warp-drive

# Step 3: Output results
echo -e "${GREEN}✅ Dr. Memoria's Anthology has been deployed!${NC}"
echo -e "${YELLOW}Your site is now available at:${NC}"
echo -e "  - https://drmemoria-live.web.app"
echo -e "  - https://drmemoria-live.firebaseapp.com"

echo -e "${BLUE}=========================================================${NC}"