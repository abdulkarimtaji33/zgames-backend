#!/usr/bin/env bash
set -euo pipefail

# ZGames backend deploy on VPS (does not touch clearearth or other apps)
FRONTEND_PORT="${ZGAMES_FRONTEND_PORT:-5555}"
BACKEND_PORT="${ZGAMES_BACKEND_PORT:-3330}"
WEB_INTERNAL_PORT="${ZGAMES_WEB_INTERNAL_PORT:-5556}"
BACKEND_DIR="/var/www/zgames-backend"
FRONTEND_DIR="/var/www/zgames-frontend"
NGINX_SITE="/etc/nginx/sites-available/zgames"
PM2_API="zgames-api"
PM2_WEB="zgames-web"
BACKEND_REPO="https://github.com/abdulkarimtaji33/zgames-backend.git"
FRONTEND_REPO="https://github.com/abdulkarimtaji33/zgames-frontend.git"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

clone_or_pull() {
  local dir="$1" repo="$2"
  if [ -d "$dir/.git" ]; then
    log "Pulling $dir"
    git -C "$dir" fetch origin main
    git -C "$dir" reset --hard origin/main
  else
    log "Cloning $repo -> $dir"
    mkdir -p "$(dirname "$dir")"
    git clone --branch main --depth 1 "$repo" "$dir"
  fi
}

ensure_backend_env() {
  if [ ! -f "$BACKEND_DIR/.env" ]; then
    log "Creating backend .env from .env.example"
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    {
      echo ""
      echo "NODE_ENV=production"
      echo "PORT=$BACKEND_PORT"
      echo "API_PREFIX=api"
      echo "CORS_ORIGIN=http://72.60.223.25:$FRONTEND_PORT"
      echo "FRONTEND_URL=http://72.60.223.25:$FRONTEND_PORT"
      echo "API_URL=http://72.60.223.25:$FRONTEND_PORT/api"
    } >> "$BACKEND_DIR/.env"
    log "IMPORTANT: edit $BACKEND_DIR/.env with DB credentials before first real use"
  fi
}

ensure_frontend_env() {
  if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
    log "Creating frontend .env.production"
    cat > "$FRONTEND_DIR/.env.production" <<EOF
NEXT_PUBLIC_API_URL=http://72.60.223.25:$FRONTEND_PORT/api
NEXTAUTH_URL=http://72.60.223.25:$FRONTEND_PORT
NEXTAUTH_SECRET=change-me-in-production
EOF
  fi
}

setup_nginx() {
  log "Writing nginx site $NGINX_SITE"
  cat > "$NGINX_SITE" <<EOF
server {
    listen $FRONTEND_PORT;
    listen [::]:$FRONTEND_PORT;
    server_name _;

    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:$WEB_INTERNAL_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

  ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/zgames
  nginx -t
  systemctl reload nginx
  ufw allow "$FRONTEND_PORT/tcp" || true
}

deploy_backend() {
  clone_or_pull "$BACKEND_DIR" "$BACKEND_REPO"
  ensure_backend_env
  cd "$BACKEND_DIR"
  npm ci
  npm run build
  if pm2 describe "$PM2_API" >/dev/null 2>&1; then
    pm2 restart "$PM2_API" --update-env
  else
    pm2 start ecosystem.config.cjs --only "$PM2_API"
  fi
}

deploy_frontend() {
  clone_or_pull "$FRONTEND_DIR" "$FRONTEND_REPO"
  ensure_frontend_env
  cd "$FRONTEND_DIR"
  npm ci
  npm run build
  if pm2 describe "$PM2_WEB" >/dev/null 2>&1; then
    pm2 restart "$PM2_WEB" --update-env
  else
    pm2 start ecosystem.config.cjs --only "$PM2_WEB"
  fi
}

log "ZGames deploy starting (frontend :$FRONTEND_PORT, backend :$BACKEND_PORT)"
deploy_backend
deploy_frontend
setup_nginx
pm2 save || true
log "Deploy complete"
log "Frontend: http://72.60.223.25:$FRONTEND_PORT/"
log "API docs: http://72.60.223.25:$FRONTEND_PORT/api/docs"
pm2 list | grep -E 'zgames-api|zgames-web' || pm2 list
