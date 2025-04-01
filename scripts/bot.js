/**
 * Standalone Telegram Bot Script
 * 
 * Run this script to launch the bot in polling mode for testing:
 * node scripts/bot.js
 */

// First, run database migrations
try {
  import('./migrate.js');
  console.log('Migration script loaded');
} catch (err) {
  console.error('Failed to run migrations:', err);
  // Continue running the bot even if migrations fail
}

// Load environment variables
import 'dotenv/config';

import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { handleVerificationCode, setupStartCommand, setupHelpCommand, setupRegisterCommand, setupMyAuctionsCommand } from './bot-functions.js';

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Make sure we have our token
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

// Process verification codes sent by users
const handleVerificationCode = async (ctx, text) => {
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

// Set up basic commands
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

// Handle the /register command
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

// Handle the /myauctions command
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

// Handle regular messages (verification codes)
bot.on('text', async (ctx) => {
  console.log(`Received message: ${ctx.message.text}`);
  const text = ctx.message.text.trim();
  
  // Skip command messages
  if (text.startsWith('/')) return;
  
  // Try to process as verification code
  const handled = await handleVerificationCode(ctx, text);
  
  // If not a verification code, provide guidance
  if (!handled) {
    await ctx.reply('Not sure what you mean. Use /help to see available commands.');
  }
});

// Log errors
bot.catch((err, ctx) => {
  console.error(`Bot error:`, err);
  ctx.reply('Sorry, something went wrong. Please try again later.');
});

// Launch the bot with detailed error handling
console.log('Starting bot...');
bot.launch()
  .then(() => {
    console.log('✅ Bot started in polling mode!');
    console.log('Press Ctrl+C to stop');
  })
  .catch(err => {
    console.error('❌ Failed to start bot:', err);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('SIGINT received, stopping bot...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('SIGTERM received, stopping bot...');
  bot.stop('SIGTERM');
}); 