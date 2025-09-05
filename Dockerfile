# ASOOS Flyer - Dr. Lucy ML + Professor Lee Cloud Deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p logs tmp

# Set environment variables for production
ENV NODE_ENV=production \
    PORT=8080 \
    GOOGLE_CLOUD_PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID} \
    GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT} \
    PROJECT_ID=${PROJECT_ID} \
    SERVICE_ACCOUNT=${SERVICE_ACCOUNT} \
    DR_CLAUDE_API=${DR_CLAUDE_API} \
    ASOOS_FLYER_VERSION=${ASOOS_FLYER_VERSION} \
    DEEP_MIND_API_ENDPOINT=${DEEP_MIND_API_ENDPOINT} \
    DR_LUCY_AUTOMATION_ENDPOINT=${DR_LUCY_AUTOMATION_ENDPOINT} \
    ML_FEEDBACK_LOOP_ENDPOINT=${ML_FEEDBACK_LOOP_ENDPOINT} \
    PROF_LEE_REVIEW_ENDPOINT=${PROF_LEE_REVIEW_ENDPOINT} \
    CONNECTOR_MANAGER_ENABLED=${CONNECTOR_MANAGER_ENABLED} \
    ML_PIPELINE_ENABLED=${ML_PIPELINE_ENABLED} \
    FEEDBACK_LOOP_ACTIVE=${FEEDBACK_LOOP_ACTIVE}

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    http.get('http://localhost:8080/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1); \
    }).on('error', () => process.exit(1));"

# Run the application
CMD ["node", "server.js"]
