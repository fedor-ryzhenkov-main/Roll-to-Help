'use client';

// REMOVED: import { useTelegram } from '@/app/context/TelegramContext';
import React from 'react';
// Rename imported Bid to BidType to avoid conflict
import { Bid as BidType, User } from '@/app/types';
import { CURRENCY_SYMBOL } from '@/app/config/constants';
import { useSession } from 'next-auth/react'; // Import useSession
import { formatBidderCreatureName } from '@/app/utils/creatureNames'; // Import the formatter
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
  // Ensure the BidType includes createdAt
  bids: (BidType & { user: User; createdAt: string | Date })[]; // Expect user data and createdAt with the bid
  totalSeats: number;
}

/**
 * Client component responsible for rendering a list of bids.
 * It fetches the current user session and highlights the user's bids.
 */
const BidList: React.FC<BidListProps> = ({ bids, totalSeats }) => {
  console.log('BidList Component Rendered');
  const { data: session, status } = useSession();
  const isLoadingSession = status === 'loading';
  const currentUserId = session?.user?.id; // Get current user ID

  // Sort bids by amount descending, then by time ascending for tie-breaking
  const sortedBids = [...bids].sort((a, b) => {
    if (b.amount !== a.amount) {
      return b.amount - a.amount;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const winningBids = sortedBids.slice(0, totalSeats);
  const winningBidIds = new Set(winningBids.map(bid => bid.id));

  // Log session status and current user ID for debugging
  useEffect(() => {
    console.log('BidList useEffect - Session status:', status);
    console.log('BidList useEffect - Current User ID from session:', currentUserId);
  }, [status, currentUserId]);

  if (isLoadingSession) {
    console.log('BidList: Session Loading...');
    return <p>Загрузка данных пользователя...</p>;
  }

  if (sortedBids.length === 0) {
    return <p className="text-gray-500 italic">Ставок пока нет.</p>;
  }

  console.log(`BidList: Rendering ${sortedBids.length} bids. Current User: ${currentUserId}`);

  return (
    <div className="space-y-3">
      {sortedBids.length === 0 ? (
        <p className="text-gray-500 italic">Ставок пока нет.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {sortedBids.map((bid, index) => {
            const isWinning = winningBidIds.has(bid.id);
            const isCurrentUserBid = bid.userId === currentUserId;
            const bidderName = formatBidderCreatureName(bid.userId, isCurrentUserBid); // Use the formatter

            return (
              <li 
                key={bid.id}
                className={`py-3 flex justify-between items-center ${isWinning ? 'font-semibold' : ''} ${isCurrentUserBid ? 'text-indigo-700 bg-indigo-50 px-2 -mx-2 rounded' : 'text-gray-800'}`}
              >
                <span className="flex items-center">
                  <span className={`mr-2 text-sm ${isWinning ? 'text-green-600' : 'text-gray-400'}`}>
                    {index + 1}.
                  </span>
                  <span>{bidderName}</span> {/* Display formatted name */}
                </span>
                <span className={isWinning ? 'text-green-700' : 'text-gray-600'}>
                  {bid.amount.toFixed(2)} {CURRENCY_SYMBOL}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BidList; 