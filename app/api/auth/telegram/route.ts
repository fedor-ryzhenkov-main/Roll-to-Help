/**
 * Telegram Auth API
 * 
 * This API endpoint generates verification codes for initiating Telegram authentication.
 */

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid'; 
import { addMinutes } from 'date-fns'; 

function generateVerificationCode(length = 6): string {
  return nanoid(length).toUpperCase(); 
}

export async function POST() {
  try {
    const verificationCode = generateVerificationCode();
    const codeExpiresMinutes = 10; 
    const expires = addMinutes(new Date(), codeExpiresMinutes);
    const channelId = nanoid(16); 


    console.log(`Generated verification code: ${verificationCode}, channelId: ${channelId}, expires: ${expires}`);

    return NextResponse.json({
      success: true,
      verificationCode,
      channelId,
    });
  } catch (error) {
    console.error('Error generating verification code:', error);
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