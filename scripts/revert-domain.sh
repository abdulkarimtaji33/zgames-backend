#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="/var/www/cgagames-backend"
FRONTEND_DIR="/var/www/cgagames-frontend"
NGINX_SITE="/etc/nginx/sites-available/cgagames"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Removing cgagames nginx site"
rm -f /etc/nginx/sites-enabled/cgagames /etc/nginx/sites-available/cgagames
nginx -t
systemctl reload nginx

log "Restoring backend .env"
cd "$BACKEND_DIR"
# Remove duplicate/extra lines added during domain setup
sed -i '/^CORS_ORIGIN=/d' .env
sed -i '/^FRONTEND_URL=/d' .env
sed -i '/^API_URL=/d' .env
echo "CORS_ORIGIN=http://72.60.223.25:5555" >> .env

log "Restoring frontend .env.production"
cat > "$FRONTEND_DIR/.env.production" <<'EOF'
NEXT_PUBLIC_API_URL=http://72.60.223.25:3330/api
NEXT_PUBLIC_APP_URL=http://72.60.223.25:5555
NODE_ENV=production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
EOF

log "Reverting main.ts if git has original"
if [ -d "$BACKEND_DIR/.git" ]; then
  git -C "$BACKEND_DIR" checkout -- src/main.ts 2>/dev/null || true
fi

log "Moving cgagames-web back to port 5555"
pm2 delete cgagames-web 2>/dev/null || true
cd "$FRONTEND_DIR"
pm2 start node_modules/next/dist/bin/next --name cgagames-web -- start -p 5555

log "Rebuilding with restored env"
cd "$BACKEND_DIR"
npm run build
pm2 restart cgagames-api --update-env

cd "$FRONTEND_DIR"
npm run build
pm2 restart cgagames-web --update-env
pm2 save || true

rm -f /tmp/connect-domain.sh

log "Revert complete"
log "CGA Games back to: http://72.60.223.25:5555/"
curl -sI http://127.0.0.1:5555/ | head -3
