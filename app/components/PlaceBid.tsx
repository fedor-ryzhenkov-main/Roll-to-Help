'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTelegram } from '@/app/context/TelegramContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bid } from '@/app/types';
import ErrorMessage from './ErrorMessage';
import ErrorBoundary from './ErrorBoundary';
import { apiClient, ApiError } from '@/app/utils/api-client';

interface PlaceBidProps {
  gameId: string;
  startingPrice: number;
  currentMinWinningBid: number;
}

// Define form schema dynamically based on minimum bid required
const createBidSchema = (minBid: number) => z.object({
  amount: z.number()
            .positive('Сумма должна быть положительной')
            // Use Lari symbol ₾
            .min(minBid, `Сумма должна быть не менее ${minBid.toFixed(2)} ₾, чтобы выиграть`)
            // Add validation for increments if necessary, although min usually handles it
            // .refine(val => (val - minBid) % 10 === 0, { message: 'Сумма должна быть кратна шагу в 10 ₾ сверх минимальной' })
});

export default function PlaceBid({ gameId, startingPrice, currentMinWinningBid }: PlaceBidProps) {
  const { linkedTelegramInfo, isLoading: isLoadingTelegramInfo } = useTelegram();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Corrected logic for minimum bid required:
  // If currentMinWinningBid is still the starting price, the minimum is the starting price.
  // Otherwise, it's the lowest winning bid + increment.
  const minBidRequired = currentMinWinningBid <= startingPrice 
                          ? startingPrice 
                          : currentMinWinningBid + 10; // Use 10 GEL increment
  
  const bidSchema = createBidSchema(minBidRequired);
  
  type BidFormData = z.infer<typeof bidSchema>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BidFormData>({ 
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: parseFloat(minBidRequired.toFixed(2)) // Pre-fill with minimum required
    }
  });

  // Determine if user is allowed to bid
  const canBid = !isLoadingTelegramInfo && !!linkedTelegramInfo;

  const resetApiState = () => setError(null);

  const handlePlaceBid = async (data: BidFormData) => {
    // Reset states
    setSuccessMessage(null);
    setError(null);
    resetApiState();

    if (!canBid || !linkedTelegramInfo) {
      setError('Пожалуйста, сначала свяжите ваш Telegram аккаунт.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use apiClient which handles CSRF headers automatically
      console.log("Submitting bid via apiClient...");
      
      const payload = {
        gameId,
        amount: data.amount,
      };
      
      // apiClient.post returns the full ApiResponse { success, data, ... } on success
      // Specify the expected type for the nested data
      const responseData = await apiClient.post<{ data: { bid: Bid } }>('/api/bids', payload); 
      
      // Check the success flag and access the bid via responseData.data.bid
      if (responseData.success && responseData.data?.bid) { 
          setSuccessMessage(`Успешно! Ваша ставка ${responseData.data.bid.amount.toFixed(2)} ₾ принята!`);
          reset();
          router.refresh(); // Refresh data after successful bid
      } else {
          // Handle cases where success might be true but data is missing, or success is false (though ApiError should handle non-2xx)
          console.error('Bid response indicates failure or unexpected data format:', responseData);
          throw new Error(responseData.message || 'Неожиданный ответ от сервера.');
      }

    } catch (err) {
      console.error("Bid error:", err);
      
      let errorMessage = 'Произошла ошибка';
      if (err instanceof ApiError) {
        // Use message from ApiError
        errorMessage = err.message;
        // Handle specific statuses
        if (err.status === 401) {
           errorMessage = 'Ошибка аутентификации. Попробуйте войти снова.';
        } else if (err.status === 403) {
           errorMessage = 'Ошибка безопасности (CSRF). Попробуйте обновить страницу.';
        } else if (err.status === 400) {
           // Keep the specific validation message from the API if it's a 400 Bad Request
           errorMessage = err.message || 'Неверные данные ставки.'; 
        } 
      } else if (err instanceof Error) {
        // Handle generic JS errors
        errorMessage = err.message;
      } 
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while session is loading
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
              onDismiss={resetApiState}
            />
          )}
          
          {/* Display success message */}
          {successMessage && (
            <ErrorMessage 
              message={successMessage} 
              severity="info" 
              className="bg-green-50 border-green-300 text-green-700"
              onDismiss={() => setSuccessMessage(null)}
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