'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useUser } from '@/core/shared/hooks/useUser';
import { EnhancedPracticeContent } from './EnhancedPracticeContent';
import { useVocabularyPracticeSettings } from './hooks/useVocabularyPracticeSettings';
import {
  createEnhancedPracticeSession,
  PracticeType,
  EnhancedPracticeSession,
  CreatePracticeSessionRequest,
} from '@/core/domains/user/actions/practice-actions';
import { createUnifiedPracticeSession } from '@/core/domains/user/actions/practice-unified';
import { UnifiedPracticeSession } from '@/core/domains/user/actions/practice-types';
import { LanguageCode } from '@/core/types';

/**
 * Enhanced Practice Page Content Component
 * Handles unified practice system with automatic exercise type selection
 */
export function EnhancedPracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { settings } = useVocabularyPracticeSettings();

  const [session, setSession] = useState<
    EnhancedPracticeSession | UnifiedPracticeSession | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Get parameters from URL
  const practiceType = searchParams.get('type') as PracticeType;
  const userListId = searchParams.get('userListId');
  const listId = searchParams.get('listId');

  /**
   * Determine practice type for unified system
   * This is where the word progression algorithm will be implemented
   */
  const determineUnifiedPracticeType = (): PracticeType => {
    // Return unified practice type to enable the unified system
    return 'unified-practice';
  };

  const initializePracticeSession = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Determine practice type for unified system
      const sessionPracticeType =
        practiceType || determineUnifiedPracticeType();

      // Extract enabled exercise types from settings
      const enabledExerciseTypes = [];
      if (settings.enableRememberTranslation)
        enabledExerciseTypes.push('remember-translation');
      if (settings.enableChooseRightWord)
        enabledExerciseTypes.push('choose-right-word');
      if (settings.enableMakeUpWord) enabledExerciseTypes.push('make-up-word');
      if (settings.enableWriteByDefinition)
        enabledExerciseTypes.push('write-by-definition');
      if (settings.enableWriteBySound)
        enabledExerciseTypes.push('write-by-sound');

      const baseRequest: CreatePracticeSessionRequest & {
        practiceType: PracticeType;
      } = {
        userId: user.id,
        userListId: userListId || null,
        listId: listId || null,
        difficultyLevel: settings.difficultyLevel,
        wordsCount: settings.wordsCount,
        practiceType: sessionPracticeType,
      };

      // Add enabled exercise types for unified practice
      const request =
        sessionPracticeType === 'unified-practice'
          ? { ...baseRequest, enabledExerciseTypes }
          : baseRequest;

      // Use unified practice system if no specific type provided
      const result =
        sessionPracticeType === 'unified-practice'
          ? await createUnifiedPracticeSession(request.userId, {
              practiceType: request.practiceType,
              wordsToStudy: request.wordsCount || 20,
              difficulty: request.difficultyLevel,
              targetLanguageCode: 'da' as LanguageCode,
              timeLimit: undefined,
              listId: request.listId || undefined,
              userListId: request.userListId || undefined,
              settings: {
                autoPlayAudio: settings.autoPlayAudioOnWordCard,
                enableGameSounds: settings.enableGameSounds,
                showHints: true,
                allowSkipping: true,
              },
              enabledExerciseTypes,
            })
          : await createEnhancedPracticeSession(request);

      if (result.success && result.session) {
        setSession(result.session);
      } else {
        throw new Error(result.error || 'Failed to create practice session');
      }
    } catch (err) {
      console.error('Failed to initialize practice session:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize practice session',
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, practiceType, userListId, listId, settings]);

  // Initialize session on component mount
  useEffect(() => {
    if (user) {
      initializePracticeSession();
    }
  }, [user, initializePracticeSession]);

  const handleWordComplete = (
    wordId: string,
    userInput: string,
    isCorrect: boolean,
    attempts: number,
    practiceType: PracticeType,
  ) => {
    // TODO: Implement word completion logic
    // This will include updating learning progress and determining next exercise type
    console.log('Word completed:', {
      wordId,
      userInput,
      isCorrect,
      attempts,
      practiceType,
    });
  };

  const handleSessionComplete = () => {
    // TODO: Implement session completion logic
    router.push('/dashboard/practice');
  };

  const handleWordCardNext = () => {
    if (session && currentWordIndex < session.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  const handleBackToOverview = () => {
    router.push('/dashboard/practice');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Creating practice session...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button
            onClick={handleBackToOverview}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Practice Overview
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No practice session available.</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button
            onClick={handleBackToOverview}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Practice Overview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vocabulary Practice</h1>
          <p className="text-muted-foreground">
            Adaptive practice with automatic exercise type selection
          </p>
        </div>
        <Button
          onClick={handleBackToOverview}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Button>
      </div>

      {/* Practice Content */}
      <EnhancedPracticeContent
        session={session as EnhancedPracticeSession}
        settings={settings}
        onWordComplete={handleWordComplete}
        onSessionComplete={handleSessionComplete}
        onWordCardNext={handleWordCardNext}
        className="space-y-8"
      />
    </div>
  );
}
