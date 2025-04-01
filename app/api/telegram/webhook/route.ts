/**
 * Telegram Webhook API
 * 
 * This API endpoint receives updates from Telegram bot and processes them.
 */

import { NextResponse, NextRequest } from 'next/server';
import { initBot, verifyUser } from '@/app/lib/telegram';
import prisma from '@/app/lib/db';

// Process verification codes sent by users
const handleVerificationCode = async (bot: any, ctx: any, text: string) => {
  console.log(`[Webhook] Attempting to handle text as verification code: ${text}`);
  try {
    // Check if the text looks like a verification code (alphanumeric, 6 chars)
    const isVerificationCode = /^[A-Z0-9]{6}$/.test(text);
    
    if (isVerificationCode) {
      const { id } = ctx.from;
      const telegramId = id.toString();
      
      // Try to verify the user with the code
      const success = await verifyUser(telegramId, text);
      
      if (success) {
        await ctx.reply('✅ Success! Your Telegram account has been linked to Roll to Help. You can now place bids and receive notifications.');
        
        // Find their user record to get more details
        const user = await prisma.user.findUnique({
          where: { telegramId },
        });
        
        if (user) {
          // Send a welcome message with additional info
          await ctx.reply(`Welcome, ${user.telegramFirstName || 'there'}! Your account is now verified and ready to use. Visit our website to start bidding on games.`);
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

// Handle the /register command
const handleRegisterCommand = async (ctx: any) => {
  console.log("[Webhook] Handling /register command");
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
};

// Handle the /myauctions command
const handleMyAuctionsCommand = async (ctx: any) => {
  console.log("[Webhook] Handling /myauctions command");
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
};

// Initialize bot and set up commands
export async function POST(request: NextRequest) {
  console.log("[Webhook] Received POST request");
  try {
    // Initialize the bot
    const bot = initBot();
    
    if (!bot) {
      console.error("[Webhook] Bot initialization failed!");
      return NextResponse.json({ error: 'Bot initialization failed' }, { status: 500 });
    }
    
    // Set up commands
    console.log("[Webhook] Setting up bot commands");
    bot.command('register', handleRegisterCommand);
    bot.command('myauctions', handleMyAuctionsCommand);
    
    // Handle regular messages (verification codes)
    bot.on('text', async (ctx) => {
      console.log("[Webhook] Received text message:", ctx.message.text);
      const text = ctx.message.text.trim();
      
      // Skip command messages
      if (text.startsWith('/')) {
        console.log("[Webhook] Ignoring text message as it's a command.");
        return;
      }
      
      // Try to process as verification code
      const handled = await handleVerificationCode(bot, ctx, text);
      
      // If not a verification code, provide guidance
      if (!handled) {
        console.log("[Webhook] Text was not a verification code, sending help message.");
        await ctx.reply('Not sure what you mean. Use /help to see available commands.');
      }
    });
    
    // Process the update
    const update = await request.json();
    console.log("[Webhook] Processing update:", JSON.stringify(update, null, 2));
    await bot.handleUpdate(update);
    console.log("[Webhook] Finished processing update.");
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process update' }, { status: 500 });
  }
} 