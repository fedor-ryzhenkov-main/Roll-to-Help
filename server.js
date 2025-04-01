/**
 * Combined server for Next.js web app and Telegram bot
 * This script runs both the Next.js web application and Telegram bot in a single process
 */

// Load environment variables
import 'dotenv/config';

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed for __dirname in ESM
import next from 'next';
import http from 'http';
import { Telegraf } from 'telegraf';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First run the migrations
console.log('🚀 Starting Roll to Help server...');

// Run the migration script first (ensure it's ESM compatible too)
// Assuming migrate.js is now ESM and exports a default function/object
import './scripts/migrate.js';

// Start the Next.js server
const PORT = process.env.PORT || 8080;
console.log(`🌐 Starting Next.js app on port ${PORT}...`);

// No changes needed for initializing next instance
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

// Set up the Telegram bot webhook
console.log('🤖 Setting up Telegram bot webhook...');

// Make sure we have our token
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

// Make sure we have our app URL
if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.error('❌ NEXT_PUBLIC_APP_URL is not defined in environment variables');
  console.log('⚠️ Continuing without setting webhook. Bot will be inactive.');
}

// Set up the bot webhook when the server starts
async function setupWebhook() {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) return;
    
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram-webhook`;
    
    // Clear any existing webhook
    await bot.telegram.deleteWebhook();
    
    // Set the webhook with a 5-second timeout
    await Promise.race([
      bot.telegram.setWebhook(webhookUrl),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Webhook setup timeout')), 5000))
    ]);
    
    console.log(`✅ Telegram webhook set to: ${webhookUrl}`);
    
    // Verify the webhook is set correctly
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('ℹ️ Webhook info:', JSON.stringify(webhookInfo, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to set up webhook:', error.message);
    
    // Try again in 30 seconds
    console.log('⏳ Will retry webhook setup in 30 seconds...');
    setTimeout(setupWebhook, 30000);
    
    return false;
  }
}

// Prepare the app and server
app.prepare().then(async () => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });
  
  server.listen(PORT, async (err) => {
    if (err) throw err;
    console.log(`✅ Ready on http://localhost:${PORT}`);
    
    // Set up the webhook after the server is running
    await setupWebhook();
  });
  
  // Enable graceful shutdown
  const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };
  
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}); 