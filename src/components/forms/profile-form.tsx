'use client';

import { useEffect, useActionState, useCallback } from 'react';
import { updateUserProfile } from '@/core/lib/actions/userActions';
import { getUserByEmail } from '@/core/lib/db/user';
import { Theme } from '@/core/types/user';
import { setUser } from '@/core/lib/redux/features/authSlice';
import { useAppDispatch } from '@/core/lib/redux/store';
import { useSession } from 'next-auth/react';
import { LANGUAGE_MAP_ARRAY } from '@/core/types/dictionary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const arrTheme: Theme = ['light', 'dark'];

export default function ProfileForm() {
  const languages = LANGUAGE_MAP_ARRAY;
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  const [state, formAction, isPending] = useActionState(updateUserProfile, {
    errors: {},
    message: null,
    success: false,
  });

  const refreshUserData = useCallback(async () => {
    if (session?.user?.email) {
      try {
        const user = await getUserByEmail(session.user.email);
        if (user) {
          dispatch(
            setUser({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
              baseLanguageCode: user.baseLanguageCode,
              targetLanguageCode: user.targetLanguageCode,
              profilePictureUrl: user.profilePictureUrl,
            }),
          );
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  }, [session, dispatch]);

  useEffect(() => {
    if (state.success) {
      refreshUserData();
    }
  }, [state, refreshUserData]);

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <Alert variant={state.success ? 'default' : 'destructive'}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          disabled={isPending}
          className={state.errors?.name ? 'border-destructive' : ''}
        />
        {state.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="baseLanguageCode">Native Language</Label>
          <Select name="baseLanguageCode" defaultValue="">
            <SelectTrigger
              id="baseLanguageCode"
              className={
                state.errors?.baseLanguageCode ? 'border-destructive' : ''
              }
            >
              <SelectValue placeholder="Select your native language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={`base-${lang.id}`} value={lang.id.toString()}>
                  {lang.name}
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
          <Label htmlFor="targetLanguageCode">Language to Learn</Label>
          <Select name="targetLanguageCode" defaultValue="">
            <SelectTrigger
              id="targetLanguageCode"
              className={
                state.errors?.targetLanguageCode ? 'border-destructive' : ''
              }
            >
              <SelectValue placeholder="Select language to learn" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem
                  key={`target-${lang.id}`}
                  value={lang.id.toString()}
                >
                  {lang.name}
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

      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Select name="theme" defaultValue="">
          <SelectTrigger
            id="theme"
            className={state.errors?.theme ? 'border-destructive' : ''}
          >
            <SelectValue placeholder="Select preferred theme" />
          </SelectTrigger>
          <SelectContent>
            {arrTheme.map((theme) => (
              <SelectItem key={`theme-${theme}`} value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.theme && (
          <p className="text-sm text-destructive">{state.errors.theme[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Profile Picture</Label>
        <Input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          disabled={isPending}
          className={state.errors?.photo ? 'border-destructive' : ''}
        />
        {state.errors?.photo && (
          <p className="text-sm text-destructive">{state.errors.photo[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Profile'
        )}
      </Button>
    </form>
  );
}
