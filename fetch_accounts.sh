# source SETUP_TOKEN
source .env

CLAIM_URL="$(echo "$SETUP_TOKEN" | base64 --decode)"
ACCESS_URL=$(curl -H "Content-Length: 0" -X POST "$CLAIM_URL")
curl -L "${ACCESS_URL}/accounts" > ./accounts.json
