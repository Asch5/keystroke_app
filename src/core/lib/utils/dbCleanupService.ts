import { cleanupAudio, scheduleAudioCleanup } from '@/core/lib/utils/audioCleanup';

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
  public initialize(
    options: {
      enableAudioCleanup?: boolean;
      audioCleanupIntervalMs?: number;
    } = {},
  ): void {
    if (this.isInitialized) {
      console.warn('DbCleanupService is already initialized');
      return;
    }

    const {
      enableAudioCleanup = true,
      audioCleanupIntervalMs = 24 * 60 * 60 * 1000, // Default: daily
    } = options;

    // Set up scheduled audio cleanup if enabled
    if (enableAudioCleanup) {
      scheduleAudioCleanup(audioCleanupIntervalMs);
      console.log(
        `Scheduled audio cleanup every ${audioCleanupIntervalMs / (60 * 60 * 1000)} hours`,
      );
    }

    this.isInitialized = true;
  }

  /**
   * Run all cleanup tasks on demand
   */
  public async runAllCleanupTasks(): Promise<void> {
    console.log('Starting all cleanup tasks...');

    // Clean up orphaned audio records
    const deletedAudioCount = await cleanupAudio();
    console.log(`Cleaned up ${deletedAudioCount} orphaned audio records`);

    // Add other cleanup tasks here as needed

    console.log('All cleanup tasks completed');
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
