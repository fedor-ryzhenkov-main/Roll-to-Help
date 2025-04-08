import prisma from "@/app/lib/db";
import Link from 'next/link';
import Image from "next/image";
import { logApiError } from "@/app/lib/api-utils"; // Assuming this is correctly importable

// Force dynamic rendering to ensure this runs on every request in production
export const dynamic = 'force-dynamic';

// Fetch active games from the database
async function getActiveGames() {
  // ADDED: Log entry into the function
  console.log('[getActiveGames] ENTERING FUNCTION - Production Test');
  console.log('[getActiveGames] Fetching active games (checking for events with isActive: true)...');
  try {
    const now = new Date();
    // ADDED: Log before the query
    console.log('[getActiveGames] Executing prisma.game.findMany...');
    const games = await prisma.game.findMany({
      where: {
        event: {
          isActive: true,
          // Removed the endDate filter to show all games from active events
          // endDate: {
          //   gt: now
          // }
        },
      },
      include: {
        event: true, // Include event details if needed later
      },
      orderBy: {
        name: "asc", // <-- Change 'title' to 'name'
      },
    });
    // ADDED: Log after the query with count
    console.log(`[getActiveGames] Prisma query finished. Found ${games.length} active games.`);
    return games;
  } catch (error: any) {
    // Ensure error logging captures details
    console.error('[getActiveGames] ERROR fetching games:', error.message, error.stack);
    logApiError('get-active-games', error); // Assuming logApiError is available/importable here, adjust if not
    return []; // Return empty array on error to prevent breaking the page
  }
}

export const metadata = {
  title: 'Доступные игры - Roll to Help',
  description: 'Просмотр доступных настольных игр для нашего благотворительного аукциона.',
};

export default async function GamesPage() {
  const games = await getActiveGames();

  return (
    <div className="min-h-screen py-12">
      <main className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-purple-900 mb-12">Доступные игры</h1>

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

// Remove ISR revalidation to force SSR
// export const revalidate = 3600; 