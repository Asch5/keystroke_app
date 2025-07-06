'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trophy, Pause } from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';

// Import universal components
import {
  WordCard,
  UniversalProgressIndicator,
  PracticeGameContainer,
} from './shared';

// Import practice games
import {
  ChooseRightWordGame,
  RememberTranslationGame,
  MakeUpWordGame,
  WriteByDefinitionGame,
  WriteBySoundGame,
} from './games';

// Import types and utilities
import type {
  PracticeType,
  EnhancedPracticeSession,
  UnifiedPracticeWord,
} from '@/core/domains/user/actions/practice-actions';
import { getPracticeTypeConfigs } from '@/core/domains/user/actions/practice-actions';

interface EnhancedPracticeContentProps {
  session: EnhancedPracticeSession;
  onWordComplete: (
    wordId: string,
    userInput: string,
    isCorrect: boolean,
    attempts: number,
    practiceType: PracticeType,
  ) => void;
  onSessionComplete: () => void;
  onSessionPause?: () => void;
  onWordCardNext: () => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  className?: string;
}

type PracticePhase = 'game' | 'word-card' | 'summary';

/**
 * Enhanced Practice Content Orchestrator
 * Manages the flow between different practice types and WordCard reviews
 */
export function EnhancedPracticeContent({
  session,
  onWordComplete,
  onSessionComplete,
  onSessionPause,
  onWordCardNext,
  onAudioPlay,
  className,
}: EnhancedPracticeContentProps) {
  const [currentPhase, setCurrentPhase] = useState<PracticePhase>('game');
  const [showWordCard, setShowWordCard] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(
    session.currentWordIndex || 0,
  );
  const [sessionProgress, setSessionProgress] = useState({
    correctAnswers: 0,
    incorrectAnswers: 0,
    currentScore: 0,
    timeStarted: Date.now(),
  });
  const [error, setError] = useState<string | null>(null);

  // Define a proper type for practice configs
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
  const practiceConfig = practiceConfigs
    ? practiceConfigs[session.practiceType]
    : session.config;

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

  const renderPracticeGame = () => {
    if (!currentWord || currentPhase !== 'game' || !practiceConfigs)
      return null;

    // Ensure word has required properties for game components
    const wordForGame = {
      ...currentWord,
      oneWordTranslation: currentWord.oneWordTranslation || '',
      audioUrl: currentWord.audioUrl || '',
      phonetic: currentWord.phonetic || '',
    };

    // Create specific props for each game type to match their expected interfaces
    const baseGameProps = {
      word: wordForGame,
      autoPlayAudio: session.settings?.autoPlayAudio ?? true,
      className: 'w-full',
    };

    // Create a no-op function for required callbacks that might be undefined
    const handleAudioPlay = onAudioPlay || (() => {});

    // For unified practice, use the dynamic exercise type from the word
    const effectivePracticeType =
      session.practiceType === 'unified-practice'
        ? (currentWord as UnifiedPracticeWord).dynamicExerciseType
        : session.practiceType;

    switch (effectivePracticeType) {
      case 'choose-right-word':
        return (
          <ChooseRightWordGame
            {...baseGameProps}
            onAnswer={(selectedIndex, isCorrect) =>
              handleGameAnswer('', isCorrect, 1)
            }
            onAudioPlay={handleAudioPlay}
          />
        );

      case 'remember-translation':
        return (
          <RememberTranslationGame
            {...baseGameProps}
            onAnswer={(remembered) => handleGameAnswer('', remembered, 1)}
            onAudioPlay={handleAudioPlay}
          />
        );

      case 'make-up-word':
        return (
          <MakeUpWordGame
            {...baseGameProps}
            onAnswer={handleGameAnswer}
            onAudioPlay={handleAudioPlay}
          />
        );

      case 'write-by-definition': {
        const nextFn = practiceConfigs[effectivePracticeType].autoAdvance
          ? () => {} // Empty function if auto-advance
          : handleGameNext;

        return (
          <WriteByDefinitionGame
            {...baseGameProps}
            onAnswer={handleGameAnswer}
            onAudioPlay={handleAudioPlay}
            showVirtualKeyboard={session.settings?.showHints ?? false}
            onNext={nextFn}
          />
        );
      }

      case 'write-by-sound': {
        const nextFn = practiceConfigs[effectivePracticeType].autoAdvance
          ? () => {} // Empty function if auto-advance
          : handleGameNext;

        return (
          <WriteBySoundGame
            {...baseGameProps}
            onAnswer={handleGameAnswer}
            onAudioPlay={handleAudioPlay}
            maxReplays={3}
            onNext={nextFn}
          />
        );
      }

      default:
        setError(`Unknown practice type: ${effectivePracticeType}`);
        return null;
    }
  };

  const renderWordCard = () => {
    if (!currentWord || currentPhase !== 'word-card' || !showWordCard)
      return null;

    // Create a word object with required properties, ensuring no undefined values
    const wordCardProps = {
      wordText: currentWord.wordText,
      definition: currentWord.definition,
      oneWordTranslation: currentWord.oneWordTranslation || '',
      phonetic: currentWord.phonetic || '',
      partOfSpeech: currentWord.partOfSpeech || '',
      learningStatus: currentWord.learningStatus,
      audioUrl: currentWord.audioUrl || '',
      imageId: currentWord.imageId || 0,
      imageUrl: currentWord.imageUrl || '',
      imageDescription: currentWord.imageDescription || '',
    };

    return (
      <WordCard
        word={wordCardProps}
        onNext={handleWordCardNext}
        className="w-full"
      />
    );
  };

  const renderSessionSummary = () => {
    if (currentPhase !== 'summary') return null;

    const accuracy =
      (sessionProgress.correctAnswers /
        (sessionProgress.correctAnswers + sessionProgress.incorrectAnswers)) *
      100;
    const timeSpent = Math.round(
      (Date.now() - sessionProgress.timeStarted) / 1000 / 60,
    );

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
            <Trophy className="h-8 w-8" />
            Session Complete!
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {sessionProgress.correctAnswers}
              </div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {sessionProgress.incorrectAnswers}
              </div>
              <div className="text-sm text-red-700">Incorrect</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Accuracy</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {sessionProgress.currentScore}
              </div>
              <div className="text-sm text-purple-700">Score</div>
            </div>
          </div>

          <div className="pt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {timeSpent} minutes • {session.words.length} words •{' '}
              {session.practiceType}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!currentWord && currentPhase !== 'summary') {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No words available for practice.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Universal Progress Indicator */}
      {currentPhase !== 'summary' && (
        <UniversalProgressIndicator
          currentWordIndex={currentWordIndex}
          totalWords={session.words.length}
          practiceType={
            session.practiceType as
              | 'typing'
              | 'choose-right-word'
              | 'make-up-word'
              | 'remember-translation'
              | 'write-by-definition'
              | 'write-by-sound'
          }
          correctAnswers={sessionProgress.correctAnswers}
          incorrectAnswers={sessionProgress.incorrectAnswers}
          timeElapsed={Math.round(
            (Date.now() - sessionProgress.timeStarted) / 1000,
          )}
          difficultyLevel={session.difficultyLevel}
          sessionScore={sessionProgress.currentScore}
          className="max-w-4xl mx-auto"
        />
      )}

      {/* Session Controls */}
      {currentPhase !== 'summary' && onSessionPause && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onSessionPause}
            className="flex items-center gap-2"
          >
            <Pause className="h-3 w-3" />
            Pause Session
          </Button>
        </div>
      )}

      {/* Practice Game Container */}
      {currentPhase === 'game' && (
        <PracticeGameContainer className="max-w-4xl mx-auto">
          {renderPracticeGame()}
        </PracticeGameContainer>
      )}

      {/* Word Card */}
      {currentPhase === 'word-card' && renderWordCard()}

      {/* Session Summary */}
      {currentPhase === 'summary' && renderSessionSummary()}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 p-2 bg-black/80 text-white text-xs rounded">
          <div>Phase: {currentPhase}</div>
          <div>
            Word: {currentWordIndex + 1}/{session.words.length}
          </div>
          <div>Type: {session.practiceType}</div>
          <div>Score: {sessionProgress.currentScore}</div>
        </div>
      )}
    </div>
  );
}
