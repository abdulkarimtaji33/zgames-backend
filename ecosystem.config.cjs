module.exports = {
  apps: [
    {
      name: 'cgagames-api',
      script: 'dist/main.js',
      cwd: '/var/www/cgagames-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3330,
        // This VPS is dual-stack (IPv4 + IPv6); Node's default DNS resolution prefers IPv6 when
        // both are available. Some outbound APIs (e.g. LikeCard, behind Cloudflare) only allow
        // the account's whitelisted IPv4 address and block the server's (never-whitelisted,
        // effectively random) IPv6 address instead. Force IPv4-first resolution process-wide.
        NODE_OPTIONS: '--dns-result-order=ipv4first',
      },
    },
  ],
};
