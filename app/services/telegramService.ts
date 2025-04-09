/**
 * Telegram Service
 * Handles Telegram bot interactions and user verification
 */

import { PrismaClient, User, Game, Bid } from '@prisma/client';
import { getCreatureNameForUser } from '@/app/utils/creatureNames';
import { CURRENCY_SYMBOL } from '@/app/config/constants';
import { logApiError } from '@/app/lib/api-utils';
import { getBotInstance } from '@/app/lib/telegram';
import { generateAndStoreNextAuthToken } from '@/app/lib/auth-utils';

const prisma = new PrismaClient();

// Define a type for Game that includes the specific bid info needed
type GameWithWinningBid = Game & {
  bids?: (Pick<Bid, 'isWinning' | 'userId' | 'amount'>)[]; // Make bids optional and pick needed fields
};

/**
 * Get user by Telegram ID
 */
export async function getUserByTelegramId(telegramId: string) {
  return await prisma.user.findUnique({
    where: { telegramId },
  });
}

/**
 * Formats a message with user's winning bids
 * @param user The user object
 * @param games List of games the user won (must include bids)
 * @returns Formatted message
 */
export function formatWinningBidsMessage(user: User, games: GameWithWinningBid[]): string {
  const creatureName = getCreatureNameForUser(user.id);
  const firstName = user.telegramFirstName || creatureName;
  
  let message = `🎉 Поздравляем, ${firstName}! 🎉\n\n`;
  message += `Вы выиграли аукцион${games.length > 1 ? 'ы' : ''} на следующие игры:\n\n`;
  
  games.forEach((game, index) => {
    message += `${index + 1}. *${game.name}*\n`;
    
    if (game.description) {
      message += `   ${game.description}\n`;
    }
    
    const winningBid = game.bids?.find((bid: Pick<Bid, 'isWinning' | 'userId' | 'amount'>) => bid.isWinning && bid.userId === user.id);
    if (winningBid) {
      message += `   Ставка: ${winningBid.amount.toFixed(2)} ${CURRENCY_SYMBOL}\n`;
    }
    
    message += '\n';
  });
  
  message += 'Пожалуйста, свяжитесь с организаторами для оплаты и получения дополнительной информации о играх.\n\n';
  message += 'Спасибо за участие в благотворительном аукционе! 🙏';
  
  return message;
}

/**
 * Sends notifications to auction winners
 * IMPORTANT: The caller must ensure the Game objects in winnersMap include the necessary bid information.
 * @param winnersMap Map of telegram IDs to games they won
 */
// Note: The type here remains Game[], responsibility is on the caller
export async function notifyAuctionWinners(winnersMap: Record<string, Game[]>): Promise<void> {
  const bot = getBotInstance();
  if (!bot) {
      console.error('[notifyAuctionWinners] Cannot send notification: Bot not initialized.');
      return;
  }

  for (const [telegramId, games] of Object.entries(winnersMap)) {
    if (!telegramId) continue;
    
    try {
      const user = await prisma.user.findFirst({ where: { telegramId } });
      if (!user) {
        console.error(`User with Telegram ID ${telegramId} not found`);
        continue;
      }
      
      // Cast needed here because the function expects GameWithWinningBid
      // This relies on the CALLER providing the correct data structure.
      const message = formatWinningBidsMessage(user, games as GameWithWinningBid[]); 
      
      // Send the message
      await bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown'
      });
      
      // Mark notifications as sent
      const gameIds = games.map(game => game.id);
      await prisma.bid.updateMany({
        where: {
          gameId: { in: gameIds },
          userId: user.id,
          isWinning: true,
          notifiedAt: null
        },
        data: {
          notifiedAt: new Date()
        }
      });
      
      console.log(`Notification sent to user ${user.id} (Telegram ID: ${telegramId}) for ${games.length} games`);
    } catch (error) {
      console.error(`Error sending notification to Telegram ID ${telegramId}:`, error);
    }
  }
}

/**
 * Finds or creates a User based on Telegram info.
 * Returns the User object.
 */
async function findOrCreateUserByTelegram(telegramId: string, telegramContext?: { first_name?: string; username?: string; last_name?: string; photo_url?: string }) {
  let user = await prisma.user.findUnique({
    where: { telegramId: telegramId },
  });

  if (!user) {
    // Create user if they don't exist
    user = await prisma.user.create({
      data: {
        telegramId: telegramId,
        telegramFirstName: telegramContext?.first_name,
        telegramLastName: telegramContext?.last_name, // Assuming context might have this
        telegramUsername: telegramContext?.username,
        telegramPhotoUrl: telegramContext?.photo_url, // Assuming context might have this
      },
    });
    console.log(`Created new user for Telegram ID: ${telegramId}`);
  } else {
    // Optionally update existing user info (e.g., if username changed)
    // For simplicity, we'll skip the update here, but you could add it.
    console.log(`Found existing user for Telegram ID: ${telegramId}`);
  }
  return user;
}

// Define return type for the service function
interface LinkResult {
    success: boolean;
    reason?: 'invalid' | 'already_verified' | 'expired' | 'db_error' | 'internal_error' | 'token_error';
    pendingVerificationId?: string; // Pass this back to generate token
    user?: {
      id: string;
      telegramFirstName?: string | null;
      telegramUsername?: string | null;
    };
    nextAuthToken?: string | null; // The temporary token for NextAuth sign-in
}

/**
 * Finds a pending verification by code, links the telegramId TO A USER,
 * generates a temporary NextAuth token, and returns status.
 * @param code Verification code sent by the user
 * @param telegramId Telegram ID of the user sending the code
 * @param telegramContext Optional context to get user's name/username
 * @returns Object indicating success/failure and relevant data/reason.
 */
export async function linkTelegramToVerificationCode(
    code: string,
    telegramId: string,
    telegramContext?: { first_name?: string; username?: string; last_name?: string; photo_url?: string }
): Promise<LinkResult> {
  let verificationId: string | undefined;
  try {
    const verification = await prisma.pendingVerification.findUnique({
      where: { verificationCode: code },
    });
    verificationId = verification?.id;

    // Basic validation
    if (!verification) {
      return { success: false, reason: 'invalid' };
    }
    if (verification.isVerified) {
      return { success: false, reason: 'already_verified' };
    }
    // Use expires field directly
    if (verification.expires < new Date()) { 
      try {
         await prisma.pendingVerification.delete({ where: { id: verification.id } });
      } catch (delError) {
         console.error(`Failed to delete expired verification code ${code}:`, delError);
         logApiError('telegram-delete-expired-code', delError, { code });
      }
      return { success: false, reason: 'expired' };
    }

    // --- Link to User --- 
    const user = await findOrCreateUserByTelegram(telegramId, telegramContext);
    // ---------------------

    // Update PendingVerification (mark as verified, store userId)
    // We will generate and store the nextAuth token separately AFTER this update
    await prisma.pendingVerification.update({
      where: { id: verification.id },
      data: {
        isVerified: true,
        telegramId: telegramId,
        verifiedUserId: user.id,
        verificationToken: null, // Ensure any old token is cleared initially
      },
    });

    // --- Generate and Store NextAuth Token ---
    const nextAuthToken = await generateAndStoreNextAuthToken(verification.id);
    if (!nextAuthToken) {
        logApiError('telegram-link-code', new Error('Failed to generate NextAuth token'), { verificationId: verification.id, userId: user.id });
        // Provide a specific reason for token generation failure
        return { 
            success: false, 
            reason: 'token_error',
            user: { id: user.id, telegramFirstName: user.telegramFirstName, telegramUsername: user.telegramUsername } 
        };
    }
    // ---------------------------------------

    // Prepare user details for return
    const userInfo = {
        id: user.id,
        telegramFirstName: user.telegramFirstName,
        telegramUsername: user.telegramUsername,
    };

    // Return success with user info and token (we no longer need channelId)
    return {
        success: true,
        user: userInfo,
        nextAuthToken: nextAuthToken,
    };

  } catch (error) {
    logApiError('telegram-link-code', error, { code, telegramId, verificationId });
    return { success: false, reason: 'internal_error' };
  }
} 