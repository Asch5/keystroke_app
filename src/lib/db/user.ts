// src/lib/db/user.ts

import { prisma } from '@/lib/prisma';
import { Prisma, User } from '@prisma/client';
export type UserWithStatsAndMeta = UserWithStats & {
    stats: UserStats;
};

export type UserWithStats = Prisma.UserGetPayload<{
    include: {
        userSettings: true;
        userDictionary: {
            select: {
                learningStatus: true;
                progress: true;
                correctStreak: true;
            };
        };
        learningSessions: {
            select: {
                sessionType: true;
                duration: true;
                wordsLearned: true;
                correctAnswers: true;
                incorrectAnswers: true;
                score: true;
                startTime: true;
            };
        };
    };
}>;

export type UserStats = {
    totalWords: number;
    wordsLearned: number;
    averageProgress: number;
    lastActive: Date | null;
    totalSessions: number;
    averageScore: number;
    learningStreak: number;
    preferredSessionType: string | null;
};

/**
 * Retrieves all users with their learning statistics
 * @param page Page number (1-based)
 * @param limit Number of users per page
 * @param searchQuery Optional search by name or email
 * @param sortBy Optional sorting field
 * @param sortOrder 'asc' or 'desc'
 */
export async function getUsers(
    page = 1,
    limit = 10,
    searchQuery?: string,
    sortBy: keyof (User & { lastActive: Date }) = 'lastLogin',
    sortOrder: 'asc' | 'desc' = 'desc',
) {
    const skip = (page - 1) * limit;

    const where = searchQuery
        ? {
              OR: [
                  {
                      name: {
                          contains: searchQuery,
                          mode: 'insensitive' as const,
                      },
                  },
                  {
                      email: {
                          contains: searchQuery,
                          mode: 'insensitive' as const,
                      },
                  },
              ],
              deletedAt: null,
          }
        : { deletedAt: null };

    const users = await prisma.user.findMany({
        where,
        include: {
            userSettings: true,
            userDictionary: {
                select: {
                    learningStatus: true,
                    progress: true,
                    correctStreak: true,
                    lastReviewedAt: true,
                },
            },
            learningSessions: {
                select: {
                    sessionType: true,
                    duration: true,
                    wordsLearned: true,
                    correctAnswers: true,
                    incorrectAnswers: true,
                    score: true,
                    startTime: true,
                },
            },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
    });

    const total = await prisma.user.count({ where });

    const usersWithStats = users.map((user) => ({
        ...user,
        stats: calculateUserStats(user),
    }));

    return {
        users: usersWithStats,
        pagination: {
            total,
            pages: Math.ceil(total / limit),
            current: page,
            limit,
        },
    };
}

/**
 * Calculates learning statistics for a user
 */
function calculateUserStats(user: UserWithStats): UserStats {
    const totalWords = user.userDictionary.length;
    const wordsLearned = user.userDictionary.filter(
        (w) => w.learningStatus === 'learned',
    ).length;
    const averageProgress =
        user.userDictionary.reduce((acc, curr) => acc + curr.progress, 0) /
            totalWords || 0;

    const sessions = user.learningSessions;
    const lastActive = sessions.length
        ? new Date(Math.max(...sessions.map((s) => s.startTime.getTime())))
        : null;

    const sessionTypes = sessions.reduce(
        (acc, curr) => {
            acc[curr.sessionType] = (acc[curr.sessionType] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    const preferredSessionType =
        Object.entries(sessionTypes).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        null;

    return {
        totalWords,
        wordsLearned,
        averageProgress,
        lastActive,
        totalSessions: sessions.length,
        averageScore:
            sessions.reduce((acc, curr) => acc + (curr.score || 0), 0) /
                sessions.length || 0,
        learningStreak: Math.max(
            ...user.userDictionary.map((w) => w.correctStreak),
            0,
        ),
        preferredSessionType,
    };
}

/**
 * Updates user status (active/inactive/suspended)
 */
export async function updateUserStatus(userId: string, status: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { status },
    });
}

/**
 * Soft deletes a user
 */
export async function deleteUser(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
    });
}

/**
 * Gets detailed statistics for a single user
 */
export async function getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            userSettings: true,
            userDictionary: true,
            learningSessions: {
                include: {
                    sessionItems: true,
                },
            },
            userLists: {
                include: {
                    userListWords: true,
                },
            },
        },
    });

    if (!user) throw new Error('User not found');

    return {
        ...user,
        stats: calculateUserStats(user as UserWithStats),
        learningProgress: calculateLearningProgress(user as UserWithStats),
    };
}

/**
 * Calculates detailed learning progress statistics
 */
function calculateLearningProgress(user: UserWithStats) {
    // Weekly progress
    const weeklyProgress = Array(7)
        .fill(0)
        .map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const sessions = user.learningSessions.filter(
                (s: { startTime: Date }) =>
                    s.startTime.toDateString() === date.toDateString(),
            );
            return {
                date,
                wordsLearned: sessions.reduce(
                    (acc: number, s: { wordsLearned: number }) =>
                        acc + s.wordsLearned,
                    0,
                ),
                score:
                    sessions.reduce(
                        (acc: number, s: { score: number | null }) =>
                            acc + (s.score || 0),
                        0,
                    ) / sessions.length || 0,
            };
        })
        .reverse();

    return {
        weeklyProgress,
    };
}

export async function getUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email },
        include: {
            userSettings: true,
            userDictionary: true,
            learningSessions: true,
        },
    });
}
