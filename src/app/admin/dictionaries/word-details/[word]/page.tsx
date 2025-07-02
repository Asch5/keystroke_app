'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  getWordDetails,
  type WordEntryData,
} from '@/core/lib/actions/dictionaryActions';
import { LanguageCode } from '@/core/types';
import { PageWrapper } from '@/components/layouts';
import { WordDetails } from '@/components/features/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function WordDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const word = decodeURIComponent(params.word as string);
  const language =
    (searchParams.get('lang') as LanguageCode) || LanguageCode.en;

  const [wordDetails, setWordDetails] = useState<WordEntryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWordDetails = async () => {
      if (!word) return;

      setLoading(true);
      setError(null);

      try {
        const details = await getWordDetails(word, language);

        if (details) {
          setWordDetails(details);
        } else {
          setError(`Word "${word}" not found in database`);
        }
      } catch (err) {
        console.error('Error fetching word details:', err);
        setError('Failed to fetch word details');
      } finally {
        setLoading(false);
      }
    };

    fetchWordDetails();
  }, [word, language]);

  const handleNavigateToWord = (newWord: string) => {
    // Navigate to the new word's details page
    router.push(
      `/admin/dictionaries/word-details/${encodeURIComponent(newWord)}?lang=${language}`,
    );
  };

  return (
    <PageWrapper title={`Word Details: ${word}`}>
      {loading && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {wordDetails && (
        <WordDetails
          wordDetails={wordDetails}
          onNavigateToWord={handleNavigateToWord}
          selectedLanguageCode={language}
        />
      )}
    </PageWrapper>
  );
}
