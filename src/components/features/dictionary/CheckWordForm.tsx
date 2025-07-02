'use client';

import { useState } from 'react';
import { getWordDetails } from '@/core/lib/actions/dictionaryActions';
import { LanguageCode } from '@/core/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

const formSchema = z.object({
  wordText: z.string().min(1, 'Please enter a word'),
});

export default function CheckWordForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedLanguageCode, setSelectedLanguageCode] =
    useState<LanguageCode>(LanguageCode.en);
  const [lastSearchResult, setLastSearchResult] = useState<{
    word: string;
    found: boolean;
    error?: string;
  } | null>(null);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wordText: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.wordText.trim()) return;

    const searchTerm = values.wordText.trim();
    setLoading(true);
    setLastSearchResult(null);

    try {
      // Check if word exists in database
      const details = await getWordDetails(searchTerm, selectedLanguageCode);

      if (details) {
        // Word found, navigate to word details page
        setLastSearchResult({ word: searchTerm, found: true });

        // Update search history
        setSearchHistory((prev) => {
          const filteredHistory = prev.filter((w) => w !== searchTerm);
          return [searchTerm, ...filteredHistory];
        });
        setHistoryIndex(0);

        // Navigate to word details page
        router.push(
          `/admin/dictionaries/word-details/${encodeURIComponent(searchTerm)}?lang=${selectedLanguageCode}`,
        );
      } else {
        // Word not found
        setLastSearchResult({
          word: searchTerm,
          found: false,
          error: `Word "${searchTerm}" not found in database`,
        });
      }
    } catch (err) {
      console.error('Error checking word:', err);
      setLastSearchResult({
        word: searchTerm,
        found: false,
        error: 'Failed to check word in database',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateHistory = (direction: 'back' | 'forward') => {
    if (searchHistory.length === 0) return;

    let newIndex;
    if (direction === 'back') {
      newIndex = Math.max(historyIndex - 1, 0);
    } else {
      newIndex = Math.min(historyIndex + 1, searchHistory.length - 1);
    }

    setHistoryIndex(newIndex);
    const word = searchHistory[newIndex];
    if (word) {
      form.setValue('wordText', word);
      onSubmit({ wordText: word });
    }
  };

  return (
    <div className="mt-10 border-t pt-10 border-border">
      <h2 className="text-2xl font-bold mb-6 text-center">Word Checker</h2>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-xl mx-auto mb-8 space-y-4"
        >
          <FormField
            control={form.control}
            name="wordText"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter word to check"
                      className="flex-1"
                      {...field}
                    />
                    <Select
                      value={selectedLanguageCode}
                      onValueChange={(value) =>
                        setSelectedLanguageCode(value as LanguageCode)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(LanguageCode).map((langCode) => (
                          <SelectItem key={langCode} value={langCode}>
                            {langCode.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Checking...' : 'Check word'}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Search result status */}
          {lastSearchResult && !loading && (
            <div className="flex justify-center">
              <Badge
                variant={lastSearchResult.found ? 'default' : 'destructive'}
                className="flex items-center gap-2"
              >
                {lastSearchResult.found ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {lastSearchResult.found
                  ? `"${lastSearchResult.word}" found! Redirecting...`
                  : lastSearchResult.error}
              </Badge>
            </div>
          )}

          {searchHistory.length > 1 && (
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateHistory('back')}
                disabled={historyIndex <= 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                {historyIndex + 1} of {searchHistory.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateHistory('forward')}
                disabled={historyIndex >= searchHistory.length - 1}
              >
                Next
              </Button>
            </div>
          )}
        </form>
      </Form>

      {loading && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <Card className="max-w-xl mx-auto mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold text-center">
              Recent Searches
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              {searchHistory.slice(0, 10).map((word, index) => (
                <Button
                  key={word}
                  variant={index === historyIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    form.setValue('wordText', word);
                    onSubmit({ wordText: word });
                  }}
                  className="text-xs"
                >
                  {word}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
