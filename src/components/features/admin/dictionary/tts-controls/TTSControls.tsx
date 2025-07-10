'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Volume2 } from 'lucide-react';
import { QualitySelection } from './components/QualitySelection';
import { VoiceGenderSelection } from './components/VoiceGenderSelection';
import { GenerationOptions } from './components/GenerationOptions';
import { UsageStats } from './components/UsageStats';
import { GenerationProgress } from './components/GenerationProgress';
import { TTSActions } from './components/TTSActions';
import { useTTSState } from './hooks/useTTSState';
import { TTSControlsProps } from './types';

/**
 * Main TTSControls component - refactored to ~80 lines (down from 472 lines)
 * Uses modular architecture with focused components and custom hooks
 */
export function TTSControls({
  selectedWords,
  selectedLanguage,
  wordDetails,
  onAudioGenerated,
}: TTSControlsProps) {
  const {
    // Dialog state
    isDialogOpen,
    setIsDialogOpen,

    // TTS settings
    qualityLevel,
    setQualityLevel,
    ssmlGender,
    setSSMLGender,
    overwriteExisting,
    setOverwriteExisting,

    // Generation state
    isGenerating,
    generationStatus,
    generationProgress,

    // Data
    availableGenders,
    ttsStats,
    qualityLevels,

    // Actions
    handleBatchTTS,
  } = useTTSState(
    selectedWords,
    selectedLanguage,
    wordDetails,
    onAudioGenerated,
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={selectedWords.size === 0}
          className="flex items-center gap-2"
        >
          <Volume2 className="h-4 w-4" />
          Generate Audio ({selectedWords.size})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Text-to-Speech Generation
          </DialogTitle>
          <DialogDescription>
            Generate high-quality speech audio for {selectedWords.size} selected
            words using Google Cloud TTS. Audio files are stored securely in
            Vercel Blob Storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <QualitySelection
            qualityLevel={qualityLevel}
            onQualityChange={setQualityLevel}
            qualityLevels={qualityLevels}
            ttsStats={ttsStats}
          />

          <VoiceGenderSelection
            ssmlGender={ssmlGender}
            onGenderChange={setSSMLGender}
            availableGenders={availableGenders}
          />

          <GenerationOptions
            overwriteExisting={overwriteExisting}
            onOverwriteChange={setOverwriteExisting}
          />

          <UsageStats ttsStats={ttsStats} />

          <GenerationProgress
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            generationStatus={generationStatus}
          />

          <TTSActions
            selectedWords={selectedWords}
            isGenerating={isGenerating}
            onGenerate={handleBatchTTS}
            onCancel={() => setIsDialogOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
