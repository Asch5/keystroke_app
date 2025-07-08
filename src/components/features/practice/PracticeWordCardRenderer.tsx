'use client';

import { useState, useEffect } from 'react';
import { WordCard } from './shared';
import type { PracticeWord } from '@/core/domains/user/actions/practice-actions';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';
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
  autoPlayAudio,
}: PracticeWordCardRendererProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Ensure settings have proper defaults (temporary fix for initialization issues)
  const safeSettings = {
    ...settings,
    showDefinitionImages: settings.showDefinitionImages ?? true,
    showPhoneticPronunciation: settings.showPhoneticPronunciation ?? true,
    showPartOfSpeech: settings.showPartOfSpeech ?? true,
    autoPlayAudioOnWordCard: settings.autoPlayAudioOnWordCard ?? true,
  };

  // Debug logging for current word and settings
  useEffect(() => {
    if (!currentWord) return;

    console.log('🃏 WordCard Debug - Current Word:', {
      wordText: currentWord.wordText,
      definition: currentWord.definition,
      audioUrl: currentWord.audioUrl,
      imageId: currentWord.imageId,
      imageUrl: currentWord.imageUrl,
      phonetic: currentWord.phonetic,
      partOfSpeech: currentWord.partOfSpeech,
      imageDescription: currentWord.imageDescription,
    });

    console.log('🃏 WordCard Debug - Settings:', {
      showDefinitionImages: safeSettings.showDefinitionImages,
      showPhoneticPronunciation: safeSettings.showPhoneticPronunciation,
      showPartOfSpeech: safeSettings.showPartOfSpeech,
      autoPlayAudioOnWordCard: safeSettings.autoPlayAudioOnWordCard,
      originalSettings: settings,
      safeSettings: safeSettings,
    });

    // Debug the conditional rendering logic
    console.log('🎯 WordCard Debug - Conditional Logic:', {
      shouldShowPhonetic:
        safeSettings.showPhoneticPronunciation && !!currentWord.phonetic,
      shouldShowPartOfSpeech:
        safeSettings.showPartOfSpeech && !!currentWord.partOfSpeech,
      shouldShowAudio: !!currentWord.audioUrl,
      shouldShowImage:
        safeSettings.showDefinitionImages &&
        (!!currentWord.imageId || !!currentWord.imageUrl),
    });
  }, [currentWord, settings, safeSettings]);

  // Create word card props
  const wordCardProps = currentWord
    ? {
        wordText: currentWord.wordText,
        definition: currentWord.definition,
        oneWordTranslation: currentWord.oneWordTranslation || '',
        // Only include phonetic if setting is enabled AND data exists
        ...(safeSettings.showPhoneticPronunciation &&
          currentWord.phonetic && {
            phonetic: currentWord.phonetic,
          }),
        // Only include part of speech if setting is enabled AND data exists
        ...(safeSettings.showPartOfSpeech &&
          currentWord.partOfSpeech && {
            partOfSpeech: currentWord.partOfSpeech,
          }),
        learningStatus: currentWord.learningStatus,
        // Always include audio if available
        ...(currentWord.audioUrl && {
          audioUrl: currentWord.audioUrl,
        }),
        // Only include image if setting is enabled AND data exists
        ...(safeSettings.showDefinitionImages &&
          (currentWord.imageId || currentWord.imageUrl) && {
            ...(currentWord.imageId && { imageId: currentWord.imageId }),
            ...(currentWord.imageUrl && { imageUrl: currentWord.imageUrl }),
            ...(currentWord.imageDescription && {
              imageDescription: currentWord.imageDescription,
            }),
          }),
      }
    : null;

  // Debug log final props being passed to WordCard
  useEffect(() => {
    if (wordCardProps) {
      console.log('🎯 WordCard Final Props:', wordCardProps);
    }
  }, [wordCardProps]);

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

  return (
    <WordCard
      word={wordCardProps!}
      onNext={onNext}
      onPlayAudio={handlePlayAudio}
      isPlayingAudio={isPlayingAudio}
      autoPlayAudio={autoPlayAudio ?? safeSettings.autoPlayAudioOnWordCard}
      className="w-full"
    />
  );
}
