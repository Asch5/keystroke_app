'use client';

import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWordDetails } from '@/core/domains/dictionary/actions';
import type { WordEntryData } from '@/core/domains/dictionary/actions';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';
import { LanguageCode } from '@/core/types';
import { WordDetails } from '../admin/dictionary';

interface WordDetailsPageContentProps {
  word: string;
  languageCode: LanguageCode;
  userId: string;
}

/**
 * WordDetailsPageContent component handles the display of comprehensive
 * word information on a dedicated page with navigation capabilities
 */
export function WordDetailsPageContent({
  word,
  languageCode,
  userId,
}: WordDetailsPageContentProps) {
  const router = useRouter();
  const [wordData, setWordData] = useState<WordEntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLanguages, setUserLanguages] = useState<{
    base: LanguageCode;
    target: LanguageCode;
  }>({
    base: LanguageCode.en,
    target: languageCode,
  });

  // Load word details and user settings
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load word details and user settings in parallel
        const [wordResult, userSettingsResult] = await Promise.all([
          getWordDetails(word, languageCode),
          getUserSettings().catch(() => null), // Don't fail if user settings can't be loaded
        ]);

        if (wordResult) {
          setWordData(wordResult);
        } else {
          setError('Word not found');
        }

        // Set user languages from settings if available
        if (userSettingsResult?.user) {
          setUserLanguages({
            base: userSettingsResult.user.baseLanguageCode,
            target: userSettingsResult.user.targetLanguageCode,
          });
        }
      } catch (err) {
        console.error('Error loading word details:', err);
        setError('Failed to load word details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [word, languageCode]);

  // Handle navigation to other words
  const handleNavigateToWord = (newWord: string) => {
    const params = new URLSearchParams();
    params.set('lang', languageCode);
    router.push(
      `/dashboard/dictionary/word-details/${encodeURIComponent(newWord)}?${params.toString()}`,
    );
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading word details...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!wordData) {
    return (
      <Card>
        <CardHeader>
          <Button variant="ghost" onClick={handleBack} className="mb-4 w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <CardTitle>Word not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The word &ldquo;{word}&rdquo; was not found in the dictionary.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and language info */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dictionary
        </Button>
        <Badge variant="outline">{languageCode.toUpperCase()}</Badge>
      </div>

      {/* Word Details Component with enhanced functionality */}
      <WordDetails
        wordDetails={wordData}
        onNavigateToWord={handleNavigateToWord}
        selectedLanguageCode={languageCode}
        userId={userId}
        showDictionaryActions={true}
        userLanguages={userLanguages}
      />
    </div>
  );
}
