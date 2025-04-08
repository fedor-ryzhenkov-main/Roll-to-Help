import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { HttpStatus, createErrorResponse, createSuccessResponse } from '@/app/lib/api-utils';

/**
 * GET /api/auth/telegram/verify-token
 * 
 * Verifies a one-time token received via WebSocket after successful Telegram verification.
 * Consumes the token upon successful verification.
 * Returns the full user object associated with the token.
 * 
 * Query Parameters:
 *  - token: The verificationToken string
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return createErrorResponse('Verification token is required', HttpStatus.BAD_REQUEST);
  }

  try {
    // Find the pending verification entry by the token using findFirst
    const verification = await prisma.pendingVerification.findFirst({
      where: { verificationToken: token },
    });

    // Check if token exists, is verified, and hasn't been consumed yet
    if (!verification || !verification.isVerified || !verification.verifiedUserId) {
      // Token not found, or wasn't properly verified by Telegram flow
      return createErrorResponse('Invalid or expired verification token', HttpStatus.UNAUTHORIZED);
    }

    // Security check: Ensure the token hasn't already been used (important!)
    // If verificationToken is null here, it means it was already consumed.
    if (verification.verificationToken !== token) {
         return createErrorResponse('Verification token already used', HttpStatus.UNAUTHORIZED);
    }

    // Consume the token by setting it to null
    // Use a transaction to ensure atomicity: find, verify, update
    const user = await prisma.$transaction(async (tx) => {
      // Re-fetch within transaction for safety using findFirst
      const currentVerification = await tx.pendingVerification.findFirst({
        where: { verificationToken: token },
      });

      // Double-check validity within transaction
      if (!currentVerification || !currentVerification.isVerified || !currentVerification.verifiedUserId || currentVerification.verificationToken !== token) {
        throw new Error('Invalid or consumed token detected during transaction');
      }

      // Consume the token
      await tx.pendingVerification.update({
        where: { id: currentVerification.id },
        data: { verificationToken: null }, // Set to null to consume
      });

      // Fetch the full user object
      const verifiedUser = await tx.user.findUnique({
        where: { id: currentVerification.verifiedUserId },
      });

      if (!verifiedUser) {
        throw new Error('Verified user not found during transaction');
      }
      
      return verifiedUser;
    });

    // Return the full user object (NextAuth's authorize function needs this)
    return createSuccessResponse({ user });

  } catch (error) {
    console.error('Error verifying token:', error);
    // Check if it's the specific error from the transaction
    if (error instanceof Error && error.message.includes('transaction')) {
        return createErrorResponse('Invalid or consumed verification token', HttpStatus.UNAUTHORIZED);
    }
    return createErrorResponse('Failed to verify token', HttpStatus.INTERNAL_SERVER_ERROR);
  }
} 