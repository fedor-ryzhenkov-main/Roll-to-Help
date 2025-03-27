import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Prevent actual database calls during Next.js static site generation
const prismaClientSingleton = () => {
  // During build time without a DATABASE_URL, return a mock client
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'build') {
    console.log('Using mock Prisma client during build phase')
    
    // Return a mock client that doesn't actually connect to a database
    // This allows the build to complete without actual database queries
    return new PrismaClient({
      datasources: {
        db: {
          url: 'file:./dev.db',
        },
      },
    })
  }
  
  return new PrismaClient()
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 