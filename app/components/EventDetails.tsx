import { formatDate } from '../lib/utils'
import { Event } from '@prisma/client'

interface EventDetailsProps {
  event: Event
}

export default function EventDetails({ event }: EventDetailsProps) {
  return (
    <section className="bg-white rounded-lg shadow-lg overflow-hidden">
      {event.imageUrl && (
        <div className="h-64 md:h-80 w-full overflow-hidden">
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
            <span className="font-semibold">📅 Date:</span> {formatDate(event.eventDate)}
          </div>
          <div className="mb-2">
            <span className="font-semibold">📍 Location:</span> {event.location}
          </div>
        </div>
        
        <p className="text-gray-700 mb-6 whitespace-pre-line">{event.description}</p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-blue-700">
            <span className="font-bold">How to participate:</span> Choose a game below and place your bid. The highest bidders will win seats at the table!
          </p>
        </div>
      </div>
    </section>
  )
} 