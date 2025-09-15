# Node.js Dockerfile for Express.js Testing - Victory36 Secured
FROM node:24-alpine AS base

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S diamond -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with Victory36 security
RUN npm ci --only=production --no-audit --prefer-offline \
    && npm cache clean --force \
    && rm -rf /tmp/*

# Copy application code with proper ownership
COPY --chown=diamond:nodejs server.js ./
COPY --chown=diamond:nodejs deploy-package/ ./deploy-package/

# Switch to non-root user for Victory36 security
USER diamond

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 8080, path: '/health', method: 'GET' }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) process.exit(0); \
      else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start the server
CMD ["node", "server.js"]
