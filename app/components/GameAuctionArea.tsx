'use client';

import Link from 'next/link';
import Image from "next/image";
import PlaceBid from '@/app/components/PlaceBid';
import BidList from '@/app/components/BidList';
import { Game, Bid, User } from '@/app/types';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

type BidWithUser = Bid & { 
  user: User; 
  createdAt: string | Date;
};

type GameWithBids = Game & {
  bids: BidWithUser[];
  minBidIncrement: number;
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
  const [gameData, setGameData] = useState<GameWithBids>(initialGameData);
  const [currentMinWinningBid, setCurrentMinWinningBid] = useState(0);

  useEffect(() => {
    console.log("GameAuctionArea useEffect triggered. Game ID:", gameData.id);
    const bids = gameData.bids || [];
    const topBids = bids.slice(0, gameData.totalSeats);
    const calculatedMinBid = topBids.length === gameData.totalSeats && topBids.length > 0
                             ? topBids[topBids.length - 1].amount
                             : gameData.startingPrice;
    setCurrentMinWinningBid(calculatedMinBid);

  }, [gameData]); 

  useEffect(() => {
    const gameId = gameData.id;
    console.log(`[SSE Debug] Attempting to setup EventSource for game: ${gameId}`);
    const eventSourceUrl = `/api/bids/stream?gameId=${gameId}`;
    console.log(`[SSE Debug] Connecting to URL: ${eventSourceUrl}`);
    
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(eventSourceUrl);
    } catch (err) {
        console.error(`[SSE Debug] Error creating EventSource instance:`, err);
        return;
    }
    
    console.log(`[SSE Debug] EventSource instance created.`);

    eventSource.onopen = () => {
      console.log(`[SSE] Connection opened successfully for game: ${gameId}`);
    };

    eventSource.addEventListener('new_bid', (event) => {
      console.log(`[SSE Debug] Received event of type: ${event.type}`);
      console.log(`[SSE Debug] Raw event data:`, event.data);
      try {
        const newBid = JSON.parse(event.data) as BidWithUser;
        console.log('[SSE] Parsed new_bid event data:', newBid);

        setGameData((prevData) => {
          if (prevData.bids.some(b => b.id === newBid.id)) {
            console.log(`[SSE Debug] Bid ${newBid.id} already exists, skipping update.`);
            return prevData;
          }
          console.log(`[SSE Debug] Adding new bid ${newBid.id} to state.`);
          const updatedBids = [...prevData.bids, newBid];
          return { ...prevData, bids: updatedBids };
        });
        toast.success(`Новая ставка: ${newBid.amount.toFixed(2)} ₾!`);
      } catch (error) {
        console.error('[SSE] Error parsing new_bid event data:', error);
        toast.error('Ошибка при обработке обновления ставки.');
      }
    });

    eventSource.onerror = (errorEvent) => {
      console.error('[SSE] EventSource encountered an error:', errorEvent);
      if (eventSource?.readyState === EventSource.CLOSED) {
          console.warn('[SSE Debug] EventSource connection closed.');
      } else if (eventSource?.readyState === EventSource.CONNECTING) {
          console.warn('[SSE Debug] EventSource is attempting to reconnect...');
      }
    };

    return () => {
      if (eventSource) {
        console.log(`[SSE Debug] Cleaning up and closing EventSource for game: ${gameId}`);
        eventSource.close();
      } else {
         console.log(`[SSE Debug] Cleanup called but eventSource was null.`);
      }
    };

  }, [gameData.id]);

  useEffect(() => {
    console.log("Recalculating min winning bid. Bids count:", gameData.bids.length);
    const bids = gameData.bids || [];
    const sortedBids = [...bids].sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const topBids = sortedBids.slice(0, gameData.totalSeats);
    const calculatedMinBid = topBids.length === gameData.totalSeats && topBids.length > 0
                             ? topBids[topBids.length - 1].amount + 0.01
                             : gameData.startingPrice;
    
    setCurrentMinWinningBid(Math.max(parseFloat(calculatedMinBid.toFixed(2)), gameData.startingPrice));

  }, [gameData.bids, gameData.totalSeats, gameData.startingPrice, gameData.minBidIncrement]);

  const displayBids = gameData.bids || [];
  console.log(`GameAuctionArea rendering. Bid count: ${displayBids.length}`);

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
            </div>
          </div>
          
          {/* Bidding Section */}
          <div className="p-8 border-t border-gray-200 md:flex md:space-x-8">
            {/* Top Bids - Use BidList component */}
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">Текущие ставки ({displayBids.filter(b => b.isWinning).length} / {gameData.totalSeats} мест)</h2>
              <BidList bids={displayBids} totalSeats={gameData.totalSeats} />
              <p className="text-sm text-gray-500 mt-4">
                Минимальная ставка для попадания в топ {gameData.totalSeats}: {`${currentMinWinningBid.toFixed(2)} ₾`}
              </p>
            </div>
            
            {/* Conditionally Render PlaceBid Component */}
            <div className="md:w-1/2">
              {gameData.event.isActive ? (
                <PlaceBid 
                  gameId={gameData.id} 
                  startingPrice={gameData.startingPrice} 
                  currentMinWinningBid={currentMinWinningBid} 
                  minBidIncrement={gameData.minBidIncrement}
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