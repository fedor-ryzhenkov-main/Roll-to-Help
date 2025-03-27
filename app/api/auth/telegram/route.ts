/**
 * Telegram Auth API
 * 
 * This API endpoint generates verification codes for Telegram authentication.
 */

import { NextResponse, NextRequest } from 'next/server';
import { generateVerificationCode } from '@/app/lib/telegram';
import prisma from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Extract data from request
    const data = await request.json();
    const { username } = data;
    
    if (!username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username is required' 
      }, { status: 400 });
    }
    
    // Generate a verification code
    const verificationCode = generateVerificationCode();
    
    // Create or update a user with this verification code
    const user = await prisma.user.upsert({
      where: {
        username,
      },
      update: {
        verificationCode,
        isVerified: false, // Reset verification if they're re-authenticating
      },
      create: {
        username,
        verificationCode,
        isVerified: false,
      },
    });
    
    // Return the verification code
    return NextResponse.json({ 
      success: true, 
      verificationCode,
      userId: user.id
    });
  } catch (error) {
    console.error('Error generating verification code:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate verification code' 
    }, { status: 500 });
  }
} 