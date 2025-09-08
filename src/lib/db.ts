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
    // Connection pool configuration to prevent termination errors
    transactionOptions: {
      maxWait: 5000, // Maximum wait time for transaction
      timeout: 10000, // Transaction timeout
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database health check and error recovery
let dbHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export async function checkDatabaseHealth(): Promise<boolean> {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && dbHealthy) {
    return dbHealthy;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
    lastHealthCheck = now;
    return true;
  } catch (error) {
    dbHealthy = false;
    lastHealthCheck = now;
    console.error('Database health check failed:', error);
    return false;
  }
}

// Database operation wrapper with retry logic
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries: number = 2
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = error?.code === 'P1001' || 
                               error?.code === 'P2024' ||
                               error?.message?.includes('connection');
      
      if (isConnectionError && attempt < retries) {
        console.warn(`Database connection error, retrying... (attempt ${attempt + 1}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Should not reach here');
}

// Connection management and graceful shutdown
if (process.env.NODE_ENV === 'production') {
  // Gracefully close Prisma Client when the application shuts down
  process.on('beforeExit', async () => {
    console.log('Closing database connections...');
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing database connections...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database connections...');
    await prisma.$disconnect();
    process.exit(0);
  });
}
