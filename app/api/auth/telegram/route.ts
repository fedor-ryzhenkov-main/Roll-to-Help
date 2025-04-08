/**
 * Telegram Auth API
 * 
 * This API endpoint generates verification codes for initiating Telegram authentication.
 */

import { NextResponse, NextRequest } from 'next/server';
import { nanoid } from 'nanoid'; // Using nanoid for verification codes
import prisma from '@/app/lib/db';
import { addMinutes } from 'date-fns'; // For setting expiry

// Function to generate a verification code (moved here for locality)
function generateVerificationCode(length = 6): string {
  return nanoid(length).toUpperCase(); // Generate a 6-character uppercase code
}

export async function POST(request: NextRequest) {
  try {
    const verificationCode = generateVerificationCode();
    const codeExpiresMinutes = 10; // Code valid for 10 minutes
    const expires = addMinutes(new Date(), codeExpiresMinutes);
    const channelId = nanoid(16); // Generate a 16-character unique ID

    // Store only code, channelId, expires
    const pending = await prisma.pendingVerification.create({
      data: {
        verificationCode: verificationCode,
        expires: expires,
        channelId: channelId,
      },
    });

    console.log(`Generated verification code: ${verificationCode}, channelId: ${channelId}, expires: ${expires}`);

    return NextResponse.json({
      success: true,
      verificationCode,
      channelId,
    });
  } catch (error) {
    console.error('Error generating verification code:', error);
    // Handle potential unique constraint errors if code generation collides (rare)
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