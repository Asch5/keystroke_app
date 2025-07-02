import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypingPracticeState } from './useTypingPracticeState';
import { LearningStatus } from '@/core/types';

// Mock the practice actions
const mockCreateTypingPracticeSession = vi.fn();
const mockValidateTypingInput = vi.fn();
const mockCompletePracticeSession = vi.fn();

vi.mock('@/core/domains/user/actions/practice-actions', () => ({
  createTypingPracticeSession: mockCreateTypingPracticeSession,
  validateTypingInput: mockValidateTypingInput,
  completePracticeSession: mockCompletePracticeSession,
}));

// Mock the user hook
vi.mock('@/core/shared/hooks/useUser', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      baseLanguageCode: 'en',
      targetLanguageCode: 'da',
    },
  }),
}));

const mockWords = [
  {
    userDictionaryId: '1',
    wordText: 'hund',
    definition: 'dog',
    audioUrl: 'http://example.com/audio1.mp3',
    phonetic: 'hun',
    partOfSpeech: 'noun',
    difficulty: 3,
    learningStatus: LearningStatus.notStarted,
    attempts: 0,
    correctAttempts: 0,
  },
  {
    userDictionaryId: '2',
    wordText: 'kat',
    definition: 'cat',
    audioUrl: 'http://example.com/audio2.mp3',
    phonetic: 'kat',
    partOfSpeech: 'noun',
    difficulty: 3,
    learningStatus: LearningStatus.notStarted,
    attempts: 0,
    correctAttempts: 0,
  },
  {
    userDictionaryId: '3',
    wordText: 'fugl',
    definition: 'bird',
    audioUrl: 'http://example.com/audio3.mp3',
    phonetic: 'fuʊl',
    partOfSpeech: 'noun',
    difficulty: 3,
    learningStatus: LearningStatus.notStarted,
    attempts: 0,
    correctAttempts: 0,
  },
];

describe('useTypingPracticeState', () => {
  let mockCreateSession: ReturnType<typeof vi.fn>;
  let mockValidateInput: ReturnType<typeof vi.fn>;
  let mockCompleteSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Use the mock functions directly
    mockCreateSession = mockCreateTypingPracticeSession;
    mockValidateInput = mockValidateTypingInput;
    mockCompleteSession = mockCompletePracticeSession;

    // Default successful session creation
    mockCreateSession.mockResolvedValue({
      success: true,
      session: {
        sessionId: 'test-session-id',
        words: mockWords,
        timeLimit: 30,
        difficultyConfig: {
          wordsPerSession: 10,
          timeLimit: 30,
          allowPartialCredit: true,
          showHints: false,
        },
      },
    });

    mockCompleteSession.mockResolvedValue({
      success: true,
      sessionSummary: {
        totalWords: 3,
        correctAnswers: 0,
        incorrectAnswers: 0,
        accuracy: 85,
        score: 100,
        timeSpent: 0,
        wordsLearned: 0,
        achievements: [],
      },
    });
  });

  describe('Session Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      expect(result.current.sessionState.isActive).toBe(false);
      expect(result.current.sessionState.sessionId).toBeNull();
      expect(result.current.sessionState.currentWord).toBeNull();
      expect(result.current.sessionState.currentWordIndex).toBe(0);
      expect(result.current.sessionState.words).toEqual([]);
      expect(result.current.wordResults).toEqual([]);
      expect(result.current.showResult).toBe(false);
    });

    it('should start session successfully', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      await act(async () => {
        await result.current.startPracticeSession();
      });

      expect(result.current.sessionState.isActive).toBe(true);
      expect(result.current.sessionState.sessionId).toBe('test-session-id');
      expect(result.current.sessionState.currentWord).toEqual(mockWords[0]);
      expect(result.current.sessionState.words).toEqual(mockWords);
      expect(mockCreateSession).toHaveBeenCalledWith({
        userId: 'test-user-id',
        userListId: null,
        listId: null,
        difficultyLevel: 3,
        wordsCount: 3,
        includeWordStatuses: [LearningStatus.notStarted],
      });
    });
  });

  describe('Skip Functionality - FIXED ISSUE', () => {
    it('should show result after skipping word', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      await act(async () => {
        await result.current.startPracticeSession();
      });

      // Verify initial state
      expect(result.current.showResult).toBe(false);
      expect(result.current.sessionState.currentWord?.wordText).toBe('hund');

      // Skip the word
      await act(async () => {
        await result.current.handleSkipWord();
      });

      // CRITICAL: Verify skip now shows result (this was the bug)
      expect(result.current.showResult).toBe(true);
      expect(result.current.wordResults).toHaveLength(1);
      expect(result.current.wordResults[0]).toEqual(
        expect.objectContaining({
          isCorrect: false,
          feedback: 'Skipped',
          correctWord: 'hund',
          pointsEarned: -2,
          accuracy: 0,
          partialCredit: false,
          responseTime: 0,
          userInput: '',
          mistakes: [],
        }),
      );
    });

    it('should update session stats correctly after skip', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      await act(async () => {
        await result.current.startPracticeSession();
      });

      const initialScore = result.current.sessionState.score;
      const initialIncorrect = result.current.sessionState.incorrectAnswers;

      await act(async () => {
        await result.current.handleSkipWord();
      });

      expect(result.current.sessionState.score).toBe(initialScore - 2);
      expect(result.current.sessionState.incorrectAnswers).toBe(
        initialIncorrect + 1,
      );
    });
  });

  describe('Word Progression - FIXED ISSUE', () => {
    it('should progress to next word correctly', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      await act(async () => {
        await result.current.startPracticeSession();
      });

      // Verify starting with first word
      expect(result.current.sessionState.currentWordIndex).toBe(0);
      expect(result.current.sessionState.currentWord?.wordText).toBe('hund');

      // Skip first word
      await act(async () => {
        await result.current.handleSkipWord();
      });

      // Move to next word (this is the behavior for Enter key press)
      await act(() => {
        result.current.handleNextWord();
      });

      // CRITICAL: Verify progression to second word (no more stuck on same word)
      expect(result.current.sessionState.currentWordIndex).toBe(1);
      expect(result.current.sessionState.currentWord?.wordText).toBe('kat');
      expect(result.current.showResult).toBe(false);
      expect(result.current.sessionState.userInput).toBe('');
    });

    it('should complete session when all words are finished', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 2,
          wordsCount: 2,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      // Mock session with only 2 words
      mockCreateSession.mockResolvedValueOnce({
        success: true,
        session: {
          sessionId: 'test-session-id',
          words: mockWords.slice(0, 2),
          timeLimit: 300,
          difficultyConfig: { timeLimit: 300 },
        },
      });

      await act(async () => {
        await result.current.startPracticeSession();
      });

      // Skip and progress through both words
      await act(async () => {
        await result.current.handleSkipWord();
      });
      await act(() => {
        result.current.handleNextWord();
      });

      await act(async () => {
        await result.current.handleSkipWord();
      });
      await act(() => {
        result.current.handleNextWord();
      });

      // Session should be completed
      expect(result.current.sessionState.isActive).toBe(false);
    });
  });

  describe('Word Input and Submission', () => {
    it('should handle input changes correctly', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      await act(async () => {
        await result.current.startPracticeSession();
      });

      await act(() => {
        result.current.handleInputChange('h');
      });

      expect(result.current.sessionState.userInput).toBe('h');

      await act(() => {
        result.current.handleInputChange('hu');
      });

      expect(result.current.sessionState.userInput).toBe('hu');
    });

    it('should validate correct input', async () => {
      mockValidateInput.mockResolvedValue({
        success: true,
        result: {
          isCorrect: true,
          accuracy: 100,
          partialCredit: false,
          pointsEarned: 10,
          feedback: 'Perfect!',
        },
      });

      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      await act(async () => {
        await result.current.startPracticeSession();
      });

      await act(() => {
        result.current.handleInputChange('hund');
      });

      await act(async () => {
        await result.current.handleWordSubmit();
      });

      expect(result.current.showResult).toBe(true);
      expect(result.current.wordResults).toHaveLength(1);
      expect(result.current.wordResults[0]).toEqual(
        expect.objectContaining({
          isCorrect: true,
          feedback: 'Perfect!',
          correctWord: 'hund',
          userInput: 'hund',
        }),
      );
    });
  });

  describe('Auto-submit Functionality', () => {
    it('should auto-submit when enabled and word is correct', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: true, // Enable auto-submit
        }),
      );

      mockValidateInput.mockResolvedValue({
        success: true,
        result: {
          isCorrect: true,
          accuracy: 100,
          partialCredit: false,
          pointsEarned: 10,
          feedback: 'Perfect!',
        },
      });

      await act(async () => {
        await result.current.startPracticeSession();
      });

      // Type the complete correct word
      await act(async () => {
        result.current.handleInputChange('hund');
      });

      // Wait for auto-submit to trigger
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have auto-submitted
      expect(mockValidateInput).toHaveBeenCalled();
    });

    it('should not auto-submit when disabled', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false, // Disable auto-submit
        }),
      );

      await act(async () => {
        await result.current.startPracticeSession();
      });

      await act(() => {
        result.current.handleInputChange('hund');
      });

      // Should not have auto-submitted
      expect(mockValidateInput).not.toHaveBeenCalled();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress percentage correctly', async () => {
      const { result } = renderHook(() =>
        useTypingPracticeState({
          userListId: undefined,
          listId: undefined,
          difficultyLevel: 3,
          wordsCount: 3,
          includeWordStatuses: [LearningStatus.notStarted],
          autoSubmitAfterCorrect: false,
        }),
      );

      await act(async () => {
        await result.current.startPracticeSession();
      });

      // At word 0 of 3
      expect(result.current.progressPercentage).toBe(0);

      // Skip to word 1
      await act(async () => {
        await result.current.handleSkipWord();
      });
      await act(() => {
        result.current.handleNextWord();
      });

      // At word 1 of 3
      expect(result.current.progressPercentage).toBeCloseTo(33.33, 1);

      // Skip to word 2
      await act(async () => {
        await result.current.handleSkipWord();
      });
      await act(() => {
        result.current.handleNextWord();
      });

      // At word 2 of 3
      expect(result.current.progressPercentage).toBeCloseTo(66.67, 1);
    });
  });
});
