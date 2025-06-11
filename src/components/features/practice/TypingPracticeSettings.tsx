'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw } from 'lucide-react';
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
 * Provides options for auto-submit, definition images, and other preferences
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
              {/* Auto-submit setting */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="auto-submit" className="text-sm font-medium">
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
                  onCheckedChange={(checked) =>
                    updateSetting('showDefinitionImages', checked)
                  }
                />
              </div>

              {/* Settings summary */}
              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Current settings:</span>
                  </p>
                  <p>
                    • Auto-submit:{' '}
                    {settings.autoSubmitAfterCorrect ? 'Enabled' : 'Disabled'}
                  </p>
                  <p>
                    • Definition images:{' '}
                    {settings.showDefinitionImages ? 'Enabled' : 'Disabled'}
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
