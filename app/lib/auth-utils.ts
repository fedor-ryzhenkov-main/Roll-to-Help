import { nanoid } from 'nanoid';
import { addMinutes } from 'date-fns';
import prisma from '@/app/lib/db';

const VERIFICATION_TOKEN_EXPIRY_MINUTES = 5;

/**
 * Generates and stores a verification token for NextAuth Telegram authentication
 * @param pendingVerificationId The ID of the pending verification record
 * @returns The generated token or null if an error occurs
 */
export async function generateAndStoreNextAuthToken(pendingVerificationId: string): Promise<string | null> {
    try {
        const token = nanoid(32);
        const expires = addMinutes(new Date(), VERIFICATION_TOKEN_EXPIRY_MINUTES);
        await prisma.pendingVerification.update({
            where: { id: pendingVerificationId },
            data: { verificationToken: token, expires: expires }
        });
        console.log(`[NextAuth Token Gen] Generated token for pendingVerificationId ${pendingVerificationId}, expires ${expires.toISOString()}`);
        return token;
    } catch (error) {
        console.error(`[NextAuth Token Gen] Error generating token for pendingVerificationId ${pendingVerificationId}:`, error);
        return null;
    }
} 