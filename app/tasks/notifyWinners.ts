/**
 * Task to notify auction winners when auctions end
 * This runs on a schedule to check for recently ended auctions and send notifications
 */

import { PrismaClient, Bid } from '@prisma/client';
import { sendTelegramMessage } from '../lib/telegram';

const prisma = new PrismaClient();

/**
 * Interface extending Bid to include nested User and Game data
 * required for notification processing.
 */
interface WinningBidWithDetails extends Bid {
  user: {
    id: string;
    telegramId: string | null;
    telegramFirstName: string | null;
  };
  game: {
    id: string;
    name: string;
    description: string | null;
  };
}

/**
 * Process ended auctions, identify all winning bids that haven't been notified,
 * group them by user, send a consolidated notification, and update their status.
 *
 * @returns {Promise<number>} Number of users notified.
 */
export async function processEndedAuctions(): Promise<number> {
  console.log(`[${new Date().toISOString()}] 🔍 Checking for ended auctions and unnotified winners`);

  // 1. Fetch all unnotified winning bids from ended events
  const unnotifiedWinningBids = await prisma.bid.findMany({
    where: {
      isWinning: true,      // Must be a winning bid
      notifiedAt: null,     // Must not have been notified yet
      user: {
        telegramId: { not: null } // User must have a Telegram ID to be notified
      },
      game: {
        event: {
          endDate: {
            lt: new Date(), // Event end date must be in the past
          },
          isActive: true, // Optionally, ensure the event is still considered active
        }
      }
    },
    include: {
      user: { // Include user details for notification
        select: {
          id: true,
          telegramId: true,
          telegramFirstName: true,
        }
      },
      game: { // Include game details for the message
        select: {
          id: true,
          name: true,
          description: true,
        }
      }
    },
    orderBy: { // Order games consistently within the notification
      game: {
        name: 'asc'
      }
    }
  }) as WinningBidWithDetails[]; // Type assertion for included relations

  if (unnotifiedWinningBids.length === 0) {
    console.log(`[${new Date().toISOString()}] ✅ No unnotified winners found for ended auctions.`);
    return 0;
  }

  console.log(`[${new Date().toISOString()}] 📊 Found ${unnotifiedWinningBids.length} unnotified winning bids to process.`);

  // 2. Group bids by user's Telegram ID
  const bidsByUser: Record<string, WinningBidWithDetails[]> = {};
  for (const bid of unnotifiedWinningBids) {
    // We already filtered for non-null telegramId in the query, but check again for type safety
    if (bid.user.telegramId) {
      if (!bidsByUser[bid.user.telegramId]) {
        bidsByUser[bid.user.telegramId] = [];
      }
      bidsByUser[bid.user.telegramId].push(bid);
    } else {
         console.warn(`[${new Date().toISOString()}] ⚠️ Skipping bid ${bid.id} due to missing telegramId on user ${bid.userId} - this should not happen based on query.`);
    }
  }

  let usersNotifiedCount = 0;
  const successfullyNotifiedBidIds: string[] = [];

  // 3. Iterate through users, build and send consolidated messages
  for (const telegramId in bidsByUser) {
    const userBids = bidsByUser[telegramId];
    if (userBids.length === 0) continue; // Should not happen, but safety first

    const user = userBids[0].user; // All bids belong to the same user
    const firstName = user.telegramFirstName || `User ${user.id.substring(0, 5)}`;

    // 4. Construct the detailed message
    let message = `🎉 Поздравляем, ${firstName}! 🎉\\n\\n`;
    if (userBids.length === 1) {
      message += `Вы выиграли аукцион на следующую игру:\\n\\n`;
    } else {
      message += `Вы выиграли аукционы на следующие игры:\\n\\n`;
    }

    userBids.forEach((bid, index) => {
      message += `${index + 1}. *${bid.game.name}*\\n`; // Use Markdown for bold game name
      if (bid.game.description) {
        // Optional: Add a snippet of the description, keeping message length reasonable
        const shortDesc = bid.game.description.length > 100 ? bid.game.description.substring(0, 97) + '...' : bid.game.description;
         message += `   _${shortDesc}_\\n`; // Use Markdown for italics description
      }
      message += `   Ваша ставка: *${bid.amount.toFixed(2)} ₾*\\n\\n`; // Use GEL symbol and format amount
    });

    message += 'Пожалуйста, свяжитесь с организаторами для оплаты и получения дополнительной информации о играх.\\n\\n';
    message += 'Спасибо за участие в благотворительном аукционе! 🙏';

    // 5. Send the message
    try {
        const messageSent = await sendTelegramMessage(telegramId, message, { parse_mode: 'Markdown' });

        if (messageSent) {
            console.log(`[${new Date().toISOString()}] 📱 Consolidated notification sent to winner ${firstName} (Telegram ID: ${telegramId}) for ${userBids.length} auctions.`);
            usersNotifiedCount++;
            // Collect IDs of bids successfully notified for this user
            userBids.forEach(bid => successfullyNotifiedBidIds.push(bid.id));
        } else {
            console.log(`[${new Date().toISOString()}] ⚠️ Failed to send consolidated notification to Telegram ID: ${telegramId}`);
        }
    } catch (error) {
         console.error(`[${new Date().toISOString()}] ❌ Error sending notification to ${telegramId}:`, error);
    }
  }

  // 6. Update notified status for all successfully processed bids in bulk
  if (successfullyNotifiedBidIds.length > 0) {
    try {
      const updateResult = await prisma.bid.updateMany({
        where: {
          id: { in: successfullyNotifiedBidIds }
        },
        data: {
          notifiedAt: new Date()
        }
      });
      console.log(`[${new Date().toISOString()}] ✅ Marked ${updateResult.count} bids as notified.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to update notifiedAt status for ${successfullyNotifiedBidIds.length} bids:`, error);
      // Consider adding retry logic or logging these IDs for manual intervention
    }
  }

  console.log(`[${new Date().toISOString()}] ✨ Finished processing notifications. Notified ${usersNotifiedCount} users.`);
  return usersNotifiedCount; // Return the count of users notified
} 