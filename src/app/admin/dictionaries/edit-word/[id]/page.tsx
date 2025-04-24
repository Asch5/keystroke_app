'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getWordDetails, fetchWordById } from '@/lib/actions/dictionaryActions';
import { WordDetails } from '@/lib/actions/dictionaryActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import WordEditForm from '@/components/forms/WordEditForm';

export default function EditWordPage() {
  const params = useParams();
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wordId = params.id as string;

  // Fetch word details
  useEffect(() => {
    async function fetchWordDetails() {
      setIsLoading(true);
      try {
        if (!wordId) return;

        // First, get the word record by ID using a server action
        const wordRecord = await fetchWordById(wordId);

        if (!wordRecord) {
          toast.error('Word not found');
          return;
        }

        // Then get the full word details
        const details = await getWordDetails(wordRecord.word);

        if (details) {
          setWordDetails(details);
        } else {
          toast.error('Word details not found');
        }
      } catch (error) {
        console.error('Error fetching word details:', error);
        toast.error('Failed to load word details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchWordDetails();
  }, [wordId]);

  // If loading, show a loading spinner
  if (isLoading && !wordDetails) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading word details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            Edit Word: {wordDetails?.word.text || 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WordEditForm
            wordId={wordId}
            wordDetails={wordDetails}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
