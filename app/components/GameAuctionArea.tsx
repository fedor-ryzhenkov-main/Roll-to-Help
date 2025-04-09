'use client';

import Link from 'next/link';
import Image from "next/image";
import PlaceBid from '@/app/components/PlaceBid';
import BidList from '@/app/components/BidList';
import AuctionTimer from '@/app/components/AuctionTimer';
import { Game, Bid, User } from '@/app/types';
import { useState, useEffect } from 'react';

type GameWithBids = Game & {
  bids: (Bid & { user: User })[];
  event: {
    id: string;
    endDate: Date | string;
    isActive: boolean;
  };
};

interface GameAuctionAreaProps {
  initialGameData: GameWithBids;
}

/**
 * Client component responsible for rendering the main game auction interface,
 * including details, timer, bid list, and the place bid form.
 * Handles the state related to the auction ending.
 */
export default function GameAuctionArea({ initialGameData }: GameAuctionAreaProps) {
  const gameData = initialGameData; 
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);
  const [currentMinWinningBid, setCurrentMinWinningBid] = useState(0);

  useEffect(() => {
    console.log("GameAuctionArea useEffect triggered. End date:", gameData.event.endDate);
    const endDate = new Date(gameData.event.endDate);
    setIsAuctionEnded(endDate < new Date());
    
    const bids = gameData.bids || [];
    const topBids = bids.slice(0, gameData.totalSeats);
    const calculatedMinBid = topBids.length === gameData.totalSeats && topBids.length > 0
                             ? topBids[topBids.length - 1].amount
                             : gameData.startingPrice;
    setCurrentMinWinningBid(calculatedMinBid);

  }, [gameData]); 

  const handleTimerEnd = () => {
    console.log("GameAuctionArea timer ended.");
    setIsAuctionEnded(true);
  };

  const displayBids = gameData.bids || [];
  console.log(`GameAuctionArea rendering. isAuctionEnded: ${isAuctionEnded}, Bid count: ${displayBids.length}`);

  return (
    <div className="min-h-screen py-12">
      <main className="container mx-auto px-4">
        {/* Back Link */}
        <Link href="/games" className="text-orange-600 hover:text-orange-700 font-medium inline-block mb-6">
          &larr; Назад к играм
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            {/* Image */}
            <div className="md:flex-shrink-0">
              <div className="relative h-64 w-full md:w-96">
                <Image
                  src={gameData.imageUrl || 'https://placehold.co/600x400/EEE/31343C?text=No+Image'}
                  alt={gameData.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
            
            {/* Details */}
            <div className="p-8 flex-grow">
              <h1 className="text-3xl font-bold text-purple-900 mb-4">{gameData.name}</h1>
              <div className="mb-4 space-y-1">
                <p className="text-sm text-gray-600"><span className="font-semibold">Система:</span> {gameData.system}</p>
                <p className="text-sm text-gray-600"><span className="font-semibold">Жанр:</span> {gameData.genre}</p>
              </div>
              <p className="text-gray-700 mb-4">{gameData.description || 'Описание отсутствует.'}</p>
              
              {/* Render Timer */}
              {gameData.event.endDate && (
                 <div className="mt-4">
                   <AuctionTimer endDate={gameData.event.endDate} onTimerEnd={handleTimerEnd} />
                 </div>
              )}
            </div>
          </div>
          
          {/* Bidding Section */}
          <div className="p-8 border-t border-gray-200 md:flex md:space-x-8">
            {/* Top Bids - Use BidList component */}
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">Текущие ставки ({displayBids.slice(0, gameData.totalSeats).length} / {gameData.totalSeats} мест)</h2>
              <BidList bids={displayBids} totalSeats={gameData.totalSeats} />
              <p className="text-sm text-gray-500 mt-4">
                Минимальная ставка для попадания в топ {gameData.totalSeats}: {`${currentMinWinningBid.toFixed(2)} ₾`}
              </p>
            </div>
            
            {/* Conditionally Render PlaceBid Component */}
            <div className="md:w-1/2">
              {!isAuctionEnded ? (
                <PlaceBid 
                  gameId={gameData.id} 
                  startingPrice={gameData.startingPrice} 
                  currentMinWinningBid={currentMinWinningBid} 
                />
              ) : (
                <div className="bg-red-100 p-6 rounded-lg shadow-inner text-center">
                  <h2 className="text-xl font-semibold text-red-700">Аукцион завершен</h2>
                  <p className="text-gray-700 mt-2">Ставки больше не принимаются.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 