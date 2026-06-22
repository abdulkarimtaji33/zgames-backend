module.exports = {
  apps: [
    {
      name: 'zgames-api',
      script: 'dist/main.js',
      cwd: '/var/www/zgames-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3330,
      },
    },
  ],
};
