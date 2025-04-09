'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bid } from '@/app/types';
import ErrorMessage from './ErrorMessage';
import ErrorBoundary from './ErrorBoundary';
import { apiClient, ApiError } from '@/app/utils/api-client';
import { toast } from 'react-hot-toast';
import { Button } from '@/app/components/ui/Button';
import { Alert } from "@/app/components/ui/Alert";
import { Terminal, UserPlus } from "lucide-react"

// Define schema creation function locally
const createBidSchema = (minBid: number) => z.object({
  amount: z.number({
      required_error: "Сумма ставки обязательна",
      invalid_type_error: "Сумма должна быть числом",
    })
    .positive('Сумма должна быть положительной')
    .min(minBid, `Минимальная ставка: ${minBid.toFixed(2)} ₾`)
    .refine(val => val * 100 === Math.floor(val * 100), { // Check for max 2 decimal places
        message: "Пожалуйста, укажите не более двух знаков после запятой."
    })
});

interface PlaceBidProps {
  gameId: string;
  startingPrice: number;
  currentMinWinningBid: number;
  onBidPlaced?: (newBid: Bid) => void;
}

export default function PlaceBid({ 
    gameId, 
    startingPrice, 
    currentMinWinningBid, 
    onBidPlaced 
}: PlaceBidProps) {
  // Use useSession hook for status only
  const { status } = useSession(); 
  const isLoadingSession = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const minBidRequired = currentMinWinningBid <= startingPrice 
                          ? startingPrice 
                          : currentMinWinningBid + 1;
  
  const bidSchema = createBidSchema(minBidRequired);
  type BidFormData = z.infer<typeof bidSchema>;

  // Only get needed methods/state from useForm
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BidFormData>({ 
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: parseFloat(minBidRequired.toFixed(2))
    }
  });

  const canBid = !isLoadingSession && isAuthenticated;

  const handlePlaceBid = async (data: BidFormData) => {
    setError(null);

    if (!canBid) {
      setError('Пожалуйста, сначала войдите через Telegram.');
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
          toast.success(`Успешно! Ваша ставка ${result.bid.amount.toFixed(2)} ₾ принята!`);
          reset();
          if (onBidPlaced) {
            onBidPlaced(result.bid);
          }
          router.refresh();
      } else {
          console.error('Bid response successful but data format unexpected:', result);
          setError('Получен неожиданный ответ от сервера.');
          toast.error('Получен неожиданный ответ от сервера.');
      }

    } catch (err) {
      console.error('Bid submission error:', err);
      let message = 'Произошла ошибка при размещении ставки.';
      if (err instanceof ApiError) {
        message = err.message || message;
      } else if (err instanceof Error) {
        message = err.message || message;
      }
      setError(message);
      toast.error(`Ошибка ставки: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary fallback={<p>Ошибка загрузки формы ставки.</p>}>
      <form onSubmit={handleSubmit(handlePlaceBid)} className="space-y-4 p-4 border rounded-lg shadow bg-white">
        <h3 className="text-lg font-semibold text-purple-800 border-b pb-2 mb-3">Сделать ставку</h3>
        
        {isLoadingSession && (
             <p className="text-sm text-gray-500">Проверка статуса входа...</p>
        )}
        {!isLoadingSession && !isAuthenticated && (
            <Alert icon={<UserPlus className="h-5 w-5" />} className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <h5 className="font-semibold mb-1">Требуется вход</h5>
              <div className="text-sm text-yellow-700">
                Пожалуйста, <Link href={`/link-telegram?callbackUrl=/games/${gameId}`} className="font-medium underline hover:text-yellow-900">войдите через Telegram</Link>, чтобы сделать ставку.
              </div>
            </Alert>
        )}
        
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Ваша ставка (Минимум: {minBidRequired.toFixed(2)} ₾)</label>
          <input 
            id="amount"
            type="number"
            step="0.01" 
            {...register('amount', { valueAsNumber: true })} 
            placeholder={`Например, ${minBidRequired.toFixed(2)}`}
            aria-invalid={errors.amount ? "true" : "false"}
            disabled={!canBid || isSubmitting}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-500 ring-red-500' : 'border-gray-300 ring-purple-500'}`}
          />
          {errors.amount && (
            <ErrorMessage message={errors.amount.message || 'Неверная сумма'} />
          )}
        </div>

        {error && (
          <Alert variant="error" title="Ошибка" icon={<Terminal className="h-5 w-5" />}>
            <div className="text-sm">{error}</div>
          </Alert>
        )}

        <Button 
          type="submit" 
          disabled={!canBid || isSubmitting || !!errors.amount}
          className="w-full"
        >
          {isSubmitting ? 'Размещение ставки...' : 'Сделать ставку'}
        </Button>
      </form>
    </ErrorBoundary>
  );
} 