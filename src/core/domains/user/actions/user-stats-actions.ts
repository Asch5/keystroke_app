'use server';

import { PrismaClient } from '@prisma/client';
import { cache } from 'react';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { LearningStatus, SessionType } from '@/core/types';

const prisma = new PrismaClient();

/**
 * Comprehensive user statistics interface
 */
export interface UserStatistics {
  learningProgress: {
    totalWords: number;
    wordsLearned: number;
    wordsInProgress: number;
    wordsNeedingReview: number;
    difficultWords: number;
    averageMasteryScore: number;
    currentStreak: number;
    longestStreak: number;
    progressPercentage: number;
  };
  sessionStatistics: {
    totalSessions: number;
    totalStudyTime: number; // in minutes
    averageSessionDuration: number; // in minutes
    totalWordsStudied: number;
    averageAccuracy: number;
    bestScore: number;
    recentSessionsCount: number; // sessions in last 7 days
    streakDays: number;
    lastSessionDate: Date | null;
  };
  mistakeAnalysis: {
    totalMistakes: number;
    mostCommonMistakeType: string;
    improvementRate: number; // percentage
    difficultWords: {
      wordText: string;
      mistakeCount: number;
      lastMistake: Date;
    }[];
  };
  achievements: {
    totalAchievements: number;
    recentAchievements: {
      name: string;
      description: string;
      unlockedAt: Date;
      points: number;
    }[];
    totalPoints: number;
  };
  dailyProgress: {
    dailyGoal: number;
    todayProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
    goalAchievementRate: number; // percentage of days goal was met in last 30 days
  };
  languageProgress: {
    baseLanguage: string;
    targetLanguage: string;
    proficiencyLevel:
      | 'beginner'
      | 'elementary'
      | 'intermediate'
      | 'advanced'
      | 'proficient';
    estimatedVocabularySize: number;
  };
}

/**
 * Get comprehensive user statistics
 */
export const getUserStatistics = cache(
  async (
    userId: string,
  ): Promise<{
    success: boolean;
    statistics?: UserStatistics;
    error?: string;
  }> => {
    try {
      void serverLog(
        `Fetching comprehensive statistics for user ${userId}`,
        'info',
        { userId },
      );

      const [
        userWithSettings,
        learningStats,
        sessionStats,
        mistakeStats,
        achievementStats,
        dailyStats,
      ] = await Promise.all([
        // User with settings
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            userSettings: true,
          },
        }),

        // Learning progress from UserDictionary
        prisma.userDictionary.aggregate({
          where: { userId },
          _count: {
            id: true,
          },
          _avg: {
            masteryScore: true,
            correctStreak: true,
          },
        }),

        // Session statistics
        prisma.userLearningSession.aggregate({
          where: { userId },
          _count: {
            id: true,
          },
          _sum: {
            duration: true,
            wordsStudied: true,
            correctAnswers: true,
            incorrectAnswers: true,
          },
          _avg: {
            score: true,
            duration: true,
          },
          _max: {
            score: true,
          },
        }),

        // Mistake analysis
        prisma.learningMistake.groupBy({
          by: ['type'],
          where: { userId },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 1,
        }),

        // Achievement statistics
        prisma.userAchievement.findMany({
          where: { userId },
          include: {
            achievement: true,
          },
          orderBy: {
            unlockedAt: 'desc',
          },
        }),

        // Daily progress from recent sessions
        prisma.userLearningSession.findMany({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          select: {
            createdAt: true,
            wordsStudied: true,
            duration: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

      if (!userWithSettings) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Get learning status breakdown
      const learningStatusBreakdown = await prisma.userDictionary.groupBy({
        by: ['learningStatus'],
        where: { userId },
        _count: {
          id: true,
        },
      });

      // Get streak information
      const streakInfo = await calculateStreak(userId);

      // Get most difficult words
      const difficultWords = await prisma.learningMistake.groupBy({
        by: ['wordId'],
        where: { userId },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      // Get word texts for difficult words
      const difficultWordTexts = await prisma.word.findMany({
        where: {
          id: {
            in: difficultWords.map((dw) => dw.wordId),
          },
        },
        select: {
          id: true,
          word: true,
        },
      });

      // Calculate daily progress
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayProgress = dailyStats
        .filter((session) => {
          const sessionDate = new Date(session.createdAt);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === today.getTime();
        })
        .reduce((sum, session) => sum + session.wordsStudied, 0);

      const weekProgress = dailyStats
        .filter((session) => {
          const sessionDate = new Date(session.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        })
        .reduce((sum, session) => sum + session.wordsStudied, 0);

      const monthProgress = dailyStats.reduce(
        (sum, session) => sum + session.wordsStudied,
        0,
      );

      // Build comprehensive statistics
      const statistics: UserStatistics = {
        learningProgress: {
          totalWords: learningStats._count.id,
          wordsLearned:
            learningStatusBreakdown.find(
              (s) => s.learningStatus === LearningStatus.learned,
            )?._count.id || 0,
          wordsInProgress:
            learningStatusBreakdown.find(
              (s) => s.learningStatus === LearningStatus.inProgress,
            )?._count.id || 0,
          wordsNeedingReview:
            learningStatusBreakdown.find(
              (s) => s.learningStatus === LearningStatus.needsReview,
            )?._count.id || 0,
          difficultWords:
            learningStatusBreakdown.find(
              (s) => s.learningStatus === LearningStatus.difficult,
            )?._count.id || 0,
          averageMasteryScore: learningStats._avg.masteryScore || 0,
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          progressPercentage:
            learningStats._count.id > 0
              ? ((learningStatusBreakdown.find(
                  (s) => s.learningStatus === LearningStatus.learned,
                )?._count.id || 0) /
                  learningStats._count.id) *
                100
              : 0,
        },
        sessionStatistics: {
          totalSessions: sessionStats._count.id,
          totalStudyTime: Math.round((sessionStats._sum.duration || 0) / 60),
          averageSessionDuration: Math.round(
            (sessionStats._avg.duration || 0) / 60,
          ),
          totalWordsStudied: sessionStats._sum.wordsStudied || 0,
          averageAccuracy:
            sessionStats._sum.correctAnswers &&
            sessionStats._sum.incorrectAnswers
              ? (sessionStats._sum.correctAnswers /
                  (sessionStats._sum.correctAnswers +
                    sessionStats._sum.incorrectAnswers)) *
                100
              : 0,
          bestScore: sessionStats._max.score || 0,
          recentSessionsCount: dailyStats.filter((session) => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(session.createdAt) >= weekAgo;
          }).length,
          streakDays: streakInfo.currentStreak,
          lastSessionDate: dailyStats[0]?.createdAt || null,
        },
        mistakeAnalysis: {
          totalMistakes: difficultWords.reduce(
            (sum, dw) => sum + dw._count.id,
            0,
          ),
          mostCommonMistakeType: mistakeStats[0]?.type || 'None',
          improvementRate: calculateImprovementRate(dailyStats),
          difficultWords: difficultWords.map((dw) => {
            const wordText = difficultWordTexts.find((w) => w.id === dw.wordId);
            return {
              wordText: wordText?.word || 'Unknown',
              mistakeCount: dw._count.id,
              lastMistake: new Date(), // This would need a separate query for exact date
            };
          }),
        },
        achievements: {
          totalAchievements: achievementStats.length,
          recentAchievements: achievementStats.slice(0, 5).map((ua) => ({
            name: ua.achievement.name,
            description: ua.achievement.description,
            unlockedAt: ua.unlockedAt,
            points: ua.achievement.points,
          })),
          totalPoints: achievementStats.reduce(
            (sum, ua) => sum + ua.achievement.points,
            0,
          ),
        },
        dailyProgress: {
          dailyGoal: userWithSettings.userSettings?.dailyGoal || 5,
          todayProgress,
          weeklyProgress: weekProgress,
          monthlyProgress: monthProgress,
          goalAchievementRate: calculateGoalAchievementRate(
            dailyStats,
            userWithSettings.userSettings?.dailyGoal || 5,
          ),
        },
        languageProgress: {
          baseLanguage: userWithSettings.baseLanguageCode,
          targetLanguage: userWithSettings.targetLanguageCode,
          proficiencyLevel: estimateProficiencyLevel(
            learningStats._count.id,
            learningStats._avg.masteryScore || 0,
          ),
          estimatedVocabularySize: learningStats._count.id,
        },
      };

      void serverLog(
        `Statistics fetched successfully for user ${userId}`,
        'info',
      );

      return {
        success: true,
        statistics,
      };
    } catch (error) {
      const errorMessage = handlePrismaError(error);
      const errorString =
        typeof errorMessage === 'string'
          ? errorMessage
          : errorMessage.message || 'Unknown error';
      void serverLog(
        `Failed to fetch user statistics: ${errorString}`,
        'error',
        {
          userId,
          error: errorString,
        },
      );

      return {
        success: false,
        error: errorString,
      };
    }
  },
);

/**
 * Calculate user's learning streak
 */
async function calculateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
}> {
  try {
    const sessions = await prisma.userLearningSession.findMany({
      where: { userId },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Group sessions by date
    const sessionsByDate = sessions.reduce(
      (acc, session) => {
        const date = new Date(session.createdAt);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];

        if (dateKey) {
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(session);
        }
        return acc;
      },
      {} as Record<string, typeof sessions>,
    );

    const uniqueDates = Object.keys(sessionsByDate)
      .filter((date) => date) // Filter out any undefined keys
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const dateString = uniqueDates[i];
      if (!dateString) continue;

      const sessionDate = new Date(dateString);
      const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        tempStreak++;
        if (i === 0 || currentStreak === i) {
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    return { currentStreak, longestStreak };
  } catch (error) {
    void serverLog(`Failed to calculate streak for user ${userId}`, 'error', {
      error,
    });
    return { currentStreak: 0, longestStreak: 0 };
  }
}

/**
 * Calculate improvement rate based on recent sessions
 */
function calculateImprovementRate(
  sessions: { createdAt: Date; wordsStudied: number }[],
): number {
  if (sessions.length < 5) return 0;

  const recent = sessions.slice(0, 5);
  const older = sessions.slice(5, 10);

  const recentAvg =
    recent.reduce((sum, s) => sum + s.wordsStudied, 0) / recent.length;
  const olderAvg =
    older.length > 0
      ? older.reduce((sum, s) => sum + s.wordsStudied, 0) / older.length
      : recentAvg;

  if (olderAvg === 0) return 0;

  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

/**
 * Calculate goal achievement rate for last 30 days
 */
function calculateGoalAchievementRate(
  sessions: { createdAt: Date; wordsStudied: number }[],
  dailyGoal: number,
): number {
  const dailyProgress = sessions.reduce(
    (acc, session) => {
      const date = new Date(session.createdAt);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];

      if (dateKey) {
        acc[dateKey] = (acc[dateKey] || 0) + session.wordsStudied;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const daysWithGoalMet = Object.values(dailyProgress).filter(
    (progress) => progress >= dailyGoal,
  ).length;
  const totalDays = Math.min(Object.keys(dailyProgress).length, 30);

  return totalDays > 0 ? (daysWithGoalMet / totalDays) * 100 : 0;
}

/**
 * Estimate proficiency level based on vocabulary size and mastery score
 */
function estimateProficiencyLevel(
  vocabularySize: number,
  averageMasteryScore: number,
): 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'proficient' {
  if (vocabularySize < 500 || averageMasteryScore < 30) return 'beginner';
  if (vocabularySize < 1500 || averageMasteryScore < 50) return 'elementary';
  if (vocabularySize < 3000 || averageMasteryScore < 70) return 'intermediate';
  if (vocabularySize < 5000 || averageMasteryScore < 85) return 'advanced';
  return 'proficient';
}

/**
 * Get learning analytics for charts and detailed analysis
 */
export const getLearningAnalytics = cache(
  async (
    userId: string,
    days: number = 30,
  ): Promise<{
    success: boolean;
    analytics?: {
      dailyProgress: { date: string; wordsStudied: number; accuracy: number }[];
      mistakesByType: { type: string; count: number }[];
      learningPatterns: {
        mostActiveHour: number;
        averageSessionLength: number;
        preferredSessionType: SessionType;
        weeklyDistribution: { day: string; sessions: number }[];
      };
      vocabularyGrowth: { date: string; totalWords: number }[];
    };
    error?: string;
  }> => {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [sessions, mistakes, userDictionaryHistory] = await Promise.all([
        prisma.userLearningSession.findMany({
          where: {
            userId,
            createdAt: { gte: startDate },
          },
          orderBy: { createdAt: 'asc' },
        }),

        prisma.learningMistake.groupBy({
          by: ['type'],
          where: {
            userId,
            createdAt: { gte: startDate },
          },
          _count: { id: true },
        }),

        prisma.userDictionary.findMany({
          where: {
            userId,
            createdAt: { gte: startDate },
          },
          select: {
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      // Calculate daily progress
      const dailyProgress = sessions.reduce(
        (acc, session) => {
          const date = session.createdAt.toISOString().split('T')[0];
          if (date) {
            if (!acc[date]) {
              acc[date] = {
                wordsStudied: 0,
                correctAnswers: 0,
                totalAnswers: 0,
              };
            }
            acc[date].wordsStudied += session.wordsStudied;
            acc[date].correctAnswers += session.correctAnswers;
            acc[date].totalAnswers +=
              session.correctAnswers + session.incorrectAnswers;
          }
          return acc;
        },
        {} as Record<
          string,
          { wordsStudied: number; correctAnswers: number; totalAnswers: number }
        >,
      );

      // Calculate vocabulary growth
      const vocabularyGrowth = userDictionaryHistory.reduce(
        (acc, entry) => {
          const date = entry.createdAt.toISOString().split('T')[0];
          if (date) {
            acc[date] = (acc[date] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      // Calculate cumulative vocabulary growth
      const cumulativeGrowth: { date: string; totalWords: number }[] = [];
      let runningTotal = 0;
      Object.keys(vocabularyGrowth)
        .sort()
        .forEach((date) => {
          const growth = vocabularyGrowth[date];
          if (growth !== undefined) {
            runningTotal += growth;
            cumulativeGrowth.push({ date, totalWords: runningTotal });
          }
        });

      const analytics = {
        dailyProgress: Object.entries(dailyProgress).map(([date, data]) => ({
          date,
          wordsStudied: data.wordsStudied,
          accuracy:
            data.totalAnswers > 0
              ? (data.correctAnswers / data.totalAnswers) * 100
              : 0,
        })),
        mistakesByType: mistakes.map((m) => ({
          type: m.type,
          count: m._count.id,
        })),
        learningPatterns: {
          mostActiveHour: findMostActiveHour(sessions),
          averageSessionLength:
            sessions.length > 0
              ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
                sessions.length /
                60
              : 0,
          preferredSessionType: findPreferredSessionType(sessions),
          weeklyDistribution: calculateWeeklyDistribution(sessions),
        },
        vocabularyGrowth: cumulativeGrowth,
      };

      return {
        success: true,
        analytics,
      };
    } catch (error) {
      const errorMessage = handlePrismaError(error);
      const errorString =
        typeof errorMessage === 'string'
          ? errorMessage
          : errorMessage.message || 'Unknown error';
      void serverLog(
        `Failed to fetch learning analytics: ${errorString}`,
        'error',
        {
          userId,
          error: errorString,
        },
      );

      return {
        success: false,
        error: errorString,
      };
    }
  },
);

function findMostActiveHour(sessions: { createdAt: Date }[]): number {
  const hourCounts = sessions.reduce(
    (acc, session) => {
      const hour = session.createdAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const sortedHours = Object.entries(hourCounts).sort(([, a], [, b]) => b - a);
  const mostActiveHour = sortedHours[0];
  return mostActiveHour ? parseInt(mostActiveHour[0]) : 0;
}

function findPreferredSessionType(
  sessions: { sessionType: SessionType }[],
): SessionType {
  const typeCounts = sessions.reduce(
    (acc, session) => {
      acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
      return acc;
    },
    {} as Record<SessionType, number>,
  );

  const sortedTypes = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);
  const preferredType = sortedTypes[0];
  return (preferredType?.[0] as SessionType) || SessionType.practice;
}

function calculateWeeklyDistribution(
  sessions: { createdAt: Date }[],
): { day: string; sessions: number }[] {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayCounts = sessions.reduce(
    (acc, session) => {
      const day = session.createdAt.getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  return dayNames.map((day, index) => ({
    day,
    sessions: dayCounts[index] || 0,
  }));
}
