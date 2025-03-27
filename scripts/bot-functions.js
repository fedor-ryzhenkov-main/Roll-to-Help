/**
 * Telegram Bot Functions
 * 
 * This module contains functions for handling various Telegram bot actions.
 */

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
      const { id } = ctx.from;
      const telegramId = id.toString();
      
      console.log(`Processing verification code: ${text} for Telegram ID: ${telegramId}`);
      
      // Try to verify the user with the code
      const user = await prisma.user.updateMany({
        where: {
          verificationCode: text,
          isVerified: false,
        },
        data: {
          telegramId,
          telegramUsername: ctx.from.username,
          telegramFirstName: ctx.from.first_name,
          telegramLastName: ctx.from.last_name,
          isVerified: true,
          verificationCode: null,
        },
      });
      
      console.log(`Verification result:`, user);
      
      if (user.count > 0) {
        await ctx.reply('✅ Success! Your Telegram account has been linked to Roll to Help. You can now place bids and receive notifications.');
        
        // Find their user record to get more details
        const userDetails = await prisma.user.findUnique({
          where: { telegramId },
        });
        
        if (userDetails) {
          // Send a welcome message with additional info
          await ctx.reply(`Welcome, ${userDetails.telegramFirstName || 'there'}! Your account is now verified and ready to use. Visit our website to start bidding on games.`);
        }
        
        return true;
      } else {
        await ctx.reply('❌ Invalid or expired verification code. Please try again or generate a new code from the website.');
        return false;
      }
    }
    
    return false;
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

This bot will help you participate in our charity tabletop gaming events.

Use /register to link your Telegram account with our website.
Use /myauctions to view your active bids.
Use /help to get assistance.

Thank you for supporting our charity events!
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

/start - Get started with the bot
/register - Link your Telegram account to the website
/myauctions - View your current bids
/help - Show this help message

Need more assistance? Visit our website or contact us at support@rolltohelp.com
    `;
    
    await ctx.reply(helpMessage);
  });
};

/**
 * Set up the /register command
 * @param {Telegraf} bot - Telegraf bot instance
 * @param {PrismaClient} prisma - Prisma client instance
 */
const setupRegisterCommand = (bot, prisma) => {
  bot.command('register', async (ctx) => {
    console.log('Register command received');
    try {
      const { id, username, first_name } = ctx.from;
      const telegramId = id.toString();
      
      // Check if user is already registered
      const existingUser = await prisma.user.findUnique({
        where: { telegramId },
      });
      
      if (existingUser && existingUser.isVerified) {
        await ctx.reply('You are already registered! You can place bids and receive notifications about our events.');
        return;
      }
      
      await ctx.reply(`
To link your Telegram account with Roll to Help:

1. Visit our website at ${process.env.NEXT_PUBLIC_APP_URL}
2. Click "Login with Telegram"
3. Copy the verification code
4. Send the code here

This will allow you to place bids and receive notifications about your auctions.
      `);
    } catch (error) {
      console.error('Error handling register command:', error);
      await ctx.reply('Sorry, there was an error. Please try again later.');
    }
  });
};

/**
 * Set up the /myauctions command
 * @param {Telegraf} bot - Telegraf bot instance
 * @param {PrismaClient} prisma - Prisma client instance
 */
const setupMyAuctionsCommand = (bot, prisma) => {
  bot.command('myauctions', async (ctx) => {
    console.log('My auctions command received');
    try {
      const { id } = ctx.from;
      const telegramId = id.toString();
      
      // Find user by Telegram ID
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          bids: {
            include: {
              game: {
                include: {
                  event: true,
                },
              },
            },
          },
        },
      });
      
      if (!user || !user.isVerified) {
        await ctx.reply('You need to register first! Use /register to link your Telegram account.');
        return;
      }
      
      if (!user.bids || user.bids.length === 0) {
        await ctx.reply('You have no active bids at the moment. Visit our website to place bids on games!');
        return;
      }
      
      // Format bid information
      let message = 'Your active bids:\n\n';
      
      for (const bid of user.bids) {
        const { game, amount, isWinning } = bid;
        const status = isWinning ? '🏆 WINNING' : '⏳ outbid';
        
        message += `${game.title}\n`;
        message += `Amount: $${amount}\n`;
        message += `Status: ${status}\n`;
        message += `Event: ${game.event.name} (${new Date(game.event.eventDate).toLocaleDateString()})\n\n`;
      }
      
      message += 'Visit our website to place new bids or increase your existing ones!';
      
      await ctx.reply(message);
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