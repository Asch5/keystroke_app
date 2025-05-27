'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchDictionaryWordDetails,
  type DictionaryWordDetails,
} from '@/core/domains/dictionary/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LanguageCode } from '@prisma/client';

export default function TestWordSelectionPage() {
  const router = useRouter();
  const [wordDetails, setWordDetails] = useState<DictionaryWordDetails[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWords() {
      try {
        const words = await fetchDictionaryWordDetails(LanguageCode.en);
        setWordDetails(words.slice(0, 5)); // Get only first 5 words for testing
      } catch (error) {
        console.error('Error loading words:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadWords();
  }, []);

  const toggleWordSelection = (wordDetailId: string) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordDetailId)) {
      newSelected.delete(wordDetailId);
    } else {
      newSelected.add(wordDetailId);
    }
    setSelectedWords(newSelected);
  };

  const handleCreateWordList = () => {
    console.log('Selected word IDs:', Array.from(selectedWords));

    // Convert selected word detail IDs to definition IDs
    const selectedDefinitionIds = wordDetails
      .filter((word) => selectedWords.has(word.id.toString()))
      .map((word) => {
        console.log(
          `Word: ${word.wordText}, DefinitionId: ${word.definitionId}`,
        );
        return word.definitionId;
      })
      .filter((id) => id !== null) as number[];

    console.log('Selected definition IDs:', selectedDefinitionIds);

    // Navigate to list creation page with selected words
    const params = new URLSearchParams({
      language: LanguageCode.en,
      selectedDefinitions: selectedDefinitionIds.join(','),
    });

    const url = `/admin/dictionaries/create-list?${params.toString()}`;
    console.log('Navigating to:', url);

    router.push(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Word Selection (First 5 English Words)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {wordDetails.map((word) => (
              <div
                key={word.id}
                className="flex items-center space-x-4 p-3 border rounded-lg"
              >
                <Checkbox
                  checked={selectedWords.has(word.id.toString())}
                  onCheckedChange={() =>
                    toggleWordSelection(word.id.toString())
                  }
                />
                <div className="flex-1">
                  <div className="font-medium">{word.wordText}</div>
                  <div className="text-sm text-gray-600">
                    Definition ID: {word.definitionId || 'NULL'} | Word ID:{' '}
                    {word.id}
                  </div>
                  <div className="text-sm text-gray-500">{word.definition}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-600">
              Selected: {selectedWords.size} words
            </div>
            <Button
              onClick={handleCreateWordList}
              disabled={selectedWords.size === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Create Word List ({selectedWords.size})
            </Button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Debug Info:</h3>
            <div className="text-sm space-y-1">
              <div>Total words loaded: {wordDetails.length}</div>
              <div>
                Selected word IDs:{' '}
                {Array.from(selectedWords).join(', ') || 'None'}
              </div>
              <div>
                Definition IDs available:{' '}
                {wordDetails
                  .map((w) => `${w.wordText}:${w.definitionId}`)
                  .join(', ')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
