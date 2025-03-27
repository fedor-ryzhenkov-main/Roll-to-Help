import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '../../lib/db'

// Define validation schema for bid submission
const bidSchema = z.object({
  gameId: z.number(),
  telegramName: z.string().min(3),
  amount: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate request data
    const validatedData = bidSchema.parse(body)
    
    // Find the game
    const game = await prisma.game.findUnique({
      where: { id: validatedData.gameId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
        },
        event: true,
      },
    })
    
    if (!game) {
      return NextResponse.json(
        { message: 'Game not found' },
        { status: 404 }
      )
    }
    
    // Check if event is still active
    const now = new Date()
    if (!game.event.isActive || now > game.event.eventDate) {
      return NextResponse.json(
        { message: 'This event is no longer accepting bids' },
        { status: 400 }
      )
    }
    
    // Check if bid amount is at least the minimum required
    if (validatedData.amount < game.startingBid) {
      return NextResponse.json(
        { message: `Bid must be at least ${game.startingBid}` },
        { status: 400 }
      )
    }

    // Create the bid
    const bid = await prisma.bid.create({
      data: {
        telegramName: validatedData.telegramName,
        amount: validatedData.amount,
        gameId: validatedData.gameId,
        isWinning: false, // Will be updated below
      },
    })
    
    // Update the winning bids based on seat availability
    await updateWinningBids(validatedData.gameId, game.totalSeats)
    
    return NextResponse.json({ 
      message: 'Bid placed successfully', 
      bid 
    })
  } catch (error) {
    console.error('Error processing bid:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data', errors: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Failed to process bid' },
      { status: 500 }
    )
  }
}

// Helper function to update winning bids
async function updateWinningBids(gameId: number, totalSeats: number) {
  // Get all bids for this game, ordered by amount descending
  const bids = await prisma.bid.findMany({
    where: { gameId },
    orderBy: { amount: 'desc' },
  })

  // Reset all bids to non-winning
  await prisma.bid.updateMany({
    where: { gameId },
    data: { isWinning: false }
  })

  // Mark the top N bids as winning based on available seats
  const winningBids = bids.slice(0, totalSeats)
  
  for (const bid of winningBids) {
    await prisma.bid.update({
      where: { id: bid.id },
      data: { isWinning: true }
    })
  }
} 