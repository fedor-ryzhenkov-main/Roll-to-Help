'use client'

import { useState } from 'react'
import { formatCurrency } from '../lib/utils'
import BidForm from './BidForm'

interface Game {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  gameMaster: string | null
  totalSeats: number
  startingBid: number
  bids: Bid[]
}

interface Bid {
  id: number
  telegramName: string
  amount: number
  gameId: number
  isWinning: boolean
}

interface GameCardProps {
  game: Game
}

export default function GameCard({ game }: GameCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showBidForm, setShowBidForm] = useState(false)
  
  // Determine minimum bid amount
  const highestBid = game.bids[0]?.amount || game.startingBid
  const minBidAmount = highestBid + 1

  // Get current winning bids
  const winningBids = game.bids.filter(bid => bid.isWinning)
  
  // Get current minimum winning bid (or starting bid if no winning bids)
  const minimumWinningBid = winningBids.length > 0 
    ? Math.min(...winningBids.map(bid => bid.amount))
    : game.startingBid

  // If there are fewer winning bids than seats, the minimum to win is the starting bid
  const bidToWin = winningBids.length < game.totalSeats 
    ? game.startingBid 
    : minimumWinningBid + 1

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-purple-100 hover:shadow-lg transition-shadow flex flex-col h-full">
      {game.imageUrl && (
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={game.imageUrl} 
            alt={game.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="text-xl font-bold mb-2 text-purple-900">{game.title}</h3>
          
          {game.gameMaster && (
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-semibold">Game Master:</span> {game.gameMaster}
            </p>
          )}
          
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500">Starting Bid</p>
              <p className="text-lg font-semibold text-orange-600">{formatCurrency(game.startingBid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Available Seats</p>
              <p className="text-lg font-semibold text-orange-600">{game.totalSeats}</p>
            </div>
          </div>
          
          {/* Toggle description visibility */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 text-sm mb-3 flex items-center hover:text-purple-800"
          >
            {isExpanded ? 'Hide details' : 'Show details'}
            <svg className={`ml-1 h-4 w-4 transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Expandable description */}
          {isExpanded && (
            <div className="mb-4">
              <p className="text-gray-700 text-sm">{game.description}</p>
            </div>
          )}
          
          {/* Current bids section */}
          <div className="mb-4 bg-amber-50 p-3 rounded-md">
            <h4 className="font-semibold text-sm text-purple-900 mb-2">Current Winning Bids:</h4>
            {winningBids.length > 0 ? (
              <ul className="text-sm space-y-1">
                {winningBids.map(bid => (
                  <li key={bid.id} className="flex justify-between">
                    <span>{bid.telegramName}</span>
                    <span className="font-medium">{formatCurrency(bid.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No bids yet. Be the first!</p>
            )}
            
            {winningBids.length < game.totalSeats ? (
              <div className="mt-2 p-2 bg-green-50 text-sm text-green-700 rounded border border-green-200">
                {game.totalSeats - winningBids.length} seats still available!
              </div>
            ) : (
              <div className="mt-2 p-2 bg-amber-100 text-sm text-amber-800 rounded border border-amber-200">
                Bid at least {formatCurrency(bidToWin)} to secure a seat!
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto">
          {showBidForm ? (
            <BidForm 
              gameId={game.id} 
              minBidAmount={minBidAmount} 
              onCancel={() => setShowBidForm(false)}
              onSuccess={() => setShowBidForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowBidForm(true)}
              className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Place Bid
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 