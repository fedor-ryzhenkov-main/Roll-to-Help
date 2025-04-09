import prisma from "@/app/lib/db";
import Link from 'next/link';
import Image from "next/image";
import { logApiError } from "@/app/lib/api-utils"; 
import AuctionTimer from '@/app/components/AuctionTimer';


export const dynamic = 'force-dynamic';

async function getActiveGames() {
  try {
    console.log('[getActiveGames] Executing prisma.game.findMany...');
    const games = await prisma.game.findMany({
      where: {
        event: {
          isActive: true, 
        },
      },
      include: {
        event: true, 
      },
      orderBy: {
        name: "asc", 
      },
    });
    return games;
  } catch (error) {
    console.error('[getActiveGames] ERROR fetching games:', error instanceof Error ? error.message : 'Unknown error', 
      error instanceof Error ? error.stack : '');
    logApiError('get-active-games', error); 
    return []; 
  }
}

export const metadata = {
  title: 'Доступные игры - Roll to Help',
  description: 'Просмотр доступных настольных игр для нашего благотворительного аукциона.',
};

export default async function GamesPage() {
  const games = await getActiveGames();

  const eventEndDate = games.length > 0 ? games[0].event.endDate : null;

  return (
    <div className="min-h-screen py-12">
      <main className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-purple-900 mb-8">Доступные игры</h1>

        {eventEndDate && (
          <div className="mb-10 max-w-md mx-auto">
            <AuctionTimer endDate={eventEndDate} />
          </div>
        )}

        {games.length === 0 ? (
          <p className="text-center text-gray-600">Игры будут анонсированы скоро! Зайдите позже.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => (
              <Link href={`/games/${game.id}`} key={game.id}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg cursor-pointer h-full flex flex-col">
                  <div className="relative h-48 w-full">
                    <Image
                      src={game.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={game.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-purple-900 mb-2">{game.name}</h2>
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {game.description || 'Описание отсутствует.'}
                      </p>
                    </div>
                    <div className="mt-4 text-right text-orange-600 font-medium">Подробнее &rarr;</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}