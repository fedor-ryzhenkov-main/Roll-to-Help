import { NextRequest } from 'next/server';
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
    const verification = await prisma.pendingVerification.findFirst({
      where: { verificationToken: token },
    });

    if (!verification || !verification.isVerified || !verification.verifiedUserId) {
      return createErrorResponse('Invalid or expired verification token', HttpStatus.UNAUTHORIZED);
    }

    if (verification.verificationToken !== token) {
         return createErrorResponse('Verification token already used', HttpStatus.UNAUTHORIZED);
    }

    const user = await prisma.$transaction(async (tx) => {
      const currentVerification = await tx.pendingVerification.findFirst({
        where: { verificationToken: token },
      });

      if (!currentVerification || !currentVerification.isVerified || !currentVerification.verifiedUserId || currentVerification.verificationToken !== token) {
        throw new Error('Invalid or consumed token detected during transaction');
      }

      await tx.pendingVerification.update({
        where: { id: currentVerification.id },
        data: { verificationToken: null }, 
      });

      const verifiedUser = await tx.user.findUnique({
        where: { id: currentVerification.verifiedUserId },
      });

      if (!verifiedUser) {
        throw new Error('Verified user not found during transaction');
      }
      
      return verifiedUser;
    });

    return createSuccessResponse({ user });

  } catch (error) {
    console.error('Error verifying token:', error);
    if (error instanceof Error && error.message.includes('transaction')) {
        return createErrorResponse('Invalid or consumed verification token', HttpStatus.UNAUTHORIZED);
    }
    return createErrorResponse('Failed to verify token', HttpStatus.INTERNAL_SERVER_ERROR);
  }
} 