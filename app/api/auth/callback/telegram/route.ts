import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers'; // Import cookies
import { encode } from 'next-auth/jwt'; // Use NextAuth's encode function
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Import authOptions
import prisma from '@/app/lib/db';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const jwtSecret = process.env.NEXTAUTH_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '/';

  if (!token) {
    console.error('Magic link callback: No token provided');
    // Redirect to an error page or home page with an error message
    return NextResponse.redirect(`${appUrl}/?error=InvalidLoginLink`);
  }

  if (!jwtSecret) {
      console.error('Magic link callback: JWT Secret (NEXTAUTH_SECRET) is not defined!');
      return NextResponse.redirect(`${appUrl}/?error=ServerError`);
  }

  try {
    // 1. Verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; iat: number; exp: number };
    const userId = decoded.userId;

    console.log(`Magic link callback: Token verified for userId: ${userId}`);

    // 2. Fetch the full user object from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
        console.error(`Magic link callback: User not found for ID: ${userId}`);
        return NextResponse.redirect(`${appUrl}/?error=UserNotFound`);
    }

    // 3. Manually create the NextAuth.js session token (JWT strategy)
    //    We need to structure the token payload similarly to how NextAuth does it in the jwt callback
    const sessionTokenPayload = {
        id: user.id,
        name: user.name || user.telegramFirstName || user.username,
        email: user.email,
        image: user.image,
        isVerified: user.isVerified,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        username: user.username,
        // Add standard JWT claims that NextAuth might expect
        sub: user.id, // Subject claim is typically the user ID
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // Example: 30 days expiry
    };

    // 4. Encode the token using NextAuth's logic
    const sessionToken = await encode({
        secret: jwtSecret,
        token: sessionTokenPayload,
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    // 5. Set the session cookie
    // Determine cookie name (usually based on secure prefix)
    const isSecure = appUrl.startsWith('https://');
    const cookiePrefix = isSecure ? '__Secure-' : '';
    const sessionCookieName = `${cookiePrefix}next-auth.session-token`;

    cookies().set(sessionCookieName, sessionToken, {
        httpOnly: true,
        secure: isSecure,
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        sameSite: 'lax',
    });

    console.log(`Magic link callback: Session cookie set for user: ${user.id}`);

    // 6. Redirect user to the homepage (or a dashboard)
    return NextResponse.redirect(appUrl);

  } catch (error) {
    console.error('Magic link callback error:', error);
    if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.redirect(`${appUrl}/?error=LoginLinkExpired`);
    }
    if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.redirect(`${appUrl}/?error=InvalidLoginLink`);
    }
    return NextResponse.redirect(`${appUrl}/?error=LoginFailed`);
  }
} 