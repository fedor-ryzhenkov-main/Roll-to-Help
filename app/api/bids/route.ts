import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/app/lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Adjust path if necessary

// Define validation schema for bid submission
const bidSchema = z.object({
  gameId: z.number().int(), // Ensure it's an integer
  // telegramName: z.string().min(3), // Removed, we get user from session
  amount: z.number().positive(),
})

export async function POST(request: NextRequest) {
  // 1. Get the server-side session
  // Note: For App Router, getServerSession needs the request and response objects
  //       which are not directly available here. A common pattern is to pass
  //       authOptions directly to getServerSession or handle auth differently.
  //       However, let's try the Pages Router approach first as it might work.
  const session = await getServerSession(authOptions)

  // 2. Check if user is logged in
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { message: 'Unauthorized: Please log in.' },
      { status: 401 }
    )
  }

  // 3. Check if the user has linked and verified their Telegram account
  if (!session.user.isVerified || !session.user.telegramId) {
    return NextResponse.json(
      { message: 'Forbidden: Please link and verify your Telegram account via the bot first.' },
      { status: 403 }
    )
  }

  // --- User is authenticated and Telegram is verified --- 

  try {
    // Parse request body
    const body = await request.json()
    
    // Validate request data (excluding telegramName)
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

    // Create the bid, linking it to the authenticated user
    const bid = await prisma.bid.create({
      data: {
        // telegramName: validatedData.telegramName, // Removed
        amount: validatedData.amount,
        gameId: validatedData.gameId,
        userId: session.user.id, // Link bid to the authenticated user ID from session
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
    
    // Handle potential session errors during development
    if (error.message.includes('getServerSession')) {
      return NextResponse.json(
        { message: 'Authentication Error: Could not verify session.' },
        { status: 500 }
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