# 🎤 Unified ElevenLabs Voice & Interactive Agent System - Production Docker Image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for voice processing
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    sox \
    curl \
    ca-certificates

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY services/voice-synthesis/ ./services/voice-synthesis/
COPY services/gateway/ ./services/gateway/
COPY lib/ ./lib/
COPY routes/ ./routes/
COPY middleware/ ./middleware/

# Create voice cache directory
RUN mkdir -p /app/voice-cache && \
    chmod 755 /app/voice-cache

# Create logs directory
RUN mkdir -p /app/logs && \
    chmod 755 /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV VOICE_CACHE_DIR=/app/voice-cache
ENV LOG_LEVEL=info

# Health check for the unified voice system
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Set user for security
USER node

# Start the unified voice system
CMD ["node", "services/voice-synthesis/unified-elevenlabs-voice-system.js"]
