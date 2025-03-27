'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCurrency } from '../lib/utils'

// Define the form schema with Zod
const bidFormSchema = z.object({
  telegramName: z.string().min(3, "Telegram username must be at least 3 characters"),
  amount: z.coerce.number().positive("Amount must be positive"),
})

type BidFormData = z.infer<typeof bidFormSchema>

interface BidFormProps {
  gameId: number
  minBidAmount: number
  onCancel: () => void
  onSuccess: () => void
}

export default function BidForm({ gameId, minBidAmount, onCancel, onSuccess }: BidFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm<BidFormData>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      telegramName: '',
      amount: minBidAmount,
    }
  })

  const onSubmit = async (data: BidFormData) => {
    // Validate the bid amount against minimum bid
    if (data.amount < minBidAmount) {
      setError(`Bid must be at least ${formatCurrency(minBidAmount)}`)
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          telegramName: data.telegramName,
          amount: data.amount,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit bid')
      }
      
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-4 bg-purple-50 p-4 rounded-md border border-purple-100">
      <h4 className="text-lg font-semibold mb-3 text-purple-900">Place Your Bid</h4>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label htmlFor="telegramName" className="block text-purple-900 font-medium mb-2 text-sm">
            Your Telegram Username
          </label>
          <input
            id="telegramName"
            type="text"
            className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            placeholder="@username"
            {...register('telegramName')}
          />
          {errors.telegramName && (
            <p className="text-red-600 text-xs mt-1">{errors.telegramName.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="amount" className="block text-purple-900 font-medium mb-2 text-sm">
            Bid Amount ({formatCurrency(minBidAmount)} minimum)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min={minBidAmount}
            className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            {...register('amount')}
          />
          {errors.amount && (
            <p className="text-red-600 text-xs mt-1">{errors.amount.message}</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Place Bid'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
} 