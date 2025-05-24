#\!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}      Dr. Claude Orchestrator - Fix White Screen          ${NC}"
echo -e "${BLUE}========================================================${NC}"

# Step 1: Create a simple HTML file to verify base functionality
echo -e "${YELLOW}Step 1: Creating simple HTML test file...${NC}"
mkdir -p public/asoos-2100-cool-test
cat > public/asoos-2100-cool-test/index.html << 'HTML_END'
<\!DOCTYPE html>
<html>
<head>
  <title>ASOOS 2100</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #0B1BBB;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>ASOOS 2100</h1>
    <p>This is a simple test page to verify Firebase hosting is working correctly.</p>
    <p>Current time: <span id="time"></span></p>
  </div>
  <script>
    document.getElementById('time').textContent = new Date().toLocaleString();
  </script>
</body>
</html>
HTML_END

# Step 2: Deploy the simple test file to a channel for testing
echo -e "${YELLOW}Step 2: Deploying simple test page to a preview channel...${NC}"
firebase target:apply hosting simple-test 2100-cool
firebase hosting:channel:deploy simple-test-page  --expires 1h

# Step 3: Fix the main site deployment
echo -e "${YELLOW}Step 3: Fixing main site deployment...${NC}"
firebase target:apply hosting asoos 2100-cool
firebase deploy --only hosting:asoos

echo -e "${GREEN}==========================================================${NC}"
echo -e "${GREEN}      Fix deployment completed                             ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo "Check the simple test page first to ensure hosting is working"
echo "Then verify the main site at https://asoos.2100.cool"
echo ""
echo "If the main site is still showing a white screen:"
echo "1. The issue may be with the complex JavaScript/CSS"
echo "2. Try replacing the content with the simpler version"
echo "3. Run: cp -R public/asoos-2100-cool-test/* public/asoos-2100-cool/"
echo "4. Then redeploy: firebase deploy --only hosting:asoos"
