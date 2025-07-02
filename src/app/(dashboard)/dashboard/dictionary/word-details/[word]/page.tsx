import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { LanguageCode } from '@/core/types';
import { WordDetailsPageContent } from '@/components/features/dictionary/WordDetailsPageContent';
import { DictionaryLoadingSkeleton } from '@/components/features/dictionary/DictionaryLoadingSkeleton';
import { auth } from '@/core/lib/auth/config';

interface WordDetailsPageProps {
  params: Promise<{
    word: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
}

/**
 * Word Details Page
 *
 * Displays comprehensive word information on a dedicated page
 * with navigation between related words and dictionary actions
 */
export default async function WordDetailsPage({
  params,
  searchParams,
}: WordDetailsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Await the async params and searchParams
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const word = decodeURIComponent(resolvedParams.word);
  const languageCode =
    (resolvedSearchParams.lang as LanguageCode) || LanguageCode.en;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<DictionaryLoadingSkeleton />}>
        <WordDetailsPageContent
          word={word}
          languageCode={languageCode}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
