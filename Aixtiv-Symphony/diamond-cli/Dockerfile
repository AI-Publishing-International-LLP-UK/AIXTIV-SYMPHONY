# Use Node.js 20 LTS (addresses Node.js deprecation issues)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY self-healing-elevenlabs.js .
COPY repair-mocoa-health.js .

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node self-healing-elevenlabs.js --health-check || exit 1

# Start the application
CMD ["npm", "start"]
