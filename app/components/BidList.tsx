'use client';

import { useTelegram } from '@/app/context/TelegramContext';
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
  const { linkedTelegramInfo, isLoading: isTelegramLoading } = useTelegram();
  const currentUserId = linkedTelegramInfo?.id;

  // Determine the top bids based on the totalSeats
  const topBids = bids.slice(0, totalSeats);

  // Log Telegram context status and current user ID for debugging
  useEffect(() => {
    console.log('BidList useEffect - Telegram context loading:', isTelegramLoading);
    console.log('BidList useEffect - Current User ID from context:', currentUserId);
  }, [isTelegramLoading, currentUserId]);

  if (isTelegramLoading) {
    console.log('BidList: Telegram Context Loading...');
    return <p>Загрузка данных пользователя...</p>;
  }

  if (topBids.length === 0) {
    return <p className="text-gray-600 italic">Ставок еще нет. Будьте первым!</p>;
  }

  console.log(`BidList: Rendering ${topBids.length} bids. Current User: ${currentUserId}`);

  return (
    <ul className="space-y-2">
      {topBids.map((bid, index) => {
        // Determine if the current bid belongs to the logged-in user
        const isYourBid = !!currentUserId && bid.userId === currentUserId;
        
        // Log comparison result for debugging
        console.log(`BidList Map - Bid ${bid.id}: bidUserId=${bid.userId}, currentUserId=${currentUserId}, isYourBid=${isYourBid}`);
        
        return (
          <li 
            key={bid.id} 
            className={`flex justify-between items-center p-2 rounded ${isYourBid ? 'bg-green-100 border border-green-300' : 'bg-amber-50'}`}
          >
            <span className="font-medium">
              {/* Display index, formatted creature name, and indicator */} 
              {index + 1}. {formatBidderCreatureName(bid.userId, isYourBid)}
              {isYourBid && <span className="ml-2 text-green-600 font-bold">← Ваша ставка</span>}
            </span>
            {/* Display the bid amount */} 
            <span className="font-bold text-purple-800">
              {/* Inline formatting */} 
              {`${bid.amount.toFixed(2)} ₾`}
            </span>
          </li>
        );
      })}
    </ul>
  );
} 