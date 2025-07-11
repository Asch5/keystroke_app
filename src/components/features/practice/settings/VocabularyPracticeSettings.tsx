'use client';

import { Settings, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useVocabularyPracticeSettings } from '@/core/shared/hooks/useSettings';
import { cn } from '@/lib/utils';
import {
  ExerciseTypeSettings,
  VocabularySessionConfigurationSettings,
  VocabularyTimeSettings,
  VocabularyAudioSettings,
  VocabularyBehaviorSettings,
} from './';

interface VocabularyPracticeSettingsProps {
  className?: string;
  defaultOpen?: boolean;
}

/**
 * Main settings panel for vocabulary practice
 * Provides comprehensive options for vocabulary practice customization
 */
export function VocabularyPracticeSettings({
  className,
  defaultOpen = true,
}: VocabularyPracticeSettingsProps) {
  const { settings, updateSetting, resetSettings, isLoaded } =
    useVocabularyPracticeSettings();
  const [isOpen, setIsOpen] = useState(defaultOpen);

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

  const handleMakeUpWordTimeLimitChange = (value: number[]) => {
    if (value[0] !== undefined) {
      updateSetting('makeUpWordTimeLimit', value[0]);
    }
  };

  const handleMakeUpWordAdditionalCharactersChange = (value: number[]) => {
    if (value[0] !== undefined) {
      updateSetting('makeUpWordAdditionalCharacters', value[0]);
    }
  };

  const handleExerciseTypeToggle = (
    exerciseType: keyof typeof settings,
    checked: boolean,
  ) => {
    updateSetting(exerciseType, checked);
  };

  return (
    <div className={cn('w-full', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            type="button"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Vocabulary Practice Settings
            </div>
            <span className="text-xs text-muted-foreground">
              {isOpen ? 'Hide' : 'Show'}
            </span>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Vocabulary Practice Preferences
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetSettings}
                  className="h-8 px-3"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Reset
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Exercise Type Selection */}
              <ExerciseTypeSettings
                settings={settings}
                onExerciseTypeToggle={handleExerciseTypeToggle}
                onMakeUpWordMaxAttemptsChange={
                  handleMakeUpWordMaxAttemptsChange
                }
                onMakeUpWordTimeLimitChange={handleMakeUpWordTimeLimitChange}
                onMakeUpWordAdditionalCharactersChange={
                  handleMakeUpWordAdditionalCharactersChange
                }
              />

              <Separator />

              {/* Session Configuration */}
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

              <Separator />

              {/* Time Settings */}
              <VocabularyTimeSettings
                settings={settings}
                onTimeLimitToggle={(checked) =>
                  updateSetting('enableTimeLimit', checked)
                }
                onTimeLimitChange={handleTimeLimitChange}
              />

              <Separator />

              {/* Audio Settings */}
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

              <Separator />

              {/* Behavior & Display Settings */}
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

              {/* Settings Summary */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Current Configuration</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>Words per session: {settings.wordsCount}</p>
                  <p>Difficulty level: {settings.difficultyLevel}/5</p>
                  <p>
                    Active exercises:{' '}
                    {[
                      settings.enableRememberTranslation &&
                        'Remember Translation',
                      settings.enableChooseRightWord && 'Choose Right Word',
                      settings.enableMakeUpWord && 'Make Up Word',
                      settings.enableWriteByDefinition && 'Write by Definition',
                      settings.enableWriteBySound && 'Write by Sound',
                    ]
                      .filter(Boolean)
                      .join(', ') ?? 'None selected'}
                  </p>
                  {settings.enableTimeLimit && (
                    <p>
                      Time limit: {Math.floor(settings.timeLimitSeconds / 60)}:
                      {(settings.timeLimitSeconds % 60)
                        .toString()
                        .padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
