import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import Link from 'next/link';
import { getUserDictionaryStats } from '@/core/domains/user/actions/user-dictionary-actions';
import { LearningStatus } from '@prisma/client';

interface DictionaryOverviewProps {
  userId: string;
}

/**
 * Dictionary overview component
 *
 * Displays user's dictionary statistics and provides navigation to different dictionary features
 */
export async function DictionaryOverview({ userId }: DictionaryOverviewProps) {
  const stats = await getUserDictionaryStats(userId);

  if (!stats || typeof stats === 'string') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Unable to load dictionary statistics
        </p>
      </div>
    );
  }

  // Type guard to ensure we have the correct stats object
  if (!('totalWords' in stats)) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Error loading dictionary statistics
        </p>
      </div>
    );
  }

  const getStatusColor = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return 'bg-green-500';
      case LearningStatus.inProgress:
        return 'bg-blue-500';
      case LearningStatus.needsReview:
        return 'bg-yellow-500';
      case LearningStatus.difficult:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return 'Learned';
      case LearningStatus.inProgress:
        return 'Learning';
      case LearningStatus.needsReview:
        return 'Review';
      case LearningStatus.difficult:
        return 'Difficult';
      case LearningStatus.notStarted:
        return 'Not Started';
      default:
        return status;
    }
  };

  const learnedCount = stats.statusBreakdown[LearningStatus.learned] || 0;

  const progressPercentage =
    stats.totalWords > 0 ? (learnedCount / stats.totalWords) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWords}</div>
            <p className="text-xs text-muted-foreground">
              Your vocabulary collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {learnedCount}
            </div>
            <p className="text-xs text-muted-foreground">Mastered words</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.favoriteWords}
            </div>
            <p className="text-xs text-muted-foreground">Starred for review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.wordsNeedingReview}
            </div>
            <p className="text-xs text-muted-foreground">Due for practice</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
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
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {learnedCount} of {stats.totalWords} words learned
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => (
              <div key={status} className="text-center">
                <div
                  className={`w-3 h-3 rounded-full mx-auto mb-2 ${getStatusColor(status as LearningStatus)}`}
                />
                <div className="text-sm font-medium">{count as number}</div>
                <div className="text-xs text-muted-foreground">
                  {getStatusLabel(status as LearningStatus)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
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
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <Link href="/dashboard/dictionary/my-dictionary">
                <div className="flex items-center gap-2 w-full">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-semibold">My Dictionary</span>
                </div>
                <p className="text-sm text-left opacity-80">
                  Browse and manage your personal vocabulary collection
                </p>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <Link href="/dashboard/dictionary/add-word">
                <div className="flex items-center gap-2 w-full">
                  <Plus className="h-5 w-5" />
                  <span className="font-semibold">Add New Word</span>
                </div>
                <p className="text-sm text-left opacity-80">
                  Search and add words to your vocabulary collection
                </p>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <Link href="/dashboard/dictionary/lists">
                <div className="flex items-center gap-2 w-full">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">Word Lists</span>
                </div>
                <p className="text-sm text-left opacity-80">
                  Organize words into themed collections
                </p>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Learning Status Breakdown */}
      {stats.totalWords > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Status Breakdown</CardTitle>
            <CardDescription>
              Detailed view of your vocabulary learning status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.statusBreakdown)
                .filter(([, count]) => (count as number) > 0)
                .map(([status, count]) => {
                  const percentage =
                    ((count as number) / stats.totalWords) * 100;
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(status as LearningStatus)}`}
                          />
                          <span className="text-sm font-medium">
                            {getStatusLabel(status as LearningStatus)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {count as number} words
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-1" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats.totalWords === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Your dictionary is empty
            </h3>
            <p className="text-muted-foreground mb-6">
              Start building your vocabulary by adding your first word
            </p>
            <Button asChild>
              <Link href="/dashboard/dictionary/add-word">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Word
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
