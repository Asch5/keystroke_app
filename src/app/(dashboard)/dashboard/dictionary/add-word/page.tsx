import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { AddNewWordContent } from '@/components/features/dictionary';
import { DictionaryErrorBoundary } from '@/components/shared/error-boundaries';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getUserByEmail } from '@/core/lib/db/user';

/**
 * Add New Word Loading Skeleton
 * Provides accessible loading state while word search interface is being loaded
 */
function AddNewWordSkeleton() {
  return (
    <div className="space-y-6" role="presentation" aria-hidden="true">
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-muted rounded w-full"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-muted rounded w-24"></div>
            <div className="h-10 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Add New Word Page Component
 *
 * Provides interface for searching and adding words to user's personal dictionary.
 * Enables users to discover new vocabulary from the comprehensive word database
 * and build their personalized learning collection.
 *
 * Features:
 * - User authentication validation with redirect to login
 * - Word search functionality with real-time results
 * - Language-aware search based on user preferences
 * - Detailed word definitions and usage examples
 * - One-click addition to personal dictionary
 * - Integration with user's learning progress tracking
 * - Accessible design with proper semantic structure
 * - Responsive interface optimized for all devices
 * - Comprehensive error boundary protection
 *
 * User Context:
 * - Retrieves user language preferences (base/target languages)
 * - Personalizes search results based on learning goals
 * - Maintains context for translation and definition display
 *
 * @returns {Promise<JSX.Element>} The add new word page component
 */
export default async function AddNewWordPage() {
  // Get user session and validate authentication
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Get full user data from database to access language codes and preferences
  const user = await getUserByEmail(session.user.email);

  if (!user) {
    redirect('/login');
  }

  // Extract user information for better type safety and component props
  const userContext = {
    id: user.id,
    name: user.name || 'User',
    email: user.email,
    baseLanguageCode: user.baseLanguageCode,
    targetLanguageCode: user.targetLanguageCode,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-6">
        {/* Page Header with Semantic Structure */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Add New Word</h1>
          <p className="text-muted-foreground mt-2">
            Search for words in our dictionary and add them to your personal
            vocabulary collection
          </p>
        </header>

        {/* Main Word Search and Addition Content */}
        <main role="main">
          <DictionaryErrorBoundary>
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-label="Loading word search interface"
                  aria-live="polite"
                >
                  <span className="sr-only">
                    Loading word search and addition interface...
                  </span>
                  <AddNewWordSkeleton />
                </div>
              }
            >
              <AddNewWordContent
                userId={userContext.id}
                baseLanguageCode={userContext.baseLanguageCode}
                targetLanguageCode={userContext.targetLanguageCode}
              />
            </Suspense>
          </DictionaryErrorBoundary>
        </main>
      </div>
    </div>
  );
}
