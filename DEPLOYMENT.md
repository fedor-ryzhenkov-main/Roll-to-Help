# Deployment Guide - Digital Ocean

This guide will help you deploy the Tabletop Charity Event website to Digital Ocean's App Platform.

## Prerequisites

- A [Digital Ocean](https://www.digitalocean.com/) account
- Your project code pushed to a GitHub repository
- Node.js 18+ installed locally

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
- Set the run command to: `npm start`
- Choose an appropriate plan (Starter or Basic tier should be sufficient)

#### Environment Variables
Add the following environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string (you'll get this in step 4)
- `NEXTAUTH_SECRET`: Generate a secure random string (use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: The URL of your deployed app (e.g., `https://your-app-name.ondigitalocean.app`)
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

### 6. Run Database Migrations

After deployment, you need to run your database migrations:

1. In the App Platform, go to your app
2. Click on the "Console" tab
3. Run: `npx prisma migrate deploy`
4. Optionally run: `npm run db:seed` to populate initial data

### 7. Verify Deployment

- Visit your app URL to confirm it's working
- Check the logs for any errors
- Test all functionality (browsing games, placing bids, etc.)

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify your `DATABASE_URL` is correctly formatted
   - Make sure your database allows connections from your app (check firewall settings)

2. **Build Failures**
   - Check the build logs for errors
   - Ensure all dependencies are properly listed in package.json

3. **Runtime Errors**
   - Check the app logs for details
   - Verify all environment variables are set correctly

## Maintenance

### Updating Your App

1. Push changes to your GitHub repository
2. Digital Ocean will automatically rebuild and deploy

### Database Backups

Set up automatic backups for your PostgreSQL database in the Digital Ocean dashboard.

## Additional Resources

- [Digital Ocean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment)

## Support

For questions about Digital Ocean deployment, contact their support or refer to their documentation. 