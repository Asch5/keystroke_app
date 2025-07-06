'use client';

import { WordCard } from './shared';
import type { PracticeWord } from '@/core/domains/user/actions/practice-actions';

interface PracticeWordCardRendererProps {
  currentWord: PracticeWord;
  onNext: () => void;
}

/**
 * Renders the WordCard component for practice sessions
 * Handles word card display with proper props mapping
 */
export function PracticeWordCardRenderer({
  currentWord,
  onNext,
}: PracticeWordCardRendererProps) {
  if (!currentWord) return null;

  // Create a word object with required properties, ensuring no undefined values
  const wordCardProps = {
    wordText: currentWord.wordText,
    definition: currentWord.definition,
    oneWordTranslation: currentWord.oneWordTranslation || '',
    phonetic: currentWord.phonetic || '',
    partOfSpeech: currentWord.partOfSpeech || '',
    learningStatus: currentWord.learningStatus,
    audioUrl: currentWord.audioUrl || '',
    imageId: currentWord.imageId || 0,
    imageUrl: currentWord.imageUrl || '',
    imageDescription: currentWord.imageDescription || '',
  };

  return <WordCard word={wordCardProps} onNext={onNext} className="w-full" />;
}
