import Link from 'next/link'
import prisma from '../lib/db'
import { formatDate } from '../lib/utils'

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startDate: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>
      
      {events.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">No events available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {event.imageUrl && (
                <div className="h-48 w-full overflow-hidden">
                  <img 
                    src={event.imageUrl} 
                    alt={event.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>Starts: {formatDate(event.startDate)}</p>
                  <p>Ends: {formatDate(event.endDate)}</p>
                </div>
                <Link 
                  href={`/events/${event.id}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 