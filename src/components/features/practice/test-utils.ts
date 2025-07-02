import { LearningStatus } from '@/core/types';
import type { SessionState, WordResult, TypingPracticeSettings } from './hooks';

/**
 * Mock practice word data for testing
 */
export const mockPracticeWords = [
  {
    userDictionaryId: '1',
    wordText: 'hund',
    definition:
      'a domesticated carnivorous mammal that typically has a long snout, an acute sense of smell, non-retractable claws, and a barking, howling, or whining voice',
    oneWordTranslation: 'dog',
    audioUrl: 'http://example.com/audio1.mp3',
    phonetic: 'hun',
    partOfSpeech: 'noun' as const,
    difficulty: 3,
    learningStatus: LearningStatus.notStarted,
    attempts: 0,
    correctAttempts: 0,
    imageId: 1,
    imageUrl: 'http://example.com/dog.jpg',
    imageDescription: 'A friendly dog',
  },
  {
    userDictionaryId: '2',
    wordText: 'kat',
    definition:
      'a small domesticated carnivorous mammal with soft fur, a short snout, and retractable claws',
    oneWordTranslation: 'cat',
    audioUrl: 'http://example.com/audio2.mp3',
    phonetic: 'kat',
    partOfSpeech: 'noun' as const,
    difficulty: 3,
    learningStatus: LearningStatus.notStarted,
    attempts: 0,
    correctAttempts: 0,
  },
  {
    userDictionaryId: '3',
    wordText: 'fugl',
    definition:
      'a warm-blooded egg-laying vertebrate distinguished by the possession of feathers, wings, and a beak and typically able to fly',
    oneWordTranslation: 'bird',
    audioUrl: 'http://example.com/audio3.mp3',
    phonetic: 'fuʊl',
    partOfSpeech: 'noun' as const,
    difficulty: 3,
    learningStatus: LearningStatus.notStarted,
    attempts: 0,
    correctAttempts: 0,
  },
];

/**
 * Create a mock session state for testing
 */
export const createMockSessionState = (
  overrides: Partial<SessionState> = {},
): SessionState => ({
  sessionId: 'test-session-id',
  words: mockPracticeWords,
  currentWordIndex: 0,
  currentWord: mockPracticeWords[0] || null,
  userInput: '',
  difficultyConfig: {
    wordsPerSession: 10,
    timeLimit: 30,
    allowPartialCredit: true,
    showHints: false,
  },
  isActive: true,
  score: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  startTime: new Date(),
  ...overrides,
});

/**
 * Create mock word results for testing
 */
export const createMockWordResult = (
  overrides: Partial<WordResult> = {},
): WordResult => ({
  isCorrect: false,
  accuracy: 0,
  partialCredit: false,
  pointsEarned: -2,
  feedback: 'Skipped',
  responseTime: 0,
  userInput: '',
  correctWord: 'hund',
  mistakes: [],
  ...overrides,
});

/**
 * Create mock typing practice settings
 */
export const createMockSettings = (
  overrides: Partial<TypingPracticeSettings> = {},
): TypingPracticeSettings => ({
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
  ...overrides,
});

/**
 * Mock successful session creation response
 */
export const mockSessionCreationResponse = {
  success: true,
  session: {
    sessionId: 'test-session-id',
    words: mockPracticeWords,
    timeLimit: 30,
    difficultyConfig: {
      wordsPerSession: 10,
      timeLimit: 30,
      allowPartialCredit: true,
      showHints: false,
    },
  },
};

/**
 * Mock successful validation response
 */
export const mockValidationResponse = {
  success: true,
  result: {
    isCorrect: true,
    accuracy: 100,
    partialCredit: false,
    pointsEarned: 10,
    feedback: 'Perfect!',
  },
};

/**
 * Mock session completion response
 */
export const mockSessionCompletionResponse = {
  success: true,
  sessionSummary: {
    accuracy: 85,
    score: 100,
    achievements: ['First Session Complete!'],
  },
};

/**
 * Test helper to simulate Enter key press
 */
export const simulateEnterKey = () => {
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    bubbles: true,
  });
  document.dispatchEvent(enterEvent);
};

/**
 * Test helper to wait for async operations
 */
export const waitForAsyncOperation = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  baseLanguageCode: 'en' as const,
  targetLanguageCode: 'da' as const,
};

/**
 * Common test props for components
 */
export const commonTestProps = {
  userListId: undefined,
  listId: undefined,
  difficultyLevel: 3,
  wordsCount: 3,
  includeWordStatuses: [
    LearningStatus.notStarted,
    LearningStatus.inProgress,
    LearningStatus.difficult,
  ] as const,
};
