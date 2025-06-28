'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  RotateCcw,
  Target,
  Clock,
  BarChart3,
  Volume2,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { useTypingPracticeSettings } from './hooks/useTypingPracticeSettings';
import { cn } from '@/core/shared/utils/common/cn';

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

  const getDifficultyLabel = (level: number): string => {
    const labels: Record<number, string> = {
      1: 'Beginner',
      2: 'Elementary',
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert',
    };
    return labels[level] || 'Intermediate';
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Target className="h-4 w-4" />
                  Session Configuration
                </div>

                {/* Words Count */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="words-count"
                      className="text-sm font-medium"
                    >
                      Number of words to practice
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      How many words you want to practice in each session
                    </p>
                  </div>
                  <div className="w-24">
                    <Select
                      value={settings.wordsCount.toString()}
                      onValueChange={handleWordsCountChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="75">75</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Difficulty Level */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="difficulty-level"
                      className="text-sm font-medium"
                    >
                      Difficulty level
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Preferred difficulty level for word selection
                    </p>
                  </div>
                  <div className="w-32">
                    <Select
                      value={settings.difficultyLevel.toString()}
                      onValueChange={handleDifficultyChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Beginner</SelectItem>
                        <SelectItem value="2">2 - Elementary</SelectItem>
                        <SelectItem value="3">3 - Intermediate</SelectItem>
                        <SelectItem value="4">4 - Advanced</SelectItem>
                        <SelectItem value="5">5 - Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Time Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Time Settings
                </div>

                {/* Enable Time Limit */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="enable-time-limit"
                      className="text-sm font-medium"
                    >
                      Enable time limit per word
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Set a time limit for typing each word
                    </p>
                  </div>
                  <Switch
                    id="enable-time-limit"
                    checked={settings.enableTimeLimit}
                    onCheckedChange={(checked) =>
                      updateSetting('enableTimeLimit', checked)
                    }
                  />
                </div>

                {/* Time Limit Slider */}
                {settings.enableTimeLimit && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        Time limit: {settings.timeLimitSeconds}s
                      </Label>
                    </div>
                    <Slider
                      value={[settings.timeLimitSeconds]}
                      onValueChange={handleTimeLimitChange}
                      max={180}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10s</span>
                      <span>180s</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Audio & Sound Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Volume2 className="h-4 w-4" />
                  Audio & Sound Settings
                </div>

                {/* Play Audio on Start */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="play-audio-start"
                      className="text-sm font-medium"
                    >
                      Play audio when word appears
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically play pronunciation when a new word is shown
                    </p>
                  </div>
                  <Switch
                    id="play-audio-start"
                    checked={settings.playAudioOnStart}
                    onCheckedChange={(checked) =>
                      updateSetting('playAudioOnStart', checked)
                    }
                  />
                </div>

                {/* Enable Game Sounds */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="enable-game-sounds"
                      className="text-sm font-medium"
                    >
                      Enable game feedback sounds
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Play sounds for correct/incorrect typing feedback
                    </p>
                  </div>
                  <Switch
                    id="enable-game-sounds"
                    checked={settings.enableGameSounds}
                    onCheckedChange={(checked) =>
                      updateSetting('enableGameSounds', checked)
                    }
                  />
                </div>

                {/* Game Sound Volume */}
                {settings.enableGameSounds && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        Feedback volume:{' '}
                        {Math.round(settings.gameSoundVolume * 100)}%
                      </Label>
                    </div>
                    <Slider
                      value={[settings.gameSoundVolume * 100]}
                      onValueChange={handleGameSoundVolumeChange}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* Enable Keystroke Sounds */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="enable-keystroke-sounds"
                      className="text-sm font-medium"
                    >
                      Enable keystroke sounds
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Play a subtle sound for each character typed
                    </p>
                  </div>
                  <Switch
                    id="enable-keystroke-sounds"
                    checked={settings.enableKeystrokeSounds}
                    onCheckedChange={(checked) =>
                      updateSetting('enableKeystrokeSounds', checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Behavior Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  Behavior Settings
                </div>

                {/* Auto-submit setting */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="auto-submit"
                      className="text-sm font-medium"
                    >
                      Auto-submit after correct answer
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically move to the next word when you type the
                      correct answer
                    </p>
                  </div>
                  <Switch
                    id="auto-submit"
                    checked={settings.autoSubmitAfterCorrect}
                    onCheckedChange={(checked) =>
                      updateSetting('autoSubmitAfterCorrect', checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Display Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Display Settings
                </div>

                {/* Definition images setting */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="show-images"
                      className="text-sm font-medium"
                    >
                      Show definition images
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Display images alongside definitions when available
                    </p>
                  </div>
                  <Switch
                    id="show-images"
                    checked={settings.showDefinitionImages}
                    onCheckedChange={(checked) =>
                      updateSetting('showDefinitionImages', checked)
                    }
                  />
                </div>

                {/* Show Progress Bar */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="show-progress"
                      className="text-sm font-medium"
                    >
                      Show progress bar
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Display session progress indicator
                    </p>
                  </div>
                  <Switch
                    id="show-progress"
                    checked={settings.showProgressBar}
                    onCheckedChange={(checked) =>
                      updateSetting('showProgressBar', checked)
                    }
                  />
                </div>
              </div>

              {/* Settings summary */}
              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Current settings:</span>
                  </p>
                  <p>• Words per session: {settings.wordsCount}</p>
                  <p>
                    • Difficulty: {getDifficultyLabel(settings.difficultyLevel)}
                  </p>
                  <p>
                    • Time limit:{' '}
                    {settings.enableTimeLimit
                      ? `${settings.timeLimitSeconds}s`
                      : 'Disabled'}
                  </p>
                  <p>
                    • Auto-submit:{' '}
                    {settings.autoSubmitAfterCorrect ? 'Enabled' : 'Disabled'}
                  </p>
                  <p>
                    • Images:{' '}
                    {settings.showDefinitionImages ? 'Enabled' : 'Disabled'}
                  </p>
                  <p>
                    • Auto-audio:{' '}
                    {settings.playAudioOnStart ? 'Enabled' : 'Disabled'}
                  </p>
                  <p>
                    • Game sounds:{' '}
                    {settings.enableGameSounds
                      ? `${Math.round(settings.gameSoundVolume * 100)}%`
                      : 'Disabled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
