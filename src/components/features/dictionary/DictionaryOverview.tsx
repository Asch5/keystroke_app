import {
  Book,
  BookOpen,
  Star,
  Clock,
  TrendingUp,
  Plus,
  Users,
  Target,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getUserDictionaryStats } from '@/core/domains/user/actions/user-dictionary-actions';
import { LearningStatus } from '@/core/types';

/**
 * Dictionary Overview Component Props Interface
 * Defines the expected properties for the dictionary overview component
 */
interface DictionaryOverviewProps {
  /** Unique identifier for the user whose dictionary statistics to display */
  userId: string;
}

/**
 * Learning Status Color Configuration
 * Maps learning status types to their corresponding visual indicators
 */
const STATUS_COLORS: Record<LearningStatus, string> = {
  [LearningStatus.learned]: 'bg-success-foreground',
  [LearningStatus.inProgress]: 'bg-info-foreground',
  [LearningStatus.needsReview]: 'bg-warning-foreground',
  [LearningStatus.difficult]: 'bg-error-foreground',
  [LearningStatus.notStarted]: 'bg-content-tertiary',
} as const;

/**
 * Learning Status Label Configuration
 * Maps learning status types to user-friendly display labels
 */
const STATUS_LABELS: Record<LearningStatus, string> = {
  [LearningStatus.learned]: 'Learned',
  [LearningStatus.inProgress]: 'Learning',
  [LearningStatus.needsReview]: 'Review',
  [LearningStatus.difficult]: 'Difficult',
  [LearningStatus.notStarted]: 'Not Started',
} as const;

/**
 * Get Status Color Helper Function
 * Returns the appropriate CSS class for a given learning status
 *
 * @param {LearningStatus} status - The learning status to get color for
 * @returns {string} CSS class for the status color
 */
const getStatusColor = (status: LearningStatus): string => {
  return STATUS_COLORS[status] ?? 'bg-content-tertiary';
};

/**
 * Get Status Label Helper Function
 * Returns the user-friendly label for a given learning status
 *
 * @param {LearningStatus} status - The learning status to get label for
 * @returns {string} User-friendly label for the status
 */
const getStatusLabel = (status: LearningStatus): string => {
  return STATUS_LABELS[status] || status;
};

/**
 * Error Fallback Component
 * Displays user-friendly error message when dictionary stats cannot be loaded
 */
function DictionaryErrorFallback({ message }: { message: string }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-destructive">
          Unable to Load Dictionary
        </h3>
        <p className="text-muted-foreground mb-6">
          {message ??
            'We encountered an error while loading your dictionary statistics.'}
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/dictionary/my-dictionary">
            <BookOpen className="h-4 w-4 mr-2" />
            Go to My Dictionary
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Dictionary Overview Component
 *
 * Comprehensive dashboard component that displays user's vocabulary statistics,
 * learning progress, and provides quick navigation to dictionary features.
 * Serves as the main entry point for dictionary management and progress tracking.
 *
 * Features:
 * - Real-time vocabulary statistics and metrics
 * - Visual learning progress tracking with status breakdown
 * - Quick action buttons for common dictionary tasks
 * - Responsive grid layout for optimal viewing on all devices
 * - Accessible design with proper semantic structure and ARIA attributes
 * - Error handling with user-friendly fallback messages
 * - Empty state guidance for new users
 *
 * Statistics Displayed:
 * - Total vocabulary count and learning progress
 * - Breakdown by learning status (learned, in progress, review needed)
 * - Favorite words count and review reminders
 * - Visual progress indicators and percentages
 *
 * Quick Actions:
 * - Navigate to personal dictionary management
 * - Add new words to vocabulary collection
 * - Manage and organize word lists
 * - Access learning tools and practice modes
 *
 * @param {DictionaryOverviewProps} props - Component properties
 * @param {string} props.userId - Unique identifier for the user
 * @returns {Promise<JSX.Element>} The dictionary overview interface
 */
export async function DictionaryOverview({ userId }: DictionaryOverviewProps) {
  // Fetch user dictionary statistics with error handling
  const stats = await getUserDictionaryStats(userId);

  // Handle error states with user-friendly messages
  if (!stats || typeof stats === 'string') {
    return (
      <DictionaryErrorFallback message="Unable to load dictionary statistics. Please try refreshing the page." />
    );
  }

  // Type guard to ensure we have the correct stats object structure
  if (!('totalWords' in stats)) {
    return (
      <DictionaryErrorFallback message="Error loading dictionary statistics. The data format is unexpected." />
    );
  }

  // Calculate derived statistics for progress tracking
  const learnedCount = stats.statusBreakdown[LearningStatus.learned] || 0;
  const progressPercentage =
    stats.totalWords > 0 ? (learnedCount / stats.totalWords) * 100 : 0;

  return (
    <div className="space-y-6" role="region" aria-label="Dictionary overview">
      {/* Vocabulary Statistics Overview */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Vocabulary Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Total Words
              </CardTitle>
              <Book
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                aria-label={`${stats.totalWords} total words`}
              >
                {stats.totalWords}
              </div>
              <p className="text-xs text-muted-foreground break-words">
                Your vocabulary collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Learned
              </CardTitle>
              <TrendingUp
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-success-foreground"
                aria-label={`${learnedCount} learned words`}
              >
                {learnedCount}
              </div>
              <p className="text-xs text-muted-foreground break-words">
                Mastered words
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Favorites
              </CardTitle>
              <Star
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-warning-foreground"
                aria-label={`${stats.favoriteWords} favorite words`}
              >
                {stats.favoriteWords}
              </div>
              <p className="text-xs text-muted-foreground break-words">
                Starred for review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">
                Need Review
              </CardTitle>
              <Clock
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-warning-foreground"
                aria-label={`${stats.wordsNeedingReview} words need review`}
              >
                {stats.wordsNeedingReview}
              </div>
              <p className="text-xs text-muted-foreground break-words">
                Due for practice
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Learning Progress Visualization */}
      <section aria-labelledby="progress-heading">
        <Card>
          <CardHeader>
            <CardTitle
              id="progress-heading"
              className="flex items-center gap-2"
            >
              <Target className="h-5 w-5" aria-hidden="true" />
              Learning Progress
            </CardTitle>
            <CardDescription>
              Your vocabulary learning journey overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span
                  aria-label={`${progressPercentage.toFixed(1)} percent complete`}
                >
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className="h-2"
                aria-label={`Learning progress: ${progressPercentage.toFixed(1)}% complete`}
              />
              <p className="text-xs text-muted-foreground">
                {learnedCount} of {stats.totalWords} words learned
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                <div key={status} className="text-center min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full mx-auto mb-2 ${getStatusColor(status as LearningStatus)}`}
                    aria-hidden="true"
                  />
                  <div
                    className="text-sm font-medium"
                    aria-label={`${count} words with status ${getStatusLabel(status as LearningStatus)}`}
                  >
                    {count}
                  </div>
                  <div className="text-xs text-muted-foreground truncate px-1">
                    {getStatusLabel(status as LearningStatus)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions Navigation */}
      <section aria-labelledby="actions-heading">
        <Card>
          <CardHeader>
            <CardTitle id="actions-heading" className="flex items-center gap-2">
              <Zap className="h-5 w-5" aria-hidden="true" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Manage your vocabulary and continue learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                asChild
                className="h-auto p-4 flex flex-col items-start gap-2 text-wrap"
              >
                <Link
                  href="/dashboard/dictionary/my-dictionary"
                  aria-label="Navigate to my dictionary to browse and manage vocabulary"
                  className="w-full"
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <BookOpen
                      className="h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-semibold truncate">
                      My Dictionary
                    </span>
                  </div>
                  <p className="text-sm text-left opacity-80 break-words leading-relaxed">
                    Browse and manage your personal vocabulary
                  </p>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 text-wrap"
              >
                <Link
                  href="/dashboard/dictionary/add-word"
                  aria-label="Navigate to add new words to your vocabulary"
                  className="w-full"
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <Plus
                      className="h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-semibold truncate">Add New Word</span>
                  </div>
                  <p className="text-sm text-left opacity-80 break-words leading-relaxed">
                    Search and add words to your dictionary
                  </p>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 text-wrap"
              >
                <Link
                  href="/dashboard/dictionary/lists"
                  aria-label="Navigate to word lists to organize vocabulary collections"
                  className="w-full"
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <Users
                      className="h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-semibold truncate">Word Lists</span>
                  </div>
                  <p className="text-sm text-left opacity-80 break-words leading-relaxed">
                    Organize words into themed collections
                  </p>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Detailed Learning Status Breakdown */}
      {stats.totalWords > 0 && (
        <section aria-labelledby="status-breakdown-heading">
          <Card>
            <CardHeader>
              <CardTitle id="status-breakdown-heading">
                Learning Status Breakdown
              </CardTitle>
              <CardDescription>
                Detailed view of your vocabulary learning status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.statusBreakdown)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => {
                    const percentage = (count / stats.totalWords) * 100;
                    const statusLabel = getStatusLabel(
                      status as LearningStatus,
                    );

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between items-center min-w-0 gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(status as LearningStatus)}`}
                              aria-hidden="true"
                            />
                            <span className="text-sm font-medium truncate">
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant="secondary"
                              className="text-xs whitespace-nowrap"
                            >
                              {count} words
                            </Badge>
                            <span
                              className="text-sm text-muted-foreground whitespace-nowrap"
                              aria-label={`${percentage.toFixed(1)} percent of total vocabulary`}
                            >
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-1"
                          aria-label={`${statusLabel}: ${percentage.toFixed(1)}% of vocabulary`}
                        />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Empty State for New Users */}
      {stats.totalWords === 0 && (
        <section aria-labelledby="empty-state-heading">
          <Card>
            <CardContent className="text-center py-12">
              <Book
                className="h-12 w-12 text-muted-foreground mx-auto mb-4"
                aria-hidden="true"
              />
              <h3
                id="empty-state-heading"
                className="text-lg font-semibold mb-2"
              >
                Your dictionary is empty
              </h3>
              <p className="text-muted-foreground mb-6">
                Start building your vocabulary by adding your first word
              </p>
              <Button asChild>
                <Link
                  href="/dashboard/dictionary/add-word"
                  aria-label="Add your first word to start building your vocabulary"
                >
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Add Your First Word
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
