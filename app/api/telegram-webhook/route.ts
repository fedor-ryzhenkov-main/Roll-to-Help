/**
 * Telegram Webhook API Route
 * 
 * This is a direct handler for the Telegram webhook URL.
 * Telegram expects this exact path (/api/telegram-webhook) based on 
 * the webhook URL set in server.js.
 */

import { NextRequest, NextResponse } from 'next/server';
import { initBot } from '@/app/lib/telegram';
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
      // First find the pending verification
      const pending = await prisma.pendingVerification.findUnique({
        where: { verificationCode: text },
      });
      
      if (!pending) {
        console.log(`[Webhook] Verification code ${text} not found in database`);
        await ctx.reply('❌ Invalid verification code. Please try again or generate a new code from the website.');
        return false;
      }
      
      if (pending.expires < new Date()) {
        console.log(`[Webhook] Verification code ${text} has expired`);
        await prisma.pendingVerification.delete({ 
          where: { id: pending.id } 
        });
        await ctx.reply('❌ This verification code has expired. Please generate a new code from the website.');
        return false;
      }
      
      // Code is valid - Find or create the user
      const user = await prisma.user.upsert({
        where: {
          telegramId: telegramId,
        },
        update: {
          telegramUsername: ctx.from.username,
          telegramFirstName: ctx.from.first_name,
          telegramLastName: ctx.from.last_name,
          isVerified: true,
          updatedAt: new Date(),
        },
        create: {
          telegramId: telegramId,
          telegramUsername: ctx.from.username,
          telegramFirstName: ctx.from.first_name,
          telegramLastName: ctx.from.last_name,
          isVerified: true,
          username: ctx.from.username || `user_${telegramId}`,
        },
      });
      
      console.log(`[Webhook] User upserted with ID: ${user.id}`);
      
      // Generate JWT token for magic login link
      const jwtSecret = process.env.NEXTAUTH_SECRET;
      if (!jwtSecret) {
        console.error('[Webhook] NEXTAUTH_SECRET not defined!');
        await ctx.reply('❌ Server configuration error. Please contact support.');
        return false;
      }
      
      const jwt = require('jsonwebtoken');
      const loginToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '5m' });
      
      // Construct magic link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        console.error('[Webhook] NEXT_PUBLIC_APP_URL not defined!');
        await ctx.reply('❌ Server configuration error. Please contact support.');
        return false;
      }
      
      const magicLink = `${appUrl}/api/auth/callback/telegram?token=${loginToken}`;
      
      // Delete the pending verification
      await prisma.pendingVerification.delete({ where: { id: pending.id } });
      
      // Send success message with login link
      await ctx.reply('✅ Success! Your Telegram account has been linked to Roll to Help.');
      await ctx.reply(`Click this link to log in (valid for 5 minutes):\n${magicLink}`);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Webhook] Error handling verification code:', error);
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
2. Click "Login / Link Account" 
3. Copy the verification code
4. Send the code here

This will allow you to place bids and receive notifications about your auctions.
    `);
  } catch (error) {
    console.error('[Webhook] Error handling register command:', error);
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
    });
    
    if (!user || !user.isVerified) {
      await ctx.reply('You need to register first! Use /register to link your Telegram account.');
      return;
    }
    
    // Check for active bids
    const bids = await prisma.bid.findMany({
      where: { 
        userId: user.id,
        game: {
          event: {
            isActive: true,
          }
        }
      },
      include: {
        game: {
          include: {
            event: true,
          },
        },
      },
    });
    
    if (!bids || bids.length === 0) {
      await ctx.reply('You have no active bids at the moment. Visit our website to place bids on games!');
      return;
    }
    
    // Format bid information
    let message = 'Your active bids:\n\n';
    
    for (const bid of bids) {
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
    console.error('[Webhook] Error handling my auctions command:', error);
    await ctx.reply('Sorry, there was an error fetching your auctions. Please try again later.');
  }
};

// Main webhook handler
export async function POST(request: NextRequest) {
  console.log("[Webhook] Received POST request at /api/telegram-webhook");
  try {
    // Initialize the bot
    const bot = initBot();
    
    if (!bot) {
      console.error("[Webhook] Bot initialization failed!");
      return NextResponse.json({ error: 'Bot initialization failed' }, { status: 500 });
    }
    
    // Set up commands
    console.log("[Webhook] Setting up bot commands");
    bot.command('start', async (ctx) => {
      console.log("[Webhook] Handling /start command");
      await ctx.reply(`
Welcome to Roll to Help! 🎲

This bot helps you participate in our charity tabletop gaming events.

Use /register to link your Telegram account with our website.
Use /myauctions to view your active bids.
Use /help to get assistance.

Thank you for supporting our charity events!
      `);
    });
    
    bot.command('help', async (ctx) => {
      console.log("[Webhook] Handling /help command");
      await ctx.reply(`
Roll to Help Bot Commands:

/start - Get started with the bot
/register - Link your Telegram account to the website
/myauctions - View your current bids
/help - Show this help message

Need more assistance? Visit our website or contact us at support@rolltohelp.com
      `);
    });
    
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