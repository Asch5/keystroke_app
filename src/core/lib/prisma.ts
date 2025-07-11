import { PrismaClient } from '@prisma/client';
import { initializeServerServices } from '@/core/lib/utils/serverInit';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  isServicesInitialized: boolean;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize database cleanup and other services
// This ensures the services are initialized only once
if (
  !globalForPrisma.isServicesInitialized &&
  process.env.NODE_ENV === 'production'
) {
  try {
    void initializeServerServices();
    globalForPrisma.isServicesInitialized = true;
  } catch (error) {
    console.error('Failed to initialize server services:', error);
  }
}
