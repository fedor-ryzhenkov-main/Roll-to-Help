/**
 * Telegram Bot Functions
 * 
 * This module contains functions for handling various Telegram bot actions.
 */

// Import JWT library and date-fns for expiry check
const jwt = require('jsonwebtoken');
import { isBefore } from 'date-fns';

/**
 * Process verification codes sent by users
 * @param {Object} ctx - Telegram context
 * @param {string} text - Message text
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<boolean>} - True if handled as verification code, false otherwise
 */
const handleVerificationCode = async (ctx, text, prisma) => {
  try {
    // Check if the text looks like a verification code (alphanumeric, 6 chars)
    const isVerificationCode = /^[A-Z0-9]{6}$/.test(text);

    if (isVerificationCode) {
      const { id: fromId, username: telegramUsername, first_name: telegramFirstName, last_name: telegramLastName } = ctx.from;
      const telegramId = fromId.toString();

      console.log(`Processing verification code: ${text} for Telegram ID: ${telegramId}`);

      // 1. Find the pending verification entry
      const pending = await prisma.pendingVerification.findUnique({
        where: { verificationCode: text },
      });

      if (!pending) {
        console.log(`Verification code ${text} not found in pending table.`);
        await ctx.reply('❌ Invalid verification code. Please try again or generate a new code from the website.');
        return false;
      }

      // 2. Check if the code has expired
      if (isBefore(new Date(pending.expires), new Date())) {
        console.log(`Verification code ${text} has expired.`);
        // Clean up expired code
        await prisma.pendingVerification.delete({ where: { id: pending.id } });
        await ctx.reply('❌ This verification code has expired. Please generate a new code from the website.');
        return false;
      }

      // 3. Code is valid - Find or create the user
      const user = await prisma.user.upsert({
        where: {
          telegramId: telegramId,
        },
        update: { // Update existing user's details if they re-verify
          telegramUsername: telegramUsername,
          telegramFirstName: telegramFirstName,
          telegramLastName: telegramLastName,
          // telegramPhotoUrl: ctx.from.photo?.big_file_id, // Example: if you want to store photo
          isVerified: true,
          updatedAt: new Date(),
        },
        create: { // Create new user if they don't exist
          telegramId: telegramId,
          telegramUsername: telegramUsername,
          telegramFirstName: telegramFirstName,
          telegramLastName: telegramLastName,
          // telegramPhotoUrl: ctx.from.photo?.big_file_id,
          isVerified: true,
          // username: telegramUsername || `user_${telegramId}`, // Assign a default username if needed
        },
      });

      console.log(`User upserted: ${user.id}`);

      // 4. Generate a short-lived JWT login token
      const jwtSecret = process.env.NEXTAUTH_SECRET; // Use the same secret as NextAuth
      if (!jwtSecret) {
          console.error('JWT Secret (NEXTAUTH_SECRET) is not defined!');
          await ctx.reply('Sorry, a server configuration error occurred. Please contact support.');
          return false;
      }
      const loginTokenPayload = { userId: user.id };
      const loginToken = jwt.sign(loginTokenPayload, jwtSecret, { expiresIn: '5m' }); // Token valid for 5 minutes

      // 5. Construct the magic login link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
           console.error('App URL (NEXT_PUBLIC_APP_URL) is not defined!');
           await ctx.reply('Sorry, a server configuration error occurred (URL). Please contact support.');
           return false;
      }
      const magicLink = `${appUrl}/api/auth/callback/telegram?token=${loginToken}`;

      // 6. Delete the pending verification code
      await prisma.pendingVerification.delete({ where: { id: pending.id } });
      console.log(`Deleted pending verification code: ${text}`);

      // 7. Send success message with the magic link
      await ctx.replyWithMarkdown(
        `✅ Success! Your Telegram account has been linked.\n\nClick this link *within 5 minutes* to log in to the website:\n[Login to Roll to Help](${magicLink})`
      );

      return true;

    } // end if (isVerificationCode)

    return false; // Not a verification code pattern
  } catch (error) {
    console.error('Error handling verification code:', error);
    await ctx.reply('Sorry, there was an error processing your verification code. Please try again later.');
    return false;
  }
};

/**
 * Set up the /start command
 * @param {Telegraf} bot - Telegraf bot instance
 */
const setupStartCommand = (bot) => {
  bot.command('start', async (ctx) => {
    console.log('Start command received');
    const welcomeMessage = `
Welcome to Roll to Help! 🎲

This bot helps link your account to our website (${process.env.NEXT_PUBLIC_APP_URL || 'RollToHelp.com'}).

1. Go to the website and click "Login / Link Account".
2. Get the verification code.
3. Send the code here.
4. Click the login link you receive back.

Use /myauctions to view your active bids after logging in.
Use /help to get assistance.
    `;
    
    await ctx.reply(welcomeMessage);
  });
};

/**
 * Set up the /help command
 * @param {Telegraf} bot - Telegraf bot instance
 */
const setupHelpCommand = (bot) => {
  bot.command('help', async (ctx) => {
    console.log('Help command received');
    const helpMessage = `
Roll to Help Bot Commands:

/start - Get started and see instructions
/myauctions - View your current bids (requires linked account)
/help - Show this help message

To link your account:
1. Visit our website (${process.env.NEXT_PUBLIC_APP_URL || 'RollToHelp.com'})
2. Click "Login / Link Account"
3. Get the code and send it here
4. Click the login link you receive back

Need more assistance? Visit our website.
    `;
    
    await ctx.reply(helpMessage);
  });
};

/**
 * Set up the /register command (Now just provides instructions)
 * @param {Telegraf} bot - Telegraf bot instance
 */
const setupRegisterCommand = (bot, prisma) => {
  bot.command('register', async (ctx) => {
    console.log('Register command received - providing instructions');
    try {
      await ctx.reply(`
To link your Telegram account:

1. Visit our website at ${process.env.NEXT_PUBLIC_APP_URL || 'RollToHelp.com'}
2. Click "Login / Link Account"
3. Copy the verification code
4. Send the code here
5. Click the magic login link you receive back

This will log you into the website and allow you to place bids.
      `);
    } catch (error) {
      console.error('Error handling register command:', error);
      await ctx.reply('Sorry, there was an error. Please try again later.');
    }
  });
};

/**
 * Set up the /myauctions command
 * (Ensure this still works correctly after schema changes - userId is now String)
 * @param {Telegraf} bot - Telegraf bot instance
 * @param {PrismaClient} prisma - Prisma client instance
 */
const setupMyAuctionsCommand = (bot, prisma) => {
  bot.command('myauctions', async (ctx) => {
    console.log('My auctions command received for user:', ctx.from.id);
    try {
      const { id } = ctx.from;
      const telegramId = id.toString();

      // Find user by Telegram ID
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true, isVerified: true } // Select only necessary fields
      });

      if (!user) {
          await ctx.reply("Your Telegram account isn't linked yet. Please follow the instructions in /start or /register.");
          return;
      }

      // Note: isVerified check might be redundant if linking IS the login method,
      // but keep it for robustness in case of partial states.
      if (!user.isVerified) {
          await ctx.reply("Your Telegram account is not fully verified. Please complete the linking process using the code from the website.");
          return;
      }

      // Fetch active bids for this user using their internal ID (which is now a String)
      const now = new Date();
      const activeBids = await prisma.bid.findMany({
          where: {
              userId: user.id, // user.id is now a String CUID
              game: {
                  event: {
                      isActive: true,
                      eventDate: { 
                          gt: now // Ensure event date is in the future
                      }
                  }
              }
          },
          include: {
              game: { // Include game details
                  include: {
                      event: true // Include event details
                  }
              }
          },
          orderBy: {
              createdAt: 'desc' // Show most recent bids first
          }
      });

      if (!activeBids || activeBids.length === 0) {
        await ctx.reply('You have no active bids at the moment. Visit our website to place bids on games!');
        return;
      }

      // Format bid information
      let message = 'Your active bids:\n\n';

      for (const bid of activeBids) {
        const { game, amount, isWinning } = bid;
        const status = isWinning ? 'Currently Winning' : 'Submitted';

        message += `*${game.title}*\n`; // Use Markdown for formatting
        message += `  Amount: $${amount}\n`;
        message += `  Event: ${game.event.name} (ends ${new Date(game.event.eventDate).toLocaleString()})\n\n`;
      }

      message += '\nVisit our website to manage your bids!';

      // Send with Markdown parsing
      await ctx.replyWithMarkdown(message);
    } catch (error) {
      console.error('Error handling my auctions command:', error);
      await ctx.reply('Sorry, there was an error fetching your auctions. Please try again later.');
    }
  });
};

module.exports = {
  handleVerificationCode,
  setupStartCommand,
  setupHelpCommand,
  setupRegisterCommand,
  setupMyAuctionsCommand
}; 