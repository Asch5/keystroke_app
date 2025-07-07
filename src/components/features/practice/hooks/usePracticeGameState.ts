'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPracticeTypeConfigs } from '@/core/domains/user/actions/practice-actions';
import type {
  PracticeType,
  EnhancedPracticeSession,
} from '@/core/domains/user/actions/practice-actions';

type PracticePhase = 'game' | 'word-card' | 'summary';

type PracticeConfigsType = Record<
  PracticeType,
  {
    difficultyLevel: number;
    maxAttempts: number;
    autoAdvance: boolean;
    requiresAudio: boolean;
    requiresInput: boolean;
    optionCount?: number;
    maxAttemptsPhrase?: number;
    maxAudioReplays?: number;
  }
>;

interface SessionProgress {
  correctAnswers: number;
  incorrectAnswers: number;
  currentScore: number;
  timeStarted: number;
}

interface UsePracticeGameStateProps {
  session: EnhancedPracticeSession;
  onWordComplete: (
    wordId: string,
    userInput: string,
    isCorrect: boolean,
    attempts: number,
    practiceType: PracticeType,
  ) => void;
  onSessionComplete: () => void;
  onWordCardNext: () => void;
}

export function usePracticeGameState({
  session,
  onWordComplete,
  onSessionComplete,
  onWordCardNext,
}: UsePracticeGameStateProps) {
  const [currentPhase, setCurrentPhase] = useState<PracticePhase>('game');
  const [showWordCard, setShowWordCard] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(
    session.currentWordIndex || 0,
  );
  const [sessionProgress, setSessionProgress] = useState<SessionProgress>({
    correctAnswers: 0,
    incorrectAnswers: 0,
    currentScore: 0,
    timeStarted: Date.now(),
  });
  const [error, setError] = useState<string | null>(null);
  const [practiceConfigs, setPracticeConfigs] =
    useState<PracticeConfigsType | null>(null);

  const currentWord = session.words[currentWordIndex];
  const isLastWord = currentWordIndex >= session.words.length - 1;

  // Fetch practice configs on component mount
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const configs = await getPracticeTypeConfigs();
        setPracticeConfigs(configs as PracticeConfigsType);
      } catch (err) {
        console.error('Failed to fetch practice configs:', err);
        setError('Failed to load practice configuration');
      }
    };

    fetchConfigs();
  }, []);

  // Use the session's config directly if practiceConfigs is not loaded yet
  const defaultConfig = {
    difficultyLevel: 3,
    maxAttempts: 1,
    autoAdvance: false,
    requiresAudio: false,
    requiresInput: true,
  };

  const practiceConfig = practiceConfigs
    ? practiceConfigs[session.practiceType]
    : (session.config as typeof defaultConfig) || defaultConfig;

  // Determine initial phase based on word familiarity
  useEffect(() => {
    if (currentWord) {
      const isNewWord = currentWord.isNewWord || currentWord.attempts === 0;

      if (isNewWord && session.practiceType !== 'remember-translation') {
        // New words show WordCard first (except for remember-translation which is self-assessment)
        setCurrentPhase('word-card');
        setShowWordCard(true);
      } else {
        // Familiar words or remember-translation start with game
        setCurrentPhase('game');
        setShowWordCard(false);
      }
    }
  }, [currentWord, currentWordIndex, session.practiceType]);

  const handleGameAnswer = useCallback(
    (userInput: string, isCorrect: boolean, attempts: number) => {
      if (!currentWord) return;

      // Update session progress
      setSessionProgress((prev) => ({
        ...prev,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
        currentScore:
          prev.currentScore +
          (isCorrect ? practiceConfig.difficultyLevel * 10 : 0),
      }));

      // Notify parent component
      onWordComplete(
        currentWord.userDictionaryId,
        userInput,
        isCorrect,
        attempts,
        session.practiceType,
      );

      // Auto-advance to WordCard for review
      setTimeout(
        () => {
          setCurrentPhase('word-card');
          setShowWordCard(true);
        },
        isCorrect ? 1500 : 2500,
      );
    },
    [currentWord, session.practiceType, onWordComplete, practiceConfig],
  );

  const handleWordCardNext = useCallback(() => {
    if (isLastWord) {
      // Session complete
      setCurrentPhase('summary');
      onSessionComplete();
    } else {
      // Move to next word
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      setShowWordCard(false);

      // Notify parent
      onWordCardNext();
    }
  }, [isLastWord, currentWordIndex, onSessionComplete, onWordCardNext]);

  const handleGameNext = useCallback(() => {
    // For exercises 4 and 5, handle next button click
    setCurrentPhase('word-card');
    setShowWordCard(true);
  }, []);

  return {
    currentPhase,
    showWordCard,
    currentWordIndex,
    sessionProgress,
    error,
    practiceConfigs,
    currentWord,
    isLastWord,
    practiceConfig,
    handleGameAnswer,
    handleWordCardNext,
    handleGameNext,
    setError,
  };
}
