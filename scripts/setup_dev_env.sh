#!/bin/bash

# setup_dev_env.sh
# Script to set up a development environment for the Aixtiv Symphony Opus project

REPO_ROOT="/Users/as/asoos/opus/opus1.0.1"

echo "Setting up development environment for Aixtiv Symphony Opus..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js before continuing."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm before continuing."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker before continuing."
    echo "Docker is required for containerization of VLS solutions."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose before continuing."
    echo "Docker Compose is required for running multi-container applications."
fi

# Create .env file if it doesn't exist
if [ ! -f "$REPO_ROOT/.env" ]; then
    echo "Creating .env file from template..."
    cat > "$REPO_ROOT/.env" << EOTE
# Environment variables for Aixtiv Symphony Opus
NODE_ENV=development
PORT=3000
# Add other environment variables here
EOTE
    echo ".env file created successfully."
else
    echo ".env file already exists."
fi

# Install dependencies
echo "Installing dependencies..."
cd "$REPO_ROOT" && npm install

# Create local development tools directory
mkdir -p "$REPO_ROOT/tools/dev"

# Create a simple script to list available agents
cat > "$REPO_ROOT/tools/dev/list_agents.sh" << EOLA
#!/bin/bash
# Script to list available agents

REPO_ROOT="/Users/as/asoos/opus/opus1.0.1"

echo "Available CRX agents:"
ls -la "$REPO_ROOT/agent-pairs/crx"

echo ""
echo "Available RIX agents:"
ls -la "$REPO_ROOT/agent-pairs/rix"
EOLA
chmod +x "$REPO_ROOT/tools/dev/list_agents.sh"

# Create a simple script to list available containers
cat > "$REPO_ROOT/tools/dev/list_containers.sh" << EOLC
#!/bin/bash
# Script to list available containers

REPO_ROOT="/Users/as/asoos/opus/opus1.0.1"

echo "Available containers:"
ls -la "$REPO_ROOT/containers"

echo ""
echo "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOLC
chmod +x "$REPO_ROOT/tools/dev/list_containers.sh"

echo "Development environment setup complete!"
echo ""
echo "To get started, you can:"
echo "1. Use 'npm start' to run the application"
echo "2. Use './tools/dev/list_agents.sh' to list available agents"
echo "3. Use './tools/dev/list_containers.sh' to list available containers"
echo "4. Use './scripts/integrate_bundle.sh' to integrate agent bundles"
echo "5. Use './scripts/containerize_vls.sh' to containerize VLS solutions"
echo ""
echo "Happy developing!"

exit 0
