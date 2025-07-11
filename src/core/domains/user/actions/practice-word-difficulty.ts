'use server';

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/shared/database/client';
import { LearningStatus } from '@/core/types';
import { updateSRSData } from './practice-progression';

// Type definitions for word difficulty analysis
export interface WordDifficultyMetrics {
  userDictionaryId: string;
  wordText: string;
  difficultyScore: number; // 0-100, higher = more difficult
  mistakeRate: number; // Percentage of attempts that resulted in mistakes
  mistakeCount: number;
  totalAttempts: number;
  avgResponseTime: number;
  learningStatus: LearningStatus;
  srsLevel: number;
  masteryScore: number;
  consistencyScore: number; // How consistent user performance is
  recentPerformance: number; // Performance in last 10 attempts
  mistakeTypes: Record<string, number>; // Distribution of mistake types
  recommendations: string[];
}

export interface MistakePattern {
  type: string;
  description: string;
  frequency: number;
  words: string[];
  exerciseTypes: string[];
  avgDifficulty: number;
  recommendations: string[];
}

export interface DifficultyAdjustmentResult {
  userDictionaryId: string;
  oldSrsLevel: number;
  newSrsLevel: number;
  adjustmentReason: string;
  newInterval: number;
  nextReviewDate: Date;
}

/**
 * Analyze word difficulty for a specific user
 */
export async function analyzeWordDifficulty(
  userId: string,
  limit: number = 50,
): Promise<{
  success: boolean;
  analysis?: {
    difficultWords: WordDifficultyMetrics[];
    averageDifficultyScore: number;
    totalAnalyzedWords: number;
    highDifficultyCount: number;
    mistakePatterns: MistakePattern[];
    globalRecommendations: string[];
  };
  error?: string;
}> {
  try {
    // Get user's words with learning data
    const userWords = await prisma.userDictionary.findMany({
      where: {
        userId,
        deletedAt: null,
        reviewCount: { gt: 0 }, // Only analyze words that have been practiced
      },
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
        mistakes: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Last 20 mistakes for pattern analysis
        },
      },
      take: limit * 2, // Get more words to filter properly
    });

    const wordMetrics: WordDifficultyMetrics[] = [];

    for (const userWord of userWords) {
      const wordText =
        userWord.definition.wordDetails[0]?.wordDetails?.word?.word ??
        'Unknown';

      // Calculate basic metrics
      const totalAttempts = userWord.reviewCount ?? 0;

      const mistakeCount = userWord.amountOfMistakes ?? 0;
      const mistakeRate =
        totalAttempts > 0 ? (mistakeCount / totalAttempts) * 100 : 0;

      // Analyze mistake types
      const mistakeTypes: Record<string, number> = {};
      userWord.mistakes.forEach((mistake) => {
        mistakeTypes[mistake.type] = (mistakeTypes[mistake.type] || 0) + 1;
      });

      // Calculate consistency score (based on recent performance variance)
      const recentMistakes = userWord.mistakes.slice(0, 10);
      const consistencyScore = calculateConsistencyScore(
        recentMistakes,
        totalAttempts,
      );

      // Calculate recent performance (last 10 attempts)
      const recentPerformance = calculateRecentPerformance(
        recentMistakes,
        totalAttempts,
      );

      // Calculate difficulty score (0-100)
      const difficultyScore = calculateDifficultyScore({
        mistakeRate,
        consistencyScore,
        recentPerformance,
        masteryScore: userWord.masteryScore ?? 0,
        srsLevel: userWord.srsLevel ?? 0,
        learningStatus: userWord.learningStatus,
        mistakeTypes,
      });

      // Generate recommendations
      const recommendations = generateWordRecommendations({
        difficultyScore,
        mistakeRate,
        mistakeTypes,
        learningStatus: userWord.learningStatus,
        masteryScore: userWord.masteryScore ?? 0,
      });

      wordMetrics.push({
        userDictionaryId: userWord.id,
        wordText,
        difficultyScore,
        mistakeRate,
        mistakeCount,
        totalAttempts,
        avgResponseTime: 0, // Would need session data for accurate calculation
        learningStatus: userWord.learningStatus,
        srsLevel: userWord.srsLevel ?? 0,
        masteryScore: userWord.masteryScore ?? 0,
        consistencyScore,
        recentPerformance,
        mistakeTypes,
        recommendations,
      });
    }

    // Sort by difficulty score and take top difficult words
    const difficultWords = wordMetrics
      .sort((a, b) => b.difficultyScore - a.difficultyScore)
      .slice(0, limit);

    // Calculate aggregate metrics
    const averageDifficultyScore =
      wordMetrics.reduce((sum, w) => sum + w.difficultyScore, 0) /
      Math.max(wordMetrics.length, 1);

    const highDifficultyCount = wordMetrics.filter(
      (w) => w.difficultyScore >= 70,
    ).length;

    // Analyze mistake patterns across all words
    const mistakePatterns = await analyzeMistakePatterns(userId);

    // Generate global recommendations
    const globalRecommendations = generateGlobalRecommendations(
      wordMetrics,
      mistakePatterns,
      averageDifficultyScore,
    );

    void serverLog('Word difficulty analysis completed', 'info', {
      userId,
      analyzedWords: wordMetrics.length,
      difficultWords: difficultWords.length,
      averageDifficultyScore: Math.round(averageDifficultyScore),
    });

    return {
      success: true,
      analysis: {
        difficultWords,
        averageDifficultyScore,
        totalAnalyzedWords: wordMetrics.length,
        highDifficultyCount,
        mistakePatterns,
        globalRecommendations,
      },
    };
  } catch (error) {
    void serverLog('Error analyzing word difficulty', 'error', {
      error,
      userId,
    });
    return {
      success: false,
      error: 'Failed to analyze word difficulty',
    };
  }
}

/**
 * Adjust review frequency based on difficulty analysis
 */
export async function adjustReviewFrequencyByDifficulty(
  userId: string,
  difficultyThreshold: number = 70,
): Promise<{
  success: boolean;
  adjustments?: DifficultyAdjustmentResult[];
  totalAdjusted?: number;
  error?: string;
}> {
  try {
    // Get difficulty analysis
    const analysis = await analyzeWordDifficulty(userId, 100);

    if (!analysis.success || !analysis.analysis) {
      return { success: false, error: 'Failed to get difficulty analysis' };
    }

    const adjustments: DifficultyAdjustmentResult[] = [];

    // Process each difficult word
    for (const word of analysis.analysis.difficultWords) {
      if (word.difficultyScore >= difficultyThreshold) {
        let adjustmentReason = '';
        let newSrsLevel = word.srsLevel;

        // Determine adjustment based on difficulty factors
        if (word.mistakeRate > 60 && word.consistencyScore < 40) {
          // High mistake rate + low consistency = regress significantly
          newSrsLevel = Math.max(0, word.srsLevel - 2);
          adjustmentReason = 'High mistake rate with inconsistent performance';
        } else if (word.mistakeRate > 40) {
          // High mistake rate = regress moderately
          newSrsLevel = Math.max(0, word.srsLevel - 1);
          adjustmentReason = 'High mistake rate';
        } else if (word.recentPerformance < 30) {
          // Poor recent performance = regress slightly
          newSrsLevel = Math.max(0, word.srsLevel - 1);
          adjustmentReason = 'Poor recent performance';
        } else if (word.consistencyScore < 30) {
          // Very inconsistent = maintain current level with shorter intervals
          adjustmentReason =
            'Inconsistent performance - shortened review interval';
        }

        // Apply SRS adjustment if level changed
        if (
          newSrsLevel !== word.srsLevel ||
          adjustmentReason.includes('shortened')
        ) {
          const srsResult = await updateSRSData(word.userDictionaryId, false); // Treat as incorrect to adjust interval

          if (srsResult.success && srsResult.srsData) {
            adjustments.push({
              userDictionaryId: word.userDictionaryId,
              oldSrsLevel: word.srsLevel,
              newSrsLevel,
              adjustmentReason,
              newInterval: srsResult.srsData.interval,
              nextReviewDate: srsResult.srsData.nextReview,
            });

            // Update the SRS level in database if it changed
            if (newSrsLevel !== word.srsLevel) {
              await prisma.userDictionary.update({
                where: { id: word.userDictionaryId },
                data: { srsLevel: newSrsLevel },
              });
            }
          }
        }
      }
    }

    void serverLog('Review frequency adjusted based on difficulty', 'info', {
      userId,
      totalAdjusted: adjustments.length,
      difficultyThreshold,
    });

    return {
      success: true,
      adjustments,
      totalAdjusted: adjustments.length,
    };
  } catch (error) {
    void serverLog('Error adjusting review frequency by difficulty', 'error', {
      error,
      userId,
    });
    return {
      success: false,
      error: 'Failed to adjust review frequency',
    };
  }
}

/**
 * Get words that need immediate attention based on difficulty
 */
export async function getWordsNeedingAttention(
  userId: string,
  limit: number = 20,
): Promise<{
  success: boolean;
  words?: Array<{
    userDictionaryId: string;
    wordText: string;
    difficultyScore: number;
    urgencyLevel: 'high' | 'medium' | 'low';
    primaryIssue: string;
    recommendedAction: string;
  }>;
  error?: string;
}> {
  try {
    const analysis = await analyzeWordDifficulty(userId, limit * 2);

    if (!analysis.success || !analysis.analysis) {
      return { success: false, error: 'Failed to analyze word difficulty' };
    }

    const wordsNeedingAttention = analysis.analysis.difficultWords
      .filter((word) => word.difficultyScore >= 60) // Focus on moderately difficult words
      .map((word) => {
        let urgencyLevel: 'high' | 'medium' | 'low' = 'low';
        let primaryIssue = '';
        let recommendedAction = '';

        if (word.difficultyScore >= 85) {
          urgencyLevel = 'high';
          primaryIssue = 'Critical difficulty - multiple learning challenges';
          recommendedAction =
            'Reset to basic recognition exercises and practice daily';
        } else if (word.mistakeRate > 70) {
          urgencyLevel = 'high';
          primaryIssue = 'Very high mistake rate';
          recommendedAction =
            'Focus on easier exercise types and increase practice frequency';
        } else if (word.consistencyScore < 30) {
          urgencyLevel = 'medium';
          primaryIssue = 'Inconsistent performance';
          recommendedAction = 'Regular practice with consistent exercise types';
        } else if (word.recentPerformance < 40) {
          urgencyLevel = 'medium';
          primaryIssue = 'Declining recent performance';
          recommendedAction =
            'Review fundamentals and practice more frequently';
        } else {
          urgencyLevel = 'low';
          primaryIssue = 'Moderate difficulty';
          recommendedAction =
            'Continue regular practice with slight increase in frequency';
        }

        return {
          userDictionaryId: word.userDictionaryId,
          wordText: word.wordText,
          difficultyScore: word.difficultyScore,
          urgencyLevel,
          primaryIssue,
          recommendedAction,
        };
      })
      .sort((a, b) => {
        // Sort by urgency, then by difficulty score
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
          return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        }
        return b.difficultyScore - a.difficultyScore;
      })
      .slice(0, limit);

    return {
      success: true,
      words: wordsNeedingAttention,
    };
  } catch (error) {
    void serverLog('Error getting words needing attention', 'error', {
      error,
      userId,
    });
    return {
      success: false,
      error: 'Failed to get words needing attention',
    };
  }
}

/**
 * Helper function to calculate consistency score
 */
function calculateConsistencyScore(
  recentMistakes: Array<{ createdAt: Date; type: string }>,
  totalAttempts: number,
): number {
  if (totalAttempts < 5) return 50; // Not enough data, return neutral score

  // Calculate variance in mistake frequency over time
  const mistakesByDay: Record<string, number> = {};
  recentMistakes.forEach((mistake) => {
    const day = mistake.createdAt.toISOString().split('T')[0];
    if (day) {
      mistakesByDay[day] = (mistakesByDay[day] ?? 0) + 1;
    }
  });

  const days = Object.keys(mistakesByDay);
  if (days.length < 2) return 70; // Limited data, return good score

  const mistakeCounts = Object.values(mistakesByDay);
  const average =
    mistakeCounts.reduce((sum, count) => sum + count, 0) / mistakeCounts.length;
  const variance =
    mistakeCounts.reduce(
      (sum, count) => sum + Math.pow(count - average, 2),
      0,
    ) / mistakeCounts.length;

  // Convert variance to consistency score (lower variance = higher consistency)
  const maxVariance = 10; // Arbitrary maximum for normalization
  const normalizedVariance = Math.min(variance, maxVariance) / maxVariance;

  return Math.round((1 - normalizedVariance) * 100);
}

/**
 * Helper function to calculate recent performance
 */
function calculateRecentPerformance(
  recentMistakes: Array<{ createdAt: Date }>,
  totalAttempts: number,
): number {
  if (totalAttempts < 5) return 50; // Not enough data

  const recentAttempts = Math.min(10, totalAttempts);
  const recentMistakeCount = recentMistakes.length;

  // Calculate success rate for recent attempts
  const recentSuccessRate =
    ((recentAttempts - recentMistakeCount) / recentAttempts) * 100;

  return Math.max(0, Math.round(recentSuccessRate));
}

/**
 * Helper function to calculate overall difficulty score
 */
function calculateDifficultyScore(metrics: {
  mistakeRate: number;
  consistencyScore: number;
  recentPerformance: number;
  masteryScore: number;
  srsLevel: number;
  learningStatus: LearningStatus;
  mistakeTypes: Record<string, number>;
}): number {
  const {
    mistakeRate,
    consistencyScore,
    recentPerformance,
    masteryScore,
    learningStatus,
    mistakeTypes,
  } = metrics;

  // Weight different factors
  const mistakeWeight = 0.3;
  const consistencyWeight = 0.2;
  const recentWeight = 0.25;
  const masteryWeight = 0.15;
  const statusWeight = 0.1;

  // Convert metrics to difficulty scores (higher = more difficult)
  const mistakeDifficulty = mistakeRate; // Already 0-100
  const consistencyDifficulty = 100 - consistencyScore;
  const recentDifficulty = 100 - recentPerformance;
  const masteryDifficulty = 100 - masteryScore;

  // Learning status difficulty mapping
  const statusDifficultyMap: Record<LearningStatus, number> = {
    [LearningStatus.notStarted]: 30,
    [LearningStatus.inProgress]: 50,
    [LearningStatus.learned]: 20,
    [LearningStatus.needsReview]: 80,
    [LearningStatus.difficult]: 90,
  };
  const statusDifficulty = statusDifficultyMap[learningStatus] ?? 50;

  // Calculate weighted difficulty score
  const weightedScore =
    mistakeDifficulty * mistakeWeight +
    consistencyDifficulty * consistencyWeight +
    recentDifficulty * recentWeight +
    masteryDifficulty * masteryWeight +
    statusDifficulty * statusWeight;

  // Apply mistake type penalties
  const mistakeTypeCount = Object.keys(mistakeTypes).length;
  const diversityPenalty = Math.min(mistakeTypeCount * 5, 20); // Max 20% penalty for diverse mistakes

  const finalScore = Math.min(
    100,
    Math.round(weightedScore + diversityPenalty),
  );

  return Math.max(0, finalScore);
}

/**
 * Analyze mistake patterns across all user words
 */
async function analyzeMistakePatterns(
  userId: string,
): Promise<MistakePattern[]> {
  try {
    const mistakes = await prisma.learningMistake.findMany({
      where: { userId },
      include: {
        userDictionary: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Analyze recent mistakes
    });

    // Group mistakes by type
    const mistakesByType: Record<string, typeof mistakes> = {};
    mistakes.forEach((mistake) => {
      if (!mistakesByType[mistake.type]) {
        mistakesByType[mistake.type] = [];
      }
      mistakesByType[mistake.type]?.push(mistake);
    });

    const patterns: MistakePattern[] = [];

    for (const [type, typeMistakes] of Object.entries(mistakesByType)) {
      if (typeMistakes.length < 3) continue; // Skip infrequent mistake types

      const words = new Set(
        typeMistakes.map(
          (m) =>
            m.userDictionary?.definition.wordDetails[0]?.wordDetails?.word
              ?.word ?? 'Unknown',
        ),
      );

      const exerciseTypes = new Set(
        typeMistakes.map((m) => {
          try {
            const context =
              typeof m.context === 'string' ? JSON.parse(m.context) : m.context;
            return context?.exerciseType ?? 'unknown';
          } catch {
            return 'unknown';
          }
        }),
      );

      const avgDifficulty =
        typeMistakes.reduce((sum, m) => {
          return sum + (m.userDictionary?.srsLevel ?? 0);
        }, 0) / typeMistakes.length;

      // Generate recommendations based on mistake type
      const recommendations = generateMistakeTypeRecommendations(
        type,
        typeMistakes.length,
      );

      patterns.push({
        type,
        description: getMistakeTypeDescription(type),
        frequency: typeMistakes.length,
        words: Array.from(words).slice(0, 10), // Limit to 10 words
        exerciseTypes: Array.from(exerciseTypes),
        avgDifficulty,
        recommendations,
      });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  } catch (error) {
    void serverLog('Error analyzing mistake patterns', 'error', {
      error,
      userId,
    });
    return [];
  }
}

/**
 * Generate recommendations for individual words
 */
function generateWordRecommendations(metrics: {
  difficultyScore: number;
  mistakeRate: number;
  mistakeTypes: Record<string, number>;
  learningStatus: LearningStatus;
  masteryScore: number;
}): string[] {
  const recommendations: string[] = [];

  if (metrics.difficultyScore >= 85) {
    recommendations.push('Consider resetting to basic recognition exercises');
    recommendations.push('Practice this word daily until mastery improves');
  }

  if (metrics.mistakeRate > 60) {
    recommendations.push('Focus on easier exercise types before advancing');
    recommendations.push('Increase practice frequency for this word');
  }

  if (metrics.masteryScore < 30) {
    recommendations.push('Start with "Remember Translation" exercises');
    recommendations.push(
      'Use audio playback to improve pronunciation familiarity',
    );
  }

  // Mistake type specific recommendations
  const mistakeTypes = Object.keys(metrics.mistakeTypes);
  if (mistakeTypes.includes('spelling')) {
    recommendations.push('Practice character-by-character typing');
  }
  if (mistakeTypes.includes('meaning')) {
    recommendations.push('Review definition and use in context');
  }
  if (mistakeTypes.includes('pronunciation')) {
    recommendations.push('Listen to audio pronunciation multiple times');
  }

  return recommendations.slice(0, 4); // Limit to top 4 recommendations
}

/**
 * Generate global recommendations based on overall analysis
 */
function generateGlobalRecommendations(
  wordMetrics: WordDifficultyMetrics[],
  mistakePatterns: MistakePattern[],
  averageDifficultyScore: number,
): string[] {
  const recommendations: string[] = [];

  if (averageDifficultyScore > 70) {
    recommendations.push('Consider reducing practice difficulty temporarily');
    recommendations.push(
      'Focus on mastering easier words before adding new ones',
    );
  }

  const highDifficultyCount = wordMetrics.filter(
    (w) => w.difficultyScore >= 80,
  ).length;
  if (highDifficultyCount > 10) {
    recommendations.push(
      'Too many difficult words - consider reviewing learning strategy',
    );
  }

  // Most common mistake type recommendations
  const topMistakePattern = mistakePatterns[0];
  if (topMistakePattern) {
    recommendations.push(
      `Address ${topMistakePattern.type} mistakes: ${topMistakePattern.recommendations[0]}`,
    );
  }

  const inconsistentWords = wordMetrics.filter(
    (w) => w.consistencyScore < 40,
  ).length;
  if (inconsistentWords > 5) {
    recommendations.push('Establish more consistent practice routine');
  }

  return recommendations;
}

/**
 * Get description for mistake types
 */
function getMistakeTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    spelling: 'Incorrect character sequences or letter substitutions',
    meaning: 'Wrong word meaning or translation selection',
    pronunciation: 'Audio-related mistakes or phonetic errors',
    grammar: 'Grammatical form or structure errors',
    timing: 'Response time or pace-related issues',
    context: 'Usage context or situational mistakes',
    memory: 'Difficulty recalling word or meaning',
  };

  return descriptions[type] ?? 'General learning difficulty';
}

/**
 * Generate recommendations for specific mistake types
 */
function generateMistakeTypeRecommendations(
  type: string,
  frequency: number,
): string[] {
  const recommendations: Record<string, string[]> = {
    spelling: [
      'Practice typing exercises with character-by-character focus',
      'Use "Make Up Word" exercises to reinforce spelling patterns',
      'Slow down typing to improve accuracy',
    ],
    meaning: [
      'Review definitions more thoroughly before exercises',
      'Use "Remember Translation" exercises more frequently',
      'Study words in context rather than isolation',
    ],
    pronunciation: [
      'Increase audio playback frequency',
      'Practice "Write by Sound" exercises',
      'Focus on phonetic patterns and syllable breakdown',
    ],
    grammar: [
      'Study grammatical forms and conjugations',
      'Practice words in different grammatical contexts',
      'Review part-of-speech information',
    ],
    timing: [
      'Disable time pressure during practice',
      'Focus on accuracy over speed',
      'Gradually increase practice pace',
    ],
  };

  const baseRecommendations = recommendations[type] || [
    'Increase practice frequency for this mistake type',
    'Review learning materials related to this area',
    'Consider seeking additional resources or guidance',
  ];

  if (frequency > 20) {
    baseRecommendations.unshift(
      'This is a major difficulty area requiring focused attention',
    );
  }

  return baseRecommendations;
}
