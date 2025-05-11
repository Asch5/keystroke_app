import { DbCleanupService } from '@/core/lib/utils/dbCleanupService';

let isInitialized = false;

/**
 * Initialize server-side services
 * This should be called once during server startup
 */
export function initializeServerServices() {
  if (isInitialized) {
    console.log('Server services already initialized');
    return;
  }

  console.log('Initializing server services...');

  // Initialize database cleanup service
  const cleanupService = DbCleanupService.getInstance();
  cleanupService.initialize({
    enableAudioCleanup: true,
    audioCleanupIntervalMs: 24 * 60 * 60 * 1000, // Daily cleanup
  });

  console.log('Server services initialized successfully');
  isInitialized = true;
}

/**
 * Helper method to manually run cleanup
 */
export async function runDatabaseCleanup() {
  const cleanupService = DbCleanupService.getInstance();
  return await cleanupService.runAllCleanupTasks();
}
