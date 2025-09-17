# Use the official Node.js 24 runtime as base image
FROM node:24-alpine

# Install system dependencies for health monitoring
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production --no-audit --no-fund

# Copy the rest of the application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S mocoa && \
    adduser -S mocoa -u 1001 -G mocoa && \
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
