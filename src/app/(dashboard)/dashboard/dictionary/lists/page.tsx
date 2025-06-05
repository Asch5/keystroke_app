import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';
import { WordListsContent } from '@/components/features/dictionary';

/**
 * Word Lists page component
 *
 * Shows user's personal lists and available public lists
 */
export default async function WordListsPage() {
  // Get user session
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get user data for language preferences
  const userSettings = await getUserSettings();
  const userData = userSettings.user;

  if (!userData) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Word Lists</h1>
          <p className="text-muted-foreground mt-2">
            Manage your vocabulary collections and discover new word lists
          </p>
        </div>

        <Suspense fallback={<div>Loading lists...</div>}>
          <WordListsContent
            userId={session.user.id}
            userLanguages={{
              base: userData.baseLanguageCode,
              target: userData.targetLanguageCode,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
