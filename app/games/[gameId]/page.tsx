import Link from 'next/link';
import Image from "next/image";
import { notFound } from 'next/navigation';
import { getGameWithBids } from "../../lib/utils";
import GameAuctionArea from '@/app/components/GameAuctionArea';
import { Game, Bid } from '@/app/types';

type GameWithBids = Game & {
  bids: (Bid & { user: any })[];
  event: {
    id: string;
    endDate: Date | string;
    isActive: boolean;
  };
};

interface GamePageProps {
  params: { gameId: string };
}

export async function generateMetadata({ params }: { params: { gameId: string } }) {
  const { gameId } = await params;
  
  try {
    const game = await getGameWithBids(gameId) as GameWithBids | null;

    if (!game) {
      return {
        title: 'Игра не найдена',
      };
    }

    return {
      title: `${game.name} - Аукцион Roll to Help`,
      description: game.description?.substring(0, 160) || 'Участвуйте в аукционе за место в игре!',
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Ошибка загрузки',
    };
  }
}

export default async function GamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = await params;
  console.log('Page (Server) - Fetching game data for:', gameId);
  const game = await getGameWithBids(gameId) as GameWithBids | null;

  if (!game || !game.event) {
    console.log('Page (Server) - Game or Event data not found, rendering notFound()');
    notFound(); 
  }

  console.log(`Page (Server) - Initial game data fetched: ${game.name}, Event End: ${game.event.endDate}`);
  
  return <GameAuctionArea initialGameData={game} />;
}

export const revalidate = 60; 