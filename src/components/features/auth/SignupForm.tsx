'use client';

import { Loader2 } from 'lucide-react';
import { useActionState, memo, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { signUp, StateSignup } from '@/core/lib/actions/authActions';
import { LANGUAGE_MAP_ARRAY } from '@/core/types/language-constants';

/**
 * SignupForm component provides user registration functionality
 *
 * Handles user registration with email/password credentials, language selection,
 * form validation, error display, and redirects to login upon successful registration.
 * Includes native and target language selection for personalized learning experience.
 *
 * @returns {JSX.Element} The registration form component
 */
function SignupForm() {
  const initialState: StateSignup = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  /**
   * Get available languages for selection
   * Memoized to prevent unnecessary recalculation
   */
  const languages = useCallback(() => LANGUAGE_MAP_ARRAY, []);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Register</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          {state.message && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Your email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              disabled={isPending}
              className={state.errors?.email ? 'border-destructive' : ''}
              aria-describedby={state.errors?.email ? 'email-error' : undefined}
              aria-invalid={!!state.errors?.email}
              autoComplete="email"
              required
            />
            {state.errors?.email && (
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

          <div className="grid md:grid-cols-2 md:gap-6 space-y-2 md:space-y-0">
            <div className="space-y-2">
              <Label htmlFor="baseLanguage">Native Language</Label>
              <Select
                name="baseLanguageId"
                defaultValue=""
                disabled={isPending}
                required
              >
                <SelectTrigger
                  id="baseLanguage"
                  aria-describedby={
                    state.errors?.baseLanguageId
                      ? 'base-language-error'
                      : undefined
                  }
                  aria-invalid={!!state.errors?.baseLanguageId}
                >
                  <SelectValue placeholder="Select your native language" />
                </SelectTrigger>
                <SelectContent>
                  {languages().map((lang) => (
                    <SelectItem
                      key={`base-${lang.id}`}
                      value={lang.id.toString()}
                    >
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.baseLanguageId && (
                <p
                  id="base-language-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {state.errors.baseLanguageId[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLanguage">Language to Learn</Label>
              <Select
                name="targetLanguageId"
                defaultValue=""
                disabled={isPending}
                required
              >
                <SelectTrigger
                  id="targetLanguage"
                  aria-describedby={
                    state.errors?.targetLanguageId
                      ? 'target-language-error'
                      : undefined
                  }
                  aria-invalid={!!state.errors?.targetLanguageId}
                >
                  <SelectValue placeholder="Select language to learn" />
                </SelectTrigger>
                <SelectContent>
                  {languages().map((lang) => (
                    <SelectItem
                      key={`target-${lang.id}`}
                      value={lang.id.toString()}
                    >
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.targetLanguageId && (
                <p
                  id="target-language-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {state.errors.targetLanguageId[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter minimum 8 characters"
              disabled={isPending}
              className={state.errors?.password ? 'border-destructive' : ''}
              aria-describedby={
                state.errors?.password ? 'password-error' : undefined
              }
              aria-invalid={!!state.errors?.password}
              autoComplete="new-password"
              required
            />
            {state.errors?.password && (
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

          <div className="space-y-2">
            <Label htmlFor="repeatPassword">Repeat password</Label>
            <Input
              id="repeatPassword"
              name="repeatPassword"
              type="password"
              placeholder="Confirm your password"
              disabled={isPending}
              className={
                state.errors?.repeatPassword ? 'border-destructive' : ''
              }
              aria-describedby={
                state.errors?.repeatPassword
                  ? 'repeat-password-error'
                  : undefined
              }
              aria-invalid={!!state.errors?.repeatPassword}
              autoComplete="new-password"
              required
            />
            {state.errors?.repeatPassword && (
              <p
                id="repeat-password-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {state.errors.repeatPassword[0]}
              </p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <Input
              type="checkbox"
              id="terms"
              name="terms"
              className="w-4 h-4"
              disabled={isPending}
              aria-describedby="terms-label"
              required
            />
            <Label id="terms-label" htmlFor="terms" className="text-sm">
              I agree with the terms and conditions
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            aria-describedby={isPending ? 'signup-loading' : undefined}
          >
            {isPending ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                <span id="signup-loading">Registering...</span>
              </>
            ) : (
              'Register new account'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(SignupForm);
