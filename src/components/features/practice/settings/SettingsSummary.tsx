'use client';

import type { TypingPracticeSettings } from '@/core/state/features/settingsSlice';

interface SettingsSummaryProps {
  settings: TypingPracticeSettings;
}

/**
 * Component for displaying a summary of current settings
 */
export function SettingsSummary({ settings }: SettingsSummaryProps) {
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
    <div className="pt-4 border-t">
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <span className="font-medium">Current settings:</span>
        </p>
        <p>• Words per session: {settings.wordsCount}</p>
        <p>• Difficulty: {getDifficultyLabel(settings.difficultyLevel)}</p>
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
          • Images: {settings.showDefinitionImages ? 'Enabled' : 'Disabled'}
        </p>
        <p>
          • Auto-audio: {settings.playAudioOnStart ? 'Enabled' : 'Disabled'}
        </p>
        <p>
          • Game sounds:{' '}
          {settings.enableGameSounds
            ? `${Math.round(settings.gameSoundVolume * 100)}%`
            : 'Disabled'}
        </p>
      </div>
    </div>
  );
}
