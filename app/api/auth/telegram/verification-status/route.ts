/**
 * API endpoint to check verification status
 * The frontend will poll this endpoint to see if a code has been verified
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { logApiError } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get verificationCode from URL params
    const searchParams = request.nextUrl.searchParams;
    const verificationCode = searchParams.get('code');

    if (!verificationCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Verification code is required' 
      }, { status: 400 });
    }

    // Find the verification record
    const verification = await prisma.pendingVerification.findUnique({
      where: { verificationCode },
      select: {
        isVerified: true,
        expires: true,
        verificationToken: true
      }
    });

    if (!verification) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid verification code'
      }, { status: 404 });
    }

    // Check if expired
    if (verification.expires < new Date()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Verification code has expired',
        status: 'expired'
      });
    }

    // Return status and token if verified
    return NextResponse.json({
      success: true,
      verified: verification.isVerified,
      // Only include the token if the verification is complete
      nextAuthToken: verification.isVerified ? verification.verificationToken : null
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    logApiError('/api/auth/telegram/verification-status', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check verification status'
    }, { status: 500 });
  }
} 