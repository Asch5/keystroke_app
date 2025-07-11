'use server';

import { PrismaClient } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { LearningStatus } from '@/core/types';
import {
  PRACTICE_SESSION_CONFIG,
  LearningMetricsCalculator,
} from '../utils/learning-metrics';

// Import and re-export utility functions from utils directory
import {
  validateWordInput,
  calculateAccuracy,
  levenshteinDistance,
  findWordDifferences,
  getMistakeType,
  validateMultipleChoice,
  validateWordConstruction,
  calculateResponseTimeBonus,
  WordComparisonResult,
} from '../utils/practice-validation-utils';
import { updateWordProgression, updateSRSData } from './practice-progression';
import { ValidateTypingRequest } from './practice-types';

// Re-export for other modules
export {
  validateWordInput,
  calculateAccuracy,
  levenshteinDistance,
  findWordDifferences,
  getMistakeType,
  validateMultipleChoice,
  validateWordConstruction,
  calculateResponseTimeBonus,
};

const prisma = new PrismaClient();

/**
 * Validation result interface
 */
export interface ValidationResult {
  isCorrect: boolean;
  accuracy: number;
  partialCredit: boolean;
  pointsEarned: number;
  feedback: string;
  updatedProgress?: {
    newLearningStatus: LearningStatus;
    newProgress: number;
    newMasteryScore: number;
  };
}

/**
 * Word comparison result interface
 */
// WordComparisonResult is imported from utils

/**
 * Validate typing input and update progress
 */
export async function validateTypingInput(
  request: ValidateTypingRequest,
): Promise<{
  success: boolean;
  result?: ValidationResult;
  error?: string;
}> {
  try {
    const { sessionId, userDictionaryId, userInput, responseTime } = request;

    // Get session and user word data
    const [session, userWord] = await Promise.all([
      prisma.userLearningSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
      }),
      prisma.userDictionary.findUnique({
        where: { id: userDictionaryId },
        include: {
          definition: {
            include: {
              wordDetails: {
                include: {
                  wordDetails: {
                    include: {
                      word: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!userWord) {
      return { success: false, error: 'User word not found' };
    }

    // Get the correct word text
    const correctWord =
      userWord.definition.wordDetails[0]?.wordDetails?.word?.word ?? '';

    if (!correctWord) {
      return { success: false, error: 'Correct word not found' };
    }

    // Validate the input
    const validationResult = validateWordInput(userInput, correctWord);

    // Calculate points earned
    let pointsEarned = 0;
    if (validationResult.isCorrect) {
      pointsEarned = PRACTICE_SESSION_CONFIG.POINTS_PER_CORRECT_ANSWER;
      // Speed bonus
      if (
        responseTime <=
        PRACTICE_SESSION_CONFIG.SPEED_BONUS_THRESHOLD * 1000
      ) {
        pointsEarned += PRACTICE_SESSION_CONFIG.BONUS_POINTS_FOR_SPEED;
      }
    } else if (validationResult.partialCredit) {
      pointsEarned = Math.round(
        PRACTICE_SESSION_CONFIG.POINTS_PER_CORRECT_ANSWER * 0.5,
      );
    } else {
      pointsEarned = -PRACTICE_SESSION_CONFIG.POINTS_PENALTY_PER_WRONG_ATTEMPT;
    }

    // Update user dictionary progress
    const newReviewCount = (userWord.reviewCount ?? 0) + 1;
    const newCorrectStreak = validationResult.isCorrect
      ? (userWord.correctStreak ?? 0) + 1
      : 0;

    // Calculate new learning metrics
    const accuracy = validationResult.accuracy;
    const newMasteryScore = LearningMetricsCalculator.calculateMasteryScore(
      accuracy,
      newCorrectStreak,
      responseTime / 1000,
      newReviewCount,
    );
    const newLearningStatus = LearningMetricsCalculator.determineLearningStatus(
      newCorrectStreak,
      newReviewCount,
      newCorrectStreak,
      newMasteryScore,
    );

    // Update word progression using progressive learning system
    const progressionResult = await updateWordProgression(
      userDictionaryId,
      validationResult.isCorrect,
    );

    // 🔥 NEW: Update SRS (Spaced Repetition System) data
    const srsResult = await updateSRSData(
      userDictionaryId,
      validationResult.isCorrect,
    );

    if (!srsResult.success) {
      void serverLog('Failed to update SRS data', 'warn', {
        userDictionaryId,
        error: srsResult.error,
      });
    } else {
      void serverLog('SRS data updated successfully', 'info', {
        userDictionaryId,
        srsData: srsResult.srsData,
      });
    }

    // Update user dictionary entry with standard learning metrics
    const updatedUserWord = await prisma.userDictionary.update({
      where: { id: userDictionaryId },
      data: {
        reviewCount: newReviewCount,
        correctStreak: newCorrectStreak,
        lastReviewedAt: new Date(),
        // Keep existing timestamps
        ...(newLearningStatus === LearningStatus.learned &&
          !userWord.timeWordWasLearned && {
            timeWordWasLearned: new Date(),
          }),
        ...(newLearningStatus === LearningStatus.inProgress &&
          !userWord.timeWordWasStartedToLearn && {
            timeWordWasStartedToLearn: new Date(),
          }),
      },
    });

    // Use progressive learning results if successful, otherwise fall back to standard metrics
    const finalLearningStatus = progressionResult.success
      ? progressionResult.progression?.newLearningStatus || newLearningStatus
      : newLearningStatus;
    const finalMasteryScore = progressionResult.success
      ? (
          await prisma.userDictionary.findUnique({
            where: { id: userDictionaryId },
            select: { masteryScore: true },
          })
        )?.masteryScore || newMasteryScore
      : newMasteryScore;

    // Create session item record
    await prisma.userSessionItem.create({
      data: {
        sessionId,
        userDictionaryId,
        isCorrect: validationResult.isCorrect,
        responseTime: responseTime,
        attemptsCount: 1,
      },
    });

    // 🔥 NEW: Create LearningMistake record for incorrect answers
    if (!validationResult.isCorrect) {
      await prisma.learningMistake.create({
        data: {
          userId: session.userId,
          wordId: 0, // Placeholder - would need word lookup
          definitionId: userWord.definitionId,
          userDictionaryId,
          type: 'spelling', // Could be enhanced based on exercise type
          incorrectValue: request.userInput,
          context: JSON.stringify({
            exerciseType: 'typing',
            correctAnswer: correctWord,
            accuracy: validationResult.accuracy,
            responseTime: responseTime,
            sessionId,
          }),
          mistakeData: {
            exerciseType: 'typing',
            userInput: request.userInput,
            correctAnswer: correctWord,
            accuracy: validationResult.accuracy,
            responseTime: responseTime,
            attempts: newReviewCount,
          },
        },
      });

      // Update mistake count in UserDictionary
      await prisma.userDictionary.update({
        where: { id: userDictionaryId },
        data: {
          amountOfMistakes: { increment: 1 },
        },
      });
    }

    // 🔥 NEW: Update daily progress tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId: session.userId,
        date: today,
      },
    });

    if (existingProgress) {
      await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          minutesStudied: {
            increment: Math.round(responseTime / 60000), // Convert ms to minutes
          },
          ...(validationResult.isCorrect &&
            finalLearningStatus === LearningStatus.learned && {
              wordsLearned: { increment: 1 },
            }),
        },
      });
    } else {
      await prisma.userProgress.create({
        data: {
          userId: session.userId,
          date: today,
          minutesStudied: Math.round(responseTime / 60000),
          wordsLearned:
            validationResult.isCorrect &&
            finalLearningStatus === LearningStatus.learned
              ? 1
              : 0,
          streakDays: 1, // Calculate proper streak later
        },
      });
    }

    // Update session counters
    await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: {
        wordsStudied: { increment: 1 },
        ...(validationResult.isCorrect && {
          correctAnswers: { increment: 1 },
          ...(newLearningStatus === LearningStatus.learned && {
            wordsLearned: { increment: 1 },
          }),
        }),
        ...(!validationResult.isCorrect && {
          incorrectAnswers: { increment: 1 },
        }),
      },
    });

    // Generate feedback message
    let feedback = '';
    if (validationResult.isCorrect) {
      if (
        responseTime <=
        PRACTICE_SESSION_CONFIG.SPEED_BONUS_THRESHOLD * 1000
      ) {
        feedback = '🎉 Perfect! Great speed!';
      } else {
        feedback = '✅ Correct!';
      }
    } else if (validationResult.partialCredit) {
      feedback = `⚠️ Close! (${validationResult.accuracy}% accuracy)`;
    } else {
      feedback = `❌ Incorrect. The correct spelling is: "${correctWord}"`;
    }

    revalidateTag(`user-dictionary-${session.userId}`);
    revalidateTag(`user-sessions-${session.userId}`);

    return {
      success: true,
      result: {
        isCorrect: validationResult.isCorrect,
        accuracy: validationResult.accuracy,
        partialCredit: validationResult.partialCredit,
        pointsEarned,
        feedback,
        updatedProgress: {
          newLearningStatus: finalLearningStatus,
          newProgress: updatedUserWord.progress,
          newMasteryScore: finalMasteryScore,
        },
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    void serverLog(
      `Failed to validate typing input: ${errorMessage}`,
      'error',
      {
        sessionId: request.sessionId,
        error,
      },
    );

    return {
      success: false,
      error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
    };
  }
}
// Re-export the interface for compatibility
export type { WordComparisonResult };
