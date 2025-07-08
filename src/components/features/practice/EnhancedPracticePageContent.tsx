'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useUser } from '@/core/shared/hooks/useUser';
import { EnhancedPracticeContent } from './EnhancedPracticeContent';
import { useVocabularyPracticeSettings } from '@/core/shared/hooks/useSettings';
import {
  createEnhancedPracticeSession,
  PracticeType,
  EnhancedPracticeSession,
  CreatePracticeSessionRequest,
} from '@/core/domains/user/actions/practice-actions';
import { createUnifiedPracticeSession } from '@/core/domains/user/actions/practice-unified';
import { createVocabularyPracticeSession } from '@/core/domains/user/actions/vocabulary-practice-actions';
import { UnifiedPracticeSession } from '@/core/domains/user/actions/practice-types';
import { LanguageCode, LearningStatus } from '@/core/types';
import PracticeDebugger from '@/core/infrastructure/monitoring/practiceDebugger';
import '@/core/infrastructure/monitoring/debugConsole'; // Initialize debug console

/**
 * Convert practice mode to learning statuses
 */
function getPracticeModeStatuses(mode: string | null): LearningStatus[] {
  switch (mode) {
    case 'learn-new':
      return [LearningStatus.notStarted];
    case 'continue-learning':
      return [LearningStatus.inProgress, LearningStatus.difficult];
    case 'refresh-vocabulary':
      return [LearningStatus.needsReview, LearningStatus.learned];
    case 'mix-mode':
      return [
        LearningStatus.notStarted,
        LearningStatus.inProgress,
        LearningStatus.difficult,
        LearningStatus.needsReview,
        LearningStatus.learned,
      ];
    default:
      // Default to mix mode if no mode specified
      return [
        LearningStatus.notStarted,
        LearningStatus.inProgress,
        LearningStatus.difficult,
        LearningStatus.needsReview,
        LearningStatus.learned,
      ];
  }
}

/**
 * Enhanced Practice Page Content Component
 * Handles unified practice system with automatic exercise type selection
 */
export function EnhancedPracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { settings, isLoaded: settingsLoaded } =
    useVocabularyPracticeSettings();

  const [session, setSession] = useState<
    EnhancedPracticeSession | UnifiedPracticeSession | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Get parameters from URL
  const practiceType = searchParams.get('type') as PracticeType;
  const practiceMode = searchParams.get('mode');
  const userListId = searchParams.get('userListId');
  const listId = searchParams.get('listId');

  // Debug logging for settings
  useEffect(() => {
    console.log('🔧 Settings Loading Debug:', {
      settingsLoaded,
      hasSettings: !!settings,
      settingsKeys: settings ? Object.keys(settings) : [],
    });

    if (settingsLoaded) {
      console.log('🔧 Vocabulary Practice Settings Debug:', {
        autoPlayAudioOnWordCard: settings.autoPlayAudioOnWordCard,
        showDefinitionImages: settings.showDefinitionImages,
        showPhoneticPronunciation: settings.showPhoneticPronunciation,
        showPartOfSpeech: settings.showPartOfSpeech,
        enableGameSounds: settings.enableGameSounds,
        gameSoundVolume: settings.gameSoundVolume,
        showProgressBar: settings.showProgressBar,
        allSettings: settings,
      });
    } else {
      console.log(
        '⚠️ Settings not loaded yet, using defaults or undefined values',
      );
    }
  }, [settings, settingsLoaded]);

  /**
   * Determine practice type for unified system
   * This is where the word progression algorithm will be implemented
   */
  const determineUnifiedPracticeType = (): PracticeType => {
    // Return unified practice type to enable the unified system
    return 'unified-practice';
  };

  const initializePracticeSession = useCallback(async () => {
    if (!user || !settingsLoaded) return;

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

      // Get learning statuses based on practice mode
      const practiceModeStatuses = getPracticeModeStatuses(practiceMode);

      console.log('🎯 Practice Session Creation Debug:', {
        sessionPracticeType,
        practiceMode,
        practiceModeStatuses,
        enabledExerciseTypes,
        difficultyLevel: settings.difficultyLevel,
        wordsCount: settings.wordsCount,
        autoPlayAudio: settings.autoPlayAudioOnWordCard,
        showImages: settings.showDefinitionImages,
      });

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

      // Use vocabulary practice system if practice mode is specified, otherwise use unified practice
      const result =
        sessionPracticeType === 'unified-practice'
          ? practiceMode
            ? await createVocabularyPracticeSession(
                request.userId,
                {
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
                },
                practiceMode,
              )
            : await createUnifiedPracticeSession(request.userId, {
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

      const sessionDebugData = {
        success: result.success,
        hasSession: !!result.session,
        ...(result.session?.words?.length !== undefined && {
          sessionWordsCount: result.session.words.length,
        }),
        ...(result.session?.words?.[0] && {
          firstWordData: {
            wordText: result.session.words[0].wordText,
            hasAudio: !!result.session.words[0].audioUrl,
            hasImage: !!(
              result.session.words[0].imageId ||
              result.session.words[0].imageUrl
            ),
            definition: result.session.words[0].definition,
          },
        }),
      };

      console.log('📋 Practice Session Result:', sessionDebugData);

      if (result.success && result.session) {
        setSession(result.session);

        // Initialize debugging session
        await PracticeDebugger.initializeSession({
          sessionType: sessionPracticeType,
          practiceMode,
          practiceModeStatuses: getPracticeModeStatuses(practiceMode),
          enabledExerciseTypes,
          settings: {
            difficultyLevel: settings.difficultyLevel,
            wordsCount: settings.wordsCount,
            autoPlayAudio: settings.autoPlayAudioOnWordCard,
            showImages: settings.showDefinitionImages,
          },
          sessionResult: sessionDebugData,
        }).catch((error) =>
          console.error('Failed to initialize debug session:', error),
        );
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
  }, [
    user,
    practiceType,
    practiceMode,
    userListId,
    listId,
    settings,
    settingsLoaded,
  ]);

  // Initialize session on component mount
  useEffect(() => {
    if (user && settingsLoaded) {
      initializePracticeSession();
    }
  }, [user, initializePracticeSession, settingsLoaded]);

  const handleWordComplete = (
    userDictionaryId: string,
    userInput: string,
    isCorrect: boolean,
    attempts: number,
    practiceType: PracticeType,
  ) => {
    // TODO: Implement word completion logic
    // This will include updating learning progress and determining next exercise type
    console.log('Word completed:', {
      userDictionaryId,
      userInput,
      isCorrect,
      attempts,
      practiceType,
    });

    // Log to organized debugging system
    PracticeDebugger.logWordCompletion({
      userDictionaryId,
      userInput,
      isCorrect,
      attempts,
      practiceType,
    }).catch((error) => console.error('Failed to log word completion:', error));
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

  if (!settingsLoaded || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {!settingsLoaded
            ? 'Loading settings...'
            : 'Creating practice session...'}
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
