import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ListDetailContent } from '@/components/features/dictionary/ListDetailContent';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';

interface ListDetailPageProps {
  params: Promise<{ listId: string }>;
}

/**
 * List Detail Page - Individual list management
 * Route: /dashboard/dictionary/lists/[listId]
 *
 * Allows users to:
 * - View all words in a specific list
 * - Remove words from the list
 * - Search and filter words
 * - View learning progress for the list
 */
export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const { listId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get user settings for language preferences
  const userSettings = await getUserSettings();
  const userData = userSettings.user;

  if (!userData) {
    redirect('/dashboard');
  }

  const userLanguages = {
    base: userData.baseLanguageCode,
    target: userData.targetLanguageCode,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <ListDetailContent
        userId={session.user.id}
        listId={listId}
        userLanguages={userLanguages}
      />
    </div>
  );
}

export async function generateMetadata({ params }: ListDetailPageProps) {
  const { listId } = await params;

  return {
    title: 'List Details - Keystroke App',
    description: `Manage words in your vocabulary list - ${listId}`,
  };
}
