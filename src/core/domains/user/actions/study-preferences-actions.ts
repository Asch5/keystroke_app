'use server';

import { auth } from '@/auth';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/shared/database/client';

export interface TypingPracticePreferences {
  autoSubmitAfterCorrect: boolean;
  showDefinitionImages: boolean;
  wordsCount: number;
  difficultyLevel: number;
  enableTimeLimit: boolean;
  timeLimitSeconds: number;
  playAudioOnStart: boolean;
  showProgressBar: boolean;
  enableGameSounds: boolean;
  gameSoundVolume: number;
  enableKeystrokeSounds: boolean;
}

const DEFAULT_TYPING_PREFERENCES: TypingPracticePreferences = {
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

interface StudyPreferences extends Record<string, unknown> {
  typingPractice?: TypingPracticePreferences;
  flashcards?: Record<string, unknown>; // For future flashcard settings
  quiz?: Record<string, unknown>; // For future quiz settings
  general?: Record<string, unknown>; // For general study settings
}

/**
 * Get user's typing practice preferences from database
 */
export async function getTypingPracticePreferences(): Promise<{
  success: boolean;
  preferences?: TypingPracticePreferences;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    void serverLog('Fetching typing practice preferences', 'info', {
      userId: session.user.id,
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { studyPreferences: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const studyPrefs = user.studyPreferences as Record<string, unknown>;
    const typingPrefs =
      (studyPrefs?.typingPractice as TypingPracticePreferences) ||
      DEFAULT_TYPING_PREFERENCES;

    // Ensure all default fields exist (for backwards compatibility)
    const mergedPreferences = { ...DEFAULT_TYPING_PREFERENCES, ...typingPrefs };

    void serverLog('Retrieved typing practice preferences', 'info', {
      userId: session.user.id,
      hasCustomPreferences: !!studyPrefs?.typingPractice,
    });

    return { success: true, preferences: mergedPreferences };
  } catch (error) {
    void serverLog('Error fetching typing practice preferences', 'error', {
      error,
    });
    return { success: false, error: 'Failed to fetch preferences' };
  }
}

/**
 * Update user's typing practice preferences in database
 */
export async function updateTypingPracticePreferences(
  preferences: Partial<TypingPracticePreferences>,
): Promise<{
  success: boolean;
  preferences?: TypingPracticePreferences;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    void serverLog('Updating typing practice preferences', 'info', {
      userId: session.user.id,
      updates: Object.keys(preferences),
    });

    // Get current study preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { studyPreferences: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const currentStudyPrefs =
      (user.studyPreferences as Record<string, unknown>) || {};
    const currentTypingPrefs =
      (currentStudyPrefs.typingPractice as TypingPracticePreferences) ||
      DEFAULT_TYPING_PREFERENCES;

    // Merge with new preferences
    const updatedTypingPrefs = { ...currentTypingPrefs, ...preferences };

    // Update the studyPreferences JSON field
    const updatedStudyPrefs = {
      ...currentStudyPrefs,
      typingPractice: updatedTypingPrefs,
    };

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        studyPreferences: JSON.parse(JSON.stringify(updatedStudyPrefs)),
      },
    });

    void serverLog('Successfully updated typing practice preferences', 'info', {
      userId: session.user.id,
      updatedFields: Object.keys(preferences),
    });

    return { success: true, preferences: updatedTypingPrefs };
  } catch (error) {
    void serverLog('Error updating typing practice preferences', 'error', {
      error,
    });
    return { success: false, error: 'Failed to update preferences' };
  }
}

/**
 * Reset typing practice preferences to defaults
 */
export async function resetTypingPracticePreferences(): Promise<{
  success: boolean;
  preferences?: TypingPracticePreferences;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    void serverLog(
      'Resetting typing practice preferences to defaults',
      'info',
      {
        userId: session.user.id,
      },
    );

    // Get current study preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { studyPreferences: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const currentStudyPrefs =
      (user.studyPreferences as Record<string, unknown>) || {};

    // Reset only typing practice preferences
    const updatedStudyPrefs = {
      ...currentStudyPrefs,
      typingPractice: DEFAULT_TYPING_PREFERENCES,
    };

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        studyPreferences: JSON.parse(JSON.stringify(updatedStudyPrefs)),
      },
    });

    void serverLog('Successfully reset typing practice preferences', 'info', {
      userId: session.user.id,
    });

    return { success: true, preferences: DEFAULT_TYPING_PREFERENCES };
  } catch (error) {
    void serverLog('Error resetting typing practice preferences', 'error', {
      error,
    });
    return { success: false, error: 'Failed to reset preferences' };
  }
}

/**
 * Get all study preferences (for future expansion)
 */
export async function getAllStudyPreferences(): Promise<{
  success: boolean;
  preferences?: StudyPreferences;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { studyPreferences: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const studyPrefs = (user.studyPreferences as StudyPreferences) || {};

    return { success: true, preferences: studyPrefs };
  } catch (error) {
    void serverLog('Error fetching all study preferences', 'error', { error });
    return { success: false, error: 'Failed to fetch study preferences' };
  }
}
