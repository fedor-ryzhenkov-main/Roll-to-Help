/*
 * Telegram Webhook API Route
 */

import { NextRequest} from 'next/server';
import { Update } from 'telegraf/types';
import { getBotInstance, handleWebhookUpdate } from '@/app/lib/telegram';
import { 
  createSuccessResponse, 
  logApiError 
} from '@/app/lib/api-utils';

/**
 * Handle the telegram webhook POST request
 */
export async function POST(request: NextRequest) {
  
  const bot = getBotInstance(); 
  if (!bot) {
    console.error('[Webhook] CRITICAL: Could not get bot instance in POST handler! Token likely missing or invalid.');
    logApiError('/api/telegram-webhook', new Error('Telegraf bot instance could not be initialized'));
    return createSuccessResponse({ ok: true, error: 'Internal server configuration error' }); 
  }
  
  try {
    const update = await request.json() as Update; 
    const secretTokenHeader = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || undefined;
    
    const handled = await handleWebhookUpdate(update, secretTokenHeader);

    if (!handled) {
        console.warn('[Webhook] handleWebhookUpdate returned false. Potential issue or invalid secret.');
        return createSuccessResponse({ ok: true, warning: 'Update processing failed internally or invalid secret' }); 
    }
    
    return createSuccessResponse({ ok: true }); 
  } catch (error) {
    logApiError('/api/telegram-webhook', error, { updateRaw: 'Could not parse update JSON' });
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