/**
 * Shared type definitions for the application
 */

export interface User {
  id: string
  isAdmin: boolean
  telegramId?: string | null
  telegramUsername?: string | null
  telegramFirstName?: string | null
  telegramLastName?: string | null
  telegramPhotoUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

// Game and event related types
export interface Event {
  id: string
  name: string
  description?: string | null
  location: string
  eventDate: Date
  imageUrl?: string | null
  isActive: boolean
  games?: Game[]
}

export interface Game {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  gameMaster?: string | null
  totalSeats: number
  availableSeats?: number | null
  startingPrice: number
  minBidIncrement: number
  system: string
  genre: string
  eventId: string
  event?: Event
  bids?: Bid[]
  createdAt: Date
  updatedAt: Date
}

export interface Bid {
  id: string
  amount: number
  gameId: string
  userId: string 
  createdAt: Date
  isWinning: boolean
  notifiedAt?: Date | null
  game?: Game
  user?: User
}

// API response types
export interface ApiResponse<T = undefined> {
  success: boolean
  message?: string
  data?: T
  errors?: string[] | Record<string, string>[]
}