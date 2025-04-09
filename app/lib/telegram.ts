/**
 * Telegram Bot Configuration
 * Centralized setup for the Telegram bot
 */

import { Telegraf, Telegram } from 'telegraf';
import { Update } from 'telegraf/types';

import { 
  linkTelegramToVerificationCode
} from '@/app/services/telegramService';
import { logApiError } from '@/app/lib/api-utils';
import { timingSafeEqual } from 'crypto'; // Ensure imported
import { pusherServer } from '@/app/lib/pusher-server'; // Import pusher server utility

const botToken = process.env.TELEGRAM_BOT_TOKEN;

let botInstance: Telegraf | null = null;
let telegramApi: Telegram | null = null; // Define telegramApi if needed

// --- Define Bot Messages --- 
// Moved to top level for potential use in different handlers if needed
const BotMessages = {
  UNKNOWN_COMMAND: 'Неизвестная команда или формат сообщения. Используйте /help.',
  VERIFICATION_SUCCESS: '✅ Верификация прошла успешно! Можете вернуться на сайт.',
  VERIFICATION_INVALID: '❌ Неверный код верификации.',
  VERIFICATION_ALREADY: '❌ Этот код уже был использован или ваш аккаунт уже верифицирован.',
  VERIFICATION_EXPIRED: '❌ Этот код верификации истёк. Пожалуйста, сгенерируйте новый код на сайте.',
  VERIFICATION_NO_CHANNEL: '❌ Ошибка верификации (отсутствует канал). Попробуйте снова или обратитесь в поддержку.',
  GENERIC_ERROR: 'Произошла ошибка. Пожалуйста, попробуйте еще раз.',
};
// --- End Bot Messages ---

/**
 * Lazily initializes and returns the Telegraf bot instance.
 * Ensures the bot is only instantiated when needed at runtime.
 * @returns {Telegraf | null} The Telegraf instance or null if token is missing.
 */
function getBotInstance(): Telegraf | null {
  if (!botToken) {
    console.error('[Telegram] Error: TELEGRAM_BOT_TOKEN is not set. Bot cannot be initialized.');
    return null;
  }
  if (!botInstance) {
    console.log('[Telegram] Initializing Telegraf bot instance...');
    botInstance = new Telegraf(botToken);
    telegramApi = botInstance.telegram; // Initialize telegramApi if needed

    // Graceful shutdown handlers
    process.once('SIGINT', () => {
      console.log('[Telegram] Received SIGINT, attempting to stop bot...');
      try {
        botInstance?.stop('SIGINT');
      } catch (stopErr: unknown) {
        const message = stopErr instanceof Error ? stopErr.message : 'Unknown shutdown error';
        console.error('[Telegram] Error during bot stop (SIGINT):', message);
      }
    });
    process.once('SIGTERM', () => {
      console.log('[Telegram] Received SIGTERM, attempting to stop bot...');
      try {
        botInstance?.stop('SIGTERM');
      } catch (stopErr: unknown) {
        const message = stopErr instanceof Error ? stopErr.message : 'Unknown shutdown error';
        console.error('[Telegram] Error during bot stop (SIGTERM):', message);
      }
    });
    
    // *** Call configureBot() AFTER instance creation ***
    configureBot(); 
    // **************************************************

    console.log('[Telegram] Bot instance initialized and configured.'); // Update log message
  }
  return botInstance;
}

// Keep the direct export for potential type usage if needed, but don't instantiate here
// export const bot = botToken ? new Telegraf(botToken) : null; 

/**
 * Configure bot commands and handlers
 */
function configureBot() {
  if (!botInstance) {
    console.error("[configureBot] Bot instance not available!");
    return;
  } 

  botInstance.start((ctx) => ctx.reply('Добро пожаловать! Отправьте 6-значный код с сайта для верификации.'));

  botInstance.on('text', async (ctx) => {
    try {
      const messageText = ctx.message.text.trim();
      const telegramId = ctx.from.id.toString();
      const telegramContext = { 
        first_name: ctx.from.first_name,
        username: ctx.from.username,
        last_name: ctx.from.last_name
      };

      if (/^[A-Z0-9]{6}$/.test(messageText)) {
        console.log(`[Telegram Handler] Received potential verification code: ${messageText} from user: ${telegramId}`);
        
        const verificationResult = await linkTelegramToVerificationCode(
          messageText,        
          telegramId,         
          telegramContext     
        );

        let replyMessage: string;
        if (verificationResult.success) {
          replyMessage = BotMessages.VERIFICATION_SUCCESS;
        } else {
          switch (verificationResult.reason) {
            case 'invalid': replyMessage = BotMessages.VERIFICATION_INVALID; break;
            case 'already_verified': replyMessage = BotMessages.VERIFICATION_ALREADY; break;
            case 'expired': replyMessage = BotMessages.VERIFICATION_EXPIRED; break;
            case 'no_channel': replyMessage = BotMessages.VERIFICATION_NO_CHANNEL; break;
            default: 
              replyMessage = BotMessages.GENERIC_ERROR;
              logApiError('telegram-verification-failure', new Error(`Verification failed with reason: ${verificationResult.reason}`), { telegramId: telegramId, code: messageText, reason: verificationResult.reason });
              break;
          }
        }
        await ctx.reply(replyMessage); 

        // --- Trigger Pusher Notification (Only on SUCCESS) --- 
        if (verificationResult.success && verificationResult.channelId && verificationResult.nextAuthToken && verificationResult.user) {
          console.log(`[Telegram Handler] Verification success. Triggering Pusher for Channel: ${verificationResult.channelId}`);
          
          const pusherEvent = 'session-created'; // Event name must match client
          const pusherChannel = `${verificationResult.channelId}`; // Use public channel (no private- prefix)
          const pusherData = { 
              user: { 
                  id: verificationResult.user.id, 
                  telegramFirstName: verificationResult.user.telegramFirstName, 
                  telegramUsername: verificationResult.user.telegramUsername, 
              }, 
              nextAuthToken: verificationResult.nextAuthToken
          };
          
          try {
            if (!pusherServer) {
                 throw new Error('Pusher server instance is not available.');
            }
             // Use await here as trigger is async
             await pusherServer.trigger(pusherChannel, pusherEvent, pusherData);
             console.log(`[Telegram Handler] Successfully triggered Pusher event '${pusherEvent}' on channel ${pusherChannel}`);

          } catch (pusherError: unknown) {
              const message = pusherError instanceof Error ? pusherError.message : 'Unknown Pusher trigger error';
              console.error(`[Telegram Handler] Error triggering Pusher event '${pusherEvent}' on channel ${pusherChannel}:`, message, pusherError);
              logApiError('telegram-pusher-notification-error', pusherError, { 
                  channelId: verificationResult.channelId, 
                  pusherChannel: pusherChannel, 
                  pusherEvent: pusherEvent 
              });
              // Decide if you need to inform the user about the notification failure
              // Maybe reply differently in Telegram?
          }
        } else if (verificationResult.success) {
             console.warn(`[Telegram Handler] Verification successful but missing data for Pusher notification (e.g., token). Result:`, verificationResult);
             logApiError('telegram-pusher-missing-data', new Error('Missing data after successful verification'), { 
                 channelId: verificationResult.channelId, 
                 userId: verificationResult.user?.id, 
                 hasUser: !!verificationResult.user, 
                 hasNextAuthToken: !!verificationResult.nextAuthToken 
             });
        }
        // --- End Pusher Notification Block ---

        return; 
      }
      
      await ctx.reply(BotMessages.UNKNOWN_COMMAND);
    } catch (error: unknown) {
      logApiError('telegram-bot:text', error);
      await ctx.reply(BotMessages.GENERIC_ERROR);
    }
  });

  // Graceful stop handlers (if not handled elsewhere)
  process.once('SIGINT', () => { console.log('[Telegram] Received SIGINT, stopping bot...'); botInstance?.stop('SIGINT'); });
  process.once('SIGTERM', () => { console.log('[Telegram] Received SIGTERM, stopping bot...'); botInstance?.stop('SIGTERM'); });
}

// Lazy initialization for Telegram API object
function getTelegramApi(): Telegram | null {
  if (!telegramApi) {
    getBotInstance(); // Ensure bot is initialized, which initializes telegramApi
  }
  if (!telegramApi) {
      console.error('[Telegram] Error: Telegram API could not be initialized.');
  }
  return telegramApi;
}

/**
 * Send a message to a user via Telegram
 */
async function sendTelegramMessage(
  telegramId: string, 
  message: string, 
  options?: { parse_mode?: 'Markdown' | 'HTML' }
): Promise<boolean> {
  const bot = getBotInstance();
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

/**
 * Handles incoming webhook updates.
 */
async function handleWebhookUpdate(requestBody: Update, secretTokenHeader?: string): Promise<boolean> {
   const bot = getBotInstance();
    if (!bot) {
        console.error('[Telegram Handler] Cannot handle update: Bot instance not available.');
        return false;
    }
    
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (configuredSecret) { 
        if (!secretTokenHeader) {
             console.warn('[Telegram Handler] Missing X-Telegram-Bot-Api-Secret-Token header. Ignoring update.');
             return false;
        }
        try {
            const secretBuffer = Buffer.from(configuredSecret);
            const headerBuffer = Buffer.from(secretTokenHeader);
            if (secretBuffer.length !== headerBuffer.length || !timingSafeEqual(secretBuffer, headerBuffer)) {
                 console.warn('[Telegram Handler] Invalid X-Telegram-Bot-Api-Secret-Token received. Ignoring update.');
                 return false;
            }
        } catch (e) {
            console.error('[Telegram Handler] Error comparing secret tokens.', e);
            return false;
        }
    }

    try {
        console.log('[Telegram Handler] Handling webhook update...');
        await bot.handleUpdate(requestBody);
        console.log('[Telegram Handler] Webhook update processed by bot.');
        return true;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown webhook handling error';
        console.error('[Telegram Handler] Error handling webhook update within bot:', message);
        logApiError('handle-telegram-webhook-internal', error);
        return false;
    }
}

// Final export statement - list each export only once
export { 
  getBotInstance, 
  getTelegramApi, 
  handleWebhookUpdate, 
  sendTelegramMessage 
};