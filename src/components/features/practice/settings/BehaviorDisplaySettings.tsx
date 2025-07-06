'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, BarChart3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { TypingPracticeSettings } from '../hooks';

interface BehaviorDisplaySettingsProps {
  settings: TypingPracticeSettings;
  onAutoSubmitToggle: (checked: boolean) => void;
  onDefinitionImagesToggle: (checked: boolean) => void;
  onProgressBarToggle: (checked: boolean) => void;
}

/**
 * Component for behavior and display settings
 */
export function BehaviorDisplaySettings({
  settings,
  onAutoSubmitToggle,
  onDefinitionImagesToggle,
  onProgressBarToggle,
}: BehaviorDisplaySettingsProps) {
  return (
    <div className="space-y-6">
      {/* Behavior Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Settings className="h-4 w-4" />
          Behavior Settings
        </div>

        {/* Auto-submit setting */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="auto-submit" className="text-sm font-medium">
              Auto-submit after correct answer
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically move to the next word when you type the correct
              answer
            </p>
          </div>
          <Switch
            id="auto-submit"
            checked={settings.autoSubmitAfterCorrect}
            onCheckedChange={onAutoSubmitToggle}
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
            <Label htmlFor="show-images" className="text-sm font-medium">
              Show definition images
            </Label>
            <p className="text-xs text-muted-foreground">
              Display images alongside definitions when available
            </p>
          </div>
          <Switch
            id="show-images"
            checked={settings.showDefinitionImages}
            onCheckedChange={onDefinitionImagesToggle}
          />
        </div>

        {/* Show Progress Bar */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="show-progress" className="text-sm font-medium">
              Show progress bar
            </Label>
            <p className="text-xs text-muted-foreground">
              Display session progress indicator
            </p>
          </div>
          <Switch
            id="show-progress"
            checked={settings.showProgressBar}
            onCheckedChange={onProgressBarToggle}
          />
        </div>
      </div>
    </div>
  );
}
