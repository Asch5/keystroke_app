import React from 'react';
import { LanguageCode } from '@/core/types';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import {
  WordDetailsHeader,
  WordDetailsMetadata,
  WordDetailsPartOfSpeech,
  WordDetailsRelatedWords,
} from '.';
import type {
  WordPartOfSpeechDetails,
  WordEntryData,
} from '@/core/lib/actions/dictionaryActions';

interface WordDetailsProps {
  wordDetails: WordEntryData;
  onNavigateToWord?: (word: string) => void;
  selectedLanguageCode?: LanguageCode;
  userId?: string;
  showDictionaryActions?: boolean;
  userLanguages?: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

/**
 * WordDetails component displays comprehensive word information including
 * header, metadata, part of speech sections, and related words.
 *
 * This component has been refactored into smaller, focused components
 * following the Cursor Rules for component modularity (<400 lines).
 *
 * Components breakdown:
 * - WordDetailsHeader: Word title, phonetic, and primary audio
 * - WordDetailsMetadata: Language and frequency information
 * - WordDetailsPartOfSpeech: Individual POS sections with definitions
 * - WordDetailsRelatedWords: Related words organized by categories
 * - WordDetailsDefinitions: Definitions with examples and formatting
 *
 * @param wordDetails - The complete word entry data
 * @param onNavigateToWord - Optional callback for word navigation
 * @param selectedLanguageCode - Language for translation tooltips (defaults to English)
 */
export default function WordDetails({
  wordDetails,
  onNavigateToWord,
  selectedLanguageCode = LanguageCode.en,
  userId,
  showDictionaryActions = false,
  userLanguages,
}: WordDetailsProps) {
  return (
    <Card className="max-w-4xl mx-auto">
      {/* Word header with title, phonetic, and primary audio */}
      <WordDetailsHeader wordDetails={wordDetails} />

      <CardContent className="space-y-6">
        {/* Language and frequency metadata */}
        <WordDetailsMetadata wordDetails={wordDetails} />

        {/* Part of speech sections with definitions and relations */}
        <Accordion type="multiple" className="w-full space-y-4">
          {wordDetails.details.map((detail: WordPartOfSpeechDetails) => (
            <WordDetailsPartOfSpeech
              key={detail.id}
              detail={detail}
              selectedLanguageCode={selectedLanguageCode}
              onNavigateToWord={onNavigateToWord || (() => {})}
              {...(userId && { userId })}
              showDictionaryActions={showDictionaryActions && !!userId}
              {...(userLanguages && { userLanguages })}
            />
          ))}
        </Accordion>

        {/* Related words and forms */}
        <WordDetailsRelatedWords
          wordDetails={wordDetails}
          onNavigateToWord={onNavigateToWord || (() => {})}
        />
      </CardContent>
    </Card>
  );
}
