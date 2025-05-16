FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV SERVICE_NAME=jira-integration

# Start the service
CMD ["node", "server.js"]
