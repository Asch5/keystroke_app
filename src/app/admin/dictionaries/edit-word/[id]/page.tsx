'use client';

import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminWordDetailEditForm } from '@/components/features/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchWordDetailById,
  type WordDetailEditData,
} from '@/core/domains/dictionary/actions';

export default function EditWordDetailPage() {
  const params = useParams();
  const [wordDetailData, setWordDetailData] =
    useState<WordDetailEditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wordDetailId = params.id as string;

  // Fetch word detail data
  useEffect(() => {
    async function fetchWordDetailData() {
      setIsLoading(true);
      setError(null);

      try {
        if (!wordDetailId || isNaN(Number(wordDetailId))) {
          throw new Error('Invalid WordDetail ID');
        }

        const data = await fetchWordDetailById(Number(wordDetailId));

        if (!data) {
          throw new Error('WordDetail not found');
        }

        setWordDetailData(data);
      } catch (error) {
        console.error('Error fetching WordDetail:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load WordDetail';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchWordDetailData();
  }, [wordDetailId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading WordDetail...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !wordDetailData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-error-foreground">
              Error Loading WordDetail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || 'WordDetail data is not available'}
            </p>
            <div className="mt-4">
              <a
                href="/admin/dictionaries"
                className="text-info-foreground hover:underline"
              >
                ← Back to Dictionary
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the edit form
  return <AdminWordDetailEditForm wordDetailId={Number(wordDetailId)} />;
}
