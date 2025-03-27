import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Clean up existing data
  await prisma.bid.deleteMany()
  await prisma.game.deleteMany()
  await prisma.event.deleteMany()

  // Set event date to a week from now
  const eventDate = new Date()
  eventDate.setDate(eventDate.getDate() + 7)
  
  // Format as YYYY-MM-DD
  const eventDateFormatted = eventDate.toISOString().split('T')[0]

  // Create upcoming tabletop charity event
  const event = await prisma.event.create({
    data: {
      name: 'Roll to Help!',
      description: 'The prominent organisation helping Ukrainian refugees "Choose to Help" is closing, and they need our help one last time. Let\'s do this, Tbilisi!',
      location: 'Mesto, 12 Rustaveli Ave, Tbilisi',
      eventDate: new Date(eventDate),
      imageUrl: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b',
      isActive: true,
      games: {
        create: [
          {
            title: 'Warhammer TTRPG Adventure',
            description: 'Embark on an epic quest in the Warhammer universe. Suitable for beginners and experienced players.',
            gameMaster: 'John Smith',
            imageUrl: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b',
            totalSeats: 4,
            startingBid: 10,
          },
          {
            title: 'Dungeons & Dragons One-Shot',
            description: 'A thrilling one-shot adventure for a party of adventurers. No experience necessary!',
            gameMaster: 'Jane Doe',
            imageUrl: 'https://images.unsplash.com/photo-1614682792267-a4ed94752df4',
            totalSeats: 6,
            startingBid: 15,
          },
          {
            title: 'Call of Cthulhu Investigation',
            description: 'Investigate eldritch mysteries in this horror-themed roleplaying game.',
            gameMaster: 'Robert Green',
            imageUrl: 'https://images.unsplash.com/photo-1518736114810-3f3bedfec66a',
            totalSeats: 5,
            startingBid: 12,
          }
        ]
      }
    }
  })

  // Create some initial bids for the first game
  const game = await prisma.game.findFirst({
    where: { eventId: event.id }
  })

  if (game) {
    await prisma.bid.createMany({
      data: [
        {
          telegramName: '@player1',
          amount: 15,
          gameId: game.id,
        },
        {
          telegramName: '@player2',
          amount: 20,
          gameId: game.id,
        },
        {
          telegramName: '@player3',
          amount: 12,
          gameId: game.id,
        }
      ]
    })

    // Update winning bids based on highest amounts and seat availability
    await updateWinningBids(game.id, game.totalSeats)
  }

  console.log('Database seeded successfully!')
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

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 