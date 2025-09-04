# MOCOA Owner Interface with GCP Secret Manager Integration
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Create non-root user
RUN groupadd -r mocoa && useradd -r -g mocoa mocoa
RUN chown -R mocoa:mocoa /usr/src/app
USER mocoa

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV GCP_PROJECT_ID=api-for-warp-drive

# Health check (use PORT env var set by Cloud Run)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Start the application
CMD ["node", "server-minimal.js"]
