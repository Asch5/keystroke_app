'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Pause } from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';

// Import modular components
import { UniversalProgressIndicator, PracticeGameContainer } from './shared';
import { PracticeGameRenderer } from './PracticeGameRenderer';
import { PracticeSessionSummary } from './PracticeSessionSummary';
import { PracticeWordCardRenderer } from './PracticeWordCardRenderer';

// Import custom hook
import { usePracticeGameState } from './hooks';

// Import types
import type {
  PracticeType,
  EnhancedPracticeSession,
} from '@/core/domains/user/actions/practice-actions';

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

/**
 * Enhanced Practice Content Orchestrator
 * Manages the flow between different practice types and WordCard reviews
 * Refactored to use modular components for better maintainability
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
  const {
    currentPhase,
    showWordCard,
    currentWordIndex,
    sessionProgress,
    error,
    practiceConfigs,
    currentWord,
    handleGameAnswer,
    handleWordCardNext,
    handleGameNext,
  } = usePracticeGameState({
    session,
    onWordComplete,
    onSessionComplete,
    onWordCardNext,
  });

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No words available
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
      {currentPhase === 'game' && currentWord && practiceConfigs && (
        <PracticeGameContainer className="max-w-4xl mx-auto">
          <PracticeGameRenderer
            session={session}
            currentWord={currentWord}
            practiceConfigs={practiceConfigs}
            onGameAnswer={handleGameAnswer}
            onGameNext={handleGameNext}
            {...(onAudioPlay && { onAudioPlay })}
          />
        </PracticeGameContainer>
      )}

      {/* Word Card */}
      {currentPhase === 'word-card' && showWordCard && currentWord && (
        <PracticeWordCardRenderer
          currentWord={currentWord}
          onNext={handleWordCardNext}
        />
      )}

      {/* Session Summary */}
      {currentPhase === 'summary' && (
        <PracticeSessionSummary
          session={session}
          sessionProgress={sessionProgress}
        />
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 p-2 bg-black/80 text-white text-xs rounded">
          <div>Phase: {currentPhase}</div>
          <div>
            Word: {currentWordIndex + 1}/{session.words.length}
          </div>
          <div>Type: {session.practiceType}</div>
          {currentWord && <div>Current: {currentWord.wordText}</div>}
        </div>
      )}
    </div>
  );
}
