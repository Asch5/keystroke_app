import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { DbCleanupService } from '@/core/lib/utils/dbUtils/dbCleanupService';

let isInitialized = false;

/**
 * Initialize server-side services
 * This should be called once during server startup
 */
export async function initializeServerServices() {
  if (isInitialized) {
    void serverLog('Server services already initialized', 'info');
    return;
  }

  void serverLog('Initializing server services...', 'info');

  // Initialize database cleanup service
  const cleanupService = DbCleanupService.getInstance();
  void cleanupService.initialize({
    enableAudioCleanup: true,
    audioCleanupIntervalMs: 24 * 60 * 60 * 1000, // Daily cleanup
  });

  void serverLog('Server services initialized successfully', 'info');
  isInitialized = true;
}

/**
 * Helper method to manually run cleanup
 */
export async function runDatabaseCleanup() {
  const cleanupService = DbCleanupService.getInstance();
  return await cleanupService.runAllCleanupTasks();
}
