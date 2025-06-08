import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/features/dashboard/DashboardContent';
import { Suspense } from 'react';
import { DashboardLoadingSkeleton } from '@/components/utils/skeletons';

/**
 * Dashboard Overview Page Component
 *
 * Main entry point for the authenticated user dashboard experience.
 * Provides comprehensive learning analytics, progress tracking, and quick access
 * to core functionality. Implements server-side authentication check and
 * graceful error handling with loading states.
 *
 * Features:
 * - User authentication validation with redirect to login
 * - Personalized welcome message with user context
 * - Comprehensive learning progress overview
 * - Quick action buttons for common tasks
 * - Recent activity and achievement highlights
 * - Error boundaries for graceful error handling
 * - Accessible design with proper semantic structure
 *
 * @returns {Promise<JSX.Element>} The dashboard overview page component
 */
export default async function DashboardOverviewPage() {
  const session = await auth();

  // Redirect unauthenticated users to login
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Extract user information for better type safety
  const user = {
    id: session.user.id,
    name: session.user.name || 'Learner',
    email: session.user.email,
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page Header with Semantic Structure */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your learning progress at a glance
          </p>
        </div>
      </header>

      {/* Main Dashboard Content with Loading State */}
      <main className="space-y-6" role="main">
        <Suspense fallback={<DashboardLoadingSkeleton />}>
          <DashboardContent userId={user.id} />
        </Suspense>
      </main>
    </div>
  );
}
