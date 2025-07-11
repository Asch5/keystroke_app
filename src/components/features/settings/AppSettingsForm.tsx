'use client';

import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Palette,
  Globe,
  Settings,
} from 'lucide-react';
import { useActionState } from 'react';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
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
import { updateAppSettings } from '@/core/domains/user/actions/user-settings-actions';
import type { UserSettingsState } from '@/core/domains/user/types/user-settings';
import { THEME_OPTIONS } from '@/core/domains/user/utils/settings-constants';
import { useTranslation } from '@/core/shared/hooks/useTranslation';

interface AppSettingsFormProps {
  appSettings: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: boolean;
    autoSave?: boolean;
  };
}

export function AppSettingsForm({ appSettings }: AppSettingsFormProps) {
  const { t } = useTranslation();
  const [state, formAction, isPending] = useActionState(updateAppSettings, {
    errors: {},
    message: null,
    success: false,
  } as UserSettingsState);

  // Default values
  const defaultSettings = {
    theme: 'system' as const,
    language: 'en',
    notifications: true,
    autoSave: true,
  };

  const currentSettings = { ...defaultSettings, ...appSettings };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Application Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Appearance Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <h3 className="text-lg font-medium">Appearance</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select name="theme" defaultValue={currentSettings.theme}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
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
              {state.errors?.theme && (
                <p className="text-sm text-destructive">
                  {state.errors.theme[0]}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Localization Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <h3 className="text-lg font-medium">
                {t('settings.interfaceLanguage')}
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                {t('settings.selectInterfaceLanguage')}
              </Label>
              <LanguageSelector />
              <p className="text-sm text-muted-foreground">
                This controls the language used in the application interface
              </p>
            </div>
          </div>

          <Separator />

          {/* General Preferences Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h3 className="text-lg font-medium">General Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow the app to send browser notifications for important
                    updates
                  </p>
                </div>
                <Switch
                  id="notifications"
                  name="notifications"
                  defaultChecked={currentSettings.notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave">Auto-save Progress</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your learning progress and settings
                  </p>
                </div>
                <Switch
                  id="autoSave"
                  name="autoSave"
                  defaultChecked={currentSettings.autoSave}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Privacy & Data Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Privacy & Data</h3>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="space-y-2">
                <h4 className="font-medium">Data Collection</h4>
                <p className="text-sm text-muted-foreground">
                  We collect minimal data to improve your learning experience.
                  This includes:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Learning progress and statistics</li>
                  <li>Word preferences and difficulty levels</li>
                  <li>Usage patterns to optimize the learning algorithm</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Your personal data is encrypted and never shared with third
                  parties.
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {state.message && (
            <Alert
              className={
                state.success
                  ? 'border-success-border bg-success-subtle'
                  : 'border-destructive bg-destructive/10'
              }
            >
              {state.success ? (
                <CheckCircle2 className="h-4 w-4 text-success-foreground" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription
                className={
                  state.success ? 'text-success-foreground' : 'text-destructive'
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
