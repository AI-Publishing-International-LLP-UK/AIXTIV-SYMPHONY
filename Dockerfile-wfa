# WFA PRODUCTION SWARM - CLOUD RUN DOCKERFILE
# Optimized for 20M agents, 200 sectors, Victory36 protection
# Commander: Phillip Corey Roark
# Multi-stage build for optimal production image size

# Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY server-package.json package.json

# Install dependencies with production optimizations
RUN npm install --only=production --no-audit --no-fund && \
    npm cache clean --force

# Production stage
FROM node:22-alpine AS production

# Install security updates and required tools
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        dumb-init \
        ca-certificates && \
    rm -rf /var/cache/apk/* && \
    addgroup -g 1001 -S wfa && \
    adduser -S wfa -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY server.js .
COPY server-package.json package.json

# Change ownership to non-root user
RUN chown -R wfa:wfa /app

# Switch to non-root user for security
USER wfa

# Environment variables for Cloud Run optimization
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS="--max-old-space-size=7168"
ENV UV_THREADPOOL_SIZE=32

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Labels for container metadata
LABEL maintainer="AI Publishing International LLP"
LABEL version="1.0.0"
LABEL description="WFA Production Swarm - Cloud Run Backend"
LABEL commander="Phillip Corey Roark"
LABEL agents="20000000"
LABEL sectors="200"
LABEL protection="victory36_maximum"

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
