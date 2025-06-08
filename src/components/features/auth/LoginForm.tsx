'use client';

import { authenticate, StateAuth } from '@/core/lib/actions/authActions';
import { useActionState } from 'react';
import { useAppDispatch } from '@/core/lib/redux/store';
import { useEffect, useCallback, memo } from 'react';
import { setUser } from '@/core/lib/redux/features/authSlice';
import { UserBasicData } from '@/core/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

/**
 * LoginForm component provides user authentication functionality
 *
 * Handles user login with email/password credentials, form validation,
 * error display, and redirects to dashboard upon successful authentication.
 * Integrates with Redux for global user state management.
 *
 * @returns {JSX.Element} The login form component
 */
function LoginForm() {
  const initialState: StateAuth = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(
    authenticate,
    initialState,
  );
  const dispatch = useAppDispatch();
  const router = useRouter();

  /**
   * Handles successful user authentication
   * Updates Redux store and navigates to dashboard
   */
  const handleAuthSuccess = useCallback(
    (user: UserBasicData) => {
      dispatch(setUser(user));
      router.push('/dashboard');
    },
    [dispatch, router],
  );

  useEffect(() => {
    if (state?.user) {
      const userBasicData: UserBasicData = {
        id: state.user.id,
        name: state.user.name,
        email: state.user.email,
        role: state.user.role,
        status: state.user.status,
        baseLanguageCode: state.user.baseLanguageCode,
        targetLanguageCode: state.user.targetLanguageCode,
        profilePictureUrl: state.user.profilePictureUrl,
      };

      handleAuthSuccess(userBasicData);
    }
  }, [state, handleAuthSuccess]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.message && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              disabled={isPending}
              className={state?.errors?.email ? 'border-destructive' : ''}
              aria-describedby={
                state?.errors?.email ? 'email-error' : undefined
              }
              aria-invalid={!!state?.errors?.email}
              autoComplete="email"
              required
            />
            {state?.errors?.email && (
              <p
                id="email-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              disabled={isPending}
              className={state?.errors?.password ? 'border-destructive' : ''}
              aria-describedby={
                state?.errors?.password ? 'password-error' : undefined
              }
              aria-invalid={!!state?.errors?.password}
              autoComplete="current-password"
              required
            />
            {state?.errors?.password && (
              <p
                id="password-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            aria-describedby={isPending ? 'login-loading' : undefined}
          >
            {isPending ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                <span id="login-loading">Loading</span>
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(LoginForm);
