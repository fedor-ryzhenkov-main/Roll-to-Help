/**
 * Utility script to set up or check the status of the Telegram webhook
 * 
 * Usage:
 * - node scripts/setup-webhook.js         # Setup webhook
 * - node scripts/setup-webhook.js check   # Check webhook status
 * - node scripts/setup-webhook.js delete  # Delete webhook
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');

// Validate environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.error('❌ NEXT_PUBLIC_APP_URL is not defined in environment variables');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram-webhook`;

async function checkWebhook() {
  try {
    console.log('🔍 Checking current webhook status...');
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('Current webhook info:');
    console.log(JSON.stringify(webhookInfo, null, 2));
    return webhookInfo;
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
    throw error;
  }
}

async function deleteWebhook() {
  try {
    console.log('🗑️ Deleting webhook...');
    await bot.telegram.deleteWebhook();
    console.log('✅ Webhook deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting webhook:', error.message);
    throw error;
  }
}

async function setupWebhook() {
  try {
    console.log(`🔧 Setting webhook to: ${webhookUrl}`);
    await deleteWebhook();
    await bot.telegram.setWebhook(webhookUrl);
    console.log('✅ Webhook set successfully');
    
    // Verify the webhook is set correctly
    await checkWebhook();
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
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