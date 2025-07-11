'use client';

import {
  Brain,
  Target,
  Puzzle,
  Keyboard,
  Volume2,
  CheckCircle,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';

interface ExerciseTypeSettingsProps {
  settings: VocabularyPracticeSettings;
  onExerciseTypeToggle: (
    exerciseType: keyof VocabularyPracticeSettings,
    enabled: boolean,
  ) => void;
  onMakeUpWordMaxAttemptsChange: (attempts: number[]) => void;
  onMakeUpWordTimeLimitChange?: (timeLimit: number[]) => void;
  onMakeUpWordAdditionalCharactersChange?: (characters: number[]) => void;
}

/**
 * Component for controlling which exercise types are included in vocabulary practice
 */
export function ExerciseTypeSettings({
  settings,
  onExerciseTypeToggle,
  onMakeUpWordMaxAttemptsChange,
  onMakeUpWordTimeLimitChange,
  onMakeUpWordAdditionalCharactersChange,
}: ExerciseTypeSettingsProps) {
  // Defensive checks to prevent undefined access errors during loading
  if (typeof settings?.enableRememberTranslation === 'undefined') {
    return null;
  }

  // Exercise type configurations
  const exerciseTypes = [
    {
      key: 'enableRememberTranslation' as keyof VocabularyPracticeSettings,
      title: 'Remember Translation',
      description: 'Simple recognition exercise showing word and translation',
      icon: <Brain className="h-4 w-4" />,
      difficulty: 1,
      enabled: settings.enableRememberTranslation ?? true,
      color: 'bg-practice-flashcard-subtle text-practice-flashcard-foreground',
    },
    {
      key: 'enableChooseRightWord' as keyof VocabularyPracticeSettings,
      title: 'Choose Right Word',
      description: 'Multiple choice exercise with 4 options',
      icon: <Target className="h-4 w-4" />,
      difficulty: 2,
      enabled: settings.enableChooseRightWord ?? true,
      color: 'bg-practice-typing-subtle text-practice-typing-foreground',
    },
    {
      key: 'enableMakeUpWord' as keyof VocabularyPracticeSettings,
      title: 'Make Up Word',
      description: 'Drag and drop letters to form the correct word',
      icon: <Puzzle className="h-4 w-4" />,
      difficulty: 3,
      enabled: settings.enableMakeUpWord ?? true,
      color:
        'bg-practice-multiple-choice-subtle text-practice-multiple-choice-foreground',
      hasSettings: true,
    },
    {
      key: 'enableWriteByDefinition' as keyof VocabularyPracticeSettings,
      title: 'Write by Definition',
      description: 'Type the word based on its definition',
      icon: <Keyboard className="h-4 w-4" />,
      difficulty: 4,
      enabled: settings.enableWriteByDefinition ?? true,
      color: 'bg-practice-audio-subtle text-practice-audio-foreground',
    },
    {
      key: 'enableWriteBySound' as keyof VocabularyPracticeSettings,
      title: 'Write by Sound',
      description: 'Type the word based on its pronunciation',
      icon: <Volume2 className="h-4 w-4" />,
      difficulty: 5,
      enabled: settings.enableWriteBySound ?? true,
      color: 'bg-error-subtle text-error-foreground',
    },
  ];

  const enabledCount = exerciseTypes.filter((type) => type.enabled).length;
  const allDisabled = enabledCount === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        Exercise Types
      </div>

      {/* Warning for no enabled exercises */}
      {allDisabled && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            At least one exercise type must be enabled to start practice.
          </AlertDescription>
        </Alert>
      )}

      {/* Exercise Types Grid */}
      <div className="grid gap-3">
        {exerciseTypes.map((exerciseType) => (
          <Card
            key={exerciseType.key}
            className={`transition-all ${
              exerciseType.enabled
                ? 'border-primary shadow-sm'
                : 'border-muted-foreground/20 opacity-60'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${exerciseType.color}`}>
                    {exerciseType.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {exerciseType.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {exerciseType.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Level {exerciseType.difficulty}
                  </Badge>
                  <Switch
                    checked={exerciseType.enabled}
                    onCheckedChange={(checked) =>
                      onExerciseTypeToggle(exerciseType.key, checked)
                    }
                  />
                </div>
              </div>
            </CardHeader>

            {/* Make Up Word specific settings */}
            {exerciseType.key === 'enableMakeUpWord' &&
              exerciseType.enabled && (
                <CardContent className="pt-0">
                  <Separator className="mb-3" />

                  {/* Maximum Attempts */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">
                        Maximum Attempts
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        How many attempts before showing the answer
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onMakeUpWordMaxAttemptsChange([
                            Math.max(
                              1,
                              (settings.makeUpWordMaxAttempts ?? 3) - 1,
                            ),
                          ])
                        }
                        disabled={(settings.makeUpWordMaxAttempts ?? 3) <= 1}
                        className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {settings.makeUpWordMaxAttempts ?? 3}
                      </span>
                      <button
                        onClick={() =>
                          onMakeUpWordMaxAttemptsChange([
                            Math.min(
                              6,
                              (settings.makeUpWordMaxAttempts ?? 3) + 1,
                            ),
                          ])
                        }
                        disabled={(settings.makeUpWordMaxAttempts ?? 3) >= 6}
                        className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Time Limit */}
                  {onMakeUpWordTimeLimitChange && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          Time Limit (seconds)
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum time per word (0 = no limit)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onMakeUpWordTimeLimitChange([
                              Math.max(0, settings.makeUpWordTimeLimit - 5),
                            ])
                          }
                          disabled={settings.makeUpWordTimeLimit <= 0}
                          className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-sm font-medium">
                          {settings.makeUpWordTimeLimit === 0
                            ? '∞'
                            : settings.makeUpWordTimeLimit}
                        </span>
                        <button
                          onClick={() =>
                            onMakeUpWordTimeLimitChange([
                              Math.min(120, settings.makeUpWordTimeLimit + 5),
                            ])
                          }
                          disabled={settings.makeUpWordTimeLimit >= 120}
                          className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Additional Characters */}
                  {onMakeUpWordAdditionalCharactersChange && (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          Additional Characters
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Extra random characters in the pool (0 = exact match)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onMakeUpWordAdditionalCharactersChange([
                              Math.max(
                                0,
                                settings.makeUpWordAdditionalCharacters - 1,
                              ),
                            ])
                          }
                          disabled={
                            settings.makeUpWordAdditionalCharacters <= 0
                          }
                          className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {settings.makeUpWordAdditionalCharacters}
                        </span>
                        <button
                          onClick={() =>
                            onMakeUpWordAdditionalCharactersChange([
                              Math.min(
                                10,
                                settings.makeUpWordAdditionalCharacters + 1,
                              ),
                            ])
                          }
                          disabled={
                            settings.makeUpWordAdditionalCharacters >= 10
                          }
                          className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4" />
        <span>
          {enabledCount} of {exerciseTypes.length} exercise types enabled
        </span>
      </div>

      {/* Exercise Flow Information */}
      <Card className="bg-muted/50 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            How Exercise Selection Works
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              • <strong>New words:</strong> Start with Word Card, then progress
              through enabled exercises
            </p>
            <p>
              • <strong>Familiar words:</strong> Skip to appropriate exercise
              based on learning progress
            </p>
            <p>
              • <strong>Adaptive difficulty:</strong> Exercise selection adapts
              to your performance
            </p>
            <p>
              • <strong>Smart progression:</strong> Easier exercises lead to
              harder ones naturally
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
