#/bin/sh
echo "${CRON:-0 0 * * *} npm start" > /app/crontab
exec supercronic -foreground /app/crontab