'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { getPusherClient } from '@/app/lib/pusher-client';
import type { Channel } from 'pusher-js';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { apiClient, ApiError } from '@/app/utils/api-client';

interface TelegramLoginProps {
  callbackUrl?: string;
}

// Define an interface for the expected data in the 'session-created' event
interface SessionCreatedData {
  nextAuthToken?: string;
  error?: string;
  user?: { // Include user if potentially sent, though not directly used now
    id: string;
    telegramFirstName?: string | null;
    telegramUsername?: string | null;
  };
}

export default function TelegramLogin({ callbackUrl = '/' }: TelegramLoginProps) {
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('callbackUrl') || callbackUrl || '/';
  const pusherChannelRef = useRef<Channel | null>(null);

  useEffect(() => {
    return () => {
      if (pusherChannelRef.current && channelId) {
        console.log(`[Pusher] Unsubscribing from channel: private-${channelId}`);
        getPusherClient().unsubscribe(`private-${channelId}`);
        pusherChannelRef.current = null;
      }
    };
  }, [channelId]);

  useEffect(() => {
    if (channelId && verificationStatus === 'pending') {
      if (pusherChannelRef.current) {
        console.warn(`[Pusher] Attempted to subscribe multiple times to private-${channelId}. Ignoring.`);
        return;
      }

      const pusher = getPusherClient();
      if (!pusher || !pusher.subscribe) {
        console.error('[Pusher] Pusher client not available or invalid.');
        setError('Ошибка инициализации системы уведомлений (Pusher).');
        setVerificationStatus('error');
        return;
      }

      const pusherChannelName = `private-${channelId}`;
      console.log(`[Pusher] Subscribing to channel: ${pusherChannelName}`);

      try {
        pusherChannelRef.current = pusher.subscribe(pusherChannelName);

        pusherChannelRef.current.bind('session-created', async (data: SessionCreatedData) => {
          console.log('[Pusher] Event \'session-created\' received:', data);

          if (data.nextAuthToken) {
            console.log('[TelegramLogin] Received NextAuth token via Pusher. Attempting sign in...');
            setIsSigningIn(true);
            setError(null);

            try {
              const signInResponse = await signIn('credentials', {
                verificationToken: data.nextAuthToken,
                redirect: false,
              });

              setIsSigningIn(false);

              if (signInResponse?.error) {
                console.error('[NextAuth SignIn Error]:', signInResponse.error);
                setError(`Ошибка входа: ${signInResponse.error === 'CredentialsSignin' ? 'Неверный или истекший токен верификации.' : signInResponse.error}`);
                setVerificationStatus('error');
                toast.error('Ошибка входа. Попробуйте снова.');
              } else if (signInResponse?.ok) {
                console.log('[NextAuth SignIn Success]');
                setVerificationStatus('success');
                toast.success('Аккаунт успешно связан и вход выполнен!');

                router.refresh();

                console.log(`[TelegramLogin] Navigating to: ${returnUrl}`);
                if (returnUrl !== '/link-telegram') {
                  router.push(returnUrl);
                }

                if (pusherChannelRef.current) {
                  console.log(`[Pusher] Unsubscribing from channel ${pusherChannelName} after success.`);
                  pusher.unsubscribe(pusherChannelName);
                  pusherChannelRef.current = null;
                }
              } else {
                console.warn('[NextAuth SignIn] Unexpected response:', signInResponse);
                setError('Произошла неожиданная ошибка при входе.');
                setVerificationStatus('error');
              }

            } catch (signInError) {
              setIsSigningIn(false);
              console.error('[TelegramLogin] Critical error during signIn call:', signInError);
              setError('Критическая ошибка при попытке входа.');
              setVerificationStatus('error');
              toast.error('Критическая ошибка входа.');
            }
          } else if (data.error) {
            console.error('[Pusher] Received error message via Pusher:', data.error);
            setError(data.error || 'Ошибка верификации на сервере (Pusher).');
            setVerificationStatus('error');
            toast.error(data.error || 'Ошибка верификации (Pusher).');
          } else {
            console.warn('[Pusher] Received unknown data structure on session-created event:', data);
          }
        });

        pusherChannelRef.current.bind('pusher:subscription_succeeded', () => {
          console.log(`[Pusher] Successfully subscribed to ${pusherChannelName}`);
        });

        pusherChannelRef.current.bind('pusher:subscription_error', (status: { status: number; error?: undefined }) => {
          console.error(`[Pusher] Subscription error for ${pusherChannelName}:`, status);
          setError(`Ошибка подписки на канал уведомлений (${status.status}). Проверьте конфигурацию.`);
          setVerificationStatus('error');
        });

      } catch (subError) {
        console.error(`[Pusher] Error subscribing to channel ${pusherChannelName}:`, subError);
        setError('Ошибка подписки на канал уведомлений.');
        setVerificationStatus('error');
      }
    }
  }, [channelId, verificationStatus, router, returnUrl, pusherChannelRef]);
  
  const handleGenerateCodeClick = async () => {
    if (isLoading || isSigningIn) return;
    
    try {
      setIsLoading(true);
      setIsSigningIn(false);
      setError(null);
      setVerificationCode(null);
      setChannelId(null);
      setVerificationStatus('idle');
      
      if (pusherChannelRef.current && channelId) {
        console.log(`[Pusher] Unsubscribing from previous channel: private-${channelId}`);
        getPusherClient().unsubscribe(`private-${channelId}`);
        pusherChannelRef.current = null;
      }
      
      setChannelId(null);
      
      const result = await apiClient.post<{
         success: boolean; 
         verificationCode?: string; 
         channelId?: string; 
         error?: string 
      }>('/api/auth/telegram');
      
      if (!result.success) {
        throw new Error(result.error || 'Не удалось сгенерировать код верификации');
      }
      
      setVerificationCode(result.verificationCode || null);
      setChannelId(result.channelId || null);
      setVerificationStatus('pending');
      
    } catch (err: unknown) {
      if (err instanceof ApiError) {
          setError(err.message);
      } else if (err instanceof Error) {
          setError(err.message);
      } else {
          console.error('Unknown error during code generation:', err);
          setError('Что-то пошло не так при генерации кода');
      }
      setVerificationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg shadow-md max-w-sm mx-auto">
      <h2 className="text-xl font-semibold">Вход через Telegram</h2>
      
      {!verificationCode && (
        <Button onClick={handleGenerateCodeClick} disabled={isLoading || isSigningIn}>
          {(isLoading || isSigningIn) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Генерация...' : (isSigningIn ? 'Вход...': 'Получить код для входа')}
        </Button>
      )}

      {isLoading && verificationStatus === 'idle' && (
        <p className="text-sm text-gray-500">Генерируем код...</p>
      )}

      {verificationCode && verificationStatus === 'pending' && (
        <div className="text-center space-y-2">
          <p>Отправьте этот код нашему Telegram боту:</p>
          <p className="text-2xl font-bold tracking-widest bg-gray-100 px-4 py-2 rounded">{verificationCode}</p>
          <p className="text-sm text-gray-500">
            {isSigningIn ? 'Проверка токена и вход...' : 'Ожидаем подтверждения от Telegram...'}
          </p>
          {(isLoading || isSigningIn) && <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />}
        </div>
      )}

      {verificationStatus === 'success' && (
        <p className="text-green-600">Вход выполнен успешно!</p>
      )}

      {error && (
        <p className="text-red-600 text-sm">Ошибка: {error}</p>
      )}

      {verificationStatus !== 'pending' && verificationStatus !== 'success' && verificationCode && (
          <Button onClick={handleGenerateCodeClick} disabled={isLoading || isSigningIn} variant="outline" size="sm">
             {(isLoading || isSigningIn) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
             Получить новый код
          </Button>
      )}
      
      {/* Link to Telegram bot - replace with your bot username */}
      <a href="https://t.me/rolltohelp_bot" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
        Открыть @rolltohelp_bot в Telegram
      </a>
    </div>
  );
} 