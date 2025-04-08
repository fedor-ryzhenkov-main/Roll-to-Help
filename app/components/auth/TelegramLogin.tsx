'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/app/context/TelegramContext';
import { apiClient } from '@/app/utils/api-client';
import { toast } from 'react-hot-toast';
import { ApiError } from '@/app/utils/api-client';

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
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified' | 'error'>('idle');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('callbackUrl') || callbackUrl || '/';
  const wsRef = useRef<WebSocket | null>(null);
  const { setLinkedTelegramInfo } = useTelegram();
  
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (verificationCode && channelId && verificationStatus === 'pending') {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsPort = process.env.NEXT_PUBLIC_WS_PORT || '3001';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:${wsPort}`;
      
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
            setLinkedTelegramInfo(message.user as UserInfo); 
            setVerificationStatus('verified');
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
            }
            // --------------------------------------------
            
          } else if (message.type === 'error') {
             console.error('[TelegramLogin] Received error message via WebSocket:', message.error);
             setError(message.error || 'Ошибка верификации на сервере.');
             setVerificationStatus('error');
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
        setError('Ошибка WebSocket соединения.');
        setVerificationStatus('error');
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
  }, [verificationCode, channelId, verificationStatus, setLinkedTelegramInfo, router, returnUrl]);
  
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
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-purple-900 mb-6">Связь с Telegram</h2>
      
      {verificationCode && channelId && verificationStatus !== 'verified' ? (
        <div className="text-center">
          <p className="mb-4">Ваш код верификации:</p>
          <div className="bg-amber-50 p-4 rounded-md mb-6">
            <span className="text-2xl font-mono font-bold tracking-wider">{verificationCode}</span>
          </div>
          
          <div className="mb-6">
            {verificationStatus === 'pending' && (
              <div className="flex items-center justify-center text-amber-600">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ожидание верификации через Telegram...
              </div>
            )}
            
            {verificationStatus === 'error' && (
              <div className="text-red-600">
                {error || 'Произошла ошибка во время верификации.'}
              </div>
            )}
          </div>
          
          <ol className="text-left mb-6 space-y-2">
            <li className="flex items-start">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
              <span>Откройте Telegram и найдите <a href="https://t.me/roll_to_help_bot" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-medium">@roll_to_help_bot</a></span>
            </li>
            <li className="flex items-start">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
              <span>Запустите бота, нажав "Start" или набрав /start</span>
            </li>
            <li className="flex items-start">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
              <span>Отправьте код верификации боту</span>
            </li>
            <li className="flex items-start">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
              <span>Подождите здесь, пока мы верифицируем ваш аккаунт</span>
            </li>
          </ol>
          <button
            onClick={() => {
              setVerificationCode(null);
              setChannelId(null);
              setVerificationStatus('idle');
              setError(null);
              wsRef.current?.close();
            }}
            className="text-sm text-gray-500 hover:text-gray-700 mt-4"
          >
            Отмена / Попробовать снова
          </button>
        </div>
      ) : verificationStatus === 'verified' ? (
         <div className="text-center p-4 bg-green-50 rounded-md">
            <p className="text-green-700 font-semibold">Успешно связано!</p>
            <p className="text-gray-600 mt-2">
                Вы вошли в систему. Теперь вы можете участвовать в аукционе.
            </p>
            <button 
                onClick={() => router.push('/games')}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
                Перейти к играм
            </button>
         </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <button
            type="button"
            onClick={handleGenerateCodeClick}
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Генерация кода...
              </span>
            ) : (
              'Получить код для связи с Telegram'
            )}
          </button>
        </div>
      )}
    </div>
  );
} 