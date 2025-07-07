'use client';

import { useState } from 'react';
import { WordCard } from './shared';
import type { PracticeWord } from '@/core/domains/user/actions/practice-actions';
import type { VocabularyPracticeSettings } from './hooks/useVocabularyPracticeSettings';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';

interface PracticeWordCardRendererProps {
  currentWord: PracticeWord;
  settings: VocabularyPracticeSettings;
  onNext: () => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
}

/**
 * Renders the WordCard component for practice sessions
 * Handles word card display with proper props mapping and audio functionality
 */
export function PracticeWordCardRenderer({
  currentWord,
  settings,
  onNext,
  onAudioPlay,
  autoPlayAudio = true,
}: PracticeWordCardRendererProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!currentWord) return null;

  // Handle audio playback
  const handlePlayAudio = async (word: string, audioUrl?: string) => {
    if (!audioUrl) return;

    try {
      setIsPlayingAudio(true);

      // Use the provided onAudioPlay callback if available
      if (onAudioPlay) {
        onAudioPlay(word, audioUrl);
      } else {
        // Otherwise, use AudioService directly
        await AudioService.playAudioFromDatabase(audioUrl);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      // Reset playing state after a short delay
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 1000);
    }
  };

  // Create a word object with required properties, ensuring no undefined values
  const wordCardProps = {
    wordText: currentWord.wordText,
    definition: currentWord.definition,
    oneWordTranslation: currentWord.oneWordTranslation || '',
    phonetic: settings.showPhoneticPronunciation
      ? currentWord.phonetic || ''
      : '',
    partOfSpeech: settings.showPartOfSpeech
      ? currentWord.partOfSpeech || ''
      : '',
    learningStatus: currentWord.learningStatus,
    audioUrl: currentWord.audioUrl || '',
    imageId: settings.showDefinitionImages ? currentWord.imageId || 0 : 0,
    imageUrl: settings.showDefinitionImages ? currentWord.imageUrl || '' : '',
    imageDescription: currentWord.imageDescription || '',
  };

  return (
    <WordCard
      word={wordCardProps}
      onNext={onNext}
      onPlayAudio={handlePlayAudio}
      isPlayingAudio={isPlayingAudio}
      autoPlayAudio={autoPlayAudio}
      className="w-full"
    />
  );
}
