#!/usr/bin/env bash
set -euo pipefail

# NOTE: nginx + SSL for the domain are already configured permanently at
# /etc/nginx/sites-available/cgagames.com (managed by certbot). This script
# no longer touches nginx — it only updates env files and rebuilds/restarts
# the app. Re-running it is safe and idempotent.

DOMAIN="${CGAGAMES_DOMAIN:-cgagames.com}"
BACKEND_DIR="/var/www/cgagames-backend"
FRONTEND_DIR="/var/www/cgagames-frontend"
PUBLIC_ORIGIN="https://${DOMAIN}"
API_PUBLIC_URL="${PUBLIC_ORIGIN}/api"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

set_env() {
  local file="$1" key="$2" value="$3"
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

log "Updating backend .env"
set_env "$BACKEND_DIR/.env" CORS_ORIGIN "${PUBLIC_ORIGIN},https://www.${DOMAIN}"
set_env "$BACKEND_DIR/.env" FRONTEND_URL "$PUBLIC_ORIGIN"
set_env "$BACKEND_DIR/.env" API_URL "$API_PUBLIC_URL"

log "Updating frontend .env.production"
cat > "$FRONTEND_DIR/.env.production" <<EOF
NEXT_PUBLIC_API_URL=${API_PUBLIC_URL}
NEXT_PUBLIC_APP_URL=${PUBLIC_ORIGIN}
NODE_ENV=production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
EOF

log "Rebuilding and restarting"
cd "$BACKEND_DIR"
npm run build
pm2 restart cgagames-api --update-env

cd "$FRONTEND_DIR"
npm run build
pm2 restart cgagames-web --update-env
pm2 save || true

log "Done — open ${PUBLIC_ORIGIN}/"
