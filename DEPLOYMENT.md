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
3. Setting up the Telegram bot webhook
4. Graceful shutdown when needed

## Database Configuration

The application uses PostgreSQL as its database provider. For local development, you can use SQLite by modifying the schema.prisma file, but the production deployment will use PostgreSQL.

Make sure to provide the correct PostgreSQL connection string in the `DATABASE_URL` environment variable.

## Telegram Bot Operations

The Telegram bot runs alongside your web application using a webhook-based approach, which is more reliable for cloud deployments like Digital Ocean.

### Bot Architecture

- The bot uses the Telegraf library to interact with Telegram's API
- **Webhook mode**: Instead of polling, the bot uses webhooks, which is more suitable for cloud environments
- Updates from Telegram are received through the `/api/telegram-webhook` endpoint
- Error handling and graceful shutdown are managed by the combined server

### How Webhook Mode Works

1. When the server starts, it registers a webhook URL with Telegram
2. Telegram sends updates (messages, commands) to the webhook URL
3. The Next.js API endpoint processes these updates and responds to users
4. This approach is more reliable in environments like Digital Ocean that may restrict persistent connections

### Testing the Bot

1. Find your bot on Telegram (using the username you registered with BotFather)
2. Send `/start` to begin interacting with the bot
3. Test the verification process:
   - Generate a code on the website
   - Send the code to the bot
   - Verify that your account is linked

### Webhook Troubleshooting

If the bot isn't responding:
1. Check the app logs in Digital Ocean
2. Run the webhook utility to check status: `npm run bot:webhook check`
3. Verify the `TELEGRAM_BOT_TOKEN` and `NEXT_PUBLIC_APP_URL` are correct
4. Ensure your app URL is publicly accessible (Telegram needs to reach it)
5. Try manually setting up the webhook: `npm run bot:webhook`

### Webhook vs Polling

- **Webhook mode** (current implementation): More reliable for cloud environments, doesn't require a persistent connection
- **Polling mode** (alternative): Better for local development, requires a constant connection to Telegram

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
- [Telegram Bot Webhook Documentation](https://core.telegram.org/bots/api#setwebhook)

## Support

For questions about Digital Ocean deployment, contact their support or refer to their documentation. 