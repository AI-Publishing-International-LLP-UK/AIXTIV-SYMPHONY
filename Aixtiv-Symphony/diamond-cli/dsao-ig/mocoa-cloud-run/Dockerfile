# Use the official Node.js 22 runtime as base image
FROM node:22-slim

# Install system dependencies for health monitoring
RUN apt-get update && apt-get install -y \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production --no-audit --no-fund

# Copy the rest of the application code
COPY . .

# Create non-root user for security
RUN groupadd -r -g 1001 mocoa && \
    useradd -r -u 1001 -g mocoa -d /app -s /bin/false mocoa && \
    chown -R mocoa:mocoa /app

# Switch to non-root user
USER mocoa

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose the port that the app runs on
EXPOSE 8080

# Define the command to run the application
CMD ["npm", "start"]
