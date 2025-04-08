# Security Guide

This document outlines the security measures implemented in the application and provides guidance for maintaining security best practices.

## Security Features

### API Security

1. **CSRF Protection**
   - All mutating API requests (POST, PUT, DELETE) are protected by CSRF tokens.
   - Tokens are generated on the server and sent to the client as cookies.
   - The client must include the token in the `X-CSRF-Token` header for all mutating requests.
   - Implementation: 
     - Server-side middleware in `app/middleware.ts` generates tokens.
     - Client-side utilities in `app/utils/csrf.ts` handle token management.
     - The `app/utils/api-client.ts` automatically includes CSRF tokens in requests.

2. **Rate Limiting**
   - All API endpoints are protected by rate limiting to prevent abuse.
   - Different limits are applied based on endpoint sensitivity:
     - Standard endpoints: 60 requests per minute
     - High-security endpoints (authentication, bidding): 20 requests per minute
   - Implementation: `app/lib/api-middleware.ts` provides the rate limiting functionality.

3. **Input Validation**
   - All API input is validated using Zod schemas to prevent injection attacks.
   - Input sanitization is applied to prevent XSS and other code injection attacks.
   - Example implementation in `app/api/bids/route.ts`.

### Authentication and Authorization

1. **JWT-based Authentication**
   - Uses NextAuth.js for secure authentication handling.
   - Tokens include expiration times and are validated on each request.
   - Implementation: `app/lib/api-middleware.ts` includes token validation.

2. **Role-based Authorization**
   - Different user roles (user, admin) have different access levels.
   - Authorization checks in API middleware validate access rights.

3. **Telegram Integration Security**
   - Webhook verification ensures only legitimate Telegram servers can call the webhook endpoint.
   - Secret tokens are used to authenticate webhook requests.
   - Implementation: `app/api/telegram-webhook/route.ts`.

### HTTP Security Headers

1. **Content Security Policy (CSP)**
   - Restricts which resources can be loaded to prevent XSS attacks.
   - Implementation: `app/middleware.ts` sets CSP headers on all responses.

2. **Other Security Headers**
   - X-Content-Type-Options: Prevents MIME type sniffing
   - X-Frame-Options: Prevents clickjacking
   - X-XSS-Protection: Provides browser-level XSS protection
   - Referrer-Policy: Controls information sent in the Referer header
   - Permissions-Policy: Restricts which browser features the application can use
   - Implementation: `app/middleware.ts` and `app/lib/api-middleware.ts`.

## Database Security

1. **Parameterized Queries**
   - All database queries use Prisma's parameterized queries to prevent SQL injection.
   - Never use string interpolation for database queries.

2. **Least Privilege Access**
   - Database users in production should have only the permissions they need.
   - Follow the principle of least privilege for database connections.

## Production Security Checklist

Before deploying to production, ensure the following are configured:

1. **Environment Variables**
   - `NEXTAUTH_SECRET`: A strong, random secret for JWT signing
   - `TELEGRAM_BOT_TOKEN`: Telegram bot token (keep secure)
   - `TELEGRAM_WEBHOOK_SECRET`: Secret for validating Telegram webhook requests
   - `DATABASE_URL`: Database connection string (with password)

2. **HTTPS**
   - Always use HTTPS in production.
   - Digital Ocean App Platform provides HTTPS by default.

3. **Database Configuration**
   - Enable SSL for database connections in production.
   - Use strong passwords for database access.
   - Regularly back up the database.

4. **Monitoring and Logging**
   - Enable error logging to detect and respond to security issues.
   - Monitor for unusual patterns that might indicate attacks.

## Security Update Process

1. **Dependency Management**
   - Regularly update dependencies to patch security vulnerabilities.
   - Run `npm audit` frequently to check for known vulnerabilities.

2. **Security Patching**
   - Have a process for quickly applying security patches.
   - Test patches thoroughly before applying to production.

3. **Incident Response**
   - Document the process for addressing security incidents.
   - Have contact information for the security team readily available.

## Final Recommendations

1. **Regular Security Audits**
   - Conduct periodic reviews of the codebase for security issues.
   - Consider using automated security scanning tools.

2. **Developer Training**
   - Ensure all developers are familiar with security best practices.
   - Maintain this document as a living guide to security in the application.

3. **Security Testing**
   - Include security tests in the CI/CD pipeline.
   - Test for common vulnerabilities like XSS, CSRF, and injection attacks. 