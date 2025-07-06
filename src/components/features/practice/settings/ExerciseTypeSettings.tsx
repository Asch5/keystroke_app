'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import type { VocabularyPracticeSettings } from '../hooks/useVocabularyPracticeSettings';

interface ExerciseTypeSettingsProps {
  settings: VocabularyPracticeSettings;
  onExerciseTypeToggle: (
    exerciseType: keyof VocabularyPracticeSettings,
    enabled: boolean,
  ) => void;
  onMakeUpWordMaxAttemptsChange: (attempts: number[]) => void;
}

/**
 * Component for controlling which exercise types are included in vocabulary practice
 */
export function ExerciseTypeSettings({
  settings,
  onExerciseTypeToggle,
  onMakeUpWordMaxAttemptsChange,
}: ExerciseTypeSettingsProps) {
  // Exercise type configurations
  const exerciseTypes = [
    {
      key: 'enableRememberTranslation' as keyof VocabularyPracticeSettings,
      title: 'Remember Translation',
      description: 'Simple recognition exercise showing word and translation',
      icon: <Brain className="h-4 w-4" />,
      difficulty: 1,
      enabled: settings.enableRememberTranslation,
      color:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    {
      key: 'enableChooseRightWord' as keyof VocabularyPracticeSettings,
      title: 'Choose Right Word',
      description: 'Multiple choice exercise with 4 options',
      icon: <Target className="h-4 w-4" />,
      difficulty: 2,
      enabled: settings.enableChooseRightWord,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    {
      key: 'enableMakeUpWord' as keyof VocabularyPracticeSettings,
      title: 'Make Up Word',
      description: 'Drag and drop letters to form the correct word',
      icon: <Puzzle className="h-4 w-4" />,
      difficulty: 3,
      enabled: settings.enableMakeUpWord,
      color:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      hasSettings: true,
    },
    {
      key: 'enableWriteByDefinition' as keyof VocabularyPracticeSettings,
      title: 'Write by Definition',
      description: 'Type the word based on its definition',
      icon: <Keyboard className="h-4 w-4" />,
      difficulty: 4,
      enabled: settings.enableWriteByDefinition,
      color:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    },
    {
      key: 'enableWriteBySound' as keyof VocabularyPracticeSettings,
      title: 'Write by Sound',
      description: 'Type the word based on its pronunciation',
      icon: <Volume2 className="h-4 w-4" />,
      difficulty: 5,
      enabled: settings.enableWriteBySound,
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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
                  <div className="flex items-center justify-between">
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
                            Math.max(1, settings.makeUpWordMaxAttempts - 1),
                          ])
                        }
                        disabled={settings.makeUpWordMaxAttempts <= 1}
                        className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {settings.makeUpWordMaxAttempts}
                      </span>
                      <button
                        onClick={() =>
                          onMakeUpWordMaxAttemptsChange([
                            Math.min(6, settings.makeUpWordMaxAttempts + 1),
                          ])
                        }
                        disabled={settings.makeUpWordMaxAttempts >= 6}
                        className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
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
