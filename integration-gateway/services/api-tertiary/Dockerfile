# Use Node.js 20 LTS (latest supported version)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const options={hostname:'localhost',port:8080,path:'/health',timeout:2000};const req=http.request(options,(res)=>{if(res.statusCode===200)process.exit(0);else process.exit(1)});req.on('error',()=>process.exit(1));req.on('timeout',()=>process.exit(1));req.setTimeout(2000);req.end();"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["node", "index.js"]