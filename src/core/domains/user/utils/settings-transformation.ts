import {
  SettingsState,
  UIPreferences,
  LearningPreferences,
  TypingPracticeSettings,
  DictionaryFilterSettings,
  AdminDictionaryFilterSettings,
} from '@/core/state/features/settingsSlice';
import { LanguageCode } from '@prisma/client';

// Default settings matching actual interfaces
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

/**
 * Safely transforms database JSON to UIPreferences with validation
 */
export function transformUIPreferences(data: unknown): UIPreferences {
  try {
    if (data && typeof data === 'object') {
      return { ...DEFAULT_UI_PREFERENCES, ...(data as Partial<UIPreferences>) };
    }
    return DEFAULT_UI_PREFERENCES;
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

/**
 * Safely transforms database JSON to LearningPreferences with validation
 */
export function transformLearningPreferences(
  data: unknown,
): LearningPreferences {
  try {
    if (data && typeof data === 'object') {
      return {
        ...DEFAULT_LEARNING_PREFERENCES,
        ...(data as Partial<LearningPreferences>),
      };
    }
    return DEFAULT_LEARNING_PREFERENCES;
  } catch {
    return DEFAULT_LEARNING_PREFERENCES;
  }
}

/**
 * Safely transforms database JSON to TypingPracticeSettings with validation
 */
export function transformTypingPracticeSettings(
  data: unknown,
): TypingPracticeSettings {
  try {
    if (data && typeof data === 'object') {
      return {
        ...DEFAULT_TYPING_PRACTICE_SETTINGS,
        ...(data as Partial<TypingPracticeSettings>),
      };
    }
    return DEFAULT_TYPING_PRACTICE_SETTINGS;
  } catch {
    return DEFAULT_TYPING_PRACTICE_SETTINGS;
  }
}

/**
 * Safely transforms database JSON to DictionaryFilterSettings with validation
 */
export function transformDictionaryFilterSettings(
  data: unknown,
): DictionaryFilterSettings {
  try {
    if (data && typeof data === 'object') {
      return {
        ...DEFAULT_DICTIONARY_FILTERS,
        ...(data as Partial<DictionaryFilterSettings>),
      };
    }
    return DEFAULT_DICTIONARY_FILTERS;
  } catch {
    return DEFAULT_DICTIONARY_FILTERS;
  }
}

/**
 * Safely transforms database JSON to AdminDictionaryFilterSettings with validation
 */
export function transformAdminDictionaryFilterSettings(
  data: unknown,
): AdminDictionaryFilterSettings {
  try {
    if (data && typeof data === 'object') {
      return {
        ...DEFAULT_ADMIN_DICTIONARY_FILTERS,
        ...(data as Partial<AdminDictionaryFilterSettings>),
      };
    }
    return DEFAULT_ADMIN_DICTIONARY_FILTERS;
  } catch {
    return DEFAULT_ADMIN_DICTIONARY_FILTERS;
  }
}

/**
 * Safely gets nested property from unknown object
 */
function safeGet(
  obj: unknown,
  path: string[],
  defaultValue: unknown = undefined,
): unknown {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  let current = obj as Record<string, unknown>;

  for (const key of path) {
    if (current[key] === undefined || current[key] === null) {
      return defaultValue;
    }
    if (typeof current[key] === 'object') {
      current = current[key] as Record<string, unknown>;
    } else if (path.indexOf(key) === path.length - 1) {
      return current[key];
    } else {
      return defaultValue;
    }
  }

  return current;
}

/**
 * Transforms complete database settings to typed SettingsState
 */
export function transformDatabaseSettingsToState(
  databaseSettings: Record<string, unknown>,
  databaseStudyPreferences: Record<string, unknown>,
  userSettings?: {
    dailyGoal?: number;
    notificationsEnabled?: boolean;
    soundEnabled?: boolean;
    autoPlayAudio?: boolean;
    darkMode?: boolean;
    sessionDuration?: number;
    reviewInterval?: number;
    difficultyPreference?: number;
    learningReminders?: Record<string, unknown>;
  },
): Partial<SettingsState> {
  const uiData = safeGet(databaseSettings, ['ui']);
  const filtersData = safeGet(databaseSettings, ['filters']);
  const learningData = safeGet(databaseStudyPreferences, ['learning']);
  const practiceData = safeGet(databaseStudyPreferences, ['practice']);

  const ui = transformUIPreferences(uiData);

  const baseLearningPrefs = transformLearningPreferences(learningData);
  const learning: LearningPreferences = {
    dailyGoal: userSettings?.dailyGoal ?? baseLearningPrefs.dailyGoal,
    notificationsEnabled:
      userSettings?.notificationsEnabled ??
      baseLearningPrefs.notificationsEnabled,
    soundEnabled: userSettings?.soundEnabled ?? baseLearningPrefs.soundEnabled,
    autoPlayAudio:
      userSettings?.autoPlayAudio ?? baseLearningPrefs.autoPlayAudio,
    darkMode: userSettings?.darkMode ?? baseLearningPrefs.darkMode,
    sessionDuration:
      userSettings?.sessionDuration ?? baseLearningPrefs.sessionDuration,
    reviewInterval:
      userSettings?.reviewInterval ?? baseLearningPrefs.reviewInterval,
    difficultyPreference:
      userSettings?.difficultyPreference ??
      baseLearningPrefs.difficultyPreference,
    learningReminders:
      userSettings?.learningReminders ?? baseLearningPrefs.learningReminders,
  };

  const typingData = safeGet(practiceData, ['typing']);
  const flashcardsData = safeGet(practiceData, ['flashcards']);
  const quizData = safeGet(practiceData, ['quiz']);

  const practice = {
    typing: transformTypingPracticeSettings(typingData),
    flashcards: (flashcardsData as Record<string, unknown>) || {},
    quiz: (quizData as Record<string, unknown>) || {},
  };

  const dictionaryFiltersData = safeGet(filtersData, ['dictionary']);
  const adminDictionaryFiltersData = safeGet(filtersData, ['adminDictionary']);

  const filters = {
    dictionary: transformDictionaryFilterSettings(dictionaryFiltersData),
    adminDictionary: transformAdminDictionaryFilterSettings(
      adminDictionaryFiltersData,
    ),
  };

  return { ui, learning, practice, filters };
}

/**
 * Transforms typed SettingsState back to database JSON format
 */
export function transformStateToDatabase(state: Partial<SettingsState>): {
  settings: Record<string, unknown>;
  studyPreferences: Record<string, unknown>;
} {
  const settings: Record<string, unknown> = {
    ui: state.ui || {},
    filters: {
      dictionary: state.filters?.dictionary || {},
      adminDictionary: state.filters?.adminDictionary || {},
    },
  };

  const studyPreferences: Record<string, unknown> = {
    learning: state.learning || {},
    practice: {
      typing: state.practice?.typing || {},
      flashcards: state.practice?.flashcards || {},
      quiz: state.practice?.quiz || {},
    },
  };

  return { settings, studyPreferences };
}
