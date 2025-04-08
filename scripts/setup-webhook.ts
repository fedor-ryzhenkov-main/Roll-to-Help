/**
 * Utility script to set up or check the status of the Telegram webhook
 * 
 * Usage:
 * - node scripts/setup-webhook.js         # Setup webhook
 * - node scripts/setup-webhook.js check   # Check webhook status
 * - node scripts/setup-webhook.js delete  # Delete webhook
 */

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { URL } from 'url'; // Import the URL class

// Validate environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.error('❌ NEXT_PUBLIC_APP_URL is not defined in environment variables');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Construct the webhook URL robustly
let webhookUrl: string;
try {
  // Ensure NEXT_PUBLIC_APP_URL is treated as a base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  // Use URL constructor to correctly join the path
  webhookUrl = new URL('/api/telegram-webhook', baseUrl).toString();
} catch (error) {
  console.error('❌ Invalid NEXT_PUBLIC_APP_URL environment variable:', process.env.NEXT_PUBLIC_APP_URL);
  process.exit(1);
}

async function checkWebhook() {
  try {
    console.log('🔍 Checking current webhook status...');
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('Current webhook info:');
    console.log(JSON.stringify(webhookInfo, null, 2));
    return webhookInfo;
  } catch (error) {
    console.error('❌ Error checking webhook:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function deleteWebhook() {
  try {
    console.log('🗑️ Deleting webhook...');
    await bot.telegram.deleteWebhook();
    console.log('✅ Webhook deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting webhook:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function setupWebhook() {
  try {
    console.log(`🔧 Setting webhook to: ${webhookUrl}`);
    await deleteWebhook();
    
    // Read the secret token from environment variable
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secretToken) {
      console.warn('⚠️ TELEGRAM_WEBHOOK_SECRET is not defined. Setting webhook without a secret token. This is less secure.');
    }
    
    // Call setWebhook with options, including the secret token if available
    await bot.telegram.setWebhook(webhookUrl, {
      secret_token: secretToken, // Pass the secret here
      drop_pending_updates: true // Good practice to drop old updates
    });
    
    console.log('✅ Webhook set successfully' + (secretToken ? ' with secret token.' : '.'));
    
    // Verify the webhook is set correctly
    await checkWebhook();
  } catch (error) {
    console.error('❌ Error setting webhook:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'setup';
  
  try {
    switch (command) {
      case 'check':
        await checkWebhook();
        break;
      case 'delete':
        await deleteWebhook();
        break;
      case 'setup':
      default:
        await setupWebhook();
        break;
    }
  } catch (error) {
    console.error('❌ Operation failed');
    process.exit(1);
  }
}

main(); 