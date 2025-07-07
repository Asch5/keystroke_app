'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Clock } from 'lucide-react';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';

interface VocabularyTimeSettingsProps {
  settings: VocabularyPracticeSettings;
  onTimeLimitToggle: (checked: boolean) => void;
  onTimeLimitChange: (value: number[]) => void;
}

/**
 * Component for vocabulary practice time settings
 */
export function VocabularyTimeSettings({
  settings,
  onTimeLimitToggle,
  onTimeLimitChange,
}: VocabularyTimeSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        Time Settings
      </div>

      {/* Enable Time Limit */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="time-limit" className="text-sm font-medium">
            Enable time limit per word
          </Label>
          <p className="text-xs text-muted-foreground">
            Set a time limit for each word/exercise
          </p>
        </div>
        <Switch
          id="time-limit"
          checked={settings.enableTimeLimit}
          onCheckedChange={onTimeLimitToggle}
        />
      </div>

      {/* Time Limit Slider */}
      {settings.enableTimeLimit && (
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label className="text-sm font-medium">
              Time limit: {settings.timeLimitSeconds} seconds
            </Label>
            <p className="text-xs text-muted-foreground">
              Maximum time allowed for each exercise
            </p>
          </div>
          <div className="w-32">
            <Slider
              value={[settings.timeLimitSeconds]}
              onValueChange={onTimeLimitChange}
              min={10}
              max={120}
              step={5}
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
