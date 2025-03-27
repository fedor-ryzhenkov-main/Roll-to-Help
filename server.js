/**
 * Combined server for Next.js web app and Telegram bot
 * This script runs both the Next.js web application and Telegram bot in a single process
 */

// Load environment variables
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

// First run the migrations
console.log('🚀 Starting Roll to Help server...');

// Run the migration script first
require('./scripts/migrate');

// Start the Next.js server
const PORT = process.env.PORT || 3000;
console.log(`🌐 Starting Next.js app on port ${PORT}...`);

const next = require('next');
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();
const http = require('http');

// Start the Telegram bot in a separate thread
console.log('🤖 Starting Telegram bot...');
// We'll run the bot script directly, not in a child process
// This avoids memory issues and makes debugging easier
const { Telegraf } = require('telegraf');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Make sure we have our token
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

// Import bot functions
const { 
  handleVerificationCode, 
  setupStartCommand, 
  setupHelpCommand, 
  setupRegisterCommand, 
  setupMyAuctionsCommand
} = require('./scripts/bot-functions');

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

// Prepare the app and server
app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });
  
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`✅ Ready on http://localhost:${PORT}`);
  });
  
  // Start the bot
  bot.launch()
    .then(() => {
      console.log('✅ Telegram bot started in polling mode!');
    })
    .catch(err => {
      console.error('❌ Failed to start bot:', err);
    });
  
  // Enable graceful shutdown
  const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('HTTP server closed');
      bot.stop('SIGINT');
      console.log('Bot stopped');
      process.exit(0);
    });
  };
  
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}); 