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
      },
    },
  ],
};
