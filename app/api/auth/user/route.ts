/**
 * User Auth API
 * 
 * This API endpoint retrieves user information based on Telegram credentials.
 */

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get telegramId from query parameters
    const telegramId = request.nextUrl.searchParams.get('telegramId');
    
    if (!telegramId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Telegram ID is required' 
      }, { status: 400 });
    }
    
    // Find the user by Telegram ID
    const user = await prisma.user.findUnique({
      where: {
        telegramId,
      },
      select: {
        id: true,
        username: true,
        telegramId: true,
        telegramUsername: true,
        telegramFirstName: true,
        telegramLastName: true,
        isVerified: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Return the user data
    return NextResponse.json({ 
      success: true, 
      user
    });
  } catch (error) {
    console.error('Error retrieving user:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve user information' 
    }, { status: 500 });
  }
} 