'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Clock } from 'lucide-react';
import type { TypingPracticeSettings } from '../hooks';

interface TimeSettingsProps {
  settings: TypingPracticeSettings;
  onTimeLimitToggle: (checked: boolean) => void;
  onTimeLimitChange: (value: number[]) => void;
}

/**
 * Component for time settings (time limit toggle and slider)
 */
export function TimeSettings({
  settings,
  onTimeLimitToggle,
  onTimeLimitChange,
}: TimeSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        Time Settings
      </div>

      {/* Enable Time Limit */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="enable-time-limit" className="text-sm font-medium">
            Enable time limit per word
          </Label>
          <p className="text-xs text-muted-foreground">
            Set a time limit for typing each word
          </p>
        </div>
        <Switch
          id="enable-time-limit"
          checked={settings.enableTimeLimit}
          onCheckedChange={onTimeLimitToggle}
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
            onValueChange={onTimeLimitChange}
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
  );
}
