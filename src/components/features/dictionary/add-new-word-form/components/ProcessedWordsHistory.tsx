import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProcessedWord } from '../types';

interface ProcessedWordsHistoryProps {
  processedWords: ProcessedWord[];
  onClearHistory: () => void;
}

/**
 * Component for displaying the history of processed words
 * Shows success/failure status and timestamps
 */
export function ProcessedWordsHistory({
  processedWords,
  onClearHistory,
}: ProcessedWordsHistoryProps) {
  if (processedWords.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Processed Words</CardTitle>
        <Button onClick={onClearHistory} variant="outline" size="sm">
          Clear History
        </Button>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {processedWords.map((processedWord, index) => (
            <div key={index} className="py-2 flex justify-between items-center">
              <div>
                <span className="font-medium">{processedWord.word}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {processedWord.timestamp.toLocaleTimeString()}
                </span>
                {processedWord.language && (
                  <Badge variant="outline" className="ml-2">
                    {processedWord.language === 'en' ? 'EN' : 'DA'}
                  </Badge>
                )}
              </div>
              <Badge
                variant={
                  processedWord.status === 'added' ? 'default' : 'secondary'
                }
              >
                {processedWord.status === 'added' ? 'Added' : 'Existed'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
