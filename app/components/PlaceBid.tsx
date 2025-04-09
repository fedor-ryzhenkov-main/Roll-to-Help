'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTelegram } from '@/app/context/TelegramContext';
import { useRouter } from 'next/navigation';
import { Bid } from '@/app/types';
import ErrorMessage from './ErrorMessage';
import ErrorBoundary from './ErrorBoundary';
import { apiClient, ApiError } from '@/app/utils/api-client';
import { toast } from 'react-hot-toast';

interface PlaceBidProps {
  gameId: string;
  startingPrice: number;
  currentMinWinningBid: number;
}

const createBidSchema = (minBid: number) => z.object({
  amount: z.number()
            .positive('Сумма должна быть положительной')
            .min(minBid, `Сумма должна быть не менее ${minBid.toFixed(2)} ₾, чтобы выиграть`)

});

export default function PlaceBid({ gameId, startingPrice, currentMinWinningBid }: PlaceBidProps) {
  const { linkedTelegramInfo, isLoading: isLoadingTelegramInfo } = useTelegram();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const minBidRequired = currentMinWinningBid <= startingPrice 
                          ? startingPrice 
                          : currentMinWinningBid + 10; 
  
  const bidSchema = createBidSchema(minBidRequired);
  
  type BidFormData = z.infer<typeof bidSchema>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BidFormData>({ 
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: parseFloat(minBidRequired.toFixed(2)) 
    }
  });

  const canBid = !isLoadingTelegramInfo && !!linkedTelegramInfo;

  const handlePlaceBid = async (data: BidFormData) => {
    setSuccessMessage(null);
    setError(null);

    if (!canBid || !linkedTelegramInfo) {
      setError('Пожалуйста, сначала свяжите ваш Telegram аккаунт.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Submitting bid via apiClient...");

      const payload = {
        gameId,
        amount: data.amount,
      };

      const result = await apiClient.post<{ bid: Bid }>('/api/bids', payload);

      if (result?.bid) {
          setSuccessMessage(`Успешно! Ваша ставка ${result.bid.amount.toFixed(2)} ₾ принята!`);
          reset();
          router.refresh();
      } else {
          console.error('Bid response successful but data format unexpected:', result);
          setError('Получен неожиданный ответ от сервера.');
          toast.error('Получен неожиданный ответ от сервера.');
      }

    } catch (err) {
      console.error("Bid submission error:", err);
      
      let errorMessage = 'Произошла ошибка при размещении ставки.';
      if (err instanceof ApiError) {
        errorMessage = err.message || 'Ошибка API.';
        if (err.status === 401) {
           errorMessage = 'Ошибка аутентификации. Попробуйте войти снова.';
        } else if (err.status === 403) {
           errorMessage = 'Ошибка авторизации или CSRF. Попробуйте обновить страницу.';
        } else if (err.status === 400) {
           errorMessage = err.message || 'Неверные данные ставки.'; 
        } 
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } 
      
      setError(errorMessage);
      toast.error(errorMessage);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTelegramInfo) {
    return <div className="text-center text-gray-500">Загрузка...</div>;
  }

  if (!linkedTelegramInfo) {
    return (
      <div className="text-center p-4 border border-orange-200 rounded-md bg-orange-50">
        <p className="text-orange-700">
          Пожалуйста, <a href="/link-telegram" className="font-semibold underline hover:text-orange-800">свяжите ваш Telegram</a>, чтобы делать ставки.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="bg-amber-50 p-6 rounded-lg shadow-inner">
        <h2 className="text-xl font-semibold text-purple-900 mb-4">Участвуйте в благотворительном аукционе</h2>

        <form onSubmit={handleSubmit(handlePlaceBid)} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Ваша ставка (₾) - мин. {minBidRequired.toFixed(2)}
            </label>
            <input
              id="amount"
              type="number"
              step="10"
              {...register('amount', { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'}`}
              placeholder={`Минимум ${minBidRequired.toFixed(2)}`}
              min={minBidRequired}
              disabled={isSubmitting || !canBid}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>
          
          {/* Display API errors with our error component */}
          {error && (
            <ErrorMessage 
              message={error} 
              severity="error" 
            />
          )}
          
          {/* Display success message */}
          {successMessage && (
            <ErrorMessage 
              message={successMessage} 
              severity="info" 
              className="bg-green-50 border-green-300 text-green-700"
            />
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || !canBid}
            className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Отправка ставки...
              </span>
            ) : (
              'Сделать ставку'
            )}
          </button>
        </form>
      </div>
    </ErrorBoundary>
  );
} 