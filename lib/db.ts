// Database connection and Prisma client with optimizations
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Allow tests to inject a shared Prisma instance
const injectedTestPrisma = (globalThis as any).__TEST_PRISMA__ as PrismaClient | undefined;

export const prisma =
  injectedTestPrisma ??
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection pool optimization for production
if (process.env.NODE_ENV === 'production') {
  // Gracefully close Prisma Client when the application shuts down
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
