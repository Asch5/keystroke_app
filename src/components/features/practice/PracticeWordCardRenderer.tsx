'use client';

import { useState, useEffect, useMemo } from 'react';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import type { PracticeWord } from '@/core/domains/user/actions/practice-actions';
import PracticeDebugger from '@/core/infrastructure/monitoring/practiceDebugger';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';
import { WordCard } from './shared';

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
  const safeSettings = useMemo(
    () => ({
      ...settings,
      showDefinitionImages: settings.showDefinitionImages ?? true,
      showPhoneticPronunciation: settings.showPhoneticPronunciation ?? true,
      showPartOfSpeech: settings.showPartOfSpeech ?? true,
      autoPlayAudioOnWordCard: settings.autoPlayAudioOnWordCard ?? true,
    }),
    [settings],
  );

  // Organized debugging using PracticeDebugger
  useEffect(() => {
    if (!currentWord) return;

    const conditionalLogic = {
      shouldShowPhonetic:
        safeSettings.showPhoneticPronunciation && !!currentWord.phonetic,
      shouldShowPartOfSpeech:
        safeSettings.showPartOfSpeech && !!currentWord.partOfSpeech,
      shouldShowAudio: !!currentWord.audioUrl,
      shouldShowImage:
        safeSettings.showDefinitionImages &&
        (!!currentWord.imageId || !!currentWord.imageUrl),
      imageData: {
        hasImageId: !!currentWord.imageId,
        hasImageUrl: !!currentWord.imageUrl,
        ...(currentWord.imageId && { imageId: currentWord.imageId }),
        ...(currentWord.imageUrl && { imageUrl: currentWord.imageUrl }),
      },
      audioData: {
        hasAudioUrl: !!currentWord.audioUrl,
        ...(currentWord.audioUrl && { audioUrl: currentWord.audioUrl }),
      },
    };

    // Use organized debugging system
    PracticeDebugger.logWordCardDebug({
      currentWord,
      settings: safeSettings,
      conditionalLogic,
      finalProps: {},
    }).catch((error) => console.error('Debug logging failed:', error));

    // Keep minimal console logs for immediate debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🃏 WordCard Quick Debug:', {
        word: currentWord.wordText,
        hasAudio: !!currentWord.audioUrl,
        hasImage: !!currentWord.imageId || !!currentWord.imageUrl,
        shouldShowImage: conditionalLogic.shouldShowImage,
      });
    }
  }, [currentWord, settings, safeSettings]);

  // Create word card props
  const wordCardProps = useMemo(
    () =>
      currentWord
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
        : null,
    [currentWord, safeSettings],
  );

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
