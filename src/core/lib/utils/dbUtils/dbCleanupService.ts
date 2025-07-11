import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import {
  cleanupAudio,
  scheduleAudioCleanup,
} from '@/core/lib/utils/dbUtils/audioCleanup';

/**
 * Service to manage database cleanup operations
 */
export class DbCleanupService {
  private static instance: DbCleanupService;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get the singleton instance of DbCleanupService
   */
  public static getInstance(): DbCleanupService {
    if (!DbCleanupService.instance) {
      DbCleanupService.instance = new DbCleanupService();
    }
    return DbCleanupService.instance;
  }

  /**
   * Initialize the cleanup service with scheduled tasks
   * @param options Configuration options
   */
  public async initialize(
    options: {
      enableAudioCleanup?: boolean;
      audioCleanupIntervalMs?: number;
    } = {},
  ): Promise<void> {
    if (this.isInitialized) {
      void serverLog('DbCleanupService is already initialized', 'warn');
      return;
    }

    const {
      enableAudioCleanup = true,
      audioCleanupIntervalMs = 24 * 60 * 60 * 1000, // Default: daily
    } = options;

    // Set up scheduled audio cleanup if enabled
    if (enableAudioCleanup) {
      scheduleAudioCleanup(audioCleanupIntervalMs);
      void serverLog('Scheduled audio cleanup configured', 'info', {
        intervalHours: audioCleanupIntervalMs / (60 * 60 * 1000),
      });
    }

    this.isInitialized = true;
  }

  /**
   * Run all cleanup tasks on demand
   */
  public async runAllCleanupTasks(): Promise<void> {
    void serverLog('Starting all cleanup tasks...', 'info');

    // Clean up orphaned audio records
    const deletedAudioCount = await cleanupAudio();
    void serverLog('Audio cleanup completed', 'info', {
      deletedAudioCount,
    });

    // Add other cleanup tasks here as needed

    void serverLog('All cleanup tasks completed', 'info');
  }

  /**
   * Run audio cleanup task on demand
   */
  public async runAudioCleanup(): Promise<number> {
    return await cleanupAudio();
  }
}

// Example usage:
// import { DbCleanupService } from './utils/dbCleanupService';
//
// // Initialize with default settings
// const cleanupService = DbCleanupService.getInstance();
// cleanupService.initialize();
//
// // Or with custom settings
// cleanupService.initialize({
//   enableAudioCleanup: true,
//   audioCleanupIntervalMs: 12 * 60 * 60 * 1000, // Every 12 hours
// });
//
// // Run cleanup manually if needed
// await cleanupService.runAllCleanupTasks();
