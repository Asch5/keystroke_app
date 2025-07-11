'use client';

import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Target,
  Clock,
  Bell,
  Volume2,
} from 'lucide-react';
import { useActionState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { updateUserLearningSettings } from '@/core/domains/user/actions/user-settings-actions';
import type { UserSettingsState } from '@/core/domains/user/types/user-settings';
import {
  DIFFICULTY_OPTIONS,
  SESSION_DURATION_OPTIONS,
  REVIEW_INTERVAL_OPTIONS,
  DAILY_GOAL_OPTIONS,
} from '@/core/domains/user/utils/settings-constants';

interface LearningSettingsFormProps {
  settings: {
    dailyGoal: number;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    autoPlayAudio: boolean;
    darkMode: boolean;
    sessionDuration: number;
    reviewInterval: number;
    difficultyPreference: number;
    learningReminders: Record<string, unknown>;
  } | null;
}

export function LearningSettingsForm({ settings }: LearningSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateUserLearningSettings,
    {
      errors: {},
      message: null,
      success: false,
    } as UserSettingsState,
  );

  // Default values if settings don't exist
  const defaultSettings = {
    dailyGoal: 5,
    notificationsEnabled: true,
    soundEnabled: true,
    autoPlayAudio: true,
    darkMode: false,
    sessionDuration: 15,
    reviewInterval: 3,
    difficultyPreference: 1,
    learningReminders: {},
  };

  const currentSettings = settings || defaultSettings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Learning Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Learning Goals Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <h3 className="text-lg font-medium">Learning Goals</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily Learning Goal</Label>
                <Select
                  name="dailyGoal"
                  defaultValue={currentSettings.dailyGoal.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select daily goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAILY_GOAL_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.dailyGoal && (
                  <p className="text-sm text-destructive">
                    {state.errors.dailyGoal[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficultyPreference">
                  Difficulty Preference
                </Label>
                <Select
                  name="difficultyPreference"
                  defaultValue={currentSettings.difficultyPreference.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.difficultyPreference && (
                  <p className="text-sm text-destructive">
                    {state.errors.difficultyPreference[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Session Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <h3 className="text-lg font-medium">Session Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">
                  Default Session Duration
                </Label>
                <Select
                  name="sessionDuration"
                  defaultValue={currentSettings.sessionDuration.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_DURATION_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.sessionDuration && (
                  <p className="text-sm text-destructive">
                    {state.errors.sessionDuration[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewInterval">Review Interval</Label>
                <Select
                  name="reviewInterval"
                  defaultValue={currentSettings.reviewInterval.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select review interval" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_INTERVAL_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.reviewInterval && (
                  <p className="text-sm text-destructive">
                    {state.errors.reviewInterval[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Audio & Sound Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <h3 className="text-lg font-medium">Audio & Sound</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="soundEnabled">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable sound effects for interactions and feedback
                  </p>
                </div>
                <Switch
                  id="soundEnabled"
                  name="soundEnabled"
                  defaultChecked={currentSettings.soundEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPlayAudio">Auto-play Audio</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically play pronunciation audio for new words
                  </p>
                </div>
                <Switch
                  id="autoPlayAudio"
                  name="autoPlayAudio"
                  defaultChecked={currentSettings.autoPlayAudio}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <h3 className="text-lg font-medium">Notifications</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notificationsEnabled">
                    Learning Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications to help you stay on track with your
                    learning goals
                  </p>
                </div>
                <Switch
                  id="notificationsEnabled"
                  name="notificationsEnabled"
                  defaultChecked={currentSettings.notificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for reduced eye strain during learning
                  </p>
                </div>
                <Switch
                  id="darkMode"
                  name="darkMode"
                  defaultChecked={currentSettings.darkMode}
                />
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {state.message && (
            <Alert
              className={
                state.success
                  ? 'border-success-border bg-success-subtle'
                  : 'border-error-border bg-error-subtle'
              }
            >
              {state.success ? (
                <CheckCircle2 className="h-4 w-4 text-success-foreground" />
              ) : (
                <AlertCircle className="h-4 w-4 text-error-foreground" />
              )}
              <AlertDescription
                className={
                  state.success
                    ? 'text-success-foreground'
                    : 'text-error-foreground'
                }
              >
                {state.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[120px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
