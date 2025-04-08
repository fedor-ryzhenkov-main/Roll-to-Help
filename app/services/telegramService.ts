/**
 * Telegram Service
 * Handles Telegram bot interactions and user verification
 */

import { Telegraf, Context } from 'telegraf';
import { PrismaClient, User, Game } from '@prisma/client';
import { getCreatureNameForUser } from '@/app/utils/creatureNames';
import { CURRENCY_SYMBOL } from '@/app/config/constants';
import { logApiError } from '@/app/lib/api-utils';
import { bot } from '@/app/lib/telegram';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days
// Remove unused Telegraf instance
// const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || ''); 

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
 * @param userId User ID to get animal name for
 * @param games List of games the user won
 * @returns Formatted message
 */
export function formatWinningBidsMessage(user: User, games: Game[]): string {
  const creatureName = getCreatureNameForUser(user.id);
  const firstName = user.telegramFirstName || creatureName;
  
  let message = `🎉 Поздравляем, ${firstName}! 🎉\n\n`;
  message += `Вы выиграли аукцион${games.length > 1 ? 'ы' : ''} на следующие игры:\n\n`;
  
  games.forEach((game, index) => {
    message += `${index + 1}. *${game.name}*\n`;
    
    if (game.description) {
      message += `   ${game.description}\n`;
    }
    
    const winningBid = game.bids?.find(bid => bid.isWinning && bid.userId === user.id);
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
 * @param winnersMap Map of telegram IDs to games they won
 */
export async function notifyAuctionWinners(winnersMap: Record<string, Game[]>): Promise<void> {
  for (const [telegramId, games] of Object.entries(winnersMap)) {
    if (!telegramId) continue;
    
    try {
      // Fetch the user to get their name
      const user = await prisma.user.findFirst({
        where: { telegramId }
      });
      
      if (!user) {
        console.error(`User with Telegram ID ${telegramId} not found`);
        continue;
      }
      
      // Format the message
      const message = formatWinningBidsMessage(user, games);
      
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
// Remove the `message` property, add a `reason` for failures
interface LinkResult {
    success: boolean; 
    reason?: 'invalid' | 'already_verified' | 'expired' | 'no_channel' | 'db_error' | 'internal_error';
    channelId?: string | null; 
    user?: { 
      id: string; 
      telegramFirstName?: string | null; // Use consistent naming
      telegramUsername?: string | null; 
      // Add other relevant fields if needed (e.g., isAdmin, isVerified)
    }; 
    sessionId?: string; 
}

/**
 * Finds a pending verification by code, links the telegramId TO A USER,
 * creates a server-side session in the DB, and returns info needed by webhook/WS.
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
  try {
    const verification = await prisma.pendingVerification.findUnique({
      where: { verificationCode: code },
    });

    // Basic validation
    if (!verification) {
      return { success: false, reason: 'invalid' }; // Return reason instead of message
    }
    if (verification.isVerified) {
      // No need to distinguish who verified it here, just that it's done
      return { success: false, reason: 'already_verified' }; 
    }
    if (verification.expires < new Date()) {
      // Attempt to delete expired code, but proceed to return failure regardless
      try {
         await prisma.pendingVerification.delete({ where: { id: verification.id } });
      } catch (delError) {
         console.error(`Failed to delete expired verification code ${code}:`, delError);
         logApiError('telegram-delete-expired-code', delError, { code });
      }
      return { success: false, reason: 'expired' };
    }
    if (!verification.channelId) {
        logApiError('telegram-link-code', new Error('Missing channelId in PendingVerification'), { code });
        return { success: false, reason: 'no_channel' };
    }
    
    // --- Link to User --- 
    const user = await findOrCreateUserByTelegram(telegramId, telegramContext);
    // ---------------------

    // --- Create Session in DB --- 
    const sessionId = nanoid(32); 
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_SECONDS * 1000); 
    try {
        await prisma.session.create({
          data: {
            sessionId: sessionId,
            userId: user.id,
            expiresAt: expiresAt,
          }
        });
        console.log(`Session created in DB for user ${user.id} with sessionId ${sessionId}`);
    } catch (dbError) {
        logApiError('telegram-link-code', new Error('Failed to store session in DB'), { userId: user.id });
        console.error('[DB Error] Failed to create session:', dbError);
        return { success: false, reason: 'db_error' };
    }
    // ---------------------

    // Update PendingVerification
    await prisma.pendingVerification.update({
      where: { id: verification.id },
      data: {
        isVerified: true,
        telegramId: telegramId, 
        verificationToken: null, 
        verifiedUserId: user.id, 
      },
    });

    // Prepare user details 
    const userInfo = {
        id: user.id,
        firstName: user.telegramFirstName,
        telegramUsername: user.telegramUsername,
    };

    // Return success and data
    return { 
        success: true, 
        // No message property needed here
        channelId: verification.channelId, 
        user: userInfo, 
        sessionId: sessionId 
    };

  } catch (error) {
    logApiError('telegram-link-code', error, { code, telegramId });
    return { success: false, reason: 'internal_error' }; // Generic internal error reason
  }
} 