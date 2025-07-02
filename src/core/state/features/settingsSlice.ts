import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LanguageCode, PartOfSpeech, LearningStatus } from '@/core/types';

// =============================================
// COMPREHENSIVE SETTINGS STATE MANAGEMENT
// =============================================

// Practice Settings
export interface TypingPracticeSettings {
  autoSubmitAfterCorrect: boolean;
  showDefinitionImages: boolean;
  wordsCount: number;
  difficultyLevel: number;
  enableTimeLimit: boolean;
  timeLimitSeconds: number;
  playAudioOnStart: boolean;
  showProgressBar: boolean;
  enableGameSounds: boolean;
  gameSoundVolume: number;
  enableKeystrokeSounds: boolean;
}

// Dictionary/Table Filter Settings
export interface DictionaryFilterSettings {
  searchQuery: string;
  selectedStatus: LearningStatus[];
  selectedPartOfSpeech: PartOfSpeech[];
  selectedDifficulty: number[];
  showFavoritesOnly: boolean;
  showModifiedOnly: boolean;
  showNeedsReview: boolean;
  sortBy: 'word' | 'createdAt' | 'lastReviewed' | 'difficulty';
  sortOrder: 'asc' | 'desc';
  pageSize: number;
}

// Admin Dictionary Filter Settings
export interface AdminDictionaryFilterSettings {
  searchQuery: string;
  selectedLanguage: LanguageCode;
  selectedPartOfSpeech: PartOfSpeech[];
  selectedSource: string[];
  frequencyRange: { min: number | null; max: number | null };
  specificFrequencyRange: { min: number | null; max: number | null };
  selectedAudio: 'all' | 'with_audio' | 'without_audio';
  selectedImage: 'all' | 'with_image' | 'without_image';
  selectedVariant: 'all' | 'with_variant' | 'without_variant';
  selectedDefinition: 'all' | 'short_only' | 'long_only';
  sortBy: 'word' | 'frequency' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  pageSize: number;
}

// UI Preferences
export interface UIPreferences {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showTooltips: boolean;
  animationsEnabled: boolean;
  autoSave: boolean;
  notifications: boolean;
}

// Learning Preferences
export interface LearningPreferences {
  dailyGoal: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoPlayAudio: boolean;
  darkMode: boolean;
  sessionDuration: number;
  reviewInterval: number;
  difficultyPreference: number;
  learningReminders: Record<string, unknown>;
}

// Complete Settings State
export interface SettingsState {
  // Core settings
  ui: UIPreferences;
  learning: LearningPreferences;
  practice: {
    typing: TypingPracticeSettings;
    flashcards: Record<string, unknown>; // Future expansion
    quiz: Record<string, unknown>; // Future expansion
  };

  // Table/Filter states
  filters: {
    dictionary: DictionaryFilterSettings;
    adminDictionary: AdminDictionaryFilterSettings;
  };

  // Sync metadata
  sync: {
    lastSyncedAt: number | null;
    pendingChanges: boolean;
    syncInProgress: boolean;
    lastError: string | null;
  };

  // Loading states
  isLoaded: boolean;
  isInitialized: boolean;
}

// Default settings
const DEFAULT_UI_PREFERENCES: UIPreferences = {
  sidebarCollapsed: false,
  theme: 'system',
  compactMode: false,
  showTooltips: true,
  animationsEnabled: true,
  autoSave: true,
  notifications: true,
};

const DEFAULT_LEARNING_PREFERENCES: LearningPreferences = {
  dailyGoal: 5,
  notificationsEnabled: true,
  soundEnabled: true,
  autoPlayAudio: true,
  darkMode: false,
  sessionDuration: 15,
  reviewInterval: 3,
  difficultyPreference: 1,
  learningReminders: {},
};

const DEFAULT_TYPING_PRACTICE_SETTINGS: TypingPracticeSettings = {
  autoSubmitAfterCorrect: false,
  showDefinitionImages: true,
  wordsCount: 10,
  difficultyLevel: 3,
  enableTimeLimit: false,
  timeLimitSeconds: 60,
  playAudioOnStart: true,
  showProgressBar: true,
  enableGameSounds: true,
  gameSoundVolume: 0.5,
  enableKeystrokeSounds: false,
};

const DEFAULT_DICTIONARY_FILTERS: DictionaryFilterSettings = {
  searchQuery: '',
  selectedStatus: [],
  selectedPartOfSpeech: [],
  selectedDifficulty: [],
  showFavoritesOnly: false,
  showModifiedOnly: false,
  showNeedsReview: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  pageSize: 20,
};

const DEFAULT_ADMIN_DICTIONARY_FILTERS: AdminDictionaryFilterSettings = {
  searchQuery: '',
  selectedLanguage: 'da' as LanguageCode,
  selectedPartOfSpeech: [],
  selectedSource: [],
  frequencyRange: { min: null, max: null },
  specificFrequencyRange: { min: null, max: null },
  selectedAudio: 'all',
  selectedImage: 'all',
  selectedVariant: 'all',
  selectedDefinition: 'all',
  sortBy: 'word',
  sortOrder: 'asc',
  pageSize: 20,
};

const initialState: SettingsState = {
  ui: DEFAULT_UI_PREFERENCES,
  learning: DEFAULT_LEARNING_PREFERENCES,
  practice: {
    typing: DEFAULT_TYPING_PRACTICE_SETTINGS,
    flashcards: {},
    quiz: {},
  },
  filters: {
    dictionary: DEFAULT_DICTIONARY_FILTERS,
    adminDictionary: DEFAULT_ADMIN_DICTIONARY_FILTERS,
  },
  sync: {
    lastSyncedAt: null,
    pendingChanges: false,
    syncInProgress: false,
    lastError: null,
  },
  isLoaded: false,
  isInitialized: false,
};

// Settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Initialize settings from database
    initializeSettings: (
      state,
      action: PayloadAction<Partial<SettingsState>>,
    ) => {
      const { ui, learning, practice, filters } = action.payload;

      if (ui) state.ui = { ...state.ui, ...ui };
      if (learning) state.learning = { ...state.learning, ...learning };
      if (practice) state.practice = { ...state.practice, ...practice };
      if (filters) state.filters = { ...state.filters, ...filters };

      state.isLoaded = true;
      state.isInitialized = true;
      state.sync.lastSyncedAt = Date.now();
      state.sync.pendingChanges = false;
    },

    // UI Preferences
    updateUIPreference: <K extends keyof UIPreferences>(
      state: SettingsState,
      action: PayloadAction<{ key: K; value: UIPreferences[K] }>,
    ) => {
      const { key, value } = action.payload;
      state.ui[key] = value;
      state.sync.pendingChanges = true;
    },

    // Learning Preferences
    updateLearningPreference: <K extends keyof LearningPreferences>(
      state: SettingsState,
      action: PayloadAction<{ key: K; value: LearningPreferences[K] }>,
    ) => {
      const { key, value } = action.payload;
      state.learning[key] = value;
      state.sync.pendingChanges = true;
    },

    // Practice Settings
    updateTypingPracticeSetting: <K extends keyof TypingPracticeSettings>(
      state: SettingsState,
      action: PayloadAction<{ key: K; value: TypingPracticeSettings[K] }>,
    ) => {
      const { key, value } = action.payload;
      state.practice.typing[key] = value;
      state.sync.pendingChanges = true;
    },

    // Dictionary Filters
    updateDictionaryFilter: <K extends keyof DictionaryFilterSettings>(
      state: SettingsState,
      action: PayloadAction<{ key: K; value: DictionaryFilterSettings[K] }>,
    ) => {
      const { key, value } = action.payload;
      state.filters.dictionary[key] = value;
      state.sync.pendingChanges = true;
    },

    // Admin Dictionary Filters
    updateAdminDictionaryFilter: <
      K extends keyof AdminDictionaryFilterSettings,
    >(
      state: SettingsState,
      action: PayloadAction<{
        key: K;
        value: AdminDictionaryFilterSettings[K];
      }>,
    ) => {
      const { key, value } = action.payload;
      state.filters.adminDictionary[key] = value;
      state.sync.pendingChanges = true;
    },

    // Bulk updates
    updateBulkUIPreferences: (
      state,
      action: PayloadAction<Partial<UIPreferences>>,
    ) => {
      state.ui = { ...state.ui, ...action.payload };
      state.sync.pendingChanges = true;
    },

    updateBulkLearningPreferences: (
      state,
      action: PayloadAction<Partial<LearningPreferences>>,
    ) => {
      state.learning = { ...state.learning, ...action.payload };
      state.sync.pendingChanges = true;
    },

    updateBulkTypingPracticeSettings: (
      state,
      action: PayloadAction<Partial<TypingPracticeSettings>>,
    ) => {
      state.practice.typing = { ...state.practice.typing, ...action.payload };
      state.sync.pendingChanges = true;
    },

    // Clear filters
    clearDictionaryFilters: (state) => {
      state.filters.dictionary = DEFAULT_DICTIONARY_FILTERS;
      state.sync.pendingChanges = true;
    },

    clearAdminDictionaryFilters: (state) => {
      state.filters.adminDictionary = DEFAULT_ADMIN_DICTIONARY_FILTERS;
      state.sync.pendingChanges = true;
    },

    // Reset to defaults
    resetTypingPracticeSettings: (state) => {
      state.practice.typing = DEFAULT_TYPING_PRACTICE_SETTINGS;
      state.sync.pendingChanges = true;
    },

    resetUIPreferences: (state) => {
      state.ui = DEFAULT_UI_PREFERENCES;
      state.sync.pendingChanges = true;
    },

    resetLearningPreferences: (state) => {
      state.learning = DEFAULT_LEARNING_PREFERENCES;
      state.sync.pendingChanges = true;
    },

    // Sync management
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.sync.syncInProgress = action.payload;
    },

    setSyncSuccess: (state) => {
      state.sync.lastSyncedAt = Date.now();
      state.sync.pendingChanges = false;
      state.sync.syncInProgress = false;
      state.sync.lastError = null;
    },

    setSyncError: (state, action: PayloadAction<string>) => {
      state.sync.syncInProgress = false;
      state.sync.lastError = action.payload;
    },

    // Clear all settings (for logout)
    clearAllSettings: () => initialState,
  },
});

export const {
  initializeSettings,
  updateUIPreference,
  updateLearningPreference,
  updateTypingPracticeSetting,
  updateDictionaryFilter,
  updateAdminDictionaryFilter,
  updateBulkUIPreferences,
  updateBulkLearningPreferences,
  updateBulkTypingPracticeSettings,
  clearDictionaryFilters,
  clearAdminDictionaryFilters,
  resetTypingPracticeSettings,
  resetUIPreferences,
  resetLearningPreferences,
  setSyncInProgress,
  setSyncSuccess,
  setSyncError,
  clearAllSettings,
} = settingsSlice.actions;

// Selectors
export const selectUIPreferences = (state: { settings: SettingsState }) =>
  state.settings.ui;
export const selectLearningPreferences = (state: { settings: SettingsState }) =>
  state.settings.learning;
export const selectTypingPracticeSettings = (state: {
  settings: SettingsState;
}) => state.settings.practice.typing;
export const selectDictionaryFilters = (state: { settings: SettingsState }) =>
  state.settings.filters.dictionary;
export const selectAdminDictionaryFilters = (state: {
  settings: SettingsState;
}) => state.settings.filters.adminDictionary;
export const selectSyncStatus = (state: { settings: SettingsState }) =>
  state.settings.sync;
export const selectIsSettingsLoaded = (state: { settings: SettingsState }) =>
  state.settings.isLoaded;
export const selectIsSettingsInitialized = (state: {
  settings: SettingsState;
}) => state.settings.isInitialized;

export default settingsSlice.reducer;
