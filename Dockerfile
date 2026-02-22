FROM node:20-alpine

# Install supercronic for cron scheduling
RUN apk add --no-cache curl && \
    curl -fsSLO https://github.com/aptible/supercronic/releases/download/v0.2.29/supercronic-linux-amd64 && \
    chmod +x supercronic-linux-amd64 && \
    mv supercronic-linux-amd64 /usr/local/bin/supercronic && \
    apk del curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY *.js .
COPY *.lock .

# Create crontab file
# Default: runs every day at midnight UTC. Modify as needed.
RUN echo "0 0 * * * npm start" > /app/crontab

# Run supercronic
CMD ["supercronic", "-foreground", "/app/crontab"]
