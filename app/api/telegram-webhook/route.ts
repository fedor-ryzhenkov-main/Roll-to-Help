/*
 * Telegram Webhook API Route
 */

import { NextRequest} from 'next/server';
import { Update } from 'telegraf/types';
import { bot } from '@/app/lib/telegram';
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
  // Apply rate limiting
  const rateLimit = applyRateLimit(request, { limit: 60, windowMs: 60000 });
  if (!rateLimit.success) {
    console.warn('[Webhook] Rate limit exceeded');
    return rateLimit.error;
  }
  
  if (!verifyTelegramWebhook(request)) {
    console.warn('[Webhook] Invalid secret token');
    return createErrorResponse(
      'Invalid webhook request',
      HttpStatus.FORBIDDEN
    );
  }

  if (!bot) {
    logApiError('/api/telegram-webhook', new Error('Telegraf bot instance is not available'));
    return createSuccessResponse({ ok: true, error: 'Internal server configuration error' }); 
  }
  
  try {
    const update = await request.json() as Update; 

    await bot.handleUpdate(update);
    
   
    return createSuccessResponse({ ok: true }); 
  } catch (error) {
    logApiError('/api/telegram-webhook', error, { update: await request.json().catch(() => 'Could not parse update') });
    return createSuccessResponse({ ok: true, error: 'Internal server error processing update' }); 
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