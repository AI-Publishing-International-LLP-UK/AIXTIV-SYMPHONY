# VLS Master Synthesis - Production Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY vls-master-synthesis.js ./
COPY voice-synthesis/ ./voice-synthesis/
COPY agent-synthesis/ ./agent-synthesis/
COPY interface-synthesis/ ./interface-synthesis/

# Install dependencies
RUN npm install --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S vls -u 1001
RUN chown -R vls:nodejs /app
USER vls

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start VLS Master Synthesis
CMD ["node", "vls-master-synthesis.js"]