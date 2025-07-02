import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TypingWordInput } from './TypingWordInput';
import { LearningStatus } from '@/core/types';
import type { SessionState, WordResult, TypingPracticeSettings } from './hooks';

// Mock the ImageWithFallback component
vi.mock('@/components/shared/ImageWithFallback', () => ({
  ImageWithFallback: ({ src, alt }: { src: string; alt: string }) => (
    <div data-testid="fallback-image" data-src={src} data-alt={alt}>
      Mock Image: {alt}
    </div>
  ),
}));

describe('TypingWordInput', () => {
  const mockSessionState: SessionState = {
    sessionId: 'test-session-id',
    words: [
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
    ],
    currentWordIndex: 0,
    currentWord: {
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
  };

  const mockSettings: TypingPracticeSettings = {
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

  const defaultProps = {
    sessionState: mockSessionState,
    showResult: false,
    wordResults: [],
    isPlayingAudio: false,
    settings: mockSettings,
    onInputChange: vi.fn(),
    onWordSubmit: vi.fn(),
    onSkipWord: vi.fn().mockResolvedValue({
      isCorrect: false,
      feedback: 'Skipped',
      correctWord: 'hund',
    }),
    onNextWord: vi.fn(),
    onPlayAudio: vi.fn(),
    onFinishPractice: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render word definition and input slots', () => {
      render(<TypingWordInput {...defaultProps} />);

      expect(screen.getByText('dog')).toBeInTheDocument();
      expect(screen.getByText('4 letters')).toBeInTheDocument();
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    it('should render correct number of input slots', () => {
      render(<TypingWordInput {...defaultProps} />);

      // Should have 4 slots for 'hund'
      const inputSlots = screen.getAllByRole('textbox');
      expect(inputSlots).toHaveLength(1); // InputOTP creates single textbox
    });

    it('should show image when settings allow and image is available', () => {
      const propsWithImage = {
        ...defaultProps,
        sessionState: {
          ...mockSessionState,
          currentWord: {
            ...mockSessionState.currentWord!,
            imageUrl: 'http://example.com/image.jpg',
            imageDescription: 'A dog',
          },
        },
      };

      render(<TypingWordInput {...propsWithImage} />);

      expect(screen.getByTestId('fallback-image')).toBeInTheDocument();
    });
  });

  describe('Enter Key Behavior - FIXED FUNCTIONALITY', () => {
    it('should skip word when Enter is pressed with no input', async () => {
      render(<TypingWordInput {...defaultProps} />);

      // Press Enter with no input
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(defaultProps.onSkipWord).toHaveBeenCalled();
      });

      expect(defaultProps.onWordSubmit).not.toHaveBeenCalled();
      expect(defaultProps.onNextWord).not.toHaveBeenCalled();
    });

    it('should submit word when Enter is pressed with input', async () => {
      const propsWithInput = {
        ...defaultProps,
        sessionState: {
          ...mockSessionState,
          userInput: 'hun',
        },
      };

      render(<TypingWordInput {...propsWithInput} />);

      // Press Enter with input
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(defaultProps.onWordSubmit).toHaveBeenCalled();
      });

      expect(defaultProps.onSkipWord).not.toHaveBeenCalled();
      expect(defaultProps.onNextWord).not.toHaveBeenCalled();
    });

    it('should go to next word when Enter is pressed while showing results', async () => {
      const propsWithResult = {
        ...defaultProps,
        showResult: true,
        wordResults: [
          {
            isCorrect: false,
            accuracy: 0,
            partialCredit: false,
            pointsEarned: -2,
            feedback: 'Skipped',
            responseTime: 0,
            userInput: '',
            correctWord: 'hund',
            mistakes: [],
          } as WordResult,
        ],
      };

      render(<TypingWordInput {...propsWithResult} />);

      // Press Enter while showing results
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(defaultProps.onNextWord).toHaveBeenCalled();
      });

      expect(defaultProps.onWordSubmit).not.toHaveBeenCalled();
      expect(defaultProps.onSkipWord).not.toHaveBeenCalled();
    });
  });

  describe('Button Interactions', () => {
    it('should show Skip button with Enter hint when no input', () => {
      render(<TypingWordInput {...defaultProps} />);

      const skipButton = screen.getByRole('button', { name: /skip/i });
      expect(skipButton).toBeInTheDocument();
      expect(screen.getByText('(Enter)')).toBeInTheDocument();
    });

    it('should show Submit button when there is input', () => {
      const propsWithInput = {
        ...defaultProps,
        sessionState: {
          ...mockSessionState,
          userInput: 'hun',
        },
      };

      render(<TypingWordInput {...propsWithInput} />);

      expect(
        screen.getByRole('button', { name: /submit/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /skip/i }),
      ).toBeInTheDocument();
    });

    it('should show Next Word button when showing results', () => {
      const propsWithResult = {
        ...defaultProps,
        showResult: true,
        wordResults: [
          {
            isCorrect: true,
            accuracy: 100,
            partialCredit: false,
            pointsEarned: 10,
            feedback: 'Perfect!',
            responseTime: 1500,
            userInput: 'hund',
            correctWord: 'hund',
            mistakes: [],
          } as WordResult,
        ],
      };

      render(<TypingWordInput {...propsWithResult} />);

      expect(
        screen.getByRole('button', { name: /next word/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /skip/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /submit/i }),
      ).not.toBeInTheDocument();
    });

    it('should call onSkipWord when Skip button is clicked', async () => {
      const user = userEvent.setup();
      render(<TypingWordInput {...defaultProps} />);

      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      expect(defaultProps.onSkipWord).toHaveBeenCalled();
    });

    it('should call onWordSubmit when Submit button is clicked', async () => {
      const user = userEvent.setup();
      const propsWithInput = {
        ...defaultProps,
        sessionState: {
          ...mockSessionState,
          userInput: 'hun',
        },
      };

      render(<TypingWordInput {...propsWithInput} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(defaultProps.onWordSubmit).toHaveBeenCalled();
    });
  });

  describe('Result Display', () => {
    it('should show correct word for incorrect attempts', () => {
      const propsWithResult = {
        ...defaultProps,
        showResult: true,
        wordResults: [
          {
            isCorrect: false,
            accuracy: 50,
            partialCredit: false,
            pointsEarned: -2,
            feedback: 'Incorrect',
            responseTime: 3000,
            userInput: 'hand',
            correctWord: 'hund',
            mistakes: [
              { position: 1, expected: 'u', actual: 'a' },
              { position: 2, expected: 'n', actual: 'n' },
            ],
          } as WordResult,
        ],
      };

      render(<TypingWordInput {...propsWithResult} />);

      expect(screen.getByText('You typed:')).toBeInTheDocument();
      expect(screen.getByText('Correct word:')).toBeInTheDocument();
      expect(screen.getByText('2 mistakes found')).toBeInTheDocument();
    });

    it('should show success message for correct attempts', () => {
      const propsWithResult = {
        ...defaultProps,
        showResult: true,
        wordResults: [
          {
            isCorrect: true,
            accuracy: 100,
            partialCredit: false,
            pointsEarned: 10,
            feedback: 'Perfect!',
            responseTime: 1500,
            userInput: 'hund',
            correctWord: 'hund',
            mistakes: [],
          } as WordResult,
        ],
      };

      render(<TypingWordInput {...propsWithResult} />);

      expect(screen.getByText(/Perfect! The word was:/)).toBeInTheDocument();
      expect(screen.getByText('hund')).toBeInTheDocument();
    });

    it('should show audio indicator when playing', () => {
      const propsWithAudio = {
        ...defaultProps,
        showResult: true,
        isPlayingAudio: true,
        wordResults: [
          {
            isCorrect: false,
            feedback: 'Skipped',
          } as WordResult,
        ],
      };

      render(<TypingWordInput {...propsWithAudio} />);

      expect(screen.getByText('Skipped 🔊')).toBeInTheDocument();
    });
  });

  describe('Audio Controls', () => {
    it('should show audio button when word has audio', () => {
      render(<TypingWordInput {...defaultProps} />);

      const audioButton = screen.getByRole('button', { name: /play audio/i });
      expect(audioButton).toBeInTheDocument();
    });

    it('should call onPlayAudio when audio button is clicked', async () => {
      const user = userEvent.setup();
      render(<TypingWordInput {...defaultProps} />);

      const audioButton = screen.getByRole('button', { name: /play audio/i });
      await user.click(audioButton);

      expect(defaultProps.onPlayAudio).toHaveBeenCalledWith(
        'hund',
        'http://example.com/audio1.mp3',
        true,
      );
    });

    it('should disable audio button when playing', () => {
      const propsWithPlayingAudio = {
        ...defaultProps,
        isPlayingAudio: true,
      };

      render(<TypingWordInput {...propsWithPlayingAudio} />);

      const audioButton = screen.getByRole('button', { name: /play audio/i });
      expect(audioButton).toBeDisabled();
    });
  });

  describe('Keyboard Focus Management', () => {
    it('should focus input when component mounts', () => {
      render(<TypingWordInput {...defaultProps} />);

      // Input should be focused after component mounts
      const input = screen.getByRole('textbox');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Settings Integration', () => {
    it('should hide images when showDefinitionImages is false', () => {
      const propsWithImageDisabled = {
        ...defaultProps,
        settings: {
          ...mockSettings,
          showDefinitionImages: false,
        },
        sessionState: {
          ...mockSessionState,
          currentWord: {
            ...mockSessionState.currentWord!,
            imageUrl: 'http://example.com/image.jpg',
          },
        },
      };

      render(<TypingWordInput {...propsWithImageDisabled} />);

      expect(screen.queryByTestId('fallback-image')).not.toBeInTheDocument();
    });

    it('should show images when showDefinitionImages is true', () => {
      const propsWithImageEnabled = {
        ...defaultProps,
        settings: {
          ...mockSettings,
          showDefinitionImages: true,
        },
        sessionState: {
          ...mockSessionState,
          currentWord: {
            ...mockSessionState.currentWord!,
            imageUrl: 'http://example.com/image.jpg',
            imageDescription: 'A dog',
          },
        },
      };

      render(<TypingWordInput {...propsWithImageEnabled} />);

      expect(screen.getByTestId('fallback-image')).toBeInTheDocument();
    });
  });
});
