import { DbCleanupService } from '@/core/lib/utils/dbUtils/dbCleanupService';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

let isInitialized = false;

/**
 * Initialize server-side services
 * This should be called once during server startup
 */
export async function initializeServerServices() {
  if (isInitialized) {
    await serverLog('Server services already initialized', 'info');
    return;
  }

  await serverLog('Initializing server services...', 'info');

  // Initialize database cleanup service
  const cleanupService = DbCleanupService.getInstance();
  cleanupService.initialize({
    enableAudioCleanup: true,
    audioCleanupIntervalMs: 24 * 60 * 60 * 1000, // Daily cleanup
  });

  await serverLog('Server services initialized successfully', 'info');
  isInitialized = true;
}

/**
 * Helper method to manually run cleanup
 */
export async function runDatabaseCleanup() {
  const cleanupService = DbCleanupService.getInstance();
  return await cleanupService.runAllCleanupTasks();
}
