'use client';

import { useState, FormEvent } from 'react';
import {
  getWordFromMerriamWebster,
  processAllWords,
  processOneWord,
} from '@/lib/db/processMerriamApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AddNewWordForm() {
  const [loading, setLoading] = useState(false);
  const [word, setWord] = useState('');
  const [dictionaryType, setDictionaryType] = useState('learners');
  const [processOneWordOnly, setProcessOneWordOnly] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!word.trim()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData to match the existing function signature
      const formData = new FormData();
      formData.append('word', word);
      formData.append('dictionaryType', dictionaryType);

      const result = await getWordFromMerriamWebster(
        {
          message: null,
          errors: { word: [] },
        },
        formData,
      );

      if (result.data && result.data.length > 0) {
        if (processOneWordOnly && result.data[0]) {
          // Process only the first word
          await processOneWord(result.data[0]);
        } else {
          // Process all word objects returned from the API
          await processAllWords(result.data);
        }
        // Reset form
        setWord('');
      }
    } catch (error) {
      console.error('Error processing word:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 w-full max-w-md mx-auto">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Add New Word
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="word" className="block text-sm font-medium">
                Word
              </label>
              <Input
                id="word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Enter word"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="dictionaryType"
                className="block text-sm font-medium"
              >
                Dictionary Type
              </label>
              <select
                id="dictionaryType"
                value={dictionaryType}
                onChange={(e) => setDictionaryType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="learners">Learner&apos;s Dictionary</option>
                <option value="intermediate">Intermediate Dictionary</option>
              </select>
            </div>

            <div className="flex items-start space-x-3 rounded-md border p-4">
              <input
                type="checkbox"
                id="processOneWordOnly"
                checked={processOneWordOnly}
                onChange={(e) => setProcessOneWordOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="processOneWordOnly"
                  className="block text-sm font-medium"
                >
                  Process only one word
                </label>
                <p className="text-sm text-gray-500">
                  When enabled, only the first matching word will be processed
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Processing...' : 'Add Word'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
