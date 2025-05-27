'use server';

import { revalidateTag } from 'next/cache';
import { PrismaClient, SessionType } from '@prisma/client';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import type {
  UserLearningSession,
  UserSessionItem,
  CreateSessionRequest,
  UpdateSessionRequest,
  AddSessionItemRequest,
  SessionStatsResponse,
  SessionFilterOptions,
  PaginatedSessionsResponse,
} from '@/core/domains/user/types/session';

const prisma = new PrismaClient();

/**
 * Create a new learning session
 */
export async function createLearningSession(
  userId: string,
  data: CreateSessionRequest,
): Promise<{
  success: boolean;
  session?: UserLearningSession;
  error?: string;
}> {
  try {
    serverLog(`Creating learning session for user ${userId}`, 'info', {
      userId,
      sessionType: data.sessionType,
      userListId: data.userListId,
      listId: data.listId,
    });

    const session = await prisma.userLearningSession.create({
      data: {
        userId,
        userListId: data.userListId,
        listId: data.listId,
        sessionType: data.sessionType,
        startTime: new Date(),
        wordsStudied: 0,
        wordsLearned: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        completionPercentage: 0,
      },
      include: {
        userList: {
          select: {
            id: true,
            customNameOfList: true,
            list: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        list: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Revalidate cache tags
    revalidateTag(`user-sessions-${userId}`);
    revalidateTag(`session-stats-${userId}`);

    serverLog(`Learning session created successfully: ${session.id}`, 'info');

    return {
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        userListId: session.userListId,
        listId: session.listId,
        sessionType: session.sessionType,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        wordsStudied: session.wordsStudied,
        wordsLearned: session.wordsLearned,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers,
        score: session.score,
        completionPercentage: session.completionPercentage,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to create learning session: ${errorMessage}`, 'error', {
      userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update an existing learning session
 */
export async function updateLearningSession(
  sessionId: string,
  data: UpdateSessionRequest,
): Promise<{
  success: boolean;
  session?: UserLearningSession;
  error?: string;
}> {
  try {
    serverLog(`Updating learning session ${sessionId}`, 'info', {
      sessionId,
      updates: data,
    });

    // Calculate duration if endTime is provided and no duration is set
    const updateData = { ...data };
    if (data.endTime && !data.duration) {
      const session = await prisma.userLearningSession.findUnique({
        where: { id: sessionId },
        select: { startTime: true },
      });

      if (session) {
        const duration = Math.round(
          (data.endTime.getTime() - session.startTime.getTime()) / 1000,
        );
        updateData.duration = duration;
      }
    }

    const session = await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        userList: {
          select: {
            id: true,
            customNameOfList: true,
            list: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        list: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Revalidate cache tags
    revalidateTag(`user-sessions-${session.userId}`);
    revalidateTag(`session-stats-${session.userId}`);
    revalidateTag(`session-${sessionId}`);

    serverLog(`Learning session updated successfully: ${sessionId}`, 'info');

    return {
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        userListId: session.userListId,
        listId: session.listId,
        sessionType: session.sessionType,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        wordsStudied: session.wordsStudied,
        wordsLearned: session.wordsLearned,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers,
        score: session.score,
        completionPercentage: session.completionPercentage,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to update learning session: ${errorMessage}`, 'error', {
      sessionId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Add a session item to a learning session
 */
export async function addSessionItem(
  sessionId: string,
  data: AddSessionItemRequest,
): Promise<{ success: boolean; item?: UserSessionItem; error?: string }> {
  try {
    serverLog(`Adding session item to session ${sessionId}`, 'info', {
      sessionId,
      userDictionaryId: data.userDictionaryId,
      isCorrect: data.isCorrect,
    });

    const item = await prisma.userSessionItem.create({
      data: {
        sessionId,
        userDictionaryId: data.userDictionaryId,
        isCorrect: data.isCorrect,
        responseTime: data.responseTime,
        attemptsCount: data.attemptsCount || 1,
      },
    });

    // Update session statistics
    await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: {
        wordsStudied: { increment: 1 },
        ...(data.isCorrect
          ? { correctAnswers: { increment: 1 } }
          : { incorrectAnswers: { increment: 1 } }),
      },
    });

    // Update user dictionary learning progress
    await prisma.userDictionary.update({
      where: { id: data.userDictionaryId },
      data: {
        lastReviewedAt: new Date(),
        reviewCount: { increment: 1 },
        ...(data.isCorrect
          ? { correctStreak: { increment: 1 } }
          : {
              amountOfMistakes: { increment: 1 },
              correctStreak: 0,
            }),
      },
    });

    // Revalidate cache tags
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (session) {
      revalidateTag(`user-sessions-${session.userId}`);
      revalidateTag(`session-stats-${session.userId}`);
      revalidateTag(`session-${sessionId}`);
    }

    serverLog(`Session item added successfully: ${item.id}`, 'info');

    return {
      success: true,
      item: {
        id: item.id,
        sessionId: item.sessionId,
        userDictionaryId: item.userDictionaryId,
        isCorrect: item.isCorrect,
        responseTime: item.responseTime,
        attemptsCount: item.attemptsCount,
        createdAt: item.createdAt,
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to add session item: ${errorMessage}`, 'error', {
      sessionId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get session statistics for a user
 */
export async function getSessionStats(
  userId: string,
): Promise<{ success: boolean; stats?: SessionStatsResponse; error?: string }> {
  try {
    serverLog(`Fetching session stats for user ${userId}`, 'info', {
      userId,
    });

    const [totalSessions, sessions, recentSessions] = await Promise.all([
      // Total sessions count
      prisma.userLearningSession.count({
        where: { userId },
      }),

      // Aggregate statistics
      prisma.userLearningSession.aggregate({
        where: { userId },
        _sum: {
          wordsStudied: true,
        },
        _avg: {
          score: true,
        },
      }),

      // Recent sessions for streak calculation and general stats
      prisma.userLearningSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          createdAt: true,
          score: true,
          wordsStudied: true,
        },
      }),
    ]);

    // Calculate streak days
    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < recentSessions.length; i++) {
      const sessionDate = new Date(recentSessions[i].createdAt);
      sessionDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === i) {
        streakDays++;
      } else {
        break;
      }
    }

    const stats: SessionStatsResponse = {
      totalSessions,
      totalWordsStudied: sessions._sum.wordsStudied || 0,
      averageScore: sessions._avg.score || 0,
      streakDays,
      lastSessionDate: recentSessions[0]?.createdAt || null,
      recentSessions: recentSessions.map((s) => ({
        id: '', // Not needed for stats
        userId,
        userListId: null,
        listId: null,
        sessionType: SessionType.practice,
        startTime: s.createdAt,
        endTime: null,
        duration: null,
        wordsStudied: s.wordsStudied,
        wordsLearned: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        score: s.score,
        completionPercentage: 0,
        createdAt: s.createdAt,
        updatedAt: s.createdAt,
      })),
    };

    serverLog(`Session stats fetched successfully for user ${userId}`, 'info');

    return {
      success: true,
      stats,
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to fetch session stats: ${errorMessage}`, 'error', {
      userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get paginated session history with filtering
 */
export async function getSessionHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: SessionFilterOptions,
): Promise<{
  success: boolean;
  data?: PaginatedSessionsResponse;
  error?: string;
}> {
  try {
    serverLog(`Fetching session history for user ${userId}`, 'info', {
      userId,
      page,
      pageSize,
      filters,
    });

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where = {
      userId,
      ...(filters?.sessionType && { sessionType: filters.sessionType }),
      ...(filters?.userListId && { userListId: filters.userListId }),
      ...(filters?.listId && { listId: filters.listId }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [sessions, total] = await Promise.all([
      prisma.userLearningSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          userList: {
            select: {
              id: true,
              customNameOfList: true,
              list: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          list: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.userLearningSession.count({ where }),
    ]);

    const response: PaginatedSessionsResponse = {
      sessions: sessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        userListId: session.userListId,
        listId: session.listId,
        sessionType: session.sessionType,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        wordsStudied: session.wordsStudied,
        wordsLearned: session.wordsLearned,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers,
        score: session.score,
        completionPercentage: session.completionPercentage,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
      total,
      page,
      pageSize,
      hasNext: skip + pageSize < total,
      hasPrev: page > 1,
    };

    serverLog(
      `Session history fetched successfully for user ${userId}`,
      'info',
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to fetch session history: ${errorMessage}`, 'error', {
      userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get current active session for a user
 */
export async function getCurrentSession(userId: string): Promise<{
  success: boolean;
  session?: UserLearningSession | null;
  error?: string;
}> {
  try {
    const session = await prisma.userLearningSession.findFirst({
      where: {
        userId,
        endTime: null, // Active sessions have no end time
      },
      orderBy: { startTime: 'desc' },
      include: {
        userList: {
          select: {
            id: true,
            customNameOfList: true,
            list: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        list: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      session: session
        ? {
            id: session.id,
            userId: session.userId,
            userListId: session.userListId,
            listId: session.listId,
            sessionType: session.sessionType,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            wordsStudied: session.wordsStudied,
            wordsLearned: session.wordsLearned,
            correctAnswers: session.correctAnswers,
            incorrectAnswers: session.incorrectAnswers,
            score: session.score,
            completionPercentage: session.completionPercentage,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          }
        : null,
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to get current session: ${errorMessage}`, 'error', {
      userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
