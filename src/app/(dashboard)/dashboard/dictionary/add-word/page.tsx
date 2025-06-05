import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AddNewWordContent } from '@/components/features/dictionary';
import { getUserByEmail } from '@/core/lib/db/user';

/**
 * Add New Word page component
 *
 * Allows users to search for words in the database and add them to their personal dictionary
 */
export default async function AddNewWordPage() {
  // Get user session
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Get full user data from database to access language codes
  const user = await getUserByEmail(session.user.email);

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Word</h1>
          <p className="text-muted-foreground mt-2">
            Search for words in our dictionary and add them to your personal
            vocabulary collection
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <AddNewWordContent
            userId={user.id}
            baseLanguageCode={user.baseLanguageCode}
            targetLanguageCode={user.targetLanguageCode}
          />
        </Suspense>
      </div>
    </div>
  );
}
