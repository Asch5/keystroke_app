import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { StatisticsContent } from '@/components/features/dashboard/StatisticsContent';
import { StatisticsLoadingSkeleton } from '@/components/utils/skeletons/StatisticsLoadingSkeleton';

/**
 * Statistics Page - User Analytics Dashboard
 *
 * Provides comprehensive learning statistics including:
 * - Learning progress and vocabulary growth
 * - Session statistics and performance metrics
 * - Mistake analysis and improvement tracking
 * - Achievement progress and gamification
 * - Daily/weekly/monthly progress tracking
 */
export default async function StatisticsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Learning Statistics
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your progress, analyze your learning patterns, and celebrate
            your achievements
          </p>
        </div>
      </div>

      <Suspense fallback={<StatisticsLoadingSkeleton />}>
        <StatisticsContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}
