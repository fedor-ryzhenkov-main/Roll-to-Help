import prisma from "@/app/lib/db";
import Link from "next/link";
import Image from "next/image";
import { notFound } from 'next/navigation';
import PlaceBid from '@/app/components/PlaceBid'; // We'll create this next

// Fetch game data including top bids
async function getGameData(gameId: number) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      event: true,
      bids: {
        orderBy: {
          amount: 'desc',
        },
        include: {
          user: { // Include user details for display (if needed)
            select: {
              username: true,
              telegramUsername: true,
            },
          },
        },
      },
    },
  });

  if (!game) {
    notFound(); // Trigger 404 if game not found
  }
  
  // Determine top bids based on totalSeats
  const topBids = game.bids.slice(0, game.totalSeats);
  // Get the current winning threshold (lowest winning bid or starting bid)
  const currentMinWinningBid = topBids.length === game.totalSeats 
                             ? topBids[topBids.length - 1].amount 
                             : game.startingBid;

  return { game, topBids, currentMinWinningBid };
}

interface GamePageProps {
  params: { gameId: string };
}

// Generate Metadata dynamically
export async function generateMetadata({ params }: GamePageProps) {
  const gameId = parseInt(params.gameId, 10);
  const { game } = await getGameData(gameId); 
  return {
    title: `${game.title} - Roll to Help Auction`,
    description: game.description || `Bid on a seat for the ${game.title} tabletop game session.`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const gameId = parseInt(params.gameId, 10);
  
  // Handle potential NaN if params.gameId is not a number
  if (isNaN(gameId)) {
      notFound();
  }
  
  const { game, topBids, currentMinWinningBid } = await getGameData(gameId);

  return (
    <div className="min-h-screen bg-amber-50 py-12">
      <main className="container mx-auto px-4">
        {/* Back Link */}
        <Link href="/games" className="text-orange-600 hover:text-orange-700 font-medium inline-block mb-6">
          &larr; Back to Games
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            {/* Image */}
            <div className="md:flex-shrink-0">
              <div className="relative h-64 w-full md:w-96">
                <Image
                  src={game.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={game.title}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </div>
            
            {/* Details */}
            <div className="p-8 flex-grow">
              <h1 className="text-3xl font-bold text-purple-900 mb-4">{game.title}</h1>
              <p className="text-gray-700 mb-4">{game.description || 'No description available.'}</p>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <span className="font-semibold text-gray-600 block">Game Master:</span>
                  <span>{game.gameMaster || 'TBA'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block">Total Seats:</span>
                  <span>{game.totalSeats}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block">Event:</span>
                  <span>{game.event.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 block">Starting Bid:</span>
                  <span>${game.startingBid.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bidding Section */}
          <div className="p-8 border-t border-gray-200 md:flex md:space-x-8">
            {/* Top Bids */}
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">Current Top Bids ({topBids.length} / {game.totalSeats} Seats)</h2>
              {topBids.length === 0 ? (
                <p className="text-gray-600 italic">No bids placed yet. Be the first!</p>
              ) : (
                <ul className="space-y-2">
                  {topBids.map((bid, index) => (
                    <li key={bid.id} className="flex justify-between items-center p-2 bg-amber-50 rounded">
                      <span className="font-medium">
                        {index + 1}. {bid.user?.username || bid.user?.telegramUsername || 'Anonymous'}
                      </span>
                      <span className="font-bold text-purple-800">
                        ${bid.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-gray-500 mt-4">
                Minimum bid to be in the top {game.totalSeats}: ${currentMinWinningBid.toFixed(2)}
              </p>
            </div>
            
            {/* Place Bid Component */}
            <div className="md:w-1/2">
               <PlaceBid gameId={game.id} startingBid={game.startingBid} currentMinWinningBid={currentMinWinningBid} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Revalidate this page frequently (e.g., every minute) to show updated bids
export const revalidate = 60; // Revalidate every 60 seconds 