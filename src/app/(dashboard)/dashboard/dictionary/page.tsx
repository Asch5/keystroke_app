import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { DictionaryOverview } from '@/components/features/dictionary';
import { DictionaryErrorBoundary } from '@/components/shared/error-boundaries';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Dictionary Overview Loading Skeleton
 * Provides accessible loading state while dictionary overview is being loaded
 */
function DictionaryOverviewSkeleton() {
  return (
    <div className="space-y-6" role="presentation" aria-hidden="true">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={`dictionary-metric-${i}`} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={`dictionary-section-${i}`} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-40"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }, (_, j) => (
                <div
                  key={`dictionary-item-${j}`}
                  className="h-12 bg-muted rounded"
                ></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Dictionary Overview Page Component
 *
 * Main entry point for dictionary management and vocabulary overview.
 * Provides comprehensive access to user's personal dictionary, learning progress,
 * and navigation to dictionary-related features.
 *
 * Features:
 * - User authentication validation with redirect to login
 * - Comprehensive vocabulary statistics and progress tracking
 * - Quick access to dictionary management functions
 * - Recent learning activity and word additions
 * - Progress visualization and learning insights
 * - Accessible design with proper semantic structure
 * - Responsive layout optimized for all devices
 * - Comprehensive error boundary protection
 *
 * Navigation Options:
 * - Add new words to personal dictionary
 * - Browse and manage word lists
 * - View detailed dictionary entries
 * - Track learning progress and statistics
 *
 * @returns {Promise<JSX.Element>} The dictionary overview page component
 */
export default async function DictionaryPage() {
  // Get user session and validate authentication
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Extract user information for better type safety
  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || 'User',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-6">
        {/* Page Header with Semantic Structure */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Dictionary</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal vocabulary and track your learning progress
          </p>
        </header>

        {/* Main Dictionary Content */}
        <main role="main">
          <DictionaryErrorBoundary>
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-label="Loading dictionary overview"
                  aria-live="polite"
                >
                  <span className="sr-only">
                    Loading your dictionary overview...
                  </span>
                  <DictionaryOverviewSkeleton />
                </div>
              }
            >
              <DictionaryOverview userId={user.id} />
            </Suspense>
          </DictionaryErrorBoundary>
        </main>
      </div>
    </div>
  );
}
