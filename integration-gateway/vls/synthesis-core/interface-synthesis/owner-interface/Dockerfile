FROM nginx:alpine

# Copy the owner interface HTML
COPY index.html /usr/share/nginx/html/index.html

# Create nginx startup script that uses PORT env var
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'PORT=${PORT:-8080}' >> /docker-entrypoint.sh && \
    echo 'cat > /etc/nginx/conf.d/default.conf <<EOF' >> /docker-entrypoint.sh && \
    echo 'server {' >> /docker-entrypoint.sh && \
    echo '    listen $PORT;' >> /docker-entrypoint.sh && \
    echo '    server_name localhost;' >> /docker-entrypoint.sh && \
    echo '    location / {' >> /docker-entrypoint.sh && \
    echo '        root /usr/share/nginx/html;' >> /docker-entrypoint.sh && \
    echo '        index index.html;' >> /docker-entrypoint.sh && \
    echo '        try_files \$uri \$uri/ /index.html;' >> /docker-entrypoint.sh && \
    echo '    }' >> /docker-entrypoint.sh && \
    echo '}' >> /docker-entrypoint.sh && \
    echo 'EOF' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
