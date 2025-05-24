#!/bin/bash

# ======================================================
# Backend Services Setup Script
# ======================================================
# This script automates the initialization of all backend services
# including installing dependencies, setting up environment files,
# and preparing for deployment to Cloud Run.

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Print section header
print_section() {
  echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Print success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Main header
echo -e "${YELLOW}"
echo "======================================================"
echo "         Backend Services Initialization Script        "
echo "======================================================"
echo -e "${NC}"

# Check prerequisites
print_section "Checking Prerequisites"

# Check for Node.js
if command_exists node; then
  NODE_VERSION=$(node -v)
  echo -e "Node.js ${GREEN}✓${NC} (version: $NODE_VERSION)"
else
  print_error "Node.js is not installed. Please install Node.js (v20 or higher)."
  exit 1
fi

# Check for npm
if command_exists npm; then
  NPM_VERSION=$(npm -v)
  echo -e "npm ${GREEN}✓${NC} (version: $NPM_VERSION)"
else
  print_error "npm is not installed. Please install npm."
  exit 1
fi

# Check for gcloud
if command_exists gcloud; then
  echo -e "Google Cloud SDK ${GREEN}✓${NC}"
else
  print_error "Google Cloud SDK is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Check for Docker
if command_exists docker; then
  echo -e "Docker ${GREEN}✓${NC}"
else
  print_error "Docker is not installed. Please install Docker for container builds."
  echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
  exit 1
fi

print_success "All prerequisites checked successfully."

# Set base directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
TTS_SERVICE_DIR="$BACKEND_DIR/services/tts"
SENTIMENT_SERVICE_DIR="$BACKEND_DIR/services/sentiment"
MONITORING_DIR="$BACKEND_DIR/monitoring"

# Setup environment files
print_section "Setting up environment files"

# TTS Service .env file
if [ ! -f "$TTS_SERVICE_DIR/.env" ]; then
  cat > "$TTS_SERVICE_DIR/.env" << EOF
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
GOOGLE_APPLICATION_CREDENTIALS=/drla-api-for-warp-drive-148a01c2006b.json
EOF
  print_success "Created TTS service .env file"
else
  echo "TTS service .env file already exists. Skipping."
fi

# Sentiment Service .env file
if [ ! -f "$SENTIMENT_SERVICE_DIR/.env" ]; then
  cat > "$SENTIMENT_SERVICE_DIR/.env" << EOF
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
GOOGLE_APPLICATION_CREDENTIALS=/drla-api-for-warp-drive-148a01c2006b.json
EOF
  print_success "Created Sentiment service .env file"
else
  echo "Sentiment service .env file already exists. Skipping."
fi

# Remind user to update credentials path
echo -e "${YELLOW}NOTE:${NC} Please update the GOOGLE_APPLICATION_CREDENTIALS path in the .env files with your actual service account key file path."

# Install dependencies
print_section "Installing dependencies"

# Install TTS Service dependencies
echo "Installing TTS service dependencies..."
cd "$TTS_SERVICE_DIR" || exit
npm install
if [ $? -eq 0 ]; then
  print_success "TTS service dependencies installed"
else
  print_error "Failed to install TTS service dependencies"
fi

# Install Sentiment Service dependencies
echo "Installing Sentiment service dependencies..."
cd "$SENTIMENT_SERVICE_DIR" || exit
npm install
if [ $? -eq 0 ]; then
  print_success "Sentiment service dependencies installed"
else
  print_error "Failed to install Sentiment service dependencies"
fi

# Prepare for deployment
print_section "Preparing for deployment"

# Check Google Cloud configuration
echo "Checking Google Cloud configuration..."
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  print_error "No Google Cloud project set. Please run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
else
  print_success "Using Google Cloud project: $PROJECT_ID"
fi

# Create deployment scripts for TTS service
cat > "$TTS_SERVICE_DIR/deploy.sh" << 'EOF'
#!/bin/bash
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="tts-service"
REGION="us-west1"  # Change to your preferred region

echo "Building and deploying TTS service to Cloud Run..."

# Build the container
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --cpu=1 \
  --memory=512Mi \
  --set-env-vars NODE_ENV=production

echo "Deployment completed for TTS service"
EOF
chmod +x "$TTS_SERVICE_DIR/deploy.sh"
print_success "Created TTS service deployment script"

# Create deployment scripts for Sentiment service
cat > "$SENTIMENT_SERVICE_DIR/deploy.sh" << 'EOF'
#!/bin/bash
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="sentiment-service"
REGION="us-west1"  # Change to your preferred region

echo "Building and deploying Sentiment Analysis service to Cloud Run..."

# Build the container
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --cpu=1 \
  --memory=512Mi \
  --set-env-vars NODE_ENV=production

echo "Deployment completed for Sentiment Analysis service"
EOF
chmod +x "$SENTIMENT_SERVICE_DIR/deploy.sh"
print_success "Created Sentiment service deployment script"

# Create a combined deployment script
cat > "$BACKEND_DIR/deploy-all.sh" << 'EOF'
#!/bin/bash
echo "Deploying all backend services..."

# Deploy TTS service
cd services/tts && ./deploy.sh
if [ $? -eq 0 ]; then
  echo "✓ TTS service deployed successfully"
else
  echo "✗ TTS service deployment failed"
  exit 1
fi

# Deploy Sentiment service
cd ../sentiment && ./deploy.sh
if [ $? -eq 0 ]; then
  echo "✓ Sentiment service deployed successfully"
else
  echo "✗ Sentiment service deployment failed"
  exit 1
fi

echo "All services deployed successfully!"
EOF
chmod +x "$BACKEND_DIR/deploy-all.sh"
print_success "Created combined deployment script"

# Final instructions
print_section "Setup complete"
echo -e "To run the services locally:"
echo -e "  1. ${YELLOW}cd $TTS_SERVICE_DIR && npm start${NC} - For TTS service"
echo -e "  2. ${YELLOW}cd $SENTIMENT_SERVICE_DIR && npm start${NC} - For Sentiment service"
echo ""
echo -e "To deploy the services to Cloud Run:"
echo -e "  1. Update the GOOGLE_APPLICATION_CREDENTIALS in .env files"
echo -e "  2. Run ${YELLOW}$BACKEND_DIR/deploy-all.sh${NC} to deploy all services"
echo -e "  3. Or deploy individual services with ${YELLOW}./deploy.sh${NC} in each service directory"
echo ""
echo -e "${GREEN}Setup has been completed successfully!${NC}"

