/**
 * API route for Telegram webhook
 * This endpoint receives updates from Telegram when using webhook mode
 */
import { Telegraf } from 'telegraf';
import { buffer } from 'micro';
import { PrismaClient } from '@prisma/client';

// Disable Next.js body parsing, we need the raw buffer
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Prisma and Telegraf
const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Import bot functions
const { 
  handleVerificationCode, 
  setupStartCommand, 
  setupHelpCommand, 
  setupRegisterCommand, 
  setupMyAuctionsCommand
} = require('../../scripts/bot-functions');

// Set up bot commands
setupStartCommand(bot);
setupHelpCommand(bot);
setupRegisterCommand(bot, prisma);
setupMyAuctionsCommand(bot, prisma);

// Handle regular messages (verification codes)
bot.on('text', async (ctx) => {
  console.log(`Received message: ${ctx.message.text}`);
  const text = ctx.message.text.trim();
  
  // Skip command messages
  if (text.startsWith('/')) return;
  
  // Try to process as verification code
  const handled = await handleVerificationCode(ctx, text, prisma);
  
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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get the raw body as a buffer and convert to string
      const rawBody = await buffer(req);
      
      // Process the update with Telegraf
      await bot.handleUpdate(JSON.parse(rawBody.toString()));
      
      // Respond with success
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  } else {
    // Only accept POST requests
    res.status(405).json({ error: 'Method not allowed' });
  }
} 