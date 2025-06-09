'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/core/shared/hooks/useUser';
import { LearningStatus } from '@prisma/client';
import { TypingPracticeHeader } from './TypingPracticeHeader';
import { TypingWordInput } from './TypingWordInput';
import { TypingSessionSummary } from './TypingSessionSummary';
import { TypingGettingStarted } from './TypingGettingStarted';
import {
  useTypingPracticeState,
  useTypingAudioPlayback,
  type WordResult,
} from './hooks';

interface TypingPracticeContentProps {
  userListId?: string;
  listId?: string;
  difficultyLevel?: number;
  wordsCount?: number;
  includeWordStatuses?: LearningStatus[];
}

/**
 * Main typing practice component
 * Orchestrates the typing practice experience using modular components
 */
export function TypingPracticeContent({
  userListId,
  listId,
  difficultyLevel = 3,
  wordsCount = 10,
  includeWordStatuses = [
    LearningStatus.notStarted,
    LearningStatus.inProgress,
    LearningStatus.difficult,
  ],
}: TypingPracticeContentProps) {
  const { user } = useUser();

  // Use custom hooks for state management and audio
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
  } = useTypingPracticeState({
    userListId,
    listId,
    difficultyLevel,
    wordsCount,
    includeWordStatuses,
  });

  const { isPlayingAudio, playWordAudio } = useTypingAudioPlayback();

  /**
   * Enhanced word submit handler that includes automatic audio playback
   */
  const handleWordSubmitWithAudio = async (inputValue?: string) => {
    console.log('🎯 Word submitted, processing result...');
    const result = await handleWordSubmit(inputValue);

    if (result && sessionState.currentWord) {
      console.log('📊 Word result received:', {
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
        console.error('❌ Error playing audio after word submission:', error);
      }
    } else {
      console.warn('⚠️ No result or current word available for audio playback');
    }
  };

  /**
   * Enhanced skip handler that includes automatic audio playback
   */
  const handleSkipWithAudio = async (): Promise<WordResult | undefined> => {
    console.log('⏭️ Word skipped, processing...');
    const result = await handleSkipWord();

    if (result && sessionState.currentWord) {
      console.log('📊 Skip result for word:', {
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
        console.error('❌ Error playing audio after word skip:', error);
      }
    } else {
      console.warn(
        '⚠️ No result or current word available for skip audio playback',
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

      {/* Current Word Practice */}
      {sessionState.isActive && sessionState.currentWord && (
        <TypingWordInput
          sessionState={sessionState}
          showResult={showResult}
          wordResults={wordResults}
          isPlayingAudio={isPlayingAudio}
          onInputChange={handleInputChange}
          onWordSubmit={handleWordSubmitWithAudio}
          onSkipWord={handleSkipWithAudio}
          onNextWord={handleNextWord}
          onPlayAudio={playWordAudio}
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
