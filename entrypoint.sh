#!/bin/sh

# Check if config.json exists
if [ ! -f /app/config.json ]; then
  echo "Error: /app/config.json not found"
  exit 1
fi

# Check if simplefin.accessUrl or simplefin.setupToken is already configured
ACCESS_URL=$(jq -r '.simplefin.accessUrl // empty' /app/config.json)
SETUP_TOKEN=$(jq -r '.simplefin.setupToken // empty' /app/config.json)

cp /app/config.json /tmp/config.json.tmp

# If neither simplefin.accessUrl nor simplefin.setupToken is configured, and both SIMPLEFIN_ACCESSURL and SIMPLEFIN_SETUPTOKEN environment variables are set, update config.json with the values from the environment variables
if ([ -z "$ACCESS_URL" ] || [ "$ACCESS_URL" != "null" ]) && ([ -z "$SETUP_TOKEN" ] || [ "$SETUP_TOKEN" != "null" ] || [ "$SETUP_TOKEN" != "PASTE_SETUP_TOKEN_HERE" ]); then
# Check for access url in env
  if [ -n "$SIMPLEFIN_ACCESSURL" ]; then
    echo "Setting simplefin.accessUrl from SIMPLEFIN_ACCESSURL environment variable"
    jq '.simplefin.accessUrl = env.SIMPLEFIN_ACCESSURL' /app/config.json > /tmp/config.json.tmp && mv /tmp/config.json.tmp /app/config.json
  elif [ -n "$SIMPLEFIN_SETUPTOKEN" ]; then
    echo "Setting simplefin.setupToken from SIMPLEFIN_SETUPTOKEN environment variable"
    jq '.simplefin.setupToken = env.SIMPLEFIN_SETUPTOKEN' /app/config.json > /tmp/config.json.tmp && mv /tmp/config.json.tmp /app/config.json
  else
    echo "Error: Neither simplefin.accessUrl nor simplefin.setupToken is configured in config.json,"
    echo "and neither SIMPLEFIN_ACCESSURL nor SIMPLEFIN_SETUPTOKEN environment variables are set"
    exit 1
  fi
fi


# Create crontab and run supercronic
echo "${CRON:-0 0 * * *} npm start" > /app/crontab
exec supercronic -foreground /app/crontab