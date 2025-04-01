/**
 * Verification Status API
 * 
 * This API endpoint allows the client to check if a verification code has been processed.
 * The frontend will poll this endpoint after generating a verification code.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { encode } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  // Get verification code from the query parameters
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ 
      success: false, 
      error: 'Verification code is required' 
    }, { status: 400 });
  }
  
  try {
    // Look for a verified user with this code in the PendingVerification table
    const verification = await prisma.pendingVerification.findUnique({
      where: { verificationCode: code },
      include: { verifiedUser: true } // Include the relation to the verified user
    });
    
    // If verification doesn't exist or doesn't have a verifiedUser, it's not verified yet
    if (!verification || !verification.verifiedUser) {
      return NextResponse.json({ 
        success: true, 
        verified: false 
      });
    }
    
    // User has been verified! Create a session token
    const user = verification.verifiedUser;
    const jwtSecret = process.env.NEXTAUTH_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT Secret (NEXTAUTH_SECRET) is not defined!');
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error' 
      }, { status: 500 });
    }
    
    // Create session token (similar to api/auth/callback/telegram/route.ts)
    const sessionTokenPayload = {
      id: user.id,
      name: user.name || user.telegramFirstName || user.username,
      email: user.email,
      picture: user.image,
      isVerified: user.isVerified,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      username: user.username,
      // Add standard JWT claims that NextAuth might expect
      sub: user.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days expiry
    };
    
    // Encode the token using NextAuth's logic
    const sessionToken = await encode({
      secret: jwtSecret,
      token: sessionTokenPayload,
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });
    
    // Set the session cookie
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const isSecure = appUrl.startsWith('https://');
    const cookiePrefix = isSecure ? '__Secure-' : '';
    const sessionCookieName = `${cookiePrefix}next-auth.session-token`;
    
    // Delete the pending verification since it's been used
    await prisma.pendingVerification.delete({ where: { id: verification.id } });
    
    // Return success with the session token
    const response = NextResponse.json({ 
      success: true, 
      verified: true,
      user: {
        id: user.id,
        username: user.username,
        telegramUsername: user.telegramUsername,
        telegramFirstName: user.telegramFirstName,
        isVerified: user.isVerified
      }
    });
    
    // Set the cookie
    response.cookies.set(sessionCookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      sameSite: 'lax',
    });
    
    return response;
  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check verification status' 
    }, { status: 500 });
  }
} 