import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { MyDictionaryContent } from '@/components/features/dictionary';
import { MyDictionaryLoadingSkeleton } from '@/components/utils/skeletons/MyDictionaryLoadingSkeleton';

/**
 * My Dictionary page component
 *
 * Displays a user's personal dictionary with comprehensive filtering, sorting, and management features
 */
export default async function MyDictionaryPage() {
  // Get user session
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dictionary</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal vocabulary collection and track your learning
            progress
          </p>
        </div>

        <Suspense fallback={<MyDictionaryLoadingSkeleton />}>
          <MyDictionaryContent userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
