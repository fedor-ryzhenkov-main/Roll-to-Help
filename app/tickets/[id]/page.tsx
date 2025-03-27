import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '../../lib/db'
import { formatCurrency } from '../../lib/utils'
import BidForm from '../../components/BidForm'

export default async function TicketPage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  const ticketId = parseInt(id)
  
  if (isNaN(ticketId)) {
    return notFound()
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { 
      event: true,
      bids: {
        orderBy: { amount: 'desc' },
        take: 5
      }
    }
  })

  if (!ticket) {
    return notFound()
  }

  // Get current highest bid for minimum bid calculation
  const highestBid = ticket.bids[0]?.amount || ticket.startingBid
  const minBidAmount = highestBid + 1 // Simple increment for minimum bid

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/events/${ticket.eventId}`} className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Event
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">{ticket.title}</h1>
            <div className="text-sm text-blue-600 mb-4">
              Part of <Link href={`/events/${ticket.eventId}`} className="hover:underline">{ticket.event.name}</Link>
            </div>
            <p className="text-gray-700 mb-6 whitespace-pre-line">{ticket.description}</p>
            
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-500">Starting Bid</p>
                <p className="text-lg font-semibold">{formatCurrency(ticket.startingBid)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="text-lg font-semibold">{ticket.quantity}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Bids</h2>
            
            {ticket.bids.length === 0 ? (
              <div className="text-gray-600 py-4 text-center">
                No bids yet. Be the first to bid!
              </div>
            ) : (
              <div className="space-y-4">
                {ticket.bids.map((bid) => (
                  <div key={bid.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <p className="font-medium">{bid.telegramName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(bid.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(bid.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <BidForm 
            ticketId={ticketId} 
            minBidAmount={minBidAmount} 
            currentHighestBid={highestBid}
          />
        </div>
      </div>
    </div>
  )
} 