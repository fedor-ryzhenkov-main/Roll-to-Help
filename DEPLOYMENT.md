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

### 3. Configure Your App (Single Component)

- Select the "Web Service" type for your app
- Choose the Node.js runtime
- Set the build command to: `npm run prepare-deploy`
- Set the run command to: `npm run start:prod`
- Choose an appropriate plan (Basic tier is recommended)

#### Environment Variables
Add the following environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string (you'll get this in step 4)
- `DATABASE_PROVIDER`: Set to `postgresql`
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather
- `NEXTAUTH_SECRET`: Generate a secure random string (use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: The URL of your deployed app (e.g., `https://your-app-name.ondigitalocean.app`)
- `NEXT_PUBLIC_APP_URL`: Same as NEXTAUTH_URL, used by the bot for verification links
- `NODE_ENV`: Set to `production`
- `PORT`: Set to `8080` (Digital Ocean's default port)

### 4. Add a Database

1. In the Digital Ocean dashboard, go to "Databases"
2. Create a new PostgreSQL database cluster
3. Choose an appropriate plan
4. Once created, go to the "Connection" tab
5. Copy the connection string and add it as your `DATABASE_URL` environment variable

### 5. Deploy Your App

1. Review your configuration
2. Click "Launch App"
3. Wait for the build and deployment to complete

### 6. Verify Deployment

- Visit your app URL to confirm the website is working
- Check the logs to verify both the website and bot are running
- Test the Telegram bot by sending `/start` to your bot
- Test all functionality (browsing games, placing bids, generating verification codes, etc.)

## Combined Architecture

This deployment uses a combined server architecture where the Next.js web application and Telegram bot run in the same process. This approach has several benefits:

- **Cost-effective**: Only one Digital Ocean App Platform resource is needed
- **Simplified deployment**: Single codebase and deployment process
- **Shared resources**: Both the web app and bot use the same database connection
- **Unified logging**: All logs appear in the same stream for easier debugging

The `server.js` file handles:
1. Running database migrations on startup
2. Starting the Next.js web application
3. Initializing the Telegram bot in polling mode
4. Graceful shutdown of both services when needed

## Database Provider Configuration

The application uses the `DATABASE_PROVIDER` environment variable to determine which database to use:

- For PostgreSQL (production): Set `DATABASE_PROVIDER=postgresql`
- For SQLite (development): Set `DATABASE_PROVIDER=sqlite`

The migration script is designed to handle switching between providers automatically. When a provider switch is detected, it will:

1. Detect the mismatch between the current provider in `migration_lock.toml` and the desired provider
2. Run `prisma db push` with appropriate flags to adapt the schema safely
3. Continue with regular migrations

## Telegram Bot Operations

The Telegram bot runs alongside your web application in the same process. This ensures the bot stays online and shares resources with the website.

### Bot Architecture

- The bot uses the Telegraf library to interact with Telegram's API
- It runs in polling mode, which is more reliable for most deployments
- The bot automatically runs database migrations on startup
- Error handling and graceful shutdown are managed by the combined server

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
3. Look for any startup errors related to the bot in the logs
4. Check for database migration errors in the logs

## Maintenance

### Updating Your App

1. Push changes to your GitHub repository
2. Digital Ocean will automatically rebuild and deploy
3. Both the website and bot will be updated

### Database Backups

Set up automatic backups for your PostgreSQL database in the Digital Ocean dashboard.

## Additional Resources

- [Digital Ocean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment)
- [Telegraf Documentation](https://telegraf.js.org/)

## Support

For questions about Digital Ocean deployment, contact their support or refer to their documentation. 