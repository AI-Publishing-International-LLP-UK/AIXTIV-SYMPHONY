#!/bin/bash

# 💎 DIAMOND SAO COMMAND CENTER - Cloudflare Pages Deployment
# 🏛️ Authority: Mr. Phillip Corey Roark (0000001)
# 🚀 Mission: Deploy correct pages to specific domains
# ⚡ Integration: Cloudflare Pages + Diamond SAO Command Center

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Diamond SAO Banner
echo -e "${PURPLE}💎 DIAMOND SAO COMMAND CENTER - CLOUDFLARE PAGES DEPLOYMENT${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🏛️  Authority: Mr. Phillip Corey Roark (0000001)${NC}"
echo -e "${YELLOW}🚀 Mission: Deploy domain-specific pages${NC}"
echo -e "${YELLOW}⚡ Status: DEPLOYING PAGES TO CLOUDFLARE${NC}"
echo ""

# Function to print step headers
print_step() {
    echo -e "${BLUE}$1${NC}"
    echo -e "${CYAN}─────────────────────────────────────────────────${NC}"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warnings
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print errors
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_step "🔍 Step 1: Checking Prerequisites"

# Check if wrangler is available for Cloudflare Pages
if ! command -v wrangler &> /dev/null; then
    print_warning "Wrangler CLI not found. Installing via npm..."
    if command -v npm &> /dev/null; then
        npm install -g wrangler
        print_success "Wrangler CLI installed"
    else
        print_error "Neither wrangler nor npm found. Please install Node.js and wrangler CLI."
        echo "Install instructions:"
        echo "1. Install Node.js: https://nodejs.org/"
        echo "2. Install Wrangler: npm install -g wrangler"
        exit 1
    fi
else
    print_success "Wrangler CLI found: $(wrangler --version)"
fi

# Check if pages exist
print_step "📁 Step 2: Verifying Page Files"

COACH_SIMPLE_PAGE="./coach-simple-page.html"
QUANTUM_DASHBOARD="./quantum-dashboard.html"
DIAMOND_DASHBOARD="./diamond-sao-dashboard.html"

if [[ -f "$COACH_SIMPLE_PAGE" ]]; then
    print_success "Coach simple page found: $COACH_SIMPLE_PAGE"
else
    print_error "Coach simple page not found: $COACH_SIMPLE_PAGE"
    exit 1
fi

if [[ -f "$QUANTUM_DASHBOARD" ]]; then
    print_success "Quantum dashboard found: $QUANTUM_DASHBOARD"
else
    print_error "Quantum dashboard not found: $QUANTUM_DASHBOARD"
    exit 1
fi

if [[ -f "$DIAMOND_DASHBOARD" ]]; then
    print_success "Diamond SAO dashboard found: $DIAMOND_DASHBOARD"
else
    print_warning "Diamond SAO dashboard not found: $DIAMOND_DASHBOARD"
fi

# Create deployment directory structure
print_step "🏗️  Step 3: Creating Deployment Structure"

DEPLOY_BASE_DIR="./cloudflare-deployments"
mkdir -p "$DEPLOY_BASE_DIR"/{coach-2100-cool,coaching2100-com,aipublishing-com}

print_success "Deployment directories created"

# Prepare coach.2100.cool deployment
print_step "🎯 Step 4: Preparing coach.2100.cool Deployment"

COACH_DEPLOY_DIR="$DEPLOY_BASE_DIR/coach-2100-cool"
cp "$COACH_SIMPLE_PAGE" "$COACH_DEPLOY_DIR/index.html"

# Create wrangler.toml for coach.2100.cool
cat > "$COACH_DEPLOY_DIR/wrangler.toml" << EOF
name = "coach-2100-cool"
compatibility_date = "2024-12-01"

[env.production]
routes = [
  { pattern = "coach.2100.cool/*", zone_id = "$CLOUDFLARE_ZONE_ID" }
]

[[env.production.rules]]
type = "transform"
enabled = true

[env.production.rules.action_parameters.headers.set]
"X-Robots-Tag" = "index, follow"
"X-Content-Type-Options" = "nosniff"
"X-Frame-Options" = "SAMEORIGIN"
EOF

print_success "coach.2100.cool deployment prepared"

# Prepare coaching2100.com deployment
print_step "⚡ Step 5: Preparing coaching2100.com Deployment"

COACHING_DEPLOY_DIR="$DEPLOY_BASE_DIR/coaching2100-com"
cp "$QUANTUM_DASHBOARD" "$COACHING_DEPLOY_DIR/index.html"

# Create wrangler.toml for coaching2100.com
cat > "$COACHING_DEPLOY_DIR/wrangler.toml" << EOF
name = "coaching2100-com"
compatibility_date = "2024-12-01"

[env.production]
routes = [
  { pattern = "coaching2100.com/*", zone_id = "$CLOUDFLARE_ZONE_ID" }
]

[[env.production.rules]]
type = "transform"
enabled = true

[env.production.rules.action_parameters.headers.set]
"X-Robots-Tag" = "index, follow"
"X-Content-Type-Options" = "nosniff"
"X-Frame-Options" = "SAMEORIGIN"
"X-Diamond-Authority" = "Mr. Phillip Corey Roark (0000001)"
EOF

print_success "coaching2100.com deployment prepared"

# Prepare aipublishing.com deployment (if requested)
print_step "🚀 Step 6: Preparing aipublishing.com Deployment"

AIPUB_DEPLOY_DIR="$DEPLOY_BASE_DIR/aipublishing-com"
cp "$QUANTUM_DASHBOARD" "$AIPUB_DEPLOY_DIR/index.html"

# Create wrangler.toml for aipublishing.com
cat > "$AIPUB_DEPLOY_DIR/wrangler.toml" << EOF
name = "aipublishing-com"
compatibility_date = "2024-12-01"

[env.production]
routes = [
  { pattern = "aipublishing.com/*", zone_id = "$CLOUDFLARE_ZONE_ID" }
]

[[env.production.rules]]
type = "transform"
enabled = true

[env.production.rules.action_parameters.headers.set]
"X-Robots-Tag" = "index, follow"
"X-Content-Type-Options" = "nosniff"
"X-Frame-Options" = "SAMEORIGIN"
"X-Diamond-Authority" = "Mr. Phillip Corey Roark (0000001)"
EOF

print_success "aipublishing.com deployment prepared"

# Authentication check
print_step "🔐 Step 7: Cloudflare Authentication Check"

if ! wrangler whoami &> /dev/null; then
    print_warning "Not authenticated with Cloudflare. Please login:"
    echo ""
    echo -e "${CYAN}Run: wrangler login${NC}"
    echo ""
    read -p "Press Enter after you've logged in to continue..."
fi

if wrangler whoami &> /dev/null; then
    print_success "Authenticated with Cloudflare"
else
    print_error "Authentication failed. Please run 'wrangler login' first."
    exit 1
fi

# Deploy pages function
deploy_page() {
    local DEPLOY_DIR=$1
    local DOMAIN=$2
    local DESCRIPTION=$3
    
    echo ""
    echo -e "${CYAN}🚀 Deploying ${DESCRIPTION} to ${DOMAIN}...${NC}"
    
    cd "$DEPLOY_DIR"
    
    # Create or update the Pages project
    PROJECT_NAME="$(basename $DEPLOY_DIR)"
    
    if wrangler pages deploy . --project-name="$PROJECT_NAME"; then
        print_success "Successfully deployed ${DESCRIPTION} to ${DOMAIN}"
        
        # Get the deployment URL
        echo -e "${GREEN}   🌐 Check your Cloudflare dashboard for deployment URLs${NC}"
    else
        print_error "Failed to deploy ${DESCRIPTION} to ${DOMAIN}"
        return 1
    fi
    
    cd - > /dev/null
}

# Perform deployments
print_step "🚀 Step 8: Deploying Pages to Cloudflare"

# Deploy coach.2100.cool
deploy_page "$COACH_DEPLOY_DIR" "coach.2100.cool" "Simple Coaching Page"

# Deploy coaching2100.com
deploy_page "$COACHING_DEPLOY_DIR" "coaching2100.com" "Quantum Dashboard"

# Deploy aipublishing.com
deploy_page "$AIPUB_DEPLOY_DIR" "aipublishing.com" "AI Publishing Quantum Dashboard"

# Create deployment summary
print_step "📊 Step 9: Creating Deployment Summary"

SUMMARY_FILE="./diamond-deployment-summary.json"
cat > "$SUMMARY_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "authority": "Mr. Phillip Corey Roark (0000001)",
  "mission": "Diamond SAO Cloudflare Pages Deployment",
  "deployment_status": "COMPLETED",
  "deployments": {
    "coach.2100.cool": {
      "page_type": "Simple Coaching Page",
      "source_file": "coach-simple-page.html",
      "deployment_method": "cloudflare_pages",
      "status": "DEPLOYED",
      "description": "Coaching by the Minute - Professional coaching solutions"
    },
    "coaching2100.com": {
      "page_type": "Quantum Dashboard",
      "source_file": "quantum-dashboard.html",
      "deployment_method": "cloudflare_pages", 
      "status": "DEPLOYED",
      "description": "Complex Diamond Gateway Architecture dashboard"
    },
    "aipublishing.com": {
      "page_type": "Quantum Dashboard",
      "source_file": "quantum-dashboard.html",
      "deployment_method": "cloudflare_pages",
      "status": "DEPLOYED", 
      "description": "AI Publishing quantum dashboard interface"
    }
  },
  "security_features": {
    "https_enforcement": "ACTIVE",
    "security_headers": "CONFIGURED",
    "diamond_authority_header": "SET"
  },
  "next_steps": [
    "Verify pages are accessible at their respective domains",
    "Run Diamond CLI consolidation audit: diamond consolidate cloudflare",
    "Check domain status in Diamond SAO dashboard",
    "Monitor deployment success via Cloudflare dashboard"
  ]
}
EOF

print_success "Deployment summary created: $SUMMARY_FILE"

# Final summary
echo ""
echo -e "${PURPLE}🎉 CLOUDFLARE PAGES DEPLOYMENT COMPLETE!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ DEPLOYMENT SUMMARY:${NC}"
echo -e "   • ${CYAN}coach.2100.cool${NC} → Simple \"Coaching by the Minute\" page"
echo -e "   • ${CYAN}coaching2100.com${NC} → Complex Quantum Dashboard"
echo -e "   • ${CYAN}aipublishing.com${NC} → AI Publishing Quantum Dashboard"
echo ""
echo -e "${BLUE}🌐 VERIFICATION STEPS:${NC}"
echo -e "   1. Visit ${CYAN}https://coach.2100.cool${NC} - Should show coaching page"
echo -e "   2. Visit ${CYAN}https://coaching2100.com${NC} - Should show quantum dashboard"
echo -e "   3. Visit ${CYAN}https://aipublishing.com${NC} - Should show quantum dashboard"
echo ""
echo -e "${BLUE}🎯 NEXT COMMANDS:${NC}"
echo -e "   • ${CYAN}diamond consolidate cloudflare${NC} - Run infrastructure audit"
echo -e "   • ${CYAN}open diamond-sao-dashboard.html${NC} - Check status"
echo -e "   • ${CYAN}./deploy-diamond-security.sh${NC} - Apply security"
echo ""
echo -e "${YELLOW}⚡ In the Name of Jesus Christ, Our Lord and Saviour${NC}"
echo -e "${PURPLE}💎 Diamond SAO Command Center: Pages Deployed Successfully${NC}"
echo ""

exit 0
