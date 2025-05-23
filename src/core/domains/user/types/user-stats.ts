import { User } from '@prisma/client';

/**
 * User statistics types for user domain
 */

// User statistics interface
export interface UserStats {
  totalWords: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  totalReviews: number;
  lastReviewDate: Date | null;
  progressPercentage: number;
}

// User with statistics
export interface UserWithStats extends User {
  stats: UserStats;
}

// User with statistics and metadata
export interface UserWithStatsAndMeta {
  user: UserWithStats;
  metadata: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
  };
}

// Learning progress metrics
export interface LearningProgress {
  dailyGoal: number;
  dailyProgress: number;
  weeklyProgress: number;
  monthlyProgress: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}
