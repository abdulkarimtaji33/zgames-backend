# CGA Games production deploy

## Server

| Host | URL | SSH |
|------|-----|-----|
| **Primary** | https://cgagames.com/ | `ssh root@72.60.223.25` |

| | |
|---|---|
| **Frontend path** | `/var/www/cgagames-frontend` |
| **Backend path** | `/var/www/cgagames-backend` |
| **Frontend (Next.js)** | PM2 process `cgagames-web` → `next start -p 5555`, listens on port **5555** |
| **API (NestJS)** | PM2 process `cgagames-api` → `dist/main.js`, listens on port **3330** |
| **Public URL** | `https://cgagames.com/` and `https://www.cgagames.com/` (redirects to bare domain) — no port in the URL |
| **Web** | Nginx **:80/:443** on `cgagames.com`: `/` → `http://127.0.0.1:5555`, `/api/` → `http://127.0.0.1:3330` |
| **Nginx site** | `/etc/nginx/sites-available/cgagames.com` (symlink `sites-enabled/cgagames.com`) |
| **SSL** | Let's Encrypt via certbot, auto-renews (`certbot renew` timer). Cert covers `cgagames.com` + `www.cgagames.com`. |
| **Database** | MariaDB, schema `cgagames` (`DB_NAME=cgagames` in backend `.env`), user `zgames`@`localhost` (kept its original username, only granted access to the new schema). Old `zgames` schema and a `mysqldump` backup (`/root/zgames_backup_*.sql`) were left in place, not dropped. |

## Git remotes (on server)

Repo names on GitHub are unchanged (`zgames-frontend`/`zgames-backend` — only the brand/product name and server-side paths/process names were renamed to CGA Games, not the GitHub repos themselves):

- Frontend: `https://github.com/abdulkarimtaji33/zgames-frontend.git` — branch `main`
- Backend: `https://github.com/abdulkarimtaji33/zgames-backend.git` — branch `main`

Push from your machine first, then deploy on the server.

---

## Deploy frontend (after `git push` to `zgames-frontend`)

```bash
ssh root@72.60.223.25
cd /var/www/cgagames-frontend
git pull origin main
npm ci   # or: npm install
npm run build
pm2 restart cgagames-web --update-env
# Warm up dynamic routes so Turbopack compiles their SSR chunks before
# real traffic hits them — the very first hit after a restart can race
# and return a transient 502/ChunkLoadError otherwise.
sleep 2 && for p in / /admin/products/warmup /admin/orders/warmup /admin/customers/warmup /admin/returns/warmup /admin/support/warmup; do curl -s -o /dev/null "http://127.0.0.1:5555$p"; done
```

---

## Deploy backend (after `git push` to `zgames-backend`)

```bash
ssh root@72.60.223.25
cd /var/www/cgagames-backend
git pull origin main
npm ci   # or: npm install
npm run build
pm2 restart cgagames-api --update-env
pm2 list   # confirm cgagames-api and cgagames-web online
```

**One-shot deploy from a dev machine** (Git Bash / WSL; requires SSH key on the VPS):

```bash
cd zgames-backend
npm run deploy:vps   # runs scripts/deploy-on-server.sh over SSH
```

> nginx + SSL for `cgagames.com` are configured permanently (vhost + certbot) and are **not** touched by `deploy-on-server.sh` or `connect-domain.sh` — both scripts were simplified to only clone/pull, build, and `pm2 restart`. Re-running either is safe and idempotent.

---

## Quick verify

```bash
nginx -t
pm2 show cgagames-api
pm2 show cgagames-web
curl -sI https://cgagames.com/ | head -5
curl -s https://cgagames.com/api/settings/public/theme
```

---

## Notes

- **Other PM2 apps** on the same host (clearearth, astrology, lunchboxai, socialposter, videogenerator, building-management, big, upwork-live) — only restart `cgagames-api` / `cgagames-web` for CGA Games changes.
- Keep `.env` (backend) and `.env.production` (frontend) only on the server; do not commit them.
- To point another domain at a different project on this same VPS later: copy `/etc/nginx/sites-available/cgagames.com`, rename it to the new domain, change `server_name` and the two `proxy_pass` ports, symlink into `sites-enabled`, `nginx -t && systemctl reload nginx`, then run `certbot --nginx -d newdomain.com -d www.newdomain.com --non-interactive --agree-tos -m dev@ramatechme.com --redirect`.
