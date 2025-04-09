'use client';

// REMOVED: import { useTelegram } from '@/app/context/TelegramContext';
import { useSession } from 'next-auth/react'; // Import useSession
import { formatBidderCreatureName } from '@/app/utils/creatureNames';
import { useEffect } from 'react';

// Define the structure of a bid passed to this component
interface Bid {
  id: string | number;
  amount: number;
  userId: string; // Ensure userId is always present
  // Add other relevant bid fields if needed, e.g., createdAt
}

// Define the props for the BidList component
interface BidListProps {
  bids: Bid[];
  totalSeats: number;
}

/**
 * Client component responsible for rendering a list of bids.
 * It fetches the current user session and highlights the user's bids.
 */
export default function BidList({ bids, totalSeats }: BidListProps) {
  console.log('BidList Component Rendered');
  // Use useSession to get authentication status and user data
  const { data: session, status } = useSession();
  const isLoadingSession = status === 'loading';
  // @ts-expect-error - we have added sub field to session.user in our NextAuth config
  const currentUserId = session?.user?.sub; // Get user ID from session

  // Determine the top bids based on the totalSeats
  const topBids = bids.slice(0, totalSeats);

  // Log session status and current user ID for debugging
  useEffect(() => {
    console.log('BidList useEffect - Session status:', status);
    console.log('BidList useEffect - Current User ID from session:', currentUserId);
  }, [status, currentUserId]);

  if (isLoadingSession) {
    console.log('BidList: Session Loading...');
    return <p>Загрузка данных пользователя...</p>;
  }

  if (topBids.length === 0) {
    return <p className="text-gray-600 italic">Ставок еще нет. Будьте первым!</p>;
  }

  console.log(`BidList: Rendering ${topBids.length} bids. Current User: ${currentUserId}`);

  return (
    <ul className="space-y-3">
      {topBids.map((bid, index) => {
        const isCurrentUserBid = bid.userId === currentUserId;
        const isWinning = index < totalSeats; // All displayed bids are potentially winning
        const rank = index + 1;

        return (
          <li 
            key={bid.id} 
            className={`p-3 rounded-lg flex justify-between items-center transition-all duration-200 ease-in-out ${isCurrentUserBid ? 'bg-purple-100 shadow-md scale-[1.02]' : 'bg-white shadow-sm'} ${isWinning ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'}`}
          >
            <div className="flex items-center space-x-3">
              <span 
                className={`font-bold text-lg w-8 text-center ${isWinning ? 'text-green-700' : 'text-gray-500'}`}
              >
                {rank}.
              </span>
              <span className={`font-semibold ${isCurrentUserBid ? 'text-purple-800' : 'text-gray-800'}`}>
                {formatBidderCreatureName(bid.userId)}
              </span>
            </div>
            <span className={`text-lg font-medium ${isWinning ? 'text-green-600' : 'text-gray-600'}`}>
              {bid.amount.toFixed(2)} ₾
            </span>
          </li>
        );
      })}
    </ul>
  );
} 