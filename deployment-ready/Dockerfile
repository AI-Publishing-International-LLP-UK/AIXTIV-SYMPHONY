FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production --legacy-peer-deps

# Copy application files
COPY . .

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
