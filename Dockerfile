FROM node:20-alpine

# Install supercronic for cron scheduling and jq
RUN apk add --no-cache curl jq && \
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
COPY index.js ./
COPY entrypoint.sh ./

# Default cron schedule (midnight UTC daily)
ENV CRON="0 0 * * *"

# Run entrypoint script
CMD ["/app/entrypoint.sh"]