/**
 * Telegram Auth API
 * 
 * This API endpoint generates verification codes for initiating Telegram authentication.
 */

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid'; 
import { addMinutes } from 'date-fns'; 
import prisma from '@/app/lib/db';
import { logApiError } from '@/app/lib/api-utils';

function generateVerificationCode(length = 6): string {
  return nanoid(length).toUpperCase(); 
}

export async function POST() {
  try {
    const verificationCode = generateVerificationCode();
    const codeExpiresMinutes = 10; 
    const expires = addMinutes(new Date(), codeExpiresMinutes);

    // Create a record in the database to store the verification code
    const pendingVerification = await prisma.pendingVerification.create({
      data: {
        verificationCode,
        expires,
        isVerified: false
      }
    });

    console.log(`Generated verification code: ${verificationCode}, expires: ${expires}`);

    return NextResponse.json({
      success: true,
      verificationCode,
    });
  } catch (error) {
    console.error('Error generating verification code:', error);
    logApiError('/api/auth/telegram', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') { 
         return NextResponse.json({ 
             success: false, 
             error: 'Failed to generate unique code, please try again.' 
         }, { status: 500 });
    }
    return NextResponse.json({
      success: false,
      error: 'Failed to generate verification code'
    }, { status: 500 });
  }
} 