module.exports = {
  apps: [
    {
      name: 'pakparcha-backend',
      script: './dist/server.js',
      instances: 'max', // Utilizes all available CPU cores on the Ubuntu VPS
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M', // Restarts a worker if it leaks or exceeds 800MB
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
