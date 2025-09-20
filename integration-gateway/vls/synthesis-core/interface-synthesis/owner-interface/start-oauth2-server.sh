#!/bin/bash

# 💎 OAUTH2 ELEVENLABS ENTERPRISE SERVER STARTUP SCRIPT
# 
# Sacred Mission: Start OAuth2-secured voice and AI server
# Authority: Mr. Phillip Corey Roark (0000001) - Diamond SAO Exclusive
#
# Usage: ./start-oauth2-server.sh [dev|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODE="${1:-dev}"
ENV_FILE=".env.oauth2"

echo -e "${PURPLE}💎 OAUTH2 ELEVENLABS ENTERPRISE SERVER${NC}"
echo -e "${PURPLE}════════════════════════════════════════${NC}"
echo -e "${BLUE}🏛️  Authority: Mr. Phillip Corey Roark (0000001) - Diamond SAO${NC}"
echo -e "${BLUE}🌍 Starting server in ${MODE} mode...${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js version is $NODE_VERSION. Recommended: 18+${NC}"
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Environment file $ENV_FILE not found.${NC}"
    
    if [ -f ".env.oauth2.example" ]; then
        echo -e "${CYAN}📋 Creating $ENV_FILE from example...${NC}"
        cp .env.oauth2.example "$ENV_FILE"
        echo -e "${YELLOW}⚠️  Please configure $ENV_FILE with your settings before running the server.${NC}"
        exit 1
    else
        echo -e "${RED}❌ No environment file template found. Please create $ENV_FILE manually.${NC}"
        exit 1
    fi
fi

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Check for required environment variables
REQUIRED_VARS=("GCP_PROJECT_ID")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf "${RED}   - %s${NC}\n" "${MISSING_VARS[@]}"
    echo -e "${YELLOW}Please configure these in $ENV_FILE${NC}"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Please ensure you're in the correct directory.${NC}"
    exit 1
fi

# Check if OAuth2 integration file exists
if [ ! -f "oauth2-elevenlabs-enterprise-integration.js" ]; then
    echo -e "${RED}❌ OAuth2 ElevenLabs integration file not found.${NC}"
    echo -e "${RED}   Required: oauth2-elevenlabs-enterprise-integration.js${NC}"
    exit 1
fi

# Check if server file exists
if [ ! -f "oauth2-elevenlabs-server.js" ]; then
    echo -e "${RED}❌ OAuth2 ElevenLabs server file not found.${NC}"
    echo -e "${RED}   Required: oauth2-elevenlabs-server.js${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
    echo ""
fi

# Create necessary directories
echo -e "${CYAN}📁 Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p tmp/uploads
mkdir -p audio-output
mkdir -p static
mkdir -p test

# Set proper permissions
chmod 755 logs tmp tmp/uploads audio-output static test

echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Display configuration
echo -e "${CYAN}🔧 Server Configuration:${NC}"
echo -e "${BLUE}   Project ID: ${GCP_PROJECT_ID:-'Not set'}${NC}"
echo -e "${BLUE}   Port: ${PORT:-8080}${NC}"
echo -e "${BLUE}   Environment: ${NODE_ENV:-development}${NC}"
echo -e "${BLUE}   Region: ${CLOUD_ML_REGION:-us-west1}${NC}"
echo ""

# Check Google Cloud authentication
echo -e "${CYAN}🔐 Checking Google Cloud authentication...${NC}"
if command -v gcloud &> /dev/null; then
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
        echo -e "${GREEN}✅ Google Cloud authenticated as: $ACTIVE_ACCOUNT${NC}"
    else
        echo -e "${YELLOW}⚠️  Google Cloud not authenticated. Some features may not work.${NC}"
        echo -e "${YELLOW}   Run: gcloud auth login${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Google Cloud SDK not installed. Some features may not work.${NC}"
fi
echo ""

# Start the server based on mode
echo -e "${GREEN}🚀 Starting OAuth2 ElevenLabs Enterprise Server...${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

case "$MODE" in
    "dev"|"development")
        export NODE_ENV=development
        echo -e "${BLUE}🔧 Development mode: Hot reload enabled${NC}"
        echo -e "${BLUE}📍 Server will be available at: http://localhost:${PORT:-8080}${NC}"
        echo -e "${BLUE}🎯 Health check: http://localhost:${PORT:-8080}/health${NC}"
        echo -e "${BLUE}🔐 OAuth2 Login: http://localhost:${PORT:-8080}/auth/login${NC}"
        echo ""
        npm run oauth2-dev
        ;;
    "prod"|"production")
        export NODE_ENV=production
        echo -e "${GREEN}🏭 Production mode: Optimized performance${NC}"
        echo -e "${BLUE}📍 Server will be available at: http://localhost:${PORT:-8080}${NC}"
        echo -e "${BLUE}🎯 Health check: http://localhost:${PORT:-8080}/health${NC}"
        echo -e "${BLUE}🔐 OAuth2 Login: http://localhost:${PORT:-8080}/auth/login${NC}"
        echo ""
        npm run oauth2-prod
        ;;
    *)
        echo -e "${RED}❌ Invalid mode: $MODE${NC}"
        echo -e "${YELLOW}Usage: $0 [dev|prod]${NC}"
        exit 1
        ;;
esac
