/**
 * Telegram Bot Configuration
 * Centralized setup for the Telegram bot
 */

import { Telegraf } from 'telegraf';
// import { BOT_MESSAGES } from '@/app/config/constants'; // Remove import
import { 
  getUserByTelegramId, 
  linkTelegramToVerificationCode
} from '@/app/services/telegramService';
import { logApiError } from '@/app/lib/api-utils';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
export const bot = botToken ? new Telegraf(botToken) : null;

if (!bot) {
  console.error('Telegram bot initialization failed - TELEGRAM_BOT_TOKEN is missing');
} else {
  configureBot();
}

// --- Define Bot Messages Locally ---
const BotMessages = {
  WELCOME: 'Добро пожаловать в бот Roll to Help! Используйте /help для просмотра доступных команд.',
  HELP: 'Доступные команды: /start, /help, /register, /myauctions. Отправьте код верификации для привязки аккаунта.',
  ALREADY_REGISTERED: 'Ваш аккаунт Telegram уже привязан.',
  REGISTER_INSTRUCTIONS: (appUrl: string) => 
    `Чтобы привязать аккаунт:\n1. Посетите ${appUrl}\n2. Нажмите Войти / Привязать аккаунт\n3. Отправьте код сюда\n4. Дождитесь подтверждения.`,
  VERIFICATION_SUCCESS: '✅ Успех! Ваш аккаунт Telegram привязан. Пожалуйста, вернитесь на сайт - вы должны автоматически войти в систему.',
  VERIFICATION_INVALID: '❌ Неверный код верификации. Пожалуйста, попробуйте снова или сгенерируйте новый код на сайте.',
  VERIFICATION_EXPIRED: '❌ Этот код верификации истёк. Пожалуйста, сгенерируйте новый код на сайте.',
  VERIFICATION_ALREADY: '❌ Этот код уже был использован или ваш аккаунт уже верифицирован.',
  UNKNOWN_COMMAND: 'Неизвестная команда или формат сообщения. Используйте /help для просмотра доступных команд.',
  NO_ACTIVE_BIDS: 'У вас сейчас нет активных ставок.',
  WINNING_BIDS_NOTIFICATION: (games: string[]): string => 
    `🎉 Поздравляем! Вы выиграли аукцион на:\n\n${games.map(g => `- ${g}`).join('\n')}\n\nПожалуйста, свяжитесь с организаторами для получения информации об оплате.`
};
// --- End Bot Messages Definition ---

/**
 * Configure bot commands and handlers
 */
function configureBot() {
  if (!bot) return;

  // Error handling for bot
  bot.catch((err, ctx) => {
    logApiError('telegram-bot', err, {
      updateType: ctx.updateType,
      userId: ctx.from?.id,
    });
  });

  // Start command
  bot.command('start', async (ctx) => {
    try {
      // Update user profile if they exist
      // await updateUserFromTelegram(ctx); // Commented out: Function not found
      await ctx.reply(BotMessages.WELCOME);
    } catch (error) {
      logApiError('telegram-bot:start', error);
      await ctx.reply('An error occurred. Please try again later.');
    }
  });

  // Help command
  bot.command('help', async (ctx) => {
    await ctx.reply(BotMessages.HELP);
  });

  // Register command
  bot.command('register', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await getUserByTelegramId(telegramId);

      if (user) {
        // User is already registered
        await ctx.reply(BotMessages.ALREADY_REGISTERED);
      } else {
        // User needs to register
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com';
        await ctx.reply(BotMessages.REGISTER_INSTRUCTIONS(appUrl));
      }
    } catch (error) {
      logApiError('telegram-bot:register', error);
      await ctx.reply('An error occurred. Please try again later.');
    }
  });

  // My auctions command
  bot.command('myauctions', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await getUserByTelegramId(telegramId);

      if (!user) {
        // User is not registered
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com';
        await ctx.reply(BotMessages.REGISTER_INSTRUCTIONS(appUrl));
        return;
      }

      // Get user's bids (This logic might be broken/obsolete if getUserBids/formatUserBidsMessage removed)
      // const bids = await getUserBids(user.id); 
      // const message = formatUserBidsMessage(bids); // <-- formatUserBidsMessage removed
      // await ctx.reply(message);
      await ctx.reply('The /myauctions command is currently under maintenance.'); // Placeholder reply

    } catch (error) {
      logApiError('telegram-bot:myauctions', error);
      await ctx.reply('An error occurred while retrieving your auctions. Please try again later.');
    }
  });

  // Handle verification codes
  bot.on('text', async (ctx) => {
    try {
      // Ignore commands
      const text = ctx.message.text.trim();
      if (text.startsWith('/')) return;

      // Try to handle as verification code
      const verificationCodeRegex = /^[A-Z0-9]{6}$/;
      
      if (verificationCodeRegex.test(text)) {
        const telegramId = ctx.from.id.toString();
        // Pass context to service function
        const verificationResult = await linkTelegramToVerificationCode(text, telegramId, ctx.from);
        
        // Select reply message based on verification result
        let replyMessage: string;
        if (verificationResult.success) {
          replyMessage = BotMessages.VERIFICATION_SUCCESS;
        } else {
          switch (verificationResult.reason) {
            case 'invalid':
              replyMessage = BotMessages.VERIFICATION_INVALID;
              break;
            case 'already_verified':
              replyMessage = BotMessages.VERIFICATION_ALREADY;
              break;
            case 'expired':
              replyMessage = BotMessages.VERIFICATION_EXPIRED;
              break;
            case 'no_channel':
            case 'db_error':
            case 'internal_error':
            default:
              replyMessage = 'An internal error occurred during verification. Please try again later or contact support.';
              // Log the reason if it's unexpected
              if (verificationResult.reason !== 'no_channel' && verificationResult.reason !== 'db_error' && verificationResult.reason !== 'internal_error') {
                 logApiError('telegram-text-handler', new Error('Unhandled verification failure reason'), { reason: verificationResult.reason });
              }
              break;
          }
        }

        // Reply to user in Telegram
        await ctx.reply(replyMessage);

        // --- Trigger WS Notification on Success --- 
        if (verificationResult.success && verificationResult.channelId && verificationResult.sessionId && verificationResult.user) {
          console.log(`[Telegram Handler] Verification success. Triggering WS for Channel: ${verificationResult.channelId}`);
          
          // Construct the WS message user object using standardized names from verificationResult
          const wsMessage = {
              type: 'sessionCreated',
              user: { 
                  id: verificationResult.user.id,
                  telegramFirstName: verificationResult.user.telegramFirstName, // Now directly available
                  telegramUsername: verificationResult.user.telegramUsername,
                  // Add other fields if they were added to LinkResult.user
                  // isAdmin: verificationResult.user.isAdmin, 
                  // isVerified: verificationResult.user.isVerified, // REMOVED
              },
              sessionId: verificationResult.sessionId
          };
          
          const wsServerUrl = `http://localhost:${process.env.WS_PORT || '3001'}/send`;
          try {
              const wsResponse = await fetch(wsServerUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      channelId: verificationResult.channelId, 
                      message: wsMessage 
                  }),
              });
              if (!wsResponse.ok) {
                  console.error(`[Telegram Handler] Failed to send WebSocket message via ${wsServerUrl}. Status: ${wsResponse.status}`);
                  // Log details for debugging
                  logApiError('telegram-ws-notification', new Error(`WS notification failed with status ${wsResponse.status}`), {
                       channelId: verificationResult.channelId,
                       sessionId: verificationResult.sessionId,
                       userId: verificationResult.user.id
                  });
              } else {
                  console.log(`[Telegram Handler] Successfully triggered WebSocket message for channel ${verificationResult.channelId}`);
              }
          } catch (fetchError) {
              console.error(`[Telegram Handler] Error calling WebSocket server at ${wsServerUrl}:`, fetchError);
              logApiError('telegram-ws-notification-fetch', fetchError, { 
                  channelId: verificationResult.channelId,
                  wsUrl: wsServerUrl 
              });
              // Consider alternative notification or retry logic here
          }
        } else {
          // Log if verification succeeded but crucial data for WS is missing
          if (verificationResult.success) {
             console.warn(`[Telegram Handler] Verification successful but missing data for WS notification. Result:`, verificationResult);
             // Pass relevant parts of the result as context
             logApiError('telegram-ws-missing-data', 
                         new Error('Missing data after successful verification'), 
                         { 
                           channelId: verificationResult.channelId,
                           sessionId: verificationResult.sessionId,
                           userId: verificationResult.user?.id, // Use optional chaining for user
                           hasUser: !!verificationResult.user 
                         }
             );
          }
        }
        // --- End WS Notification --- 

        return; // Handled
      }
      
      // Not a verification code
      await ctx.reply(BotMessages.UNKNOWN_COMMAND);
    } catch (error) {
      logApiError('telegram-bot:text', error);
      await ctx.reply('An error occurred. Please try again later.');
    }
  });

  // Enable graceful stop with checks
  process.once('SIGINT', () => {
    if (bot) {
      console.log('Received SIGINT, stopping bot...');
      bot.stop('SIGINT');
    } else {
      console.log('Received SIGINT, but bot instance not found.');
    }
  });
  process.once('SIGTERM', () => {
    if (bot) {
      console.log('Received SIGTERM, stopping bot...');
      bot.stop('SIGTERM');
    } else {
      console.log('Received SIGTERM, but bot instance not found.');
    }
  });
}

/**
 * Setup webhook for the bot
 */
export async function setupWebhook(domain: string) {
  if (!bot) return { success: false, error: 'Bot not initialized' };

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CRITICAL: TELEGRAM_WEBHOOK_SECRET environment variable is not set. Webhook setup cannot proceed securely.');
    return { success: false, error: 'TELEGRAM_WEBHOOK_SECRET is not configured.' };
  }

  try {

    const webhookUrl = `${domain}/api/telegram-webhook`;
    
    await bot.telegram.setWebhook(webhookUrl, {
      drop_pending_updates: true,
      secret_token: webhookSecret, 
    });
    
    console.log(`Telegram webhook successfully set to ${webhookUrl}`);
    return { success: true };
  } catch (error) {
    logApiError('telegram-webhook-setup', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send a message to a user via Telegram
 * @param telegramId The Telegram ID of the recipient
 * @param message The message to send
 * @param options Optional message options (parse_mode, etc.)
 * @returns Promise that resolves when the message is sent
 */
export async function sendTelegramMessage(
  telegramId: string, 
  message: string, 
  options?: { parse_mode?: 'Markdown' | 'HTML' }
): Promise<boolean> {
  if (!bot) {
    console.error('Cannot send Telegram message: Bot not initialized');
    return false;
  }
  
  try {
    await bot.telegram.sendMessage(telegramId, message, options);
    return true;
  } catch (error) {
    console.error(`Error sending Telegram message to ${telegramId}:`, error);
    logApiError('telegram-send-message', error, { telegramId });
    return false;
  }
} 