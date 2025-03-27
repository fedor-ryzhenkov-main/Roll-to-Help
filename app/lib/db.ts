import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build'

// Create a mock client for build time that returns empty data
const createMockPrismaClient = () => {
  return {
    event: {
      findFirst: async () => null,
      findMany: async () => [],
    },
    game: {
      findFirst: async () => null,
      findMany: async () => [],
    },
    bid: {
      findFirst: async () => null,
      findMany: async () => [],
    },
    // Add other models as needed
    $connect: async () => {},
    $disconnect: async () => {},
  } as unknown as PrismaClient
}

// Use mock client during build, real client otherwise
export const prisma = isBuildTime 
  ? createMockPrismaClient()
  : globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 