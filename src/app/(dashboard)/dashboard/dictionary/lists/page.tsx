import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { WordListsContent } from '@/components/features/dictionary';
import { DictionaryErrorBoundary } from '@/components/shared/error-boundaries';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';

/**
 * Word Lists Loading Skeleton
 * Provides accessible loading state while word lists are being loaded
 */
function WordListsSkeleton() {
  return (
    <div className="space-y-6" role="presentation" aria-hidden="true">
      {/* Lists Header and Filters Skeleton */}
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="h-10 bg-muted rounded w-32"></div>
            <div className="h-10 bg-muted rounded w-32"></div>
            <div className="h-10 bg-muted rounded w-24"></div>
          </div>
        </CardContent>
      </Card>

      {/* Lists Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={`word-list-${i}`} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-32"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Word Lists Page Component
 *
 * Comprehensive interface for managing vocabulary collections and discovering
 * new word lists. Provides access to personal lists, public community lists,
 * and curated educational content.
 *
 * Features:
 * - User authentication validation with redirect to login
 * - Personal word list management and organization
 * - Discovery of public and community-created lists
 * - Language-aware filtering based on user preferences
 * - List creation, editing, and sharing capabilities
 * - Progress tracking for list-based learning
 * - Search and filtering functionality
 * - Accessible design with proper semantic structure
 * - Responsive grid layout optimized for all devices
 * - Comprehensive error boundary protection
 *
 * List Types:
 * - Personal Lists: User-created vocabulary collections
 * - Public Lists: Curated educational word lists
 * - Community Lists: Shared lists from other users
 * - Featured Lists: Highlighted high-quality content
 *
 * User Context:
 * - Retrieves user language preferences for appropriate filtering
 * - Maintains learning progress and list completion status
 * - Personalizes recommendations based on user level
 *
 * @returns {Promise<JSX.Element>} The word lists page component
 */
export default async function WordListsPage() {
  // Get user session and validate authentication
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get user settings and language preferences for list filtering
  const userSettings = await getUserSettings();
  const userData = userSettings.user;

  if (!userData) {
    redirect('/dashboard');
  }

  // Extract user information for better type safety and component props
  const userContext = {
    id: session.user.id,
    name: session.user.name ?? 'User',
    email: session.user.email,
    languages: {
      base: userData.baseLanguageCode,
      target: userData.targetLanguageCode,
    },
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-6">
        {/* Page Header with Semantic Structure */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Word Lists</h1>
          <p className="text-muted-foreground mt-2">
            Manage your vocabulary collections and discover new word lists
          </p>
        </header>

        {/* Main Word Lists Content */}
        <main role="main">
          <DictionaryErrorBoundary>
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-label="Loading word lists"
                  aria-live="polite"
                >
                  <span className="sr-only">
                    Loading your word lists and available collections...
                  </span>
                  <WordListsSkeleton />
                </div>
              }
            >
              <WordListsContent
                userId={userContext.id}
                userLanguages={userContext.languages}
              />
            </Suspense>
          </DictionaryErrorBoundary>
        </main>
      </div>
    </div>
  );
}
