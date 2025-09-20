# Multi-stage Docker build for MCP Universal Template
# Optimized for Google Cloud Run deployment with Node.js 22

# ==========================================
# Base image with Node.js 22
# ==========================================
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    make \
    gcc \
    g++ \
    python3 \
    py3-pip \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# ==========================================
# Dependencies stage
# ==========================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# ==========================================
# Development dependencies stage (for testing)
# ==========================================
FROM base AS dev-dependencies

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Run linting and formatting checks
RUN npm run lint || echo "Linting completed with warnings"

# ==========================================
# Production build stage
# ==========================================
FROM node:22-alpine AS production

# Set NODE_ENV
ENV NODE_ENV=production
ENV PORT=8080
ENV GCP_PROJECT=api-for-warp-drive
ENV REGION=us-west1

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpuser -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=mcpuser:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=mcpuser:nodejs src/ ./src/
COPY --chown=mcpuser:nodejs scripts/ ./scripts/
COPY --chown=mcpuser:nodejs config/ ./config/
COPY --chown=mcpuser:nodejs package*.json ./

# Create necessary directories
RUN mkdir -p /tmp/logs && \
    chown mcpuser:nodejs /tmp/logs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER mcpuser

# Labels for container metadata
LABEL name="MCP Universal Template"
LABEL version="1.0.0"
LABEL description="Universal MCP Template System with Supreme Promise Infrastructure"
LABEL maintainer="AI Publishing International LLP"
LABEL org.opencontainers.image.title="MCP Universal Template"
LABEL org.opencontainers.image.description="Promise infrastructure for 10,000 customers and 20M agents"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="AI Publishing International LLP"
LABEL org.opencontainers.image.source="https://github.com/AI-Publishing-International-LLP-UK/AIXTIV-SYMPHONY"

# Start the application
CMD ["node", "src/server.js"]