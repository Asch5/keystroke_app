// Removed unused import

/**
 * Internationalization Types
 *
 * Type-safe internationalization system with comprehensive language support
 * and advanced formatting capabilities for the Keystroke App.
 */

// Supported UI languages (subset of content languages)
export type UILanguageCode = 'en' | 'da' | 'es' | 'fr' | 'de' | 'ru';

// Translation namespace for organizing keys
export type TranslationNamespace =
  | 'common'
  | 'settings'
  | 'dictionary'
  | 'practice'
  | 'admin'
  | 'auth'
  | 'errors'
  | 'navigation';

// Translation key structure
export interface TranslationKeys {
  common: {
    // Actions
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    remove: string;
    search: string;
    filter: string;
    sort: string;
    loading: string;
    saving: string;
    processing: string;
    success: string;
    error: string;
    retry: string;
    back: string;
    next: string;
    previous: string;
    continue: string;
    skip: string;
    close: string;
    open: string;

    // Status
    enabled: string;
    disabled: string;
    active: string;
    inactive: string;
    completed: string;
    pending: string;
    failed: string;

    // Time & Dates
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    lastWeek: string;
    thisMonth: string;
    lastMonth: string;

    // Quantities
    words: string;
    word: string;
    lists: string;
    list: string;
    items: string;
    item: string;

    // Confirmation
    areYouSure: string;
    confirmAction: string;
    cannotBeUndone: string;
  };

  settings: {
    // Page titles
    settings: string;
    profile: string;
    learningPreferences: string;
    appSettings: string;
    dangerZone: string;

    // Profile section
    fullName: string;
    emailAddress: string;
    nativeLanguage: string;
    learningLanguage: string;
    profilePicture: string;
    changeProfilePicture: string;
    selectYourNativeLanguage: string;
    selectLanguageToLearn: string;
    enterYourFullName: string;
    enterYourEmailAddress: string;
    saveChanges: string;
    profileUpdated: string;

    // Learning preferences
    dailyGoal: string;
    selectDailyGoal: string;
    difficultyPreference: string;
    selectDifficultyLevel: string;
    sessionDuration: string;
    selectSessionDuration: string;
    reviewInterval: string;
    selectReviewInterval: string;
    soundEffects: string;
    autoPlayAudio: string;
    browserNotifications: string;

    // App settings
    theme: string;
    selectTheme: string;
    interfaceLanguage: string;
    selectInterfaceLanguage: string;

    // Danger zone
    deleteAccount: string;
    deleteAccountDescription: string;
    typeDeleteToConfirm: string;
    accountDeleted: string;

    // Image processing
    imagesAutomaticallyCompressed: string;
    supportedFormats: string;
  };

  dictionary: {
    // Page titles
    myDictionary: string;
    addNewWord: string;
    wordLists: string;
    wordDetails: string;

    // Actions
    addToDictionary: string;
    addToList: string;
    removeFromDictionary: string;
    editWord: string;
    viewDetails: string;
    playAudio: string;

    // Word properties
    wordText: string;
    definition: string;
    pronunciation: string;
    partOfSpeech: string;
    difficulty: string;
    frequency: string;
    etymology: string;
    examples: string;
    translations: string;
    audio: string;
    image: string;

    // Search and filters
    searchWords: string;
    filterByDifficulty: string;
    filterByPartOfSpeech: string;
    showFavorites: string;
    showRecent: string;
    clearFilters: string;

    // List management
    createNewList: string;
    listName: string;
    listDescription: string;
    selectDifficulty: string;
    addWordsToList: string;
    removeFromList: string;

    // Word form
    enterWord: string;
    selectLanguage: string;
    selectDictionary: string;
    processOneWordOnly: string;
    processOnlyFirstMatch: string;

    // Status messages
    wordAdded: string;
    wordRemoved: string;
    listCreated: string;
    listUpdated: string;
    noWordsFound: string;
    loadingWords: string;
  };

  practice: {
    // Practice types
    practiceOverview: string;
    typingPractice: string;
    vocabularyPractice: string;
    flashcards: string;
    quiz: string;
    games: string;

    // Session
    startPractice: string;
    endSession: string;
    pauseSession: string;
    resumeSession: string;
    sessionComplete: string;
    viewResults: string;

    // Progress
    wordsCompleted: string;
    accuracy: string;
    speed: string;
    timeElapsed: string;
    mistakesMade: string;
    score: string;

    // Instructions
    typeTheWord: string;
    listenAndType: string;
    selectCorrectAnswer: string;
    matchWordWithDefinition: string;

    // Feedback
    correct: string;
    incorrect: string;
    tryAgain: string;
    wellDone: string;
    perfectScore: string;
    needsImprovement: string;

    // Settings
    selectVocabularySource: string;
    wholeDictionary: string;
    customList: string;
    publicList: string;
    difficulty: string;
    sessionDuration: string;
  };

  admin: {
    // Page titles
    adminPanel: string;
    userManagement: string;
    dictionaryManagement: string;
    systemSettings: string;

    // Dictionary management
    totalWords: string;
    wordsWithAudio: string;
    wordsWithImages: string;
    generateAudio: string;
    assignImages: string;
    bulkOperations: string;
    selectedWords: string;

    // User management
    totalUsers: string;
    activeUsers: string;
    bannedUsers: string;
    userDetails: string;
    banUser: string;
    unbanUser: string;

    // Actions
    bulkDelete: string;
    exportData: string;
    importData: string;
    cleanupDatabase: string;
  };

  auth: {
    // Forms
    signIn: string;
    signUp: string;
    signOut: string;
    forgotPassword: string;
    resetPassword: string;

    // Fields
    email: string;
    password: string;
    confirmPassword: string;
    rememberMe: string;

    // Messages
    signInToYourAccount: string;
    createNewAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    invalidCredentials: string;
    accountCreated: string;
    passwordResetSent: string;

    // Validation
    emailRequired: string;
    passwordRequired: string;
    passwordTooShort: string;
    passwordsDontMatch: string;
    invalidEmailFormat: string;
  };

  errors: {
    // General errors
    somethingWentWrong: string;
    tryAgainLater: string;
    pageNotFound: string;
    accessDenied: string;
    sessionExpired: string;

    // API errors
    networkError: string;
    serverError: string;
    requestTimeout: string;
    rateLimitExceeded: string;

    // Validation errors
    requiredField: string;
    invalidFormat: string;
    valueTooShort: string;
    valueTooLong: string;

    // Context-specific errors
    dictionaryError: string;
    dictionaryErrorDescription: string;
    practiceSessionError: string;
    practiceSessionErrorDescription: string;
    settingsError: string;
    settingsErrorDescription: string;
    adminPanelError: string;
    adminPanelErrorDescription: string;
    dashboardError: string;
    dashboardErrorDescription: string;
  };

  navigation: {
    // Main navigation
    dashboard: string;
    dictionary: string;
    practice: string;
    statistics: string;
    settings: string;
    admin: string;

    // Breadcrumbs
    home: string;
    back: string;

    // Menu actions
    profile: string;
    logout: string;
    help: string;
    about: string;
  };
}

// Flattened key type for easier usage
export type TranslationKey =
  | keyof TranslationKeys['common']
  | `settings.${keyof TranslationKeys['settings']}`
  | `dictionary.${keyof TranslationKeys['dictionary']}`
  | `practice.${keyof TranslationKeys['practice']}`
  | `admin.${keyof TranslationKeys['admin']}`
  | `auth.${keyof TranslationKeys['auth']}`
  | `errors.${keyof TranslationKeys['errors']}`
  | `navigation.${keyof TranslationKeys['navigation']}`;

// Interpolation parameters for dynamic content
export interface TranslationParams {
  [key: string]: string | number | boolean;
}

// Translation function signature
export type TranslationFunction = (
  key: TranslationKey,
  params?: TranslationParams,
  options?: {
    fallback?: string;
    namespace?: TranslationNamespace;
  },
) => string;

// Translation file structure
export interface TranslationFile {
  common: TranslationKeys['common'];
  settings: TranslationKeys['settings'];
  dictionary: TranslationKeys['dictionary'];
  practice: TranslationKeys['practice'];
  admin: TranslationKeys['admin'];
  auth: TranslationKeys['auth'];
  errors: TranslationKeys['errors'];
  navigation: TranslationKeys['navigation'];
}

// Locale configuration
export interface LocaleConfig {
  code: UILanguageCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    currency: string;
  };
}

// I18n context type
export interface I18nContextType {
  locale: UILanguageCode;
  translations: TranslationFile;
  setLocale: (locale: UILanguageCode) => void;
  t: TranslationFunction;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatRelativeTime: (date: Date) => string;
}
