/**
 * Telegram Webhook Setup API
 * 
 * This API endpoint initializes the Telegram webhook.
 * It should be called once when setting up the bot.
 */

import { NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';

export async function GET() {
  try {
    // Verify environment variables are set
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!token || !appUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing environment variables: TELEGRAM_BOT_TOKEN or NEXT_PUBLIC_APP_URL' 
      }, { status: 500 });
    }
    
    // Initialize the bot
    const bot = new Telegraf(token);
    
    // Set webhook to your app URL
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    
    // Get current webhook info
    const currentWebhook = await bot.telegram.getWebhookInfo();
    
    // Remove any existing webhook
    await bot.telegram.deleteWebhook();
    console.log("Deleted existing webhook");
    
    // Set up bot commands
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'register', description: 'Link your Telegram account to Roll to Help' },
      { command: 'myauctions', description: 'View your active bids' },
      { command: 'help', description: 'Get help with the bot' }
    ]);
    console.log("Set up commands");
    
    // For local development, we can't use webhooks easily, so just launch the bot with polling
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
      // Start polling in development
      await bot.launch();
      console.log("Bot started with polling (development mode)");
      
      return NextResponse.json({ 
        success: true, 
        mode: 'polling',
        webhook: null,
        message: 'Bot started with polling for local development'
      });
    } else {
      // Set the webhook for production
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`Webhook set to ${webhookUrl}`);
      
      // Get webhook info for verification
      const webhookInfo = await bot.telegram.getWebhookInfo();
      
      return NextResponse.json({ 
        success: true, 
        mode: 'webhook',
        webhook: webhookInfo,
        message: 'Webhook successfully set!'
      });
    }
  } catch (error) {
    console.error('Failed to set webhook:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 