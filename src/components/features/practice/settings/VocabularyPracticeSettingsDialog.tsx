'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Settings, RotateCcw, X } from 'lucide-react';
import { useVocabularyPracticeSettings } from '../hooks/useVocabularyPracticeSettings';
import {
  ExerciseTypeSettings,
  VocabularySessionConfigurationSettings,
  VocabularyTimeSettings,
  VocabularyAudioSettings,
  VocabularyBehaviorSettings,
} from './';

interface VocabularyPracticeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for vocabulary practice settings
 * Provides a full-screen scrollable interface for all vocabulary practice configuration options
 */
export function VocabularyPracticeSettingsDialog({
  open,
  onOpenChange,
}: VocabularyPracticeSettingsDialogProps) {
  const { settings, updateSetting, resetSettings, isLoaded } =
    useVocabularyPracticeSettings();

  if (!isLoaded) {
    return null; // Don't render until settings are loaded
  }

  const handleWordsCountChange = (value: string) => {
    const count = parseInt(value);
    if (!isNaN(count) && count >= 5 && count <= 100) {
      updateSetting('wordsCount', count);
    }
  };

  const handleDifficultyChange = (value: string) => {
    const level = parseInt(value);
    if (!isNaN(level) && level >= 1 && level <= 5) {
      updateSetting('difficultyLevel', level);
    }
  };

  const handleTimeLimitChange = (value: number[]) => {
    if (value[0] !== undefined) {
      updateSetting('timeLimitSeconds', value[0]);
    }
  };

  const handleGameSoundVolumeChange = (value: number[]) => {
    if (value[0] !== undefined) {
      updateSetting('gameSoundVolume', value[0] / 100); // Convert percentage to 0-1
    }
  };

  const handleAutoAdvanceDelayChange = (value: number[]) => {
    if (value[0] !== undefined) {
      updateSetting('autoAdvanceDelaySeconds', value[0]);
    }
  };

  const handleMakeUpWordMaxAttemptsChange = (value: number[]) => {
    if (value[0] !== undefined) {
      updateSetting('makeUpWordMaxAttempts', value[0]);
    }
  };

  const handleExerciseTypeToggle = (
    exerciseType: keyof typeof settings,
    checked: boolean,
  ) => {
    updateSetting(exerciseType, checked);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <div>
                <DialogTitle className="text-xl">
                  Vocabulary Practice Settings
                </DialogTitle>
                <DialogDescription>
                  Customize your vocabulary practice experience with
                  comprehensive options
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSettings}
                className="h-8 px-3"
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                Reset All
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="py-6 space-y-8">
            {/* Exercise Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Exercise Types</h3>
              <ExerciseTypeSettings
                settings={settings}
                onExerciseTypeToggle={handleExerciseTypeToggle}
                onMakeUpWordMaxAttemptsChange={
                  handleMakeUpWordMaxAttemptsChange
                }
              />
            </div>

            <Separator />

            {/* Session Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Session Configuration</h3>
              <VocabularySessionConfigurationSettings
                settings={settings}
                onWordsCountChange={handleWordsCountChange}
                onDifficultyChange={handleDifficultyChange}
                onShowWordCardFirstToggle={(checked) =>
                  updateSetting('showWordCardFirst', checked)
                }
                onAutoAdvanceFromWordCardToggle={(checked) =>
                  updateSetting('autoAdvanceFromWordCard', checked)
                }
                onAutoAdvanceDelayChange={handleAutoAdvanceDelayChange}
              />
            </div>

            <Separator />

            {/* Time Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Time Settings</h3>
              <VocabularyTimeSettings
                settings={settings}
                onTimeLimitToggle={(checked) =>
                  updateSetting('enableTimeLimit', checked)
                }
                onTimeLimitChange={handleTimeLimitChange}
              />
            </div>

            <Separator />

            {/* Audio Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Audio Settings</h3>
              <VocabularyAudioSettings
                settings={settings}
                onAutoPlayAudioOnWordCardToggle={(checked) =>
                  updateSetting('autoPlayAudioOnWordCard', checked)
                }
                onAutoPlayAudioOnGameStartToggle={(checked) =>
                  updateSetting('autoPlayAudioOnGameStart', checked)
                }
                onGameSoundsToggle={(checked) =>
                  updateSetting('enableGameSounds', checked)
                }
                onGameSoundVolumeChange={handleGameSoundVolumeChange}
              />
            </div>

            <Separator />

            {/* Behavior & Display Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Behavior & Display</h3>
              <VocabularyBehaviorSettings
                settings={settings}
                onPauseOnIncorrectAnswerToggle={(checked) =>
                  updateSetting('pauseOnIncorrectAnswer', checked)
                }
                onShowCorrectAnswerOnMistakeToggle={(checked) =>
                  updateSetting('showCorrectAnswerOnMistake', checked)
                }
                onAllowSkipDifficultWordsToggle={(checked) =>
                  updateSetting('allowSkipDifficultWords', checked)
                }
                onAdaptiveDifficultyToggle={(checked) =>
                  updateSetting('adaptiveDifficulty', checked)
                }
                onShowProgressBarToggle={(checked) =>
                  updateSetting('showProgressBar', checked)
                }
                onShowDefinitionImagesToggle={(checked) =>
                  updateSetting('showDefinitionImages', checked)
                }
                onShowPhoneticPronunciationToggle={(checked) =>
                  updateSetting('showPhoneticPronunciation', checked)
                }
                onShowPartOfSpeechToggle={(checked) =>
                  updateSetting('showPartOfSpeech', checked)
                }
                onShowLearningStatusToggle={(checked) =>
                  updateSetting('showLearningStatus', checked)
                }
              />
            </div>

            {/* Settings Summary */}
            <div className="bg-muted/50 rounded-lg p-6 border">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Current Configuration Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Words per session:
                    </span>
                    <span className="font-medium">{settings.wordsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Difficulty level:
                    </span>
                    <span className="font-medium">
                      {settings.difficultyLevel}/5
                    </span>
                  </div>
                  {settings.enableTimeLimit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time limit:</span>
                      <span className="font-medium">
                        {Math.floor(settings.timeLimitSeconds / 60)}:
                        {(settings.timeLimitSeconds % 60)
                          .toString()
                          .padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Active exercises:
                    </span>
                    <span className="font-medium">
                      {
                        [
                          settings.enableRememberTranslation &&
                            'Remember Translation',
                          settings.enableChooseRightWord && 'Choose Right Word',
                          settings.enableMakeUpWord && 'Make Up Word',
                          settings.enableWriteByDefinition &&
                            'Write by Definition',
                          settings.enableWriteBySound && 'Write by Sound',
                        ].filter(Boolean).length
                      }
                      /5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Auto-play audio:
                    </span>
                    <span className="font-medium">
                      {settings.autoPlayAudioOnWordCard
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Show Word Card first:
                    </span>
                    <span className="font-medium">
                      {settings.showWordCardFirst ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom padding for scroll area */}
            <div className="h-4" />
          </div>
        </ScrollArea>

        {/* Footer with action buttons */}
        <div className="border-t px-6 py-4 shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Settings are automatically saved as you change them
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
