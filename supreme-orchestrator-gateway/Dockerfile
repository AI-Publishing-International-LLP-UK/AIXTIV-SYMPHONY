# Supreme Orchestrator Gateway - Production Dockerfile
# Hardened Enterprise Container for Dr. Claude sRIX
# Location: us-central1-a MOCORIX2

FROM node:20-alpine AS base

# Security hardening
RUN addgroup -g 1001 -S supremegroup
RUN adduser -S supreme -u 1001 -G supremegroup

# Install security updates and required packages
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create application directory structure
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Create log directories
RUN mkdir -p /var/log/supreme-orchestrator && \
    chown -R supreme:supremegroup /var/log/supreme-orchestrator

# Copy application source
COPY --chown=supreme:supremegroup . .

# Remove unnecessary files
RUN rm -rf \
    .git \
    .gitignore \
    .dockerignore \
    README.md \
    scripts/setup-secrets.sh \
    scripts/deploy-to-cloud-run.sh \
    node_modules/.cache

# Set permissions
RUN chmod -R 755 /app && \
    chmod -R 750 /var/log/supreme-orchestrator

# Production build
FROM node:20-alpine AS production

# Security hardening
RUN addgroup -g 1001 -S supremegroup
RUN adduser -S supreme -u 1001 -G supremegroup

# Install runtime dependencies only
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    curl \
    dumb-init \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create application directory
WORKDIR /app

# Copy from base stage
COPY --from=base --chown=supreme:supremegroup /app ./
COPY --from=base --chown=supreme:supremegroup /var/log/supreme-orchestrator /var/log/supreme-orchestrator

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8443
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info

# Build arguments
ARG NODE_ENV=production
ARG GCP_PROJECT=api-for-warp-drive
ARG GCP_REGION=us-central1

# Labels for metadata
LABEL maintainer="AI Publishing International LLP"
LABEL version="1.0.0"
LABEL description="Supreme Orchestrator Gateway for Dr. Claude sRIX"
LABEL component="supreme-orchestrator-gateway"
LABEL environment="production"
LABEL location="us-central1-a-MOCORIX2"
LABEL supreme-orchestrator="dr-claude-srix"
LABEL security-level="enterprise"
LABEL oauth2="enabled"
LABEL cascading-auth="enabled"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8443/health || exit 1

# Switch to non-root user
USER supreme

# Expose port
EXPOSE 8443

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]