/**
 * PM2 Ecosystem Configuration
 * 
 * This file defines the processes that should run in production.
 * It includes both the Next.js web application and the Telegram bot.
 */

module.exports = {
  apps: [
    {
      name: 'web-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      instances: 1,
      autorestart: true,
    },
    {
      name: 'telegram-bot',
      script: './scripts/bot.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
      merge_logs: true,
    },
  ],
}; 