import { store } from '@/core/state/store';
import {
  setSyncInProgress,
  setSyncSuccess,
  setSyncError,
  selectSyncStatus,
  selectUIPreferences,
  selectLearningPreferences,
  selectTypingPracticeSettings,
  selectVocabularyPracticeSettings,
  selectDictionaryFilters,
  selectAdminDictionaryFilters,
} from '@/core/state/features/settingsSlice';
import {
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

// =============================================
// SETTINGS SYNCHRONIZATION SERVICE
// =============================================

export class SettingsSyncService {
  private static instance: SettingsSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private retryAttempts = 0;

  private constructor() {
    this.startPeriodicSync();
  }

  static getInstance(): SettingsSyncService {
    if (!SettingsSyncService.instance) {
      SettingsSyncService.instance = new SettingsSyncService();
    }
    return SettingsSyncService.instance;
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncIfNeeded();
    }, this.SYNC_INTERVAL_MS);

    // Also sync when page becomes visible (user returns to tab)
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.syncIfNeeded();
        }
      });

      // Sync before page unload
      window.addEventListener('beforeunload', () => {
        this.forceSyncNow();
      });
    }
  }

  /**
   * Check if sync is needed and perform it
   */
  private async syncIfNeeded(): Promise<void> {
    const state = store.getState();
    const syncStatus = selectSyncStatus(state);

    // Don't sync if already in progress or no pending changes
    if (syncStatus.syncInProgress || !syncStatus.pendingChanges) {
      return;
    }

    // Don't sync too frequently (minimum 10 seconds between syncs)
    const timeSinceLastSync = Date.now() - (syncStatus.lastSyncedAt || 0);
    if (timeSinceLastSync < 10000) {
      return;
    }

    await this.performSync();
  }

  /**
   * Force immediate synchronization
   */
  public async forceSyncNow(): Promise<boolean> {
    return await this.performSync();
  }

  /**
   * Perform the actual synchronization
   */
  private async performSync(): Promise<boolean> {
    const state = store.getState();
    const { user } = state.auth;

    if (!user?.id) {
      await errorLog('Settings sync failed: User not authenticated');
      return false;
    }

    try {
      store.dispatch(setSyncInProgress(true));

      // Gather all settings
      const ui = selectUIPreferences(state);
      const learning = selectLearningPreferences(state);
      const typingPractice = selectTypingPracticeSettings(state);
      const vocabularyPractice = selectVocabularyPracticeSettings(state);
      const dictionaryFilters = selectDictionaryFilters(state);
      const adminDictionaryFilters = selectAdminDictionaryFilters(state);

      // Prepare settings payload for database
      const settingsPayload = {
        // UI preferences go to User.settings JSON field
        settings: {
          ui,
          filters: {
            dictionary: dictionaryFilters,
            adminDictionary: adminDictionaryFilters,
          },
        },
        // Study preferences go to User.studyPreferences JSON field
        studyPreferences: {
          learning,
          practice: {
            typing: typingPractice,
            vocabulary: vocabularyPractice,
          },
        },
      };

      // Send to server
      const response = await fetch('/api/settings/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...settingsPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Settings sync failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Settings sync failed');
      }

      // Mark sync as successful
      store.dispatch(setSyncSuccess());
      this.retryAttempts = 0;

      await infoLog('Settings synchronized successfully', {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      store.dispatch(setSyncError(errorMessage));

      await errorLog('Settings sync failed', {
        error: errorMessage,
        userId: user?.id,
        retryAttempt: this.retryAttempts,
      });

      // Implement exponential backoff for retries
      this.retryAttempts++;
      if (this.retryAttempts < this.MAX_RETRY_ATTEMPTS) {
        const retryDelay = Math.pow(2, this.retryAttempts) * 1000; // 2s, 4s, 8s
        setTimeout(() => {
          this.performSync();
        }, retryDelay);
      }

      return false;
    }
  }

  /**
   * Stop periodic synchronization
   */
  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Initialize settings from database on app start
   */
  public async initializeSettingsFromDatabase(
    userId: string,
  ): Promise<boolean> {
    try {
      await infoLog('Initializing settings from database', { userId });

      const response = await fetch(`/api/settings/load?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load settings: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load settings');
      }

      // Initialize Redux with loaded settings
      const { initializeSettings } = await import(
        '@/core/state/features/settingsSlice'
      );
      store.dispatch(initializeSettings(result.data));

      await infoLog('Settings initialized successfully from database', {
        userId,
        settingsLoaded: Object.keys(result.data).length,
      });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await errorLog('Failed to initialize settings from database', {
        error: errorMessage,
        userId,
      });

      // Initialize with defaults if database load fails
      const { initializeSettings } = await import(
        '@/core/state/features/settingsSlice'
      );
      store.dispatch(initializeSettings({}));

      return false;
    }
  }

  /**
   * Export settings for backup
   */
  public exportSettings(): string {
    const state = store.getState();
    const settings = {
      ui: selectUIPreferences(state),
      learning: selectLearningPreferences(state),
      practice: {
        typing: selectTypingPracticeSettings(state),
        vocabulary: selectVocabularyPracticeSettings(state),
      },
      filters: {
        dictionary: selectDictionaryFilters(state),
        adminDictionary: selectAdminDictionaryFilters(state),
      },
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from backup
   */
  public async importSettings(settingsJson: string): Promise<boolean> {
    try {
      const settings = JSON.parse(settingsJson);

      const { initializeSettings } = await import(
        '@/core/state/features/settingsSlice'
      );
      store.dispatch(initializeSettings(settings));

      // Force sync to database
      await this.forceSyncNow();

      await infoLog('Settings imported successfully', {
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await errorLog('Settings import failed', {
        error: errorMessage,
      });

      return false;
    }
  }
}

// Singleton instance
export const settingsSyncService = SettingsSyncService.getInstance();

// Convenience functions
export const syncSettingsNow = () => settingsSyncService.forceSyncNow();
export const initializeSettings = (userId: string) =>
  settingsSyncService.initializeSettingsFromDatabase(userId);
export const exportUserSettings = () => settingsSyncService.exportSettings();
export const importUserSettings = (json: string) =>
  settingsSyncService.importSettings(json);
