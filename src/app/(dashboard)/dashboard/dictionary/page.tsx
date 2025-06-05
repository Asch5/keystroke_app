import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DictionaryOverview } from '@/components/features/dictionary';

/**
 * Dictionary main page component
 *
 * Provides an overview of the user's dictionary and navigation to different dictionary features
 */
export default async function DictionaryPage() {
  // Get user session
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dictionary</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal vocabulary and track your learning progress
          </p>
        </div>

        <Suspense fallback={<div>Loading dictionary...</div>}>
          <DictionaryOverview userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
