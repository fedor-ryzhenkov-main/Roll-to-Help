'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { apiClient, ApiError } from '@/app/utils/api-client';

interface TelegramLoginProps {
  callbackUrl?: string;
}

// Interface for verification status response
interface VerificationStatusResponse {
  success: boolean;
  verified?: boolean;
  nextAuthToken?: string | null;
  status?: string;
  error?: string;
}

export default function TelegramLogin({ callbackUrl = '/' }: TelegramLoginProps) {
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('callbackUrl') || callbackUrl || '/';

  // Handle sign-in with NextAuth token
  const handleSignIn = useCallback(async (nextAuthToken: string) => {
    setIsSigningIn(true);
    setError(null);

    try {
      const signInResponse = await signIn('credentials', {
        verificationToken: nextAuthToken,
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
  }, [router, returnUrl]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Set up polling when verification code is available and status is pending
  useEffect(() => {
    if (verificationCode && verificationStatus === 'pending' && !isSigningIn) {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Start polling for verification status
      pollingIntervalRef.current = setInterval(async () => {
        try {
          console.log(`[Polling] Checking verification status for code: ${verificationCode}`);
          const response = await fetch(`/api/auth/telegram/verification-status?code=${verificationCode}`);
          const data: VerificationStatusResponse = await response.json();

          if (!data.success) {
            if (data.status === 'expired') {
              console.warn('[Polling] Verification code expired');
              setError('Код верификации истек. Пожалуйста, получите новый код.');
              setVerificationStatus('error');
              clearInterval(pollingIntervalRef.current!);
            } else {
              console.error('[Polling] Error checking verification status:', data.error);
            }
            return;
          }

          // If verified, proceed with sign-in
          if (data.verified && data.nextAuthToken) {
            console.log('[Polling] Verification successful, proceeding with sign-in');
            clearInterval(pollingIntervalRef.current!);
            
            // Sign in with the NextAuth token
            setIsSigningIn(true);
            handleSignIn(data.nextAuthToken);
          }
        } catch (err) {
          console.error('[Polling] Error fetching verification status:', err);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollingIntervalRef.current && (verificationStatus !== 'pending' || isSigningIn)) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [verificationCode, verificationStatus, isSigningIn, handleSignIn]);
  
  const handleGenerateCodeClick = async () => {
    if (isLoading || isSigningIn) return;
    
    try {
      setIsLoading(true);
      setIsSigningIn(false);
      setError(null);
      setVerificationCode(null);
      setVerificationStatus('idle');
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      const result = await apiClient.post<{
         success: boolean; 
         verificationCode?: string; 
         error?: string 
      }>('/api/auth/telegram');
      
      if (!result.success) {
        throw new Error(result.error || 'Не удалось сгенерировать код верификации');
      }
      
      setVerificationCode(result.verificationCode || null);
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