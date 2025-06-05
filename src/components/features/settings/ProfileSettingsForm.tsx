'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '@/core/domains/user/utils/settings-constants';
import { useUserProfileUpdate } from '@/core/shared/hooks/useUserProfileUpdate';

interface ProfileSettingsFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    baseLanguageCode: string;
    targetLanguageCode: string;
    profilePictureUrl?: string | null;
  };
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { state, formAction, isPending } = useUserProfileUpdate();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const currentProfilePicture = previewUrl || user.profilePictureUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentProfilePicture || undefined} />
                <AvatarFallback className="text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={triggerFileSelect}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Click the camera icon to change your profile picture
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 2MB. Supported formats: JPG, PNG, WebP
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              name="profilePicture"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
            {state.errors?.profilePicture && (
              <p className="text-sm text-destructive">
                {state.errors.profilePicture[0]}
              </p>
            )}
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={user.name}
                placeholder="Enter your full name"
                className={state.errors?.name ? 'border-destructive' : ''}
              />
              {state.errors?.name && (
                <p className="text-sm text-destructive">
                  {state.errors.name[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="Enter your email address"
                className={state.errors?.email ? 'border-destructive' : ''}
              />
              {state.errors?.email && (
                <p className="text-sm text-destructive">
                  {state.errors.email[0]}
                </p>
              )}
            </div>
          </div>

          {/* Language Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseLanguageCode">Native Language</Label>
              <Select
                name="baseLanguageCode"
                defaultValue={user.baseLanguageCode}
              >
                <SelectTrigger
                  className={
                    state.errors?.baseLanguageCode ? 'border-destructive' : ''
                  }
                >
                  <SelectValue placeholder="Select your native language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({language.nativeName})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.baseLanguageCode && (
                <p className="text-sm text-destructive">
                  {state.errors.baseLanguageCode[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLanguageCode">Learning Language</Label>
              <Select
                name="targetLanguageCode"
                defaultValue={user.targetLanguageCode}
              >
                <SelectTrigger
                  className={
                    state.errors?.targetLanguageCode ? 'border-destructive' : ''
                  }
                >
                  <SelectValue placeholder="Select language to learn" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({language.nativeName})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.targetLanguageCode && (
                <p className="text-sm text-destructive">
                  {state.errors.targetLanguageCode[0]}
                </p>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {state.message && (
            <Alert
              className={
                state.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-destructive bg-destructive/10'
              }
            >
              {state.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription
                className={
                  state.success ? 'text-green-800' : 'text-destructive'
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
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
