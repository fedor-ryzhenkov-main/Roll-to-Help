'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/app/utils/api-client'
import { Button } from '@/app/components/ui/Button'
import { Alert } from '@/app/components/ui/Alert'
import { useTelegram } from '@/app/context/TelegramContext'

interface BidFormProps {
  gameId: string | number
  minBidAmount: number
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  amount: number
}

export default function BidForm({ 
  gameId, 
  minBidAmount,
  onSuccess, 
  onCancel 
}: BidFormProps) {
  const { linkedTelegramInfo, isLoading: isTelegramLoading } = useTelegram()
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>()
  const [apiError, setApiError] = useState<string | null>(null)

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    
    if (isTelegramLoading) return
    if (!linkedTelegramInfo || !linkedTelegramInfo.id) {
      setApiError('Необходимо связать аккаунт Telegram для размещения ставки.')
      toast.error('Свяжите аккаунт Telegram!')
      return
    }
    
    const payload = {
      gameId: gameId.toString(),
      amount: data.amount,
    }
    
    console.log('Submitting bid:', payload)

    try {
      const response = await apiClient.post('/api/bids', payload)

      if (response.success) {
        toast.success('Ставка успешно размещена!')
        reset()
        if (onSuccess) onSuccess()
      } else {
        const errorMsg = response.message || 'Не удалось разместить ставку'
        if (response.status === 401) {
          toast.error('Ошибка аутентификации. Попробуйте войти снова.')
        } else {
          toast.error(`Ошибка ставки: ${errorMsg}`)
        }
        setApiError(errorMsg)
      }
    } catch (error) {
      console.error('Bid submission error:', error)
      const message = error instanceof Error ? error.message : 'Произошла ошибка сервера'
      setApiError(message)
      toast.error(`Ошибка ставки: ${message}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-gray-50 rounded-md border">
      <h4 className="text-lg font-semibold text-purple-800">Разместить ставку</h4>
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Ваша ставка
        </label>
        <input
          id="amount"
          type="number"
          step="1"
          min={minBidAmount}
          {...register('amount', {
            required: 'Сумма ставки обязательна',
            valueAsNumber: true,
            min: {
              value: minBidAmount,
              message: `Минимальная ставка: ${minBidAmount}`
            }
          })}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'}`}
          placeholder={`Минимум ${minBidAmount}`}
          disabled={isSubmitting || isTelegramLoading || !linkedTelegramInfo}
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>
      
      {!linkedTelegramInfo && !isTelegramLoading && (
        <p className="text-sm text-red-600">Пожалуйста, свяжите ваш аккаунт Telegram в настройках, чтобы делать ставки.</p>
      )}

      {apiError && (
        <Alert type="error">{apiError}</Alert>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel} 
            disabled={isSubmitting}
          >
            Отмена
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting || isTelegramLoading || !linkedTelegramInfo}
        >
          {isSubmitting ? 'Размещение...' : 'Сделать ставку'}
        </Button>
      </div>
    </form>
  )
} 