import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Target, Settings, AlertTriangle } from 'lucide-react';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';
import {
  ProfileSettingsForm,
  LearningSettingsForm,
  AppSettingsForm,
  DangerZoneForm,
} from '@/components/features/settings';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

// Loading skeleton component
function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 ml-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings content component
async function SettingsContent() {
  try {
    const { user, settings, appSettings } = await getUserSettings();

    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings, learning preferences, and application
            configuration.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Learning
            </TabsTrigger>
            <TabsTrigger value="app" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              App
            </TabsTrigger>
            <TabsTrigger
              value="danger"
              className="flex items-center gap-2 text-destructive data-[state=active]:text-destructive"
            >
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettingsForm
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                baseLanguageCode: user.baseLanguageCode,
                targetLanguageCode: user.targetLanguageCode,
                profilePictureUrl: user.profilePictureUrl,
              }}
            />
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <LearningSettingsForm
              settings={
                settings
                  ? {
                      dailyGoal: settings.dailyGoal,
                      notificationsEnabled: settings.notificationsEnabled,
                      soundEnabled: settings.soundEnabled,
                      autoPlayAudio: settings.autoPlayAudio,
                      darkMode: settings.darkMode,
                      sessionDuration: settings.sessionDuration,
                      reviewInterval: settings.reviewInterval,
                      difficultyPreference: settings.difficultyPreference,
                      learningReminders: settings.learningReminders as Record<
                        string,
                        unknown
                      >,
                    }
                  : null
              }
            />
          </TabsContent>

          <TabsContent value="app" className="space-y-6">
            <AppSettingsForm
              appSettings={
                appSettings as {
                  theme?: 'light' | 'dark' | 'system';
                  language?: string;
                  notifications?: boolean;
                  autoSave?: boolean;
                }
              }
            />
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <DangerZoneForm />
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Error loading settings:', error);
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-destructive">
            Error loading settings. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
