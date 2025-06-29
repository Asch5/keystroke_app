'use server';

import { prisma } from '@/core/shared/database/client';
import { auth } from '@/auth';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { transformDatabaseSettingsToState } from '@/core/domains/user/utils/settings-transformation';
import type { InputJsonValue } from '@prisma/client/runtime/library';

// =============================================
// SETTINGS SYNCHRONIZATION SERVER ACTIONS
// =============================================

// Type definitions for settings data - using Record for Prisma JSON compatibility
type DatabaseSettings = Record<string, unknown>;
type DatabaseStudyPreferences = Record<string, unknown>;

interface SettingsSyncData {
  userId: string;
  settings: DatabaseSettings;
  studyPreferences: DatabaseStudyPreferences;
}

interface SettingsImportData {
  settings: DatabaseSettings;
  studyPreferences: DatabaseStudyPreferences;
  userSettings?: Record<string, unknown>;
}

/**
 * Load user settings from database
 */
export async function loadUserSettings(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: 'User not authenticated',
        data: null,
      };
    }

    // Load user with settings and study preferences
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        settings: true,
        studyPreferences: true,
        userSettings: {
          select: {
            dailyGoal: true,
            notificationsEnabled: true,
            soundEnabled: true,
            autoPlayAudio: true,
            darkMode: true,
            sessionDuration: true,
            reviewInterval: true,
            difficultyPreference: true,
            learningReminders: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        data: null,
      };
    }

    // Parse JSON settings with fallbacks
    const settings = (user.settings as DatabaseSettings) || {};
    const studyPreferences =
      (user.studyPreferences as DatabaseStudyPreferences) || {};

    // Use transformation utility for type-safe conversion
    const combinedSettings = transformDatabaseSettingsToState(
      settings,
      studyPreferences,
      user.userSettings
        ? {
            dailyGoal: user.userSettings.dailyGoal,
            notificationsEnabled: user.userSettings.notificationsEnabled,
            soundEnabled: user.userSettings.soundEnabled,
            autoPlayAudio: user.userSettings.autoPlayAudio,
            darkMode: user.userSettings.darkMode,
            sessionDuration: user.userSettings.sessionDuration,
            reviewInterval: user.userSettings.reviewInterval,
            difficultyPreference: user.userSettings.difficultyPreference,
            learningReminders: user.userSettings.learningReminders as Record<
              string,
              unknown
            >,
          }
        : undefined,
    );

    await serverLog('Settings loaded successfully', 'info', {
      userId: targetUserId,
      hasCustomSettings: Object.keys(settings).length > 0,
      hasStudyPreferences: Object.keys(studyPreferences).length > 0,
    });

    return {
      success: true,
      error: null,
      data: combinedSettings,
    };
  } catch (error) {
    const { message, code } = handlePrismaError(error);

    await serverLog('Failed to load user settings', 'error', {
      error: message,
      code,
      userId,
    });

    return {
      success: false,
      error: message,
      data: null,
    };
  }
}

/**
 * Sync user settings to database
 */
export async function syncUserSettings(data: SettingsSyncData) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.id !== data.userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const { userId, settings, studyPreferences } = data;

    // Update User table with JSON settings (cast to satisfy Prisma types)
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: settings as InputJsonValue,
        studyPreferences: studyPreferences as InputJsonValue,
      },
    });

    // Also update UserSettings table if learning preferences are provided
    if (studyPreferences.learning) {
      const learningPrefs = studyPreferences.learning as Record<
        string,
        unknown
      >;

      await prisma.userSettings.upsert({
        where: { userId },
        update: Object.assign(
          {},
          typeof learningPrefs.dailyGoal === 'number' && {
            dailyGoal: learningPrefs.dailyGoal as number,
          },
          typeof learningPrefs.notificationsEnabled === 'boolean' && {
            notificationsEnabled: learningPrefs.notificationsEnabled as boolean,
          },
          typeof learningPrefs.soundEnabled === 'boolean' && {
            soundEnabled: learningPrefs.soundEnabled as boolean,
          },
          typeof learningPrefs.autoPlayAudio === 'boolean' && {
            autoPlayAudio: learningPrefs.autoPlayAudio as boolean,
          },
          typeof learningPrefs.darkMode === 'boolean' && {
            darkMode: learningPrefs.darkMode as boolean,
          },
          typeof learningPrefs.sessionDuration === 'number' && {
            sessionDuration: learningPrefs.sessionDuration as number,
          },
          typeof learningPrefs.reviewInterval === 'number' && {
            reviewInterval: learningPrefs.reviewInterval as number,
          },
          typeof learningPrefs.difficultyPreference === 'number' && {
            difficultyPreference: learningPrefs.difficultyPreference as number,
          },
          learningPrefs.learningReminders && {
            learningReminders:
              learningPrefs.learningReminders as InputJsonValue,
          },
        ),
        create: {
          userId,
          dailyGoal: (learningPrefs.dailyGoal as number) || 5,
          notificationsEnabled:
            (learningPrefs.notificationsEnabled as boolean) ?? true,
          soundEnabled: (learningPrefs.soundEnabled as boolean) ?? true,
          autoPlayAudio: (learningPrefs.autoPlayAudio as boolean) ?? true,
          darkMode: (learningPrefs.darkMode as boolean) ?? false,
          sessionDuration: (learningPrefs.sessionDuration as number) || 15,
          reviewInterval: (learningPrefs.reviewInterval as number) || 3,
          difficultyPreference:
            (learningPrefs.difficultyPreference as number) || 1,
          learningReminders: ((learningPrefs.learningReminders as Record<
            string,
            unknown
          >) || {}) as InputJsonValue,
        },
      });
    }

    await serverLog('Settings synchronized successfully', 'info', {
      userId,
      settingsKeys: Object.keys(settings),
      studyPreferencesKeys: Object.keys(studyPreferences),
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      error: null,
      data: {
        syncedAt: new Date().toISOString(),
        userId,
      },
    };
  } catch (error) {
    const { message, code } = handlePrismaError(error);

    await serverLog('Failed to sync user settings', 'error', {
      error: message,
      code,
      userId: data.userId,
    });

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Bulk export user settings for backup
 */
export async function exportUserSettingsData(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: 'User not authenticated',
        data: null,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        baseLanguageCode: true,
        targetLanguageCode: true,
        settings: true,
        studyPreferences: true,
        userSettings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        data: null,
      };
    }

    const exportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        baseLanguageCode: user.baseLanguageCode,
        targetLanguageCode: user.targetLanguageCode,
      },
      settings: user.settings,
      studyPreferences: user.studyPreferences,
      userSettings: user.userSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    await serverLog('Settings exported successfully', 'info', {
      userId: targetUserId,
      exportSize: JSON.stringify(exportData).length,
    });

    return {
      success: true,
      error: null,
      data: exportData,
    };
  } catch (error) {
    const { message, code } = handlePrismaError(error);

    await serverLog('Failed to export user settings', 'error', {
      error: message,
      code,
      userId,
    });

    return {
      success: false,
      error: message,
      data: null,
    };
  }
}

/**
 * Import user settings from backup
 */
export async function importUserSettingsData(data: SettingsImportData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const userId = session.user.id;

    // Import to User table JSON fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: data.settings as InputJsonValue,
        studyPreferences: data.studyPreferences as InputJsonValue,
      },
    });

    // Import to UserSettings table if provided
    if (data.userSettings) {
      await prisma.userSettings.upsert({
        where: { userId },
        update: data.userSettings,
        create: {
          userId,
          ...data.userSettings,
        },
      });
    }

    await serverLog('Settings imported successfully', 'info', {
      userId,
      settingsKeys: Object.keys(data.settings || {}),
      studyPreferencesKeys: Object.keys(data.studyPreferences || {}),
      hasUserSettings: !!data.userSettings,
    });

    return {
      success: true,
      error: null,
      data: {
        importedAt: new Date().toISOString(),
        userId,
      },
    };
  } catch (error) {
    const { message, code } = handlePrismaError(error);

    await serverLog('Failed to import user settings', 'error', {
      error: message,
      code,
    });

    return {
      success: false,
      error: message,
    };
  }
}
