'use client';

import { signUp, StateSignup } from '@/lib/actions/authActions';
import { LANGUAGE_MAP_ARRAY } from '@/types/dictionary';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// JSDoc comment for the component
/**
 * SignupForm component handles user registration with form state management.
 * It uses shadcn/ui for styled and accessible form elements.
 */
export default function SignupForm() {
  const initialState: StateSignup = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const languages = LANGUAGE_MAP_ARRAY;

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Register</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          {state.message && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Your email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@flowbite.com"
              disabled={isPending}
              className={state.errors?.email ? 'border-destructive' : ''}
            />
            {state.errors?.email && (
              <p className="text-sm text-destructive">
                {state.errors.email[0]}
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 md:gap-6 space-y-2 md:space-y-0">
            <div className="space-y-2">
              <Label htmlFor="baseLanguage">Native Language</Label>
              <Select name="baseLanguageId" defaultValue="">
                <SelectTrigger id="baseLanguage">
                  <SelectValue placeholder="Select your native language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
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
                <p className="text-sm text-destructive">
                  {state.errors.baseLanguageId[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetLanguage">Language to Learn</Label>
              <Select name="targetLanguageId" defaultValue="">
                <SelectTrigger id="targetLanguage">
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
              {state.errors?.targetLanguageId && (
                <p className="text-sm text-destructive">
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repeatPassword">Repeat password</Label>
            <Input
              id="repeatPassword"
              name="repeatPassword"
              type="password"
              disabled={isPending}
              className={
                state.errors?.repeatPassword ? 'border-destructive' : ''
              }
            />
          </div>
          <div className="flex items-start space-x-2">
            <Input
              type="checkbox"
              id="terms"
              name="terms"
              className="w-4 h-4"
            />
            <Label htmlFor="terms" className="text-sm">
              I agree with the terms and conditions
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
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
