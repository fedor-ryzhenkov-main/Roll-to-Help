import Link from 'next/link'
import prisma from '../lib/db'
import GameCard from '../components/GameCard'
import { formatDate } from '../lib/utils'

// Set dynamic flag to ensure page is rendered at request time, not build time
export const dynamic = 'force-dynamic';

export default async function GamesPage() {
  // Get the active event
  let event = null;
  
  try {
    event = await prisma.event.findFirst({
      where: { isActive: true },
      include: {
        games: {
          include: {
            bids: {
              orderBy: {
                amount: 'desc'
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching games data:', error);
    // Continue with null event - the UI will handle this case
  }

  // If no event is active, show a message
  if (!event) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-purple-900">No Upcoming Events</h1>
          <p className="text-gray-600 mb-8">
            There are no active charity events at the moment. Please check back later!
          </p>
          <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="container mx-auto px-4 py-8">
        {/* Event header */}
        <div className="mb-10 text-center">
          <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium inline-block mb-4">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-purple-900 mb-2">{event.name}</h1>
          <p className="text-lg text-gray-700 mb-2">{formatDate(event.eventDate)}</p>
          <p className="text-lg text-gray-700 mb-6">{event.location}</p>
          
          {event.description && (
            <div className="max-w-2xl mx-auto">
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}
        </div>
        
        {/* Games section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-purple-900 text-center">Available Games</h2>
          
          {event.games.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-xl text-gray-600">
                No games available at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.games.map((game) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                />
              ))}
            </div>
          )}
        </section>
        
        {/* How it works section */}
        <section className="mt-16 bg-white p-6 rounded-lg shadow-md border border-purple-100">
          <h2 className="text-2xl font-bold mb-4 text-purple-900">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</div>
              <p>Choose a game you&apos;d like to play and place your bid using your Telegram username.</p>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</div>
              <p>The highest bidders for each game will win seats at the table (number of seats varies by game).</p>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</div>
              <p>All proceeds go to charity! Winners will be notified through Telegram before the event.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 