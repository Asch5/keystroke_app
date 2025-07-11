import { useCallback, useEffect, useMemo } from 'react';
import {
  settingsSyncService,
  syncSettingsNow,
} from '@/core/infrastructure/services/settings-sync-service';
import { selectUser } from '@/core/state/features/authSlice';
import {
  updateUIPreference,
  updateLearningPreference,
  updateTypingPracticeSetting,
  updateDictionaryFilter,
  updateAdminDictionaryFilter,
  updateBulkUIPreferences,
  updateBulkLearningPreferences,
  updateBulkTypingPracticeSettings,
  updateVocabularyPracticeSetting,
  updateBulkVocabularyPracticeSettings,
  resetVocabularyPracticeSettings,
  clearDictionaryFilters,
  clearAdminDictionaryFilters,
  resetTypingPracticeSettings,
  resetUIPreferences,
  resetLearningPreferences,
  selectUIPreferences,
  selectLearningPreferences,
  selectTypingPracticeSettings,
  selectVocabularyPracticeSettings,
  selectDictionaryFilters,
  selectAdminDictionaryFilters,
  selectSyncStatus,
  selectIsSettingsLoaded,
  selectIsSettingsInitialized,
  UIPreferences,
  LearningPreferences,
  TypingPracticeSettings,
  VocabularyPracticeSettings,
  DictionaryFilterSettings,
  AdminDictionaryFilterSettings,
} from '@/core/state/features/settingsSlice';
import { useAppDispatch, useAppSelector } from '@/core/state/store';

// =============================================
// SETTINGS HOOKS
// =============================================

/**
 * Main settings hook - provides access to all settings and sync status
 */
export function useSettings() {
  const user = useAppSelector(selectUser);
  const syncStatus = useAppSelector(selectSyncStatus);
  const isLoaded = useAppSelector(selectIsSettingsLoaded);
  const isInitialized = useAppSelector(selectIsSettingsInitialized);

  // Initialize settings when user logs in
  useEffect(() => {
    if (user?.id && !isInitialized) {
      settingsSyncService.initializeSettingsFromDatabase(user.id);
    }
  }, [user?.id, isInitialized]);

  const forceSyncNow = useCallback(async () => {
    return await syncSettingsNow();
  }, []);

  const exportSettings = useCallback(() => {
    return settingsSyncService.exportSettings();
  }, []);

  const importSettings = useCallback(async (settingsJson: string) => {
    return await settingsSyncService.importSettings(settingsJson);
  }, []);

  return {
    // Status
    isLoaded,
    isInitialized,
    syncStatus,

    // Actions
    forceSyncNow,
    exportSettings,
    importSettings,

    // User
    user,
  };
}

/**
 * UI Preferences hook
 */
export function useUIPreferences() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectUIPreferences);

  const updatePreference = useCallback(
    <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
      dispatch(updateUIPreference({ key, value }));
    },
    [dispatch],
  );

  const updateMultiple = useCallback(
    (updates: Partial<UIPreferences>) => {
      dispatch(updateBulkUIPreferences(updates));
    },
    [dispatch],
  );

  const resetToDefaults = useCallback(() => {
    dispatch(resetUIPreferences());
  }, [dispatch]);

  return {
    preferences,
    updatePreference,
    updateMultiple,
    resetToDefaults,
  };
}

/**
 * Learning Preferences hook
 */
export function useLearningPreferences() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectLearningPreferences);

  const updatePreference = useCallback(
    <K extends keyof LearningPreferences>(
      key: K,
      value: LearningPreferences[K],
    ) => {
      dispatch(updateLearningPreference({ key, value }));
    },
    [dispatch],
  );

  const updateMultiple = useCallback(
    (updates: Partial<LearningPreferences>) => {
      dispatch(updateBulkLearningPreferences(updates));
    },
    [dispatch],
  );

  const resetToDefaults = useCallback(() => {
    dispatch(resetLearningPreferences());
  }, [dispatch]);

  return {
    preferences,
    updatePreference,
    updateMultiple,
    resetToDefaults,
  };
}

/**
 * Typing Practice Settings hook - replaces the existing localStorage-only version
 */
export function useTypingPracticeSettings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectTypingPracticeSettings);
  const isLoaded = useAppSelector(selectIsSettingsLoaded);

  const updateSetting = useCallback(
    <K extends keyof TypingPracticeSettings>(
      key: K,
      value: TypingPracticeSettings[K],
    ) => {
      dispatch(updateTypingPracticeSetting({ key, value }));
    },
    [dispatch],
  );

  const updateMultiple = useCallback(
    (updates: Partial<TypingPracticeSettings>) => {
      dispatch(updateBulkTypingPracticeSettings(updates));
    },
    [dispatch],
  );

  const resetSettings = useCallback(() => {
    dispatch(resetTypingPracticeSettings());
  }, [dispatch]);

  return {
    settings,
    updateSetting,
    updateMultiple,
    resetSettings,
    isLoaded,
  };
}

/**
 * Vocabulary Practice Settings hook - provides database-persisted vocabulary practice settings
 */
export function useVocabularyPracticeSettings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectVocabularyPracticeSettings);
  const isLoaded = useAppSelector(selectIsSettingsLoaded);

  const updateSetting = useCallback(
    <K extends keyof VocabularyPracticeSettings>(
      key: K,
      value: VocabularyPracticeSettings[K],
    ) => {
      dispatch(updateVocabularyPracticeSetting({ key, value }));
    },
    [dispatch],
  );

  const updateMultiple = useCallback(
    (updates: Partial<VocabularyPracticeSettings>) => {
      dispatch(updateBulkVocabularyPracticeSettings(updates));
    },
    [dispatch],
  );

  const resetSettings = useCallback(() => {
    dispatch(resetVocabularyPracticeSettings());
  }, [dispatch]);

  // Helper function to get enabled exercise types
  const getEnabledExerciseTypes = useCallback(() => {
    const exerciseTypes = [];
    if (settings.enableRememberTranslation)
      exerciseTypes.push('remember-translation');
    if (settings.enableChooseRightWord) exerciseTypes.push('choose-right-word');
    if (settings.enableMakeUpWord) exerciseTypes.push('make-up-word');
    if (settings.enableWriteByDefinition)
      exerciseTypes.push('write-by-definition');
    if (settings.enableWriteBySound) exerciseTypes.push('write-by-sound');
    return exerciseTypes;
  }, [settings]);

  // Helper function to validate settings
  const validateSettings = useCallback(() => {
    const enabledExercises = getEnabledExerciseTypes();
    const isValid = enabledExercises.length > 0;

    return {
      isValid,
      errors: isValid ? [] : ['At least one exercise type must be enabled'],
      enabledExercises,
    };
  }, [getEnabledExerciseTypes]);

  return {
    settings,
    updateSetting,
    updateMultiple,
    resetSettings,
    isLoaded,
    getEnabledExerciseTypes,
    validateSettings,
  };
}

/**
 * Dictionary Filters hook - for My Dictionary page
 */
export function useDictionaryFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectDictionaryFilters);

  const updateFilter = useCallback(
    <K extends keyof DictionaryFilterSettings>(
      key: K,
      value: DictionaryFilterSettings[K],
    ) => {
      dispatch(updateDictionaryFilter({ key, value }));
    },
    [dispatch],
  );

  const clearFilters = useCallback(() => {
    dispatch(clearDictionaryFilters());
  }, [dispatch]);

  return {
    filters,
    updateFilter,
    clearFilters,
  };
}

/**
 * Admin Dictionary Filters hook - for Admin Dictionary page
 */
export function useAdminDictionaryFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectAdminDictionaryFilters);

  const updateFilter = useCallback(
    <K extends keyof AdminDictionaryFilterSettings>(
      key: K,
      value: AdminDictionaryFilterSettings[K],
    ) => {
      dispatch(updateAdminDictionaryFilter({ key, value }));
    },
    [dispatch],
  );

  const clearFilters = useCallback(() => {
    dispatch(clearAdminDictionaryFilters());
  }, [dispatch]);

  return {
    filters,
    updateFilter,
    clearFilters,
  };
}

/**
 * Settings persistence hook - provides utilities for managing settings persistence
 */
export function useSettingsPersistence() {
  const syncStatus = useAppSelector(selectSyncStatus);
  const user = useAppSelector(selectUser);

  const hasPendingChanges = syncStatus.pendingChanges;
  const isSyncing = syncStatus.syncInProgress;
  const lastSyncedAt = useMemo(
    () => (syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt) : null),
    [syncStatus.lastSyncedAt],
  );
  const lastError = syncStatus.lastError;

  const getTimeSinceLastSync = useCallback(() => {
    if (!lastSyncedAt) return null;
    return Date.now() - lastSyncedAt.getTime();
  }, [lastSyncedAt]);

  const formatLastSyncTime = useCallback(() => {
    if (!lastSyncedAt) return 'Never';

    const timeDiff = getTimeSinceLastSync();
    if (!timeDiff) return 'Just now';

    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }, [getTimeSinceLastSync, lastSyncedAt]);

  return {
    hasPendingChanges,
    isSyncing,
    lastSyncedAt,
    lastError,
    getTimeSinceLastSync,
    formatLastSyncTime,
    isUserAuthenticated: !!user?.id,
  };
}

/**
 * Convenience hook that combines commonly used settings
 */
export function useCommonSettings() {
  const ui = useUIPreferences();
  const learning = useLearningPreferences();
  const practice = useTypingPracticeSettings();
  const persistence = useSettingsPersistence();

  return {
    ui,
    learning,
    practice,
    persistence,
  };
}
