'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/app/context/TelegramContext';
import { apiClient } from '@/app/utils/api-client';
import { toast } from 'react-hot-toast';
import { ApiError } from '@/app/utils/api-client';
import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';

// Define type for user info received
interface UserInfo {
    id: string;
    telegramFirstName?: string | null;
    telegramUsername?: string | null;
    isAdmin?: boolean;
    isVerified?: boolean;
}

interface TelegramLoginProps {
  callbackUrl?: string;
}

export default function TelegramLogin({ callbackUrl = '/' }: TelegramLoginProps) {
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('callbackUrl') || callbackUrl || '/';
  const wsRef = useRef<WebSocket | null>(null);
  const { setLinkedTelegramInfo, setIsLoading: setTelegramLoading } = useTelegram();
  
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (verificationCode && channelId && verificationStatus === 'pending') {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}`;
      
      console.log(`Connecting WebSocket to ${wsUrl} for channel ${channelId}`);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current?.send(JSON.stringify({ type: 'register', channelId }));
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[TelegramLogin] WebSocket message received:', message);

          if (message.type === 'sessionCreated' && message.user && message.sessionId) {
            console.log('[TelegramLogin] Session created via WS. User data received:', message.user);
            
            // --- Update Context First ---
            // The received message.user should now match UserInfo structure
            console.log('[TelegramLogin] Calling setLinkedTelegramInfo with:', message.user);
            setTelegramLoading(true);
            setLinkedTelegramInfo(message.user as UserInfo); 
            setVerificationStatus('success');
            toast.success('Аккаунт успешно связан!');
            // ---------------------------

            // --- Set Cookie and then Refresh/Navigate ---
            try {
              // Await the cookie setting process
              console.log('[TelegramLogin] Setting session cookie...');
              const cookieResponse = await apiClient.post('/api/auth/set-cookie', {
                sessionId: message.sessionId
              });
              
              if (!cookieResponse.success) {
                console.error('[TelegramLogin] Failed to set session cookie:', cookieResponse.message);
                setError('Ошибка установки сессии. Попробуйте обновить страницу.');
                toast.error('Ошибка входа. Обновите страницу.');
                wsRef.current?.close(); // Close WS on failure
                setTelegramLoading(false);
                return; // Stop further execution here
              } 
              
              // Cookie set successfully, now refresh and navigate
              console.log('[TelegramLogin] Session cookie set. Refreshing router...');
              router.refresh(); // Restore router refresh
              
              console.log(`[TelegramLogin] Navigating to: ${returnUrl}`);
              // Navigate after refresh (refresh might take a moment)
              // Consider if push is always needed if refresh updates the header via layout re-render
              if (returnUrl !== '/link-telegram') { // Avoid redirect loop on login page
                   router.push(returnUrl);
              }
              
              // Close WebSocket slightly later after navigation potentially starts
              setTimeout(() => { 
                   wsRef.current?.close(); 
                   console.log('[TelegramLogin] WebSocket closed after navigation.');
              }, 300); 

            } catch (cookieError) {
              console.error('[TelegramLogin] Error calling /api/auth/set-cookie:', cookieError);
              setError('Ошибка связи с сервером для установки сессии.');
              toast.error('Ошибка сервера при входе.');
              wsRef.current?.close(); // Close WS on failure
              setTelegramLoading(false);
            }
            // --------------------------------------------
            
          } else if (message.type === 'error') {
             console.error('[TelegramLogin] Received error message via WebSocket:', message.error);
             setError(message.error || 'Ошибка верификации на сервере.');
             setVerificationStatus('error');
             toast.error(message.error || 'Ошибка верификации.');
             wsRef.current?.close();
          } else if (message.type === 'registered'){
             console.log(`WebSocket registered for channel: ${message.channelId}`);
          } else {
            console.warn('Received unknown WebSocket message type:', message.type);
          }
        } catch (e) {
          console.error('Error processing WebSocket message:', e);
          setError('Не удалось обработать сообщение сервера.');
          setVerificationStatus('error');
          wsRef.current?.close();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Ошибка WebSocket соединения. Убедитесь, что подключение к интернету стабильно.');
        setVerificationStatus('error');
        toast.error('Ошибка соединения WebSocket.');
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        if (verificationStatus === 'pending') {
             setError('Соединение потеряно во время верификации. Попробуйте снова.');
             setVerificationStatus('error');
        }
      };
      
      return () => {
        console.log('Closing WebSocket connection due to effect cleanup.');
        wsRef.current?.close();
      };
    }
  }, [verificationCode, channelId, verificationStatus, setLinkedTelegramInfo, router, returnUrl, setTelegramLoading]);
  
  const handleGenerateCodeClick = async () => {
    if (isLoading) return; 
    
    try {
      setIsLoading(true);
      setError(null);
      setVerificationCode(null);
      setChannelId(null);
      setVerificationStatus('idle');
      
      wsRef.current?.close();
      
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
      
    } catch (err) {
      if (err instanceof ApiError) {
          setError(err.message);
      } else if (err instanceof Error) {
          setError(err.message);
      } else {
          setError('Что-то пошло не так');
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
        <Button onClick={handleGenerateCodeClick} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Генерация...' : 'Получить код для входа'}
        </Button>
      )}

      {isLoading && verificationStatus === 'idle' && (
        <p className="text-sm text-gray-500">Генерируем код...</p>
      )}

      {verificationCode && verificationStatus === 'pending' && (
        <div className="text-center space-y-2">
          <p>Отправьте этот код нашему Telegram боту:</p>
          <p className="text-2xl font-bold tracking-widest bg-gray-100 px-4 py-2 rounded">{verificationCode}</p>
          <p className="text-sm text-gray-500">Ожидаем подтверждения от Telegram...</p>
           <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      {verificationStatus === 'success' && (
        <p className="text-green-600">Вход выполнен успешно!</p>
      )}

      {error && (
        <p className="text-red-600 text-sm">Ошибка: {error}</p>
      )}

      {verificationStatus !== 'pending' && verificationStatus !== 'success' && verificationCode && (
          <Button onClick={handleGenerateCodeClick} disabled={isLoading} variant="outline" size="sm">
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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