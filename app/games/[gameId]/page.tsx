'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import GameAuctionArea from '@/app/components/GameAuctionArea';
import { Game, Bid, User } from '@/app/types';

type GameWithBids = Game & {
  bids: (Bid & { user: User })[];
  event: {
    id: string;
    endDate: Date | string;
    isActive: boolean;
  };
};

export default function GamePage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<GameWithBids | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchGame() {
      try {
        console.log('Client - Fetching game data for:', gameId);
        
        // Fetch game data
        const response = await fetch(`/api/games/${gameId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch game data');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.data.game) {
          throw new Error('Game not found');
        }
        
        setGame(data.data.game);
      } catch (err) {
        console.error('Error fetching game:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>;
  }

  if (error || !game || !game.event) {
    return notFound();
  }

  return <GameAuctionArea initialGameData={game} />;
} 