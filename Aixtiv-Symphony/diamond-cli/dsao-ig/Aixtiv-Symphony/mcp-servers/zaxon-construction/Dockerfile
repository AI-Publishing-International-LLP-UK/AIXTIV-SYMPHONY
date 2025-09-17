# Zaxon Construction MCP Server Dockerfile
# Authority: Diamond SAO Command Center
# CRX Agent: ZENA (CRX01)

FROM node:24.7.0-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S zaxon && \
    adduser -S zaxon -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY zaxon-mcp-server.js ./

# Set environment variables for Zaxon Construction
ENV NODE_ENV=production \
    CLOUD_ML_REGION=us-west1 \
    MCP_MODE=zaxon_construction \
    COMPANY_NAME="Zaxon Construction" \
    OWNER_NAME="Aaron Harris" \
    OWNER_EMAIL="aaron@zaxonconstruction.com" \
    CRX_AGENT_NAME="ZENA" \
    CRX_AGENT_ID="CRX01" \
    PORT=8080

# Change ownership to zaxon user
RUN chown -R zaxon:zaxon /app

# Switch to non-root user
USER zaxon

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the Zaxon Construction MCP server
CMD ["node", "zaxon-mcp-server.js"]
