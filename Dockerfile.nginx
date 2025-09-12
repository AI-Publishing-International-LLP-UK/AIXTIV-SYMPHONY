FROM nginx:alpine

# Copy the WFA RESTORED CLEAN owner interface
COPY wfa-restored-owner-interface.html /usr/share/nginx/html/index.html
COPY wfa-restored-owner-interface.html /usr/share/nginx/html/owner.html
COPY test-dana-voice.html /usr/share/nginx/html/voice-test.html
COPY ai-trinity-interface.html /usr/share/nginx/html/trinity.html
# WFA Swarm Authority: Phillip Corey Roark - 20M Agents

# Create nginx config for Cloud Run
RUN echo 'server { listen 8080; server_name _; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
