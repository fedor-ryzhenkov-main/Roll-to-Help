/**
 * Telegram Bot Integration
 * 
 * This module initializes the Telegram bot and provides utility functions
 * for interacting with the Telegram API.
 */

import { Telegraf } from 'telegraf';
import { nanoid } from 'nanoid';
import prisma from './db';

// Initialize the Telegram bot instance
export const initBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  // Validate that the token exists
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
    return null;
  }
  
  try {
    const bot = new Telegraf(token);
    
    // Set up basic commands
    bot.command('start', async (ctx) => {
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
    
    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return null;
  }
};

/**
 * Generate a verification code for linking a website account to Telegram
 * @returns {string} A unique verification code
 */
export const generateVerificationCode = (): string => {
  // Generate a 6-character alphanumeric code
  return nanoid(6).toUpperCase();
};

/**
 * Verify a user using their verification code and Telegram ID
 * @param {string} telegramId - The Telegram user ID
 * @param {string} verificationCode - The verification code to validate
 * @returns {Promise<boolean>} True if verification was successful
 */
export const verifyUser = async (telegramId: string, verificationCode: string): Promise<boolean> => {
  try {
    // Find and update the user with the matching verification code
    const user = await prisma.user.updateMany({
      where: {
        verificationCode,
        isVerified: false,
      },
      data: {
        telegramId,
        isVerified: true,
        verificationCode: null,
      },
    });
    
    return user.count > 0;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
};

/**
 * Create or retrieve a user from a Telegram context
 * @param {any} ctx - Telegram context
 * @returns {Promise<any>} The user record
 */
export const getUserFromTelegram = async (ctx: any) => {
  const { id, username, first_name, last_name } = ctx.from;
  
  try {
    // Find or create user by Telegram ID
    const user = await prisma.user.upsert({
      where: {
        telegramId: id.toString(),
      },
      update: {
        telegramUsername: username,
        telegramFirstName: first_name,
        telegramLastName: last_name,
        isVerified: true,
      },
      create: {
        telegramId: id.toString(),
        telegramUsername: username,
        telegramFirstName: first_name,
        telegramLastName: last_name,
        isVerified: true,
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error getting user from Telegram:', error);
    return null;
  }
}; 