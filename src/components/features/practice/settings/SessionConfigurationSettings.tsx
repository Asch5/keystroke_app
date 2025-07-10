'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Target } from 'lucide-react';
import type { TypingPracticeSettings } from '@/core/state/features/settingsSlice';

interface SessionConfigurationSettingsProps {
  settings: TypingPracticeSettings;
  onWordsCountChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
}

/**
 * Component for session configuration settings (words count and difficulty)
 */
export function SessionConfigurationSettings({
  settings,
  onWordsCountChange,
  onDifficultyChange,
}: SessionConfigurationSettingsProps) {
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
            value={settings.wordsCount.toString()}
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
            value={settings.difficultyLevel.toString()}
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
    </div>
  );
}
