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

// Gracefully disconnect in serverless environments
if (process.env.VERCEL) {
  // Pre-connect to warm up the connection pool
  prisma.$connect().catch(e => {
    console.error('Failed to connect to database:', e)
  })
}

