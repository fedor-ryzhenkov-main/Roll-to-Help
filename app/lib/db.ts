import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build'

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
    $connect: async () => {},
    $disconnect: async () => {},
  } as unknown as PrismaClient
}

export const prisma = isBuildTime 
  ? createMockPrismaClient()
  : globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 