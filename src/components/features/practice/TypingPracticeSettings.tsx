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
import { useTypingPracticeSettings } from '@/core/shared/hooks/useSettings';
import { cn } from '@/core/shared/utils/common/cn';
import {
  SessionConfigurationSettings,
  TimeSettings,
  AudioSoundSettings,
  BehaviorDisplaySettings,
  SettingsSummary,
} from './settings';

interface TypingPracticeSettingsProps {
  className?: string;
}

/**
 * Settings panel for typing practice
 * Provides comprehensive options for practice customization
 */
export function TypingPracticeSettings({
  className,
}: TypingPracticeSettingsProps) {
  const { settings, updateSetting, resetSettings, isLoaded } =
    useTypingPracticeSettings();
  const [isOpen, setIsOpen] = useState(false);

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
              Practice Settings
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
                <CardTitle className="text-lg">Practice Preferences</CardTitle>
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
              {/* Session Configuration */}
              <SessionConfigurationSettings
                settings={settings}
                onWordsCountChange={handleWordsCountChange}
                onDifficultyChange={handleDifficultyChange}
              />

              <Separator />

              {/* Time Settings */}
              <TimeSettings
                settings={settings}
                onTimeLimitToggle={(checked) =>
                  updateSetting('enableTimeLimit', checked)
                }
                onTimeLimitChange={handleTimeLimitChange}
              />

              <Separator />

              {/* Audio & Sound Settings */}
              <AudioSoundSettings
                settings={settings}
                onPlayAudioOnStartToggle={(checked) =>
                  updateSetting('playAudioOnStart', checked)
                }
                onGameSoundsToggle={(checked) =>
                  updateSetting('enableGameSounds', checked)
                }
                onGameSoundVolumeChange={handleGameSoundVolumeChange}
                onKeystrokeSoundsToggle={(checked) =>
                  updateSetting('enableKeystrokeSounds', checked)
                }
              />

              <Separator />

              {/* Behavior & Display Settings */}
              <BehaviorDisplaySettings
                settings={settings}
                onAutoSubmitToggle={(checked) =>
                  updateSetting('autoSubmitAfterCorrect', checked)
                }
                onDefinitionImagesToggle={(checked) =>
                  updateSetting('showDefinitionImages', checked)
                }
                onProgressBarToggle={(checked) =>
                  updateSetting('showProgressBar', checked)
                }
              />

              {/* Settings Summary */}
              <SettingsSummary settings={settings} />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
