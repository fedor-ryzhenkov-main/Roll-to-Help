/*
 * Telegram Webhook API Route
 */

import { NextRequest} from 'next/server';
import { Update } from 'telegraf/types';
import { getBotInstance, handleWebhookUpdate } from '@/app/lib/telegram';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  HttpStatus, 
  logApiError 
} from '@/app/lib/api-utils';
import { applyRateLimit } from '@/app/lib/api-middleware';
import { timingSafeEqual } from 'crypto';

/**
 * Verify the webhook request is legitimately from Telegram
 * Note: This is different from CSRF protection as it's for server-to-server communication
 */
function verifyTelegramWebhook(request: NextRequest): boolean {
  // In production, you should verify the request is coming from Telegram
  // by checking the X-Telegram-Bot-Api-Secret-Token header
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  const headerToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  
  if (!secretToken || !headerToken) {
    return false;
  }
  
  const secretBuffer = Buffer.from(secretToken);
  const headerBuffer = Buffer.from(headerToken);
  
  try {
    return secretBuffer.length === headerBuffer.length && 
           timingSafeEqual(secretBuffer, headerBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Handle the telegram webhook POST request
 */
export async function POST(request: NextRequest) {
  // ** Temporary Debug Log **
  console.log(`[Webhook POST] TELEGRAM_BOT_TOKEN available: ${!!process.env.TELEGRAM_BOT_TOKEN}, Length: ${process.env.TELEGRAM_BOT_TOKEN?.length || 0}`);
  console.log(`[Webhook POST] TELEGRAM_WEBHOOK_SECRET available: ${!!process.env.TELEGRAM_WEBHOOK_SECRET}, Length: ${process.env.TELEGRAM_WEBHOOK_SECRET?.length || 0}`);
  // ** End Temporary Debug Log **
  
  // Apply rate limiting
  const rateLimit = applyRateLimit(request, { limit: 60, windowMs: 60000 });
  if (!rateLimit.success) {
    console.warn('[Webhook] Rate limit exceeded');
    return rateLimit.error;
  }
  
  // Verification using secret token should happen within handleWebhookUpdate or a similar function
  // It was already done in the refactored handleWebhookUpdate in telegram.ts, so remove the manual check here
  /*
  if (!verifyTelegramWebhook(request)) {
    console.warn('[Webhook] Invalid secret token');
    return createErrorResponse(
      'Invalid webhook request',
      HttpStatus.FORBIDDEN
    );
  }
  */

  // Check if bot instance can be retrieved (implicitly checks token)
  const bot = getBotInstance(); 
  if (!bot) {
    console.error('[Webhook] CRITICAL: Could not get bot instance in POST handler! Token likely missing or invalid.');
    logApiError('/api/telegram-webhook', new Error('Telegraf bot instance could not be initialized'));
    // Return 200 OK to Telegram, otherwise it keeps retrying
    return createSuccessResponse({ ok: true, error: 'Internal server configuration error' }); 
  }
  
  try {
    const update = await request.json() as Update; 
    const secretTokenHeader = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || undefined;

    // Use the dedicated handler function from the telegram library
    const handled = await handleWebhookUpdate(update, secretTokenHeader);

    if (!handled) {
        // Error handling or logging might have already occurred within handleWebhookUpdate
        console.warn('[Webhook] handleWebhookUpdate returned false. Potential issue or invalid secret.');
        // Still return OK to Telegram
        return createSuccessResponse({ ok: true, warning: 'Update processing failed internally or invalid secret' }); 
    }
    
    // If handled successfully, return OK
    return createSuccessResponse({ ok: true }); 
  } catch (error) {
    logApiError('/api/telegram-webhook', error, { updateRaw: 'Could not parse update JSON' });
    // Return OK to Telegram even on parsing errors
    return createSuccessResponse({ ok: true, error: 'Internal server error parsing update' }); 
  }
}

/**
 * Handle GET requests to the webhook URL
 * Used for setting up and testing the webhook
 */
export async function GET() {
  return createSuccessResponse({ 
    message: 'Telegram webhook endpoint is active. Use POST requests from Telegram to interact.' 
  });
} 