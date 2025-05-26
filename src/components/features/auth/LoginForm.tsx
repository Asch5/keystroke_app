'use client';

import { authenticate, StateAuth } from '@/core/lib/actions/authActions';
import { useActionState } from 'react';
import { useAppDispatch } from '@/core/lib/redux/store';
import { useEffect } from 'react';
import { setUser } from '@/core/lib/redux/features/authSlice';
import { UserBasicData } from '@/core/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginForm() {
  const initialState: StateAuth = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(
    authenticate,
    initialState,
  );
  const dispatch = useAppDispatch();

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

      dispatch(setUser(userBasicData));
      //Hard redirect to dashboard to avoid any issues with the router
      window.location.href = '/dashboard';
    }
  }, [state, dispatch]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.message && (
            <Alert variant="destructive">
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
            />
            {state?.errors?.email && (
              <p className="text-sm text-destructive">
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
            />
            {state?.errors?.password && (
              <p className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
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
