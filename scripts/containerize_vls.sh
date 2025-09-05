#!/bin/bash

# containerize_vls.sh
# Script to generate Docker configurations for VLS solutions

# Check if a VLS solution name was provided
if [ -z "$1" ]; then
  echo "Usage: ./containerize_vls.sh <vls_solution_name> [source_path]"
  echo "  vls_solution_name: Name of the VLS solution (e.g., dr-lucy-flight-memory)"
  echo "  source_path: Optional. Path to the source code. Defaults to current directory."
  exit 1
fi

VLS_NAME="$1"
SOURCE_PATH="${2:-.}"
REPO_ROOT="/Users/as/asoos/opus/opus1.0.1"
CONTAINER_DIR="$REPO_ROOT/containers/$VLS_NAME"

# Create container directory
mkdir -p "$CONTAINER_DIR"

# Create Dockerfile
echo "Creating Dockerfile for $VLS_NAME..."
cat > "$CONTAINER_DIR/Dockerfile" << EODF
# Dockerfile for $VLS_NAME
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY $SOURCE_PATH/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY $SOURCE_PATH .

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
EODF

# Create docker-compose.yml
echo "Creating docker-compose.yml for $VLS_NAME..."
cat > "$CONTAINER_DIR/docker-compose.yml" << EODC
version: '3.8'

services:
  $VLS_NAME:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: $VLS_NAME
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
    networks:
      - vls-network

networks:
  vls-network:
    driver: bridge
EODC

# Create README.md with instructions
echo "Creating README.md with instructions..."
cat > "$CONTAINER_DIR/README.md" << EORM
# $VLS_NAME Container

This directory contains Docker configurations for the $VLS_NAME VLS solution.

## Prerequisites
- Docker
- Docker Compose

## Building the Container
```bash
docker-compose build
```

## Running the Container
```bash
docker-compose up -d
```

## Stopping the Container
```bash
docker-compose down
```

## Configuration
Edit the `.env` file to configure the container:

```
PORT=3000
NODE_ENV=production
```

## Logs
```bash
docker logs -f $VLS_NAME
```

## Accessing the Container
```bash
docker exec -it $VLS_NAME sh
```
EORM

# Create .env file template
echo "Creating .env template..."
cat > "$CONTAINER_DIR/.env.template" << EOTE
# Environment variables for $VLS_NAME
PORT=3000
NODE_ENV=production
# Add other environment variables here
EOTE

echo "Containerization configuration created for $VLS_NAME at $CONTAINER_DIR"
echo "Next steps:"
echo "1. Review and customize the Dockerfile and docker-compose.yml"
echo "2. Create a .env file from the .env.template"
echo "3. Build and test the container"
echo "4. Document any specific configuration requirements"

exit 0
