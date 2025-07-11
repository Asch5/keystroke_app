'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  infoLog,
  errorLog,
  warnLog,
} from '@/core/infrastructure/monitoring/clientLogger';
import { useTypingPracticeSettings } from '@/core/shared/hooks/useSettings';
import { useUser } from '@/core/shared/hooks/useUser';
import { LearningStatus } from '@/core/types';
import {
  useTypingPracticeState,
  useTypingAudioPlayback,
  type WordResult,
} from './hooks';
import { TypingGettingStarted } from './TypingGettingStarted';
import { TypingPracticeHeader } from './TypingPracticeHeader';
import { TypingPracticeSettings } from './TypingPracticeSettings';
import { TypingSessionSummary } from './TypingSessionSummary';
import { TypingWordInput } from './TypingWordInput';

interface TypingPracticeContentProps {
  userListId?: string;
  listId?: string;
  difficultyLevel?: number;
  wordsCount?: number;
  includeWordStatuses?: (keyof typeof LearningStatus)[];
}

/**
 * Main typing practice component
 * Orchestrates the typing practice experience using modular components
 */
export function TypingPracticeContent({
  userListId,
  listId,
  difficultyLevel: urlDifficultyLevel,
  wordsCount: urlWordsCount,
  includeWordStatuses = [
    LearningStatus.notStarted,
    LearningStatus.inProgress,
    LearningStatus.difficult,
  ],
}: TypingPracticeContentProps) {
  const { user } = useUser();

  // Use custom hooks for state management, audio, and settings
  const { settings } = useTypingPracticeSettings();

  // Use settings values with URL parameters as fallback
  const effectiveDifficultyLevel =
    (settings.difficultyLevel || urlDifficultyLevel) ?? 3;
  const effectiveWordsCount = (settings.wordsCount || urlWordsCount) ?? 10;

  const {
    sessionState,
    isLoading,
    wordResults,
    showResult,
    progressPercentage,
    startPracticeSession,
    handleWordSubmit,
    handleInputChange,
    handleNextWord,
    handleSkipWord,
    finishPracticeEarly,
  } = useTypingPracticeState({
    userListId,
    listId,
    difficultyLevel: effectiveDifficultyLevel,
    wordsCount: effectiveWordsCount,
    includeWordStatuses,
    autoSubmitAfterCorrect: settings.autoSubmitAfterCorrect,
  });

  const { isPlayingAudio, playWordAudio } = useTypingAudioPlayback();

  /**
   * Enhanced word submit handler that includes automatic audio playback
   */
  const handleWordSubmitWithAudio = async (inputValue?: string) => {
    await infoLog('Word submitted, processing result');
    const result = await handleWordSubmit(inputValue);

    if (result && sessionState.currentWord) {
      await infoLog('Word result received', {
        isCorrect: result.isCorrect,
        word: sessionState.currentWord.wordText,
        hasAudio: !!sessionState.currentWord.audioUrl,
      });

      // Always play audio for the word automatically after submission
      try {
        await playWordAudio(
          sessionState.currentWord.wordText,
          sessionState.currentWord.audioUrl,
          result.isCorrect,
        );
      } catch (error) {
        await errorLog(
          'Error playing audio after word submission',
          error instanceof Error ? error.message : String(error),
        );
      }
    } else {
      await warnLog('No result or current word available for audio playback');
    }
  };

  /**
   * Enhanced skip handler that includes automatic audio playback
   */
  const handleSkipWithAudio = async (): Promise<WordResult | undefined> => {
    await infoLog('Word skipped, processing');
    const result = await handleSkipWord();

    if (result && sessionState.currentWord) {
      await infoLog('Skip result for word', {
        word: sessionState.currentWord.wordText,
        hasAudio: !!sessionState.currentWord.audioUrl,
      });

      // Always play audio for the correct word when skipped
      try {
        await playWordAudio(
          sessionState.currentWord.wordText,
          sessionState.currentWord.audioUrl,
          false, // skipped = incorrect
        );
      } catch (error) {
        await errorLog(
          'Error playing audio after word skip',
          error instanceof Error ? error.message : String(error),
        );
      }
    } else {
      await warnLog(
        'No result or current word available for skip audio playback',
      );
    }

    return result;
  };

  // Early return for unauthenticated users
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please log in to access typing practice.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <TypingPracticeHeader
        sessionState={sessionState}
        isLoading={isLoading}
        progressPercentage={progressPercentage}
        onStartPractice={startPracticeSession}
      />

      {/* Practice Settings */}
      {!sessionState.isActive && <TypingPracticeSettings />}

      {/* Current Word Practice */}
      {sessionState.isActive && sessionState.currentWord && (
        <TypingWordInput
          sessionState={sessionState}
          showResult={showResult}
          wordResults={wordResults}
          isPlayingAudio={isPlayingAudio}
          settings={settings}
          onInputChange={handleInputChange}
          onWordSubmit={handleWordSubmitWithAudio}
          onSkipWord={handleSkipWithAudio}
          onNextWord={handleNextWord}
          onPlayAudio={playWordAudio}
          onFinishPractice={finishPracticeEarly}
        />
      )}

      {/* Session Summary */}
      <TypingSessionSummary
        sessionState={sessionState}
        wordResults={wordResults}
        onStartNewSession={startPracticeSession}
      />

      {/* Getting Started */}
      {!sessionState.isActive && wordResults.length === 0 && (
        <TypingGettingStarted />
      )}
    </div>
  );
}
