import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log errors in production, error+warn in development
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Gracefully close Prisma connection in serverless environments
if (process.env.VERCEL) {
  // On Vercel, connections are automatically managed
  // No need for explicit cleanup
}
