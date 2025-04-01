'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlaceBidProps {
  gameId: number;
  startingBid: number;
  currentMinWinningBid: number;
}

// Define form schema dynamically based on minimum bid required
const createBidSchema = (minBid: number) => z.object({
  amount: z.number()
            .positive('Bid must be positive')
            .min(minBid, `Bid must be at least $${minBid.toFixed(2)} to be winning`)
            // Optional: Add a reasonable upper limit if desired
            // .max(10000, 'Maximum bid limit reached'),
});

export default function PlaceBid({ gameId, startingBid, currentMinWinningBid }: PlaceBidProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Determine the actual minimum bid required to potentially win
  const minBidRequired = Math.max(startingBid, currentMinWinningBid + 0.01);
  const bidSchema = createBidSchema(minBidRequired);
  type BidFormData = z.infer<typeof bidSchema>;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: parseFloat(minBidRequired.toFixed(2)) // Pre-fill with minimum required
    }
  });

  const handlePlaceBid = async (data: BidFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (status === 'unauthenticated') {
      // Redirect to login, then back to this game page
      signIn(undefined, { callbackUrl: `/games/${gameId}` });
      return; // Stop execution here
    }

    if (!session?.user.isVerified) {
      setError('Please verify your Telegram account before bidding.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, amount: data.amount }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to place bid');
      }

      // Success!
      setSuccessMessage(`Successfully placed bid of $${data.amount.toFixed(2)}!`);
      reset(); // Reset form fields
      router.refresh(); // Refresh server components (bid list)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-amber-50 p-6 rounded-lg shadow-inner">
      <h2 className="text-xl font-semibold text-purple-900 mb-4">Place Your Bid</h2>

      {status === 'unauthenticated' ? (
        <button 
          onClick={() => signIn(undefined, { callbackUrl: `/games/${gameId}` })}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Login to Place Bid
        </button>
      ) : !session?.user.isVerified ? (
        <div className="text-center p-4 bg-orange-100 border border-orange-300 text-orange-700 rounded-md">
          <p className="font-medium">Verification Required</p>
          <p className="text-sm mb-3">Please link and verify your Telegram account to place bids.</p>
          <Link href="/link-telegram" className="text-orange-600 hover:underline text-sm font-medium">
             Go to Verification
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handlePlaceBid)} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Your Bid Amount ($)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01" // Allow cents
              {...register('amount', { valueAsNumber: true })} // Ensure value is treated as number
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'}`}
              placeholder={`Min $${minBidRequired.toFixed(2)}`}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {successMessage && (
             <div className="bg-green-100 border border-green-300 text-green-700 p-3 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || status !== 'authenticated' || !session?.user.isVerified}
            className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Placing Bid...
              </span>
            ) : (
              'Place Bid'
            )}
          </button>
        </form>
      )}
    </div>
  );
} 