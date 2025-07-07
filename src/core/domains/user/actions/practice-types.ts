'use server';

import { LearningStatus, LanguageCode } from '@/core/types';

/**
 * Enhanced types for multiple practice types
 */
export type PracticeType =
  | 'typing'
  | 'choose-right-word'
  | 'make-up-word'
  | 'remember-translation'
  | 'write-by-definition'
  | 'write-by-sound'
  | 'unified-practice';

/**
 * Practice type multipliers for difficulty calculation
 */
export async function getPracticeTypeMultipliers() {
  return {
    'remember-translation': 0.5, // Difficulty 1
    'choose-right-word': 1.0, // Difficulty 2
    'make-up-word': 1.5, // Difficulty 3
    'write-by-definition': 2.0, // Difficulty 4
    'write-by-sound': 2.5, // Difficulty 4+
    typing: 1.2, // Current system
  } as const;
}

/**
 * Practice type configurations
 */
export async function getPracticeTypeConfigs() {
  return {
    'remember-translation': {
      difficultyLevel: 1,
      maxAttempts: 1,
      autoAdvance: true,
      requiresAudio: false,
      requiresInput: false,
    },
    'choose-right-word': {
      difficultyLevel: 2,
      maxAttempts: 1,
      autoAdvance: true,
      requiresAudio: false,
      requiresInput: false,
      optionCount: 4,
    },
    'make-up-word': {
      difficultyLevel: 3,
      maxAttempts: 3,
      maxAttemptsPhrase: 6,
      autoAdvance: true,
      requiresAudio: false,
      requiresInput: true,
    },
    'write-by-definition': {
      difficultyLevel: 4,
      maxAttempts: 1,
      autoAdvance: false,
      requiresAudio: false,
      requiresInput: true,
    },
    'write-by-sound': {
      difficultyLevel: 4,
      maxAttempts: 1,
      autoAdvance: false,
      requiresAudio: true,
      requiresInput: true,
      maxAudioReplays: 3,
    },
    'unified-practice': {
      difficultyLevel: 3,
      maxAttempts: 1,
      autoAdvance: false,
      requiresAudio: false,
      requiresInput: true,
    },
    typing: {
      difficultyLevel: 3,
      maxAttempts: 1,
      autoAdvance: false,
      requiresAudio: false,
      requiresInput: true,
    },
  } as const;
}

/**
 * Core practice word interface
 */
export interface PracticeWord {
  userDictionaryId: string;
  wordText: string;
  definition: string;
  oneWordTranslation?: string | undefined;
  phonetic?: string | undefined;
  partOfSpeech?: string | undefined;
  difficulty: number;
  learningStatus: LearningStatus;
  attempts: number;
  correctAttempts: number;
  srsLevel?: number;
  audioUrl?: string | undefined;
  imageId?: number | undefined;
  imageUrl?: string | undefined;
  imageDescription?: string | undefined;

  // Enhanced fields for new practice types
  isNewWord?: boolean;
  gameAttempts?: number;
  maxAttempts?: number;
  characterPool?: string[];
  distractorOptions?: string[];
  correctAnswerIndex?: number;
  isPhrase?: boolean;
  wordCount?: number;
}

/**
 * Practice session creation request
 */
export interface CreatePracticeSessionRequest {
  userId: string;
  userListId?: string | null;
  listId?: string | null;
  difficultyLevel: number;
  wordsCount?: number;
  timeLimit?: number;
  includeWordStatuses?: LearningStatus[];
  practiceType?: PracticeType;
}

/**
 * Enhanced practice session structure
 */
export interface EnhancedPracticeSession {
  sessionId: string;
  practiceType: PracticeType;
  words: PracticeWord[];
  difficultyLevel: number;
  currentWordIndex: number;
  settings: PracticeSessionSettings;
  config: PracticeTypeConfig;
}

/**
 * Practice session settings
 */
export interface PracticeSessionSettings {
  autoPlayAudio: boolean;
  enableGameSounds: boolean;
  showHints: boolean;
  allowSkipping: boolean;
  timeLimit?: number;
}

/**
 * Practice session progress tracking
 */
export interface PracticeSessionProgress {
  sessionId: string;
  currentWordIndex: number;
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  currentScore: number;
  timeRemaining: number;
  wordsRemaining: PracticeWord[];
}

/**
 * Validation request interface
 */
export interface ValidateTypingRequest {
  sessionId: string;
  userDictionaryId: string;
  userInput: string;
  responseTime: number; // in milliseconds
}

/**
 * Unified practice word extension
 */
export interface UnifiedPracticeWord extends PracticeWord {
  dynamicExerciseType: PracticeType;
  exerciseHistory: PracticeType[];
  nextExerciseType?: PracticeType;
}

/**
 * Practice type configuration structure
 */
export interface PracticeTypeConfig {
  difficultyLevel: number;
  maxAttempts: number;
  autoAdvance: boolean;
  requiresAudio: boolean;
  requiresInput: boolean;
  optionCount?: number;
  maxAttemptsPhrase?: number;
  maxAudioReplays?: number;
}

/**
 * Progressive learning interfaces
 */
export interface ProgressionResult {
  previousLevel: number;
  newLevel: number;
  levelChanged: boolean;
  newLearningStatus: LearningStatus;
  nextExerciseType: PracticeType;
}

export interface ExerciseTypeResult {
  exerciseType: PracticeType;
  currentLevel: number;
  canAdvance: boolean;
  shouldRegress: boolean;
  progressInfo: {
    attemptsAtCurrentLevel: number;
    successesAtCurrentLevel: number;
    nextLevelRequirement: number;
  };
}

/**
 * Progress tracking interfaces
 */
export interface CompleteProgressData {
  userDictionary: Record<string, unknown>;
  sessionItem: Record<string, unknown>;
  mistake?: Record<string, unknown>;
  dailyProgress?: Record<string, unknown>;
}

export interface SessionSummary {
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  score: number;
  timeSpent: number;
  wordsLearned: number;
  achievements: string[];
}

/**
 * Game utility interfaces
 */
export interface GameUtilityOptions {
  correctWord: string;
  targetLanguageCode: LanguageCode;
  baseLanguageCode: LanguageCode;
  partOfSpeech?: string;
  extraCharacters?: number;
}

/**
 * Session configuration interface
 */
export interface SessionConfiguration {
  practiceType: PracticeType;
  wordsToStudy: number;
  difficulty?: number;
  targetLanguageCode: LanguageCode;
  timeLimit?: number | undefined;
  listId?: string | null | undefined;
  userListId?: string | null | undefined;
  settings: {
    autoPlayAudio: boolean;
    enableGameSounds: boolean;
    showHints: boolean;
    allowSkipping: boolean;
  };
  enabledExerciseTypes?: string[] | undefined;
}

/**
 * Practice session result interface
 */
export interface PracticeSessionResult {
  sessionId: string;
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  totalTime: number;
  averageTime: number;
  sessionScore: number;
  wordsLearned: number;
  difficultyScore: number;
  practiceType: string;
  startTime: Date;
  endTime: Date;
  words: Array<{
    userDictionaryId: string;
    wordText: string;
    isCorrect: boolean;
    responseTime: number;
    attempts: number;
  }>;
}

/**
 * Unified practice session interface
 */
export interface UnifiedPracticeSession {
  sessionId: string;
  userId: string;
  practiceType: PracticeType;
  words: Array<
    PracticeWord & { exerciseType: PracticeType; reasoning?: string }
  >;
  configuration: SessionConfiguration & {
    baseLanguageCode: LanguageCode;
  };
  progress: {
    currentWordIndex: number;
    completedWords: number;
    correctAnswers: number;
    totalAttempts: number;
    sessionScore: number;
  };
  adaptiveSettings: {
    difficulty: number;
    adaptiveDifficulty: boolean;
    pauseOnIncorrect: boolean;
    showCorrectAnswer: boolean;
  };
}

/**
 * Progression result interface
 */
export interface ProgressionResult {
  previousLevel: number;
  newLevel: number;
  levelChanged: boolean;
  newLearningStatus: LearningStatus;
  nextExerciseType: PracticeType;
}

/**
 * Exercise type determination result
 */
export interface ExerciseTypeResult {
  exerciseType: PracticeType;
  currentLevel: number;
  canAdvance: boolean;
  shouldRegress: boolean;
  progressInfo: {
    attemptsAtCurrentLevel: number;
    successesAtCurrentLevel: number;
    nextLevelRequirement: number;
  };
}

/**
 * Learning analytics interface
 */
export interface LearningAnalytics {
  timeframe: 'day' | 'week' | 'month' | 'all';
  totalSessions: number;
  completedSessions: number;
  totalWordsStudied: number;
  totalWordsLearned: number;
  totalTimeMinutes: number;
  averageAccuracy: number;
  currentStreak: number;
  practiceTypeStats: Record<
    string,
    { count: number; totalWords: number; accuracy: number }
  >;
  mistakeTypes: Record<string, number>;
  dailyProgress: Array<{
    date: Date;
    minutesStudied: number;
    wordsLearned: number;
    streakDays: number;
  }>;
  improvementRate: number;
  difficultyProgression: Array<{
    date: Date;
    averageDifficulty: number;
    accuracy: number;
  }>;
}

/**
 * Difficulty analysis interface
 */
export interface DifficultyAnalysis {
  difficultWords: Array<{
    userDictionaryId: string;
    wordText: string;
    masteryScore: number;
    mistakeCount: number;
    mistakeRate: number;
    difficultyScore: number;
    learningStatus: LearningStatus;
    srsLevel: number;
    recentMistakes: Array<{
      type: string;
      incorrectValue: string;
      createdAt: Date;
    }>;
  }>;
  mistakePatterns: Array<{
    type: string;
    word: string;
    frequency: number;
    exerciseTypes: string[];
  }>;
  recommendations: string[];
  totalDifficultWords: number;
  averageDifficultyScore: number;
}

/**
 * Progress metrics interface
 */
export interface ProgressMetrics {
  totalWords: number;
  learnedWords: number;
  completionRate: number;
  currentStreak: number;
  learningVelocity: number;
  daysActive: number;
  statusDistribution: Record<string, number>;
  masteryDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
    mastered: number;
  };
  recentActivity: Array<{
    date: Date;
    minutesStudied: number;
    wordsLearned: number;
  }>;
}
