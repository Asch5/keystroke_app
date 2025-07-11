'use client';

import { Target, Clock, BookOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';

interface VocabularySessionConfigurationSettingsProps {
  settings: VocabularyPracticeSettings;
  onWordsCountChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onShowWordCardFirstToggle: (checked: boolean) => void;
  onAutoAdvanceFromWordCardToggle: (checked: boolean) => void;
  onAutoAdvanceDelayChange: (value: number[]) => void;
}

/**
 * Component for vocabulary practice session configuration settings
 */
export function VocabularySessionConfigurationSettings({
  settings,
  onWordsCountChange,
  onDifficultyChange,
  onShowWordCardFirstToggle,
  onAutoAdvanceFromWordCardToggle,
  onAutoAdvanceDelayChange,
}: VocabularySessionConfigurationSettingsProps) {
  // Defensive checks to prevent undefined access errors during loading
  if (typeof settings?.wordsCount === 'undefined') {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Target className="h-4 w-4" />
        Session Configuration
      </div>

      {/* Words Count */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="words-count" className="text-sm font-medium">
            Number of words to practice
          </Label>
          <p className="text-xs text-muted-foreground">
            How many words you want to practice in each session
          </p>
        </div>
        <div className="w-24">
          <Select
            value={(settings.wordsCount ?? 10).toString()}
            onValueChange={onWordsCountChange}
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
          <Label htmlFor="difficulty-level" className="text-sm font-medium">
            Difficulty level
          </Label>
          <p className="text-xs text-muted-foreground">
            Preferred difficulty level for word selection
          </p>
        </div>
        <div className="w-32">
          <Select
            value={(settings.difficultyLevel ?? 3).toString()}
            onValueChange={onDifficultyChange}
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

      {/* Show Word Card First */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <Label
              htmlFor="show-word-card-first"
              className="text-sm font-medium"
            >
              Show Word Card first for new words
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Display word information before starting exercises for unfamiliar
            words
          </p>
        </div>
        <Switch
          id="show-word-card-first"
          checked={settings.showWordCardFirst ?? true}
          onCheckedChange={onShowWordCardFirstToggle}
        />
      </div>

      {/* Auto Advance from Word Card */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Label htmlFor="auto-advance" className="text-sm font-medium">
              Auto-advance from Word Card
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically move to exercises after viewing word card
          </p>
        </div>
        <Switch
          id="auto-advance"
          checked={settings.autoAdvanceFromWordCard ?? false}
          onCheckedChange={onAutoAdvanceFromWordCardToggle}
        />
      </div>

      {/* Auto Advance Delay */}
      {(settings.autoAdvanceFromWordCard ?? false) && (
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label className="text-sm font-medium">
              Auto-advance delay: {settings.autoAdvanceDelaySeconds ?? 3}s
            </Label>
            <p className="text-xs text-muted-foreground">
              How long to wait before automatically advancing
            </p>
          </div>
          <div className="w-32">
            <Slider
              value={[settings.autoAdvanceDelaySeconds ?? 3]}
              onValueChange={onAutoAdvanceDelayChange}
              min={1}
              max={10}
              step={1}
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
