# Deployment Guide - Digital Ocean

This guide will help you deploy the Roll to Help website and Telegram bot to Digital Ocean's App Platform.

## Prerequisites

- A [Digital Ocean](https://www.digitalocean.com/) account
- Your project code pushed to a GitHub repository
- Node.js 18+ installed locally
- A Telegram bot created with [BotFather](https://t.me/botfather)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your code is pushed to a GitHub repository and includes:
- All necessary configuration files (next.config.js, package.json, etc.)
- The `.env.example` file (rename a copy to `.env` for local development)
- Database migrations in the Prisma directory

### 2. Set Up Digital Ocean App Platform

1. Log in to your Digital Ocean account
2. Go to the App Platform section
3. Click "Create App"
4. Connect your GitHub account and select your repository
5. Select the branch you want to deploy (usually `main` or `master`)

### 3. Configure Your App

#### Basic Configuration
- Select the "Web Service" type for your app
- Choose the Node.js runtime
- Set the build command to: `npm run prepare-deploy`
- Set the run command to: `npm run start:prod`
- Choose an appropriate plan (Basic tier is recommended for the combined app and bot)

#### Environment Variables
Add the following environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string (you'll get this in step 4)
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather
- `NEXTAUTH_SECRET`: Generate a secure random string (use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: The URL of your deployed app (e.g., `https://your-app-name.ondigitalocean.app`)
- `NEXT_PUBLIC_APP_URL`: Same as NEXTAUTH_URL, used by the bot for verification links
- `NODE_ENV`: Set to `production`

### 4. Add a Database

1. In the Digital Ocean dashboard, go to "Databases"
2. Create a new PostgreSQL database cluster
3. Choose an appropriate plan
4. Once created, go to the "Connection" tab
5. Copy the connection string and add it as your `DATABASE_URL` environment variable in the App Platform

### 5. Deploy Your App

1. Review your configuration
2. Click "Launch App"
3. Wait for the build and deployment to complete

### 6. Verify Deployment

- Visit your app URL to confirm it's working
- Check the logs for any errors
- Test the Telegram bot by sending `/start` to your bot
- Test all functionality (browsing games, placing bids, generating verification codes, etc.)

## Telegram Bot Operations

The Telegram bot runs as a separate process alongside your web application using PM2. This ensures the bot stays online even during website redeployments or restarts.

### Bot Architecture

- The bot uses the Telegraf library to interact with Telegram's API
- It runs in polling mode, which is more reliable for most deployments
- The bot automatically runs database migrations on startup
- PM2 ensures the bot process restarts if it crashes

### Testing the Bot

1. Find your bot on Telegram (using the username you registered with BotFather)
2. Send `/start` to begin interacting with the bot
3. Test the verification process:
   - Generate a code on the website
   - Send the code to the bot
   - Verify that your account is linked

### Troubleshooting Bot Issues

If the bot isn't responding:
1. Check the app logs in Digital Ocean
2. Verify the `TELEGRAM_BOT_TOKEN` is correct
3. Make sure the bot process is running (you should see both processes in the logs)

## Maintenance

### Updating Your App

1. Push changes to your GitHub repository
2. Digital Ocean will automatically rebuild and deploy
3. Both the website and bot will be updated and restarted

### Database Backups

Set up automatic backups for your PostgreSQL database in the Digital Ocean dashboard.

## Additional Resources

- [Digital Ocean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment)
- [Telegraf Documentation](https://telegraf.js.org/)

## Support

For questions about Digital Ocean deployment, contact their support or refer to their documentation. 