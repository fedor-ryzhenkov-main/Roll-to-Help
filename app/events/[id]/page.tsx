import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '../../lib/db'
import { formatDate, formatCurrency } from '../../lib/utils'

export default async function EventPage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  const eventId = parseInt(id)
  
  if (isNaN(eventId)) {
    return notFound()
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tickets: true },
  })

  if (!event) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/events" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Events
      </Link>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {event.imageUrl && (
          <div className="h-64 w-full overflow-hidden">
            <img 
              src={event.imageUrl} 
              alt={event.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <div className="flex flex-wrap text-sm text-gray-600 mb-4">
            <div className="mr-6 mb-2">
              <span className="font-semibold">Start:</span> {formatDate(event.startDate)}
            </div>
            <div className="mr-6 mb-2">
              <span className="font-semibold">End:</span> {formatDate(event.endDate)}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Min Price:</span> {formatCurrency(event.minPrice)}
            </div>
          </div>
          
          <p className="text-gray-700 mb-6 whitespace-pre-line">{event.description}</p>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Available Tickets</h2>
      
      {event.tickets.length === 0 ? (
        <div className="bg-gray-100 rounded p-6 text-center">
          <p className="text-gray-600">No tickets available for this event yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {event.tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">{ticket.title}</h3>
              <p className="text-gray-600 mb-4">{ticket.description}</p>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500">Starting Bid</p>
                  <p className="text-lg font-semibold">{formatCurrency(ticket.startingBid)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="text-lg font-semibold">{ticket.quantity}</p>
                </div>
              </div>
              <Link 
                href={`/tickets/${ticket.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                View Ticket & Place Bid
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 