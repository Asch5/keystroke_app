import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { MyDictionaryContent } from '@/components/features/dictionary';
import { MyDictionaryLoadingSkeleton } from '@/components/utils/skeletons/MyDictionaryLoadingSkeleton';

/**
 * My Dictionary Page Component
 *
 * Comprehensive interface for managing and browsing user's personal vocabulary
 * collection. Provides advanced filtering, sorting, and search capabilities
 * for efficient dictionary management and learning progress tracking.
 *
 * Features:
 * - User authentication validation with redirect to login
 * - Complete personal dictionary management interface
 * - Advanced search and filtering by multiple criteria
 * - Flexible sorting options (alphabetical, date added, difficulty)
 * - Learning progress tracking and statistics
 * - Word detail editing and management
 * - Bulk operations for list management
 * - Export and import capabilities
 * - Accessible design with proper semantic structure
 * - Responsive layout optimized for all devices
 * - Pagination for large vocabulary collections
 *
 * Dictionary Management:
 * - View all personal vocabulary with detailed information
 * - Edit word definitions, examples, and notes
 * - Track learning status and progress levels
 * - Organize words into custom categories
 * - Manage difficulty ratings and practice frequency
 *
 * Search and Filter Options:
 * - Text search across words and definitions
 * - Filter by learning status, difficulty, date added
 * - Sort by various criteria for efficient browsing
 * - Quick access to recently added or studied words
 *
 * @returns {Promise<JSX.Element>} The my dictionary page component
 */
export default async function MyDictionaryPage() {
  // Get user session and validate authentication
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Extract user information for better type safety
  const user = {
    id: session.user.id,
    name: session.user.name || 'User',
    email: session.user.email,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-6">
        {/* Page Header with Semantic Structure */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">My Dictionary</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal vocabulary collection and track your learning
            progress
          </p>
        </header>

        {/* Main Dictionary Management Content */}
        <main role="main">
          <Suspense
            fallback={
              <div
                role="status"
                aria-label="Loading your personal dictionary"
                aria-live="polite"
              >
                <span className="sr-only">
                  Loading your personal dictionary and vocabulary management
                  tools...
                </span>
                <MyDictionaryLoadingSkeleton />
              </div>
            }
          >
            <MyDictionaryContent userId={user.id} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
