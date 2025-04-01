import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/app/lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Adjust path if necessary
import { getToken } from 'next-auth/jwt' // Import getToken

// Define validation schema for bid submission
const bidSchema = z.object({
  gameId: z.number().int().positive(),
  amount: z.number().positive('Bid amount must be positive'),
})

export async function POST(request: NextRequest) {
  // 1. Get token and check authentication/verification
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  if (!token || !token.id || !token.isVerified) { // Check token directly
    return NextResponse.json(
      { success: false, message: 'Authentication required. Please log in and verify your Telegram account.' },
      { status: 401 }
    )
  }
  const userId = token.id as string // Get userId from token

  try {
    // 2. Validate request body
    const body = await request.json()
    const validation = bidSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid bid data', errors: validation.error.errors },
        { status: 400 }
      )
    }
    const { gameId, amount } = validation.data

    // 3. Fetch game details (needed for validation and seat count)
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { startingBid: true, totalSeats: true, bids: { select: { amount: true }, orderBy: { amount: 'desc' } } }
    })

    if (!game) {
      return NextResponse.json({ success: false, message: 'Game not found' }, { status: 404 })
    }

    // 4. Validate bid amount against game rules
    if (amount < game.startingBid) {
      return NextResponse.json(
        { success: false, message: `Bid must be at least the starting bid of $${game.startingBid.toFixed(2)}` },
        { status: 400 }
      )
    }
    
    // Calculate current minimum winning bid (slightly different logic than page load)
    const bids = await prisma.bid.findMany({ 
        where: { gameId }, 
        orderBy: { amount: 'desc' },
        take: game.totalSeats 
    })
    const minWinningBid = bids.length === game.totalSeats ? bids[bids.length-1].amount : game.startingBid
    
    if (amount <= minWinningBid) {
         return NextResponse.json(
        { success: false, message: `Your bid must be higher than the current minimum winning bid of $${minWinningBid.toFixed(2)}` },
        { status: 400 }
      )
    }

    // 5. Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the new bid
      const newBid = await tx.bid.create({
        data: {
          amount: amount,
          gameId: gameId,
          userId: userId,
          isWinning: false, // Initial status, will be updated below
        },
      })

      // Get all bids for this game, ordered by amount
      const allBids = await tx.bid.findMany({
        where: { gameId: gameId },
        orderBy: { amount: 'desc' },
        select: { id: true }, // Select only IDs for update
      })

      // Determine winning bid IDs
      const winningBidIds = allBids.slice(0, game.totalSeats).map(b => b.id)

      // Update isWinning status for all bids in this game
      // Mark top bids as winning
      await tx.bid.updateMany({
        where: {
          gameId: gameId,
          id: { in: winningBidIds },
        },
        data: { isWinning: true },
      })

      // Mark non-top bids as not winning
      await tx.bid.updateMany({
        where: {
          gameId: gameId,
          id: { notIn: winningBidIds },
        },
        data: { isWinning: false },
      })
      
      return newBid // Return the newly created bid
    })

    // 6. Return success response
    return NextResponse.json({ success: true, bid: result })

  } catch (error) {
    console.error("Error placing bid:", error)
    // Handle potential unique constraint errors or other DB issues
    if (error instanceof Error && (error as any).code === 'P2002') { // Type check for error
         return NextResponse.json({ success: false, message: 'Database error: Constraint failed.' }, { status: 409 })
    }
    return NextResponse.json({ success: false, message: 'Failed to place bid' }, { status: 500 })
  }
} 